"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  MiniMap,
  Position,
  type Edge as ReactFlowEdge,
  type EdgeTypes,
  type Node as ReactFlowNode,
  type NodeTypes,
  type ReactFlowProps,
} from "reactflow";
import "reactflow/dist/style.css";

import { cn } from "@/shared/lib/utils";
import { TooltipProvider } from "@/shared/ui/tooltip";

import { buildAttackGraphModel } from "../model/attack-graph-adapter";
import type {
  AttackGraphEdgeModel,
  AttackGraphLayoutResult,
  AttackGraphLayoutOptions,
  AttackGraphNodeModel,
  GraphCaseResponseDto,
} from "../model/attack-graph-data";
import {
  toAttackGraphEdgeVisualData,
  type AttackGraphEdgeInteractionState,
  type AttackGraphEdgeVisualData,
} from "../model/attack-graph-edge-config";
import {
  buildAttackGraphEdgeRoutes,
  type AttackGraphNodeEdgeGeometry,
} from "../model/attack-graph-edge-routing";
import { layoutAttackGraph } from "../model/attack-graph-layout";
import {
  ATTACK_GRAPH_NODE_FAMILY_CONFIG,
  getAttackGraphEntityNodeDisplayName,
  getAttackGraphNodeKindConfig,
  getAttackGraphNodeMergedStateConfig,
  getAttackGraphNodeSize,
  toAttackGraphNodeVisualData,
} from "../model/attack-graph-node-config";
import {
  AttackGraphEdge,
  type AttackGraphEdgeData,
} from "./attack-graph-edge";
import {
  ATTACK_GRAPH_DEFAULT_NODE_HEIGHT,
  ATTACK_GRAPH_NODE_HALO_PADDING,
  ATTACK_GRAPH_NODE_TILE_WIDTH,
  AttackGraphNode,
  getAttackGraphNodeVisualHeight,
  type AttackGraphNodeData,
} from "./attack-graph-node";

export interface AttackGraphFlowV2Props
  extends Omit<ReactFlowProps, "nodes" | "edges" | "nodeTypes" | "edgeTypes"> {
  response: GraphCaseResponseDto;
  className?: string;
  layoutOptions?: AttackGraphLayoutOptions;
  showMiniMap?: boolean;
  showControls?: boolean;
  showBackground?: boolean;
}

const nodeTypes: NodeTypes = {
  attackGraphNodeV2: AttackGraphNode,
};

const edgeTypes: EdgeTypes = {
  attackGraphEdgeV2: AttackGraphEdge,
};

export function AttackGraphFlowV2({
  response,
  className,
  layoutOptions,
  showMiniMap = false,
  showControls = true,
  showBackground = true,
  fitView = false,
  minZoom = 0.2,
  maxZoom = 1.6,
  onEdgeClick,
  onEdgeMouseEnter,
  onEdgeMouseLeave,
  onNodeClick,
  onPaneClick,
  ...reactFlowProps
}: AttackGraphFlowV2Props) {
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [layouted, setLayouted] = useState<AttackGraphLayoutResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    const graph = buildAttackGraphModel(response);

    setLayouted(null);
    layoutAttackGraph(graph, {
      direction: "LR",
      nodeWidth: ATTACK_GRAPH_NODE_TILE_WIDTH,
      nodeHeight: ATTACK_GRAPH_DEFAULT_NODE_HEIGHT,
      portY: ATTACK_GRAPH_NODE_HALO_PADDING + 58 / 2,
      nodeSep: 64,
      rankSep: 140,
      ...layoutOptions,
    })
      .then((nextLayouted) => {
        if (!cancelled) {
          setLayouted(nextLayouted);
        }
      })
      .catch((error) => {
        console.error("Failed to layout attack graph with ELK", error);
        if (!cancelled) {
          setLayouted({
            ...graph,
            height: 0,
            width: 0,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [layoutOptions, response]);

  const layoutedNodes = layouted?.nodes ?? [];
  const layoutedEdges = layouted?.edges ?? [];

  const nodes = useMemo(() => toReactFlowNodes(layoutedNodes), [layoutedNodes]);

  const nodeColorsById = useMemo(() => {
    return new Map(nodes.map((node) => [node.id, node.data.color]));
  }, [nodes]);

  const nodeGeometryById = useMemo(() => {
    return buildNodeGeometryById(nodes);
  }, [nodes]);

  const edges = useMemo(
    () =>
      toReactFlowEdges(layoutedEdges, {
        hoveredEdgeId,
        nodeGeometryById,
        nodeColorsById,
        selectedEdgeId,
      }),
    [
      hoveredEdgeId,
      layoutedEdges,
      nodeColorsById,
      nodeGeometryById,
      selectedEdgeId,
    ],
  );

  const handleEdgeClick = useCallback<
    NonNullable<ReactFlowProps["onEdgeClick"]>
  >(
    (event, edge) => {
      setSelectedEdgeId((current) => (current === edge.id ? null : edge.id));
      onEdgeClick?.(event, edge);
    },
    [onEdgeClick],
  );

  const handleEdgeMouseEnter = useCallback<
    NonNullable<ReactFlowProps["onEdgeMouseEnter"]>
  >(
    (event, edge) => {
      setHoveredEdgeId(edge.id);
      onEdgeMouseEnter?.(event, edge);
    },
    [onEdgeMouseEnter],
  );

  const handleEdgeMouseLeave = useCallback<
    NonNullable<ReactFlowProps["onEdgeMouseLeave"]>
  >(
    (event, edge) => {
      setHoveredEdgeId((current) => (current === edge.id ? null : current));
      onEdgeMouseLeave?.(event, edge);
    },
    [onEdgeMouseLeave],
  );

  const handleNodeClick = useCallback<
    NonNullable<ReactFlowProps["onNodeClick"]>
  >(
    (event, node) => {
      setSelectedEdgeId(null);
      onNodeClick?.(event, node);
    },
    [onNodeClick],
  );

  const handlePaneClick = useCallback<
    NonNullable<ReactFlowProps["onPaneClick"]>
  >(
    (event) => {
      setSelectedEdgeId(null);
      onPaneClick?.(event);
    },
    [onPaneClick],
  );

  return (
    <div className={cn("h-full min-h-[420px] w-full bg-transparent", className)}>
      <TooltipProvider delayDuration={180}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView={false}
          defaultViewport={{ x: 40, y: 40, zoom: 1 }}
          minZoom={1}
          maxZoom={1}
          zoomOnScroll={false}
          zoomOnPinch={false}
          panOnScroll={false}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          style={{ background: "transparent" }}
          onEdgeClick={handleEdgeClick}
          onEdgeMouseEnter={handleEdgeMouseEnter}
          onEdgeMouseLeave={handleEdgeMouseLeave}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          data-attack-graph-flow-v2="true"
          {...reactFlowProps}
        >
          {showBackground ? <Background color="#e2e8f0" gap={24} /> : null}
          {showMiniMap ? (
            <MiniMap
              nodeColor="#94a3b8"
              nodeStrokeWidth={2}
              pannable
              zoomable
            />
          ) : null}
        </ReactFlow>
      </TooltipProvider>
    </div>
  );
}

function toReactFlowNodes(
  nodes: AttackGraphNodeModel[],
): ReactFlowNode<AttackGraphNodeData>[] {
  return nodes.map((node) => {
    const data = toNodeVisualItem(node);
    const height = getAttackGraphNodeVisualHeight(data.size);

    return {
      id: node.id,
      type: "attackGraphNodeV2",
      position: node.position ?? { x: 0, y: 0 },
      data,
      width: ATTACK_GRAPH_NODE_TILE_WIDTH,
      height,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
  });
}

function toReactFlowEdges(
  edges: AttackGraphEdgeModel[],
  options: {
    hoveredEdgeId: string | null;
    nodeGeometryById: Map<string, AttackGraphNodeEdgeGeometry>;
    nodeColorsById: Map<string, string>;
    selectedEdgeId: string | null;
  },
): ReactFlowEdge<AttackGraphEdgeData>[] {
  const visibleSelectedEdgeId =
    options.selectedEdgeId && edges.some((edge) => edge.id === options.selectedEdgeId)
      ? options.selectedEdgeId
      : null;
  const edgeRoutesById = buildAttackGraphEdgeRoutes(
    edges,
    options.nodeGeometryById,
  );

  return edges.map((edge) => {
    const visual = toAttackGraphEdgeVisualData({
      edgeKey: edge.edgeKey,
      graphOrigin: edge.graphOrigin,
      properties: edge.properties,
      relationType: edge.relationType,
    });
    const selected = visibleSelectedEdgeId === edge.id;
    const hovered = options.hoveredEdgeId === edge.id;
    const dimmed = visibleSelectedEdgeId !== null && !selected;
    const interactionState = getEdgeInteractionState({
      dimmed,
      hovered,
      selected,
    });
    const state = visual.state[interactionState];
    const sourceGeometry = options.nodeGeometryById.get(edge.source);
    const targetGeometry = options.nodeGeometryById.get(edge.target);

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: "attackGraphEdgeV2",
      ariaLabel: visual.tooltip,
      data: {
        edge,
        interactionState,
        sourceColor: options.nodeColorsById.get(edge.source) ?? state.color,
        targetColor: options.nodeColorsById.get(edge.target) ?? state.color,
        geometry:
          sourceGeometry && targetGeometry
            ? {
                route: getEdgeRoute(edge, edgeRoutesById),
                source: sourceGeometry,
                target: targetGeometry,
              }
            : undefined,
        visual,
      },
      interactionWidth: Math.max(18, state.width + 14),
      label: visual.label,
      selected,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      zIndex: getEdgeZIndex(visual, interactionState),
    };
  });
}

function toNodeVisualItem(node: AttackGraphNodeModel): AttackGraphNodeData {
  const displayLabel = getAttackGraphEntityNodeDisplayName({
    entityType: node.entityType,
    key: node.key,
    displayName: node.displayName,
    properties: node.properties,
  });
  const visualData = toAttackGraphNodeVisualData(
    node.entityType,
    displayLabel,
    {
      evidenceHit: Boolean(node.evidenceHit),
      missingFromResponse: Boolean(node.missingFromResponse),
    },
  );
  const nodeConfig = getAttackGraphNodeKindConfig(node.presentationKind);
  const familyConfig = ATTACK_GRAPH_NODE_FAMILY_CONFIG[nodeConfig.family];
  const size = getAttackGraphNodeSize(nodeConfig);

  return {
    id: node.id,
    label: readString(visualData.label) || displayLabel || node.displayName,
    labelTooltip: node.displayName || displayLabel || node.key,
    entityLabel: readString(visualData.entityLabel) || nodeConfig.label,
    image: readString(visualData.image) || nodeConfig.image,
    color: nodeConfig.accentColor ?? familyConfig.fill,
    glow: familyConfig.glow,
    size,
    activeState: getAttackGraphNodeMergedStateConfig(
      nodeConfig,
      familyConfig,
      "active",
      size,
    ),
    selectedState: getAttackGraphNodeMergedStateConfig(
      nodeConfig,
      familyConfig,
      "selected",
      size,
    ),
    missingFromResponse: Boolean(node.missingFromResponse),
  };
}

function getEdgeInteractionState({
  dimmed,
  hovered,
  selected,
}: {
  dimmed: boolean;
  hovered: boolean;
  selected: boolean;
}): AttackGraphEdgeInteractionState {
  if (selected) {
    return "selected";
  }
  if (hovered) {
    return "hover";
  }
  if (dimmed) {
    return "dimmed";
  }
  return "default";
}

function getEdgeZIndex(
  visual: AttackGraphEdgeVisualData,
  state: AttackGraphEdgeInteractionState,
) {
  if (state === "selected") {
    return visual.priority + 200;
  }
  if (state === "hover") {
    return visual.priority + 100;
  }
  if (state === "dimmed") {
    return visual.priority - 100;
  }
  return visual.priority;
}

const EDGE_ANCHOR_OUTSET = 4;

function getEdgeRoute(
  edge: AttackGraphEdgeModel,
  edgeRoutesById: ReturnType<typeof buildAttackGraphEdgeRoutes>,
) {
  return (
    edgeRoutesById.get(edge.id) ?? {
      fanoutCount: 1,
      fanoutIndex: 0,
      fanoutOffset: 0,
      kind: "relation" as const,
    }
  );
}

function buildNodeGeometryById(
  nodes: ReactFlowNode<AttackGraphNodeData>[],
): Map<string, AttackGraphNodeEdgeGeometry> {
  const geometryById = new Map<string, AttackGraphNodeEdgeGeometry>();

  for (const node of nodes) {
    const height = getAttackGraphNodeVisualHeight(node.data.size);
    geometryById.set(node.id, {
      id: node.id,
      centerX: node.position.x + ATTACK_GRAPH_NODE_TILE_WIDTH / 2,
      centerY:
        node.position.y +
        ATTACK_GRAPH_NODE_HALO_PADDING +
        node.data.size.icon / 2,
      radius: node.data.size.icon / 2 + EDGE_ANCHOR_OUTSET,
      bounds: {
        x: node.position.x,
        y: node.position.y,
        width: ATTACK_GRAPH_NODE_TILE_WIDTH,
        height,
      },
    });
  }

  return geometryById;
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export default AttackGraphFlowV2;
