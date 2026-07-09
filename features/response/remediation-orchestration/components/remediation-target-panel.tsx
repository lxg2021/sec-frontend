"use client";

import {
  FileWarning,
  Network,
  Search,
  Square,
  TerminalSquare,
} from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import type { RemediationCandidateNode } from "../types";

interface RemediationTargetPanelProps {
  nodes: RemediationCandidateNode[];
  onRefresh: () => void;
  onResolve: () => void;
  onSelectNode: (node: RemediationCandidateNode) => void;
  refreshing?: boolean;
  scopeType: string;
  selectedNodeKey: string;
  sourceType: string;
  working?: string;
}

export function RemediationTargetPanel({
  nodes,
  onRefresh,
  onResolve,
  onSelectNode,
  refreshing = false,
  scopeType,
  selectedNodeKey,
  sourceType,
  working = "",
}: RemediationTargetPanelProps) {
  const selectedNode =
    nodes.find((node) => node.node_key === selectedNodeKey) ?? nodes[0] ?? null;
  const displayNodes = nodes.slice(0, 3);
  const selectedCount = nodes.length;

  return (
    <section className="flex min-h-[390px] flex-col rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_16px_34px_-30px_rgba(15,23,42,0.6)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-950">
            案件图谱与处置目标
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            图谱提供处置对象、终端归属和快照上下文
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
          className="h-9 shrink-0 rounded-full border-slate-200 px-4 text-xs text-slate-600 hover:bg-slate-50"
        >
          从图谱选择
        </Button>
      </div>

      <div className="relative mt-4 min-h-[218px] overflow-hidden rounded-[18px] border border-slate-200 bg-slate-50">
        <div className="absolute left-4 top-4 inline-flex h-8 items-center rounded-full border border-slate-200 bg-white px-3 text-xs text-slate-500">
          <span className="mr-2 size-2 rounded-full bg-teal-600" />
          已选择 {selectedCount} 个目标
        </div>

        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 520 220"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M112 116 C196 90 248 88 328 44"
            stroke="#cbd5e1"
            strokeWidth="1.2"
            fill="none"
          />
          <path
            d="M112 116 C206 150 254 164 332 166"
            stroke="#cbd5e1"
            strokeWidth="1.2"
            fill="none"
          />
          <path
            d="M328 44 C398 70 418 96 448 116"
            stroke="#0f766e"
            strokeWidth="1.8"
            fill="none"
          />
        </svg>

        <GraphNode
          className="left-[16%] top-[41%]"
          label="Host-01"
          tone="dark"
          type="host"
        />
        <GraphNode
          active={selectedNode?.node_key === displayNodes[0]?.node_key}
          className="left-[54%] top-[11%]"
          label={entityTypeLabel(displayNodes[0]?.entity_type || "File")}
          tone="green"
          type={displayNodes[0]?.entity_type || "File"}
          onClick={
            displayNodes[0] ? () => onSelectNode(displayNodes[0]) : undefined
          }
        />
        <GraphNode
          active={selectedNode?.node_key === displayNodes[2]?.node_key}
          className="left-[79%] top-[43%]"
          label={entityTypeLabel(displayNodes[2]?.entity_type || "NetEndpoint")}
          tone="amber"
          type={displayNodes[2]?.entity_type || "NetEndpoint"}
          onClick={
            displayNodes[2] ? () => onSelectNode(displayNodes[2]) : undefined
          }
        />
        <GraphNode
          active={selectedNode?.node_key === displayNodes[1]?.node_key}
          className="left-[64%] top-[70%]"
          label={entityTypeLabel(displayNodes[1]?.entity_type || "Process")}
          tone="slate"
          type={displayNodes[1]?.entity_type || "Process"}
          onClick={
            displayNodes[1] ? () => onSelectNode(displayNodes[1]) : undefined
          }
        />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">已选目标</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            {sourceTypeLabel(sourceType)} · {scopeTypeLabel(scopeType)}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={!selectedNode || working === "resolve-node"}
          onClick={onResolve}
          className="h-8 rounded-full px-3 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <Search className="size-3.5" />
          解析
        </Button>
      </div>

      <div className="mt-3 space-y-2">
        {nodes.map((node) => {
          const active = node.node_key === selectedNodeKey;
          return (
            <button
              key={node.node_key}
              type="button"
              onClick={() => onSelectNode(node)}
              className={cn(
                "grid w-full grid-cols-[22px_minmax(0,1fr)_minmax(110px,0.8fr)_72px] items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors duration-200",
                active
                  ? "border-teal-200 bg-teal-50/70"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-md border",
                  active
                    ? "border-teal-300 bg-white text-teal-600"
                    : "border-slate-200 bg-white text-slate-400",
                )}
              >
                <NodeGlyph entityType={node.entity_type} className="size-3.5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs text-slate-700">
                  {entityTypeLabel(node.entity_type)} · {node.display_name}
                </span>
              </span>
              <span className="truncate text-[11px] text-slate-400">
                主机 ID: {(node.agent_ids ?? []).join(" / ") || "-"}
              </span>
              {nodeStatusPill(node.resolve_status)}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function GraphNode({
  active,
  className,
  label,
  onClick,
  tone,
  type,
}: {
  active?: boolean;
  className: string;
  label: string;
  onClick?: () => void;
  tone: "amber" | "dark" | "green" | "slate";
  type: string;
}) {
  const toneClass =
    tone === "dark"
      ? "bg-slate-950 text-white ring-slate-950"
      : tone === "green"
        ? "bg-emerald-50 text-emerald-700 ring-emerald-300"
        : tone === "amber"
          ? "bg-amber-50 text-amber-700 ring-amber-300"
          : "bg-slate-100 text-slate-500 ring-slate-300";

  const content = (
    <>
      <span
        className={cn(
          "flex size-14 items-center justify-center rounded-full ring-2 transition-transform duration-200",
          toneClass,
          active && "scale-105 ring-[3px]",
        )}
      >
        <NodeGlyph entityType={type} className="size-6" />
      </span>
      <span className="mt-2 max-w-24 truncate text-center text-[11px] font-semibold text-slate-700">
        {label}
      </span>
    </>
  );

  if (!onClick) {
    return (
      <div
        className={cn(
          "absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center",
          className,
        )}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center",
        className,
      )}
    >
      {content}
    </button>
  );
}

function NodeGlyph({
  className,
  entityType,
}: {
  className?: string;
  entityType: string;
}) {
  const Icon = nodeIcon(entityType);
  return <Icon className={className} />;
}

function nodeIcon(entityType: string) {
  const normalized = entityType.trim().toLowerCase();
  if (normalized.includes("file")) return FileWarning;
  if (normalized.includes("process")) return TerminalSquare;
  if (
    normalized.includes("net") ||
    normalized.includes("dns") ||
    normalized.includes("url")
  )
    return Network;
  return Square;
}

function nodeStatusPill(status: string) {
  const normalized = status.trim().toLowerCase();
  const label =
    normalized === "resolved"
      ? "可处置"
      : normalized === "ambiguous"
        ? "需确认"
        : normalized === "unresolvable"
          ? "不可处置"
          : "未解析";
  const className =
    normalized === "resolved"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized === "ambiguous"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : normalized === "unresolvable"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-slate-200 bg-slate-50 text-slate-500";
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center justify-center rounded-full border px-2 text-[11px] font-medium",
        className,
      )}
    >
      {label}
    </span>
  );
}

function entityTypeLabel(entityType: string) {
  const normalized = entityType.trim().toLowerCase();
  if (normalized.includes("file")) return "文件";
  if (normalized.includes("process")) return "进程";
  if (normalized.includes("net")) return "网络";
  if (normalized.includes("dns")) return "域名";
  if (normalized.includes("url")) return "URL";
  if (normalized.includes("account")) return "账号";
  if (normalized.includes("service")) return "服务";
  return entityType || "目标";
}

function sourceTypeLabel(sourceType: string) {
  const normalized = sourceType.trim().toLowerCase();
  if (normalized === "case_graph") return "案件图谱";
  if (normalized === "drill_graph") return "溯源图谱";
  if (normalized === "locate_graph") return "定位图谱";
  if (normalized === "manual") return "手动创建";
  return sourceType || "-";
}

function scopeTypeLabel(scopeType: string) {
  const normalized = scopeType.trim().toLowerCase();
  if (normalized === "case") return "案件范围";
  if (normalized === "positioning") return "定位范围";
  return scopeType || "-";
}
