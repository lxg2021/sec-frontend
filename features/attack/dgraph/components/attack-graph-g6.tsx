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
const RANK_GAP = 230;
const LANE_GAP = 150;
const NODE_STACK_GAP = 92;
const COMPONENT_GAP = 720;
const EDGE_EXIT_GAP = 88;
const EDGE_CHANNEL_GAP = 28;
const EDGE_TARGET_GAP = 58;
const GRAPH_PADDING_X = 128;
const GRAPH_PADDING_Y = 520;

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
      node: {
        type: "image",
        style: (datum) => {
          const nodeData = datum.data ?? {};
          const layoutX = Number(nodeData.layoutX);
          const layoutY = Number(nodeData.layoutY);
          return {
            x: Number.isFinite(layoutX) ? layoutX : undefined,
            y: Number.isFinite(layoutY) ? layoutY : undefined,
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
      },
      edge: {
        type: (datum) =>
          datum.source === datum.target ? "cubic" : "polyline",
        style: (datum) => {
          const relationType = String(datum.data?.relationType ?? "");
          const isSelfLoop = datum.source === datum.target;
          const edgeStyle = getAttackGraphEdgeStyle(relationType);
          const stroke = String(edgeStyle.stroke ?? "#64748b");
          const controlPoints = readControlPoints(datum.data?.controlPoints);
          const labelOffsetY = Number(datum.data?.labelOffsetY);
          return {
            stroke,
            lineWidth: Number(edgeStyle.strokeWidth ?? 1.8),
            opacity: Number(edgeStyle.opacity ?? 0.82),
            lineDash: parseLineDash(edgeStyle.strokeDasharray),
            radius: 8,
            controlPoints,
            router: false,
            endArrow: true,
            endArrowSize: 8,
            label: true,
            labelText: formatRelationLabel(relationType),
            labelPlacement: isSelfLoop ? "center" : "end",
            labelOffsetX: isSelfLoop ? 0 : -18,
            labelOffsetY: Number.isFinite(labelOffsetY) ? labelOffsetY : 0,
            labelAutoRotate: false,
            labelFontSize: 11,
            labelFill: "#334155",
            labelBackground: true,
            labelBackgroundFill: "#ffffff",
            labelBackgroundFillOpacity: 0.92,
            labelBackgroundStroke: "#e2e8f0",
            labelBackgroundLineWidth: 1,
            labelPadding: [2, 6],
            labelMaxWidth: 150,
            labelWordWrap: true,
            loop: true,
            loopType: "arc",
            loopDist: 72,
          };
        },
      },
      behaviors: ["drag-canvas", "zoom-canvas"],
      plugins: [
        {
          type: "grid-line",
          size: 24,
          stroke: "#dbeafe",
          lineWidth: 1,
          opacity: 0.7,
        },
      ],
      transforms: [
        {
          type: "process-parallel-edges",
          mode: "bundle",
          distance: 28,
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
  const positions = layoutAttackGraphSwimlanes(nodes, edges);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const edgeRoutes = buildAttackGraphEdgeRoutes(edges, positions, nodeById);

  return {
    nodes: nodes.map((node) => {
      const presentation = getAttackGraphNodePresentation(node.entityType);
      const position = positions.get(node.id) ?? { x: 0, y: 0 };
      return {
        id: node.id,
        data: {
          label: node.displayName,
          entityType: node.entityType,
          image: presentation.image,
          evidenceHit: Boolean(node.evidenceHit),
          layoutX: position.x,
          layoutY: position.y,
        },
      };
    }),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      data: {
        relationType: edge.relationType,
        controlPoints: edgeRoutes.get(edge.id)?.controlPoints ?? [],
        labelOffsetY: edgeRoutes.get(edge.id)?.labelOffsetY ?? 0,
      },
    })),
  };
}

interface AttackGraphEdgeRoute {
  controlPoints: AttackGraphControlPoint[];
  labelOffsetY: number;
}

type AttackGraphControlPoint = [number, number];

function buildAttackGraphEdgeRoutes(
  edges: AttackGraphEdgeModel[],
  positions: Map<string, { x: number; y: number }>,
  nodeById: Map<string, AttackGraphNodeModel>,
) {
  const routes = new Map<string, AttackGraphEdgeRoute>();
  const outgoingGroups = new Map<string, AttackGraphEdgeModel[]>();

  edges.forEach((edge) => {
    if (edge.source === edge.target) {
      return;
    }

    const target = nodeById.get(edge.target);
    const key = `${edge.source}:${getAttackGraphLane(target?.entityType)}`;
    const group = outgoingGroups.get(key) ?? [];
    group.push(edge);
    outgoingGroups.set(key, group);
  });

  outgoingGroups.forEach((group) => {
    group
      .slice()
      .sort((left, right) => {
        const leftTarget = positions.get(left.target);
        const rightTarget = positions.get(right.target);
        return (
          (leftTarget?.y ?? 0) - (rightTarget?.y ?? 0) ||
          left.relationType.localeCompare(right.relationType) ||
          left.id.localeCompare(right.id)
        );
      })
      .forEach((edge, index, sortedGroup) => {
        const offset =
          (index - (sortedGroup.length - 1) / 2) * EDGE_CHANNEL_GAP;
        routes.set(
          edge.id,
          buildAttackGraphEdgeRoute(edge, positions, nodeById, offset, index),
        );
      });
  });

  return routes;
}

function buildAttackGraphEdgeRoute(
  edge: AttackGraphEdgeModel,
  positions: Map<string, { x: number; y: number }>,
  nodeById: Map<string, AttackGraphNodeModel>,
  channelOffset: number,
  groupIndex: number,
): AttackGraphEdgeRoute {
  const source = positions.get(edge.source);
  const target = positions.get(edge.target);
  const sourceNode = nodeById.get(edge.source);
  const targetNode = nodeById.get(edge.target);

  if (!source || !target || edge.source === edge.target) {
    return { controlPoints: [], labelOffsetY: 0 };
  }

  const sourceLane = getAttackGraphLane(sourceNode?.entityType);
  const targetLane = getAttackGraphLane(targetNode?.entityType);
  const labelOffsetY = getEdgeLabelOffsetY(groupIndex, sourceLane, targetLane);

  if (isDirectHorizontalEdge(source, target, sourceLane, targetLane)) {
    return { controlPoints: [], labelOffsetY };
  }

  const direction = target.x >= source.x ? 1 : -1;
  const exitX = source.x + direction * (EDGE_EXIT_GAP + Math.abs(channelOffset));
  const targetApproachX = target.x - direction * EDGE_TARGET_GAP;
  const targetApproachY = target.y + getTargetApproachOffset(edge.relationType);

  return {
    controlPoints: compactControlPoints([
      [exitX, source.y],
      [exitX, targetApproachY],
      [targetApproachX, targetApproachY],
    ]),
    labelOffsetY,
  };
}

function isDirectHorizontalEdge(
  source: { x: number; y: number },
  target: { x: number; y: number },
  sourceLane: number,
  targetLane: number,
) {
  return sourceLane === targetLane && Math.abs(source.y - target.y) <= 16;
}

function getTargetApproachOffset(relationType: string) {
  if (relationType.includes("LOAD_DLL") || relationType.includes("READ_FILE")) {
    return 18;
  }
  if (
    relationType.includes("CREATE_FILE") ||
    relationType.includes("WRITE_FILE")
  ) {
    return -18;
  }
  return 0;
}

function getEdgeLabelOffsetY(
  groupIndex: number,
  sourceLane: number,
  targetLane: number,
) {
  if (sourceLane === targetLane) {
    return groupIndex % 2 === 0 ? -10 : 12;
  }
  return targetLane > sourceLane ? 12 : -12;
}

function compactControlPoints(points: AttackGraphControlPoint[]) {
  return points.filter((point, index, list) => {
    const previous = list[index - 1];
    return !previous || previous[0] !== point[0] || previous[1] !== point[1];
  });
}

function readControlPoints(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((point) => {
      if (!Array.isArray(point)) {
        return null;
      }

      const x = Number(point[0]);
      const y = Number(point[1]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return null;
      }

      return [x, y] as AttackGraphControlPoint;
    })
    .filter((point): point is AttackGraphControlPoint => point !== null);
}

function layoutAttackGraphSwimlanes(
  nodes: AttackGraphNodeModel[],
  edges: AttackGraphEdgeModel[],
) {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const adjacency = new Map<string, string[]>();
  const reverseAdjacency = new Map<string, string[]>();

  nodes.forEach((node) => {
    adjacency.set(node.id, []);
    reverseAdjacency.set(node.id, []);
  });

  edges.forEach((edge) => {
    if (
      !nodeIds.has(edge.source) ||
      !nodeIds.has(edge.target) ||
      edge.source === edge.target
    ) {
      return;
    }

    adjacency.get(edge.source)?.push(edge.target);
    reverseAdjacency.get(edge.target)?.push(edge.source);
  });

  const components = collectWeakComponents(nodes, adjacency, reverseAdjacency);
  const positions = new Map<string, { x: number; y: number }>();
  const orderedComponents = components.sort((a, b) => b.length - a.length);

  orderedComponents.forEach((component, componentIndex) => {
    const ranks = computeDirectedRanks(component, adjacency, reverseAdjacency);
    const buckets = new Map<string, string[]>();
    const componentBaseY = componentIndex * COMPONENT_GAP;

    component
      .slice()
      .sort((left, right) => {
        const leftNode = nodeById.get(left);
        const rightNode = nodeById.get(right);
        const leftDegree =
          (adjacency.get(left)?.length ?? 0) +
          (reverseAdjacency.get(left)?.length ?? 0);
        const rightDegree =
          (adjacency.get(right)?.length ?? 0) +
          (reverseAdjacency.get(right)?.length ?? 0);

        return (
          (ranks.get(left) ?? 0) - (ranks.get(right) ?? 0) ||
          getAttackGraphLane(leftNode?.entityType) -
            getAttackGraphLane(rightNode?.entityType) ||
          rightDegree - leftDegree ||
          String(leftNode?.displayName ?? left).localeCompare(
            String(rightNode?.displayName ?? right),
          )
        );
      })
      .forEach((nodeId) => {
        const node = nodeById.get(nodeId);
        const rank = ranks.get(nodeId) ?? 0;
        const lane = getAttackGraphLane(node?.entityType);
        const key = `${rank}:${lane}`;
        const bucket = buckets.get(key) ?? [];
        bucket.push(nodeId);
        buckets.set(key, bucket);
      });

    buckets.forEach((bucket, key) => {
      const [rankText, laneText] = key.split(":");
      const rank = Number(rankText);
      const lane = Number(laneText);
      bucket.forEach((nodeId, index) => {
        const stackOffset = (index - (bucket.length - 1) / 2) * NODE_STACK_GAP;
        positions.set(nodeId, {
          x: GRAPH_PADDING_X + rank * RANK_GAP,
          y: GRAPH_PADDING_Y + componentBaseY + lane * LANE_GAP + stackOffset,
        });
      });
    });
  });

  return positions;
}

function collectWeakComponents(
  nodes: AttackGraphNodeModel[],
  adjacency: Map<string, string[]>,
  reverseAdjacency: Map<string, string[]>,
) {
  const seen = new Set<string>();
  const components: string[][] = [];

  nodes.forEach((node) => {
    if (seen.has(node.id)) {
      return;
    }

    const component: string[] = [];
    const queue = [node.id];
    seen.add(node.id);

    for (let index = 0; index < queue.length; index += 1) {
      const current = queue[index];
      component.push(current);
      const neighbors = [
        ...(adjacency.get(current) ?? []),
        ...(reverseAdjacency.get(current) ?? []),
      ];

      neighbors.forEach((neighbor) => {
        if (!seen.has(neighbor)) {
          seen.add(neighbor);
          queue.push(neighbor);
        }
      });
    }

    components.push(component);
  });

  return components;
}

function computeDirectedRanks(
  component: string[],
  adjacency: Map<string, string[]>,
  reverseAdjacency: Map<string, string[]>,
) {
  const componentSet = new Set(component);
  const ranks = new Map<string, number>();
  const indegree = new Map<string, number>();

  component.forEach((nodeId) => {
    indegree.set(
      nodeId,
      (reverseAdjacency.get(nodeId) ?? []).filter((source) =>
        componentSet.has(source),
      ).length,
    );
  });

  const roots = component.filter(
    (nodeId) => (indegree.get(nodeId) ?? 0) === 0,
  );
  const queue = roots.length ? [...roots] : [component[0]];
  queue.forEach((nodeId) => ranks.set(nodeId, 0));

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    const nextRank = (ranks.get(current) ?? 0) + 1;
    (adjacency.get(current) ?? []).forEach((target) => {
      if (!componentSet.has(target)) {
        return;
      }

      ranks.set(target, Math.max(ranks.get(target) ?? 0, nextRank));
      indegree.set(target, Math.max(0, (indegree.get(target) ?? 0) - 1));
      if ((indegree.get(target) ?? 0) === 0) {
        queue.push(target);
      }
    });
  }

  component.forEach((nodeId) => {
    if (ranks.has(nodeId)) {
      return;
    }

    const parentRanks = (reverseAdjacency.get(nodeId) ?? [])
      .filter((source) => componentSet.has(source))
      .map((source) => ranks.get(source))
      .filter((rank): rank is number => typeof rank === "number");
    ranks.set(
      nodeId,
      parentRanks.length ? Math.max(...parentRanks) + 1 : 0,
    );
  });

  return ranks;
}

function getAttackGraphLane(entityType: string | null | undefined) {
  switch (entityType) {
    case "Host":
    case "HostRef":
    case "Device":
      return -3;
    case "DnsName":
    case "NetAddress":
    case "NetEndpoint":
    case "URLResource":
      return -2;
    case "Account":
    case "AccountGroup":
    case "CredentialTheft":
    case "TokenImpersonation":
      return -1;
    case "Process":
    case "PowerShellExecution":
    case "Crypto":
    case "MessageHook":
      return 0;
    case "Bits":
    case "FileMapping":
    case "MailSlot":
    case "NamedEvent":
    case "NamedPipe":
    case "ScheduledJob":
    case "Service":
    case "Task":
    case "WmiClass":
    case "WmiConsumer":
    case "WmiExecute":
    case "WmiFilter":
    case "WmiQuery":
      return 1;
    case "File":
    case "FileStream":
    case "Mbr":
    case "Volume":
      return 2;
    case "RegistryKey":
    case "RegistryValue":
      return 3;
    default:
      return 0;
  }
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
