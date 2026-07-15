"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocale } from "next-intl";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ListChecks,
  Loader2,
  RefreshCcw,
  Workflow,
} from "lucide-react";

import {
  queryRemediationItemsBySource,
  queryRemediationOrderList,
  queryRemediationSummary,
  isLegacyCaseRemediationTitle,
  RemediationSourceType,
  type ProtoEnum,
  type RemediationItemExecution,
  type RemediationOrder,
  type RemediationOrderItem,
  type RemediationOrderListItem,
  type RemediationSource,
  type RemediationSummary,
} from "@/features/attack/remediation-order";
import { cn } from "@/shared/lib/utils";

import { remediationOrderActionLabel } from "./remediation-order-parameter-editor";
import {
  remediationActionIcon,
  remediationActionIconClassName,
} from "./remediation-action-icons";
import { remediationTargetPresentation } from "./remediation-target-presentation";

type ExecutionFilter = "all" | "active" | "attention";

interface RemediationCaseExecutionPanelProps {
  order: RemediationOrder;
}

interface CaseExecutionData {
  itemsByOrderId: Record<string, RemediationOrderItem[]>;
  orders: RemediationOrderListItem[];
  summary: RemediationSummary;
}

interface QuerySource {
  key: string;
  sourceRefId: string;
  sourceType: RemediationSourceType;
}

const EMPTY_SUMMARY: RemediationSummary = {
  order_count: "0",
  item_count: "0",
  running_count: "0",
  success_count: "0",
  failed_count: "0",
  uncertain_count: "0",
};

function requestErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "处置执行情况加载失败";
}

function sourceTypeValue(value: ProtoEnum): RemediationSourceType {
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "2" || normalized.includes("drill")) {
    return RemediationSourceType.DrillGraph;
  }
  if (normalized === "3" || normalized.includes("locate")) {
    return RemediationSourceType.LocateGraph;
  }
  return RemediationSourceType.CaseGraph;
}

function sourceKey(sourceType: RemediationSourceType, sourceRefId: string) {
  return `${sourceType}:${sourceRefId.trim()}`;
}

function shortId(value: string, left = 8, right = 4) {
  const normalized = value.trim();
  if (!normalized) return "-";
  if (normalized.length <= left + right + 3) return normalized;
  return `${normalized.slice(0, left)}…${normalized.slice(-right)}`;
}

function numericValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function executionForItem(
  item: RemediationOrderItem,
): RemediationItemExecution | null {
  return item.execution;
}

function itemExecutionCodes(item: RemediationOrderItem) {
  const execution = executionForItem(item);
  return [
    execution?.error_code,
    item.error_code,
    execution?.reason_code,
    item.reason_code,
  ]
    .map((value) => value?.trim().toUpperCase() ?? "")
    .filter(Boolean);
}

function itemIsReportTimeout(item: RemediationOrderItem) {
  return itemExecutionCodes(item).includes("REPORT_TIMEOUT");
}

function itemHasUncertainResult(item: RemediationOrderItem) {
  const execution = executionForItem(item);
  return (
    item.status.trim().toLowerCase() === "uncertain" ||
    Boolean(item.uncertainty_since_at.trim()) ||
    execution?.failure_certainty.trim().toLowerCase() === "uncertain"
  );
}

function itemStatusPresentation(item: RemediationOrderItem) {
  if (itemIsReportTimeout(item)) {
    return { label: "回报超时", className: "bg-orange-50 text-orange-700" };
  }
  if (itemHasUncertainResult(item)) {
    return { label: "结果未确认", className: "bg-amber-50 text-amber-700" };
  }
  const status = item.status.trim().toLowerCase();
  switch (status) {
    case "draft":
      return { label: "草稿", className: "bg-slate-100 text-slate-700" };
    case "ready":
      return { label: "待确认", className: "bg-violet-50 text-violet-700" };
    case "satisfied":
      return { label: "已满足", className: "bg-emerald-50 text-emerald-700" };
    case "blocked":
      return { label: "已阻断", className: "bg-rose-50 text-rose-700" };
    case "pending":
      return { label: "待下发", className: "bg-sky-50 text-sky-700" };
    case "running":
      return { label: "执行中", className: "bg-sky-50 text-sky-700" };
    case "success":
      return { label: "成功", className: "bg-emerald-50 text-emerald-700" };
    case "failed":
      return { label: "失败", className: "bg-rose-50 text-rose-700" };
    case "skipped":
      return { label: "已跳过", className: "bg-slate-100 text-slate-700" };
    case "uncertain":
      return { label: "未确定", className: "bg-amber-50 text-amber-700" };
    case "canceled":
      return { label: "已取消", className: "bg-slate-100 text-slate-700" };
    default:
      return {
        label: status || "未开始",
        className: "bg-slate-100 text-slate-700",
      };
  }
}

function itemIsActive(item: RemediationOrderItem) {
  const status = item.status.trim().toLowerCase();
  return status === "pending" || status === "running";
}

function itemNeedsAttention(item: RemediationOrderItem) {
  const status = item.status.trim().toLowerCase();
  return status === "failed" || status === "uncertain" || status === "blocked";
}

function itemMatchesFilter(
  item: RemediationOrderItem,
  filter: ExecutionFilter,
) {
  if (filter === "active") return itemIsActive(item);
  if (filter === "attention") return itemNeedsAttention(item);
  return true;
}

function executionTimestamp(item: RemediationOrderItem) {
  const execution = executionForItem(item);
  return (
    execution?.updated_at.trim() ||
    execution?.last_report_at.trim() ||
    execution?.finished_at.trim() ||
    item.finished_at.trim() ||
    item.updated_at.trim() ||
    item.created_at.trim()
  );
}

function formatTimestamp(value: string, locale: string) {
  const normalized = value.trim();
  if (!normalized) return "-";
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return normalized;
  return new Intl.DateTimeFormat(locale, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function executionTimePresentation(item: RemediationOrderItem, locale: string) {
  const execution = executionForItem(item);
  const status = item.status.trim().toLowerCase();
  const startedAt = execution?.started_at.trim() || "";
  const finishedAt = execution?.finished_at.trim() || item.finished_at.trim();
  const lastReportAt = execution?.last_report_at.trim() || "";
  if (itemIsReportTimeout(item)) {
    const timedOutAt = finishedAt || executionTimestamp(item);
    return {
      primary: timedOutAt
        ? `超时 ${formatTimestamp(timedOutAt, locale)}`
        : "回报超时",
      secondary: "",
    };
  }
  if (itemHasUncertainResult(item)) {
    const uncertainAt = finishedAt || executionTimestamp(item);
    return {
      primary: uncertainAt
        ? `待确认 ${formatTimestamp(uncertainAt, locale)}`
        : "结果未确认",
      secondary: "尚无权威终态结果",
    };
  }
  if (finishedAt) {
    return {
      primary: `完成 ${formatTimestamp(finishedAt, locale)}`,
      secondary: "已收到终态回执",
    };
  }
  if (startedAt) {
    return {
      primary: `开始 ${formatTimestamp(startedAt, locale)}`,
      secondary: lastReportAt
        ? `最后回执 ${formatTimestamp(lastReportAt, locale)}`
        : status === "pending"
          ? "等待下发"
          : "等待执行回执",
    };
  }
  if (lastReportAt) {
    return {
      primary: `最后回执 ${formatTimestamp(lastReportAt, locale)}`,
      secondary: "等待状态更新",
    };
  }
  return { primary: "尚未开始", secondary: "-" };
}

function resultPresentation(item: RemediationOrderItem) {
  const execution = executionForItem(item);
  const errorCode = execution?.error_code.trim() || item.error_code.trim();
  const errorMessage =
    execution?.error_message.trim() || item.error_message.trim();
  const reason =
    execution?.reason_message.trim() ||
    item.reason_message.trim() ||
    execution?.reason_code.trim() ||
    item.reason_code.trim();
  const status = item.status.trim().toLowerCase();
  if (itemIsReportTimeout(item)) {
    return {
      code: "",
      result: "未收到终态结果",
      reason:
        "处置请求已被接收，但在回报截止时间前未收到 Agent 的最终结果",
    };
  }
  if (itemHasUncertainResult(item)) {
    return {
      code: "",
      result: "等待人工确认",
      reason: reason || errorMessage || "结果尚未被权威确认",
    };
  }
  if (errorCode || errorMessage) {
    return {
      code: errorCode,
      result: errorMessage || errorCode,
      reason,
    };
  }
  if (status === "success") {
    return {
      code: "",
      result: "执行结果已确认",
      reason: reason || "终端已确认处置结果",
    };
  }
  if (status === "uncertain") {
    return {
      code: "",
      result: "需人工对账",
      reason: reason || "结果未能被权威确认",
    };
  }
  if (status === "failed" || status === "blocked") {
    return {
      code: "",
      result: status === "failed" ? "执行失败" : "当前无法执行",
      reason: reason || "-",
    };
  }
  if (itemIsActive(item)) {
    return {
      code: "",
      result: "执行中",
      reason: reason || "等待 Agent 回执",
    };
  }
  return {
    code: "",
    result: "尚未进入执行阶段",
    reason: reason || "-",
  };
}

function orderStateSummary(
  order: RemediationOrderListItem,
  items: RemediationOrderItem[],
) {
  const summary = order.summary;
  const reportTimeoutCount = items.filter(itemIsReportTimeout).length;
  const uncertainCount = Math.max(
    summary.uncertain - reportTimeoutCount,
    0,
  );
  const failedCount = Math.max(
    summary.failed - Math.max(summary.uncertain, reportTimeoutCount),
    0,
  );
  return [
    {
      label: `待下发/执行中 ${summary.pending + summary.running}`,
      visible: summary.pending + summary.running > 0,
      className: "bg-sky-50 text-sky-700",
    },
    {
      label: `成功 ${summary.success}`,
      visible: summary.success > 0,
      className: "bg-emerald-50 text-emerald-700",
    },
    {
      label: `回报超时 ${reportTimeoutCount}`,
      visible: reportTimeoutCount > 0,
      className: "bg-orange-50 text-orange-700",
    },
    {
      label: `失败 ${failedCount}`,
      visible: failedCount > 0,
      className: "bg-rose-50 text-rose-700",
    },
    {
      label: `未确定 ${uncertainCount}`,
      visible: uncertainCount > 0,
      className: "bg-amber-50 text-amber-700",
    },
    {
      label: `待确认 ${summary.ready}`,
      visible: summary.ready > 0,
      className: "bg-violet-50 text-violet-700",
    },
  ].filter((entry) => entry.visible);
}

function querySources(
  orders: RemediationOrderListItem[],
  currentOrder: RemediationOrder,
) {
  const sources = new Map<string, QuerySource>();
  const addSource = (source: RemediationSource) => {
    const sourceRefId = source.source_ref_id.trim();
    if (!sourceRefId) return;
    const sourceType = sourceTypeValue(source.source_type);
    const key = sourceKey(sourceType, sourceRefId);
    sources.set(key, { key, sourceRefId, sourceType });
  };
  orders.forEach((order) => addSource(order.source));
  addSource(currentOrder.source);
  return [...sources.values()];
}

function groupItemsByOrder(items: RemediationOrderItem[]) {
  const uniqueItems = new Map<string, RemediationOrderItem>();
  items.forEach((item) => {
    const key = `${item.order_id}:${item.item_id}`;
    uniqueItems.set(key, item);
  });
  return [...uniqueItems.values()].reduce<
    Record<string, RemediationOrderItem[]>
  >((groups, item) => {
    const orderId = item.order_id.trim();
    if (!orderId) return groups;
    groups[orderId] = [...(groups[orderId] ?? []), item];
    return groups;
  }, {});
}

export function RemediationCaseExecutionPanel({
  order: currentOrder,
}: RemediationCaseExecutionPanelProps) {
  const locale = useLocale();
  const requestSequence = useRef(0);
  const currentOrderRef = useRef(currentOrder);
  const [data, setData] = useState<CaseExecutionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<ExecutionFilter>("all");
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(
    () => new Set([currentOrder.order_id]),
  );
  const [updatedAt, setUpdatedAt] = useState("");

  const caseId = currentOrder.source.case_id.trim();
  const currentOrderId = currentOrder.order_id.trim();
  const currentSourceRefId = currentOrder.source.source_ref_id.trim();
  const currentSourceType = sourceTypeValue(currentOrder.source.source_type);
  useEffect(() => {
    currentOrderRef.current = currentOrder;
  }, [currentOrder]);
  const summarySource = useMemo<QuerySource | null>(() => {
    if (caseId) {
      return {
        key: sourceKey(RemediationSourceType.CaseGraph, caseId),
        sourceType: RemediationSourceType.CaseGraph,
        sourceRefId: caseId,
      };
    }
    if (!currentSourceRefId) return null;
    return {
      key: sourceKey(currentSourceType, currentSourceRefId),
      sourceType: currentSourceType,
      sourceRefId: currentSourceRefId,
    };
  }, [caseId, currentSourceRefId, currentSourceType]);

  const load = useCallback(
    async ({
      manual = false,
      silent = false,
    }: { manual?: boolean; silent?: boolean } = {}) => {
      if (!summarySource) {
        setLoading(false);
        setError("当前处置单没有可查询的 Case 或图来源。");
        return;
      }
      const sequence = ++requestSequence.current;
      if (manual) setRefreshing(true);
      if (!silent && !manual) setLoading(true);
      setError("");
      try {
        const order = currentOrderRef.current;
        const listRequest = caseId
          ? { case_id: caseId, page: 1, page_size: 100 }
          : {
              source_type: summarySource.sourceType,
              source_ref_id: summarySource.sourceRefId,
              page: 1,
              page_size: 100,
            };
        const [summary, orderList] = await Promise.all([
          queryRemediationSummary({
            source_type: summarySource.sourceType,
            source_ref_id: summarySource.sourceRefId,
          }),
          queryRemediationOrderList(listRequest),
        ]);
        const orders = orderList.items;
        const sources = querySources(orders, order);
        const itemResults = await Promise.allSettled(
          sources.map((source) =>
            queryRemediationItemsBySource({
              source_type: source.sourceType,
              source_ref_id: source.sourceRefId,
              page: 1,
              page_size: 100,
            }),
          ),
        );
        const items = [
          ...order.items,
          ...itemResults.flatMap((result) =>
            result.status === "fulfilled" ? result.value.items : [],
          ),
        ];
        if (sequence !== requestSequence.current) return;
        setData({
          summary,
          orders,
          itemsByOrderId: groupItemsByOrder(items),
        });
        setUpdatedAt(new Date().toISOString());
        setExpandedOrderIds((current) =>
          current.size > 0
            ? current
            : new Set([order.order_id || orders[0]?.order_id].filter(Boolean)),
        );
      } catch (cause) {
        if (sequence === requestSequence.current) {
          setError(requestErrorMessage(cause));
        }
      } finally {
        if (sequence === requestSequence.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [caseId, currentOrderId, summarySource],
  );

  useEffect(() => {
    void load();
    return () => {
      requestSequence.current += 1;
    };
  }, [load]);

  const pollingDelay =
    numericValue(data?.summary.running_count ?? "0") > 0 ? 5_000 : 15_000;
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void load({ silent: true });
      }
    }, pollingDelay);
    return () => window.clearInterval(timer);
  }, [load, pollingDelay]);

  const orders = useMemo(() => {
    const remoteOrders = data?.orders ?? [];
    return [
      {
        order_id: currentOrder.order_id,
        source: currentOrder.source,
        title: currentOrder.title,
        status: currentOrder.status,
        outcome: currentOrder.outcome,
        revision: currentOrder.revision,
        confirmable: currentOrder.confirmable,
        summary: currentOrder.summary,
        created_by: currentOrder.created_by,
        created_at: currentOrder.created_at,
        updated_at: currentOrder.updated_at,
      },
      ...remoteOrders.filter(
        (order) => order.order_id !== currentOrder.order_id,
      ),
    ];
  }, [currentOrder, data?.orders]);

  const allItems = useMemo(() => {
    const loadedItems = Object.values(data?.itemsByOrderId ?? {}).flat();
    return loadedItems.length > 0 ? loadedItems : currentOrder.items;
  }, [currentOrder.items, data?.itemsByOrderId]);
  const activeCount = allItems.filter(itemIsActive).length;
  const attentionCount = allItems.filter(itemNeedsAttention).length;
  const hostIdLabel = locale.toLowerCase().startsWith("zh")
    ? "主机ID"
    : "HostID";
  const sourceLabel = caseId ? "当前 Case" : "当前图来源";
  const summary = data?.summary ?? EMPTY_SUMMARY;
  const reportTimeoutCount = allItems.filter(itemIsReportTimeout).length;
  const uncertainCount = allItems.filter(
    (item) => !itemIsReportTimeout(item) && itemHasUncertainResult(item),
  ).length;
  const failedCount = allItems.filter(
    (item) =>
      item.status.trim().toLowerCase() === "failed" &&
      !itemHasUncertainResult(item),
  ).length;

  function toggleOrder(orderId: string) {
    setExpandedOrderIds((current) => {
      const next = new Set(current);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }

  return (
    <section
      aria-label="处置执行情况"
      className="mt-4 min-w-0 rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_16px_45px_-36px_rgba(15,23,42,0.45)]"
    >
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <Workflow className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
              处置执行情况
              {loading ? (
                <Loader2
                  className="size-3.5 animate-spin text-slate-400"
                  aria-label="正在加载"
                />
              ) : null}
            </h2>
            <span
              className="mt-1 block max-w-[min(60vw,560px)] truncate font-mono text-[11px] leading-5 text-slate-500"
              title={caseId || summarySource?.sourceRefId || ""}
            >
              {caseId || summarySource?.sourceRefId || "-"}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 self-end xl:self-auto">
          <div aria-live="polite" className="hidden text-right sm:block">
            <div className="text-[11px] text-slate-400">更新时间</div>
            <div className="mt-0.5 text-xs font-medium tabular-nums text-slate-600">
              {updatedAt ? formatTimestamp(updatedAt, locale) : "-"}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void load({ manual: true })}
            disabled={refreshing}
            aria-label="刷新处置执行情况"
            className="flex size-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw
              className={cn("size-4", refreshing && "animate-spin")}
              aria-hidden
            />
          </button>
        </div>
      </div>

      <div className="mt-4 grid overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 sm:grid-cols-2 xl:grid-cols-6">
        <SummaryMetric label="处置单" value={summary.order_count} suffix="张" />
        <SummaryMetric
          label="待下发 / 执行中"
          value={summary.running_count}
          suffix="个目标"
          tone="active"
        />
        <SummaryMetric
          label="执行成功"
          value={summary.success_count}
          suffix="个目标"
          tone="success"
        />
        <SummaryMetric
          label="回报超时"
          value={String(reportTimeoutCount)}
          suffix="个目标"
          tone="timeout"
        />
        <SummaryMetric
          label="执行失败"
          value={String(failedCount)}
          suffix="个目标"
          tone="danger"
        />
        <SummaryMetric
          label="结果未确定"
          value={String(uncertainCount)}
          suffix="个目标"
          tone="warning"
        />
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="ml-[22px] flex items-center gap-2 text-base font-semibold text-slate-800">
              <ListChecks className="size-[18px] text-blue-600" aria-hidden />
              处置清单
            </h3>
          </div>
          <div
            className="flex flex-wrap items-center gap-2"
            aria-label="执行状态筛选"
          >
            <FilterButton
              active={filter === "all"}
              onClick={() => setFilter("all")}
            >
              全部 {allItems.length || numericValue(summary.item_count)}
            </FilterButton>
            <FilterButton
              active={filter === "active"}
              onClick={() => setFilter("active")}
              tone="active"
            >
              处理中 {activeCount}
            </FilterButton>
            <FilterButton
              active={filter === "attention"}
              onClick={() => setFilter("attention")}
              tone="danger"
            >
              异常 {attentionCount}
            </FilterButton>
          </div>
        </div>

        {error ? (
          <div
            className="mt-3 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800"
            role="alert"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <div>
              <div className="font-semibold">处置执行明细暂时无法刷新</div>
              <p className="mt-1 leading-5">{error}</p>
            </div>
          </div>
        ) : null}

        <div className="mt-3 space-y-3">
          {orders.map((order) => {
            const savedOrderTitle = order.title.trim();
            const orderCaseId =
              order.source.case_id.trim() || order.source.source_ref_id.trim();
            const displayOrderTitle =
              savedOrderTitle &&
              !isLegacyCaseRemediationTitle(savedOrderTitle, orderCaseId)
                ? savedOrderTitle
                : `处置单 · ${formatTimestamp(order.created_at || order.updated_at, locale)}`;
            const allOrderItems =
              data?.itemsByOrderId[order.order_id] ??
              currentOrder.items.filter(
                (item) =>
                  item.order_id === order.order_id ||
                  order.order_id === currentOrder.order_id,
              );
            const orderItems = allOrderItems.filter((item) =>
              itemMatchesFilter(item, filter),
            );
            const expanded = expandedOrderIds.has(order.order_id);
            const orderBadges = orderStateSummary(order, allOrderItems);
            return (
              <article
                key={order.order_id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => toggleOrder(order.order_id)}
                  className="flex min-h-12 w-full items-center gap-3 bg-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500"
                >
                  {expanded ? (
                    <ChevronDown
                      className="size-4 shrink-0 text-slate-500"
                      aria-hidden
                    />
                  ) : (
                    <ChevronRight
                      className="size-4 shrink-0 text-slate-500"
                      aria-hidden
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-sm font-semibold text-slate-800">
                        {displayOrderTitle}
                      </span>
                      <span
                        className="font-mono text-[10px] text-slate-500"
                        title={order.order_id}
                      >
                        Order {shortId(order.order_id)}
                      </span>
                      {orderBadges.map((badge) => (
                        <span
                          key={badge.label}
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[10px] font-bold",
                            badge.className,
                          )}
                        >
                          {badge.label}
                        </span>
                      ))}
                    </span>
                  </span>
                  <span className="hidden shrink-0 text-right text-[11px] text-slate-500 lg:block">
                    最近更新{" "}
                    {formatTimestamp(
                      order.updated_at || order.created_at,
                      locale,
                    )}
                  </span>
                </button>

                {expanded ? (
                  <div className="overflow-x-auto">
                    <div className="min-w-[1280px]">
                      <div className="grid grid-cols-[minmax(210px,1.1fr)_minmax(170px,.85fr)_minmax(160px,.7fr)_130px_190px_minmax(180px,.85fr)_minmax(260px,1.25fr)] gap-4 border-b border-slate-100 px-5 py-3 text-[11px] font-bold text-slate-500">
                        <span>目标</span>
                        <span>处置动作</span>
                        <span>{hostIdLabel}</span>
                        <span>当前状态</span>
                        <span>时间</span>
                        <span>结果</span>
                        <span>原因</span>
                      </div>
                      {orderItems.length ? (
                        orderItems.map((item) => (
                          <ExecutionItemRow
                            key={item.item_id}
                            item={item}
                            locale={locale}
                          />
                        ))
                      ) : (
                        <div className="px-5 py-9 text-center text-xs text-slate-500">
                          {filter === "all"
                            ? "当前处置单暂无可展示的目标执行记录。"
                            : "没有符合当前状态筛选的目标。"}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        {!loading && !orders.length ? (
          <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
            当前 {sourceLabel} 尚未创建处置单。
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-[11px] text-slate-500">
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <StatusLegend className="bg-sky-500" label="待下发 / 执行中" />
          <StatusLegend className="bg-emerald-500" label="成功" />
          <StatusLegend className="bg-orange-500" label="回报超时" />
          <StatusLegend className="bg-rose-500" label="执行失败" />
          <StatusLegend className="bg-amber-500" label="未确定" />
        </span>
      </div>
    </section>
  );
}

function SummaryMetric({
  label,
  suffix,
  tone = "default",
  value,
}: {
  label: string;
  suffix: string;
  tone?:
    | "default"
    | "active"
    | "success"
    | "danger"
    | "timeout"
    | "warning";
  value: string;
}) {
  const colors = {
    default: "text-slate-950",
    active: "text-sky-700",
    success: "text-emerald-700",
    danger: "text-rose-700",
    timeout: "text-orange-700",
    warning: "text-amber-700",
  }[tone];
  return (
    <div className="border-b border-slate-200 px-4 py-3 last:border-b-0 xl:border-b-0 xl:border-l xl:first:border-l-0">
      <div className="text-[11px] font-medium text-slate-500">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className={cn("text-xl font-bold tabular-nums", colors)}>
          {numericValue(value)}
        </span>
        <span className="text-[11px] text-slate-500">{suffix}</span>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  children,
  onClick,
  tone = "default",
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
  tone?: "default" | "active" | "danger";
}) {
  const toneClass = active
    ? tone === "danger"
      ? "bg-rose-600 text-white"
      : tone === "active"
        ? "bg-sky-600 text-white"
        : "bg-slate-950 text-white"
    : tone === "danger"
      ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
      : tone === "active"
        ? "bg-sky-50 text-sky-700 hover:bg-sky-100"
        : "bg-slate-100 text-slate-700 hover:bg-slate-200";
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "min-h-8 rounded-full px-3 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2",
        toneClass,
      )}
    >
      {children}
    </button>
  );
}

function ExecutionItemRow({
  item,
  locale,
}: {
  item: RemediationOrderItem;
  locale: string;
}) {
  const Icon = remediationActionIcon(item.action_code);
  const status = itemStatusPresentation(item);
  const time = executionTimePresentation(item, locale);
  const result = resultPresentation(item);
  const target = remediationTargetPresentation(item);
  return (
    <div className="grid grid-cols-[minmax(210px,1.1fr)_minmax(170px,.85fr)_minmax(160px,.7fr)_130px_190px_minmax(180px,.85fr)_minmax(260px,1.25fr)] gap-4 border-b border-slate-100 px-5 py-3 last:border-b-0">
      <div className="min-w-0">
        <div
          className={cn(
            "truncate text-xs font-semibold",
            target.unavailable ? "text-amber-700" : "text-slate-800",
          )}
          title={target.detail || target.displayName}
        >
          {target.displayName}
        </div>
      </div>
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-50",
            remediationActionIconClassName(item.action_code),
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
        <span
          className="min-w-0 truncate text-[11px] font-medium text-slate-700"
          title={remediationOrderActionLabel(item)}
        >
          {remediationOrderActionLabel(item)}
        </span>
      </div>
      <div className="min-w-0">
        <div
          className="truncate font-mono text-[11px] text-slate-700"
          title={item.agent_id}
        >
          {shortId(item.agent_id)}
        </div>
      </div>
      <div>
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold",
            status.className,
          )}
        >
          {status.label}
        </span>
      </div>
      <div className="min-w-0 text-[11px] leading-5">
        <div
          className="truncate font-medium text-slate-700"
          title={time.primary}
        >
          {time.primary}
        </div>
        {time.secondary ? (
          <div className="truncate text-slate-500" title={time.secondary}>
            {time.secondary}
          </div>
        ) : null}
      </div>
      <div className="min-w-0 text-[11px] leading-5">
        <div className="flex min-w-0 items-center gap-2">
          {result.code ? (
            <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-700">
              {result.code}
            </span>
          ) : null}
          <span
            className="truncate font-medium text-slate-700"
            title={result.result}
          >
            {result.result}
          </span>
        </div>
      </div>
      <div className="min-w-0 text-[11px] leading-5 text-slate-500">
        <span className="block truncate" title={result.reason}>
          {result.reason}
        </span>
      </div>
    </div>
  );
}

function StatusLegend({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", className)} aria-hidden />
      {label}
    </span>
  );
}
