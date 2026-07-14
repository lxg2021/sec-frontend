"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { AttackGraphNodeModel } from "@/features/attack/dgraph/model/core/attack-graph-data";
import { getAttackGraphNodePresentationKind } from "@/features/attack/dgraph/model/node/attack-graph-node-types";

import {
  createRemediationOrder,
  queryEditableRemediationOrderBySource,
  queryRemediationNodeActions,
  resolveRemediationNodeAgents,
  updateRemediationOrder,
} from "./api";
import type {
  RemediationActionDecision,
  RemediationActionDescriptor,
  RemediationActionInput,
  RemediationOrder,
  RemediationOrderItem,
} from "./types";
import { RemediationSourceType } from "./types";

export type RemediationTargetResolutionStatus =
  "resolving" | "ready" | "configuration_required" | "blocked" | "error";

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
}

function requestErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Unknown remediation request error";
}

function isNotFoundError(error: unknown) {
  const value = error as { status?: unknown; code?: unknown };
  return Number(value?.status) === 404 || Number(value?.code) === 404;
}

function isDraftEditableOrder(order: RemediationOrder | null) {
  return !order || order.status === "draft";
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

export function isRemediationDecisionSelectable(
  decision: RemediationActionDecision | undefined,
  agentId: string,
) {
  if (
    !decision ||
    !agentId
  ) {
    return false;
  }
  const agentDecision = getRemediationAgentDecision(decision, agentId);
  return (
    agentDecision?.status === "available" ||
    agentDecision?.status === "requires_configuration"
  );
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
  target: Pick<
    RemediationTargetDraft,
    "agentCandidates" | "actionDecisions"
  >,
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
      if (!normalizedCaseId) throw new Error("A Case ID is required");

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
          scope_type: "case",
          scope_id: normalizedCaseId,
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
          source_type: "case_graph",
          scope_type: "case",
          scope_id: normalizedCaseId,
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
        const selectableDecisions = actionDecisions.filter((decision) =>
          isRemediationDecisionSelectable(decision, selectedAgentId),
        );
        const selectedActionCode = selectableDecisions.some(
          (decision) =>
            decision.action.action_code === pending.selectedActionCode,
        )
          ? pending.selectedActionCode
          : selectableDecisions.length === 1
            ? selectableDecisions[0].action.action_code
            : "";
        const decision = actionDecisions.find(
          (item) => item.action.action_code === selectedActionCode,
        );
        const eligibleContexts = getRemediationDecisionContexts(
          decision,
          selectedAgentId,
        );
        const reverseSourceItemId = eligibleContexts.some(
          (context) => context.source_item_id === pending.reverseSourceItemId,
        )
          ? pending.reverseSourceItemId
          : "";
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
            reverseSourceItemId,
            resolutionStatus,
            blockedReason,
            error: "",
          });
          targetsRef.current = next;
          return next;
        });
        if (options.markDirty) setDirty(true);
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
    [normalizedCaseId, normalizedTenantId],
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
    if (!normalizedCaseId) {
      setLoadingDraft(false);
      return;
    }

    let cancelled = false;
    setLoadingDraft(true);
    void queryEditableRemediationOrderBySource({
      source_type: RemediationSourceType.CaseGraph,
      source_ref_id: normalizedCaseId,
    })
      .then((nextOrder) => {
        if (cancelled || loadRunIdRef.current !== runId) return;
        mergeOrder(nextOrder);
        for (const item of nextOrder.items) {
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
  }, [mergeOrder, normalizedCaseId, resolveTarget]);

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
      const decision = getRemediationActionDecision(
        target,
        target.selectedActionCode,
      );
      const keepSelectedAction = isRemediationDecisionSelectable(
        decision,
        agentId,
      );
      const contexts = keepSelectedAction
        ? getRemediationDecisionContexts(decision, agentId)
        : [];
      const next = new Map(current);
      next.set(key, {
        ...target,
        selectedAgentId: agentId,
        selectedActionCode: keepSelectedAction ? target.selectedActionCode : "",
        reverseSourceItemId: contexts.some(
          (context) => context.source_item_id === target.reverseSourceItemId,
        )
          ? target.reverseSourceItemId
          : "",
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
      const next = new Map(current);
      next.set(key, {
        ...target,
        selectedActionCode: actionCode,
        reverseSourceItemId: contexts.some(
          (context) => context.source_item_id === target.reverseSourceItemId,
        )
          ? target.reverseSourceItemId
          : "",
      });
      targetsRef.current = next;
      return next;
    });
    setDirty(true);
  }, []);

  const saveDraft = useCallback(async () => {
    if (!normalizedCaseId) throw new Error("A Case ID is required");
    const currentOrder = orderRef.current;
    if (currentOrder && currentOrder.status !== "draft") {
      throw new Error(
        "This remediation order is already prepared; open orchestration to continue",
      );
    }
    const effectiveWorkflowId =
      normalizedWorkflowId || currentOrder?.source.workflow_id.trim() || "";
    if (!effectiveWorkflowId) {
      throw new Error("A Workflow ID is required to save remediation");
    }
    const targets = Array.from(targetsRef.current.values());
    if (targets.length === 0)
      throw new Error("Add at least one remediation target");
    const incomplete = targets.find(
      (target) => !isRemediationTargetComplete(target),
    );
    if (incomplete) {
      throw new Error(
        `Complete the Agent and action selection for ${incomplete.node.displayName || incomplete.key}`,
      );
    }

    setSaving(true);
    setError("");
    try {
      const source = {
        source_type: RemediationSourceType.CaseGraph,
        source_ref_id: normalizedCaseId,
        case_id: normalizedCaseId,
        workflow_id: effectiveWorkflowId,
      };
      const items = targets.map((target) => ({
        ...(target.itemId ? { item_id: target.itemId } : {}),
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
      }));
      const nextOrder = currentOrder
        ? await updateRemediationOrder({
            order_id: currentOrder.order_id,
            expected_revision: currentOrder.revision,
            title: currentOrder.title || `Case ${normalizedCaseId} remediation`,
            source,
            items,
          })
        : await createRemediationOrder({
            title: `Case ${normalizedCaseId} remediation`,
            source,
            items,
          });
      return mergeOrder(nextOrder);
    } catch (cause) {
      const message = requestErrorMessage(cause);
      setError(message);
      throw cause;
    } finally {
      setSaving(false);
    }
  }, [mergeOrder, normalizedCaseId, normalizedWorkflowId]);

  const targets = useMemo(
    () => Array.from(targetsByKey.values()),
    [targetsByKey],
  );
  const targetKeys = useMemo(
    () => new Set(targetsByKey.keys()),
    [targetsByKey],
  );
  const allTargetsComplete =
    targets.length > 0 && targets.every(isRemediationTargetComplete);

  return {
    targets,
    targetKeys,
    order,
    loadingDraft,
    saving,
    dirty,
    error,
    workflowMissing: !(
      normalizedWorkflowId || order?.source.workflow_id.trim()
    ),
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
