import type {
  AttackGraphEdgeModel,
  AttackGraphLayoutLaneBounds,
  AttackGraphLayoutSession,
  AttackGraphModel,
  AttackGraphNodeModel,
  AttackGraphPoint,
} from "./attack-graph-data";
import type { AttackGraphNodePresentationKind } from "./attack-graph-node-types";

export interface AttackGraphStableLayoutOptions {
  nodeHeight: number;
  nodeWidth: number;
  session?: AttackGraphLayoutSession | null;
}

export interface AttackGraphStableLayoutResult {
  activeLaneIds: string[];
  laneBoundsById: Map<string, AttackGraphLayoutLaneBounds>;
  nodeLaneIdById: Map<string, string>;
  nodes: AttackGraphNodeModel[];
  stableCenterNodeId?: string;
}

interface StableNodeScore {
  degree: number;
  distinctNeighborCount: number;
  evidenceBoost: number;
  processBoost: number;
  processRelationDegree: number;
  relationPriority: number;
  score: number;
}

const STABLE_LANE_ID = "stable";
const PROCESS_KINDS = new Set<AttackGraphNodePresentationKind>([
  "process",
  "powershell",
  "service",
  "task",
]);
const CENTER_SWITCH_SCORE_RATIO = 1.35;

export function processStableLayout(
  layoutResult: AttackGraphModel & {
    edges: AttackGraphEdgeModel[];
    nodes: AttackGraphNodeModel[];
  },
  options: AttackGraphStableLayoutOptions,
): AttackGraphStableLayoutResult {
  const nodes = layoutResult.nodes;
  if (nodes.length === 0) {
    return createEmptyStableLayout();
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const scoreByNodeId = computeStableNodeScores(layoutResult.edges, nodeById);
  const centerNodeId = chooseStableCenterNodeId({
    nodes,
    previousCenterNodeId: options.session?.stableCenterNodeId,
    scoreByNodeId,
  });
  const elkNodes = normalizeNodePositions(nodes);
  const centeredNodes = keepCenterPositionStable({
    centerNodeId,
    nodes: elkNodes,
    session: options.session,
  });
  const bounds = computeStableBounds(centeredNodes, options);

  return {
    activeLaneIds: [STABLE_LANE_ID],
    laneBoundsById: new Map([
      [
        STABLE_LANE_ID,
        {
          height: bounds.height,
          y: 0,
        },
      ],
    ]),
    nodeLaneIdById: new Map(
      centeredNodes.map((node) => [node.id, STABLE_LANE_ID]),
    ),
    nodes: centeredNodes,
    stableCenterNodeId: centerNodeId,
  };
}

function createEmptyStableLayout(): AttackGraphStableLayoutResult {
  return {
    activeLaneIds: [],
    laneBoundsById: new Map(),
    nodeLaneIdById: new Map(),
    nodes: [],
  };
}

function computeStableNodeScores(
  edges: AttackGraphEdgeModel[],
  nodeById: Map<string, AttackGraphNodeModel>,
) {
  const scoreByNodeId = new Map<string, StableNodeScore>();
  const neighborIdsByNodeId = new Map<string, Set<string>>();

  for (const node of nodeById.values()) {
    scoreByNodeId.set(node.id, createEmptyScore(node));
    neighborIdsByNodeId.set(node.id, new Set());
  }

  for (const edge of edges) {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (!source || !target) {
      continue;
    }

    neighborIdsByNodeId.get(source.id)?.add(target.id);
    neighborIdsByNodeId.get(target.id)?.add(source.id);
    applyEdgeScore(scoreByNodeId, source.id, edge, source, target);
    applyEdgeScore(scoreByNodeId, target.id, edge, target, source);
  }

  for (const [nodeId, score] of scoreByNodeId) {
    score.distinctNeighborCount = neighborIdsByNodeId.get(nodeId)?.size ?? 0;
    score.score =
      score.processRelationDegree * 2.5 +
      score.distinctNeighborCount * 1.8 +
      score.degree +
      score.evidenceBoost +
      score.processBoost +
      score.relationPriority;
    scoreByNodeId.set(nodeId, score);
  }

  return scoreByNodeId;
}

function applyEdgeScore(
  scoreByNodeId: Map<string, StableNodeScore>,
  nodeId: string,
  edge: AttackGraphEdgeModel,
  node: AttackGraphNodeModel,
  otherNode: AttackGraphNodeModel,
) {
  const score = scoreByNodeId.get(nodeId);
  if (!score) {
    return;
  }

  score.degree += 1;
  score.relationPriority += getStableRelationPriority(edge);
  if (isProcessNode(node) || isProcessNode(otherNode)) {
    score.processRelationDegree += 1;
  }
}

function getStableRelationPriority(edge: AttackGraphEdgeModel) {
  if (edge.edgeKind === "process-execution") {
    return 4;
  }
  if (edge.edgeKind === "process-access") {
    return 3;
  }
  if (
    edge.edgeKind === "file-activity" ||
    edge.edgeKind === "registry-activity" ||
    edge.edgeKind === "network-activity"
  ) {
    return 2;
  }
  if (
    edge.edgeKind === "account-activity" ||
    edge.edgeKind === "security-impact" ||
    edge.edgeKind === "persistence"
  ) {
    return 2;
  }
  return 1;
}

function chooseStableCenterNodeId({
  nodes,
  previousCenterNodeId,
  scoreByNodeId,
}: {
  nodes: AttackGraphNodeModel[];
  previousCenterNodeId?: string;
  scoreByNodeId: Map<string, StableNodeScore>;
}) {
  const sortedCandidates = [...nodes].sort((left, right) =>
    compareStableCenterCandidates(left, right, scoreByNodeId),
  );
  const bestCandidate = sortedCandidates[0];
  if (!bestCandidate) {
    return undefined;
  }

  const previousCenter = previousCenterNodeId
    ? nodes.find((node) => node.id === previousCenterNodeId)
    : undefined;
  if (!previousCenter) {
    return bestCandidate.id;
  }

  const bestScore = scoreByNodeId.get(bestCandidate.id)?.score ?? 0;
  const previousScore = scoreByNodeId.get(previousCenter.id)?.score ?? 0;

  if (
    bestCandidate.id !== previousCenter.id &&
    bestScore >= previousScore * CENTER_SWITCH_SCORE_RATIO
  ) {
    return bestCandidate.id;
  }

  return previousCenter.id;
}

function compareStableCenterCandidates(
  left: AttackGraphNodeModel,
  right: AttackGraphNodeModel,
  scoreByNodeId: Map<string, StableNodeScore>,
) {
  const leftScore = scoreByNodeId.get(left.id) ?? createEmptyScore(left);
  const rightScore = scoreByNodeId.get(right.id) ?? createEmptyScore(right);

  return (
    rightScore.score - leftScore.score ||
    Number(isProcessNode(right)) - Number(isProcessNode(left)) ||
    rightScore.distinctNeighborCount - leftScore.distinctNeighborCount ||
    rightScore.degree - leftScore.degree ||
    left.displayName.localeCompare(right.displayName) ||
    left.id.localeCompare(right.id)
  );
}

function keepCenterPositionStable({
  centerNodeId,
  nodes,
  session,
}: {
  centerNodeId?: string;
  nodes: AttackGraphNodeModel[];
  session?: AttackGraphLayoutSession | null;
}) {
  if (!centerNodeId || session?.strategy !== "stable") {
    return nodes;
  }

  const centerNode = nodes.find((node) => node.id === centerNodeId);
  const previousCenterPosition = session.nodePositionsById.get(centerNodeId);
  if (!centerNode?.position || !previousCenterPosition) {
    return nodes;
  }

  const offset = {
    x: previousCenterPosition.x - centerNode.position.x,
    y: previousCenterPosition.y - centerNode.position.y,
  };

  if (Math.abs(offset.x) < 1 && Math.abs(offset.y) < 1) {
    return nodes;
  }

  return nodes.map((node) => ({
    ...node,
    position: {
      x: (node.position?.x ?? 0) + offset.x,
      y: (node.position?.y ?? 0) + offset.y,
    },
  }));
}

function normalizeNodePositions(nodes: AttackGraphNodeModel[]) {
  if (nodes.length === 0) {
    return nodes;
  }

  const minX = Math.min(...nodes.map((node) => node.position?.x ?? 0));
  const minY = Math.min(...nodes.map((node) => node.position?.y ?? 0));

  return nodes.map((node) => ({
    ...node,
    position: {
      x: (node.position?.x ?? 0) - minX,
      y: (node.position?.y ?? 0) - minY,
    } as AttackGraphPoint,
  }));
}

function computeStableBounds(
  nodes: AttackGraphNodeModel[],
  options: AttackGraphStableLayoutOptions,
) {
  if (nodes.length === 0) {
    return { height: 0, width: 0 };
  }

  const minX = Math.min(...nodes.map((node) => node.position?.x ?? 0));
  const minY = Math.min(...nodes.map((node) => node.position?.y ?? 0));
  const maxX = Math.max(
    ...nodes.map((node) => (node.position?.x ?? 0) + options.nodeWidth),
  );
  const maxY = Math.max(
    ...nodes.map((node) => (node.position?.y ?? 0) + options.nodeHeight),
  );

  return {
    height: maxY - minY,
    width: maxX - minX,
  };
}

function createEmptyScore(node: AttackGraphNodeModel): StableNodeScore {
  return {
    degree: 0,
    distinctNeighborCount: 0,
    evidenceBoost: node.evidenceHit ? 3 : 0,
    processBoost: isProcessNode(node) ? 4 : 0,
    processRelationDegree: 0,
    relationPriority: 0,
    score: node.evidenceHit ? 3 : 0,
  };
}

function isProcessNode(node: AttackGraphNodeModel) {
  return PROCESS_KINDS.has(node.presentationKind);
}
