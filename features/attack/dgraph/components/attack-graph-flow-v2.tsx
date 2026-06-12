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
  entityLabel: string;
  image: string;
  color: string;
  glow: string;
  size: AttackGraphNodeSize;
  activeState: AttackGraphNodeVisualState;
  selectedState: AttackGraphNodeVisualState;
  missingFromResponse: boolean;
}

const NODE_HALO_PADDING = 12;
const NODE_LABEL_GAP = 8;
const NODE_LABEL_HEIGHT = 22;
const NODE_TILE_WIDTH = 176;
const DEFAULT_NODE_HEIGHT = 112;

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
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-[11px] font-black leading-none text-white shadow-[0_6px_14px_rgba(37,99,235,0.28)]">
              OK
            </span>
          ) : null}
        </div>

        <div
          className="w-full truncate text-sm font-semibold leading-5"
          style={{ marginTop: NODE_LABEL_GAP }}
          title={data.label}
        >
          {data.label}
        </div>
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
