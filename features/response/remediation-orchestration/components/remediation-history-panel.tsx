"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, RotateCcw } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import {
  getRemediationExecutionResult,
  getRemediationPreviewDetail,
  listRemediationPreviews,
  queryRemediationWorkflowStats,
} from "../api";
import type {
  RemediationExecutionSnapshot,
  RemediationPreviewList,
  RemediationPreviewListItem,
  RemediationWorkflowDetail,
  RemediationWorkflowStats,
  RemediationWorkflowStatsItem,
} from "../types";

const PAGE_SIZE = 6;

export interface RemediationHistoryData {
  detail: RemediationWorkflowDetail | null;
  execution: RemediationExecutionSnapshot | null;
  stats: RemediationWorkflowStats | null;
}

interface RemediationHistoryPanelProps {
  caseId?: string;
  className?: string;
  enabled?: boolean;
  endTime?: string;
  fallbackDetail?: RemediationWorkflowDetail | null;
  fallbackExecution?: RemediationExecutionSnapshot | null;
  fallbackStats?: RemediationWorkflowStats | null;
  onDataChange?: (data: RemediationHistoryData) => void;
  refreshKey?: number | string;
  startTime?: string;
  tenantId?: string;
  timezone?: string;
  workflowActionId?: string;
  workflowId?: string;
}

export function RemediationHistoryPanel({
  caseId = "",
  className,
  enabled = true,
  endTime = "",
  fallbackDetail = null,
  fallbackExecution = null,
  fallbackStats = null,
  onDataChange,
  refreshKey = 0,
  startTime = "",
  tenantId = "",
  timezone = "Asia/Shanghai",
  workflowActionId = "",
  workflowId = "",
}: RemediationHistoryPanelProps) {
  const [stats, setStats] = useState<RemediationWorkflowStats | null>(
    fallbackStats,
  );
  const [previewList, setPreviewList] = useState<RemediationPreviewList | null>(
    () => fallbackListFromStats(fallbackStats, fallbackDetail),
  );
  const [detail, setDetail] = useState<RemediationWorkflowDetail | null>(
    fallbackDetail,
  );
  const [execution, setExecution] =
    useState<RemediationExecutionSnapshot | null>(fallbackExecution);
  const [selectedPreviewId, setSelectedPreviewId] = useState(
    fallbackDetail?.preview_id || fallbackStats?.items[0]?.preview_id || "",
  );
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");

  const normalizedTenantId = tenantId.trim();
  const normalizedWorkflowActionId = workflowActionId.trim();
  const normalizedWorkflowId = workflowId.trim();
  const normalizedCaseId = caseId.trim();
  const hasQueryContext = Boolean(
    normalizedWorkflowActionId || normalizedWorkflowId || normalizedCaseId,
  );
  const listItems = previewList?.items ?? [];
  const selectedItem =
    listItems.find((item) => item.preview_id === selectedPreviewId) ??
    listItems[0];
  const busy = loading || Boolean(working);
  const previewTotal =
    previewList?.preview_summary.total_count ??
    stats?.summary.preview_stats.total_count ??
    listItems.length;
  const failedTotal =
    previewList?.target_summary.failed_count ??
    stats?.summary.execution_stats.failed_count ??
    0;
  const canGoPrev = (previewList?.page.page ?? page) > 1 && !busy;
  const canGoNext = Boolean(previewList?.page.has_next) && !busy;

  const queryScope = useMemo(
    () => ({
      tenant_id: normalizedTenantId,
      workflow_action_id: normalizedWorkflowActionId,
      workflow_id: normalizedWorkflowId,
      case_id: normalizedCaseId,
      start_time: startTime,
      end_time: endTime,
      timezone,
    }),
    [
      endTime,
      normalizedCaseId,
      normalizedTenantId,
      normalizedWorkflowActionId,
      normalizedWorkflowId,
      startTime,
      timezone,
    ],
  );

  const publishData = useCallback(
    (data: RemediationHistoryData) => {
      setStats(data.stats);
      setDetail(data.detail);
      setExecution(data.execution);
      onDataChange?.(data);
    },
    [onDataChange],
  );

  const fetchBatchDetail = useCallback(
    async (item: RemediationPreviewListItem | null) => {
      if (!item?.preview_id) {
        return { detail: null, execution: null };
      }

      const [nextDetail, nextExecution] = await Promise.all([
        getRemediationPreviewDetail({
          tenant_id: normalizedTenantId,
          preview_id: item.preview_id,
        }),
        item.execution_id
          ? getRemediationExecutionResult({
              tenant_id: normalizedTenantId,
              execution_id: item.execution_id,
            })
          : Promise.resolve(null),
      ]);

      return {
        detail: nextDetail,
        execution: nextExecution ?? nextDetail.execution,
      };
    },
    [normalizedTenantId],
  );

  const loadBatches = useCallback(async () => {
    if (!enabled || !hasQueryContext) {
      setError("");
      const fallbackList = fallbackListFromStats(fallbackStats, fallbackDetail);
      setPreviewList(fallbackList);
      setSelectedPreviewId(
        fallbackDetail?.preview_id || fallbackList?.items[0]?.preview_id || "",
      );
      publishData({
        detail: fallbackDetail,
        execution: fallbackExecution,
        stats: fallbackStats,
      });
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [nextStats, nextList] = await Promise.all([
        queryRemediationWorkflowStats(queryScope),
        listRemediationPreviews({
          ...queryScope,
          page,
          page_size: PAGE_SIZE,
        }),
      ]);
      const first = nextList.items[0] ?? null;
      setPreviewList(nextList);
      setSelectedPreviewId(first?.preview_id ?? "");

      const nextDetail = await fetchBatchDetail(first);
      publishData({
        detail: nextDetail.detail,
        execution: nextDetail.execution,
        stats: nextStats,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "处置记录查询失败");
      const fallbackList = fallbackListFromStats(fallbackStats, fallbackDetail);
      setPreviewList(fallbackList);
      setSelectedPreviewId(
        fallbackDetail?.preview_id || fallbackList?.items[0]?.preview_id || "",
      );
      publishData({
        detail: fallbackDetail,
        execution: fallbackExecution,
        stats: fallbackStats,
      });
    } finally {
      setLoading(false);
    }
  }, [
    enabled,
    fallbackDetail,
    fallbackExecution,
    fallbackStats,
    fetchBatchDetail,
    hasQueryContext,
    page,
    publishData,
    queryScope,
  ]);

  useEffect(() => {
    void loadBatches();
  }, [loadBatches, refreshKey]);

  const handleSelectBatch = useCallback(
    async (item: RemediationPreviewListItem) => {
      setSelectedPreviewId(item.preview_id);
      if (!enabled || !hasQueryContext) {
        return;
      }

      setWorking(`detail-${item.preview_id}`);
      setError("");
      try {
        const nextDetail = await fetchBatchDetail(item);
        publishData({
          detail: nextDetail.detail,
          execution: nextDetail.execution,
          stats,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "处置详情查询失败");
      } finally {
        setWorking("");
      }
    },
    [enabled, fetchBatchDetail, hasQueryContext, publishData, stats],
  );

  const handleRefresh = useCallback(async () => {
    setWorking("refresh");
    try {
      await loadBatches();
    } finally {
      setWorking("");
    }
  }, [loadBatches]);

  return (
    <section
      className={cn(
        "rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_16px_34px_-30px_rgba(15,23,42,0.6)]",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">处置记录</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            列表以预览批次为主对象，确认后关联执行批次和目标执行结果
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500">
            批次总数{" "}
            <span className="font-mono font-semibold text-slate-800">
              {previewTotal}
            </span>
            <span className="mx-2 text-slate-300">·</span>
            失败{" "}
            <span className="font-mono font-semibold text-red-600">
              {failedTotal}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={busy}
            onClick={() => void handleRefresh()}
            className="size-9 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="刷新处置记录"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RotateCcw className="size-4" />
            )}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-[18px] border border-slate-100">
        <table className="w-full table-fixed border-collapse text-left">
          <thead className="bg-slate-50 text-[11px] font-medium text-slate-400">
            <tr>
              <th className="w-[8%] px-4 py-3 font-medium">批次</th>
              <th className="hidden w-[10%] px-3 py-3 font-medium lg:table-cell">
                来源
              </th>
              <th className="w-[13%] px-3 py-3 font-medium">动作</th>
              <th className="w-[10%] px-3 py-3 text-center font-medium">
                预览
              </th>
              <th className="w-[10%] px-3 py-3 text-center font-medium">
                执行
              </th>
              <th className="hidden w-[7%] px-3 py-3 text-center font-medium xl:table-cell">
                目标
              </th>
              <th className="hidden w-[7%] px-3 py-3 text-center font-medium xl:table-cell">
                成功
              </th>
              <th className="hidden w-[7%] px-3 py-3 text-center font-medium xl:table-cell">
                失败
              </th>
              <th className="hidden w-[14%] px-3 py-3 font-medium lg:table-cell">
                最近更新时间
              </th>
              <th className="w-[17%] px-3 py-3 font-medium">结果</th>
              <th className="w-[9%] px-4 py-3 text-center font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {listItems.length > 0 ? (
              listItems.map((item) => {
                const active = item.preview_id === selectedPreviewId;
                const targetSummary = item.target_summary;
                const targetTotal =
                  targetSummary.total_count ||
                  item.preview_target_summary.total_count ||
                  0;
                return (
                  <tr
                    key={item.preview_id}
                    className={cn(
                      "text-xs text-slate-600 transition-colors duration-200",
                      active ? "bg-teal-50/40" : "bg-white hover:bg-slate-50",
                    )}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] font-semibold text-slate-700">
                        {shortId(item.preview_id)}
                      </span>
                    </td>
                    <td className="hidden px-3 py-3 lg:table-cell">
                      {sourceTypeLabel(item.source_type)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="block truncate"
                        title={actionTypeLabel(item.action_type)}
                      >
                        {actionTypeLabel(item.action_type)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {statusChip(item.preview_status)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {statusChip(
                        item.execute_status ||
                          (item.execution_id ? "created" : "pending"),
                      )}
                    </td>
                    <td className="hidden px-3 py-3 text-center font-mono tabular-nums xl:table-cell">
                      {targetTotal}
                    </td>
                    <td className="hidden px-3 py-3 text-center font-mono tabular-nums text-emerald-700 xl:table-cell">
                      {targetSummary.success_count}
                    </td>
                    <td className="hidden px-3 py-3 text-center font-mono tabular-nums text-red-600 xl:table-cell">
                      {targetSummary.failed_count}
                    </td>
                    <td className="hidden px-3 py-3 font-mono text-[11px] text-slate-500 lg:table-cell">
                      {formatDateTime(item.confirmed_at || item.created_at)}
                    </td>
                    <td className="px-3 py-3">
                      <span className="block truncate" title={resultText(item)}>
                        {resultText(item)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        type="button"
                        size="sm"
                        variant={active ? "default" : "outline"}
                        disabled={working.startsWith("detail-")}
                        onClick={() => void handleSelectBatch(item)}
                        className={cn(
                          "h-7 rounded-full px-4 text-xs shadow-none",
                          active
                            ? "bg-slate-950 text-white hover:bg-slate-800"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                        )}
                      >
                        {working === `detail-${item.preview_id}` ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          "查看"
                        )}
                      </Button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={11}
                  className="px-4 py-10 text-center text-sm text-slate-400"
                >
                  暂无处置记录，生成预览并确认执行后会显示在这里
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-400">
          {selectedItem
            ? `当前查看 ${shortId(selectedItem.preview_id)}`
            : "未选择记录"}
          {detail?.preview_targets?.length
            ? ` · ${detail.preview_targets.length} 个预览目标`
            : ""}
          {execution?.targets?.length
            ? ` · ${execution.targets.length} 个执行结果`
            : ""}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!canGoPrev}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="size-8 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="上一页"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-8 text-center font-mono text-xs text-slate-500">
            {previewList?.page.page ?? page}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!canGoNext}
            onClick={() => setPage((current) => current + 1)}
            className="size-8 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="下一页"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function fallbackListFromStats(
  stats: RemediationWorkflowStats | null,
  detail: RemediationWorkflowDetail | null,
): RemediationPreviewList | null {
  if (!stats) return null;
  const items = stats.items.map((item) =>
    statsItemToPreviewListItem(item, detail),
  );
  return {
    tenant_id: stats.tenant_id,
    start_time: stats.start_time,
    end_time: stats.end_time,
    timezone: stats.timezone,
    preview_summary: stats.summary.preview_stats,
    target_summary: stats.summary.execution_stats,
    items,
    page: {
      page: 1,
      page_size: items.length || PAGE_SIZE,
      total: items.length,
      has_next: false,
    },
  };
}

function statsItemToPreviewListItem(
  item: RemediationWorkflowStatsItem,
  detail: RemediationWorkflowDetail | null,
): RemediationPreviewListItem {
  const sameDetail = detail?.preview_id === item.preview_id;
  return {
    tenant_id: item.tenant_id,
    preview_id: item.preview_id,
    execution_id: item.execution_id,
    workflow_id: item.workflow_id,
    workflow_action_id: item.workflow_action_id,
    case_id: item.case_id,
    source_request_id: item.source_request_id,
    preview_status: item.preview_status,
    execute_status: item.execute_status,
    source_type: item.source_type,
    scope_type: item.scope_type,
    scope_id: item.scope_id,
    target_type: sameDetail ? (detail?.preview?.target_type ?? "") : "",
    action_type: sameDetail ? (detail?.preview?.action_type ?? "") : "",
    plan_status: sameDetail ? (detail?.preview?.plan_status ?? "") : "",
    created_at: item.created_at,
    confirmed_at: item.confirmed_at,
    expires_at: "",
    preview_target_summary: {
      total_count: item.stats.execution_stats.total_count,
      will_apply_count: item.stats.execution_stats.total_count,
      skipped_count: item.stats.execution_stats.skipped_count,
    },
    target_summary: {
      total_count: item.stats.execution_stats.total_count,
      created_count: item.stats.execution_stats.created_count,
      dispatched_count: item.stats.execution_stats.dispatched_count,
      running_count: item.stats.execution_stats.running_count,
      success_count: item.stats.execution_stats.success_count,
      failed_count: item.stats.execution_stats.failed_count,
      skipped_count: item.stats.execution_stats.skipped_count,
    },
  };
}

function statusChip(status: string | number | undefined) {
  const normalized = String(status ?? "")
    .trim()
    .toLowerCase();
  const tone = statusTone(normalized);
  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-14 items-center justify-center rounded-full px-2 text-[11px] font-medium",
        chipTone(tone),
      )}
    >
      {statusLabel(normalized)}
    </span>
  );
}

function statusLabel(status: string | number | undefined) {
  const normalized = String(status ?? "")
    .trim()
    .toLowerCase();
  const labels: Record<string, string> = {
    available: "可用",
    blocked: "阻断",
    canceled: "已取消",
    confirmed: "已确认",
    created: "已创建",
    dispatched: "执行中",
    expired: "已过期",
    failed: "失败",
    partial: "部分可执行",
    pending: "待确认",
    ready: "可执行",
    running: "执行中",
    skipped: "跳过",
    success: "成功",
    valid: "通过",
  };
  return labels[normalized] ?? String(status ?? "-");
}

function statusTone(status: string | number | undefined) {
  const normalized = String(status ?? "")
    .trim()
    .toLowerCase();
  if (
    ["success", "ready", "confirmed", "valid", "available"].includes(normalized)
  )
    return "green";
  if (["failed", "blocked", "canceled", "expired"].includes(normalized))
    return "red";
  if (
    ["created", "dispatched", "running", "pending", "partial"].includes(
      normalized,
    )
  )
    return "amber";
  return "slate";
}

function chipTone(tone: string) {
  switch (tone) {
    case "green":
      return "bg-emerald-50 text-emerald-700";
    case "red":
      return "bg-red-50 text-red-700";
    case "amber":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function actionTypeLabel(actionType: string | number | undefined) {
  const normalized = String(actionType ?? "")
    .trim()
    .toLowerCase();
  const labels: Record<string, string> = {
    block: "阻断",
    bypass: "放行",
    composite: "组合处置",
    delete: "删除",
    disable: "禁用",
    enable: "启用",
    file_quarantine: "隔离文件",
    multi_action: "组合处置",
    net_block: "阻断网络",
    process_terminate: "终止进程",
    quarantine: "隔离",
    reset_password: "重置密码",
    restore: "恢复",
    terminate: "终止",
  };
  return labels[normalized] ?? (normalized || "处置动作");
}

function sourceTypeLabel(sourceType: string) {
  const normalized = sourceType.trim().toLowerCase();
  if (normalized === "case_graph") return "案件图谱";
  if (normalized === "drill_graph") return "溯源图谱";
  if (normalized === "locate_graph") return "定位图谱";
  if (normalized === "manual") return "手动创建";
  return sourceType || "-";
}

function resultText(item: RemediationPreviewListItem) {
  if (!item.execution_id) {
    if (item.preview_status === "canceled") return "预览已取消";
    if (item.preview_status === "expired") return "预览已过期";
    return "待确认执行";
  }
  const summary = item.target_summary;
  const failed = summary.failed_count;
  const success = summary.success_count;
  const running =
    summary.running_count + summary.dispatched_count + summary.created_count;
  if (failed > 0) return `${failed} 个失败，${success} 个成功`;
  if (running > 0) return `命令已下发，等待 ${running} 台终端回写`;
  if (success > 0) return "策略已生效";
  return statusLabel(item.execute_status);
}

function shortId(value: string) {
  const normalized = value.trim();
  if (!normalized) return "-";
  const suffix = normalized.match(/([a-z]*-)?(\d{3,})$/i)?.[2];
  if (suffix) return suffix;
  if (normalized.length <= 12) return normalized;
  return `${normalized.slice(0, 8)}...${normalized.slice(-4)}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
