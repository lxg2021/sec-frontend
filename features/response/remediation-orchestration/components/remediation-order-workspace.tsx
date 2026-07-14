"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import {
  AlertTriangle,
  Boxes,
  CalendarCheck2,
  Check,
  CheckCircle2,
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
  queryRemediationNodeActions,
  queryRemediationOrderById,
  type RemediationActionDecision,
  type RemediationActionInput,
  type RemediationOrder,
  type RemediationOrderItem,
} from "@/features/attack/remediation-order";
import { cn } from "@/shared/lib/utils";

import {
  RemediationOrderParameterEditor,
  remediationOrderActionLabel,
  validateRemediationOrderItemParameters,
} from "./remediation-order-parameter-editor";

interface RemediationOrderWorkspaceProps {
  onLoadingChange?: (loading: boolean) => void;
  onOrderLoaded?: (order: RemediationOrder) => void;
  orderId: string;
  refreshKey?: number;
}

type ItemIcon = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

const PREPARE_CHECKS = [
  "Graph 节点与 Agent 权威上下文",
  "Capability、Current Effect 与对象状态",
  "历史来源、备份可用性与活动冲突",
  "动作参数、风险和 Prepared Fingerprint",
];

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

function itemEntityLabel(item: RemediationOrderItem) {
  const normalized = item.entity_type.trim().replace(/[\s_-]+/g, " ");
  return normalized ? normalized.toUpperCase() : "TARGET";
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

function orderStage(status: string) {
  const normalized = status.trim().toLowerCase();
  if (["running", "success", "failed", "partial", "completed"].includes(normalized)) {
    return 3;
  }
  if (["prepared", "ready", "confirmed"].includes(normalized)) return 2;
  return 1;
}

function stageBadge(status: string) {
  const normalized = status.trim().toLowerCase();
  const labels: Record<string, string> = {
    draft: "草稿阶段",
    prepared: "已准备",
    ready: "已准备",
    confirmed: "已确认",
    running: "执行中",
    success: "执行成功",
    failed: "执行失败",
    canceled: "已取消",
    expired: "已过期",
  };
  return labels[normalized] || normalized || "未知阶段";
}

export function RemediationOrderWorkspace({
  onLoadingChange,
  onOrderLoaded,
  orderId,
  refreshKey = 0,
}: RemediationOrderWorkspaceProps) {
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
  }, [onLoadingChange, onOrderLoaded, orderId, refreshKey]);

  useEffect(() => {
    if (!order?.items.length) {
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
    return Object.fromEntries(
      order.items.map((item) => {
        const input = actionInputs[item.item_id] ?? item.action_input ?? {};
        const reverseSourceItemId =
          reverseSourceIds[item.item_id] ?? item.reverse_source_id ?? "";
        const parameterError = validateRemediationOrderItemParameters({
          actionInput: input,
          decision: decisions[item.item_id],
          item,
          reverseSourceItemId,
        });
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
  const selectedReverseSourceId = selectedItem
    ? reverseSourceIds[selectedItem.item_id] ?? selectedItem.reverse_source_id ?? ""
    : "";
  const editable = order?.status.trim().toLowerCase() === "draft";
  const total = order?.items.length ?? 0;
  const complete = order
    ? order.items.filter((item) => !validationErrors[item.item_id]).length
    : 0;
  const firstIncomplete =
    order?.items.find((item) => validationErrors[item.item_id]) ?? null;

  function updateActionInput(itemId: string, input: RemediationActionInput) {
    setActionInputs((current) => ({ ...current, [itemId]: input }));
    setDirtyItemIds((current) => new Set(current).add(itemId));
  }

  function updateReverseSource(itemId: string, sourceItemId: string) {
    setReverseSourceIds((current) => ({ ...current, [itemId]: sourceItemId }));
    setDirtyItemIds((current) => new Set(current).add(itemId));
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
          <span className="text-xs text-slate-500">只编辑当前动作相关字段</span>
        </div>
        {selectedItem ? (
          <div className="pt-4">
            <div className="text-xs text-slate-400">当前目标</div>
            <div className="mt-1 flex min-w-0 items-center gap-3">
              <h3
                className="truncate text-base font-semibold text-slate-950"
                title={itemTargetText(selectedItem)}
              >
                {basename(itemTargetText(selectedItem))}
              </h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-500">
                {itemEntityLabel(selectedItem)}
              </span>
            </div>
            <div
              className="mt-1 truncate font-mono text-xs text-slate-500"
              title={itemTargetText(selectedItem)}
            >
              {itemTargetText(selectedItem)}
            </div>

            <div className="mt-4 grid overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 sm:grid-cols-2">
              <div className="min-w-0 px-4 py-3">
                <div className="text-xs text-slate-400">执行 Agent</div>
                <div className="mt-1 truncate font-mono text-xs font-semibold text-slate-700" title={selectedItem.agent_id}>
                  {selectedItem.agent_id || "-"}
                </div>
              </div>
              <div className="min-w-0 border-t border-slate-200 px-4 py-3 sm:border-l sm:border-t-0">
                <div className="text-xs text-slate-400">处置动作</div>
                <div className="mt-1 truncate text-xs font-semibold text-blue-700" title={selectedItem.action_code}>
                  {remediationOrderActionLabel(selectedItem)}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-blue-600" aria-hidden />
              <div>
                <div className="text-xs font-semibold">参数由处置页面补充</div>
                <div className="mt-1 text-xs leading-5 text-blue-600">
                  Agent 和 Action 来自 ControlPanel 的权威选择，此处不重新推断。
                </div>
              </div>
            </div>

            <div className="mt-4">
              <RemediationOrderParameterEditor
                key={`${selectedItem.item_id}:${order.revision}`}
                actionInput={selectedInput}
                decision={decisions[selectedItem.item_id]}
                disabled={!editable}
                item={selectedItem}
                onActionInputChange={(input) =>
                  updateActionInput(selectedItem.item_id, input)
                }
                onReverseSourceItemIdChange={(sourceItemId) =>
                  updateReverseSource(selectedItem.item_id, sourceItemId)
                }
                reverseSourceItemId={selectedReverseSourceId}
              />
            </div>

            <div
              role="status"
              className={cn(
                "mt-4 flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs font-medium leading-5",
                validationErrors[selectedItem.item_id]
                  ? "bg-amber-50 text-amber-800"
                  : "bg-emerald-50 text-emerald-700",
              )}
            >
              {validationErrors[selectedItem.item_id] ? (
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              ) : (
                <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
              )}
              {validationErrors[selectedItem.item_id] ||
                (dirtyItemIds.has(selectedItem.item_id)
                  ? "当前目标参数完整，修改等待保存到草稿。"
                  : "当前目标参数完整。")}
            </div>
          </div>
        ) : (
          <div className="flex min-h-[480px] items-center justify-center text-sm text-slate-400">
            当前处置单没有目标
          </div>
        )}
      </section>

      <PreparePanel
        complete={complete}
        decisionLoading={decisionLoading}
        firstIncomplete={firstIncomplete}
        onSelectItem={setSelectedItemId}
        order={order}
        total={total}
        validationErrors={validationErrors}
      />
    </section>
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

function PreparePanel({
  complete,
  decisionLoading,
  firstIncomplete,
  onSelectItem,
  order,
  total,
  validationErrors,
}: {
  complete: number;
  decisionLoading: boolean;
  firstIncomplete: RemediationOrderItem | null;
  onSelectItem: (itemId: string) => void;
  order: RemediationOrder;
  total: number;
  validationErrors: Record<string, string>;
}) {
  const stage = orderStage(order.status);
  const percent = total ? Math.round((complete / total) * 100) : 0;

  return (
    <aside
      id="remediation-order-prepare"
      className="min-h-[620px] min-w-0 rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_16px_45px_-36px_rgba(15,23,42,0.45)]"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-950">准备与执行</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600">
          {stageBadge(order.status)}
        </span>
      </div>

      <div className="mt-7 flex items-center" aria-label={`当前处置阶段：第 ${stage} 阶段`}>
        {["草稿", "准备", "执行"].map((label, index) => {
          const step = index + 1;
          const active = step <= stage;
          return (
            <div key={label} className={cn("flex items-center", index < 2 && "flex-1")}>
              <span className={cn("flex items-center gap-2", index > 0 && "pl-2")}>
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full border-2 text-[10px] font-bold",
                    active
                      ? "border-teal-600 bg-teal-600 text-white"
                      : "border-slate-300 bg-white text-slate-500",
                  )}
                >
                  {step < stage || (step === 1 && active) ? <Check className="size-4" aria-hidden /> : step}
                </span>
                <span className={cn("text-xs font-semibold", active ? "text-slate-800" : "text-slate-500")}>
                  {label}
                </span>
              </span>
              {index < 2 ? <span className={cn("mx-3 h-0.5 min-w-6 flex-1", step < stage ? "bg-teal-500" : "bg-slate-300")} /> : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-700">
          <span>参数完整度</span>
          <span className={complete === total && total > 0 ? "text-emerald-700" : "text-amber-700"}>
            {complete} / {total}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200" aria-hidden>
          <div className="h-full rounded-full bg-teal-500 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          完成所有必填参数后才能进行 Prepare 权威校验。
        </p>
      </div>

      {firstIncomplete ? (
        <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-amber-900">
                {total - complete} 个目标需要处理
              </div>
              <div className="mt-3 truncate text-xs font-semibold text-amber-900" title={itemTargetText(firstIncomplete)}>
                {basename(itemTargetText(firstIncomplete))} · {remediationOrderActionLabel(firstIncomplete)}
              </div>
              <p className="mt-1 text-xs leading-5 text-amber-700">
                {validationErrors[firstIncomplete.item_id]}
              </p>
              <button
                type="button"
                onClick={() => {
                  onSelectItem(firstIncomplete.item_id);
                  const reduceMotion = window.matchMedia(
                    "(prefers-reduced-motion: reduce)",
                  ).matches;
                  document
                    .getElementById("remediation-order-parameters")
                    ?.scrollIntoView({
                      behavior: reduceMotion ? "auto" : "smooth",
                      block: "start",
                    });
                }}
                className="mt-3 min-h-9 rounded-full border border-amber-500 bg-white px-4 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
              >
                前往配置该目标
              </button>
            </div>
          </div>
        </div>
      ) : total > 0 ? (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <div className="text-xs font-bold">所有目标参数完整</div>
            <p className="mt-1 text-xs leading-5 text-emerald-700">
              可以保存草稿，随后进入 Prepare 权威校验。
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          Prepare 将重新验证
          {decisionLoading ? <Loader2 className="size-3.5 animate-spin text-slate-400" aria-label="正在加载动作依据" /> : null}
        </div>
        <ul className="mt-3 space-y-3">
          {PREPARE_CHECKS.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-xs leading-5 text-slate-600">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <div className="text-xs font-bold text-blue-900">下发规则</div>
        <p className="mt-2 text-xs leading-5 text-blue-700">
          Agent 在线状态只展示信息，不作为是否允许 Confirm 的门禁。真正的执行资格由 Prepare 返回的 ready / blocked 决定。
        </p>
      </div>
    </aside>
  );
}
