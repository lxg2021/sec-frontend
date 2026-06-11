"use client";

import { useMemo } from "react";
import ReactFlow, {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
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

import { AttackGraphNode } from "./attack-graph-node";
import { buildAttackGraphModel } from "../model/attack-graph-adapter";
import type {
  AttackGraphEdgeModel,
  AttackGraphLayoutOptions,
  AttackGraphNodeModel,
  GraphCaseResponseDto,
} from "../model/attack-graph-data";
import { getAttackGraphEdgeStyle } from "../model/attack-graph-edge-presentation";
import { layoutAttackGraph } from "../model/attack-graph-layout";

export interface AttackGraphFlowProps
  extends Omit<ReactFlowProps, "nodes" | "edges" | "nodeTypes"> {
  response: GraphCaseResponseDto;
  className?: string;
  layoutOptions?: AttackGraphLayoutOptions;
  compactNodes?: boolean;
  showMiniMap?: boolean;
  showControls?: boolean;
  showBackground?: boolean;
}

type AttackGraphFlowNodeData = AttackGraphNodeModel & {
  compact?: boolean;
};

type AttackGraphFlowEdgeData = AttackGraphEdgeModel;

const NODE_WIDTH = 148;
const NODE_HEIGHT = 76;
const NODE_ICON_SIZE = 44;
const NODE_ICON_OFFSET = (NODE_WIDTH - NODE_ICON_SIZE) / 2;
const NODE_ICON_CENTER_Y = NODE_ICON_SIZE / 2;

const nodeTypes: NodeTypes = {
  attackGraphNode: AttackGraphFlowNode,
};

const edgeTypes: EdgeTypes = {
  attackGraphEdge: AttackGraphFlowEdge,
};

export function AttackGraphFlow({
  response,
  className,
  layoutOptions,
  compactNodes = false,
  showMiniMap = true,
  showControls = true,
  showBackground = true,
  fitView = true,
  minZoom = 0.2,
  maxZoom = 1.6,
  ...reactFlowProps
}: AttackGraphFlowProps) {
  const { nodes, edges } = useMemo(() => {
    const graph = buildAttackGraphModel(response);
    const layouted = layoutAttackGraph(graph, {
      direction: "LR",
      nodeWidth: NODE_WIDTH,
      nodeHeight: compactNodes ? 58 : NODE_HEIGHT,
      ...layoutOptions,
    });

    return {
      nodes: toReactFlowNodes(layouted.nodes, compactNodes),
      edges: toReactFlowEdges(layouted.edges),
    };
  }, [compactNodes, layoutOptions, response]);

  return (
    <div className={cn("h-full min-h-[420px] w-full", className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView={fitView}
        minZoom={minZoom}
        maxZoom={maxZoom}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        {...reactFlowProps}
      >
        {showBackground ? <Background color="#cbd5e1" gap={24} /> : null}
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
    </div>
  );
}

function AttackGraphFlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  label,
  data,
  selected,
}: EdgeProps<AttackGraphFlowEdgeData>) {
  const deltaY = Math.abs(targetY - sourceY);
  const deltaX = Math.abs(targetX - sourceX);
  const isCrossLane = deltaY > NODE_HEIGHT * 0.8 && deltaX > NODE_WIDTH * 0.6;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: isCrossLane ? 0.34 : 0.2,
  });
  const relationType =
    typeof label === "string" && label.trim()
      ? label
      : data?.relationType || "RELATED";
  const stroke = String(style?.stroke ?? "#64748b");

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        interactionWidth={18}
        style={{
          ...style,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          opacity: selected ? 1 : style?.opacity,
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-none absolute max-w-[180px] truncate rounded-sm border border-slate-200/80 bg-white/90 px-1.5 py-0.5 text-[10px] font-medium leading-4 text-slate-800 shadow-sm"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
          title={relationType}
        >
          <span
            className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle"
            style={{ backgroundColor: stroke }}
          />
          {relationType}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

function AttackGraphFlowNode({
  data,
  selected,
}: NodeProps<AttackGraphFlowNodeData>) {
  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-0 !bg-transparent"
        style={{
          left: NODE_ICON_OFFSET,
          top: NODE_ICON_CENTER_Y,
          transform: "translate(0, -50%)",
        }}
        isConnectable={false}
      />
      <AttackGraphNode
        data={{
          key: data.key,
          entityType: data.entityType,
          displayName: data.displayName,
          properties: data.properties,
          evidenceHit: data.evidenceHit,
          evidenceRefs: data.evidenceRefs,
        }}
        compact={data.compact}
        muted={data.missingFromResponse}
        selected={selected}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-0 !bg-transparent"
        style={{
          right: NODE_ICON_OFFSET,
          top: NODE_ICON_CENTER_Y,
          transform: "translate(0, -50%)",
        }}
        isConnectable={false}
      />
    </div>
  );
}

function toReactFlowNodes(
  nodes: AttackGraphNodeModel[],
  compact: boolean,
): ReactFlowNode<AttackGraphFlowNodeData>[] {
  return nodes.map((node) => ({
    id: node.id,
    type: "attackGraphNode",
    position: node.position ?? { x: 0, y: 0 },
    data: {
      ...node,
      compact,
    },
    width: NODE_WIDTH,
    height: compact ? 58 : NODE_HEIGHT,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  }));
}

function toReactFlowEdges(
  edges: AttackGraphEdgeModel[],
): ReactFlowEdge<AttackGraphFlowEdgeData>[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: "attackGraphEdge",
    data: edge,
    label: edge.relationType,
    labelShowBg: true,
    labelBgPadding: [6, 3],
    labelBgBorderRadius: 4,
    style: getAttackGraphEdgeStyle(edge.relationType),
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: String(getAttackGraphEdgeStyle(edge.relationType).stroke),
      width: 18,
      height: 18,
    },
  }));
}

export default AttackGraphFlow;
