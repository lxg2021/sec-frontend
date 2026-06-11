"use client";

import { useEffect, useMemo, useRef } from "react";
import { Graph } from "@antv/g6";
import type { GraphData } from "@antv/g6";

import { cn } from "@/shared/lib/utils";

import { buildAttackGraphModel } from "../model/attack-graph-adapter";
import type {
  AttackGraphEdgeModel,
  AttackGraphNodeModel,
  GraphCaseResponseDto,
} from "../model/attack-graph-data";
import { getAttackGraphEdgeStyle } from "../model/attack-graph-edge-presentation";
import { getAttackGraphNodePresentation } from "../model/attack-graph-node-presentation";

export interface AttackGraphG6Props {
  response: GraphCaseResponseDto;
  className?: string;
}

const NODE_SIZE = 48;
const RAW_GRAPH_RANK_SEP = 190;
const RAW_GRAPH_NODE_SEP = 96;

export function AttackGraphG6({ response, className }: AttackGraphG6Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<Graph | null>(null);

  const graphData = useMemo(() => {
    const graph = buildAttackGraphModel(response);
    return toG6GraphData(graph.nodes, graph.edges);
  }, [response]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let disposed = false;
    let taskSettled = false;
    let destroyRequested = false;
    let destroyed = false;
    const g6Graph = new Graph({
      container,
      autoResize: true,
      data: graphData,
      animation: false,
      layout: {
        type: "antv-dagre",
        rankdir: "LR",
        ranksep: RAW_GRAPH_RANK_SEP,
        nodesep: RAW_GRAPH_NODE_SEP,
        edgeLabelSpace: true,
      },
      node: {
        type: "image",
        style: (datum) => {
          const nodeData = datum.data ?? {};
          return {
            size: [NODE_SIZE, NODE_SIZE],
            src: String(nodeData.image ?? ""),
            label: true,
            labelText: String(nodeData.label ?? datum.id),
            labelPlacement: "bottom",
            labelOffsetY: 8,
            labelFontSize: 12,
            labelFontWeight: 600,
            labelFill: "#1f2937",
            labelMaxWidth: 148,
            labelWordWrap: true,
            badge: Boolean(nodeData.evidenceHit),
            badges: Boolean(nodeData.evidenceHit)
              ? [
                  {
                    text: "!",
                    placement: "right-top",
                    fill: "#ffffff",
                    stroke: "#fecdd3",
                    lineWidth: 1,
                    textFill: "#e11d48",
                    fontSize: 12,
                    fontWeight: 700,
                    radius: 10,
                    padding: [2, 5],
                    offsetX: 4,
                    offsetY: -4,
                  },
                ]
              : [],
          };
        },
        state: {
          active: {
            halo: true,
            haloStroke: "#38bdf8",
            haloStrokeOpacity: 0.35,
            haloLineWidth: 10,
          },
          selected: {
            halo: true,
            haloStroke: "#2563eb",
            haloStrokeOpacity: 0.42,
            haloLineWidth: 12,
            labelFill: "#0f172a",
          },
        },
      },
      edge: {
        type: (datum) =>
          datum.source === datum.target ? "cubic" : "cubic-horizontal",
        style: (datum) => {
          const relationType = String(datum.data?.relationType ?? "");
          const relationLabel = String(
            datum.data?.relationLabel ?? formatRelationLabel(relationType),
          );
          const edgeStyle = getAttackGraphEdgeStyle(relationType);
          const stroke = String(edgeStyle.stroke ?? "#64748b");
          return {
            stroke,
            lineWidth: Number(edgeStyle.strokeWidth ?? 1.8),
            opacity: Number(edgeStyle.opacity ?? 0.82),
            lineDash: parseLineDash(edgeStyle.strokeDasharray),
            endArrow: true,
            endArrowSize: 8,
            label: true,
            labelText: relationLabel,
            labelPlacement: "center",
            labelOffsetY: -8,
            labelAutoRotate: false,
            labelFontSize: 11,
            labelFontWeight: 600,
            labelFill: "#475569",
            labelBackground: true,
            labelBackgroundFill: "#ffffff",
            labelBackgroundFillOpacity: 0.92,
            labelBackgroundStroke: "#cbd5e1",
            labelBackgroundLineWidth: 1,
            labelPadding: [2, 6],
            labelMaxWidth: "65%",
            labelWordWrap: true,
            loop: true,
            loopType: "arc",
            loopDist: 72,
          };
        },
        state: {
          active: {
            opacity: 1,
            lineWidth: 3,
            halo: true,
            haloStroke: "#bfdbfe",
            haloStrokeOpacity: 0.65,
            haloLineWidth: 8,
          },
          selected: {
            opacity: 1,
            lineWidth: 3.2,
            halo: true,
            haloStroke: "#93c5fd",
            haloStrokeOpacity: 0.72,
            haloLineWidth: 10,
          },
        },
      },
      behaviors: [
        "drag-canvas",
        "zoom-canvas",
        {
          type: "hover-activate",
          degree: 1,
          direction: "both",
          state: "active",
          animation: false,
        },
        {
          type: "click-select",
          degree: 1,
          state: "selected",
          neighborState: "selected",
          animation: false,
        },
      ],
      plugins: [
        {
          type: "grid-line",
          size: 24,
          stroke: "#dbeafe",
          lineWidth: 1,
          opacity: 0.7,
        },
        {
          type: "tooltip",
          trigger: "click",
          enterable: true,
          enable: (event: { targetType?: string }) =>
            event.targetType === "edge",
          getContent: async (_event: unknown, items: unknown[]) =>
            renderEdgeTooltip(items[0]),
          onOpenChange: () => undefined,
        },
      ],
      transforms: [
        {
          type: "process-parallel-edges",
          mode: "bundle",
          distance: 26,
          loopMode: "spread",
          loopDistance: 18,
        },
      ],
    });

    const destroyGraph = () => {
      if (destroyed) {
        return;
      }

      destroyed = true;
      g6Graph.destroy();
    };

    graphRef.current = g6Graph;
    void g6Graph
      .render()
      .then(() => {
        if (disposed || graphRef.current !== g6Graph) {
          return;
        }

        return g6Graph.fitView({ when: "always", direction: "both" });
      })
      .catch((error) => {
        if (!disposed && graphRef.current === g6Graph) {
          console.error("[AttackGraphG6] render failed", error);
        }
      })
      .finally(() => {
        taskSettled = true;
        if (destroyRequested) {
          destroyGraph();
        }
      });

    return () => {
      disposed = true;
      destroyRequested = true;
      if (graphRef.current === g6Graph) {
        graphRef.current = null;
      }
      if (taskSettled) {
        destroyGraph();
      }
    };
  }, [graphData]);

  return (
    <div
      ref={containerRef}
      className={cn("h-full min-h-[420px] w-full bg-white", className)}
    />
  );
}

function toG6GraphData(
  nodes: AttackGraphNodeModel[],
  edges: AttackGraphEdgeModel[],
): GraphData {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  return {
    nodes: nodes.map((node) => {
      const presentation = getAttackGraphNodePresentation(node.entityType);
      return {
        id: node.id,
        data: {
          label: node.displayName,
          entityType: node.entityType,
          image: presentation.image,
          evidenceHit: Boolean(node.evidenceHit),
        },
      };
    }),
    edges: edges.map((edge) => {
      const sourceNode = nodeById.get(edge.source);
      const targetNode = nodeById.get(edge.target);
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        data: {
          relationType: edge.relationType,
          relationLabel: formatRelationLabel(edge.relationType),
          sourceLabel: sourceNode?.displayName ?? edge.source,
          sourceType: sourceNode?.entityType ?? "",
          targetLabel: targetNode?.displayName ?? edge.target,
          targetType: targetNode?.entityType ?? "",
        },
      };
    }),
  };
}

function parseLineDash(value: unknown): number[] | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const segments = value
    .split(/[\s,]+/)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0);

  return segments.length ? segments : undefined;
}

function renderEdgeTooltip(item: unknown) {
  const itemData = readRecord(readRecord(item).data);
  const relationLabel = readString(itemData.relationLabel);
  const relationType = readString(itemData.relationType);
  const sourceLabel = readString(itemData.sourceLabel);
  const sourceType = readString(itemData.sourceType);
  const targetLabel = readString(itemData.targetLabel);
  const targetType = readString(itemData.targetType);

  return `
    <div style="min-width: 240px; max-width: 360px; padding: 10px 12px; color: #0f172a;">
      <div style="font-size: 13px; font-weight: 700; line-height: 18px;">
        ${escapeHtml(relationLabel || relationType || "Relation")}
      </div>
      <div style="margin-top: 2px; font-size: 11px; line-height: 16px; color: #64748b;">
        ${escapeHtml(relationType)}
      </div>
      <div style="margin-top: 10px; display: grid; gap: 6px; font-size: 12px; line-height: 16px;">
        ${renderTooltipRow("Source", sourceLabel, sourceType)}
        ${renderTooltipRow("Target", targetLabel, targetType)}
      </div>
    </div>
  `;
}

function renderTooltipRow(label: string, value: string, meta: string) {
  return `
    <div>
      <div style="font-size: 11px; color: #94a3b8;">${escapeHtml(label)}</div>
      <div style="font-weight: 600; color: #334155; word-break: break-word;">${escapeHtml(value)}</div>
      ${
        meta
          ? `<div style="font-size: 11px; color: #64748b;">${escapeHtml(meta)}</div>`
          : ""
      }
    </div>
  `;
}

function readRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatRelationLabel(relationType: string) {
  const normalized = relationType.trim();
  const withoutProcessPrefix = normalized.startsWith("PROCESS_")
    ? normalized.slice("PROCESS_".length)
    : normalized;

  return withoutProcessPrefix
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export default AttackGraphG6;
