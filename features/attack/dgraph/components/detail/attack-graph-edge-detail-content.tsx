"use client";

import { ArrowRight, Info, Link2, X } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type {
  AttackGraphEdgeModel,
  AttackGraphNodeModel,
} from "../../model/core/attack-graph-data";
import {
  buildAttackGraphEdgeDetailViewModel,
  type AttackGraphEdgeDetailNodeViewModel,
} from "../../model/detail/attack-graph-edge-detail-view-model";
import type { AttackGraphPresentationTone } from "../../model/detail/attack-graph-detail-types";
import {
  ATTACK_GRAPH_DETAIL_FIELD_TONE_CLASS_NAMES,
  getAttackGraphDetailIcon,
} from "./attack-graph-detail-presentation";
import { AttackGraphDetailTruncatedText } from "./attack-graph-detail-text";

interface AttackGraphEdgeDetailContentProps {
  edge: AttackGraphEdgeModel;
  nodesById?: Map<string, AttackGraphNodeModel>;
}

export function AttackGraphEdgeDetailHeader({
  edge,
  nodesById,
  onClose,
}: AttackGraphEdgeDetailContentProps & { onClose?: () => void }) {
  const viewModel = buildAttackGraphEdgeDetailViewModel(edge, nodesById);

  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50">
          <Link2 className="h-4 w-4 text-blue-600" />
        </span>
        <h2 className="min-w-0 font-mono text-lg font-semibold text-slate-900">
          <AttackGraphDetailTruncatedText
            value={viewModel.title}
            tooltipValue={viewModel.titleTooltip}
          />
        </h2>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span
          className={cn(
            "max-w-[140px] truncate rounded-md px-2.5 py-1 text-xs font-semibold",
            getEdgeRelationBadgeClassName(),
          )}
          title={viewModel.relationLabel}
        >
          {viewModel.relationLabel || "-"}
        </span>
        <button
          type="button"
          aria-label="Close detail"
          className="text-slate-400 transition-colors hover:text-slate-600"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

export function AttackGraphEdgeDetailContent({
  edge,
  nodesById,
}: AttackGraphEdgeDetailContentProps) {
  const viewModel = buildAttackGraphEdgeDetailViewModel(edge, nodesById);

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-hidden px-6 py-5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="font-semibold text-slate-600">Relation Type:</span>
        <span className="font-mono text-[13px] text-slate-700">
          {viewModel.relationType || "-"}
        </span>
      </div>

      <section className="min-w-0 max-w-full space-y-3 overflow-hidden">
        <h3 className="flex items-center gap-2 text-base font-semibold text-blue-800">
          <ArrowRight className="h-4 w-4 text-blue-600" />
          Attack Chain
        </h3>

        <div className="min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_128px_minmax(0,1fr)] items-center gap-3 overflow-hidden">
            <EdgeNodeCard node={viewModel.source} />
            <EdgeChainConnector relationLabel={viewModel.relationLabel} />
            <EdgeNodeCard node={viewModel.target} />
          </div>

          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 border-t border-slate-200 pt-3 font-mono text-[11px] text-slate-500">
            <AttackGraphDetailTruncatedText
              value={viewModel.source.name}
              className="min-w-0"
            />
            <AttackGraphDetailTruncatedText
              value={viewModel.target.name}
              className="min-w-0 text-right"
            />
          </div>
        </div>
      </section>

      <section className="min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white px-4 py-3">
        <p className="text-xs font-bold tracking-wide text-slate-500">
          CHAIN SENTENCE
        </p>
        <p className="mt-1 flex min-w-0 items-center gap-1 text-[15px] text-slate-900">
          <span className="font-bold">{viewModel.source.name || "-"}</span>
          <span className="shrink-0 text-slate-500">
            {viewModel.sentenceAction}
          </span>
          <span className="min-w-0 truncate font-bold">
            {viewModel.target.name || "-"}
          </span>
        </p>
      </section>

      <section className="min-w-0 max-w-full overflow-hidden space-y-4">
        <h3 className="flex items-center gap-2 text-base font-semibold text-blue-800">
          <Info className="h-4 w-4 text-blue-600" />
          Relation Information
        </h3>

        <dl className="min-w-0 max-w-full space-y-3 overflow-hidden text-sm">
          {viewModel.relationRows.map((row) => (
            <div
              key={row.key}
              className="min-w-0 max-w-full overflow-hidden flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4"
            >
              <dt className="font-semibold text-slate-600 sm:w-36 sm:shrink-0">
                {row.label}:
              </dt>
              {row.boxed ? (
                <dd className="min-w-0 flex-1 overflow-hidden rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-[11px] text-slate-600">
                  <AttackGraphDetailTruncatedText value={row.value} />
                </dd>
              ) : (
                <dd className="min-w-0 flex-1 font-mono text-[13px] text-slate-700">
                  <AttackGraphDetailTruncatedText value={row.value} />
                </dd>
              )}
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

function EdgeChainConnector({ relationLabel }: { relationLabel: string }) {
  return (
    <div className="flex w-[128px] shrink-0 flex-col items-center gap-1">
      <span
        className="max-w-[124px] truncate text-xs font-semibold text-slate-600"
        title={relationLabel}
      >
        {relationLabel || "-"}
      </span>
      <div className="flex w-[112px] items-center text-slate-300">
        <span className="h-px w-[96px] bg-slate-300" />
        <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
      </div>
    </div>
  );
}

function EdgeNodeCard({ node }: { node: AttackGraphEdgeDetailNodeViewModel }) {
  const Icon = getAttackGraphDetailIcon(node.icon);
  return (
    <div
      className={cn(
        "flex h-[72px] min-w-0 items-center gap-3 rounded-lg border border-transparent bg-white p-3 ring-1",
        getNodeRingClassName(node.tone),
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1",
          getNodeIconWrapClassName(node.tone),
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4",
            ATTACK_GRAPH_DETAIL_FIELD_TONE_CLASS_NAMES[node.tone],
          )}
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-bold uppercase text-slate-500">
          {node.kind}
        </p>
        <AttackGraphDetailTruncatedText
          value={node.name}
          className="text-base font-bold text-slate-900"
        />
      </div>
    </div>
  );
}

function getEdgeRelationBadgeClassName() {
  return "bg-slate-50 text-slate-600";
}

function getNodeRingClassName(tone: AttackGraphPresentationTone) {
  if (tone === "red") {
    return "ring-rose-100";
  }
  if (tone === "amber" || tone === "orange") {
    return "ring-orange-200";
  }
  if (tone === "purple") {
    return "ring-purple-100";
  }
  if (tone === "cyan") {
    return "ring-blue-100";
  }
  if (tone === "blue") {
    return "ring-blue-100";
  }
  return "ring-slate-200";
}

function getNodeIconWrapClassName(tone: AttackGraphPresentationTone) {
  if (tone === "red") {
    return "bg-rose-50 ring-rose-200";
  }
  if (tone === "amber" || tone === "orange") {
    return "bg-orange-50 ring-orange-200";
  }
  if (tone === "purple") {
    return "bg-purple-50 ring-purple-200";
  }
  if (tone === "cyan") {
    return "bg-cyan-50 ring-sky-200";
  }
  if (tone === "blue") {
    return "bg-blue-50 ring-blue-200";
  }
  return "bg-slate-50 ring-slate-200";
}
