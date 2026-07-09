"use client";

import { Ban, CheckCircle2, Loader2, Play, ShieldCheck } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import type {
  RemediationCandidateNode,
  RemediationExecutionSnapshot,
  RemediationPreviewSnapshot,
  RemediationPreviewTargetSnapshot,
  RemediationWorkflowDetail,
} from "../types";

interface RemediationPreviewPanelProps {
  canConfirm: boolean;
  canCreatePreview: boolean;
  detail: RemediationWorkflowDetail | null;
  execution: RemediationExecutionSnapshot | null;
  onCancelPreview: () => void;
  onConfirmPreview: () => void;
  onCreatePreview: () => void;
  preview: RemediationPreviewSnapshot | null;
  selectedActionCode: string;
  selectedNode: RemediationCandidateNode | null | undefined;
  working?: string;
}

export function RemediationPreviewPanel({
  canConfirm,
  canCreatePreview,
  detail,
  execution,
  onCancelPreview,
  onConfirmPreview,
  onCreatePreview,
  preview,
  selectedActionCode,
  selectedNode,
  working = "",
}: RemediationPreviewPanelProps) {
  const previewTargets = detail?.preview_targets ?? [];
  const displayTargets =
    previewTargets.length > 0
      ? previewTargets.slice(0, 4)
      : selectedNode
        ? [fallbackTarget(selectedNode)]
        : [];
  const previewSummary = detail?.preview_target_summary;
  const executionSummary = execution ?? detail?.execution ?? null;
  const targetCount =
    previewSummary?.total_count ||
    executionSummary?.total_count ||
    displayTargets.length ||
    0;
  const willApplyCount =
    previewSummary?.will_apply_count ??
    displayTargets.filter((target) => target.will_apply).length;
  const skippedCount =
    previewSummary?.skipped_count ??
    displayTargets.filter((target) => !target.will_apply).length;
  const planStatus =
    preview?.plan_status || detail?.preview?.plan_status || "ready";

  return (
    <section className="flex min-h-[390px] flex-col rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_16px_34px_-30px_rgba(15,23,42,0.6)]">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-slate-950">预览与确认</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          预览只读不下发，确认后才生成执行批次
        </p>
      </div>

      <div className="mt-4 rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-3">
        <div className="grid grid-cols-[1.1fr_0.7fr_0.8fr_0.7fr] gap-3">
          <Metric
            label="计划状态"
            value={statusLabel(planStatus)}
            tone={statusTone(planStatus)}
            large
          />
          <Metric label="目标" value={targetCount} />
          <Metric label="将下发" value={willApplyCount} tone="green" />
          <Metric label="跳过" value={skippedCount} tone="amber" />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-950">
            预览目标明细
          </div>
          <div className="mt-0.5 text-xs text-slate-400">
            {preview?.preview_id || detail?.preview_id
              ? shortId(preview?.preview_id || detail?.preview_id || "")
              : "生成预览后显示服务端校验结果"}
          </div>
        </div>
        {executionSummary
          ? statusPill(executionSummary.execute_status)
          : statusPill(preview?.preview_status || "created")}
      </div>

      <div className="mt-3 overflow-hidden rounded-[18px] border border-slate-200">
        <div className="grid grid-cols-[minmax(72px,0.75fr)_minmax(124px,1.35fr)_58px_58px] gap-2 bg-slate-50 px-4 py-2 text-[11px] font-medium text-slate-400">
          <span>终端</span>
          <span>目标对象</span>
          <span className="text-center">去重</span>
          <span className="text-center">校验</span>
        </div>
        <div className="divide-y divide-slate-100">
          {displayTargets.length > 0 ? (
            displayTargets.map((target, index) => (
              <div
                key={`${target.target_index}-${target.agent_id}-${target.target_key}-${index}`}
                className="grid grid-cols-[minmax(72px,0.75fr)_minmax(124px,1.35fr)_58px_58px] items-center gap-2 px-4 py-3 text-xs"
              >
                <span
                  className="truncate font-mono text-[11px] text-slate-600"
                  title={target.agent_id}
                >
                  {target.agent_id || "-"}
                </span>
                <span className="min-w-0">
                  <span
                    className="block truncate text-xs text-slate-700"
                    title={target.target_display || target.target_key}
                  >
                    {target.target_display || target.target_key || "-"}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                    {actionLabel(selectedActionCode || target.rule_id)}
                  </span>
                </span>
                <span className="flex justify-center">
                  {miniPill(target.dedupe_status || "available")}
                </span>
                <span className="flex justify-center">
                  {miniPill(target.validation_status || "valid")}
                </span>
              </div>
            ))
          ) : (
            <div className="flex min-h-24 items-center justify-center px-4 py-6 text-center text-xs text-slate-400">
              请选择处置目标并生成预览
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto grid grid-cols-[1fr_1fr_0.88fr] gap-3 pt-5">
        <Button
          type="button"
          disabled={!canCreatePreview || working === "create-preview"}
          onClick={onCreatePreview}
          className="h-11 rounded-2xl bg-slate-950 text-sm font-semibold text-white shadow-none hover:bg-slate-800"
        >
          {working === "create-preview" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ShieldCheck className="size-4" />
          )}
          生成预览
        </Button>
        <Button
          type="button"
          disabled={!canConfirm || working === "confirm-preview"}
          onClick={onConfirmPreview}
          className="h-11 rounded-2xl bg-teal-600 text-sm font-semibold text-white shadow-none hover:bg-teal-700"
        >
          {working === "confirm-preview" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Play className="size-4" />
          )}
          确认执行
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!canConfirm || working === "cancel-preview"}
          onClick={onCancelPreview}
          className="h-11 rounded-2xl border-red-200 bg-white text-sm font-semibold text-red-600 shadow-none hover:bg-red-50 hover:text-red-700"
        >
          {working === "cancel-preview" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Ban className="size-4" />
          )}
          取消预览
        </Button>
      </div>
    </section>
  );
}

function Metric({
  label,
  large,
  tone = "slate",
  value,
}: {
  label: string;
  large?: boolean;
  tone?: "slate" | "green" | "amber" | "red";
  value: number | string;
}) {
  return (
    <div className="min-w-0">
      <div className="truncate text-[11px] text-slate-400">{label}</div>
      <div
        className={cn(
          "mt-1 truncate font-mono font-semibold tabular-nums",
          large ? "text-xl" : "text-lg",
          tone === "green"
            ? "text-teal-600"
            : tone === "amber"
              ? "text-orange-600"
              : tone === "red"
                ? "text-red-600"
                : "text-slate-950",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function fallbackTarget(
  node: RemediationCandidateNode,
): RemediationPreviewTargetSnapshot {
  return {
    target_index: 0,
    agent_id: node.agent_ids[0] ?? "",
    node_keys: [node.node_key],
    rule_id: "",
    target_key: node.node_key,
    target_identifier: "",
    target_display: node.display_name,
    dedupe_status: "available",
    dedupe_reason: "",
    will_apply: true,
    existing_task_id: "",
    validation_status: "valid",
    validation_reason: "",
    backup_id: "",
  };
}

function statusPill(status: string | number | undefined) {
  const normalized = String(status ?? "")
    .trim()
    .toLowerCase();
  const tone = statusTone(normalized);
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold",
        pillTone(tone),
      )}
    >
      <CheckCircle2 className="size-3.5" />
      {statusLabel(normalized)}
    </span>
  );
}

function miniPill(status: string | number | undefined) {
  const normalized = String(status ?? "")
    .trim()
    .toLowerCase();
  const tone = statusTone(normalized);
  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-12 items-center justify-center rounded-full px-2 text-[11px] font-medium",
        pillTone(tone),
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
    dispatched: "已下发",
    expired: "已过期",
    failed: "失败",
    partial: "部分可执行",
    pending: "等待中",
    ready: "可执行",
    running: "执行中",
    skipped: "跳过",
    success: "成功",
    valid: "通过",
  };
  return labels[normalized] ?? String(status ?? "-");
}

function statusTone(
  status: string | number | undefined,
): "slate" | "green" | "amber" | "red" {
  const normalized = String(status ?? "")
    .trim()
    .toLowerCase();
  if (
    ["success", "ready", "valid", "available", "confirmed"].includes(normalized)
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

function pillTone(tone: string) {
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

function actionLabel(actionCode: string) {
  const labels: Record<string, string> = {
    "file.quarantine": "隔离文件",
    "file.restore": "恢复文件",
    "process.terminate": "终止进程",
    "process.force_terminate": "强制终止",
    "process.block_execute": "阻断执行",
    "process.bypass_execute": "放行执行",
    "net.block": "阻断网络",
    "net.bypass": "放行网络",
    file_quarantine: "隔离文件",
    net_block: "阻断网络",
    process_terminate: "终止进程",
  };
  return labels[actionCode] ?? (actionCode || "处置动作");
}

function shortId(value: string) {
  const normalized = value.trim();
  if (!normalized) return "-";
  const suffix = normalized.match(/([a-z]*-)?(\d{3,})$/i)?.[2];
  if (suffix) return `预览 ${suffix}`;
  if (normalized.length <= 14) return normalized;
  return `${normalized.slice(0, 8)}...${normalized.slice(-4)}`;
}
