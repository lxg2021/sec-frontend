"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import ReactFlow, {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MiniMap,
  Position,
  getBezierPath,
  type Edge as ReactFlowEdge,
  type EdgeProps,
  type EdgeTypes,
  type Node as ReactFlowNode,
  type NodeProps,
  type NodeTypes,
  type ReactFlowProps,
} from "reactflow";
import "reactflow/dist/style.css";

import { cn } from "@/shared/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

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
} from "../model/attack-graph-edge-presentation";
import { layoutAttackGraph } from "../model/attack-graph-layout";
import {
  ATTACK_GRAPH_NODE_FAMILY_CONFIG,
  getAttackGraphEntityNodeDisplayName,
  getAttackGraphNodeKindConfig,
  getAttackGraphNodeMergedStateConfig,
  getAttackGraphNodeSize,
  toAttackGraphNodeVisualData,
  type AttackGraphNodeSize,
} from "./attack-graph-node-config";

export interface AttackGraphFlowV2Props
  extends Omit<ReactFlowProps, "nodes" | "edges" | "nodeTypes" | "edgeTypes"> {
  response: GraphCaseResponseDto;
  className?: string;
  layoutOptions?: AttackGraphLayoutOptions;
  showMiniMap?: boolean;
  showControls?: boolean;
  showBackground?: boolean;
}

type AttackGraphNodeVisualState = ReturnType<
  typeof getAttackGraphNodeMergedStateConfig
>;

interface AttackGraphFlowV2NodeData {
  id: string;
  label: string;
  labelTooltip: string;
  entityLabel: string;
  image: string;
  color: string;
  glow: string;
  size: AttackGraphNodeSize;
  activeState: AttackGraphNodeVisualState;
  selectedState: AttackGraphNodeVisualState;
  missingFromResponse: boolean;
}

interface AttackGraphFlowV2EdgeData {
  edge: AttackGraphEdgeModel;
  visual: AttackGraphEdgeVisualData;
  interactionState: AttackGraphEdgeInteractionState;
  sourceColor: string;
  targetColor: string;
}

const NODE_HALO_PADDING = 12;
const NODE_LABEL_GAP = 8;
const NODE_LABEL_HEIGHT = 22;
const NODE_TILE_WIDTH = 176;
const DEFAULT_NODE_HEIGHT = 112;

const nodeTypes: NodeTypes = {
  attackGraphNodeV2: AttackGraphFlowV2Node,
};

const edgeTypes: EdgeTypes = {
  attackGraphEdgeV2: AttackGraphFlowV2Edge,
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
      nodeWidth: NODE_TILE_WIDTH,
      nodeHeight: DEFAULT_NODE_HEIGHT,
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

function AttackGraphFlowV2Edge({
  data,
  id,
  source,
  sourcePosition,
  sourceX,
  sourceY,
  target,
  targetPosition,
  targetX,
  targetY,
}: EdgeProps<AttackGraphFlowV2EdgeData>) {
  if (!data) {
    return null;
  }

  const visual = data.visual;
  const state = visual.state[data.interactionState];
  const isSelfLoop = source === target;
  const pathResult = isSelfLoop
    ? getSelfLoopPath(sourceX, sourceY)
    : getGraphEdgePath({
        sourcePosition,
        sourceX,
        sourceY,
        targetPosition,
        targetX,
        targetY,
      });
  const gradientTargetX = isSelfLoop ? pathResult.labelX : targetX;
  const gradientTargetY = isSelfLoop ? pathResult.labelY : targetY;
  const stroke =
    visual.colorMode === "gradient"
      ? `url(#${getEdgeGradientId(id, data.interactionState)})`
      : state.color;
  const sourceColor =
    visual.colorMode === "gradient" ? data.sourceColor : state.color;
  const targetColor =
    visual.colorMode === "gradient" ? data.targetColor : state.color;
  const markerId = getEdgeMarkerId(id, data.interactionState);
  const markerEnd =
    visual.marker.type === "none" ? undefined : `url(#${markerId})`;
  const emphasized =
    data.interactionState === "hover" ||
    data.interactionState === "selected";

  return (
    <>
      <defs>
        {visual.colorMode === "gradient" ? (
          <linearGradient
            id={getEdgeGradientId(id, data.interactionState)}
            gradientUnits="userSpaceOnUse"
            x1={sourceX}
            x2={gradientTargetX}
            y1={sourceY}
            y2={gradientTargetY}
          >
            <stop offset="0%" stopColor={sourceColor} />
            <stop offset="100%" stopColor={targetColor} />
          </linearGradient>
        ) : null}
        {visual.marker.type !== "none" ? (
          <AttackGraphFlowV2EdgeMarker
            color={targetColor}
            id={markerId}
            opacity={state.opacity}
            size={visual.marker.size}
            type={visual.marker.type}
          />
        ) : null}
      </defs>
      {emphasized ? (
        <BaseEdge
          id={`${id}-halo`}
          path={pathResult.path}
          style={{
            fill: "none",
            opacity: data.interactionState === "selected" ? 0.18 : 0.12,
            stroke,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth:
              state.width + (data.interactionState === "selected" ? 5 : 3),
          }}
        />
      ) : null}
      <BaseEdge
        id={id}
        interactionWidth={Math.max(18, state.width + 14)}
        markerEnd={markerEnd}
        path={pathResult.path}
        style={{
          fill: "none",
          opacity: state.opacity,
          stroke,
          strokeDasharray: state.strokeDasharray || undefined,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: state.width,
          transition: "opacity 160ms ease, stroke-width 160ms ease",
        }}
      />
      <EdgeLabelRenderer>
        <div
          className={cn(
            "nodrag nopan pointer-events-none absolute max-w-[150px] truncate rounded-sm border px-1.5 py-0.5 text-[10px] font-medium leading-4 shadow-sm transition-opacity duration-200",
            data.interactionState === "selected"
              ? "border-blue-200 bg-blue-50 text-blue-800"
              : "border-slate-200/80 bg-white/90 text-slate-800",
            data.interactionState === "dimmed" ? "text-slate-500" : "",
          )}
          data-attack-edge-state={data.interactionState}
          data-attack-edge-type={visual.relationType}
          style={{
            opacity: data.interactionState === "dimmed" ? 0.48 : 1,
            transform: `translate(-50%, -50%) translate(${pathResult.labelX}px, ${pathResult.labelY}px)`,
          }}
          title={visual.tooltip}
        >
          {visual.label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

function AttackGraphFlowV2Node({
  data,
  selected,
}: NodeProps<AttackGraphFlowV2NodeData>) {
  const ringState = selected ? data.selectedState : data.activeState;
  const tileHeight = getNodeVisualHeight(data.size);
  const handleY = NODE_HALO_PADDING + data.size.icon / 2;

  return (
    <div
      className="relative"
      style={{
        width: NODE_TILE_WIDTH,
        height: tileHeight,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-0 !bg-transparent"
        style={{
          left: 0,
          top: handleY,
          transform: "translate(-50%, -50%)",
        }}
        isConnectable={false}
      />
      <button
        type="button"
        aria-pressed={selected}
        className={cn(
          "group flex h-full w-full min-w-0 flex-col items-center justify-start border-0 bg-transparent px-0 text-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          selected ? "text-slate-950" : "text-slate-900",
        )}
        style={{
          opacity: data.missingFromResponse ? 0.5 : 1,
        }}
      >
        <div
          className={cn(
            "relative flex shrink-0 items-center justify-center rounded-full bg-white ring-1 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-110",
            selected ? "scale-110 ring-blue-200" : "ring-slate-200",
          )}
          style={{
            width: data.size.icon,
            height: data.size.icon,
            marginTop: NODE_HALO_PADDING,
            boxShadow: `0 0 0 ${Math.min(5, Math.max(2, ringState.haloLineWidth / 4))}px ${toRgba(
              data.color,
              Math.min(selected ? 0.26 : 0.18, ringState.haloStrokeOpacity),
            )}, 0 ${selected ? 14 : 10}px ${selected ? 22 : 16}px ${toRgba(
              data.glow,
              selected ? 0.18 : 0.1,
            )}`,
          }}
        >
          <Image
            src={data.image}
            alt={data.entityLabel}
            width={Math.max(24, data.size.icon - 18)}
            height={Math.max(24, data.size.icon - 18)}
            className="h-auto w-auto max-w-[68%]"
          />
          {selected ? (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-blue-600 shadow-[0_4px_10px_rgba(37,99,235,0.32)]" />
          ) : null}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="inline-block max-w-full truncate text-sm font-semibold leading-5"
              style={{ marginTop: NODE_LABEL_GAP }}
            >
              {data.label}
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            align="center"
            sideOffset={8}
            className="max-w-[420px] whitespace-pre-wrap break-all rounded-lg border-slate-200 bg-white px-3 py-2 font-mono text-xs leading-5 text-slate-700 shadow-lg"
          >
            {data.labelTooltip || data.label}
          </TooltipContent>
        </Tooltip>
      </button>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-0 !bg-transparent"
        style={{
          right: 0,
          top: handleY,
          transform: "translate(50%, -50%)",
        }}
        isConnectable={false}
      />
    </div>
  );
}

function toReactFlowNodes(
  nodes: AttackGraphNodeModel[],
): ReactFlowNode<AttackGraphFlowV2NodeData>[] {
  return nodes.map((node) => {
    const data = toNodeVisualItem(node);
    const height = getNodeVisualHeight(data.size);

    return {
      id: node.id,
      type: "attackGraphNodeV2",
      position: node.position ?? { x: 0, y: 0 },
      data,
      width: NODE_TILE_WIDTH,
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
): ReactFlowEdge<AttackGraphFlowV2EdgeData>[] {
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

function toNodeVisualItem(
  node: AttackGraphNodeModel,
): AttackGraphFlowV2NodeData {
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

function getNodeVisualHeight(size: AttackGraphNodeSize) {
  return (
    size.icon +
    NODE_HALO_PADDING * 2 +
    NODE_LABEL_GAP +
    NODE_LABEL_HEIGHT
  );
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
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

function getGraphEdgePath({
  sourcePosition,
  sourceX,
  sourceY,
  targetPosition,
  targetX,
  targetY,
}: {
  sourcePosition: Position;
  sourceX: number;
  sourceY: number;
  targetPosition: Position;
  targetX: number;
  targetY: number;
}) {
  const deltaY = Math.abs(targetY - sourceY);
  const deltaX = Math.abs(targetX - sourceX);
  const isCrossLane =
    deltaY > DEFAULT_NODE_HEIGHT * 0.8 && deltaX > NODE_TILE_WIDTH * 0.6;
  const [path, labelX, labelY] = getBezierPath({
    curvature: isCrossLane ? 0.34 : 0.2,
    sourcePosition,
    sourceX,
    sourceY,
    targetPosition,
    targetX,
    targetY,
  });

  return { labelX, labelY, path };
}

function getSelfLoopPath(sourceX: number, sourceY: number) {
  const radiusX = 72;
  const radiusY = 46;
  const path = [
    `M ${sourceX} ${sourceY}`,
    `C ${sourceX + radiusX} ${sourceY - radiusY}`,
    `${sourceX + radiusX} ${sourceY + radiusY}`,
    `${sourceX} ${sourceY + radiusY * 1.15}`,
  ].join(" ");

  return {
    labelX: sourceX + radiusX,
    labelY: sourceY,
    path,
  };
}

function AttackGraphFlowV2EdgeMarker({
  color,
  id,
  opacity,
  size,
  type,
}: {
  color: string;
  id: string;
  opacity: number;
  size: number;
  type: AttackGraphEdgeVisualData["marker"]["type"];
}) {
  const markerSize = Math.max(10, Math.min(18, size));
  const middle = markerSize / 2;

  return (
    <marker
      id={id}
      markerHeight={markerSize}
      markerUnits="userSpaceOnUse"
      markerWidth={markerSize}
      orient="auto"
      refX={type === "diamond" ? middle : markerSize - 1}
      refY={middle}
      viewBox={`0 0 ${markerSize} ${markerSize}`}
    >
      {type === "diamond" ? (
        <path
          d={`M${middle},1 L${markerSize - 1},${middle} L${middle},${
            markerSize - 1
          } L1,${middle} Z`}
          fill={color}
          opacity={opacity}
        />
      ) : (
        <path
          d={`M2,2 L${markerSize - 1},${middle} L2,${markerSize - 2} Z`}
          fill={color}
          opacity={opacity}
        />
      )}
    </marker>
  );
}

function getEdgeGradientId(
  edgeId: string,
  state: AttackGraphEdgeInteractionState,
) {
  return `attack-graph-flow-v2-gradient-${toSafeSvgId(edgeId)}-${state}`;
}

function getEdgeMarkerId(
  edgeId: string,
  state: AttackGraphEdgeInteractionState,
) {
  return `attack-graph-flow-v2-marker-${toSafeSvgId(edgeId)}-${state}`;
}

function toSafeSvgId(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  const readable = value.replace(/[^\w-]/g, "_").slice(0, 80);
  return `${readable}_${hash.toString(36)}`;
}

function toRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  if (!/^[\da-f]{6}$/i.test(normalized)) {
    return `rgba(15, 23, 42, ${alpha})`;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export default AttackGraphFlowV2;
