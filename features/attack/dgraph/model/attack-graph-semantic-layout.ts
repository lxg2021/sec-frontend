import type { AttackGraphModel, AttackGraphPoint } from "./attack-graph-data";
import type { AttackGraphEdgeModel, AttackGraphNodeModel } from "./attack-graph-data";
import type { AttackGraphNodePresentationKind } from "./attack-graph-node-types";
import {
  ATTACK_GRAPH_FALLBACK_LAYOUT_LANE,
  buildActiveLayoutLanes,
  getAttackGraphLayoutLane,
  type AttackGraphLayoutLaneConfig,
} from "./attack-graph-layout-lanes";
import { computePenetrationPenalty } from "./attack-graph-edge-obstacle";
import {
  ATTACK_GRAPH_DEFAULT_NODE_HEIGHT,
  ATTACK_GRAPH_NODE_TILE_WIDTH,
} from "../components/attack-graph-node";

const LAYER_X_TOLERANCE = 80;
const LANE_PADDING = 20;
const LANE_GAP = 28;
const NODE_VERTICAL_GAP = 16;
const SAME_LANE_Y_THRESHOLD = 50;
const COMPONENT_GAP = 72;

const SEMANTIC_ALIGN_THRESHOLD = 12;
const TINY_GRAPH_KIND_COUNT = 2;
const ORDER_OPTIMIZE_MAX_NODES = 12;
const ORDER_OPTIMIZE_MAX_LAYER_SIZE = 5;
const ORDER_OPTIMIZE_MAX_COMBINATIONS = 20000;

interface LayoutEntry {
  node: AttackGraphNodeModel;
  lane: AttackGraphLayoutLaneConfig;
  layerIndex: number;
}

export function processSemanticLayout(
  layoutResult: AttackGraphModel & { nodes: AttackGraphNodeModel[]; edges: AttackGraphEdgeModel[] },
  threshold = SEMANTIC_ALIGN_THRESHOLD,
): AttackGraphNodeModel[] {
  const { nodes, edges } = layoutResult;
  if (nodes.length === 0) return nodes;

  if (nodes.length === 2) {
    return layoutTwoNodeRow(nodes);
  }

  const { lanes, laneByKind } = buildActiveLayoutLanes(nodes);

  if (lanes.length <= 1 || isTinyGraph(nodes)) {
    return layoutByTypeAlignment(nodes);
  }

  const originalCrossings = countEdgeCrossings(nodes, edges);
  const components = collectConnectedComponents(nodes, edges);
  const semanticNodes =
    components.length > 1
      ? layoutDisconnectedComponents(layoutResult, components, threshold, lanes, laneByKind)
      : layoutConnectedSemanticNodes(layoutResult, threshold, lanes, laneByKind);
  const semanticCrossings = countEdgeCrossings(semanticNodes, edges);

  const strictLane = lanes.length >= 3;
  const bestNodes = strictLane
    ? semanticNodes
    : semanticCrossings > originalCrossings
      ? nodes
      : semanticNodes;
  const bestCrossings = strictLane
    ? semanticCrossings
    : Math.min(originalCrossings, semanticCrossings);
  const optimizedNodes = optimizeLayerOrder(bestNodes, edges, laneByKind);
  const optimizedCrossings = countEdgeCrossings(optimizedNodes, edges);

  return optimizedCrossings < bestCrossings ? optimizedNodes : bestNodes;
}

function isTinyGraph(nodes: AttackGraphNodeModel[]): boolean {
  const kinds = new Set(nodes.map((n) => n.presentationKind));
  return nodes.length <= 3 && kinds.size <= TINY_GRAPH_KIND_COUNT;
}

function layoutTwoNodeRow(
  nodes: AttackGraphNodeModel[],
): AttackGraphNodeModel[] {
  const y =
    nodes.reduce((total, node) => total + (node.position?.y ?? 0), 0) /
    nodes.length;

  return nodes.map((node) => ({
    ...node,
    position: {
      x: node.position?.x ?? 0,
      y,
    } as AttackGraphPoint,
  }));
}

function layoutByTypeAlignment(
  nodes: AttackGraphNodeModel[],
): AttackGraphNodeModel[] {
  if (nodes.length === 0) return nodes;

  const byKind = new Map<string, AttackGraphNodeModel[]>();
  for (const node of nodes) {
    const key = node.presentationKind;
    if (!byKind.has(key)) byKind.set(key, []);
    byKind.get(key)!.push(node);
  }

  const processKinds = new Set(["process", "powershell", "service", "task"]);
  const types = [...byKind.entries()];
  const processTypes = types.filter(([k]) => processKinds.has(k));
  const otherTypes = types.filter(([k]) => !processKinds.has(k));
  const ordered = [...processTypes, ...otherTypes];

  const nodeH = ATTACK_GRAPH_DEFAULT_NODE_HEIGHT;
  const gap = NODE_VERTICAL_GAP;
  const result: AttackGraphNodeModel[] = [];
  let y = 0;

  for (const [, kindNodes] of ordered) {
    for (const node of kindNodes) {
      result.push({
        ...node,
        position: {
          x: node.position?.x ?? 0,
          y,
        } as AttackGraphPoint,
      });
    }
    if (kindNodes.length > 0) {
      y += nodeH + gap;
    }
  }

  return result;
}

function layoutConnectedSemanticNodes(
  layoutResult: AttackGraphModel & { nodes: AttackGraphNodeModel[]; edges: AttackGraphEdgeModel[] },
  threshold: number,
  lanes: AttackGraphLayoutLaneConfig[],
  laneByKind: Map<string, AttackGraphLayoutLaneConfig>,
): AttackGraphNodeModel[] {
  const { nodes, edges } = layoutResult;
  const entries: LayoutEntry[] = nodes.map((n) => ({
    node: n,
    lane: getAttackGraphLayoutLane(n.presentationKind, laneByKind) ?? lanes[lanes.length - 1],
    layerIndex: 0,
  }));

  const layers = detectLayers(entries);
  const centeredLane = findCenteredLane(lanes);
  if (!centeredLane) return layoutResult.nodes;

  const aboveLanes = lanes
    .filter((l) => l.order < centeredLane.order)
    .sort((a, b) => a.order - b.order);
  const belowLanes = lanes
    .filter((l) => l.order > centeredLane.order)
    .sort((a, b) => a.order - b.order);

  const orderedLanes = [...aboveLanes, centeredLane, ...belowLanes];
  const laneHeights = computeLaneHeights(entries, layers, orderedLanes);
  const laneYMap = computeLaneYPositions(orderedLanes, laneHeights, centeredLane);

  if (nodes.length <= threshold) {
    const mainChain = findMainChainByLane(entries, edges, centeredLane);
    if (mainChain.length > 1) {
      const chainY = laneYMap.get(centeredLane.id)! + laneHeights.get(centeredLane.id)! / 2;
      alignChainNodes(entries, mainChain, chainY);
      alignClusteredNodes(entries, layers, SAME_LANE_Y_THRESHOLD);
      reprocessLaneHeights(entries, layers, orderedLanes, laneHeights, laneYMap, centeredLane);
    }
  }

  return placeNodes(entries, layers, orderedLanes, laneHeights, laneYMap);
}

function layoutDisconnectedComponents(
  layoutResult: AttackGraphModel & { nodes: AttackGraphNodeModel[]; edges: AttackGraphEdgeModel[] },
  components: string[][],
  threshold: number,
  lanes: AttackGraphLayoutLaneConfig[],
  laneByKind: Map<string, AttackGraphLayoutLaneConfig>,
): AttackGraphNodeModel[] {
  const nodeById = new Map(layoutResult.nodes.map((node) => [node.id, node]));
  const orderedComponents = components
    .map((ids) => {
      const idSet = new Set(ids);
      const componentNodes = ids
        .map((id) => nodeById.get(id))
        .filter((node): node is AttackGraphNodeModel => Boolean(node));
      const componentEdges = layoutResult.edges.filter(
        (edge) => idSet.has(edge.source) && idSet.has(edge.target),
      );
      const bounds = getNodeBounds(componentNodes);
      return { bounds, edges: componentEdges, nodes: componentNodes };
    })
    .sort(
      (a, b) =>
        a.bounds.minY - b.bounds.minY ||
        a.bounds.minX - b.bounds.minX ||
        b.nodes.length - a.nodes.length,
    );

  const placedById = new Map<string, AttackGraphNodeModel>();
  let nextY = 0;

  for (const component of orderedComponents) {
    const { lanes: subLanes, laneByKind: subLaneByKind } =
      buildActiveLayoutLanes(component.nodes);
    const effectiveLanes = subLanes.length > 0 ? subLanes : lanes;
    const effectiveLaneByKind =
      subLanes.length > 0
        ? subLaneByKind
        : laneByKind;

    const placed = layoutConnectedSemanticNodes(
      { ...layoutResult, edges: component.edges, nodes: component.nodes },
      threshold,
      effectiveLanes,
      effectiveLaneByKind,
    );
    const bounds = getNodeBounds(placed);
    const offsetY = nextY - bounds.minY;

    for (const node of placed) {
      placedById.set(node.id, {
        ...node,
        position: {
          x: node.position?.x ?? 0,
          y: (node.position?.y ?? 0) + offsetY,
        } as AttackGraphPoint,
      });
    }

    nextY += bounds.height + COMPONENT_GAP;
  }

  return layoutResult.nodes.map((node) => placedById.get(node.id) ?? node);
}

function collectConnectedComponents(
  nodes: AttackGraphNodeModel[],
  edges: AttackGraphEdgeModel[],
): string[][] {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const adjacency = new Map<string, Set<string>>();

  for (const id of nodeIds) {
    adjacency.set(id, new Set());
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    if (edge.source === edge.target) continue;
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  }

  const seen = new Set<string>();
  const components: string[][] = [];

  for (const id of nodeIds) {
    if (seen.has(id)) continue;

    const component: string[] = [];
    const stack = [id];
    seen.add(id);

    while (stack.length > 0) {
      const current = stack.pop()!;
      component.push(current);

      for (const next of adjacency.get(current) ?? []) {
        if (seen.has(next)) continue;
        seen.add(next);
        stack.push(next);
      }
    }

    components.push(component);
  }

  return components;
}

function getNodeBounds(nodes: AttackGraphNodeModel[]) {
  if (nodes.length === 0) {
    return { height: 0, maxX: 0, maxY: 0, minX: 0, minY: 0, width: 0 };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const node of nodes) {
    const x = node.position?.x ?? 0;
    const y = node.position?.y ?? 0;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + ATTACK_GRAPH_NODE_TILE_WIDTH);
    maxY = Math.max(maxY, y + ATTACK_GRAPH_DEFAULT_NODE_HEIGHT);
  }

  return { height: maxY - minY, maxX, maxY, minX, minY, width: maxX - minX };
}

function countEdgeCrossings(
  nodes: AttackGraphNodeModel[],
  edges: AttackGraphEdgeModel[],
): number {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const segments = edges
    .filter((edge) => edge.source !== edge.target)
    .map((edge) => {
      const source = nodeById.get(edge.source);
      const target = nodeById.get(edge.target);
      if (!source || !target) return null;
      return { edge, source: getNodeCenter(source), target: getNodeCenter(target) };
    })
    .filter((segment): segment is NonNullable<typeof segment> => Boolean(segment));

  let crossings = 0;
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      const a = segments[i];
      const b = segments[j];
      if (edgesShareEndpoint(a.edge, b.edge)) continue;
      if (segmentsIntersect(a.source, a.target, b.source, b.target)) {
        crossings++;
      }
    }
  }

  const penetrationPenalty = computePenetrationPenalty(nodes, edges);

  return crossings + penetrationPenalty;
}

function optimizeLayerOrder(
  nodes: AttackGraphNodeModel[],
  edges: AttackGraphEdgeModel[],
  laneByKind: Map<string, AttackGraphLayoutLaneConfig>,
): AttackGraphNodeModel[] {
  if (nodes.length > ORDER_OPTIMIZE_MAX_NODES) return nodes;

  const entries: LayoutEntry[] = nodes.map((node) => ({
    lane:
      getAttackGraphLayoutLane(node.presentationKind, laneByKind) ??
      ATTACK_GRAPH_FALLBACK_LAYOUT_LANE,
    layerIndex: 0,
    node,
  }));
  const layers = detectLayers(entries);
  if (layers.length <= 1) return nodes;
  if (layers.some((layer) => layer.length > ORDER_OPTIMIZE_MAX_LAYER_SIZE)) return nodes;

  const layerOptions = layers.map((layer) => {
    const ordered = [...layer].sort(
      (a, b) => (a.node.position?.y ?? 0) - (b.node.position?.y ?? 0),
    );
    return generatePermutations(ordered);
  });
  const combinationCount = layerOptions.reduce((total, options) => total * options.length, 1);
  if (combinationCount > ORDER_OPTIMIZE_MAX_COMBINATIONS) return nodes;

  const originalOrderByLayer = new Map(
    layers.flatMap((layer, layerIndex) =>
      [...layer]
        .sort((a, b) => (a.node.position?.y ?? 0) - (b.node.position?.y ?? 0))
        .map((entry, orderIndex) => [entry.node.id, { layerIndex, orderIndex }] as const),
    ),
  );

  let bestNodes = nodes;
  let bestCrossings = countEdgeCrossings(nodes, edges);
  let bestMovement = 0;

  function visit(layerIndex: number, selectedLayers: LayoutEntry[][]) {
    if (layerIndex >= layerOptions.length) {
      const candidate = applyLayerOrder(layers, selectedLayers, nodes);
      const crossings = countEdgeCrossings(candidate, edges);
      if (crossings > bestCrossings) return;

      const movement = getLayerOrderMovement(selectedLayers, originalOrderByLayer);
      if (crossings < bestCrossings || (crossings === bestCrossings && movement < bestMovement)) {
        bestNodes = candidate;
        bestCrossings = crossings;
        bestMovement = movement;
      }
      return;
    }

    for (const option of layerOptions[layerIndex]) {
      selectedLayers.push(option);
      visit(layerIndex + 1, selectedLayers);
      selectedLayers.pop();
    }
  }

  visit(0, []);
  return bestNodes;
}

function applyLayerOrder(
  originalLayers: LayoutEntry[][],
  selectedLayers: LayoutEntry[][],
  originalNodes: AttackGraphNodeModel[],
): AttackGraphNodeModel[] {
  const nextNodeById = new Map<string, AttackGraphNodeModel>();

  for (let layerIndex = 0; layerIndex < selectedLayers.length; layerIndex++) {
    const slots = [...originalLayers[layerIndex]]
      .map((entry) => entry.node.position?.y ?? 0)
      .sort((a, b) => a - b);

    for (let orderIndex = 0; orderIndex < selectedLayers[layerIndex].length; orderIndex++) {
      const entry = selectedLayers[layerIndex][orderIndex];
      nextNodeById.set(entry.node.id, {
        ...entry.node,
        position: {
          x: entry.node.position?.x ?? 0,
          y: slots[orderIndex] ?? entry.node.position?.y ?? 0,
        } as AttackGraphPoint,
      });
    }
  }

  return originalNodes.map((node) => nextNodeById.get(node.id) ?? node);
}

function getLayerOrderMovement(
  selectedLayers: LayoutEntry[][],
  originalOrderByLayer: Map<string, { layerIndex: number; orderIndex: number }>,
) {
  let movement = 0;
  for (let layerIndex = 0; layerIndex < selectedLayers.length; layerIndex++) {
    for (let orderIndex = 0; orderIndex < selectedLayers[layerIndex].length; orderIndex++) {
      const original = originalOrderByLayer.get(selectedLayers[layerIndex][orderIndex].node.id);
      if (!original) continue;
      movement +=
        Math.abs(original.layerIndex - layerIndex) * 10 +
        Math.abs(original.orderIndex - orderIndex);
    }
  }
  return movement;
}

function generatePermutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];

  const result: T[][] = [];
  const used = new Array(items.length).fill(false);
  const current: T[] = [];

  function backtrack() {
    if (current.length === items.length) {
      result.push([...current]);
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      current.push(items[i]);
      backtrack();
      current.pop();
      used[i] = false;
    }
  }

  backtrack();
  return result;
}

function getNodeCenter(node: AttackGraphNodeModel): AttackGraphPoint {
  return {
    x: (node.position?.x ?? 0) + ATTACK_GRAPH_NODE_TILE_WIDTH / 2,
    y: (node.position?.y ?? 0) + ATTACK_GRAPH_DEFAULT_NODE_HEIGHT / 2,
  };
}

function edgesShareEndpoint(a: AttackGraphEdgeModel, b: AttackGraphEdgeModel) {
  return (
    a.source === b.source ||
    a.source === b.target ||
    a.target === b.source ||
    a.target === b.target
  );
}

function segmentsIntersect(
  a: AttackGraphPoint,
  b: AttackGraphPoint,
  c: AttackGraphPoint,
  d: AttackGraphPoint,
) {
  if (!boxesOverlap(a, b, c, d)) return false;
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);
  return o1 * o2 < -1e-6 && o3 * o4 < -1e-6;
}

function boxesOverlap(a: AttackGraphPoint, b: AttackGraphPoint, c: AttackGraphPoint, d: AttackGraphPoint) {
  return (
    Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x)) <=
      Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x)) &&
    Math.max(Math.min(a.y, b.y), Math.min(c.y, d.y)) <=
      Math.min(Math.max(a.y, b.y), Math.max(c.y, d.y))
  );
}

function orientation(a: AttackGraphPoint, b: AttackGraphPoint, c: AttackGraphPoint) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function detectLayers(entries: LayoutEntry[]): LayoutEntry[][] {
  const sorted = [...entries].sort(
    (a, b) => (a.node.position?.x ?? 0) - (b.node.position?.x ?? 0),
  );
  if (sorted.length === 0) return [];

  const layers: LayoutEntry[][] = [];
  let current = [sorted[0]];
  let anchor = sorted[0].node.position?.x ?? 0;

  for (let i = 1; i < sorted.length; i++) {
    const x = sorted[i].node.position?.x ?? 0;
    if (Math.abs(x - anchor) > LAYER_X_TOLERANCE) {
      layers.push(current);
      current = [sorted[i]];
      anchor = x;
    } else {
      current.push(sorted[i]);
    }
  }
  layers.push(current);

  for (let li = 0; li < layers.length; li++) {
    for (const entry of layers[li]) {
      entry.layerIndex = li;
    }
  }

  return layers;
}

function findCenteredLane(lanes: AttackGraphLayoutLaneConfig[]): AttackGraphLayoutLaneConfig | undefined {
  if (lanes.length === 0) return undefined;
  return lanes.find((l) => l.centered) ?? lanes[0];
}

function computeLaneHeights(
  entries: LayoutEntry[],
  layers: LayoutEntry[][],
  orderedLanes: AttackGraphLayoutLaneConfig[],
): Map<string, number> {
  const maxByLane = new Map<string, number>();
  for (const lane of orderedLanes) {
    let maxCount = 0;
    for (const layer of layers) {
      const count = layer.filter((e) => e.lane.id === lane.id).length;
      if (count > maxCount) maxCount = count;
    }
    maxByLane.set(lane.id, Math.max(1, maxCount));
  }

  const heights = new Map<string, number>();
  const nodeH = ATTACK_GRAPH_DEFAULT_NODE_HEIGHT;
  for (const lane of orderedLanes) {
    const n = maxByLane.get(lane.id) ?? 1;
    heights.set(lane.id, n * nodeH + (n - 1) * NODE_VERTICAL_GAP + LANE_PADDING * 2);
  }
  return heights;
}

function computeLaneYPositions(
  orderedLanes: AttackGraphLayoutLaneConfig[],
  laneHeights: Map<string, number>,
  centeredLane: AttackGraphLayoutLaneConfig,
): Map<string, number> {
  const centerIndex = orderedLanes.indexOf(centeredLane);
  const result = new Map<string, number>();

  const centerHeight = laneHeights.get(centeredLane.id) ?? 104;
  let centerY = 0;

  for (let i = centerIndex - 1; i >= 0; i--) {
    const lane = orderedLanes[i];
    const h = laneHeights.get(lane.id) ?? 104;
    centerY += h + LANE_GAP;
  }

  result.set(centeredLane.id, centerY);

  let aboveY = centerY;
  for (let i = centerIndex - 1; i >= 0; i--) {
    const lane = orderedLanes[i];
    const h = laneHeights.get(lane.id) ?? 104;
    aboveY -= h + LANE_GAP;
    result.set(lane.id, aboveY);
  }

  let belowY = centerY + centerHeight;
  for (let i = centerIndex + 1; i < orderedLanes.length; i++) {
    const lane = orderedLanes[i];
    const h = laneHeights.get(lane.id) ?? 104;
    belowY += LANE_GAP;
    result.set(lane.id, belowY);
    belowY += h;
  }

  return result;
}

function findMainChainByLane(
  entries: LayoutEntry[],
  edges: AttackGraphEdgeModel[],
  centeredLane: AttackGraphLayoutLaneConfig,
): string[] {
  const laneIds = new Set(
    entries.filter((e) => e.lane.id === centeredLane.id).map((e) => e.node.id),
  );
  if (laneIds.size === 0) return [];

  const successors = new Map<string, string[]>();
  const predecessors = new Map<string, string[]>();
  for (const id of laneIds) {
    successors.set(id, []);
    predecessors.set(id, []);
  }

  for (const edge of edges) {
    if (edge.source === edge.target) continue;
    if (laneIds.has(edge.source) && laneIds.has(edge.target)) {
      successors.get(edge.source)!.push(edge.target);
      predecessors.get(edge.target)!.push(edge.source);
    }
  }

  const sorted = [...laneIds].sort((a, b) => {
    const ax = entries.find((e) => e.node.id === a)?.node.position?.x ?? 0;
    const bx = entries.find((e) => e.node.id === b)?.node.position?.x ?? 0;
    return ax - bx;
  });

  const distance = new Map<string, number>();
  const parent = new Map<string, string | null>();
  let maxDist = 0;
  let farthestNode = sorted[0] ?? "";

  for (const id of sorted) {
    let best = 1;
    let bestPred: string | null = null;
    for (const pred of predecessors.get(id) ?? []) {
      const d = (distance.get(pred) ?? 0) + 1;
      if (d > best) {
        best = d;
        bestPred = pred;
      }
    }
    distance.set(id, best);
    parent.set(id, bestPred);
    if (best > maxDist) {
      maxDist = best;
      farthestNode = id;
    }
  }

  const chain: string[] = [];
  let current: string | null = farthestNode;
  while (current) {
    chain.unshift(current);
    current = parent.get(current) ?? null;
  }

  return chain;
}

function alignChainNodes(entries: LayoutEntry[], chainIds: string[], targetY: number) {
  const chainSet = new Set(chainIds);
  for (const entry of entries) {
    if (chainSet.has(entry.node.id)) {
      entry.node = {
        ...entry.node,
        position: {
          x: entry.node.position?.x ?? 0,
          y: targetY,
        } as AttackGraphPoint,
      };
    }
  }
}

function alignClusteredNodes(
  entries: LayoutEntry[],
  layers: LayoutEntry[][],
  yThreshold: number,
) {
  for (const layer of layers) {
    const byLane = new Map<string, LayoutEntry[]>();
    for (const e of layer) {
      const key = e.lane.id;
      if (!byLane.has(key)) byLane.set(key, []);
      byLane.get(key)!.push(e);
    }
    for (const [, laneEntries] of byLane) {
      const sorted = [...laneEntries].sort(
        (a, b) => (a.node.position?.y ?? 0) - (b.node.position?.y ?? 0),
      );
      let cluster: LayoutEntry[] = [sorted[0]];
      for (let i = 1; i < sorted.length; i++) {
        const prevY = sorted[i - 1].node.position?.y ?? 0;
        const currY = sorted[i].node.position?.y ?? 0;
        if (Math.abs(currY - prevY) <= yThreshold) {
          cluster.push(sorted[i]);
        } else {
          alignCluster(cluster);
          cluster = [sorted[i]];
        }
      }
      alignCluster(cluster);
    }
  }
}

function alignCluster(cluster: LayoutEntry[]) {
  if (cluster.length <= 1) return;
  let sumY = 0;
  for (const e of cluster) {
    sumY += e.node.position?.y ?? 0;
  }
  const avgY = sumY / cluster.length;
  for (const e of cluster) {
    e.node = {
      ...e.node,
      position: {
        x: e.node.position?.x ?? 0,
        y: avgY,
      } as AttackGraphPoint,
    };
  }
}

function reprocessLaneHeights(
  entries: LayoutEntry[],
  layers: LayoutEntry[][],
  orderedLanes: AttackGraphLayoutLaneConfig[],
  laneHeights: Map<string, number>,
  laneYMap: Map<string, number>,
  centeredLane: AttackGraphLayoutLaneConfig,
) {
  const newHeights = computeLaneHeights(entries, layers, orderedLanes);
  for (const [id, h] of newHeights) {
    laneHeights.set(id, h);
  }
  const newYMap = computeLaneYPositions(orderedLanes, laneHeights, centeredLane);
  for (const [id, y] of newYMap) {
    laneYMap.set(id, y);
  }
}

function placeNodes(
  entries: LayoutEntry[],
  layers: LayoutEntry[][],
  orderedLanes: AttackGraphLayoutLaneConfig[],
  laneHeights: Map<string, number>,
  laneYMap: Map<string, number>,
): AttackGraphNodeModel[] {
  const nodeH = ATTACK_GRAPH_DEFAULT_NODE_HEIGHT;
  const result: AttackGraphNodeModel[] = [];

  for (const layer of layers) {
    for (const lane of orderedLanes) {
      const cell = layer
        .filter((e) => e.lane.id === lane.id)
        .sort((a, b) => (a.node.position?.y ?? 0) - (b.node.position?.y ?? 0));

      if (cell.length === 0) continue;

      const laneY = laneYMap.get(lane.id) ?? 0;
      const laneH = laneHeights.get(lane.id) ?? 104;
      const stackH = cell.length * nodeH + (cell.length - 1) * NODE_VERTICAL_GAP;
      const top = laneY + (laneH - stackH) / 2;

      for (let i = 0; i < cell.length; i++) {
        result.push({
          ...cell[i].node,
          position: {
            x: cell[i].node.position?.x ?? 0,
            y: top + i * (nodeH + NODE_VERTICAL_GAP),
          } as AttackGraphPoint,
        });
      }
    }
  }

  return result;
}
