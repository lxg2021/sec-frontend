"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/shared/lib/utils";
import { Card, CardContent } from "@/shared/ui/card";
import { ScrollArea } from "@/shared/ui/scroll-area";

import type {
  AttackGraphEdgeModel,
  AttackGraphNodeModel,
} from "../model/core/attack-graph-data";
import {
  buildAttackGraphEdgeDetailCardConfig,
  toAttackGraphEdgeDetailData,
} from "../model/detail/attack-graph-edge-detail-card-config";
import {
  getAttackGraphSelectedEdgeSummary,
  getAttackGraphSelectedNodeSummary,
} from "../model/detail/attack-graph-detail-resolver";
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

export type AttackGraphDetailCardItem =
  | { kind: "node"; node: AttackGraphNodeModel }
  | { kind: "edge"; edge: AttackGraphEdgeModel };

export interface AttackGraphDetailCardProps {
  item: AttackGraphDetailCardItem | null;
  className?: string;
  nodesById?: Map<string, AttackGraphNodeModel>;
  onClose?: () => void;
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

  const content = useMemo(() => {
    if (!item) {
      return null;
    }

    if (item.kind === "node") {
      const config = getAttackGraphNodeDetailConfig(item.node);
      const data = toAttackGraphNodeDetailData(item.node);
      const summary = getAttackGraphSelectedNodeSummary(item.node);
      return {
        config,
        data,
        titleFallback: summary.title,
      };
    }

    const summary = getAttackGraphSelectedEdgeSummary(item.edge, nodesById);
    const sourceNode = nodesById?.get(item.edge.source);
    const targetNode = nodesById?.get(item.edge.target);
    return {
      config: buildAttackGraphEdgeDetailCardConfig(summary.label),
      data: toAttackGraphEdgeDetailData(
        item.edge,
        sourceNode
          ? getAttackGraphSelectedNodeSummary(sourceNode).title
          : item.edge.source,
        targetNode
          ? getAttackGraphSelectedNodeSummary(targetNode).title
          : item.edge.target,
      ),
      titleFallback: summary.label,
    };
  }, [item, nodesById]);

  if (!item || !content) {
    return null;
  }

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

  return (
    <aside
      className={cn(
        "pointer-events-auto absolute bottom-4 right-4 top-4 z-20 flex w-[720px] max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white/95 shadow-[0_18px_46px_rgba(15,23,42,0.18)] backdrop-blur",
        className,
      )}
      data-attack-graph-detail-card={item.kind}
    >
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-0 bg-transparent shadow-none">
        <AttackGraphDetailHeader
          data={content.data}
          header={content.config.header}
          headerIconTone={headerIconTone}
          onClose={onClose}
          title={title}
        />

        <ScrollArea className="min-h-0 flex-1">
          <CardContent className="space-y-6 p-4 pt-5">
            {content.config.sections.length > 0 ? (
              content.config.sections.map((section, sectionIndex) => (
                <AttackGraphDetailSection
                  key={`${section.title}-${sectionIndex}`}
                  data={content.data}
                  expandedFields={expandedFields}
                  expandedSections={expandedSections}
                  onToggleExpanded={toggleExpanded}
                  onToggleSectionExpanded={toggleSectionExpanded}
                  section={section}
                  sectionIndex={sectionIndex}
                />
              ))
            ) : (
              <div className="rounded-md border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-500">
                暂无详情字段
              </div>
            )}
          </CardContent>
        </ScrollArea>
      </Card>
    </aside>
  );
}

export { formatAttackGraphDetailValue };

export default AttackGraphDetailCard;
