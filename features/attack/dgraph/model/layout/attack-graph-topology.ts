import type {
  AttackGraphEdgeModel,
  AttackGraphModel,
  AttackGraphTopologyDiagnostics,
} from "../core/attack-graph-data";

export type AttackGraphTopology =
  | {
      diagnostics: AttackGraphTopologyDiagnostics;
      kind: "linear-chain";
      nodeIds: string[];
    }
  | {
      diagnostics: AttackGraphTopologyDiagnostics;
      kind: "single-source-fanout";
      sourceId: string;
      targetIds: string[];
    }
  | {
      diagnostics: AttackGraphTopologyDiagnostics;
      kind: "multi-source-fanin";
      sourceIds: string[];
      targetId: string;
    }
  | {
      diagnostics: AttackGraphTopologyDiagnostics;
      kind: "tree";
      rootId: string;
      childrenByNodeId: Map<string, string[]>;
    }
  | {
      diagnostics: AttackGraphTopologyDiagnostics;
      kind: "complex";
    };

type ClassifiedAttackGraphTopology =
  | {
      kind: "linear-chain";
      nodeIds: string[];
    }
  | {
      kind: "single-source-fanout";
      sourceId: string;
      targetIds: string[];
    }
  | {
      kind: "multi-source-fanin";
      sourceIds: string[];
      targetId: string;
    }
  | {
      kind: "tree";
      rootId: string;
      childrenByNodeId: Map<string, string[]>;
    };

export function classifyAttackGraphTopology(
  graph: AttackGraphModel,
): AttackGraphTopology {
  const relationEdges = graph.edges.filter((edge) => edge.source !== edge.target);
  const diagnostics = buildAttackGraphTopologyDiagnostics(graph, relationEdges);

  if (relationEdges.length > 0) {
    const chain = classifyLinearChain(graph, relationEdges);
    if (chain) {
      return { ...chain, diagnostics };
    }
    const fanout = classifySingleSourceFanout(graph, relationEdges);
    if (fanout) {
      return { ...fanout, diagnostics };
    }
    const fanin = classifyMultiSourceFanin(graph, relationEdges);
    if (fanin) {
      return { ...fanin, diagnostics };
    }
    const tree = classifyTree(graph, relationEdges);
    if (tree) {
      return { ...tree, diagnostics };
    }
  }

  return { diagnostics, kind: "complex" };
}

export function buildAttackGraphTopologyDiagnostics(
  graph: AttackGraphModel,
  relationEdges = graph.edges.filter((edge) => edge.source !== edge.target),
): AttackGraphTopologyDiagnostics {
  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  const incomingByNodeId = new Map<string, number>();
  const outgoingByNodeId = new Map<string, number>();
  const edgePairCounts = new Map<string, number>();

  for (const nodeId of nodeIds) {
    incomingByNodeId.set(nodeId, 0);
    outgoingByNodeId.set(nodeId, 0);
  }

  for (const edge of relationEdges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      continue;
    }
    incomingByNodeId.set(edge.target, (incomingByNodeId.get(edge.target) ?? 0) + 1);
    outgoingByNodeId.set(edge.source, (outgoingByNodeId.get(edge.source) ?? 0) + 1);

    const pairKey = `${edge.source}->${edge.target}`;
    edgePairCounts.set(pairKey, (edgePairCounts.get(pairKey) ?? 0) + 1);
  }

  const inDegrees = [...incomingByNodeId.values()];
  const outDegrees = [...outgoingByNodeId.values()];
  const zeroInDegreeCount = inDegrees.filter((degree) => degree === 0).length;
  const zeroOutDegreeCount = outDegrees.filter((degree) => degree === 0).length;
  const { backEdgeCount, cyclic } = detectDirectedCycles(graph, relationEdges);
  const multiEdgePairCount = [...edgePairCounts.values()].filter(
    (count) => count > 1,
  ).length;

  return {
    backEdgeCount,
    cyclic,
    duplicatePairCount: multiEdgePairCount,
    edgeCount: graph.edges.length,
    maxInDegree: Math.max(0, ...inDegrees),
    maxOutDegree: Math.max(0, ...outDegrees),
    multiEdgePairCount,
    nodeCount: graph.nodes.length,
    relationEdgeCount: relationEdges.length,
    rootCount: zeroInDegreeCount,
    selfLoopCount: graph.edges.length - relationEdges.length,
    sinkCount: zeroOutDegreeCount,
    treeEdgeDelta: relationEdges.length - Math.max(0, graph.nodes.length - 1),
    zeroInDegreeCount,
    zeroOutDegreeCount,
  };
}

function detectDirectedCycles(
  graph: AttackGraphModel,
  edges: AttackGraphEdgeModel[],
) {
  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  const childrenByNodeId = new Map<string, string[]>();

  for (const nodeId of nodeIds) {
    childrenByNodeId.set(nodeId, []);
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      continue;
    }
    childrenByNodeId.set(edge.source, [
      ...(childrenByNodeId.get(edge.source) ?? []),
      edge.target,
    ]);
  }

  const visited = new Set<string>();
  const visiting = new Set<string>();
  let backEdgeCount = 0;

  const visit = (nodeId: string) => {
    if (visiting.has(nodeId)) {
      backEdgeCount += 1;
      return;
    }
    if (visited.has(nodeId)) {
      return;
    }

    visiting.add(nodeId);
    for (const childId of childrenByNodeId.get(nodeId) ?? []) {
      visit(childId);
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
  };

  for (const nodeId of nodeIds) {
    visit(nodeId);
  }

  return {
    backEdgeCount,
    cyclic: backEdgeCount > 0,
  };
}

function classifyLinearChain(
  graph: AttackGraphModel,
  edges: AttackGraphEdgeModel[],
): Extract<ClassifiedAttackGraphTopology, { kind: "linear-chain" }> | null {
  if (edges.length !== graph.nodes.length - 1) {
    return null;
  }

  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  const outgoingByNodeId = new Map<string, string>();
  const incomingByNodeId = new Map<string, string>();

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      return null;
    }
    if (
      outgoingByNodeId.has(edge.source) ||
      incomingByNodeId.has(edge.target)
    ) {
      return null;
    }
    outgoingByNodeId.set(edge.source, edge.target);
    incomingByNodeId.set(edge.target, edge.source);
  }

  const starts = graph.nodes.filter((node) => !incomingByNodeId.has(node.id));
  const ends = graph.nodes.filter((node) => !outgoingByNodeId.has(node.id));
  if (starts.length !== 1 || ends.length !== 1) {
    return null;
  }

  const orderedNodeIds: string[] = [];
  const visited = new Set<string>();
  let currentNodeId: string | undefined = starts[0].id;
  while (currentNodeId) {
    if (visited.has(currentNodeId)) {
      return null;
    }
    visited.add(currentNodeId);
    orderedNodeIds.push(currentNodeId);
    currentNodeId = outgoingByNodeId.get(currentNodeId);
  }

  if (orderedNodeIds.length !== graph.nodes.length) {
    return null;
  }

  return {
    kind: "linear-chain",
    nodeIds: orderedNodeIds,
  };
}

function classifySingleSourceFanout(
  graph: AttackGraphModel,
  edges: AttackGraphEdgeModel[],
): Extract<ClassifiedAttackGraphTopology, { kind: "single-source-fanout" }> | null {
  const sourceIds = new Set(edges.map((edge) => edge.source));
  if (sourceIds.size !== 1) {
    return null;
  }

  const sourceId = [...sourceIds][0];
  const targetIds = [...new Set(edges.map((edge) => edge.target))];
  if (targetIds.length <= 1 || targetIds.includes(sourceId)) {
    return null;
  }

  const fanoutNodeIds = new Set([sourceId, ...targetIds]);
  if (graph.nodes.some((node) => !fanoutNodeIds.has(node.id))) {
    return null;
  }

  const targetOutDegree = new Map<string, number>();
  for (const edge of edges) {
    targetOutDegree.set(edge.source, (targetOutDegree.get(edge.source) ?? 0) + 1);
  }

  if (targetIds.some((targetId) => (targetOutDegree.get(targetId) ?? 0) > 0)) {
    return null;
  }

  return {
    kind: "single-source-fanout",
    sourceId,
    targetIds,
  };
}

function classifyMultiSourceFanin(
  graph: AttackGraphModel,
  edges: AttackGraphEdgeModel[],
): Extract<ClassifiedAttackGraphTopology, { kind: "multi-source-fanin" }> | null {
  const targetIds = new Set(edges.map((edge) => edge.target));
  if (targetIds.size !== 1) {
    return null;
  }

  const targetId = [...targetIds][0];
  const sourceIds = [...new Set(edges.map((edge) => edge.source))];
  if (sourceIds.length <= 1 || sourceIds.includes(targetId)) {
    return null;
  }

  const faninNodeIds = new Set([targetId, ...sourceIds]);
  if (graph.nodes.some((node) => !faninNodeIds.has(node.id))) {
    return null;
  }

  const sourceInDegree = new Map<string, number>();
  for (const edge of edges) {
    sourceInDegree.set(edge.target, (sourceInDegree.get(edge.target) ?? 0) + 1);
  }

  if (sourceIds.some((sourceId) => (sourceInDegree.get(sourceId) ?? 0) > 0)) {
    return null;
  }

  return {
    kind: "multi-source-fanin",
    sourceIds,
    targetId,
  };
}

function classifyTree(
  graph: AttackGraphModel,
  edges: AttackGraphEdgeModel[],
): Extract<ClassifiedAttackGraphTopology, { kind: "tree" }> | null {
  if (edges.length !== graph.nodes.length - 1) {
    return null;
  }

  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  const childrenByNodeId = new Map<string, string[]>();
  const parentByNodeId = new Map<string, string>();

  for (const nodeId of nodeIds) {
    childrenByNodeId.set(nodeId, []);
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      return null;
    }
    if (parentByNodeId.has(edge.target)) {
      return null;
    }
    parentByNodeId.set(edge.target, edge.source);
    childrenByNodeId.set(edge.source, [
      ...(childrenByNodeId.get(edge.source) ?? []),
      edge.target,
    ]);
  }

  const roots = graph.nodes.filter((node) => !parentByNodeId.has(node.id));
  if (roots.length !== 1) {
    return null;
  }

  const rootId = roots[0].id;
  const visited = new Set<string>();
  const stack = [rootId];

  while (stack.length > 0) {
    const nodeId = stack.pop();
    if (!nodeId) {
      continue;
    }
    if (visited.has(nodeId)) {
      return null;
    }
    visited.add(nodeId);
    for (const childId of childrenByNodeId.get(nodeId) ?? []) {
      stack.push(childId);
    }
  }

  if (visited.size !== graph.nodes.length) {
    return null;
  }

  return {
    kind: "tree",
    rootId,
    childrenByNodeId,
  };
}
