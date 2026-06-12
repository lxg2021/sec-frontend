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

const NODE_WIDTH = 168;
const NODE_HEIGHT = 76;
const ICON_SIZE = 36;
const INITIAL_VIEW_SCALE = 0.9;

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
      zoomRange: [0.35, 1.8],
      layout: {
        type: "antv-dagre",
        rankdir: "LR",
        ranksep: 150,
        nodesep: 72,
        edgeLabelSpace: true,
        controlPoints: true,
        nodeSize: [NODE_WIDTH, NODE_HEIGHT],
      },
      node: {
        type: "image",
        style: (datum) => {
          const nodeData = readRecord(datum.data);
          const entityType = readString(nodeData.entityType);
          const presentation = getAttackGraphNodePresentation(entityType);
          const label = readString(nodeData.label) || String(datum.id);

          return {
            size: [ICON_SIZE + 14, ICON_SIZE + 14],
            src: readString(nodeData.image),
            opacity: Boolean(nodeData.missingFromResponse) ? 0.5 : 1,
            label: true,
            labelText: label,
            labelPlacement: "bottom",
            labelOffsetY: 8,
            labelFontSize: 12,
            labelFontWeight: 650,
            labelFill: "#0f172a",
            labelMaxWidth: NODE_WIDTH,
            labelWordWrap: true,
            badge: Boolean(nodeData.evidenceHit),
            badges: Boolean(nodeData.evidenceHit)
              ? [
                  {
                    text: "!",
                    placement: "right-top",
                    backgroundFill: "#ffffff",
                    stroke: "#fecdd3",
                    lineWidth: 1,
                    fill: "#e11d48",
                    fontSize: 12,
                    fontWeight: 800,
                    radius: 10,
                    padding: [2, 5],
                    offsetX: 3,
                    offsetY: -3,
                  },
                ]
              : [],
          };
        },
        state: {
          active: {
            halo: true,
            haloStroke: "#38bdf8",
            haloStrokeOpacity: 0.28,
            haloLineWidth: 8,
          },
          selected: {
            halo: true,
            haloStroke: "#2563eb",
            haloStrokeOpacity: 0.34,
            haloLineWidth: 10,
          },
        },
      },
      edge: {
        type: "cubic-horizontal",
        style: (datum) => {
          const relationType = readString(readRecord(datum.data).relationType);
          const edgeStyle = getAttackGraphEdgeStyle(relationType);
          const stroke = String(edgeStyle.stroke ?? "#64748b");

          return {
            stroke,
            lineWidth: Number(edgeStyle.strokeWidth ?? 1.8),
            opacity: Number(edgeStyle.opacity ?? 0.78),
            lineDash: parseLineDash(edgeStyle.strokeDasharray),
            endArrow: true,
            endArrowSize: 9,
            label: true,
            labelText: formatRelationLabel(relationType),
            labelPlacement: "center",
            labelAutoRotate: false,
            labelFontSize: 11,
            labelFontWeight: 600,
            labelFill: "#334155",
            labelBackground: true,
            labelBackgroundFill: "#ffffff",
            labelBackgroundFillOpacity: 0.94,
            labelBackgroundStroke: "#dbe4ef",
            labelBackgroundLineWidth: 1,
            labelPadding: [3, 7],
            labelMaxWidth: 180,
            labelWordWrap: true,
          };
        },
        state: {
          active: {
            opacity: 1,
            lineWidth: 3,
            halo: true,
            haloStroke: "#bfdbfe",
            haloStrokeOpacity: 0.55,
            haloLineWidth: 7,
          },
          selected: {
            opacity: 1,
            lineWidth: 3.2,
            halo: true,
            haloStroke: "#93c5fd",
            haloStrokeOpacity: 0.68,
            haloLineWidth: 9,
          },
        },
      },
      behaviors: [
        "drag-canvas",
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
          opacity: 0.55,
        },
        {
          type: "tooltip",
          trigger: "click",
          enterable: true,
          enable: (event: { targetType?: string }) =>
            event.targetType === "node" || event.targetType === "edge",
          getContent: async (_event: unknown, items: unknown[]) =>
            renderTooltip(items[0]),
          onOpenChange: () => undefined,
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
      .then(async () => {
        if (disposed || graphRef.current !== g6Graph) {
          return;
        }

        await applyInitialViewport(g6Graph);
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
  const sortedNodes = [...nodes].sort(compareNodes);
  const sortedEdges = [...edges].filter(
    (edge) => nodeById.has(edge.source) && nodeById.has(edge.target),
  );

  return {
    nodes: sortedNodes.map((node) => {
      const presentation = getAttackGraphNodePresentation(node.entityType);
      return {
        id: node.id,
        data: {
          label: node.displayName,
          entityType: node.entityType,
          entityLabel: presentation.label,
          image: presentation.image,
          evidenceHit: Boolean(node.evidenceHit),
          missingFromResponse: Boolean(node.missingFromResponse),
        },
      };
    }),
    edges: sortedEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      data: {
        relationType: edge.relationType,
        sourceLabel: nodeById.get(edge.source)?.displayName ?? edge.source,
        sourceType: nodeById.get(edge.source)?.entityType ?? "",
        targetLabel: nodeById.get(edge.target)?.displayName ?? edge.target,
        targetType: nodeById.get(edge.target)?.entityType ?? "",
      },
    })),
  };
}

async function applyInitialViewport(graph: Graph) {
  await graph.fitView({
    when: "always",
    direction: "both",
  });

  const currentZoom = graph.getZoom();
  await graph.zoomTo(
    currentZoom * INITIAL_VIEW_SCALE,
    false,
    graph.getViewportCenter(),
  );
}

function compareNodes(left: AttackGraphNodeModel, right: AttackGraphNodeModel) {
  const leftPriority = getAttackGraphNodePresentation(left.entityType).priority;
  const rightPriority = getAttackGraphNodePresentation(right.entityType).priority;
  if (leftPriority !== rightPriority) {
    return rightPriority - leftPriority;
  }
  return `${left.displayName}|${left.key}`.localeCompare(
    `${right.displayName}|${right.key}`,
    undefined,
    { numeric: true, sensitivity: "base" },
  );
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

function renderTooltip(item: unknown) {
  const itemRecord = readRecord(item);
  const itemData = readRecord(itemRecord.data);
  const label = readString(itemData.label);
  const entityType = readString(itemData.entityType);
  const entityLabel = readString(itemData.entityLabel);
  const relationType = readString(itemData.relationType);
  const sourceLabel = readString(itemData.sourceLabel);
  const sourceType = readString(itemData.sourceType);
  const targetLabel = readString(itemData.targetLabel);
  const targetType = readString(itemData.targetType);

  if (relationType) {
    return `
      <div style="min-width: 240px; max-width: 360px; padding: 10px 12px; color: #0f172a;">
        <div style="font-size: 13px; font-weight: 700; line-height: 18px;">${escapeHtml(formatRelationLabel(relationType))}</div>
        <div style="margin-top: 2px; font-size: 11px; line-height: 16px; color: #64748b;">${escapeHtml(relationType)}</div>
        <div style="margin-top: 10px; display: grid; gap: 6px; font-size: 12px; line-height: 16px;">
          ${renderTooltipRow("Source", sourceLabel, sourceType)}
          ${renderTooltipRow("Target", targetLabel, targetType)}
        </div>
      </div>
    `;
  }

  return `
    <div style="min-width: 220px; max-width: 340px; padding: 10px 12px; color: #0f172a;">
      <div style="font-size: 13px; font-weight: 700; line-height: 18px; word-break: break-word;">${escapeHtml(label || "Node")}</div>
      <div style="margin-top: 4px; font-size: 12px; line-height: 16px; color: #64748b;">${escapeHtml(entityType || entityLabel || "Unknown")}</div>
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
