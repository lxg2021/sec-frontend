"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { AttackGraphNodeModel } from "@/features/attack/dgraph/model/core/attack-graph-data";
import { getAttackGraphNodePresentationKind } from "@/features/attack/dgraph/model/node/attack-graph-node-types";

import {
  deleteRemediationDraftItem,
  getOrCreateRemediationOrderBySource,
  queryEditableRemediationOrderBySource,
  queryRemediationNodeActions,
  resolveRemediationNodeAgents,
  upsertRemediationDraftItems,
} from "./api";
import type {
  RemediationActionDecision,
  RemediationActionDescriptor,
  RemediationActionInput,
  RemediationDraftItemsUpsertData,
  RemediationOrder,
  RemediationOrderDraftItemInput,
  RemediationOrderItem,
  RemediationReverseContextOption,
} from "./types";
import { RemediationSourceType } from "./types";

export type RemediationTargetResolutionStatus =
  "resolving" | "ready" | "configuration_required" | "blocked" | "error";

// This is a conservative node-level menu guard. The backend remains
// authoritative for Agent/object/effect applicability when a new target is
// resolved through QueryRemediationNodeActions.
export type RemediationHistoryNodeState =
  "prepared" | "awaiting_endpoint_report" | "executing" | "result_uncertain";

export interface RemediationTargetDraft {
  key: string;
  node: AttackGraphNodeModel;
  itemId: string;
  agentCandidates: string[];
  selectedAgentId: string;
  actions: RemediationActionDescriptor[];
  actionDecisions: RemediationActionDecision[];
  selectedActionCode: string;
  actionInput: RemediationActionInput;
  reverseSourceItemId: string;
  resolutionStatus: RemediationTargetResolutionStatus;
  blockedReason: string;
  error: string;
  itemStatus: string;
  reasonCode: string;
  reasonMessage: string;
  riskLevel: string;
  resultVersion: number;
  uncertaintySinceAt: string;
}

export interface UseRemediationOrderWorkspaceOptions {
  caseId: string;
  workflowId: string;
  tenantId?: string;
  nodes: readonly AttackGraphNodeModel[];
  // Defaults preserve the Case graph entry. Drill/Locate callers pass their
  // real source and scope so they reuse their own stable Order instead of
  // being folded into a Case order.
  source?: {
    sourceType: RemediationSourceType;
    sourceRefId: string;
    scopeType: "case" | "positioning";
    scopeId: string;
    caseId?: string;
    workflowId?: string;
  };
}

function requestErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Unknown remediation request error";
}

function draftUpsertFailureMessage(
  inputIndex: number,
  reasonCode: string,
  reasonMessage: string,
) {
  const code = reasonCode.trim();
  const message = reasonMessage.trim();
  if (code && message) return `${code}: ${message}`;
  if (message) return message;
  if (code) return code;
  return `Remediation target ${inputIndex + 1} was not added to the Draft`;
}

// The upsert endpoint can return a successful HTTP response while deciding
// that an individual intent was not persisted. Navigation is safe only after
// every requested target can be found in the returned current Draft Round.
export function assertRemediationDraftItemsPersisted(
  data: RemediationDraftItemsUpsertData,
  requestedItems: readonly RemediationOrderDraftItemInput[],
) {
  const resultsByIndex = new Map(
    data.item_results.map((result) => [result.input_index, result] as const),
  );
  if (resultsByIndex.size !== data.item_results.length) {
    throw new Error("The Draft save returned duplicate item results");
  }
  const currentRoundItems = data.order.items.filter(
    (item) => item.round_no === data.order.current_round,
  );

  requestedItems.forEach((requested, inputIndex) => {
    const result = resultsByIndex.get(inputIndex);
    if (!result) {
      throw new Error(`The Draft save omitted target ${inputIndex + 1}`);
    }
    if (
      result.disposition !== "created" &&
      result.disposition !== "updated" &&
      result.disposition !== "already_present"
    ) {
      throw new Error(
        draftUpsertFailureMessage(
          inputIndex,
          result.reason_code,
          result.reason_message,
        ),
      );
    }

    const persisted = currentRoundItems.find(
      (item) =>
        Boolean(result.item_id) &&
        item.item_id === result.item_id &&
        item.node_key === requested.graph_target.node_key &&
        item.agent_id === requested.graph_target.agent_id &&
        item.action_code === requested.action_code &&
        item.reverse_source_id === (requested.reverse_source_item_id ?? ""),
    );
    if (!persisted) {
      throw new Error(
        draftUpsertFailureMessage(
          inputIndex,
          result.reason_code,
          result.reason_message,
        ),
      );
    }
  });
}

function isNotFoundError(error: unknown) {
  const value = error as { status?: unknown; code?: unknown };
  return Number(value?.status) === 404 || Number(value?.code) === 404;
}

function isDraftEditableOrder(order: RemediationOrder | null) {
  // A terminal Round does not lock its stable Order. The next target added by
  // the ControlPanel starts a new Draft Round on that same Order ID. A
  // Prepared Round is different: it is awaiting confirmation and must only be
  // changed from the orchestration page.
  return !order || order.status.trim().toLowerCase() !== "prepared";
}

function hasCurrentDraftRound(order: RemediationOrder | null) {
  return order?.status.trim().toLowerCase() === "draft";
}

export function getRemediationHistoryItems(order: RemediationOrder | null) {
  if (!order) return [];
  // While the current Round is a Draft, only that Round is editable. Once a
  // Round is prepared, confirmed, or executing, it becomes history too.
  return order.items.filter(
    (item) =>
      !hasCurrentDraftRound(order) || item.round_no !== order.current_round,
  );
}

const historyNodeStatePriority: Record<RemediationHistoryNodeState, number> = {
  prepared: 1,
  awaiting_endpoint_report: 2,
  executing: 3,
  result_uncertain: 4,
};

function historyNodeStateForItem(
  item: RemediationOrderItem,
  order: RemediationOrder,
): RemediationHistoryNodeState | null {
  if (item.uncertainty_since_at.trim()) return "result_uncertain";

  switch (item.status.trim().toLowerCase()) {
    case "pending":
      return "awaiting_endpoint_report";
    case "running":
      return "executing";
    case "ready":
      return order.status.trim().toLowerCase() === "prepared" &&
        item.round_no === order.current_round
        ? "prepared"
        : null;
    default:
      return null;
  }
}

export function getRemediationHistoryNodeStates(
  order: RemediationOrder | null,
  historyItems = getRemediationHistoryItems(order),
) {
  const states = new Map<string, RemediationHistoryNodeState>();
  if (!order) return states;

  for (const item of historyItems) {
    const nodeKey = item.node_key.trim();
    const nextState = historyNodeStateForItem(item, order);
    if (!nodeKey || !nextState) continue;

    const current = states.get(nodeKey);
    if (
      !current ||
      historyNodeStatePriority[nextState] > historyNodeStatePriority[current]
    ) {
      states.set(nodeKey, nextState);
    }
  }
  return states;
}

function buildRecoveredNode(item: RemediationOrderItem): AttackGraphNodeModel {
  return {
    id: item.node_key,
    key: item.node_key,
    entityType: item.entity_type,
    displayName: item.display_name || item.node_key,
    presentationKind: getAttackGraphNodePresentationKind(item.entity_type),
    properties: {},
    missingFromResponse: true,
  };
}

function selectedAction(target: RemediationTargetDraft) {
  return target.actions.find(
    (action) => action.action_code === target.selectedActionCode,
  );
}

export function getRemediationActionDecision(
  target: Pick<RemediationTargetDraft, "actionDecisions">,
  actionCode: string,
) {
  return target.actionDecisions.find(
    (decision) => decision.action.action_code === actionCode,
  );
}

export function getRemediationAgentDecision(
  decision: RemediationActionDecision | undefined,
  agentId: string,
) {
  return decision?.agent_decisions.find(
    (agentDecision) => agentDecision.agent_id === agentId,
  );
}

export function getRemediationDecisionContexts(
  decision: RemediationActionDecision | undefined,
  agentId: string,
) {
  if (!decision) return [];
  return getRemediationAgentDecision(decision, agentId)?.reverse_contexts ?? [];
}

// A reverse action can be added from the ControlPanel only when its source is
// unambiguous. The orchestration page remains responsible for asking the
// operator to choose when multiple successful source Items are available.
export function selectRemediationReverseSourceItemId(
  contexts: readonly RemediationReverseContextOption[],
  retainedSourceItemId = "",
) {
  const sourceItemIds = Array.from(
    new Set(
      contexts.map((context) => context.source_item_id.trim()).filter(Boolean),
    ),
  );
  const retained = retainedSourceItemId.trim();
  if (retained && sourceItemIds.includes(retained)) return retained;
  return sourceItemIds.length === 1 ? sourceItemIds[0] : "";
}

export function selectRemediationActionForAgent({
  actionDecisions,
  agentId,
  retainedActionCode = "",
  retainedReverseSourceItemId = "",
}: {
  actionDecisions: readonly RemediationActionDecision[];
  agentId: string;
  retainedActionCode?: string;
  retainedReverseSourceItemId?: string;
}) {
  const selectableDecisions = actionDecisions.filter((decision) =>
    isRemediationDecisionSelectable(decision, agentId),
  );
  const selectedActionCode = selectableDecisions.some(
    (decision) => decision.action.action_code === retainedActionCode,
  )
    ? retainedActionCode
    : selectableDecisions.length === 1
      ? selectableDecisions[0].action.action_code
      : "";
  const selectedDecision = selectableDecisions.find(
    (decision) => decision.action.action_code === selectedActionCode,
  );
  return {
    selectedActionCode,
    reverseSourceItemId: selectRemediationReverseSourceItemId(
      getRemediationDecisionContexts(selectedDecision, agentId),
      retainedReverseSourceItemId,
    ),
  };
}

export function remediationSelectionChanged(
  current: Pick<
    RemediationTargetDraft,
    "selectedActionCode" | "reverseSourceItemId"
  >,
  next: Pick<
    RemediationTargetDraft,
    "selectedActionCode" | "reverseSourceItemId"
  >,
) {
  return (
    current.selectedActionCode !== next.selectedActionCode ||
    current.reverseSourceItemId !== next.reverseSourceItemId
  );
}

export function isRemediationDecisionSelectable(
  decision: RemediationActionDecision | undefined,
  agentId: string,
) {
  if (!decision || !agentId) {
    return false;
  }
  const agentDecision = getRemediationAgentDecision(decision, agentId);
  return agentDecision?.draft_selectable === true;
}

export function getRemediationSelectableActions(
  target: Pick<
    RemediationTargetDraft,
    "actions" | "actionDecisions" | "selectedAgentId"
  >,
) {
  return target.actions.filter((action) =>
    isRemediationDecisionSelectable(
      getRemediationActionDecision(target, action.action_code),
      target.selectedAgentId,
    ),
  );
}

export function getRemediationSelectableAgentIds(
  target: Pick<RemediationTargetDraft, "agentCandidates" | "actionDecisions">,
) {
  return target.agentCandidates.filter((agentId) =>
    target.actionDecisions.some((decision) =>
      isRemediationDecisionSelectable(decision, agentId),
    ),
  );
}

export function isRemediationTargetComplete(target: RemediationTargetDraft) {
  const action = selectedAction(target);
  const decision = getRemediationActionDecision(
    target,
    target.selectedActionCode,
  );
  if (
    target.resolutionStatus !== "ready" ||
    !target.selectedAgentId ||
    !action ||
    !isRemediationDecisionSelectable(decision, target.selectedAgentId)
  ) {
    return false;
  }
  return true;
}

export function useRemediationOrderWorkspace({
  caseId,
  workflowId,
  tenantId,
  nodes,
  source,
}: UseRemediationOrderWorkspaceOptions) {
  const [targetsByKey, setTargetsByKey] = useState(
    () => new Map<string, RemediationTargetDraft>(),
  );
  const [order, setOrder] = useState<RemediationOrder | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");

  const orderRef = useRef<RemediationOrder | null>(null);
  const targetsRef = useRef(targetsByKey);
  const nodeByKeyRef = useRef(new Map<string, AttackGraphNodeModel>());
  const loadRunIdRef = useRef(0);
  const targetRunIdsRef = useRef(new Map<string, number>());
  const targetRunSequenceRef = useRef(0);

  const normalizedCaseId = caseId.trim();
  const normalizedWorkflowId = workflowId.trim();
  const normalizedTenantId = tenantId?.trim() || "";
  const sourceType = source?.sourceType ?? RemediationSourceType.CaseGraph;
  const sourceRefId = source?.sourceRefId.trim() || normalizedCaseId;
  const sourceScopeType = source?.scopeType ?? "case";
  const sourceScopeId = source?.scopeId.trim() || normalizedCaseId;
  const sourceCaseId = source?.caseId?.trim() || normalizedCaseId;
  const sourceWorkflowId = source?.workflowId?.trim() || normalizedWorkflowId;
  const sourceTypeName =
    sourceType === RemediationSourceType.DrillGraph
      ? "drill_graph"
      : sourceType === RemediationSourceType.LocateGraph
        ? "locate_graph"
        : "case_graph";

  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  useEffect(() => {
    targetsRef.current = targetsByKey;
  }, [targetsByKey]);

  useEffect(() => {
    nodeByKeyRef.current = new Map(
      nodes
        .map((node) => [node.key || node.id, node] as const)
        .filter(([key]) => Boolean(key)),
    );
    setTargetsByKey((current) => {
      let changed = false;
      const next = new Map(current);
      for (const [key, target] of next) {
        const graphNode = nodeByKeyRef.current.get(key);
        if (graphNode && graphNode !== target.node) {
          next.set(key, { ...target, node: graphNode });
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [nodes]);

  const mergeOrder = useCallback((nextOrder: RemediationOrder) => {
    orderRef.current = nextOrder;
    setOrder(nextOrder);
    setTargetsByKey((current) => {
      const next = new Map<string, RemediationTargetDraft>();
      for (const item of nextOrder.items) {
        if (
          !hasCurrentDraftRound(nextOrder) ||
          item.round_no !== nextOrder.current_round
        )
          continue;
        const existing = current.get(item.node_key);
        const node =
          nodeByKeyRef.current.get(item.node_key) ??
          existing?.node ??
          buildRecoveredNode(item);
        next.set(item.node_key, {
          key: item.node_key,
          node,
          itemId: item.item_id,
          agentCandidates: existing?.agentCandidates.length
            ? existing.agentCandidates
            : item.agent_id
              ? [item.agent_id]
              : [],
          selectedAgentId: item.agent_id || existing?.selectedAgentId || "",
          actions: existing?.actions ?? [],
          actionDecisions: existing?.actionDecisions ?? [],
          selectedActionCode:
            item.action_code || existing?.selectedActionCode || "",
          actionInput: item.action_input ?? existing?.actionInput ?? {},
          reverseSourceItemId:
            item.reverse_source_id || existing?.reverseSourceItemId || "",
          resolutionStatus: existing?.resolutionStatus ?? "ready",
          blockedReason: existing?.blockedReason ?? "",
          error: existing?.error ?? "",
          itemStatus: item.status,
          reasonCode: item.reason_code,
          reasonMessage: item.reason_message,
          riskLevel: item.risk_level,
          resultVersion: item.result_version,
          uncertaintySinceAt: item.uncertainty_since_at,
        });
      }
      targetsRef.current = next;
      return next;
    });
    setDirty(false);
    setError("");
    return nextOrder;
  }, []);

  const resolveTarget = useCallback(
    async (
      node: AttackGraphNodeModel,
      options: {
        selectedAgentId?: string;
        selectedActionCode?: string;
        reverseSourceItemId?: string;
        markDirty?: boolean;
      } = {},
    ) => {
      const key = (node.key || node.id).trim();
      if (!key) throw new Error("The graph node has no stable key");
      if (!sourceScopeId)
        throw new Error("A remediation graph scope is required");

      targetRunSequenceRef.current += 1;
      const runId = targetRunSequenceRef.current;
      targetRunIdsRef.current.set(key, runId);
      const previous = targetsRef.current.get(key);
      const pending: RemediationTargetDraft = {
        key,
        node,
        itemId: previous?.itemId ?? "",
        agentCandidates: previous?.agentCandidates ?? [],
        selectedAgentId:
          options.selectedAgentId ?? previous?.selectedAgentId ?? "",
        actions: previous?.actions ?? [],
        actionDecisions: previous?.actionDecisions ?? [],
        selectedActionCode:
          options.selectedActionCode ?? previous?.selectedActionCode ?? "",
        actionInput: previous?.actionInput ?? {},
        reverseSourceItemId:
          options.reverseSourceItemId ?? previous?.reverseSourceItemId ?? "",
        resolutionStatus: "resolving",
        blockedReason: "",
        error: "",
        itemStatus: previous?.itemStatus ?? "draft",
        reasonCode: previous?.reasonCode ?? "",
        reasonMessage: previous?.reasonMessage ?? "",
        riskLevel: previous?.riskLevel ?? "",
        resultVersion: previous?.resultVersion ?? 0,
        uncertaintySinceAt: previous?.uncertaintySinceAt ?? "",
      };
      if (previous) {
        setTargetsByKey((current) => {
          const next = new Map(current);
          next.set(key, pending);
          targetsRef.current = next;
          return next;
        });
      }

      try {
        const agents = await resolveRemediationNodeAgents({
          ...(normalizedTenantId ? { tenant_id: normalizedTenantId } : {}),
          scope_type: sourceScopeType,
          scope_id: sourceScopeId,
          node_key: key,
          entity_type: node.entityType,
        });
        if (targetRunIdsRef.current.get(key) !== runId) return null;
        if (agents.status === "unresolvable" || agents.agent_ids.length === 0) {
          const reason =
            agents.message || "No trusted Agent is available for this node";
          setTargetsByKey((current) => {
            const target = current.get(key);
            if (!target) return current;
            const next = new Map(current);
            next.set(key, {
              ...target,
              agentCandidates: agents.agent_ids,
              resolutionStatus: "blocked",
              blockedReason: reason,
            });
            targetsRef.current = next;
            return next;
          });
          return null;
        }

        const actionResult = await queryRemediationNodeActions({
          ...(normalizedTenantId ? { tenant_id: normalizedTenantId } : {}),
          source_type: sourceTypeName,
          scope_type: sourceScopeType,
          scope_id: sourceScopeId,
          node_key: key,
        });
        if (targetRunIdsRef.current.get(key) !== runId) return null;
        const actionNode = actionResult.node;
        if (actionNode.resolution_status !== "resolved") {
          const reason =
            actionNode.reason_message ||
            "The Graph node context is not available for remediation";
          setTargetsByKey((current) => {
            const target = current.get(key);
            if (!target) return current;
            const next = new Map(current);
            next.set(key, {
              ...target,
              agentCandidates: [],
              actions: [],
              actionDecisions: [],
              resolutionStatus: "blocked",
              blockedReason: reason,
            });
            targetsRef.current = next;
            return next;
          });
          return null;
        }
        const actionDecisions = actionNode.actions;
        const authoritativeAgentIds = Array.from(
          new Set(
            actionDecisions.flatMap((decision) =>
              decision.agent_decisions.map((item) => item.agent_id),
            ),
          ),
        ).filter(Boolean);
        if (actionDecisions.length === 0) {
          const reason =
            actionNode.reason_message ||
            "No remediation action is available for this node";
          setTargetsByKey((current) => {
            const target = current.get(key);
            if (!target) return current;
            const next = new Map(current);
            next.set(key, {
              ...target,
              agentCandidates: authoritativeAgentIds,
              actions: [],
              actionDecisions: [],
              resolutionStatus: "blocked",
              blockedReason: reason,
            });
            targetsRef.current = next;
            return next;
          });
          return null;
        }

        const selectableAgentIds = getRemediationSelectableAgentIds({
          agentCandidates: authoritativeAgentIds,
          actionDecisions,
        });
        const selectableActions = actionDecisions
          .filter((decision) =>
            selectableAgentIds.some((agentId) =>
              isRemediationDecisionSelectable(decision, agentId),
            ),
          )
          .map((decision) => decision.action);
        const selectedAgentId = selectableAgentIds.includes(
          pending.selectedAgentId,
        )
          ? pending.selectedAgentId
          : selectableAgentIds.length === 1
            ? selectableAgentIds[0]
            : "";
        const { selectedActionCode, reverseSourceItemId } =
          selectRemediationActionForAgent({
            actionDecisions,
            agentId: selectedAgentId,
            retainedActionCode: pending.selectedActionCode,
            retainedReverseSourceItemId: pending.reverseSourceItemId,
          });
        const selectionChanged = remediationSelectionChanged(pending, {
          selectedActionCode,
          reverseSourceItemId,
        });
        const actionChanged = selectedActionCode !== pending.selectedActionCode;
        const hasAnySelectableAction = selectableActions.length > 0;
        const requiresConfiguration = actionDecisions.some((candidate) =>
          candidate.agent_decisions.some(
            (item) => item.status === "requires_configuration",
          ),
        );
        const blockedReason = hasAnySelectableAction
          ? ""
          : actionNode.reason_message ||
            actionDecisions
              .flatMap((candidate) => candidate.agent_decisions)
              .find((candidate) => candidate.reason_message)?.reason_message ||
            "No remediation action is selectable for this node";
        const resolutionStatus: RemediationTargetResolutionStatus =
          hasAnySelectableAction
            ? "ready"
            : requiresConfiguration
              ? "configuration_required"
              : "blocked";

        if (!hasAnySelectableAction && !previous) return null;

        setTargetsByKey((current) => {
          const target = current.get(key) ?? pending;
          const next = new Map(current);
          next.set(key, {
            ...target,
            node: {
              ...target.node,
              entityType: actionNode.entity_type || target.node.entityType,
            },
            agentCandidates: selectableAgentIds,
            selectedAgentId,
            actions: selectableActions,
            actionDecisions,
            selectedActionCode,
            // Parameter branches belong to their action. Never carry e.g.
            // file_quarantine settings into a file.restore Draft Item.
            actionInput: actionChanged ? {} : pending.actionInput,
            reverseSourceItemId,
            resolutionStatus,
            blockedReason,
            error: "",
          });
          targetsRef.current = next;
          return next;
        });
        // A re-resolved action is a real Draft edit. Without this marker an
        // old file.quarantine Item can be displayed as file.restore locally,
        // yet navigation skips saveDraft() and opens the old persisted Item.
        if (options.markDirty || selectionChanged) {
          setDirty(true);
        }
        return actionNode;
      } catch (cause) {
        if (targetRunIdsRef.current.get(key) !== runId) return null;
        const message = requestErrorMessage(cause);
        setTargetsByKey((current) => {
          const target = current.get(key);
          if (!target) return current;
          const next = new Map(current);
          next.set(key, {
            ...target,
            resolutionStatus: "error",
            error: message,
          });
          targetsRef.current = next;
          return next;
        });
        throw cause;
      }
    },
    [normalizedTenantId, sourceScopeId, sourceScopeType, sourceTypeName],
  );

  useEffect(() => {
    loadRunIdRef.current += 1;
    const runId = loadRunIdRef.current;
    targetRunIdsRef.current.clear();
    setError("");
    setDirty(false);
    setOrder(null);
    orderRef.current = null;
    setTargetsByKey(new Map());
    targetsRef.current = new Map();
    if (!sourceRefId) {
      setLoadingDraft(false);
      return;
    }

    let cancelled = false;
    setLoadingDraft(true);
    void queryEditableRemediationOrderBySource({
      source_type: sourceType,
      source_ref_id: sourceRefId,
    })
      .then((nextOrder) => {
        if (cancelled || loadRunIdRef.current !== runId) return;
        mergeOrder(nextOrder);
        for (const item of nextOrder.items) {
          if (
            !hasCurrentDraftRound(nextOrder) ||
            item.round_no !== nextOrder.current_round
          )
            continue;
          const node =
            nodeByKeyRef.current.get(item.node_key) ?? buildRecoveredNode(item);
          void resolveTarget(node, {
            selectedAgentId: item.agent_id,
            selectedActionCode: item.action_code,
            reverseSourceItemId: item.reverse_source_id,
          }).catch(() => undefined);
        }
      })
      .catch((cause) => {
        if (cancelled || loadRunIdRef.current !== runId) return;
        if (isNotFoundError(cause)) return;
        setError(requestErrorMessage(cause));
      })
      .finally(() => {
        if (!cancelled && loadRunIdRef.current === runId) {
          setLoadingDraft(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mergeOrder, resolveTarget, sourceRefId, sourceType]);

  const addTarget = useCallback(
    async (node: AttackGraphNodeModel) => {
      const key = (node.key || node.id).trim();
      if (targetsRef.current.has(key))
        return targetsRef.current.get(key) ?? null;
      return resolveTarget(node, { markDirty: true });
    },
    [resolveTarget],
  );

  const retryTarget = useCallback(
    async (key: string) => {
      const target = targetsRef.current.get(key);
      if (!target) return null;
      return resolveTarget(target.node, {
        selectedAgentId: target.selectedAgentId,
        selectedActionCode: target.selectedActionCode,
        reverseSourceItemId: target.reverseSourceItemId,
      });
    },
    [resolveTarget],
  );

  const removeTarget = useCallback((key: string) => {
    if (!isDraftEditableOrder(orderRef.current)) return;
    targetRunIdsRef.current.delete(key);
    setTargetsByKey((current) => {
      if (!current.has(key)) return current;
      const next = new Map(current);
      next.delete(key);
      targetsRef.current = next;
      return next;
    });
    setDirty(true);
  }, []);

  const clearTargets = useCallback(() => {
    if (!isDraftEditableOrder(orderRef.current)) return;
    targetRunIdsRef.current.clear();
    setTargetsByKey(new Map());
    targetsRef.current = new Map();
    setDirty(true);
  }, []);

  const selectAgent = useCallback((key: string, agentId: string) => {
    if (!isDraftEditableOrder(orderRef.current)) return;
    setTargetsByKey((current) => {
      const target = current.get(key);
      if (!target || !target.agentCandidates.includes(agentId)) return current;
      const selection = selectRemediationActionForAgent({
        actionDecisions: target.actionDecisions,
        agentId,
        retainedActionCode: target.selectedActionCode,
        retainedReverseSourceItemId: target.reverseSourceItemId,
      });
      const actionChanged =
        selection.selectedActionCode !== target.selectedActionCode;
      const next = new Map(current);
      next.set(key, {
        ...target,
        selectedAgentId: agentId,
        selectedActionCode: selection.selectedActionCode,
        actionInput: actionChanged ? {} : target.actionInput,
        reverseSourceItemId: selection.reverseSourceItemId,
      });
      targetsRef.current = next;
      return next;
    });
    setDirty(true);
  }, []);

  const selectActionCode = useCallback((key: string, actionCode: string) => {
    if (!isDraftEditableOrder(orderRef.current)) return;
    setTargetsByKey((current) => {
      const target = current.get(key);
      if (!target) return current;
      const decision = getRemediationActionDecision(target, actionCode);
      if (!isRemediationDecisionSelectable(decision, target.selectedAgentId)) {
        return current;
      }
      const contexts = getRemediationDecisionContexts(
        decision,
        target.selectedAgentId,
      );
      const actionChanged = actionCode !== target.selectedActionCode;
      const next = new Map(current);
      next.set(key, {
        ...target,
        selectedActionCode: actionCode,
        actionInput: actionChanged ? {} : target.actionInput,
        reverseSourceItemId: selectRemediationReverseSourceItemId(
          contexts,
          target.reverseSourceItemId,
        ),
      });
      targetsRef.current = next;
      return next;
    });
    setDirty(true);
  }, []);

  const saveDraft = useCallback(
    async (options: { title?: string } = {}) => {
      if (!sourceRefId) throw new Error("A remediation source is required");
      const currentOrder = orderRef.current;
      const effectiveWorkflowId =
        sourceWorkflowId || currentOrder?.source.workflow_id.trim() || "";
      if (sourceType === RemediationSourceType.CaseGraph && !sourceCaseId) {
        throw new Error("A Case ID is required");
      }
      if (
        sourceType === RemediationSourceType.CaseGraph &&
        !effectiveWorkflowId
      ) {
        throw new Error("A Workflow ID is required to save remediation");
      }
      const targets = Array.from(targetsRef.current.values());
      if (targets.length === 0 && !currentOrder)
        throw new Error("Add at least one remediation target");
      const incomplete = targets.find(
        (target) => !isRemediationTargetComplete(target),
      );
      if (incomplete) {
        throw new Error(
          `Complete the Agent and action selection for ${incomplete.node.displayName || incomplete.key}`,
        );
      }
      const newOrderTitle = options.title?.trim() || "";
      if (!currentOrder && !newOrderTitle) {
        throw new Error("A remediation order title is required");
      }
      if (currentOrder && !currentOrder.title.trim()) {
        throw new Error("The existing remediation order has no title");
      }

      setSaving(true);
      setError("");
      try {
        const source = {
          source_type: sourceType,
          source_ref_id: sourceRefId,
          case_id: sourceCaseId,
          workflow_id: effectiveWorkflowId,
        };
        // The source owns one long-lived Order. This call is idempotent: it
        // returns the same order_id after previous Prepare/Confirm executions.
        let stableOrder =
          currentOrder ??
          (await getOrCreateRemediationOrderBySource({
            title: newOrderTitle,
            source,
          }));
        const currentItemsById = new Map(
          stableOrder.items
            .filter((item) => item.round_no === stableOrder.current_round)
            .map((item) => [item.item_id, item] as const),
        );
        const items = targets.map((target) => {
          const persisted = target.itemId
            ? currentItemsById.get(target.itemId)
            : undefined;
          // Changing an action changes desired-effect identity. It is a Draft
          // delete followed by a new upsert, rather than a second Item hidden
          // behind the old Item ID. Parameter-only changes retain the Item.
          const keepItemId =
            persisted &&
            persisted.node_key === target.key &&
            persisted.agent_id === target.selectedAgentId &&
            persisted.action_code === target.selectedActionCode
              ? persisted.item_id
              : "";
          return {
            ...(keepItemId ? { item_id: keepItemId } : {}),
            action_code: target.selectedActionCode,
            ...(Object.keys(target.actionInput).length
              ? { action_input: target.actionInput }
              : {}),
            graph_target: {
              node_key: target.key,
              agent_id: target.selectedAgentId,
            },
            ...(target.reverseSourceItemId
              ? { reverse_source_item_id: target.reverseSourceItemId }
              : {}),
          };
        });
        const selectedItemIds = new Set(
          items.map((item) => item.item_id).filter(Boolean),
        );
        const orderStatus = stableOrder.status.trim().toLowerCase();
        if (orderStatus === "prepared") {
          throw new Error(
            "This remediation order is prepared. Continue in orchestration before changing it.",
          );
        }
        if (orderStatus !== "draft") {
          // Confirmed/executing history is never synchronized as a draft. The
          // backend opens the next Draft Round during this upsert on the same
          // stable order_id.
          if (items.length === 0) return mergeOrder(stableOrder);
          const upsert = await upsertRemediationDraftItems({
            order_id: stableOrder.order_id,
            expected_revision: stableOrder.revision,
            items,
          });
          assertRemediationDraftItemsPersisted(upsert, items);
          return mergeOrder(upsert.order);
        }
        // A removed ControlPanel target is a server-side Draft deletion, not an
        // omitted value in a full-list replacement request. History is not held
        // in targetsRef and can never be deleted here.
        for (const item of stableOrder.items) {
          if (
            item.round_no !== stableOrder.current_round ||
            !item.item_id ||
            selectedItemIds.has(item.item_id)
          ) {
            continue;
          }
          stableOrder = await deleteRemediationDraftItem({
            order_id: stableOrder.order_id,
            item_id: item.item_id,
            expected_revision: stableOrder.revision,
          });
        }
        if (items.length === 0) return mergeOrder(stableOrder);
        const upsert = await upsertRemediationDraftItems({
          order_id: stableOrder.order_id,
          expected_revision: stableOrder.revision,
          items,
        });
        assertRemediationDraftItemsPersisted(upsert, items);
        return mergeOrder(upsert.order);
      } catch (cause) {
        const message = requestErrorMessage(cause);
        setError(message);
        throw cause;
      } finally {
        setSaving(false);
      }
    },
    [mergeOrder, sourceCaseId, sourceRefId, sourceType, sourceWorkflowId],
  );

  const targets = useMemo(
    () => Array.from(targetsByKey.values()),
    [targetsByKey],
  );
  const targetKeys = useMemo(
    () => new Set(targetsByKey.keys()),
    [targetsByKey],
  );
  const historyItems = useMemo(
    () => getRemediationHistoryItems(order),
    [order],
  );
  const historyNodeStates = useMemo(
    () => getRemediationHistoryNodeStates(order, historyItems),
    [historyItems, order],
  );
  const targetCount = targets.length + historyItems.length;
  const allTargetsComplete =
    targets.length > 0 && targets.every(isRemediationTargetComplete);

  return {
    targets,
    targetKeys,
    historyItems,
    historyNodeStates,
    targetCount,
    order,
    loadingDraft,
    saving,
    dirty,
    error,
    workflowMissing:
      sourceType === RemediationSourceType.CaseGraph &&
      !(sourceWorkflowId || order?.source.workflow_id.trim()),
    editable: isDraftEditableOrder(order),
    allTargetsComplete,
    addTarget,
    retryTarget,
    removeTarget,
    clearTargets,
    selectAgent,
    selectActionCode,
    saveDraft,
  };
}
