"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Shield } from "lucide-react";
import ReactFlow, {
  Background,
  MiniMap,
  Position,
  type Edge as ReactFlowEdge,
  type EdgeTypes,
  type Node as ReactFlowNode,
  type NodeTypes,
  type ReactFlowInstance,
  type ReactFlowProps,
} from "reactflow";
import "reactflow/dist/style.css";

import { cn } from "@/shared/lib/utils";
import { TooltipProvider } from "@/shared/ui/tooltip";

import { buildAttackGraphModel } from "../model/attack-graph-adapter";
import type {
  AttackGraphEdgeModel,
  AttackGraphLayoutResult,
  AttackGraphLayoutSession,
  AttackGraphLayoutOptions,
  AttackGraphLayoutStrategy,
  AttackGraphNodeModel,
  GraphCaseResponseDto,
} from "../model/attack-graph-data";
import {
  toAttackGraphEdgeVisualData,
  type AttackGraphEdgeInteractionState,
  type AttackGraphEdgeVisualData,
} from "../model/attack-graph-edge-config";
import { buildAttackGraphEdgeDiagnostics } from "../model/attack-graph-edge-diagnostics";
import {
  buildAttackGraphEdgeRoutes,
  type AttackGraphEdgeRouteData,
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

export interface AttackGraphFlowProps
  extends Omit<ReactFlowProps, "nodes" | "edges" | "nodeTypes" | "edgeTypes"> {
  response: GraphCaseResponseDto;
  className?: string;
  layoutOptions?: AttackGraphLayoutOptions;
  onDiagnosticsChange?: (diagnostics: AttackGraphFlowDiagnostics) => void;
  showMiniMap?: boolean;
  showBackground?: boolean;
}

export interface AttackGraphFlowDiagnostics {
  edgeDiagnostics: NonNullable<AttackGraphLayoutResult["edgeDiagnostics"]>;
  edgeDiagnosticsText: string;
  graphHeight: number;
  graphWidth: number;
  layoutMode: AttackGraphLayoutResult["layoutMode"];
  layoutStrategy: AttackGraphLayoutResult["layoutStrategy"];
  nodeCount: number;
  edgeCount: number;
  topologyDiagnostics?: AttackGraphLayoutResult["topologyDiagnostics"];
  topologyDiagnosticsText: string;
  topologyKind?: string;
}

export function AttackGraphFlowHeader({
  title,
  subtitle,
  nodeCount,
  edgeCount,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  nodeCount?: number;
  edgeCount?: number;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-wrap items-center justify-between gap-3", className)}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
          <Shield className="h-5 w-5 text-blue-400" />
        </div>
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="truncate text-2xl font-semibold leading-7 text-slate-950">
              {title}
            </h2>
            {typeof nodeCount === "number" && typeof edgeCount === "number" ? (
              <span className="rounded-sm bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                {nodeCount} nodes / {edgeCount} edges
              </span>
            ) : null}
          </div>
          {subtitle ? (
            <p className="mt-1 truncate text-sm leading-5 text-slate-500">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

const nodeTypes: NodeTypes = {
  attackGraphNode: AttackGraphNode,
};

const edgeTypes: EdgeTypes = {
  attackGraphEdge: AttackGraphEdge,
};

export function AttackGraphFlow({
  response,
  className,
  layoutOptions,
  onDiagnosticsChange,
  showMiniMap = false,
  showBackground = true,
  fitView = false,
  minZoom = 1,
  maxZoom = 1,
  onEdgeClick,
  onEdgeMouseEnter,
  onEdgeMouseLeave,
  onNodeClick,
  onPaneClick,
  ...reactFlowProps
}: AttackGraphFlowProps) {
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [layouted, setLayouted] = useState<AttackGraphLayoutResult | null>(null);
  const layoutSessionsByStrategyRef = useRef<
    Partial<Record<AttackGraphLayoutStrategy, AttackGraphLayoutSession>>
  >({});
  const lastLayoutStrategyRef = useRef<AttackGraphLayoutStrategy | null>(null);
  const previousCaseIdRef = useRef<string>("");
  const rfInstanceRef = useRef<ReactFlowInstance | null>(null);
  const hasFittedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const graph = buildAttackGraphModel(response);
    const caseChanged = previousCaseIdRef.current !== graph.caseId;
    const requestedStrategy = layoutOptions?.strategy;
    const previousStrategy = requestedStrategy ?? lastLayoutStrategyRef.current;
    const previousSession = caseChanged
      ? null
      : previousStrategy
        ? layoutSessionsByStrategyRef.current[previousStrategy] ?? null
        : null;

    hasFittedRef.current = false;
    if (caseChanged) {
      setLayouted(null);
      layoutSessionsByStrategyRef.current = {};
      lastLayoutStrategyRef.current = null;
      previousCaseIdRef.current = graph.caseId;
    }
    layoutAttackGraph(graph, {
      direction: "LR",
      nodeWidth: ATTACK_GRAPH_NODE_TILE_WIDTH,
      nodeHeight: ATTACK_GRAPH_DEFAULT_NODE_HEIGHT,
      nodeSep: 48,
      rankSep: 110,
      session: previousSession,
      ...layoutOptions,
    })
      .then((nextLayouted) => {
        if (!cancelled) {
          layoutSessionsByStrategyRef.current[nextLayouted.layoutStrategy] =
            nextLayouted.layoutSession;
          lastLayoutStrategyRef.current = nextLayouted.layoutStrategy;
          setLayouted(nextLayouted);
        }
      })
      .catch((error) => {
        console.error("Failed to layout attack graph with ELK", error);
        if (!cancelled) {
          setLayouted({
            ...graph,
            height: 0,
            layoutMode: "tiny",
            layoutSession: createEmptyLayoutSession(
              graph.caseId,
              requestedStrategy ?? "layered",
            ),
            layoutStrategy: requestedStrategy ?? "layered",
            topologyDiagnostics: {
              backEdgeCount: 0,
              cyclic: false,
              duplicatePairCount: 0,
              edgeCount: graph.edges.length,
              maxInDegree: 0,
              maxOutDegree: 0,
              multiEdgePairCount: 0,
              nodeCount: graph.nodes.length,
              relationEdgeCount: graph.edges.filter(
                (edge) => edge.source !== edge.target,
              ).length,
              rootCount: 0,
              selfLoopCount: graph.edges.filter(
                (edge) => edge.source === edge.target,
              ).length,
              sinkCount: 0,
              treeEdgeDelta: 0,
              zeroInDegreeCount: 0,
              zeroOutDegreeCount: 0,
            },
            topologyKind: "error",
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

  useEffect(() => {
    if (nodes.length > 0 && rfInstanceRef.current && !hasFittedRef.current) {
      const timer = setTimeout(() => {
        rfInstanceRef.current?.fitView({
          duration: 220,
          maxZoom: 1,
          minZoom: 1,
          padding: 0,
        });
        hasFittedRef.current = true;
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [nodes]);

  const nodeColorsById = useMemo(() => {
    return new Map(nodes.map((node) => [node.id, node.data.color]));
  }, [nodes]);

  const nodeGeometryById = useMemo(() => {
    return buildNodeGeometryById(nodes);
  }, [nodes]);

  const edgeRoutesById = useMemo(
    () =>
      layouted?.edgeRoutesById ??
      buildAttackGraphEdgeRoutes(layoutedEdges, nodeGeometryById),
    [layouted?.edgeRoutesById, layoutedEdges, nodeGeometryById],
  );
  const edgeDiagnostics = useMemo(
    () =>
      buildAttackGraphEdgeDiagnostics(
        layoutedEdges,
        edgeRoutesById,
        nodeGeometryById,
      ),
    [edgeRoutesById, layoutedEdges, nodeGeometryById],
  );
  const edgeDiagnosticsText = useMemo(
    () => formatEdgeDiagnostics(edgeDiagnostics),
    [edgeDiagnostics],
  );
  const topologyDiagnosticsText = useMemo(
    () =>
      layouted?.topologyDiagnostics
        ? formatTopologyDiagnostics(layouted.topologyDiagnostics)
        : "pending",
    [layouted?.topologyDiagnostics],
  );

  useEffect(() => {
    if (!layouted) {
      return;
    }

    onDiagnosticsChange?.({
      edgeCount: layoutedEdges.length,
      edgeDiagnostics,
      edgeDiagnosticsText,
      graphHeight: layouted.height,
      graphWidth: layouted.width,
      layoutMode: layouted.layoutMode,
      layoutStrategy: layouted.layoutStrategy,
      nodeCount: layoutedNodes.length,
      topologyDiagnostics: layouted.topologyDiagnostics,
      topologyDiagnosticsText,
      topologyKind: layouted.topologyKind,
    });
  }, [
    edgeDiagnostics,
    edgeDiagnosticsText,
    layouted,
    layoutedEdges.length,
    layoutedNodes.length,
    onDiagnosticsChange,
    topologyDiagnosticsText,
  ]);

  const edges = useMemo(
    () =>
      toReactFlowEdges(layoutedEdges, {
        edgeRoutesById,
        hoveredEdgeId,
        nodeGeometryById,
        nodeColorsById,
        selectedEdgeId,
      }),
    [
      edgeRoutesById,
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
    <div className={cn("relative h-full min-h-[420px] w-full bg-transparent", className)}>
      <TooltipProvider delayDuration={180}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView={fitView}
          minZoom={minZoom}
          maxZoom={maxZoom}
          panOnDrag
          panOnScroll={false}
          preventScrolling={false}
          zoomOnPinch={false}
          zoomOnScroll={false}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          onInit={(instance) => { rfInstanceRef.current = instance }}
          style={{ background: "transparent" }}
          onEdgeClick={handleEdgeClick}
          onEdgeMouseEnter={handleEdgeMouseEnter}
          onEdgeMouseLeave={handleEdgeMouseLeave}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          data-attack-graph-flow="true"
          data-attack-graph-edge-diagnostics={edgeDiagnosticsText}
          data-attack-graph-layout-strategy={layouted?.layoutStrategy ?? "pending"}
          data-attack-graph-topology-diagnostics={topologyDiagnosticsText}
          data-attack-graph-topology={layouted?.topologyKind ?? "pending"}
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
      type: "attackGraphNode",
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
    edgeRoutesById: Map<string, AttackGraphEdgeRouteData>;
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
    const route = getEdgeRoute(edge, options.edgeRoutesById);

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: "attackGraphEdge",
      ariaLabel: visual.tooltip,
      data: {
        edge,
        interactionState,
        sourceColor: options.nodeColorsById.get(edge.source) ?? state.color,
        targetColor: options.nodeColorsById.get(edge.target) ?? state.color,
        geometry:
          sourceGeometry && targetGeometry
            ? {
                route,
                source: sourceGeometry,
                target: targetGeometry,
                obstacle:
                  route.kind === "skip"
                    ? options.nodeGeometryById.get(route.obstacleId)
                    : undefined,
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

function createEmptyLayoutSession(
  caseId: string,
  strategy: AttackGraphLayoutStrategy,
): AttackGraphLayoutSession {
  return {
    caseId,
    mode: "tiny",
    newNodeIds: new Set(),
    nodePositionsById: new Map(),
    anchorNodeId: undefined,
    strategy,
  };
}

function formatTopologyDiagnostics(
  diagnostics: NonNullable<AttackGraphLayoutResult["topologyDiagnostics"]>,
) {
  return [
    `nodes=${diagnostics.nodeCount}`,
    `edges=${diagnostics.edgeCount}`,
    `relation=${diagnostics.relationEdgeCount}`,
    `selfLoop=${diagnostics.selfLoopCount}`,
    `roots=${diagnostics.rootCount}`,
    `sinks=${diagnostics.sinkCount}`,
    `maxIn=${diagnostics.maxInDegree}`,
    `maxOut=${diagnostics.maxOutDegree}`,
    `multiPair=${diagnostics.multiEdgePairCount}`,
    `treeDelta=${diagnostics.treeEdgeDelta}`,
    `cyclic=${diagnostics.cyclic ? 1 : 0}`,
  ].join(";");
}

function formatEdgeDiagnostics(
  diagnostics: NonNullable<AttackGraphLayoutResult["edgeDiagnostics"]>,
) {
  return [
    `edges=${diagnostics.edgeCount}`,
    `relation=${diagnostics.relationEdgeCount}`,
    `selfLoop=${diagnostics.selfLoopEdgeCount}`,
    `skip=${diagnostics.skipEdgeCount}`,
    `detour=${diagnostics.detourEdgeCount}`,
    `blocked=${diagnostics.blockedEdgeCount}`,
    `maxBlocked=${diagnostics.maxBlockedNodeCount}`,
    `crossing=${diagnostics.crossingPairCount}`,
    `suspect=${diagnostics.suspiciousEdgeIds.length}`,
  ].join(";");
}

export default AttackGraphFlow;
