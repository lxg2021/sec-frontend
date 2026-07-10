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
  type NodeChange,
  type NodeTypes,
  type ReactFlowInstance,
  type ReactFlowProps,
} from "reactflow";
import "reactflow/dist/style.css";

import { cn } from "@/shared/lib/utils";
import { TooltipProvider } from "@/shared/ui/tooltip";

import { buildAttackGraphModel } from "../model/core/attack-graph-adapter";
import type {
  AttackGraphEdgeModel,
  AttackGraphLayoutResult,
  AttackGraphLayoutSession,
  AttackGraphLayoutOptions,
  AttackGraphLayoutStrategy,
  AttackGraphNodeModel,
  GraphCaseResponseDto,
} from "../model/core/attack-graph-data";
import {
  toAttackGraphEdgeVisualData,
  type AttackGraphEdgeInteractionState,
  type AttackGraphEdgeVisualData,
} from "../model/edge/attack-graph-edge-config";
import { buildAttackGraphEdgeDiagnostics } from "../model/edge/attack-graph-edge-diagnostics";
import {
  buildAttackGraphEdgeRoutes,
  type AttackGraphEdgeRouteData,
  type AttackGraphNodeEdgeGeometry,
} from "../model/edge/attack-graph-edge-routing";
import { layoutAttackGraph } from "../model/layout/attack-graph-layout";
import { createCommonAttackGraphNodeMenuProvider } from "../model/menu/attack-graph-menu-config";
import { resolveAttackGraphNodeMenu } from "../model/menu/attack-graph-menu-resolver";
import type {
  AttackGraphIocCandidateSyncState,
  AttackGraphMenuAction,
  AttackGraphNodeDrillStateByKey,
  AttackGraphMenuProvider,
} from "../model/menu/attack-graph-menu-types";
import {
  ATTACK_GRAPH_NODE_FAMILY_CONFIG,
  getAttackGraphEntityNodeDisplayName,
  getAttackGraphNodeKindConfig,
  getAttackGraphNodeMergedStateConfig,
  getAttackGraphNodeSize,
  toAttackGraphNodeVisualData,
} from "../model/node/attack-graph-node-config";
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
import {
  AttackGraphContextMenu,
  type AttackGraphContextMenuState,
} from "./attack-graph-context-menu";
import {
  AttackGraphDetailCard,
  type AttackGraphDetailCardItem,
} from "./attack-graph-detail-card";

export interface AttackGraphFlowProps
  extends Omit<ReactFlowProps, "nodes" | "edges" | "nodeTypes" | "edgeTypes"> {
  controlPanel?: ReactNode;
  focusNodeRequest?: AttackGraphNodeFocusRequest | null;
  response: GraphCaseResponseDto;
  className?: string;
  enableIocMenu?: boolean;
  enableRemediationMenu?: boolean;
  iocCandidateIdentityKeys?: ReadonlySet<string>;
  iocCandidateUserSourceKeys?: ReadonlySet<string>;
  iocCandidateSyncState?: AttackGraphIocCandidateSyncState;
  layoutOptions?: AttackGraphLayoutOptions;
  menuProviders?: AttackGraphMenuProvider[];
  nodeDrillStateByKey?: AttackGraphNodeDrillStateByKey;
  onDiagnosticsChange?: (diagnostics: AttackGraphFlowDiagnostics) => void;
  onMenuAction?: (action: AttackGraphMenuAction) => void | Promise<void>;
  positionResetKey?: number | string;
  remediationTargetKeys?: ReadonlySet<string>;
  showMiniMap?: boolean;
  showBackground?: boolean;
}

export interface AttackGraphNodeFocusRequest {
  nodeId: string;
  requestId: number;
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

type AttackGraphNodePosition = { x: number; y: number };
type ManualNodePositionsByStrategy = Record<
  AttackGraphLayoutStrategy,
  Map<string, AttackGraphNodePosition>
>;

const ATTACK_GRAPH_MANUAL_POSITION_STRATEGIES: AttackGraphLayoutStrategy[] = [
  "layered",
  "stress",
];
const EMPTY_ATTACK_GRAPH_NODES: AttackGraphNodeModel[] = [];
const EMPTY_ATTACK_GRAPH_EDGES: AttackGraphEdgeModel[] = [];
const EMPTY_MANUAL_NODE_POSITIONS = new Map<string, AttackGraphNodePosition>();

function createManualNodePositionsByStrategy(): ManualNodePositionsByStrategy {
  return {
    layered: new Map(),
    stress: new Map(),
  };
}

export function AttackGraphFlow({
  controlPanel,
  focusNodeRequest,
  response,
  className,
  enableIocMenu = false,
  enableRemediationMenu = false,
  iocCandidateIdentityKeys,
  iocCandidateUserSourceKeys,
  iocCandidateSyncState,
  layoutOptions,
  menuProviders,
  nodeDrillStateByKey,
  onDiagnosticsChange,
  onMenuAction,
  positionResetKey,
  remediationTargetKeys,
  showMiniMap = false,
  showBackground = true,
  fitView = false,
  minZoom = 1,
  maxZoom = 1,
  onEdgeClick,
  onEdgeMouseEnter,
  onEdgeMouseLeave,
  onNodeClick,
  onNodeContextMenu,
  onNodeDragStop,
  onNodesChange,
  onPaneClick,
  ...reactFlowProps
}: AttackGraphFlowProps) {
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [flowContainerWidth, setFlowContainerWidth] = useState(0);
  const [contextMenu, setContextMenu] =
    useState<AttackGraphContextMenuState | null>(null);
  const [layouted, setLayouted] = useState<AttackGraphLayoutResult | null>(null);
  const [manualNodePositionsByStrategy, setManualNodePositionsByStrategy] =
    useState<ManualNodePositionsByStrategy>(
      createManualNodePositionsByStrategy,
    );
  const layoutSessionsByStrategyRef = useRef<
    Partial<Record<AttackGraphLayoutStrategy, AttackGraphLayoutSession>>
  >({});
  const lastLayoutStrategyRef = useRef<AttackGraphLayoutStrategy | null>(null);
  const previousCaseIdRef = useRef<string>("");
  const flowContainerRef = useRef<HTMLDivElement | null>(null);
  const rfInstanceRef = useRef<ReactFlowInstance | null>(null);
  const lastFocusRequestIdRef = useRef<number | null>(null);
  const focusHighlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const hasFittedRef = useRef(false);
  const lastPositionResetKeyRef = useRef(positionResetKey);

  useEffect(() => {
    const element = flowContainerRef.current;
    if (!element) return;

    const updateWidth = () => setFlowContainerWidth(element.clientWidth);
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

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
    setLayouted(null);
    if (caseChanged) {
      setManualNodePositionsByStrategy(createManualNodePositionsByStrategy());
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

  const layoutedNodes = layouted?.nodes ?? EMPTY_ATTACK_GRAPH_NODES;
  const layoutedEdges = layouted?.edges ?? EMPTY_ATTACK_GRAPH_EDGES;
  const currentLayoutStrategy = layouted?.layoutStrategy ?? null;
  const currentManualNodePositions =
    currentLayoutStrategy !== null
      ? manualNodePositionsByStrategy[currentLayoutStrategy]
      : EMPTY_MANUAL_NODE_POSITIONS;
  const layoutedNodesById = useMemo(
    () => new Map(layoutedNodes.map((node) => [node.id, node])),
    [layoutedNodes],
  );
  const layoutedEdgesById = useMemo(
    () => new Map(layoutedEdges.map((edge) => [edge.id, edge])),
    [layoutedEdges],
  );
  const nodeMenuProviders = useMemo(
    () => [
      createCommonAttackGraphNodeMenuProvider({
        drillStateByNodeKey: nodeDrillStateByKey,
        enableIocMenu,
        enableRemediationMenu,
        iocCandidateIdentityKeys,
        iocCandidateUserSourceKeys,
        iocCandidateSyncState,
        onMenuAction,
        remediationTargetKeys,
      }),
      ...(menuProviders ?? []),
    ],
    [
      enableIocMenu,
      enableRemediationMenu,
      iocCandidateIdentityKeys,
      iocCandidateUserSourceKeys,
      iocCandidateSyncState,
      menuProviders,
      nodeDrillStateByKey,
      onMenuAction,
      remediationTargetKeys,
    ],
  );

  const flowNodes = useMemo(
    () =>
      toReactFlowNodes(
        layoutedNodes,
        currentManualNodePositions,
        selectedNodeId,
        focusedNodeId,
      ),
    [
      layoutedNodes,
      currentManualNodePositions,
      focusedNodeId,
      selectedNodeId,
    ],
  );

  useEffect(() => {
    if (
      !focusNodeRequest ||
      focusNodeRequest.requestId === lastFocusRequestIdRef.current ||
      !rfInstanceRef.current
    ) {
      return;
    }

    const targetNode = flowNodes.find(
      (node) => node.id === focusNodeRequest.nodeId,
    );
    if (!targetNode) return;

    lastFocusRequestIdRef.current = focusNodeRequest.requestId;
    setFocusedNodeId(targetNode.id);
    setContextMenu(null);

    const nodeWidth = targetNode.width ?? ATTACK_GRAPH_NODE_TILE_WIDTH;
    const nodeHeight = targetNode.height ?? ATTACK_GRAPH_DEFAULT_NODE_HEIGHT;
    void rfInstanceRef.current.setCenter(
      targetNode.position.x + nodeWidth / 2,
      targetNode.position.y + nodeHeight / 2,
      {
        duration: 320,
        zoom: rfInstanceRef.current.getZoom(),
      },
    );

    if (focusHighlightTimerRef.current) {
      clearTimeout(focusHighlightTimerRef.current);
    }
    focusHighlightTimerRef.current = setTimeout(() => {
      setFocusedNodeId((current) =>
        current === targetNode.id ? null : current,
      );
      focusHighlightTimerRef.current = null;
    }, 1800);
  }, [flowNodes, focusNodeRequest]);

  useEffect(
    () => () => {
      if (focusHighlightTimerRef.current) {
        clearTimeout(focusHighlightTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (
      selectedNodeId &&
      !layoutedNodes.some((node) => node.id === selectedNodeId)
    ) {
      setSelectedNodeId(null);
    }
  }, [layoutedNodes, selectedNodeId]);

  useEffect(() => {
    if (
      selectedEdgeId &&
      !layoutedEdges.some((edge) => edge.id === selectedEdgeId)
    ) {
      setSelectedEdgeId(null);
    }
  }, [layoutedEdges, selectedEdgeId]);

  useEffect(() => {
    setManualNodePositionsByStrategy((currentByStrategy) => {
      const nodeIds = new Set(layoutedNodes.map((node) => node.id));
      let strategyChanged = false;
      const nextByStrategy: Partial<ManualNodePositionsByStrategy> = {};

      for (const strategy of ATTACK_GRAPH_MANUAL_POSITION_STRATEGIES) {
        const currentPositions = currentByStrategy[strategy];
        if (currentPositions.size === 0) {
          nextByStrategy[strategy] = currentPositions;
          continue;
        }

        let changed = false;
        const nextPositions = new Map<string, AttackGraphNodePosition>();
        for (const [nodeId, position] of currentPositions) {
          if (nodeIds.has(nodeId)) {
            nextPositions.set(nodeId, position);
          } else {
            changed = true;
          }
        }

        strategyChanged ||= changed;
        nextByStrategy[strategy] = changed ? nextPositions : currentPositions;
      }

      return strategyChanged
        ? (nextByStrategy as ManualNodePositionsByStrategy)
        : currentByStrategy;
    });
  }, [layoutedNodes]);

  useEffect(() => {
    if (
      !currentLayoutStrategy ||
      lastPositionResetKeyRef.current === positionResetKey
    ) {
      return;
    }

    lastPositionResetKeyRef.current = positionResetKey;
    setManualNodePositionsByStrategy((currentByStrategy) => {
      const currentPositions = currentByStrategy[currentLayoutStrategy];
      if (currentPositions.size === 0) {
        return currentByStrategy;
      }

      return {
        ...currentByStrategy,
        [currentLayoutStrategy]: new Map(),
      };
    });
  }, [currentLayoutStrategy, positionResetKey]);

  useEffect(() => {
    if (
      fitView &&
      flowNodes.length > 0 &&
      rfInstanceRef.current &&
      !hasFittedRef.current
    ) {
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
  }, [fitView, flowNodes]);

  const nodeColorsById = useMemo(() => {
    return new Map(flowNodes.map((node) => [node.id, node.data.color]));
  }, [flowNodes]);

  const nodeGeometryById = useMemo(() => {
    return buildNodeGeometryById(flowNodes);
  }, [flowNodes]);

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

  const detailCardItem = useMemo<AttackGraphDetailCardItem | null>(() => {
    if (selectedNodeId) {
      const node = layoutedNodesById.get(selectedNodeId);
      return node ? { kind: "node", node } : null;
    }

    if (selectedEdgeId) {
      const edge = layoutedEdgesById.get(selectedEdgeId);
      return edge ? { kind: "edge", edge } : null;
    }

    return null;
  }, [layoutedEdgesById, layoutedNodesById, selectedEdgeId, selectedNodeId]);

  const handleSelectionDetailClose = useCallback(() => {
    setSelectedEdgeId(null);
    setSelectedNodeId(null);
  }, []);

  const handleEdgeClick = useCallback<
    NonNullable<ReactFlowProps["onEdgeClick"]>
  >(
    (event, edge) => {
      setSelectedEdgeId((current) => (current === edge.id ? null : edge.id));
      setSelectedNodeId(null);
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
      setContextMenu(null);
      setSelectedEdgeId(null);
      setSelectedNodeId(node.id);
      onNodeClick?.(event, node);
    },
    [onNodeClick],
  );

  const handlePaneClick = useCallback<
    NonNullable<ReactFlowProps["onPaneClick"]>
  >(
    (event) => {
      setContextMenu(null);
      setSelectedEdgeId(null);
      setSelectedNodeId(null);
      onPaneClick?.(event);
    },
    [onPaneClick],
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const selectedNodeChange = getSelectedNodeChange(changes);
      if (selectedNodeChange !== undefined) {
        setSelectedNodeId(selectedNodeChange);
      }

      const positionChanges = getNodePositionChanges(changes);
      if (currentLayoutStrategy && positionChanges.size > 0) {
        setManualNodePositionsByStrategy((currentByStrategy) => {
          const nextPositions = new Map(
            currentByStrategy[currentLayoutStrategy],
          );
          for (const [nodeId, position] of positionChanges) {
            nextPositions.set(nodeId, position);
          }
          return {
            ...currentByStrategy,
            [currentLayoutStrategy]: nextPositions,
          };
        });
      }

      onNodesChange?.(changes);
    },
    [currentLayoutStrategy, onNodesChange],
  );

  const handleNodeDragStop = useCallback<
    NonNullable<ReactFlowProps["onNodeDragStop"]>
  >(
    (event, node, nodes) => {
      if (!currentLayoutStrategy) {
        onNodeDragStop?.(event, node, nodes);
        return;
      }

      setManualNodePositionsByStrategy((currentByStrategy) => {
        const nextPositions = new Map(
          currentByStrategy[currentLayoutStrategy],
        );
        nextPositions.set(node.id, { ...node.position });
        return {
          ...currentByStrategy,
          [currentLayoutStrategy]: nextPositions,
        };
      });
      onNodeDragStop?.(event, node, nodes);
    },
    [currentLayoutStrategy, onNodeDragStop],
  );

  const handleNodeContextMenu = useCallback<
    NonNullable<ReactFlowProps["onNodeContextMenu"]>
  >(
    (event, node) => {
      event.preventDefault();
      onNodeContextMenu?.(event, node);

      const graphNode = layoutedNodesById.get(node.id);
      if (!layouted || !graphNode) {
        setContextMenu(null);
        return;
      }

      const context = {
        graph: layouted,
        node: graphNode,
      };
      void resolveAttackGraphNodeMenu({
        context,
        providers: nodeMenuProviders,
      }).then((groups) => {
        if (groups.length === 0) {
          setContextMenu(null);
          return;
        }

        setContextMenu({
          context,
          groups,
          x: event.clientX,
          y: event.clientY,
        });
      });
    },
    [layouted, layoutedNodesById, nodeMenuProviders, onNodeContextMenu],
  );

  return (
    <div
      ref={flowContainerRef}
      className={cn("relative h-full min-h-[420px] w-full bg-transparent", className)}
    >
      <TooltipProvider delayDuration={180}>
        {layouted ? (
          <>
            <ReactFlow
              nodes={flowNodes}
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
              nodesDraggable
              nodesConnectable={false}
              elementsSelectable
              onInit={(instance) => { rfInstanceRef.current = instance }}
              onNodesChange={handleNodesChange}
              onNodeDragStop={handleNodeDragStop}
              style={{ background: "transparent" }}
              onEdgeClick={handleEdgeClick}
              onEdgeMouseEnter={handleEdgeMouseEnter}
              onEdgeMouseLeave={handleEdgeMouseLeave}
              onNodeClick={handleNodeClick}
              onNodeContextMenu={handleNodeContextMenu}
              onPaneClick={handlePaneClick}
              data-attack-graph-flow="true"
              data-attack-graph-edge-diagnostics={edgeDiagnosticsText}
              data-attack-graph-layout-strategy={layouted.layoutStrategy}
              data-attack-graph-topology-diagnostics={topologyDiagnosticsText}
              data-attack-graph-topology={layouted.topologyKind ?? "pending"}
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
            <AttackGraphContextMenu
              menu={contextMenu}
              onClose={() => setContextMenu(null)}
            />
            {controlPanel &&
            flowContainerWidth >= 640 &&
            !(detailCardItem && flowContainerWidth < 1200) ? (
              <div
                className={cn(
                  "pointer-events-none absolute bottom-5 left-5 z-10 transition-[right] duration-200 motion-reduce:transition-none",
                  detailCardItem ? "right-[700px]" : "right-5",
                )}
                data-attack-graph-control-panel-host="true"
              >
                {controlPanel}
              </div>
            ) : null}
            <AttackGraphDetailCard
              item={detailCardItem}
              nodesById={layoutedNodesById}
              onClose={handleSelectionDetailClose}
            />
          </>
        ) : (
          <AttackGraphLayoutLoadingState showBackground={showBackground} />
        )}
      </TooltipProvider>
    </div>
  );
}

function toReactFlowNodes(
  nodes: AttackGraphNodeModel[],
  manualNodePositionsById: Map<string, AttackGraphNodePosition> =
    EMPTY_MANUAL_NODE_POSITIONS,
  selectedNodeId: string | null = null,
  focusedNodeId: string | null = null,
): ReactFlowNode<AttackGraphNodeData>[] {
  return nodes.map((node) => {
    const data = toNodeVisualItem(node);
    const height = getAttackGraphNodeVisualHeight(data.size);
    const manualPosition = manualNodePositionsById.get(node.id);

    return {
      id: node.id,
      type: "attackGraphNode",
      position: manualPosition ?? node.position ?? { x: 0, y: 0 },
      data,
      selected: node.id === selectedNodeId || node.id === focusedNodeId,
      width: ATTACK_GRAPH_NODE_TILE_WIDTH,
      height,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
  });
}

function getSelectedNodeChange(changes: NodeChange[]) {
  let selectedNodeId: string | null | undefined;

  for (const change of changes) {
    if (change.type !== "select") {
      continue;
    }
    if (change.selected) {
      selectedNodeId = change.id;
    } else if (selectedNodeId === undefined) {
      selectedNodeId = null;
    }
  }

  return selectedNodeId;
}

function getNodePositionChanges(changes: NodeChange[]) {
  const positionChanges = new Map<string, AttackGraphNodePosition>();

  for (const change of changes) {
    if (change.type === "position" && change.position) {
      positionChanges.set(change.id, { ...change.position });
    }
  }

  return positionChanges;
}

function AttackGraphLayoutLoadingState({
  showBackground,
}: {
  showBackground: boolean;
}) {
  return (
    <div
      className="relative flex h-full min-h-[420px] w-full items-center justify-center overflow-hidden bg-transparent"
      data-attack-graph-flow="layouting"
    >
      {showBackground ? (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.35)_1px,transparent_0)] bg-[length:24px_24px]" />
      ) : null}
      <div className="relative rounded-md border border-slate-200 bg-white/80 px-3 py-2 text-xs font-medium text-slate-500 shadow-sm">
        Layouting graph...
      </div>
    </div>
  );
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
    evidenceHit: Boolean(node.evidenceHit),
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
