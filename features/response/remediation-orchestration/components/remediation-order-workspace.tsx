"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Crosshair,
  History,
  Loader2,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import {
  cancelRemediationOrder,
  confirmRemediationOrder,
  deleteRemediationOrder,
  prepareRemediationOrder,
  queryRemediationNodeActions,
  queryRemediationOrderById,
  updateRemediationOrder,
  type RemediationActionDecision,
  type RemediationActionInput,
  type RemediationOrder,
  type RemediationOrderItem,
} from "@/features/attack/remediation-order";
import { RemediationOrderTitleDialog } from "@/features/attack/remediation-order/remediation-order-title-dialog";
import { cn, createRequestId } from "@/shared/lib/utils";
import { useToast } from "@/shared/ui/use-toast";

import {
  buildRemediationOrderDraftItemsFromInputs,
  getRemediationOrderCurrentRoundItems,
  getRemediationOrderHistoricalItems,
  remediationOrderLifecycleActions,
} from "../remediation-order-model";

import {
  RemediationOrderParameterPanel,
  remediationOrderActionLabel,
  validateRemediationOrderItemParameters,
} from "./remediation-order-parameter-editor";
import { RemediationOrderAuthorityReference } from "./remediation-order-authority-reference";
import { RemediationOrderLifecycleDialogs } from "./remediation-order-lifecycle-dialogs";
import { RemediationOrderLifecyclePanel } from "./remediation-order-lifecycle-panel";
import {
  itemStatusPresentation,
  RemediationCaseExecutionPanel,
} from "./remediation-case-execution-panel";
import { remediationReadinessIssuePresentation } from "./remediation-order-readiness";
import {
  remediationActionIcon,
  remediationActionIconClassName,
} from "./remediation-action-icons";

interface RemediationOrderWorkspaceProps {
  onLoadingChange?: (loading: boolean) => void;
  onOrderLoaded?: (order: RemediationOrder) => void;
  orderId: string;
  refreshKey?: number;
  titleEditRequestKey?: number;
}

function requestErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function orderSourceType(sourceType: string | number) {
  const normalized = String(sourceType).trim().toLowerCase();
  if (normalized === "2" || normalized.includes("drill")) return "drill_graph";
  if (normalized === "3" || normalized.includes("locate"))
    return "locate_graph";
  return "case_graph";
}

function orderScopeType(sourceType: string | number) {
  return orderSourceType(sourceType) === "locate_graph"
    ? "positioning"
    : "case";
}

// An Order retains completed Rounds as execution history. The editable
// workspace must never render those historical Items as the current Draft.
function currentRoundItems(order: RemediationOrder | null) {
  if (!order) return [];
  return getRemediationOrderCurrentRoundItems(order);
}

function basename(value: string) {
  const normalized = value.trim().replace(/[\\/]+$/, "");
  if (!normalized) return "未命名目标";
  return normalized.split(/[\\/]/).filter(Boolean).pop() || normalized;
}

function shortId(value: string, left = 8, right = 4) {
  const normalized = value.trim();
  if (normalized.length <= left + right + 3) return normalized || "-";
  return `${normalized.slice(0, left)}...${normalized.slice(-right)}`;
}

function itemTargetText(item: RemediationOrderItem) {
  return (
    item.display_name.trim() || item.object_id.trim() || item.node_key.trim()
  );
}

function statusBadge(
  item: RemediationOrderItem,
  validationError: string,
  decision: RemediationActionDecision | null | undefined,
  t: (key: string) => string,
) {
  const status = item.status.trim().toLowerCase();
  const reasonCode = item.reason_code.trim().toUpperCase();
  const agentDecision = decision?.agent_decisions.find(
    (candidate) => candidate.agent_id === item.agent_id,
  );
  if (
    reasonCode === "WAIT_EXISTING_REMEDIATION" ||
    (agentDecision?.draft_selectable &&
      agentDecision.current_effect_state === "same_action_in_flight")
  ) {
    return {
      label: t("workspace.processing"),
      className: "bg-blue-50 text-blue-700",
    };
  }
  if (
    agentDecision?.draft_selectable &&
    agentDecision.current_effect_state === "satisfied"
  ) {
    return {
      label: t("workspace.satisfied"),
      className: "bg-emerald-50 text-emerald-700",
    };
  }
  if (
    reasonCode === "REMEDIATION_RESULT_UNCERTAIN" ||
    (agentDecision?.draft_selectable &&
      agentDecision.current_effect_state === "uncertain")
  ) {
    return {
      label: t("workspace.willRetry"),
      className: "bg-amber-50 text-amber-700",
    };
  }
  if (["pending", "dispatched", "running"].includes(status)) {
    return {
      label: t("workspace.executing"),
      className: "bg-blue-50 text-blue-700",
    };
  }
  if (status === "blocked") {
    return {
      label: t("workspace.blocked"),
      className: "bg-red-50 text-red-700",
    };
  }
  if (validationError) {
    const issue = remediationReadinessIssuePresentation(validationError);
    return { label: issue.badge, className: issue.badgeClassName };
  }
  return {
    label: t("workspace.submittable"),
    className: "bg-emerald-50 text-emerald-700",
  };
}

export function RemediationOrderWorkspace({
  onLoadingChange,
  onOrderLoaded,
  orderId,
  refreshKey = 0,
  titleEditRequestKey = 0,
}: RemediationOrderWorkspaceProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("pages.collection.orchestration");
  const { toast } = useToast();
  const [order, setOrder] = useState<RemediationOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [actionInputs, setActionInputs] = useState<
    Record<string, RemediationActionInput>
  >({});
  const [reverseSourceIds, setReverseSourceIds] = useState<
    Record<string, string>
  >({});
  const [decisions, setDecisions] = useState<
    Record<string, RemediationActionDecision | null>
  >({});
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [dirtyItemIds, setDirtyItemIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [working, setWorking] = useState("");
  const [pollError, setPollError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [titleDialogOpen, setTitleDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState(() =>
    t("workspace.defaultCancelReason"),
  );
  const mutationRequestIds = useRef<Record<string, string>>({});
  const titleEditRequestRef = useRef(titleEditRequestKey);
  const activeItems = useMemo(() => currentRoundItems(order), [order]);
  const historicalItems = useMemo(
    () => (order ? getRemediationOrderHistoricalItems(order) : []),
    [order],
  );

  function mutationRequestId(operation: string) {
    const current = mutationRequestIds.current[operation];
    if (current) return current;
    const created = createRequestId();
    mutationRequestIds.current[operation] = created;
    return created;
  }

  function clearMutationRequestId(operation: string) {
    delete mutationRequestIds.current[operation];
  }

  const applyOrder = useCallback(
    (nextOrder: RemediationOrder) => {
      const nextActiveItems = currentRoundItems(nextOrder);
      setOrder(nextOrder);
      setActionInputs(
        Object.fromEntries(
          nextActiveItems.map((item) => [
            item.item_id,
            item.action_input ?? {},
          ]),
        ),
      );
      setReverseSourceIds(
        Object.fromEntries(
          nextActiveItems.map((item) => [
            item.item_id,
            item.reverse_source_id || "",
          ]),
        ),
      );
      setDirtyItemIds(new Set());
      setSelectedItemId((current) =>
        nextOrder.items.some((item) => item.item_id === current)
          ? current
          : (nextActiveItems[0]?.item_id ?? ""),
      );
      onOrderLoaded?.(nextOrder);
    },
    [onOrderLoaded],
  );

  useEffect(() => {
    let cancelled = false;
    const normalizedOrderId = orderId.trim();
    if (!normalizedOrderId) {
      setOrder(null);
      setLoading(false);
      setError(t("workspace.missingOrderId"));
      onLoadingChange?.(false);
      return;
    }

    setLoading(true);
    setError("");
    onLoadingChange?.(true);
    void queryRemediationOrderById({ order_id: normalizedOrderId })
      .then((nextOrder) => {
        if (cancelled) return;
        applyOrder(nextOrder);
      })
      .catch((cause) => {
        if (!cancelled) {
          setOrder(null);
          setError(requestErrorMessage(cause, t("workspace.loadFailed")));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          onLoadingChange?.(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [applyOrder, onLoadingChange, orderId, refreshKey]);

  useEffect(() => {
    if (!remediationOrderLifecycleActions(order).poll || !order?.order_id)
      return;
    let cancelled = false;
    let polling = false;
    const poll = async () => {
      if (polling || cancelled) return;
      polling = true;
      try {
        const nextOrder = await queryRemediationOrderById({
          order_id: order.order_id,
        });
        if (!cancelled) {
          setPollError("");
          applyOrder(nextOrder);
        }
      } catch (cause) {
        if (!cancelled)
          setPollError(requestErrorMessage(cause, t("workspace.loadFailed")));
      } finally {
        polling = false;
      }
    };
    const timer = window.setInterval(() => void poll(), 3_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [applyOrder, order]);

  useEffect(() => {
    if (!activeItems.length || order?.status.trim().toLowerCase() !== "draft") {
      setDecisions({});
      return;
    }
    const scopeId =
      order.source.source_ref_id.trim() || order.source.case_id.trim();
    if (!scopeId) return;

    let cancelled = false;
    setDecisionLoading(true);
    const sourceType = orderSourceType(order.source.source_type);
    const scopeType = orderScopeType(order.source.source_type);
    void Promise.allSettled(
      activeItems.map(async (item) => {
        const result = await queryRemediationNodeActions({
          ...(order.tenant_id.trim() ? { tenant_id: order.tenant_id } : {}),
          source_type: sourceType,
          scope_type: scopeType,
          scope_id: scopeId,
          node_key: item.node_key,
        });
        return {
          itemId: item.item_id,
          decision:
            result.node.actions.find(
              (candidate) => candidate.action.action_code === item.action_code,
            ) ?? null,
        };
      }),
    )
      .then((results) => {
        if (cancelled) return;
        const next: Record<string, RemediationActionDecision | null> = {};
        results.forEach((result, index) => {
          const itemId = activeItems[index]?.item_id;
          if (!itemId) return;
          next[itemId] =
            result.status === "fulfilled" ? result.value.decision : null;
        });
        setDecisions(next);
      })
      .finally(() => {
        if (!cancelled) setDecisionLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeItems, order]);

  useEffect(() => {
    if (titleEditRequestKey === titleEditRequestRef.current) return;
    titleEditRequestRef.current = titleEditRequestKey;
    if (order?.status.trim().toLowerCase() !== "draft") return;
    if (dirtyItemIds.size > 0) {
      toast({
        title: t("workspace.saveParametersFirst"),
        description: t("workspace.saveParametersFirstDescription"),
      });
      return;
    }
    setTitleDialogOpen(true);
  }, [dirtyItemIds.size, order?.status, titleEditRequestKey, toast]);

  const validationErrors = useMemo(() => {
    if (!order) return {};
    const draft = order.status.trim().toLowerCase() === "draft";
    return Object.fromEntries(
      activeItems.map((item) => {
        const input = actionInputs[item.item_id] ?? item.action_input ?? {};
        const reverseSourceItemId =
          reverseSourceIds[item.item_id] ?? item.reverse_source_id ?? "";
        const parameterError = draft
          ? validateRemediationOrderItemParameters({
              actionInput: input,
              decision: decisions[item.item_id],
              item,
              reverseSourceItemId,
            })
          : "";
        const statusError =
          item.status.trim().toLowerCase() === "blocked"
            ? item.reason_message ||
              item.reason_code ||
              t("workspace.targetUnavailable")
            : "";
        return [item.item_id, parameterError || statusError];
      }),
    );
  }, [actionInputs, activeItems, decisions, order, reverseSourceIds]);

  const visibleItems = useMemo(() => {
    if (!order) return [];
    const keyword = query.trim().toLocaleLowerCase();
    if (!keyword) return activeItems;
    return activeItems.filter((item) =>
      [
        itemTargetText(item),
        item.agent_id,
        item.action_code,
        remediationOrderActionLabel(item),
      ].some((value) => value.toLocaleLowerCase().includes(keyword)),
    );
  }, [activeItems, order, query]);
  const visibleHistoricalItems = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase();
    if (!keyword) return historicalItems;
    return historicalItems.filter((item) =>
      [
        itemTargetText(item),
        item.agent_id,
        item.action_code,
        remediationOrderActionLabel(item),
      ].some((value) => value.toLocaleLowerCase().includes(keyword)),
    );
  }, [historicalItems, query]);

  const selectedItem =
    order?.items.find((item) => item.item_id === selectedItemId) ??
    activeItems[0] ??
    null;
  const selectedIsHistorical = Boolean(
    selectedItem && selectedItem.round_no !== order?.current_round,
  );
  const selectedInput = selectedItem
    ? selectedIsHistorical
      ? selectedItem.action_input ?? {}
      : (actionInputs[selectedItem.item_id] ?? selectedItem.action_input ?? {})
    : {};
  const lifecycle = remediationOrderLifecycleActions(order);
  const editable = lifecycle.edit;
  const total = activeItems.length;
  const complete = activeItems.filter(
    (item) => !validationErrors[item.item_id],
  ).length;
  const firstIncomplete =
    activeItems.find((item) => validationErrors[item.item_id]) ?? null;
  const parameterDisabled = !editable || selectedIsHistorical;
  const selectedIsFileRestore =
    selectedItem?.action_code.trim().toLowerCase() === "file.restore";

  function updateActionInput(itemId: string, input: RemediationActionInput) {
    clearMutationRequestId("save");
    setActionInputs((current) => ({ ...current, [itemId]: input }));
    setDirtyItemIds((current) => new Set(current).add(itemId));
  }

  function updateReverseSource(itemId: string, sourceItemId: string) {
    clearMutationRequestId("save");
    setReverseSourceIds((current) => ({ ...current, [itemId]: sourceItemId }));
    setDirtyItemIds((current) => new Set(current).add(itemId));
  }

  const selectedAuthorityReference = selectedItem ? (
    <RemediationOrderAuthorityReference
      actionInput={selectedInput}
      decision={
        selectedIsHistorical ? undefined : decisions[selectedItem.item_id]
      }
      disabled={parameterDisabled}
      item={selectedItem}
      onActionInputChange={(input) => {
        if (!selectedIsHistorical) updateActionInput(selectedItem.item_id, input);
      }}
      onReverseSourceChange={(sourceItemId) => {
        if (!selectedIsHistorical) {
          updateReverseSource(selectedItem.item_id, sourceItemId);
        }
      }}
      reverseSourceItemId={
        selectedIsHistorical
          ? selectedItem.reverse_source_id ?? ""
          : (reverseSourceIds[selectedItem.item_id] ??
            selectedItem.reverse_source_id ??
            "")
      }
      sourceItems={order?.items ?? []}
    />
  ) : null;

  async function persistDraft(
    baseOrder: RemediationOrder,
    title = baseOrder.title,
  ) {
    return updateRemediationOrder({
      request_id: mutationRequestId("save"),
      order_id: baseOrder.order_id,
      expected_revision: baseOrder.revision,
      title,
      source: baseOrder.source,
      items: buildRemediationOrderDraftItemsFromInputs(
        { ...baseOrder, items: currentRoundItems(baseOrder) },
        actionInputs,
        reverseSourceIds,
      ),
    });
  }

  async function handleSaveDraft() {
    if (!order || !lifecycle.edit || working) return;
    setWorking("save");
    try {
      const nextOrder = await persistDraft(order);
      applyOrder(nextOrder);
      clearMutationRequestId("save");
      toast({ title: t("workspace.draftSaved") });
    } catch (cause) {
      toast({
        title: t("workspace.draftSaveFailed"),
        description: requestErrorMessage(cause, t("workspace.draftSaveFailed")),
        variant: "destructive",
      });
    } finally {
      setWorking("");
    }
  }

  async function handleSaveTitle(title: string) {
    if (!order || !lifecycle.edit || working) return;
    if (dirtyItemIds.size > 0) {
      toast({
        title: t("workspace.saveParametersFirst"),
        description: t("workspace.saveParametersFirstDescription"),
      });
      return;
    }
    setWorking("rename-title");
    try {
      clearMutationRequestId("save");
      const nextOrder = await persistDraft(order, title);
      applyOrder(nextOrder);
      clearMutationRequestId("save");
      setTitleDialogOpen(false);
      toast({ title: t("workspace.orderTitleSaved") });
    } catch (cause) {
      toast({
        title: t("workspace.orderTitleSaveFailed"),
        description: requestErrorMessage(
          cause,
          t("workspace.orderTitleSaveFailed"),
        ),
        variant: "destructive",
      });
    } finally {
      setWorking("");
    }
  }

  async function handlePrepare() {
    if (!order || !lifecycle.prepare || working) return;
    if (lifecycle.edit && (complete !== total || total === 0)) {
      if (firstIncomplete) onSelectIncompleteItem(firstIncomplete.item_id);
      return;
    }
    setWorking("prepare");
    try {
      let draft = order;
      if (lifecycle.edit && dirtyItemIds.size > 0) {
        draft = await persistDraft(order);
        applyOrder(draft);
        clearMutationRequestId("save");
      }
      const nextOrder = await prepareRemediationOrder({
        request_id: mutationRequestId("prepare"),
        order_id: draft.order_id,
        revision: draft.revision,
      });
      applyOrder(nextOrder);
      clearMutationRequestId("prepare");
      if (nextOrder.confirmable) {
        setConfirmDialogOpen(true);
      } else {
        toast({
          title: t("workspace.prepareBlocked"),
          description: t("workspace.prepareBlockedDescription"),
          variant: "destructive",
        });
      }
    } catch (cause) {
      toast({
        title: t("workspace.prepareFailed"),
        description: requestErrorMessage(cause, t("workspace.prepareFailed")),
        variant: "destructive",
      });
    } finally {
      setWorking("");
    }
  }

  async function handleConfirm() {
    if (!order || !lifecycle.confirm || working) return;
    setWorking("confirm");
    try {
      const nextOrder = await confirmRemediationOrder({
        request_id: mutationRequestId("confirm"),
        order_id: order.order_id,
        revision: order.revision,
        prepared_fingerprint_version: order.prepared_fingerprint_version,
        prepared_fingerprint: order.prepared_fingerprint,
      });
      applyOrder(nextOrder);
      clearMutationRequestId("confirm");
      setConfirmDialogOpen(false);
      toast({
        title:
          nextOrder.status === "completed"
            ? t("workspace.completed")
            : t("workspace.submitted"),
        description: t("workspace.submittedDescription"),
      });
    } catch (cause) {
      toast({
        title: t("workspace.confirmFailed"),
        description: requestErrorMessage(cause, t("workspace.confirmFailed")),
        variant: "destructive",
      });
    } finally {
      setWorking("");
    }
  }

  async function handleCancel() {
    if (!order || !lifecycle.cancel || working || !cancelReason.trim()) return;
    setWorking("cancel");
    try {
      const nextOrder = await cancelRemediationOrder({
        request_id: mutationRequestId("cancel"),
        order_id: order.order_id,
        revision: order.revision,
        reason: cancelReason.trim(),
      });
      applyOrder(nextOrder);
      clearMutationRequestId("cancel");
      setCancelDialogOpen(false);
      toast({ title: t("workspace.submissionAbandoned") });
    } catch (cause) {
      toast({
        title: t("workspace.abandonFailed"),
        description: requestErrorMessage(cause, t("workspace.abandonFailed")),
        variant: "destructive",
      });
    } finally {
      setWorking("");
    }
  }

  async function handleDeleteDraft() {
    if (!order || !lifecycle.delete || working) return;
    setWorking("delete");
    try {
      await deleteRemediationOrder({
        request_id: mutationRequestId("delete"),
        order_id: order.order_id,
        expected_revision: order.revision,
      });
      setDeleteDialogOpen(false);
      clearMutationRequestId("delete");
      toast({ title: t("workspace.draftDeleted") });
      router.back();
    } catch (cause) {
      toast({
        title: t("workspace.deleteFailed"),
        description: requestErrorMessage(cause, t("workspace.deleteFailed")),
        variant: "destructive",
      });
    } finally {
      setWorking("");
    }
  }

  function onSelectIncompleteItem(itemId: string) {
    setSelectedItemId(itemId);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    document.getElementById("remediation-order-parameters")?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  if (loading) {
    return (
      <section className="flex min-h-[420px] items-center justify-center rounded-[22px] border border-slate-200 bg-white text-sm text-slate-500 shadow-[0_16px_45px_-36px_rgba(15,23,42,0.45)]">
        <Loader2
          className="mr-2 size-4 animate-spin text-teal-600"
          aria-hidden
        />
        {t("workspace.loading")}
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="flex min-h-[280px] flex-col items-center justify-center rounded-[22px] border border-red-200 bg-white px-6 text-center shadow-[0_16px_45px_-36px_rgba(15,23,42,0.45)]">
        <AlertTriangle className="size-8 text-red-500" aria-hidden />
        <h2 className="mt-3 text-sm font-semibold text-slate-900">
          {t("workspace.loadFailed")}
        </h2>
        <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
          {error || t("workspace.notFound")}
        </p>
      </section>
    );
  }

  return (
    <>
      <section
        aria-label={t("workspace.ariaLabel")}
        className="grid min-w-0 items-stretch gap-4 xl:grid-cols-[minmax(300px,0.74fr)_minmax(460px,1.2fr)_minmax(360px,1fr)]"
      >
        <TargetListPanel
          decisions={decisions}
          historicalItems={visibleHistoricalItems}
          historicalTotal={historicalItems.length}
          items={visibleItems}
          query={query}
          selectedItemId={selectedItem?.item_id ?? ""}
          setQuery={setQuery}
          setSelectedItemId={setSelectedItemId}
          total={total}
          validationErrors={validationErrors}
        />

        <section
          id="remediation-order-parameters"
          className="flex h-full min-h-0 min-w-0 flex-col rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_16px_45px_-36px_rgba(15,23,42,0.45)]"
        >
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
              <SlidersHorizontal
                className="size-4 text-violet-600"
                aria-hidden
              />
              {t("workspace.parameters")}
            </h2>
            {selectedItem ? (
              <span className="flex min-w-0 max-w-[65%] items-center gap-2">
                {selectedIsHistorical ? (
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                    {t("workspace.readOnly")}
                  </span>
                ) : null}
                <span
                  className="truncate rounded-full bg-slate-950 px-3 py-1 text-[11px] font-semibold text-white"
                  title={remediationOrderActionLabel(selectedItem, locale)}
                >
                  {remediationOrderActionLabel(selectedItem, locale)}
                </span>
              </span>
            ) : null}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {selectedItem ? (
              <div className="pt-4">
                {!selectedIsFileRestore ? selectedAuthorityReference : null}
                <RemediationOrderParameterPanel
                  key={`${selectedItem.item_id}:${order.revision}`}
                  actionInput={selectedInput}
                  disabled={parameterDisabled}
                  item={selectedItem}
                  onActionInputChange={(input) => {
                    if (!selectedIsHistorical) {
                      updateActionInput(selectedItem.item_id, input);
                    }
                  }}
                />
                {selectedIsFileRestore ? selectedAuthorityReference : null}
              </div>
            ) : (
              <div className="flex min-h-full items-center justify-center text-sm text-slate-400">
                {t("workspace.noTargets")}
              </div>
            )}
          </div>
        </section>

        <RemediationOrderLifecyclePanel
          complete={complete}
          decisionLoading={decisionLoading}
          dirty={dirtyItemIds.size > 0}
          firstIncomplete={firstIncomplete}
          onCancel={() => setCancelDialogOpen(true)}
          onConfirm={() => setConfirmDialogOpen(true)}
          onDelete={() => setDeleteDialogOpen(true)}
          onPrepare={() => void handlePrepare()}
          onSave={() => void handleSaveDraft()}
          onSelectItem={onSelectIncompleteItem}
          order={order}
          pollError={pollError}
          total={total}
          validationErrors={validationErrors}
          working={working}
        />
      </section>

      <RemediationCaseExecutionPanel order={order} />

      <RemediationOrderLifecycleDialogs
        cancelOpen={cancelDialogOpen}
        cancelReason={cancelReason}
        confirmOpen={confirmDialogOpen}
        confirmOrder={order}
        deleteOpen={deleteDialogOpen}
        onCancel={() => void handleCancel()}
        onCancelOpenChange={setCancelDialogOpen}
        onCancelReasonChange={(reason) => {
          clearMutationRequestId("cancel");
          setCancelReason(reason);
        }}
        onConfirm={() => void handleConfirm()}
        onConfirmOpenChange={setConfirmDialogOpen}
        onDelete={() => void handleDeleteDraft()}
        onDeleteOpenChange={setDeleteDialogOpen}
        working={working}
      />

      <RemediationOrderTitleDialog
        defaultTitle={order.title}
        mode="rename"
        onOpenChange={setTitleDialogOpen}
        onSubmit={handleSaveTitle}
        open={titleDialogOpen}
        submitting={working === "rename-title"}
      />
    </>
  );
}
function TargetListPanel({
  decisions,
  historicalItems,
  historicalTotal,
  items,
  query,
  selectedItemId,
  setQuery,
  setSelectedItemId,
  total,
  validationErrors,
}: {
  decisions: Record<string, RemediationActionDecision | null>;
  historicalItems: RemediationOrderItem[];
  historicalTotal: number;
  items: RemediationOrderItem[];
  query: string;
  selectedItemId: string;
  setQuery: (query: string) => void;
  setSelectedItemId: (itemId: string) => void;
  total: number;
  validationErrors: Record<string, string>;
}) {
  const locale = useLocale();
  const t = useTranslations("pages.collection.orchestration");
  const hostIdLabel = t("workspace.hostId");
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const showHistoryItems = historyExpanded || Boolean(query.trim());
  return (
    <aside className="flex h-full min-h-0 min-w-0 flex-col rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_16px_45px_-36px_rgba(15,23,42,0.45)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
          <Crosshair className="size-4 text-blue-600" aria-hidden />
          {t("workspace.targets")}
        </h2>
        <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-slate-950 px-2 py-1 text-[11px] font-bold text-white">
          {total + historicalTotal}
        </span>
      </div>
      <label className="mt-4 flex h-10 items-center rounded-full border border-slate-200 bg-slate-50 px-3 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-100">
        <Search className="size-4 shrink-0 text-slate-400" aria-hidden />
        <span className="sr-only">{t("workspace.searchTargets")}</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("workspace.searchPlaceholder")}
          className="min-w-0 flex-1 bg-transparent px-2 text-xs text-slate-700 outline-none placeholder:text-slate-400"
        />
      </label>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="mb-2 flex items-center justify-between px-1 text-[11px] font-semibold text-slate-500">
          <span>{t("workspace.currentRound")}</span>
          <span className="tabular-nums">{total}</span>
        </div>
        <div className="space-y-3">
          {items.length ? (
            items.map((item) => {
              const selected = item.item_id === selectedItemId;
              const Icon = remediationActionIcon(item.action_code);
              const badge = statusBadge(
                item,
                validationErrors[item.item_id],
                decisions[item.item_id],
                t,
              );
              return (
                <button
                  key={item.item_id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelectedItemId(item.item_id)}
                  className={cn(
                    "group w-full rounded-2xl border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2",
                    selected
                      ? "border-teal-500 bg-teal-50/80"
                      : validationErrors[item.item_id]
                        ? "border-amber-300 bg-white hover:bg-amber-50/40"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center",
                        remediationActionIconClassName(item.action_code),
                      )}
                    >
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span
                          className="truncate text-sm font-semibold text-slate-950"
                          title={itemTargetText(item)}
                        >
                          {basename(itemTargetText(item))}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold",
                            badge.className,
                          )}
                        >
                          {badge.label}
                        </span>
                      </span>
                      <span className="mt-1 block truncate text-xs font-semibold text-slate-700">
                        {remediationOrderActionLabel(item, locale)}
                      </span>
                      <span
                        className="mt-2 block truncate font-mono text-[11px] text-slate-500"
                        title={item.agent_id}
                      >
                        {hostIdLabel}&nbsp; {shortId(item.agent_id)}
                      </span>
                    </span>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-xs text-slate-400">
              {query
                ? t("workspace.noMatchedTargets")
                : t("workspace.noTargets")}
            </div>
          )}
        </div>

        {historicalTotal > 0 ? (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <button
              type="button"
              aria-expanded={showHistoryItems}
              onClick={() => setHistoryExpanded((expanded) => !expanded)}
              className="flex min-h-10 w-full items-center gap-2 rounded-xl px-1 text-left text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              {showHistoryItems ? (
                <ChevronDown className="size-4 shrink-0" aria-hidden />
              ) : (
                <ChevronRight className="size-4 shrink-0" aria-hidden />
              )}
              <History className="size-4 shrink-0 text-slate-400" aria-hidden />
              <span className="min-w-0 flex-1">
                {t("workspace.historyTargets")}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] tabular-nums text-slate-600">
                {historicalTotal}
              </span>
              <span className="text-[10px] font-medium text-slate-400">
                {t("workspace.readOnly")}
              </span>
            </button>

            {showHistoryItems ? (
              <div className="mt-2 space-y-2">
                {historicalItems.length ? (
                  historicalItems.map((item) => {
                    const Icon = remediationActionIcon(item.action_code);
                    const status = itemStatusPresentation(item, locale);
                    return (
                      <button
                        key={item.item_id}
                        type="button"
                        aria-pressed={item.item_id === selectedItemId}
                        onClick={() => setSelectedItemId(item.item_id)}
                        className={cn(
                          "w-full rounded-2xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2",
                          item.item_id === selectedItemId
                            ? "border-slate-500 bg-slate-100"
                            : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-100/80",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center opacity-75",
                              remediationActionIconClassName(item.action_code),
                            )}
                          >
                            <Icon className="size-[18px]" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-2">
                              <span
                                className="truncate text-xs font-semibold text-slate-800"
                                title={itemTargetText(item)}
                              >
                                {basename(itemTargetText(item))}
                              </span>
                              <span
                                className={cn(
                                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                                  status.className,
                                )}
                              >
                                {status.label}
                              </span>
                            </span>
                            <span className="mt-1 block truncate text-[11px] font-semibold text-slate-600">
                              {remediationOrderActionLabel(item, locale)}
                            </span>
                            <span className="mt-1.5 flex min-w-0 items-center justify-between gap-2 text-[10px] text-slate-500">
                              <span
                                className="min-w-0 truncate font-mono"
                                title={item.agent_id}
                              >
                                {hostIdLabel}&nbsp; {shortId(item.agent_id)}
                              </span>
                              <span className="shrink-0 font-medium">
                                {t("workspace.roundLabel", {
                                  round: item.round_no,
                                })}
                              </span>
                            </span>
                          </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
                    {t("workspace.noMatchedHistory")}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
