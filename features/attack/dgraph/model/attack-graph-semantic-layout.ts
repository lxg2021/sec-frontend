import type { AttackGraphModel, AttackGraphPoint } from "./attack-graph-data";
import type {
  AttackGraphEdgeModel,
  AttackGraphNodeModel,
} from "./attack-graph-data";
import {
  ATTACK_GRAPH_FALLBACK_LAYOUT_LANE,
  buildActiveLayoutLanes,
  getAttackGraphLayoutLane,
  type AttackGraphLayoutLaneConfig,
} from "./attack-graph-layout-lanes";
import {
  ATTACK_GRAPH_DEFAULT_NODE_HEIGHT,
  ATTACK_GRAPH_NODE_TILE_WIDTH,
} from "../components/attack-graph-node";

const LAYER_X_TOLERANCE = 80;
const MIN_LAYER_GAP = ATTACK_GRAPH_NODE_TILE_WIDTH + 120;
const LANE_PADDING = 20;
const LANE_GAP = 28;
const NODE_VERTICAL_GAP = 24;

const COMPACT_GRAPH_NODE_LIMIT = 3;
const COMPACT_GRAPH_LANE_LIMIT = 2;
const SEMANTIC_ALIGN_THRESHOLD = 12;

type SlotLayoutMode = "compact" | "laned";

interface SlotLane {
  id: string;
  label: string;
  order: number;
  centered?: boolean;
}

interface LayoutEntry {
  node: AttackGraphNodeModel;
  lane: SlotLane;
  layerIndex: number;
}

const COMPACT_LANE: SlotLane = {
  id: "compact",
  label: "Compact",
  order: 0,
  centered: true,
};

export function processSemanticLayout(
  layoutResult: AttackGraphModel & {
    nodes: AttackGraphNodeModel[];
    edges: AttackGraphEdgeModel[];
  },
  _threshold = SEMANTIC_ALIGN_THRESHOLD,
): AttackGraphNodeModel[] {
  const { nodes } = layoutResult;
  if (nodes.length === 0) return nodes;

  const { lanes, laneByKind } = buildActiveLayoutLanes(nodes);
  const mode = chooseSlotLayoutMode(nodes, lanes);
  const orderedLanes =
    mode === "compact" ? [COMPACT_LANE] : orderActiveLanes(lanes);
  const entries = buildLayoutEntries({
    laneByKind,
    mode,
    nodes,
  });
  const layers = detectLayers(entries);

  if (layers.length === 0) return nodes;

  return normalizeNodePositions(
    placeNodesBySlots({
      entries,
      layers,
      orderedLanes,
    }),
  );
}

function chooseSlotLayoutMode(
  nodes: AttackGraphNodeModel[],
  lanes: AttackGraphLayoutLaneConfig[],
): SlotLayoutMode {
  if (lanes.length <= 1) {
    return "compact";
  }
  if (
    nodes.length <= COMPACT_GRAPH_NODE_LIMIT &&
    lanes.length <= COMPACT_GRAPH_LANE_LIMIT
  ) {
    return "compact";
  }
  return "laned";
}

function orderActiveLanes(
  lanes: AttackGraphLayoutLaneConfig[],
): SlotLane[] {
  return [...lanes].sort((left, right) => left.order - right.order);
}

function buildLayoutEntries({
  laneByKind,
  mode,
  nodes,
}: {
  laneByKind: Map<string, AttackGraphLayoutLaneConfig>;
  mode: SlotLayoutMode;
  nodes: AttackGraphNodeModel[];
}): LayoutEntry[] {
  return nodes.map((node) => ({
    layerIndex: 0,
    lane:
      mode === "compact"
        ? COMPACT_LANE
        : getAttackGraphLayoutLane(node.presentationKind, laneByKind) ??
          ATTACK_GRAPH_FALLBACK_LAYOUT_LANE,
    node,
  }));
}

function detectLayers(entries: LayoutEntry[]): LayoutEntry[][] {
  const sorted = [...entries].sort(
    (left, right) =>
      getNodeX(left.node) - getNodeX(right.node) ||
      getNodeY(left.node) - getNodeY(right.node) ||
      left.node.id.localeCompare(right.node.id),
  );
  if (sorted.length === 0) return [];

  const layers: LayoutEntry[][] = [];
  let currentLayer = [sorted[0]];
  let anchorX = getNodeX(sorted[0].node);

  for (let index = 1; index < sorted.length; index += 1) {
    const entry = sorted[index];
    const x = getNodeX(entry.node);

    if (Math.abs(x - anchorX) > LAYER_X_TOLERANCE) {
      layers.push(currentLayer);
      currentLayer = [entry];
      anchorX = x;
    } else {
      currentLayer.push(entry);
    }
  }

  layers.push(currentLayer);

  for (let layerIndex = 0; layerIndex < layers.length; layerIndex += 1) {
    for (const entry of layers[layerIndex]) {
      entry.layerIndex = layerIndex;
    }
  }

  return layers;
}

function placeNodesBySlots({
  entries,
  layers,
  orderedLanes,
}: {
  entries: LayoutEntry[];
  layers: LayoutEntry[][];
  orderedLanes: SlotLane[];
}): AttackGraphNodeModel[] {
  const layerX = computeLayerXPositions(layers);
  const laneHeights = computeLaneHeights(entries, layers, orderedLanes);
  const laneY = computeLaneYPositions(orderedLanes, laneHeights);
  const placedById = new Map<string, AttackGraphNodeModel>();

  for (const layer of layers) {
    for (const lane of orderedLanes) {
      const cell = layer
        .filter((entry) => entry.lane.id === lane.id)
        .sort(compareEntriesWithinSlot);

      if (cell.length === 0) continue;

      const x = layerX.get(cell[0].layerIndex) ?? 0;
      const top = getSlotTop({
        count: cell.length,
        laneHeight: laneHeights.get(lane.id) ?? getMinimumLaneHeight(1),
        laneY: laneY.get(lane.id) ?? 0,
      });

      for (let slotIndex = 0; slotIndex < cell.length; slotIndex += 1) {
        const entry = cell[slotIndex];
        placedById.set(entry.node.id, {
          ...entry.node,
          position: {
            x,
            y:
              top +
              slotIndex *
                (ATTACK_GRAPH_DEFAULT_NODE_HEIGHT + NODE_VERTICAL_GAP),
          } as AttackGraphPoint,
        });
      }
    }
  }

  return entries.map((entry) => placedById.get(entry.node.id) ?? entry.node);
}

function computeLayerXPositions(layers: LayoutEntry[][]): Map<number, number> {
  const positions = new Map<number, number>();
  const minOriginalX = Math.min(
    ...layers.flatMap((layer) => layer.map((entry) => getNodeX(entry.node))),
  );
  let previousX = 0;

  for (let layerIndex = 0; layerIndex < layers.length; layerIndex += 1) {
    const layer = layers[layerIndex];
    const averageX =
      layer.reduce((total, entry) => total + getNodeX(entry.node), 0) /
      layer.length;
    const desiredX = Math.max(0, averageX - minOriginalX);
    const x =
      layerIndex === 0
        ? 0
        : Math.max(desiredX, previousX + MIN_LAYER_GAP);

    positions.set(layerIndex, x);
    previousX = x;
  }

  return positions;
}

function computeLaneHeights(
  entries: LayoutEntry[],
  layers: LayoutEntry[][],
  orderedLanes: SlotLane[],
): Map<string, number> {
  const heights = new Map<string, number>();

  for (const lane of orderedLanes) {
    let maxSlotCount = 1;

    for (const layer of layers) {
      const count = layer.filter((entry) => entry.lane.id === lane.id).length;
      maxSlotCount = Math.max(maxSlotCount, count);
    }

    const laneHasNodes = entries.some((entry) => entry.lane.id === lane.id);
    heights.set(
      lane.id,
      laneHasNodes ? getMinimumLaneHeight(maxSlotCount) : 0,
    );
  }

  return heights;
}

function computeLaneYPositions(
  orderedLanes: SlotLane[],
  laneHeights: Map<string, number>,
): Map<string, number> {
  const positions = new Map<string, number>();
  let nextY = 0;

  for (const lane of orderedLanes) {
    const height = laneHeights.get(lane.id) ?? 0;
    if (height <= 0) continue;

    positions.set(lane.id, nextY);
    nextY += height + LANE_GAP;
  }

  return positions;
}

function getSlotTop({
  count,
  laneHeight,
  laneY,
}: {
  count: number;
  laneHeight: number;
  laneY: number;
}) {
  const stackHeight =
    count * ATTACK_GRAPH_DEFAULT_NODE_HEIGHT +
    Math.max(0, count - 1) * NODE_VERTICAL_GAP;

  return laneY + Math.max(LANE_PADDING, (laneHeight - stackHeight) / 2);
}

function getMinimumLaneHeight(slotCount: number) {
  return (
    slotCount * ATTACK_GRAPH_DEFAULT_NODE_HEIGHT +
    Math.max(0, slotCount - 1) * NODE_VERTICAL_GAP +
    LANE_PADDING * 2
  );
}

function compareEntriesWithinSlot(left: LayoutEntry, right: LayoutEntry) {
  return (
    getNodeY(left.node) - getNodeY(right.node) ||
    getNodeX(left.node) - getNodeX(right.node) ||
    left.node.displayName.localeCompare(right.node.displayName) ||
    left.node.id.localeCompare(right.node.id)
  );
}

function normalizeNodePositions(
  nodes: AttackGraphNodeModel[],
): AttackGraphNodeModel[] {
  if (nodes.length === 0) return nodes;

  const minX = Math.min(...nodes.map((node) => getNodeX(node)));
  const minY = Math.min(...nodes.map((node) => getNodeY(node)));

  if (minX === 0 && minY === 0) {
    return nodes;
  }

  return nodes.map((node) => ({
    ...node,
    position: {
      x: getNodeX(node) - minX,
      y: getNodeY(node) - minY,
    } as AttackGraphPoint,
  }));
}

function getNodeX(node: AttackGraphNodeModel) {
  return node.position?.x ?? 0;
}

function getNodeY(node: AttackGraphNodeModel) {
  return node.position?.y ?? 0;
}
