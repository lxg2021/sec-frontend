"use client";

import { useCallback, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
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
  AttackGraphLayoutOptions,
  AttackGraphNodeModel,
  GraphCaseResponseDto,
} from "../model/attack-graph-data";
import {
  toAttackGraphEdgeVisualData,
  type AttackGraphEdgeInteractionState,
  type AttackGraphEdgeVisualData,
} from "../model/attack-graph-edge-config";
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

  const layouted = useMemo(() => {
    const graph = buildAttackGraphModel(response);
    return layoutAttackGraph(graph, {
      direction: "LR",
      nodeWidth: ATTACK_GRAPH_NODE_TILE_WIDTH,
      nodeHeight: ATTACK_GRAPH_DEFAULT_NODE_HEIGHT,
      nodeSep: 64,
      rankSep: 140,
      ...layoutOptions,
    });
  }, [layoutOptions, response]);

  const nodes = useMemo(() => toReactFlowNodes(layouted.nodes), [layouted.nodes]);

  const nodeColorsById = useMemo(() => {
    return new Map(nodes.map((node) => [node.id, node.data.color]));
  }, [nodes]);

  const edges = useMemo(
    () =>
      toReactFlowEdges(layouted.edges, {
        hoveredEdgeId,
        nodeColorsById,
        selectedEdgeId,
      }),
    [hoveredEdgeId, layouted.edges, nodeColorsById, selectedEdgeId],
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
          fitView={fitView}
          defaultViewport={{ x: 40, y: 40, zoom: 1 }}
          minZoom={minZoom}
          maxZoom={maxZoom}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
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
          {showControls ? <Controls showInteractive={false} /> : null}
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
    nodeColorsById: Map<string, string>;
    selectedEdgeId: string | null;
  },
): ReactFlowEdge<AttackGraphEdgeData>[] {
  const visibleSelectedEdgeId =
    options.selectedEdgeId && edges.some((edge) => edge.id === options.selectedEdgeId)
      ? options.selectedEdgeId
      : null;

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

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export default AttackGraphFlowV2;
