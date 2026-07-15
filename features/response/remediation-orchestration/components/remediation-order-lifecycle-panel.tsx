"use client";

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Loader2,
  Play,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  Workflow,
  XCircle,
} from "lucide-react";

import type {
  RemediationOrder,
  RemediationOrderItem,
} from "@/features/attack/remediation-order";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import { remediationOrderLifecycleActions } from "../remediation-order-model";
import { remediationOrderActionLabel } from "./remediation-order-parameter-editor";
import { remediationReadinessIssuePresentation } from "./remediation-order-readiness";

function targetText(item: RemediationOrderItem) {
  return (
    item.display_name.trim() || item.object_id.trim() || item.node_key.trim()
  );
}

function basename(value: string) {
  const normalized = value.trim().replace(/[\\/]+$/, "");
  return (
    normalized.split(/[\\/]/).filter(Boolean).pop() ||
    normalized ||
    "未命名目标"
  );
}

function orderStage(status: string) {
  const normalized = status.trim().toLowerCase();
  if (
    ["running", "success", "failed", "partial", "completed"].includes(
      normalized,
    )
  )
    return 3;
  if (["prepared", "ready", "confirmed"].includes(normalized)) return 2;
  return 1;
}

function stageBadge(status: string) {
  const normalized = status.trim().toLowerCase();
  const labels: Record<string, string> = {
    draft: "配置中",
    prepared: "待确认",
    ready: "待确认",
    confirmed: "已提交",
    running: "执行中",
    success: "执行成功",
    failed: "执行失败",
    completed: "执行完成",
    canceled: "已取消",
    expired: "已过期",
  };
  return labels[normalized] || normalized || "未知阶段";
}

function itemStatusLabel(status: string) {
  const normalized = status.trim().toLowerCase();
  const labels: Record<string, string> = {
    draft: "草稿",
    ready: "待下发",
    satisfied: "已满足",
    blocked: "已阻止",
    pending: "等待执行",
    running: "执行中",
    success: "执行成功",
    failed: "执行失败",
    uncertain: "结果待确认",
    skipped: "已跳过",
    canceled: "已取消",
  };
  return labels[normalized] || normalized || "未知";
}

function itemStatusClass(status: string) {
  switch (status.trim().toLowerCase()) {
    case "success":
      return "bg-emerald-100 text-emerald-700";
    case "failed":
      return "bg-red-100 text-red-700";
    case "uncertain":
    case "blocked":
      return "bg-amber-100 text-amber-800";
    case "running":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function executionTime(value: string) {
  if (!value.trim()) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleString("zh-CN", { hour12: false });
}

export interface RemediationOrderLifecyclePanelProps {
  complete: number;
  decisionLoading: boolean;
  dirty: boolean;
  firstIncomplete: RemediationOrderItem | null;
  onCancel: () => void;
  onConfirm: () => void;
  onDelete: () => void;
  onPrepare: () => void;
  onSave: () => void;
  onSelectItem: (itemId: string) => void;
  order: RemediationOrder;
  pollError: string;
  total: number;
  validationErrors: Record<string, string>;
  working: string;
}

export function RemediationOrderLifecyclePanel({
  complete,
  decisionLoading,
  dirty,
  firstIncomplete,
  onCancel,
  onConfirm,
  onDelete,
  onPrepare,
  onSave,
  onSelectItem,
  order,
  pollError,
  total,
  validationErrors,
  working,
}: RemediationOrderLifecyclePanelProps) {
  const stage = orderStage(order.status);
  const lifecycle = remediationOrderLifecycleActions(order);
  const busy = Boolean(working);
  const normalizedStatus = order.status.trim().toLowerCase();
  const showPrepared = normalizedStatus === "prepared";
  const showExecution =
    order.items.some(
      (item) => item.operation_id || item.dispatch_id || item.execution,
    ) || stage === 3;
  const blocked = Math.max(total - complete, 0);
  const readinessIssue = firstIncomplete
    ? remediationReadinessIssuePresentation(
        validationErrors[firstIncomplete.item_id] ?? "",
      )
    : null;

  return (
    <aside
      id="remediation-order-prepare"
      className="min-h-[620px] min-w-0 rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_16px_45px_-36px_rgba(15,23,42,0.45)]"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
          <Workflow className="size-4 text-teal-600" aria-hidden />
          提交与执行
        </h2>
        <span className="rounded-full bg-slate-950 px-3 py-1 text-[10px] font-bold text-white">
          {stageBadge(order.status)}
        </span>
      </div>

      <div
        className="mt-7 flex items-center"
        aria-label={`当前处置阶段：第 ${stage} 阶段`}
      >
        {["配置", "确认", "执行"].map((label, index) => {
          const step = index + 1;
          const active = step <= stage;
          return (
            <div
              key={label}
              className={cn("flex items-center", index < 2 && "flex-1")}
            >
              <span
                className={cn("flex items-center gap-2", index > 0 && "pl-2")}
              >
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full border-2 text-[10px] font-bold",
                    active
                      ? "border-teal-600 bg-teal-600 text-white"
                      : "border-slate-300 bg-white text-slate-500",
                  )}
                >
                  {step < stage || (step === 1 && active) ? (
                    <Check className="size-4" aria-hidden />
                  ) : (
                    step
                  )}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    active ? "text-slate-800" : "text-slate-500",
                  )}
                >
                  {label}
                </span>
              </span>
              {index < 2 ? (
                <span
                  className={cn(
                    "mx-3 h-0.5 min-w-6 flex-1",
                    step < stage ? "bg-teal-500" : "bg-slate-300",
                  )}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      {lifecycle.edit ? (
        <>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-800">
                  提交检查
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  提交前的目标与参数状态
                </div>
              </div>
              <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-white">
                {complete} / {total}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3">
                <div className="text-[10px] font-medium text-emerald-700">
                  可提交
                </div>
                <div className="mt-1 text-lg font-bold text-emerald-800">
                  {complete}
                </div>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
                <div className="text-[10px] font-medium text-amber-700">
                  需处理
                </div>
                <div className="mt-1 text-lg font-bold text-amber-800">
                  {blocked}
                </div>
              </div>
            </div>
          </div>

          {decisionLoading ? (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
              <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
              正在核对目标适用性与活动冲突…
            </div>
          ) : firstIncomplete && readinessIssue ? (
            <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="mt-0.5 size-5 shrink-0 text-amber-700"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-amber-900">
                    当前阻塞项
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div
                      className="min-w-0 truncate text-xs font-semibold text-amber-900"
                      title={targetText(firstIncomplete)}
                    >
                      {basename(targetText(firstIncomplete))} ·{" "}
                      {remediationOrderActionLabel(firstIncomplete)}
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold",
                        readinessIssue.badgeClassName,
                      )}
                    >
                      {readinessIssue.badge}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-amber-700">
                    {readinessIssue.message}
                  </p>
                  <button
                    type="button"
                    onClick={() => onSelectItem(firstIncomplete.item_id)}
                    className="mt-3 min-h-9 rounded-full border border-amber-500 bg-white px-4 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                  >
                    {readinessIssue.action}
                  </button>
                </div>
              </div>
            </div>
          ) : total > 0 ? (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
              <div>
                <div className="text-xs font-bold">所有目标均可提交</div>
                <p className="mt-1 text-xs leading-5 text-emerald-700">
                  当前没有缺失参数或动作冲突，提交后将进行最终检查。
                </p>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {showPrepared ? (
        <div
          className={cn(
            "mt-6 rounded-2xl border p-4",
            order.confirmable
              ? "border-teal-200 bg-teal-50"
              : "border-amber-200 bg-amber-50",
          )}
        >
          <div className="flex items-start gap-3">
            <ShieldCheck
              className={cn(
                "mt-0.5 size-5 shrink-0",
                order.confirmable ? "text-teal-700" : "text-amber-700",
              )}
              aria-hidden
            />
            <div className="min-w-0">
              <div
                className={cn(
                  "text-xs font-bold",
                  order.confirmable ? "text-teal-900" : "text-amber-900",
                )}
              >
                {order.confirmable ? "提交检查已通过" : "提交检查未通过"}
              </div>
              <p
                className={cn(
                  "mt-1 text-xs leading-5",
                  order.confirmable ? "text-teal-700" : "text-amber-700",
                )}
              >
                {order.summary.ready} 个目标待下发，{order.summary.satisfied}{" "}
                个目标已满足，{order.summary.blocked} 个目标暂不可执行。
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {showExecution ? (
        <div className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-semibold text-slate-700">执行状态</div>
            <div className="text-[10px] text-slate-500">
              成功 {order.summary.success} · 失败 {order.summary.failed} ·
              待确认 {order.summary.uncertain}
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {order.items.map((item) => {
              const execution = item.execution;
              const operationId = execution?.operation_id || item.operation_id;
              const dispatchId = execution?.dispatch_id || item.dispatch_id;
              const errorCode = execution?.error_code || item.error_code;
              const errorMessage =
                execution?.error_message ||
                item.error_message ||
                item.reason_message;
              const finishedAt = executionTime(
                execution?.finished_at || item.finished_at,
              );
              return (
                <div
                  key={item.item_id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div
                        className="truncate text-xs font-semibold text-slate-800"
                        title={targetText(item)}
                      >
                        {basename(targetText(item))}
                      </div>
                      <div className="mt-1 text-[10px] text-slate-500">
                        {remediationOrderActionLabel(item)}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold",
                        itemStatusClass(item.status),
                      )}
                    >
                      {itemStatusLabel(item.status)}
                    </span>
                  </div>
                  {operationId ? (
                    <div className="mt-3 grid grid-cols-[58px_minmax(0,1fr)] gap-x-2 text-[10px] leading-4">
                      <span className="text-slate-500">Operation</span>
                      <span className="break-all font-mono text-slate-700">
                        {operationId}
                      </span>
                    </div>
                  ) : null}
                  {dispatchId ? (
                    <div className="mt-1 grid grid-cols-[58px_minmax(0,1fr)] gap-x-2 text-[10px] leading-4">
                      <span className="text-slate-500">Dispatch</span>
                      <span className="break-all font-mono text-slate-700">
                        {dispatchId}
                      </span>
                    </div>
                  ) : null}
                  {execution ? (
                    <div className="mt-2 text-[10px] leading-4 text-slate-500">
                      下发 {execution.publish_status || "-"} · 执行{" "}
                      {execution.execution_status || item.status}
                    </div>
                  ) : null}
                  {finishedAt ? (
                    <div className="mt-1 text-[10px] leading-4 text-slate-500">
                      完成时间 {finishedAt}
                    </div>
                  ) : null}
                  {errorCode || errorMessage ? (
                    <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[10px] leading-4 text-red-700">
                      {errorCode ? `${errorCode} · ` : ""}
                      {errorMessage}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-2 border-t border-slate-100 pt-5">
        {lifecycle.edit ? (
          <>
            {dirty ? (
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-full border-slate-300"
                disabled={busy}
                onClick={onSave}
              >
                {working === "save" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Save />
                )}
                保存草稿
              </Button>
            ) : (
              <div className="flex h-10 items-center justify-center gap-2 text-xs font-medium text-slate-500">
                <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
                草稿已保存
              </div>
            )}
            <Button
              type="button"
              className="h-11 w-full rounded-full bg-teal-600 text-white hover:bg-teal-700"
              disabled={
                busy || decisionLoading || total === 0 || complete !== total
              }
              onClick={onPrepare}
            >
              {working === "prepare" ? (
                <Loader2 className="animate-spin" />
              ) : (
                <ShieldCheck />
              )}
              {working === "prepare"
                ? "正在检查"
                : dirty
                  ? "保存并提交处置"
                  : "提交处置"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-10 w-full rounded-full text-red-600 hover:bg-red-50 hover:text-red-700"
              disabled={busy}
              onClick={onDelete}
            >
              <Trash2 />
              删除草稿
            </Button>
          </>
        ) : null}

        {order.status.trim().toLowerCase() === "prepared" ? (
          <>
            {order.confirmable ? (
              <Button
                type="button"
                className="h-11 w-full rounded-full bg-teal-600 text-white hover:bg-teal-700"
                disabled={busy || !lifecycle.confirm}
                onClick={onConfirm}
              >
                <Play />
                确认并执行
              </Button>
            ) : (
              <Button
                type="button"
                className="h-11 w-full rounded-full bg-teal-600 text-white hover:bg-teal-700"
                disabled={busy}
                onClick={onPrepare}
              >
                {working === "prepare" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <RotateCcw />
                )}
                {working === "prepare" ? "正在检查" : "重新检查"}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              className="h-10 w-full rounded-full text-red-600 hover:bg-red-50 hover:text-red-700"
              disabled={busy}
              onClick={onCancel}
            >
              <XCircle />
              放弃本次提交
            </Button>
            {!order.confirmable ? (
              <p className="text-center text-xs leading-5 text-amber-700">
                部分目标当前不可执行，状态变化后可以重新检查。
              </p>
            ) : null}
          </>
        ) : null}

        {lifecycle.poll ? (
          <div
            className={cn(
              "flex items-start justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-medium",
              pollError
                ? "bg-amber-50 text-amber-800"
                : "bg-blue-50 text-blue-700",
            )}
            role="status"
          >
            {pollError ? (
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            ) : (
              <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
            )}
            <span>{pollError || "正在轮询执行状态"}</span>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
