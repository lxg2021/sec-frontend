"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocale, useTranslations } from "next-intl";
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

const ACTIVE_DISPATCH_SKIP_REASONS = new Set([
  "ACTIVE_DISPATCH_IN_PROGRESS",
  "ACTIVE_DISPATCH_UNCERTAIN",
  "ACTIVE_DISPATCH_REQUIRES_RECONCILIATION",
]);

export function activeDispatchSkipPresentation(
  item: RemediationOrderItem,
  locale = "zh-CN",
) {
  const reasonCode = itemExecutionCodes(item).find((code) =>
    ACTIVE_DISPATCH_SKIP_REASONS.has(code),
  );
  if (!reasonCode) return null;

  switch (reasonCode) {
    case "ACTIVE_DISPATCH_IN_PROGRESS":
      return {
        label: localized(locale, "未重复下发", "Not Redispatched"),
        result: localized(locale, "未重复下发", "Not Redispatched"),
        reason: localized(
          locale,
          "同一目标已有处置任务正在执行，本条未重复下发。",
          "A remediation task for this target is already running; this item was not redispatched.",
        ),
      };
    case "ACTIVE_DISPATCH_UNCERTAIN":
      return {
        label: localized(locale, "未重复下发", "Not Redispatched"),
        result: localized(locale, "未重复下发", "Not Redispatched"),
        reason: localized(
          locale,
          "同一目标已有下发任务，终端结果待确认。",
          "A dispatch already exists for this target; the endpoint result is awaiting confirmation.",
        ),
      };
    default:
      return {
        label: localized(locale, "未重复下发", "Not Redispatched"),
        result: localized(locale, "未重复下发", "Not Redispatched"),
        reason: localized(
          locale,
          "同一目标已有待对账任务，本条未重复下发。",
          "A reconciliation task already exists for this target; this item was not redispatched.",
        ),
      };
  }
}

function itemHasUncertainResult(item: RemediationOrderItem) {
  const execution = executionForItem(item);
  return (
    item.status.trim().toLowerCase() === "uncertain" ||
    Boolean(item.uncertainty_since_at.trim()) ||
    execution?.failure_certainty.trim().toLowerCase() === "uncertain"
  );
}

function itemHasUnknownPublishAcceptance(item: RemediationOrderItem) {
  return executionForItem(item)?.publish_acceptance_unknown === true;
}

function itemExecutionStatus(item: RemediationOrderItem) {
  return executionForItem(item)?.execution_status.trim().toLowerCase() ?? "";
}

function localized(locale: string, zh: string, en: string) {
  return locale.toLowerCase().startsWith("zh") ? zh : en;
}

export function itemStatusPresentation(
  item: RemediationOrderItem,
  locale: string,
) {
  const activeDispatchSkip = activeDispatchSkipPresentation(item, locale);
  if (activeDispatchSkip) {
    return {
      label: activeDispatchSkip.label,
      className: "bg-slate-100 text-slate-700",
    };
  }
  if (itemIsReportTimeout(item)) {
    return {
      label: localized(locale, "回报超时", "Report Timed Out"),
      className: "bg-orange-50 text-orange-700",
    };
  }
  if (itemHasUncertainResult(item)) {
    return {
      label: localized(locale, "结果未确认", "Result Unconfirmed"),
      className: "bg-amber-50 text-amber-700",
    };
  }
  if (itemHasUnknownPublishAcceptance(item)) {
    return {
      label: localized(locale, "投递状态待确认", "Delivery Unconfirmed"),
      className: "bg-amber-50 text-amber-700",
    };
  }
  if (itemExecutionStatus(item) === "accepted") {
    return {
      label: localized(locale, "已接收，等待执行", "Accepted, Awaiting Execution"),
      className: "bg-sky-50 text-sky-700",
    };
  }
  const status = item.status.trim().toLowerCase();
  switch (status) {
    case "draft":
      return {
        label: localized(locale, "草稿", "Draft"),
        className: "bg-slate-100 text-slate-700",
      };
    case "ready":
      return {
        label: localized(locale, "待确认", "Awaiting Confirmation"),
        className: "bg-violet-50 text-violet-700",
      };
    case "satisfied":
      return {
        label: localized(locale, "已满足", "Satisfied"),
        className: "bg-emerald-50 text-emerald-700",
      };
    case "blocked":
      return {
        label: localized(locale, "已阻断", "Blocked"),
        className: "bg-rose-50 text-rose-700",
      };
    case "pending":
      return {
        label: localized(locale, "待下发", "Pending Dispatch"),
        className: "bg-sky-50 text-sky-700",
      };
    case "running":
      return {
        label: localized(locale, "执行中", "Running"),
        className: "bg-sky-50 text-sky-700",
      };
    case "success":
      return {
        label: localized(locale, "成功", "Succeeded"),
        className: "bg-emerald-50 text-emerald-700",
      };
    case "failed":
      return {
        label: localized(locale, "失败", "Failed"),
        className: "bg-rose-50 text-rose-700",
      };
    case "skipped":
      return {
        label: localized(locale, "已跳过", "Skipped"),
        className: "bg-slate-100 text-slate-700",
      };
    case "uncertain":
      return {
        label: localized(locale, "未确定", "Uncertain"),
        className: "bg-amber-50 text-amber-700",
      };
    case "canceled":
      return {
        label: localized(locale, "已取消", "Canceled"),
        className: "bg-slate-100 text-slate-700",
      };
    default:
      return {
        label: status || localized(locale, "未开始", "Not Started"),
        className: "bg-slate-100 text-slate-700",
      };
  }
}

function itemIsActive(item: RemediationOrderItem) {
  const status = item.status.trim().toLowerCase();
  const executionStatus = itemExecutionStatus(item);
  return (
    status === "pending" ||
    status === "running" ||
    executionStatus === "accepted" ||
    executionStatus === "running" ||
    itemHasUnknownPublishAcceptance(item)
  );
}

function itemNeedsAttention(item: RemediationOrderItem) {
  const status = item.status.trim().toLowerCase();
  return (
    status === "failed" ||
    status === "uncertain" ||
    status === "blocked" ||
    itemHasUnknownPublishAcceptance(item) ||
    Boolean(activeDispatchSkipPresentation(item))
  );
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
  const activeDispatchSkip = activeDispatchSkipPresentation(item, locale);
  if (activeDispatchSkip) {
    const skippedAt = finishedAt || executionTimestamp(item);
    return {
      primary: skippedAt
        ? `${localized(locale, "未下发", "Not Dispatched")} ${formatTimestamp(skippedAt, locale)}`
        : localized(locale, "未重复下发", "Not Redispatched"),
    };
  }
  if (itemIsReportTimeout(item)) {
    const timedOutAt = finishedAt || executionTimestamp(item);
    return {
      primary: timedOutAt
        ? `${localized(locale, "超时", "Timed Out")} ${formatTimestamp(timedOutAt, locale)}`
        : localized(locale, "回报超时", "Report Timed Out"),
    };
  }
  if (itemHasUncertainResult(item)) {
    const uncertainAt = finishedAt || executionTimestamp(item);
    return {
      primary: uncertainAt
        ? `${localized(locale, "待确认", "Awaiting Confirmation")} ${formatTimestamp(uncertainAt, locale)}`
        : localized(locale, "结果未确认", "Result Unconfirmed"),
    };
  }
  if (itemHasUnknownPublishAcceptance(item)) {
    const observedAt = executionTimestamp(item);
    return {
      primary: observedAt
        ? `${localized(locale, "待确认", "Unconfirmed")} ${formatTimestamp(observedAt, locale)}`
        : localized(locale, "投递状态待确认", "Delivery Unconfirmed"),
    };
  }
  if (itemExecutionStatus(item) === "accepted") {
    const acceptedAt = lastReportAt || executionTimestamp(item);
    return {
      primary: acceptedAt
        ? `${localized(locale, "已接收", "Accepted")} ${formatTimestamp(acceptedAt, locale)}`
        : localized(locale, "已接收，等待执行", "Accepted, Awaiting Execution"),
    };
  }
  if (finishedAt) {
    return {
      primary: `${localized(locale, "完成", "Completed")} ${formatTimestamp(finishedAt, locale)}`,
    };
  }
  if (startedAt) {
    return {
      primary: `${localized(locale, "开始", "Started")} ${formatTimestamp(startedAt, locale)}`,
    };
  }
  if (lastReportAt) {
    return {
      primary: `${localized(locale, "最后回执", "Last Report")} ${formatTimestamp(lastReportAt, locale)}`,
    };
  }
  return { primary: localized(locale, "尚未开始", "Not Started") };
}

function resultPresentation(item: RemediationOrderItem, locale: string) {
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
  const activeDispatchSkip = activeDispatchSkipPresentation(item, locale);
  if (activeDispatchSkip) {
    return {
      code: "",
      result: activeDispatchSkip.result,
      reason: activeDispatchSkip.reason,
    };
  }
  if (itemIsReportTimeout(item)) {
    return {
      code: "",
      result: localized(locale, "未收到终态结果", "No Final Result Received"),
      reason: localized(
        locale,
        "处置请求已被接收，但在回报截止时间前未收到 Agent 的最终结果",
        "The remediation request was accepted, but no final Agent result was received before the reporting deadline.",
      ),
    };
  }
  if (itemHasUncertainResult(item)) {
    return {
      code: "",
      result: localized(locale, "等待人工确认", "Awaiting Manual Confirmation"),
      reason:
        reason ||
        errorMessage ||
        localized(
          locale,
          "结果尚未被权威确认",
          "The result has not been authoritatively confirmed.",
        ),
    };
  }
  if (itemHasUnknownPublishAcceptance(item)) {
    return {
      code: "",
      result: localized(locale, "投递状态待确认", "Delivery Unconfirmed"),
      reason: localized(
        locale,
        "后台暂时无法确认任务是否已写入下发队列；终端后续回执仍会继续收敛该状态。",
        "The server cannot yet confirm whether the assignment reached the delivery queue; a later endpoint report can still converge this state.",
      ),
    };
  }
  if (itemExecutionStatus(item) === "accepted") {
    return {
      code: "",
      result: localized(locale, "终端已接收", "Accepted by Endpoint"),
      reason: localized(
        locale,
        "终端已持久化接收任务，正在等待开始执行。",
        "The endpoint has durably accepted the assignment and is waiting to start execution.",
      ),
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
      result: localized(locale, "执行结果已确认", "Execution Result Confirmed"),
      reason:
        reason ||
        localized(
          locale,
          "终端已确认处置结果",
          "The endpoint has confirmed the remediation result.",
        ),
    };
  }
  if (status === "uncertain") {
    return {
      code: "",
      result: localized(locale, "需人工对账", "Manual Reconciliation Required"),
      reason:
        reason ||
        localized(
          locale,
          "结果未能被权威确认",
          "The result could not be authoritatively confirmed.",
        ),
    };
  }
  if (status === "failed" || status === "blocked") {
    return {
      code: "",
      result:
        status === "failed"
          ? localized(locale, "执行失败", "Execution Failed")
          : localized(locale, "当前无法执行", "Cannot Execute Now"),
      reason: reason || "-",
    };
  }
  if (itemIsActive(item)) {
    return {
      code: "",
      result: localized(locale, "执行中", "Running"),
      reason:
        reason ||
        localized(locale, "等待 Agent 回执", "Waiting for the Agent report."),
    };
  }
  return {
    code: "",
    result: localized(locale, "尚未进入执行阶段", "Execution Has Not Started"),
    reason: reason || "-",
  };
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
  const t = useTranslations("pages.collection.orchestration");
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
  const sourceLabel = caseId
    ? t("execution.currentCase")
    : t("execution.currentGraphSource");
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
      aria-label={t("execution.title")}
      className="mt-4 min-w-0 rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_16px_45px_-36px_rgba(15,23,42,0.45)]"
    >
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <Workflow className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
              {t("execution.title")}
              {loading ? (
                <Loader2
                  className="size-3.5 animate-spin text-slate-400"
                  aria-label={t("execution.loading")}
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
            <div className="text-[11px] text-slate-400">
              {t("page.updatedAt")}
            </div>
            <div className="mt-0.5 text-xs font-medium tabular-nums text-slate-600">
              {updatedAt ? formatTimestamp(updatedAt, locale) : "-"}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void load({ manual: true })}
            disabled={refreshing}
            aria-label={t("execution.refresh")}
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
        <SummaryMetric
          label={t("execution.orderCount")}
          value={summary.order_count}
          suffix={t("execution.orderSuffix")}
        />
        <SummaryMetric
          label={t("execution.runningCount")}
          value={summary.running_count}
          suffix={t("execution.targetSuffix")}
          tone="active"
        />
        <SummaryMetric
          label={t("execution.successCount")}
          value={summary.success_count}
          suffix={t("execution.targetSuffix")}
          tone="success"
        />
        <SummaryMetric
          label={t("execution.timeoutCount")}
          value={String(reportTimeoutCount)}
          suffix={t("execution.targetSuffix")}
          tone="timeout"
        />
        <SummaryMetric
          label={t("execution.failedCount")}
          value={String(failedCount)}
          suffix={t("execution.targetSuffix")}
          tone="danger"
        />
        <SummaryMetric
          label={t("execution.uncertainCount")}
          value={String(uncertainCount)}
          suffix={t("execution.targetSuffix")}
          tone="warning"
        />
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="ml-[22px] flex items-center gap-2 text-base font-semibold text-slate-800">
              <ListChecks className="size-[18px] text-blue-600" aria-hidden />
              {t("execution.orderList")}
            </h3>
          </div>
          <div
            className="flex flex-wrap items-center gap-2"
            aria-label={t("execution.status")}
          >
            <FilterButton
              active={filter === "all"}
              onClick={() => setFilter("all")}
            >
              {t("execution.all")}{" "}
              {allItems.length || numericValue(summary.item_count)}
            </FilterButton>
            <FilterButton
              active={filter === "active"}
              onClick={() => setFilter("active")}
              tone="active"
            >
              {t("execution.active")} {activeCount}
            </FilterButton>
            <FilterButton
              active={filter === "attention"}
              onClick={() => setFilter("attention")}
              tone="danger"
            >
              {t("execution.attention")} {attentionCount}
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
              <div className="font-semibold">
                {t("execution.loadUnavailable")}
              </div>
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
                : t("execution.orderFallback", {
                    time: formatTimestamp(
                      order.created_at || order.updated_at,
                      locale,
                    ),
                  });
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
                    </span>
                  </span>
                  <span className="hidden shrink-0 text-right text-[11px] text-slate-500 lg:block">
                    {t("execution.recentlyUpdated")}{" "}
                    {formatTimestamp(
                      order.updated_at || order.created_at,
                      locale,
                    )}
                  </span>
                </button>

                {expanded ? (
                  <RemediationExecutionItemsTable
                    items={orderItems}
                    emptyText={
                      filter === "all"
                        ? t("execution.noItems")
                        : t("execution.noFilteredItems")
                    }
                  />
                ) : null}
              </article>
            );
          })}
        </div>

        {!loading && !orders.length ? (
          <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
            {t("execution.noOrders", { source: sourceLabel })}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-[11px] text-slate-500">
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <StatusLegend
            className="bg-sky-500"
            label={t("execution.runningCount")}
          />
          <StatusLegend
            className="bg-emerald-500"
            label={t("execution.successCount")}
          />
          <StatusLegend
            className="bg-orange-500"
            label={t("execution.timeoutCount")}
          />
          <StatusLegend
            className="bg-rose-500"
            label={t("execution.failedCount")}
          />
          <StatusLegend
            className="bg-amber-500"
            label={t("execution.uncertainCount")}
          />
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
  tone?: "default" | "active" | "success" | "danger" | "timeout" | "warning";
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
  const status = itemStatusPresentation(item, locale);
  const time = executionTimePresentation(item, locale);
  const result = resultPresentation(item, locale);
  const target = remediationTargetPresentation(item);
  const agent = item.agent_snapshot;
  const hostID = item.agent_id.trim() || "-";
  const hostName = agent?.host_name.trim() || "";
  const primaryIP = agent?.primary_ip.trim() || "";
  const ipAddresses = agent?.ip_addresses.length
    ? agent.ip_addresses.join(", ")
    : primaryIP;
  return (
    <div className="grid grid-cols-[minmax(180px,1fr)_minmax(150px,.8fr)_160px_250px_160px_160px_110px_160px_minmax(160px,.8fr)_minmax(180px,.9fr)] items-center gap-4 border-b border-slate-100 px-5 py-3 text-center last:border-b-0">
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
      <div className="flex min-w-0 items-center justify-center gap-2.5">
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
          title={remediationOrderActionLabel(item, locale)}
        >
          {remediationOrderActionLabel(item, locale)}
        </span>
      </div>
      <TableOrderIDValue value={item.order_id} />
      <TableIdentityValue value={hostID} mono />
      <TableIdentityValue value={hostName} />
      <TableIdentityValue value={ipAddresses} mono />
      <div className="flex justify-center">
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
      </div>
      <div className="min-w-0 text-[11px] leading-5">
        <div className="flex min-w-0 items-center justify-center gap-2">
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

export function RemediationExecutionItemsTable({
  emptyText,
  items,
}: {
  emptyText?: string;
  items: RemediationOrderItem[];
}) {
  const locale = useLocale();
  const t = useTranslations("pages.collection.orchestration");

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1810px]">
        <div className="grid grid-cols-[minmax(180px,1fr)_minmax(150px,.8fr)_160px_250px_160px_160px_110px_160px_minmax(160px,.8fr)_minmax(180px,.9fr)] items-center gap-4 border-b border-slate-100 px-5 py-3 text-center text-[11px] font-bold text-slate-500">
          <span>{t("execution.target")}</span>
          <span>{t("execution.action")}</span>
          <span>{t("execution.orderId")}</span>
          <span>{t("execution.hostId")}</span>
          <span>{t("execution.hostName")}</span>
          <span>IP</span>
          <span>{t("execution.status")}</span>
          <span>{t("execution.time")}</span>
          <span>{t("execution.result")}</span>
          <span>{t("execution.reason")}</span>
        </div>
        {items.length ? (
          items.map((item) => (
            <ExecutionItemRow key={item.item_id} item={item} locale={locale} />
          ))
        ) : (
          <div className="px-5 py-9 text-center text-xs text-slate-500">
            {emptyText ?? t("execution.noItems")}
          </div>
        )}
      </div>
    </div>
  );
}

function TableOrderIDValue({ value }: { value: string }) {
  const normalized = value.trim();
  return (
    <div
      className="min-w-0 truncate font-mono text-[11px] text-slate-700"
      title={normalized || undefined}
    >
      {normalized ? shortId(normalized) : "-"}
    </div>
  );
}

function TableIdentityValue({
  mono = false,
  value,
}: {
  mono?: boolean;
  value: string;
}) {
  const displayValue = value || "-";
  return (
    <div
      className={cn(
        "min-w-0 truncate text-[11px] text-slate-700",
        mono && "font-mono",
      )}
      title={value || undefined}
    >
      {displayValue}
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
