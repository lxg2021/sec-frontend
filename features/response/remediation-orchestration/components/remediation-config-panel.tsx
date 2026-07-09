"use client";

import {
  CheckCircle2,
  Loader2,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import type {
  RemediationActionOption,
  RemediationCandidateNode,
  ResolveRemediationNodeAgentsResponse,
} from "../types";

interface RemediationConfigPanelProps {
  actionOptions: RemediationActionOption[];
  agentResolve: ResolveRemediationNodeAgentsResponse | null;
  mockMode?: boolean;
  onQueryActions: () => void;
  onSelectAction: (actionCode: string) => void;
  scopeId: string;
  scopeType: string;
  selectedActionCode: string;
  selectedNode: RemediationCandidateNode | null | undefined;
  working?: string;
}

export function RemediationConfigPanel({
  actionOptions,
  agentResolve,
  mockMode = false,
  onQueryActions,
  onSelectAction,
  scopeId,
  scopeType,
  selectedActionCode,
  selectedNode,
  working = "",
}: RemediationConfigPanelProps) {
  const selectedAction =
    actionOptions.find((option) => option.action_code === selectedActionCode) ??
    actionOptions[0] ??
    null;
  const resolveStatus =
    agentResolve?.status || selectedNode?.resolve_status || "unresolved";
  const agents = selectedNode?.agent_ids?.length
    ? selectedNode.agent_ids
    : (agentResolve?.agent_ids ?? []);

  return (
    <section className="flex min-h-[390px] flex-col rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_16px_34px_-30px_rgba(15,23,42,0.6)]">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-slate-950">处置配置</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          按目标类型展示可用动作，生成预览前不下发
        </p>
      </div>

      <div className="mt-4 rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-400">
              当前目标
            </div>
            <div
              className="mt-1 truncate text-sm font-semibold text-slate-950"
              title={selectedNode?.display_name}
            >
              {selectedNode ? selectedNode.display_name : "未选择目标"}
            </div>
            <div className="mt-1 truncate text-[11px] text-slate-500">
              {entityTypeLabel(selectedNode?.entity_type || "")} ·{" "}
              {agents.length || 0} 个终端 · {scopeTypeLabel(scopeType)}{" "}
              {shortValue(scopeId)}
            </div>
          </div>
          {statusPill(resolveStatus)}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-950">动作选择</div>
          <div className="mt-0.5 text-xs text-slate-400">
            只显示当前目标可执行的处置动作
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!selectedNode || mockMode || working === "query-actions"}
          onClick={onQueryActions}
          className="h-8 rounded-full px-3 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          {working === "query-actions" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RotateCcw className="size-3.5" />
          )}
          刷新
        </Button>
      </div>

      <div className="mt-3 space-y-2">
        {actionOptions.length > 0 ? (
          actionOptions.slice(0, 4).map((option) => {
            const active = option.action_code === selectedActionCode;
            return (
              <button
                key={option.action_code}
                type="button"
                onClick={() => onSelectAction(option.action_code)}
                className={cn(
                  "group flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors duration-200",
                  active
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:bg-teal-50/50",
                )}
              >
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block truncate text-sm font-semibold",
                      active ? "text-white" : "text-slate-950",
                    )}
                  >
                    {actionOptionLabel(option)}
                  </span>
                  <span
                    className={cn(
                      "mt-1 block truncate text-[11px]",
                      active ? "text-slate-300" : "text-slate-400",
                    )}
                  >
                    {actionOptionHint(option)}
                  </span>
                </span>
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full",
                    active
                      ? "bg-teal-500 text-white"
                      : "bg-slate-100 text-slate-300 group-hover:bg-white group-hover:text-teal-500",
                  )}
                >
                  <CheckCircle2 className="size-3.5" />
                </span>
              </button>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
            <SlidersHorizontal className="mx-auto size-6 text-slate-300" />
            <div className="mt-2 text-sm font-medium text-slate-700">
              暂无可用动作
            </div>
            <div className="mt-1 text-xs leading-5 text-slate-400">
              请先确认目标类型、终端解析结果，再刷新动作列表
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-4">
        <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-800">
                参数确认
              </div>
              <div className="mt-1 truncate text-[11px] text-slate-400">
                {parameterHint(selectedAction?.action_code || "")}
              </div>
            </div>
            <span className="flex h-6 w-11 shrink-0 items-center rounded-full bg-teal-600 p-0.5">
              <span className="ml-auto size-5 rounded-full bg-white shadow-sm" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function actionOptionLabel(option: RemediationActionOption) {
  return option.display_name?.trim() || actionLabel(option.action_code);
}

function actionOptionHint(option: RemediationActionOption) {
  const hints = [
    option.requires_agent ? "需要终端" : "",
    option.requires_history ? "依赖历史" : "",
    option.contexts.length > 0 ? `${option.contexts.length} 个上下文` : "",
  ].filter(Boolean);
  return hints.join(" · ") || "当前目标可执行";
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
  };
  return labels[actionCode] ?? (actionCode || "处置动作");
}

function parameterHint(actionCode: string) {
  if (actionCode.startsWith("file.")) return "隔离后保留加密副本，必要时可回滚";
  if (actionCode.startsWith("process."))
    return "默认包含子进程，确认后生成执行批次";
  if (actionCode.startsWith("net.")) return "默认按出站方向生成网络阻断策略";
  return "确认动作参数后再生成预览";
}

function entityTypeLabel(entityType: string) {
  const normalized = entityType.trim().toLowerCase();
  if (normalized.includes("file")) return "文件";
  if (normalized.includes("process")) return "进程";
  if (normalized.includes("net")) return "网络";
  if (normalized.includes("dns")) return "域名";
  if (normalized.includes("url")) return "URL";
  return entityType || "目标";
}

function scopeTypeLabel(scopeType: string) {
  const normalized = scopeType.trim().toLowerCase();
  if (normalized === "case") return "案件";
  if (normalized === "positioning") return "定位";
  return scopeType || "-";
}

function statusPill(status: string) {
  const normalized = status.trim().toLowerCase();
  const label =
    normalized === "resolved"
      ? "动作就绪"
      : normalized === "ambiguous"
        ? "需确认"
        : normalized === "unresolvable"
          ? "不可处置"
          : "待解析";
  const className =
    normalized === "resolved"
      ? "bg-emerald-50 text-emerald-700"
      : normalized === "ambiguous"
        ? "bg-amber-50 text-amber-700"
        : normalized === "unresolvable"
          ? "bg-red-50 text-red-700"
          : "bg-slate-100 text-slate-500";
  return (
    <span
      className={cn(
        "inline-flex h-7 shrink-0 items-center rounded-full px-3 text-[11px] font-semibold",
        className,
      )}
    >
      {label}
    </span>
  );
}

function shortValue(value: string) {
  const normalized = value.trim();
  if (!normalized) return "-";
  if (normalized.length <= 14) return normalized;
  return `${normalized.slice(0, 8)}...${normalized.slice(-4)}`;
}
