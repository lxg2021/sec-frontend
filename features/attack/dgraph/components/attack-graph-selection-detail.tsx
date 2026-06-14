"use client";

import { Copy, GitBranch, MousePointer2, Server, X } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";

import type {
  AttackGraphEdgeModel,
  AttackGraphNodeModel,
} from "../model/core/attack-graph-data";
import {
  getAttackGraphSelectedEdgeSummary,
  getAttackGraphSelectedNodeSummary,
} from "../model/detail/attack-graph-detail-resolver";
import type {
  AttackGraphBadge,
  AttackGraphDetailField,
  AttackGraphEdgeSummary,
  AttackGraphNodeSummary,
  AttackGraphPresentationTone,
} from "../model/detail/attack-graph-detail-types";

export type AttackGraphSelectionDetailItem =
  | { kind: "node"; node: AttackGraphNodeModel }
  | { kind: "edge"; edge: AttackGraphEdgeModel };

export interface AttackGraphSelectionDetailProps {
  item: AttackGraphSelectionDetailItem | null;
  className?: string;
  nodesById?: Map<string, AttackGraphNodeModel>;
  onClose?: () => void;
}

const TONE_CLASS_NAMES: Record<AttackGraphPresentationTone, string> = {
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  orange: "border-orange-200 bg-orange-50 text-orange-700",
  pink: "border-pink-200 bg-pink-50 text-pink-700",
  purple: "border-purple-200 bg-purple-50 text-purple-700",
  red: "border-rose-200 bg-rose-50 text-rose-700",
  slate: "border-slate-200 bg-slate-50 text-slate-600",
};

const IMPORTANT_TONE_CLASS_NAMES: Record<AttackGraphPresentationTone, string> = {
  amber: "border-amber-200 bg-amber-50/70",
  blue: "border-blue-200 bg-blue-50/70",
  cyan: "border-cyan-200 bg-cyan-50/70",
  green: "border-emerald-200 bg-emerald-50/70",
  orange: "border-orange-200 bg-orange-50/70",
  pink: "border-pink-200 bg-pink-50/70",
  purple: "border-purple-200 bg-purple-50/70",
  red: "border-rose-200 bg-rose-50/70",
  slate: "border-slate-200 bg-slate-50/70",
};

export function AttackGraphSelectionDetail({
  item,
  className,
  nodesById,
  onClose,
}: AttackGraphSelectionDetailProps) {
  if (!item) {
    return null;
  }

  const isNode = item.kind === "node";
  const summary = isNode
    ? getAttackGraphSelectedNodeSummary(item.node)
    : getAttackGraphSelectedEdgeSummary(item.edge, nodesById);
  const primaryTone = summary.badges[0]?.tone ?? "slate";
  const title = isNode
    ? (summary as AttackGraphNodeSummary).title
    : (summary as AttackGraphEdgeSummary).label;
  const subtitle = isNode
    ? (summary as AttackGraphNodeSummary).subtitle
    : (summary as AttackGraphEdgeSummary).description;

  return (
    <aside
      className={cn(
        "pointer-events-auto absolute bottom-4 right-4 top-4 z-20 flex w-[360px] max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white/95 shadow-[0_18px_46px_rgba(15,23,42,0.18)] backdrop-blur",
        className,
      )}
      data-attack-graph-selection-detail={item.kind}
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-4">
        <div className="flex min-w-0 gap-3">
          <div
            className={cn(
              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border",
              TONE_CLASS_NAMES[primaryTone],
            )}
          >
            {isNode ? (
              <Server className="h-4 w-4" />
            ) : (
              <GitBranch className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              <MousePointer2 className="h-3 w-3" />
              {isNode ? "Selected Node" : "Selected Edge"}
            </div>
            <h3 className="mt-1 truncate text-base font-semibold leading-6 text-slate-950">
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-0.5 truncate text-xs leading-5 text-slate-500">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          onClick={onClose}
          aria-label="Close selection detail"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {summary.badges.length > 0 ? (
        <div className="flex flex-wrap gap-2 border-b border-slate-100 px-4 py-3">
          {summary.badges.map((badge) => (
            <SummaryBadge key={badge.key} badge={badge} />
          ))}
        </div>
      ) : null}

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 px-4 py-4">
          <FieldSection
            title="Key Fields"
            fields={summary.fields.filter((field) => field.important)}
          />
          <FieldSection
            title="Properties"
            fields={summary.fields.filter((field) => !field.important)}
          />
        </div>
      </ScrollArea>
    </aside>
  );
}

function SummaryBadge({ badge }: { badge: AttackGraphBadge }) {
  const tone = badge.tone ?? "slate";

  return (
    <Badge
      variant="outline"
      className={cn(
        "max-w-full rounded-md px-2 py-1 text-xs font-medium",
        TONE_CLASS_NAMES[tone],
      )}
      title={badge.title}
    >
      <span className="truncate">{badge.label}</span>
    </Badge>
  );
}

function FieldSection({
  fields,
  title,
}: {
  fields: AttackGraphDetailField[];
  title: string;
}) {
  if (fields.length === 0) {
    return null;
  }

  return (
    <section>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </h4>
      <div className="space-y-2">
        {fields.map((field) => (
          <DetailField key={field.key} field={field} />
        ))}
      </div>
    </section>
  );
}

function DetailField({ field }: { field: AttackGraphDetailField }) {
  const tone = field.tone ?? "slate";

  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2",
        field.important
          ? IMPORTANT_TONE_CLASS_NAMES[tone]
          : "border-slate-100 bg-slate-50/70",
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          {field.label}
        </span>
        {field.copyable ? (
          <button
            type="button"
            className="rounded-sm p-0.5 text-slate-300 transition-colors hover:bg-white hover:text-slate-600"
            onClick={() => {
              void navigator.clipboard?.writeText(field.value);
            }}
            aria-label={`Copy ${field.label}`}
            title="Copy value"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      <div
        className={cn(
          "break-words text-xs leading-5 text-slate-700",
          field.mono ? "font-mono" : "font-medium",
        )}
        title={field.value}
      >
        {field.value}
      </div>
    </div>
  );
}

export default AttackGraphSelectionDetail;
