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
import {
  ATTACK_GRAPH_DAGRE_LAYOUT_RULE,
  ATTACK_GRAPH_LAYOUT_LANES,
  compareAttackGraphEdgesByLayout,
  compareAttackGraphNodesByLayout,
  getAttackGraphNodeLayoutRule,
  getAttackGraphRelationLayoutWeight,
} from "../model/attack-graph-layout-rules";
import { getAttackGraphNodePresentation } from "../model/attack-graph-node-presentation";
import {
  getAttackGraphEdgeRoutingRule,
  type AttackGraphEdgeLabelPlacement,
  type AttackGraphEdgeRouteKind,
} from "../model/attack-graph-routing-rules";

export interface AttackGraphG6Props {
  response: GraphCaseResponseDto;
  className?: string;
}

const NODE_SIZE = 48;
const HORIZONTAL_ALIGNMENT_EPSILON = 1;

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
    const nodeOrder = getG6NodeOrder(graphData);
    const g6Graph = new Graph({
      container,
      autoResize: true,
      data: graphData,
      animation: false,
      layout: {
        type: "antv-dagre",
        rankdir: ATTACK_GRAPH_DAGRE_LAYOUT_RULE.rankdir,
        ranksep: ATTACK_GRAPH_DAGRE_LAYOUT_RULE.ranksep,
        nodesep: ATTACK_GRAPH_DAGRE_LAYOUT_RULE.nodesep,
        edgeLabelSpace: ATTACK_GRAPH_DAGRE_LAYOUT_RULE.edgeLabelSpace,
        controlPoints: ATTACK_GRAPH_DAGRE_LAYOUT_RULE.controlPoints,
        nodeOrder,
        nodesepFunc: getG6NodeSep,
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
        type: (datum) => {
          if (datum.source === datum.target) {
            return "cubic";
          }
          return toG6EdgeType(String(datum.data?.routeKind ?? "smooth"));
        },
        style: (datum) => {
          const relationType = String(datum.data?.relationType ?? "");
          const relationLabel = String(
            datum.data?.relationLabel ?? formatRelationLabel(relationType),
          );
          const labelPlacement = mapG6LabelPlacement(
            String(datum.data?.labelPlacement ?? "center"),
          );
          const routeKind = String(datum.data?.routeKind ?? "smooth");
          const edgeStyle = getAttackGraphEdgeStyle(relationType);
          const stroke = String(edgeStyle.stroke ?? "#64748b");
          return {
            stroke,
            ...getG6EdgeRoutingStyle(routeKind),
            lineWidth: Number(edgeStyle.strokeWidth ?? 1.8),
            opacity: Number(edgeStyle.opacity ?? 0.82),
            lineDash: parseLineDash(edgeStyle.strokeDasharray),
            endArrow: true,
            endArrowSize: 8,
            label: true,
            labelText: relationLabel,
            labelPlacement,
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
          distance: ATTACK_GRAPH_DAGRE_LAYOUT_RULE.parallelEdgeDistance,
          loopMode: "spread",
          loopDistance: ATTACK_GRAPH_DAGRE_LAYOUT_RULE.parallelLoopDistance,
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

        if (alignStraightSameLaneChains(g6Graph, graphData)) {
          g6Graph.setLayout({ type: "preset" });
          await g6Graph.draw();
        }

        if (disposed || graphRef.current !== g6Graph) {
          return;
        }

        await g6Graph.fitView({ when: "always", direction: "both" });
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
  const sortedNodes = [...nodes].sort(compareAttackGraphNodesByLayout);
  const sortedEdges = [...edges].sort(compareAttackGraphEdgesByLayout);

  return {
    nodes: sortedNodes.map((node) => {
      const presentation = getAttackGraphNodePresentation(node.entityType);
      const layoutRule = getAttackGraphNodeLayoutRule(node.entityType);
      const laneRule = ATTACK_GRAPH_LAYOUT_LANES[layoutRule.lane];
      return {
        id: node.id,
        data: {
          label: node.displayName,
          entityType: node.entityType,
          image: presentation.image,
          evidenceHit: Boolean(node.evidenceHit),
          layoutLane: layoutRule.lane,
          layoutLaneOrder: laneRule.order,
          layoutRole: layoutRule.role,
          layoutOrder: layoutRule.order,
        },
      };
    }),
    edges: sortedEdges.map((edge) => {
      const sourceNode = nodeById.get(edge.source);
      const targetNode = nodeById.get(edge.target);
      const routingRule = getAttackGraphEdgeRoutingRule(
        edge.relationType,
        sourceNode,
        targetNode,
      );
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        data: {
          relationType: edge.relationType,
          relationLabel: formatRelationLabel(edge.relationType),
          routeKind: routingRule.route,
          labelPlacement: routingRule.labelPlacement,
          avoidDiagonal: routingRule.avoidDiagonal,
          allowStraightOnlyWhenSameLane:
            routingRule.allowStraightOnlyWhenSameLane,
          parallelStrategy: routingRule.parallelStrategy,
          sourceLane: routingRule.sourceLane,
          targetLane: routingRule.targetLane,
          sameLane: routingRule.sameLane,
          selfLoop: routingRule.selfLoop,
          layoutWeight: getAttackGraphRelationLayoutWeight(edge.relationType),
          sourceLabel: sourceNode?.displayName ?? edge.source,
          sourceType: sourceNode?.entityType ?? "",
          targetLabel: targetNode?.displayName ?? edge.target,
          targetType: targetNode?.entityType ?? "",
        },
      };
    }),
  };
}

function getG6NodeOrder(graphData: GraphData): string[] {
  return (graphData.nodes ?? []).map((node) => String(node.id));
}

function getG6NodeSep(node: unknown): number {
  const nodeData = readRecord(readRecord(node).data);
  const lane = readString(nodeData.layoutLane);
  if (lane in ATTACK_GRAPH_LAYOUT_LANES) {
    return ATTACK_GRAPH_LAYOUT_LANES[
      lane as keyof typeof ATTACK_GRAPH_LAYOUT_LANES
    ].nodeGap;
  }
  return ATTACK_GRAPH_DAGRE_LAYOUT_RULE.nodesep;
}

function toG6EdgeType(routeKind: string) {
  const route = routeKind as AttackGraphEdgeRouteKind;
  if (route === "straight") {
    return "line";
  }
  if (route === "orthogonal") {
    return "polyline";
  }
  if (route === "loop") {
    return "cubic";
  }
  return "cubic-horizontal";
}

function getG6EdgeRoutingStyle(routeKind: string): Record<string, unknown> {
  const route = routeKind as AttackGraphEdgeRouteKind;
  if (route === "orthogonal") {
    return {
      router: {
        type: "orth",
        offset: 28,
      },
      radius: 6,
    };
  }
  if (route === "loop") {
    return {
      loop: true,
      loopType: "arc",
      loopDist: 72,
    };
  }
  return {};
}

function alignStraightSameLaneChains(graph: Graph, graphData: GraphData) {
  const straightEdges = (graphData.edges ?? []).filter((edge) => {
    const edgeData = readRecord(edge.data);
    return (
      edge.source !== edge.target &&
      readString(edgeData.routeKind) === "straight" &&
      readBool(edgeData.sameLane) &&
      readBool(edgeData.allowStraightOnlyWhenSameLane)
    );
  });

  if (!straightEdges.length) {
    return false;
  }

  const nodeById = new Map(
    graph.getNodeData().map((node) => [String(node.id), node]),
  );
  const groups = buildStraightChainGroups(straightEdges);
  const updates: Array<{ id: string; style: { x: number; y: number } }> = [];
  const updatedNodeIds = new Set<string>();

  for (const group of groups) {
    const positionedNodes = group
      .map((id) => {
        const node = nodeById.get(id);
        const style = readRecord(node?.style);
        const x = readNumber(style.x);
        const y = readNumber(style.y);
        if (x === null || y === null) {
          return null;
        }
        return { id, x, y };
      })
      .filter(Boolean) as Array<{ id: string; x: number; y: number }>;

    if (positionedNodes.length !== group.length) {
      continue;
    }

    const uniqueXRanks = new Set(
      positionedNodes.map((node) => Math.round(node.x / NODE_SIZE)),
    );
    if (positionedNodes.length > 2 && uniqueXRanks.size !== positionedNodes.length) {
      continue;
    }

    const degree = getGroupMaxStraightDegree(group, straightEdges);
    if (positionedNodes.length > 2 && degree > 2) {
      continue;
    }

    const targetY = getMedian(positionedNodes.map((node) => node.y));
    for (const node of positionedNodes) {
      if (
        Math.abs(node.y - targetY) <= HORIZONTAL_ALIGNMENT_EPSILON ||
        updatedNodeIds.has(node.id)
      ) {
        continue;
      }
      updates.push({ id: node.id, style: { x: node.x, y: targetY } });
      updatedNodeIds.add(node.id);
    }
  }

  if (!updates.length) {
    return false;
  }

  graph.updateNodeData(updates);
  return true;
}

function buildStraightChainGroups(
  edges: NonNullable<GraphData["edges"]>,
): string[][] {
  const adjacency = new Map<string, Set<string>>();
  for (const edge of edges) {
    const source = String(edge.source);
    const target = String(edge.target);
    if (!adjacency.has(source)) {
      adjacency.set(source, new Set());
    }
    if (!adjacency.has(target)) {
      adjacency.set(target, new Set());
    }
    adjacency.get(source)?.add(target);
    adjacency.get(target)?.add(source);
  }

  const groups: string[][] = [];
  const visited = new Set<string>();
  for (const start of adjacency.keys()) {
    if (visited.has(start)) {
      continue;
    }
    const group: string[] = [];
    const queue = [start];
    visited.add(start);
    for (let index = 0; index < queue.length; index += 1) {
      const current = queue[index];
      group.push(current);
      for (const next of adjacency.get(current) ?? []) {
        if (visited.has(next)) {
          continue;
        }
        visited.add(next);
        queue.push(next);
      }
    }
    groups.push(group);
  }
  return groups;
}

function getGroupMaxStraightDegree(
  group: string[],
  edges: NonNullable<GraphData["edges"]>,
) {
  const groupIds = new Set(group);
  const degreeById = new Map<string, number>();
  for (const edge of edges) {
    const source = String(edge.source);
    const target = String(edge.target);
    if (!groupIds.has(source) || !groupIds.has(target)) {
      continue;
    }
    degreeById.set(source, (degreeById.get(source) ?? 0) + 1);
    degreeById.set(target, (degreeById.get(target) ?? 0) + 1);
  }
  return Math.max(0, ...degreeById.values());
}

function getMedian(values: number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[middle];
  }
  return (sorted[middle - 1] + sorted[middle]) / 2;
}

function mapG6LabelPlacement(labelPlacement: string) {
  const placement = labelPlacement as AttackGraphEdgeLabelPlacement;
  if (placement === "source-side") {
    return "start" as const;
  }
  if (placement === "target-side") {
    return "end" as const;
  }
  return "center" as const;
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

function readBool(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
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
