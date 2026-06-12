"use client";

import { useMemo } from "react";
import Image from "next/image";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  type Node as ReactFlowNode,
  type NodeProps,
  type NodeTypes,
  type ReactFlowProps,
} from "reactflow";
import "reactflow/dist/style.css";

import { cn } from "@/shared/lib/utils";

import { buildAttackGraphModel } from "../model/attack-graph-adapter";
import type {
  AttackGraphLayoutOptions,
  AttackGraphNodeModel,
  GraphCaseResponseDto,
} from "../model/attack-graph-data";
import { layoutAttackGraph } from "../model/attack-graph-layout";
import {
  ATTACK_GRAPH_NODE_FAMILY_CONFIG,
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
  kind: string;
  label: string;
  entityLabel: string;
  image: string;
  family: string;
  color: string;
  glow: string;
  size: AttackGraphNodeSize;
  activeState: AttackGraphNodeVisualState;
  selectedState: AttackGraphNodeVisualState;
  missingFromResponse: boolean;
}

const NODE_TILE_EXTRA_HEIGHT = 60;
const NODE_TILE_WIDTH = 219;
const DEFAULT_NODE_HEIGHT = 144;

const nodeTypes: NodeTypes = {
  attackGraphNodeV2: AttackGraphFlowV2Node,
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
  ...reactFlowProps
}: AttackGraphFlowV2Props) {
  const nodes = useMemo(() => {
    const graph = buildAttackGraphModel(response);
    const layouted = layoutAttackGraph(graph, {
      direction: "LR",
      nodeWidth: NODE_TILE_WIDTH,
      nodeHeight: DEFAULT_NODE_HEIGHT,
      nodeSep: 64,
      rankSep: 140,
      ...layoutOptions,
    });

    return toReactFlowNodes(layouted.nodes);
  }, [layoutOptions, response]);

  return (
    <div className={cn("h-full min-h-[420px] w-full bg-transparent", className)}>
      <ReactFlow
        nodes={nodes}
        edges={[]}
        nodeTypes={nodeTypes}
        fitView={fitView}
        defaultViewport={{ x: 40, y: 40, zoom: 1 }}
        minZoom={minZoom}
        maxZoom={maxZoom}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
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
    </div>
  );
}

function AttackGraphFlowV2Node({
  data,
  selected,
}: NodeProps<AttackGraphFlowV2NodeData>) {
  const ringState = selected ? data.selectedState : data.activeState;
  const tileHeight = data.size.height + NODE_TILE_EXTRA_HEIGHT;

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
          top: data.size.icon / 2 + 12,
          transform: "translate(-50%, -50%)",
        }}
        isConnectable={false}
      />
      <button
        type="button"
        aria-pressed={selected}
        className={cn(
          "group h-full w-full min-w-0 rounded-md border bg-white px-3 py-3 text-left transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          selected ? "border-blue-300 bg-blue-50/30" : "border-slate-200",
        )}
        style={{
          opacity: data.missingFromResponse ? 0.5 : 1,
          boxShadow: selected
            ? `0 14px 30px ${toRgba(data.glow, 0.18)}`
            : `0 10px 24px ${toRgba(data.glow, 0.1)}`,
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "relative flex shrink-0 items-center justify-center rounded-full bg-white ring-1 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-110",
              selected ? "scale-110 ring-blue-200" : "ring-slate-200",
            )}
            style={{
              width: data.size.icon,
              height: data.size.icon,
              boxShadow: `0 0 0 ${Math.min(5, Math.max(2, ringState.haloLineWidth / 4))}px ${toRgba(
                data.color,
                Math.min(selected ? 0.26 : 0.18, ringState.haloStrokeOpacity),
              )}`,
            }}
          >
            <Image
              src={data.image}
              alt={data.label}
              width={Math.max(24, data.size.icon - 18)}
              height={Math.max(24, data.size.icon - 18)}
              className="h-auto w-auto max-w-[68%]"
            />
            {selected ? (
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-[11px] font-black leading-none text-white shadow-[0_6px_14px_rgba(37,99,235,0.28)]">
                OK
              </span>
            ) : null}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <div className="min-h-5 truncate text-sm font-semibold leading-5 text-slate-900">
              {data.label}
            </div>
            <div className="mt-0.5 truncate text-xs font-medium text-slate-500">
              {data.kind}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <NodeMetaPill className="text-slate-600">
                {data.family}
              </NodeMetaPill>
              <NodeMetaPill className="text-slate-500">
                {formatSize(data.size)}
              </NodeMetaPill>
              <NodeMetaPill className="text-slate-500">
                A{data.activeState.haloLineWidth}/S
                {data.selectedState.haloLineWidth}
              </NodeMetaPill>
            </div>
          </div>
        </div>
      </button>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-0 !bg-transparent"
        style={{
          right: 0,
          top: data.size.icon / 2 + 12,
          transform: "translate(50%, -50%)",
        }}
        isConnectable={false}
      />
    </div>
  );
}

function NodeMetaPill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-sm bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium leading-4",
        className,
      )}
    >
      {children}
    </span>
  );
}

function toReactFlowNodes(
  nodes: AttackGraphNodeModel[],
): ReactFlowNode<AttackGraphFlowV2NodeData>[] {
  return nodes.map((node) => {
    const data = toNodeVisualItem(node);
    const height = data.size.height + NODE_TILE_EXTRA_HEIGHT;

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

function toNodeVisualItem(
  node: AttackGraphNodeModel,
): AttackGraphFlowV2NodeData {
  const visualData = toAttackGraphNodeVisualData(
    node.entityType,
    node.displayName,
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
    kind: node.presentationKind,
    label: readString(visualData.label) || node.displayName,
    entityLabel: readString(visualData.entityLabel) || nodeConfig.label,
    image: readString(visualData.image) || nodeConfig.image,
    family: nodeConfig.family,
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

function formatSize(size: AttackGraphNodeSize) {
  return `${size.width}x${size.height}/${size.icon}`;
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
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
