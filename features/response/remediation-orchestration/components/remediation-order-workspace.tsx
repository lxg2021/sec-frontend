"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Boxes,
  CalendarCheck2,
  ChevronRight,
  Cog,
  Database,
  FileText,
  Loader2,
  Network,
  Search,
  ShieldCheck,
  UserRound,
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
import { cn, createRequestId } from "@/shared/lib/utils";
import { useToast } from "@/shared/ui/use-toast";

import {
  buildRemediationOrderDraftItemsFromInputs,
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

interface RemediationOrderWorkspaceProps {
  onLoadingChange?: (loading: boolean) => void;
  onOrderLoaded?: (order: RemediationOrder) => void;
  orderId: string;
  refreshKey?: number;
}

type ItemIcon = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

function requestErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "处置草稿加载失败";
}

function orderSourceType(sourceType: string | number) {
  const normalized = String(sourceType).trim().toLowerCase();
  if (normalized === "2" || normalized.includes("drill")) return "drill_graph";
  if (normalized === "3" || normalized.includes("locate")) return "locate_graph";
  return "case_graph";
}

function orderScopeType(sourceType: string | number) {
  return orderSourceType(sourceType) === "locate_graph" ? "positioning" : "case";
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
  return item.display_name.trim() || item.object_id.trim() || item.node_key.trim();
}

function itemIcon(entityType: string): ItemIcon {
  const type = entityType.trim().toLowerCase();
  if (type.includes("file") || type.includes("ea") || type.includes("ads")) {
    return FileText;
  }
  if (type.includes("task") || type.includes("scheduled")) return CalendarCheck2;
  if (type.includes("service")) return Cog;
  if (type.includes("account") || type.includes("user")) return UserRound;
  if (type.includes("registry")) return Database;
  if (type.includes("wmi") || type.includes("bits")) return Boxes;
  if (type.includes("net") || type.includes("dns") || type.includes("url")) {
    return Network;
  }
  return ShieldCheck;
}

function iconTone(entityType: string) {
  const type = entityType.trim().toLowerCase();
  if (type.includes("file")) return "bg-teal-100 text-teal-700";
  if (type.includes("task")) return "bg-blue-50 text-blue-600";
  if (type.includes("service")) return "bg-violet-50 text-violet-600";
  if (type.includes("wmi")) return "bg-orange-50 text-orange-700";
  return "bg-slate-100 text-slate-600";
}

function statusBadge(
  item: RemediationOrderItem,
  validationError: string,
) {
  const status = item.status.trim().toLowerCase();
  if (["pending", "dispatched", "running"].includes(status)) {
    return { label: "执行中", className: "bg-blue-50 text-blue-700" };
  }
  if (status === "blocked") {
    return { label: "已阻止", className: "bg-red-50 text-red-700" };
  }
  if (validationError) {
    return { label: "需配置", className: "bg-amber-100 text-amber-800" };
  }
  return { label: "完整", className: "bg-emerald-50 text-emerald-700" };
}

export function RemediationOrderWorkspace({
  onLoadingChange,
  onOrderLoaded,
  orderId,
  refreshKey = 0,
}: RemediationOrderWorkspaceProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [order, setOrder] = useState<RemediationOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [actionInputs, setActionInputs] = useState<Record<string, RemediationActionInput>>({});
  const [reverseSourceIds, setReverseSourceIds] = useState<Record<string, string>>({});
  const [decisions, setDecisions] = useState<Record<string, RemediationActionDecision | null>>({});
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [dirtyItemIds, setDirtyItemIds] = useState<Set<string>>(() => new Set());
  const [working, setWorking] = useState("");
  const [pollError, setPollError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("操作员取消已准备的处置单");
  const mutationRequestIds = useRef<Record<string, string>>({});

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
      setOrder(nextOrder);
      setActionInputs(
        Object.fromEntries(
          nextOrder.items.map((item) => [item.item_id, item.action_input ?? {}]),
        ),
      );
      setReverseSourceIds(
        Object.fromEntries(
          nextOrder.items.map((item) => [item.item_id, item.reverse_source_id || ""]),
        ),
      );
      setDirtyItemIds(new Set());
      setSelectedItemId((current) =>
        nextOrder.items.some((item) => item.item_id === current)
          ? current
          : nextOrder.items[0]?.item_id ?? "",
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
      setError("缺少 order_id，无法加载处置草稿。");
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
          setError(requestErrorMessage(cause));
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
    if (!remediationOrderLifecycleActions(order).poll || !order?.order_id) return;
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
        if (!cancelled) setPollError(requestErrorMessage(cause));
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
    if (!order?.items.length || order.status.trim().toLowerCase() !== "draft") {
      setDecisions({});
      return;
    }
    const scopeId = order.source.source_ref_id.trim() || order.source.case_id.trim();
    if (!scopeId) return;

    let cancelled = false;
    setDecisionLoading(true);
    const sourceType = orderSourceType(order.source.source_type);
    const scopeType = orderScopeType(order.source.source_type);
    void Promise.allSettled(
      order.items.map(async (item) => {
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
          const itemId = order.items[index]?.item_id;
          if (!itemId) return;
          next[itemId] = result.status === "fulfilled" ? result.value.decision : null;
        });
        setDecisions(next);
      })
      .finally(() => {
        if (!cancelled) setDecisionLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [order]);

  const validationErrors = useMemo(() => {
    if (!order) return {};
    const draft = order.status.trim().toLowerCase() === "draft";
    return Object.fromEntries(
      order.items.map((item) => {
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
            ? item.reason_message || item.reason_code || "Prepare 已阻止该目标。"
            : "";
        return [item.item_id, parameterError || statusError];
      }),
    );
  }, [actionInputs, decisions, order, reverseSourceIds]);

  const visibleItems = useMemo(() => {
    if (!order) return [];
    const keyword = query.trim().toLocaleLowerCase();
    if (!keyword) return order.items;
    return order.items.filter((item) =>
      [
        itemTargetText(item),
        item.agent_id,
        item.action_code,
        remediationOrderActionLabel(item),
      ].some((value) => value.toLocaleLowerCase().includes(keyword)),
    );
  }, [order, query]);

  const selectedItem =
    order?.items.find((item) => item.item_id === selectedItemId) ??
    order?.items[0] ??
    null;
  const selectedInput = selectedItem
    ? actionInputs[selectedItem.item_id] ?? selectedItem.action_input ?? {}
    : {};
  const lifecycle = remediationOrderLifecycleActions(order);
  const editable = lifecycle.edit;
  const total = order?.items.length ?? 0;
  const complete = order
    ? order.items.filter((item) => !validationErrors[item.item_id]).length
    : 0;
  const firstIncomplete =
    order?.items.find((item) => validationErrors[item.item_id]) ?? null;

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

  async function persistDraft(baseOrder: RemediationOrder) {
    return updateRemediationOrder({
      request_id: mutationRequestId("save"),
      order_id: baseOrder.order_id,
      expected_revision: baseOrder.revision,
      title: baseOrder.title,
      source: baseOrder.source,
      items: buildRemediationOrderDraftItemsFromInputs(
        baseOrder,
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
      toast({ title: "处置草稿已保存" });
    } catch (cause) {
      toast({
        title: "保存处置草稿失败",
        description: requestErrorMessage(cause),
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
      toast({
        title: nextOrder.confirmable
          ? "Prepare 权威校验已完成"
          : "Prepare 已完成，存在不可执行目标",
        description: nextOrder.confirmable
          ? "计划已冻结，可以确认下发。"
          : "请查看 blocked 目标；如需修改，请取消后重新建立草稿。",
        variant: nextOrder.confirmable ? "default" : "destructive",
      });
    } catch (cause) {
      toast({
        title: "Prepare 权威校验失败",
        description: requestErrorMessage(cause),
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
        title: nextOrder.status === "completed" ? "处置已完成" : "处置已确认并进入执行队列",
        description: "Agent 离线不会阻止下发，页面会持续轮询执行状态。",
      });
    } catch (cause) {
      toast({
        title: "确认下发失败",
        description: requestErrorMessage(cause),
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
      toast({ title: "已取消 Prepared 处置单" });
    } catch (cause) {
      toast({
        title: "取消处置单失败",
        description: requestErrorMessage(cause),
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
      toast({ title: "处置草稿已删除" });
      router.back();
    } catch (cause) {
      toast({
        title: "删除处置草稿失败",
        description: requestErrorMessage(cause),
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
        <Loader2 className="mr-2 size-4 animate-spin text-teal-600" aria-hidden />
        正在加载处置草稿
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="flex min-h-[280px] flex-col items-center justify-center rounded-[22px] border border-red-200 bg-white px-6 text-center shadow-[0_16px_45px_-36px_rgba(15,23,42,0.45)]">
        <AlertTriangle className="size-8 text-red-500" aria-hidden />
        <h2 className="mt-3 text-sm font-semibold text-slate-900">处置草稿加载失败</h2>
        <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
          {error || "后台没有返回对应的 Remediation Order。"}
        </p>
      </section>
    );
  }

  return (
    <>
      <section
        aria-label="处置草稿工作区"
        className="grid min-w-0 gap-4 xl:grid-cols-[minmax(300px,0.74fr)_minmax(460px,1.2fr)_minmax(360px,1fr)]"
      >
      <TargetListPanel
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
        className="min-h-[620px] min-w-0 rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_16px_45px_-36px_rgba(15,23,42,0.45)]"
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <h2 className="text-base font-semibold text-slate-950">动作参数</h2>
          {selectedItem ? (
            <span
              className="max-w-[55%] truncate rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700"
              title={remediationOrderActionLabel(selectedItem)}
            >
              {remediationOrderActionLabel(selectedItem)}
            </span>
          ) : null}
        </div>
        {selectedItem ? (
          <div className="pt-4">
            <RemediationOrderAuthorityReference
              actionInput={selectedInput}
              decision={decisions[selectedItem.item_id]}
              disabled={!editable}
              item={selectedItem}
              onActionInputChange={(input) =>
                updateActionInput(selectedItem.item_id, input)
              }
              onReverseSourceChange={(sourceItemId) =>
                updateReverseSource(selectedItem.item_id, sourceItemId)
              }
              reverseSourceItemId={
                reverseSourceIds[selectedItem.item_id] ??
                selectedItem.reverse_source_id ??
                ""
              }
            />
            <RemediationOrderParameterPanel
              key={`${selectedItem.item_id}:${order.revision}`}
              actionInput={selectedInput}
              disabled={!editable}
              item={selectedItem}
              onActionInputChange={(input) =>
                updateActionInput(selectedItem.item_id, input)
              }
            />
          </div>
        ) : (
          <div className="flex min-h-[480px] items-center justify-center text-sm text-slate-400">
            当前处置单没有目标
          </div>
        )}
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

      <RemediationOrderLifecycleDialogs
        cancelOpen={cancelDialogOpen}
        cancelReason={cancelReason}
        confirmOpen={confirmDialogOpen}
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
    </>
  );
}
function TargetListPanel({
  items,
  query,
  selectedItemId,
  setQuery,
  setSelectedItemId,
  total,
  validationErrors,
}: {
  items: RemediationOrderItem[];
  query: string;
  selectedItemId: string;
  setQuery: (query: string) => void;
  setSelectedItemId: (itemId: string) => void;
  total: number;
  validationErrors: Record<string, string>;
}) {
  return (
    <aside className="flex min-h-[620px] min-w-0 flex-col rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_16px_45px_-36px_rgba(15,23,42,0.45)]">
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold text-slate-950">处置目标</h2>
        <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-slate-950 px-2 py-1 text-[11px] font-bold text-white">
          {total}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500">ControlPanel 已选择 Agent 和 Action</p>
      <label className="mt-4 flex h-10 items-center rounded-full border border-slate-200 bg-slate-50 px-3 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-100">
        <Search className="size-4 shrink-0 text-slate-400" aria-hidden />
        <span className="sr-only">搜索处置目标</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索目标、Agent 或动作"
          className="min-w-0 flex-1 bg-transparent px-2 text-xs text-slate-700 outline-none placeholder:text-slate-400"
        />
      </label>

      <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {items.length ? (
          items.map((item) => {
            const selected = item.item_id === selectedItemId;
            const Icon = itemIcon(item.entity_type);
            const badge = statusBadge(item, validationErrors[item.item_id]);
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
                  <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", iconTone(item.entity_type))}>
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
                      <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold", badge.className)}>
                        {badge.label}
                      </span>
                    </span>
                    <span className="mt-1 block truncate font-mono text-[11px] text-slate-500" title={item.agent_id}>
                      HostID&nbsp; {shortId(item.agent_id)}
                    </span>
                    <span className="mt-2 flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-semibold text-slate-600">
                        {remediationOrderActionLabel(item)}
                      </span>
                      {selected ? <ChevronRight className="size-4 shrink-0 text-teal-700" aria-hidden /> : null}
                    </span>
                  </span>
                </div>
              </button>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-xs text-slate-400">
            {query ? "没有匹配的处置目标" : "当前处置单没有目标"}
          </div>
        )}
      </div>
      <div className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-500">
        仅编辑当前处置单中的 Agent、Action 对应参数
      </div>
    </aside>
  );
}
