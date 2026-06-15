"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { Card, CardContent } from "@/shared/ui/card";
import { ScrollArea } from "@/shared/ui/scroll-area";

import type {
  AttackGraphEdgeModel,
  AttackGraphNodeModel,
} from "../model/core/attack-graph-data";
import type {
  AttackGraphDetailCardConfig,
  AttackGraphDetailData,
} from "../model/detail/attack-graph-detail-config-types";
import { getAttackGraphSelectedNodeSummary } from "../model/detail/attack-graph-detail-resolver";
import {
  getAttackGraphNodeDetailConfig,
  toAttackGraphNodeDetailData,
} from "../model/detail/attack-graph-node-detail-config-map";
import {
  formatAttackGraphDetailValue,
  readAttackGraphDetailValue,
} from "./detail/attack-graph-detail-presentation";
import { AttackGraphDetailHeader } from "./detail/attack-graph-detail-header";
import { AttackGraphDetailSection } from "./detail/attack-graph-detail-section";
import {
  AttackGraphEdgeDetailContent,
  AttackGraphEdgeDetailHeader,
} from "./detail/attack-graph-edge-detail-content";

export type AttackGraphDetailCardItem =
  | { kind: "node"; node: AttackGraphNodeModel }
  | { kind: "edge"; edge: AttackGraphEdgeModel };

export interface AttackGraphDetailCardProps {
  item: AttackGraphDetailCardItem | null;
  className?: string;
  nodesById?: Map<string, AttackGraphNodeModel>;
  onClose?: () => void;
}

interface AttackGraphNodeDetailContent {
  config: AttackGraphDetailCardConfig;
  data: AttackGraphDetailData;
  titleFallback: string;
}

export function AttackGraphDetailCard({
  item,
  className,
  nodesById,
  onClose,
}: AttackGraphDetailCardProps) {
  const [expandedFields, setExpandedFields] = useState<Set<string>>(
    () => new Set(),
  );
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(),
  );
  const itemIdentity = item
    ? item.kind === "node"
      ? `node:${item.node.id}`
      : `edge:${item.edge.id}`
    : "none";

  useEffect(() => {
    setExpandedFields(new Set());
    setExpandedSections(new Set());
  }, [itemIdentity]);

  const nodeContent = useMemo<AttackGraphNodeDetailContent | null>(() => {
    if (!item || item.kind !== "node") {
      return null;
    }

    const config = getAttackGraphNodeDetailConfig(item.node);
    const data = toAttackGraphNodeDetailData(item.node);
    const summary = getAttackGraphSelectedNodeSummary(item.node);
    return {
      config,
      data,
      titleFallback: summary.title,
    };
  }, [item]);

  if (!item) {
    return null;
  }

  const toggleExpanded = (fieldId: string) => {
    setExpandedFields((current) => {
      const next = new Set(current);
      if (next.has(fieldId)) {
        next.delete(fieldId);
      } else {
        next.add(fieldId);
      }
      return next;
    });
  };
  const toggleSectionExpanded = (sectionId: string) => {
    setExpandedSections((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  if (item.kind === "edge") {
    return (
      <AttackGraphDetailPanelShell className={className} kind="edge">
        <AttackGraphEdgeDetailHeader
          edge={item.edge}
          nodesById={nodesById}
          onClose={onClose}
        />

        <ScrollArea className="min-h-0 flex-1 [&_[data-radix-scroll-area-viewport]>div]:!block [&_[data-radix-scroll-area-viewport]>div]:!max-w-full [&_[data-radix-scroll-area-viewport]>div]:!min-w-0 [&_[data-radix-scroll-area-viewport]>div]:!w-full">
          <AttackGraphEdgeDetailContent
            edge={item.edge}
            nodesById={nodesById}
          />
        </ScrollArea>
      </AttackGraphDetailPanelShell>
    );
  }

  if (!nodeContent) {
    return null;
  }

  return (
    <AttackGraphDetailPanelShell className={className} kind="node">
      <AttackGraphNodeDetailPanelHeader
        content={nodeContent}
        onClose={onClose}
      />

      <ScrollArea className="min-h-0 flex-1">
        <AttackGraphNodeDetailPanelContent
          content={nodeContent}
          expandedFields={expandedFields}
          expandedSections={expandedSections}
          onToggleExpanded={toggleExpanded}
          onToggleSectionExpanded={toggleSectionExpanded}
        />
      </ScrollArea>
    </AttackGraphDetailPanelShell>
  );
}

function AttackGraphDetailPanelShell({
  children,
  className,
  kind,
}: {
  children: ReactNode;
  className?: string;
  kind: AttackGraphDetailCardItem["kind"];
}) {
  return (
    <aside
      className={cn(
        "pointer-events-auto absolute bottom-4 right-4 top-4 z-20 flex w-[660px] max-w-[calc(100%-2rem)] flex-col overflow-hidden border border-slate-200",
        kind === "edge"
          ? "rounded-xl bg-white shadow-[0_18px_36px_-12px_rgba(15,23,42,0.18)]"
          : "rounded-lg bg-white/95 shadow-[0_18px_46px_rgba(15,23,42,0.18)] backdrop-blur",
        className,
      )}
      data-attack-graph-detail-card={kind}
    >
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-0 bg-transparent shadow-none">
        {children}
      </Card>
    </aside>
  );
}

function AttackGraphNodeDetailPanelHeader({
  content,
  onClose,
}: {
  content: AttackGraphNodeDetailContent;
  onClose?: () => void;
}) {
  const headerIconTone = content.config.header.iconTone ?? "slate";
  const rawTitle = readAttackGraphDetailValue(
    content.data,
    content.config.header.title.key,
  );
  const formattedTitle = content.config.header.title.formatValue
    ? content.config.header.title.formatValue(rawTitle, content.data)
    : rawTitle;
  const title =
    formattedTitle ||
    content.titleFallback ||
    content.config.header.title.fallback ||
    "Details";

  return (
    <AttackGraphDetailHeader
      data={content.data}
      header={content.config.header}
      headerIconTone={headerIconTone}
      onClose={onClose}
      title={title}
    />
  );
}

function AttackGraphNodeDetailPanelContent({
  content,
  expandedFields,
  expandedSections,
  onToggleExpanded,
  onToggleSectionExpanded,
}: {
  content: AttackGraphNodeDetailContent;
  expandedFields: Set<string>;
  expandedSections: Set<string>;
  onToggleExpanded: (fieldId: string) => void;
  onToggleSectionExpanded: (sectionId: string) => void;
}) {
  return (
    <CardContent className="space-y-6 p-4 pt-5">
      {content.config.sections.length > 0 ? (
        content.config.sections.map((section, sectionIndex) => (
          <AttackGraphDetailSection
            key={`${section.title}-${sectionIndex}`}
            data={content.data}
            expandedFields={expandedFields}
            expandedSections={expandedSections}
            onToggleExpanded={onToggleExpanded}
            onToggleSectionExpanded={onToggleSectionExpanded}
            section={section}
            sectionIndex={sectionIndex}
          />
        ))
      ) : (
        <div className="rounded-md border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-500">
          No detail fields
        </div>
      )}
    </CardContent>
  );
}

export { formatAttackGraphDetailValue };

export default AttackGraphDetailCard;
