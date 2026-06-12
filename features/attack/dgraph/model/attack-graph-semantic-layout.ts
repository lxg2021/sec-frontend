import type {
  AttackGraphLayoutLaneBounds,
  AttackGraphLayoutMode,
  AttackGraphLayoutSession,
  AttackGraphModel,
  AttackGraphPoint,
} from "./attack-graph-data";
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
const TINY_NODE_GAP = ATTACK_GRAPH_NODE_TILE_WIDTH + 120;
const LANE_PADDING = 20;
const LANE_GAP = 28;
const NODE_VERTICAL_GAP = 24;

const TINY_GRAPH_NODE_LIMIT = 2;
const COMPACT_GRAPH_NODE_LIMIT = 6;
const COMPACT_GRAPH_LANE_LIMIT = 2;
const SEMANTIC_ALIGN_THRESHOLD = 12;

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

interface SemanticLayoutOptions {
  session?: AttackGraphLayoutSession | null;
}

export interface AttackGraphSemanticLayoutResult {
  activeLaneIds: string[];
  laneBoundsById: Map<string, AttackGraphLayoutLaneBounds>;
  mode: AttackGraphLayoutMode;
  nodeLaneIdById: Map<string, string>;
  nodes: AttackGraphNodeModel[];
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
  options: SemanticLayoutOptions = {},
  _threshold = SEMANTIC_ALIGN_THRESHOLD,
): AttackGraphSemanticLayoutResult {
  const { nodes } = layoutResult;
  if (nodes.length === 0) {
    return {
      activeLaneIds: [],
      laneBoundsById: new Map(),
      mode: "tiny",
      nodeLaneIdById: new Map(),
      nodes,
    };
  }

  const { lanes, laneByKind } = buildActiveLayoutLanes(nodes);
  const mode = chooseSlotLayoutMode(nodes, lanes, options.session);
  const activeLaneIds = orderActiveLanes(lanes).map((lane) => lane.id);
  const orderedLanes =
    mode === "lane" ? orderActiveLanes(lanes) : [COMPACT_LANE];
  const entries = buildLayoutEntries({
    laneByKind,
    mode,
    nodes,
  });
  const layers = detectLayers(entries);

  if (layers.length === 0) {
    return {
      activeLaneIds,
      laneBoundsById: new Map(),
      mode,
      nodeLaneIdById: buildNodeLaneIdById(entries),
      nodes,
    };
  }

  const placed =
    mode === "tiny"
      ? placeTinyNodes(entries)
      : placeNodesBySlots({
          entries,
          layers,
          mode,
          orderedLanes,
          session: options.session,
        });
  const normalizedNodes = normalizeNodePositions(placed.nodes);
  const normalizationOffset = getNormalizationOffset(placed.nodes);

  return {
    activeLaneIds,
    laneBoundsById: normalizeLaneBounds(
      placed.laneBoundsById,
      normalizationOffset,
    ),
    mode,
    nodeLaneIdById: buildNodeLaneIdById(entries),
    nodes: normalizedNodes,
  };
}

function chooseSlotLayoutMode(
  nodes: AttackGraphNodeModel[],
  lanes: AttackGraphLayoutLaneConfig[],
  session?: AttackGraphLayoutSession | null,
): AttackGraphLayoutMode {
  if (session?.hasEnteredLaneMode) {
    return "lane";
  }

  if (nodes.length <= TINY_GRAPH_NODE_LIMIT) {
    return "tiny";
  }

  if (nodes.length <= COMPACT_GRAPH_NODE_LIMIT && lanes.length <= COMPACT_GRAPH_LANE_LIMIT) {
    return "compact";
  }

  return "lane";
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
  mode: AttackGraphLayoutMode;
  nodes: AttackGraphNodeModel[];
}): LayoutEntry[] {
  return nodes.map((node) => ({
    layerIndex: 0,
    lane:
      mode !== "lane"
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

function placeTinyNodes(entries: LayoutEntry[]): {
  laneBoundsById: Map<string, AttackGraphLayoutLaneBounds>;
  nodes: AttackGraphNodeModel[];
} {
  const sorted = [...entries].sort(
    (left, right) =>
      getNodeX(left.node) - getNodeX(right.node) ||
      getNodeY(left.node) - getNodeY(right.node) ||
      left.node.id.localeCompare(right.node.id),
  );
  const nodes = sorted.map((entry, index) => ({
    ...entry.node,
    position: {
      x: index * TINY_NODE_GAP,
      y: 0,
    } as AttackGraphPoint,
  }));

  return {
    laneBoundsById: new Map([
      [
        COMPACT_LANE.id,
        {
          height: ATTACK_GRAPH_DEFAULT_NODE_HEIGHT,
          y: 0,
        },
      ],
    ]),
    nodes,
  };
}

function placeNodesBySlots({
  entries,
  layers,
  mode,
  orderedLanes,
  session,
}: {
  entries: LayoutEntry[];
  layers: LayoutEntry[][];
  mode: AttackGraphLayoutMode;
  orderedLanes: SlotLane[];
  session?: AttackGraphLayoutSession | null;
}): {
  laneBoundsById: Map<string, AttackGraphLayoutLaneBounds>;
  nodes: AttackGraphNodeModel[];
} {
  const layerX = computeLayerXPositions(layers, mode, session);
  const laneHeights = computeLaneHeights(entries, layers, orderedLanes);
  const laneY = computeLaneYPositions(orderedLanes, laneHeights, mode, session);
  const placedById = new Map<string, AttackGraphNodeModel>();
  const laneBoundsById = new Map<string, AttackGraphLayoutLaneBounds>();

  for (const lane of orderedLanes) {
    const height = laneHeights.get(lane.id) ?? 0;
    const y = laneY.get(lane.id);
    if (height > 0 && y !== undefined) {
      laneBoundsById.set(lane.id, { height, y });
    }
  }

  for (const layer of layers) {
    for (const lane of orderedLanes) {
      const cell = layer
        .filter((entry) => entry.lane.id === lane.id)
        .sort((left, right) =>
          compareEntriesWithinSlot(left, right, mode, session),
        );

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

  return {
    laneBoundsById,
    nodes: entries.map((entry) => placedById.get(entry.node.id) ?? entry.node),
  };
}

function computeLayerXPositions(
  layers: LayoutEntry[][],
  mode: AttackGraphLayoutMode,
  session?: AttackGraphLayoutSession | null,
): Map<number, number> {
  const positions = new Map<number, number>();
  const minOriginalX = Math.min(
    ...layers.flatMap((layer) => layer.map((entry) => getNodeX(entry.node))),
  );
  let previousX = 0;
  const shouldReuseX = session?.mode === mode;

  for (let layerIndex = 0; layerIndex < layers.length; layerIndex += 1) {
    const layer = layers[layerIndex];
    const reusedX = shouldReuseX ? getAveragePreviousX(layer, session) : null;
    const averageX =
      layer.reduce((total, entry) => total + getNodeX(entry.node), 0) /
        layer.length;
    const desiredX =
      reusedX === null
        ? Math.max(0, averageX - minOriginalX)
        : Math.max(0, reusedX);
    const x =
      layerIndex === 0
        ? 0
        : Math.max(desiredX, previousX + MIN_LAYER_GAP);

    positions.set(layerIndex, x);
    previousX = x;
  }

  return positions;
}

function getAveragePreviousX(
  layer: LayoutEntry[],
  session?: AttackGraphLayoutSession | null,
) {
  if (!session) return null;

  const previousXs = layer
    .map((entry) => session.nodePositionsById.get(entry.node.id)?.x)
    .filter((x): x is number => typeof x === "number");

  if (previousXs.length === 0) {
    return null;
  }

  return previousXs.reduce((total, x) => total + x, 0) / previousXs.length;
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
  mode: AttackGraphLayoutMode,
  session?: AttackGraphLayoutSession | null,
): Map<string, number> {
  const positions = new Map<string, number>();
  let nextY = 0;
  const shouldReuseLaneY = mode === "lane" && session?.mode === "lane";

  for (const lane of orderedLanes) {
    const height = laneHeights.get(lane.id) ?? 0;
    if (height <= 0) continue;

    const previousY = shouldReuseLaneY
      ? session?.laneBoundsById.get(lane.id)?.y
      : undefined;
    const y =
      typeof previousY === "number" ? Math.max(previousY, nextY) : nextY;

    positions.set(lane.id, y);
    nextY = y + height + LANE_GAP;
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

function compareEntriesWithinSlot(
  left: LayoutEntry,
  right: LayoutEntry,
  mode: AttackGraphLayoutMode,
  session?: AttackGraphLayoutSession | null,
) {
  const previousLeft = session?.mode === mode
    ? session.nodePositionsById.get(left.node.id)
    : undefined;
  const previousRight = session?.mode === mode
    ? session.nodePositionsById.get(right.node.id)
    : undefined;

  return (
    (previousLeft?.y ?? getNodeY(left.node)) -
      (previousRight?.y ?? getNodeY(right.node)) ||
    (previousLeft?.x ?? getNodeX(left.node)) -
      (previousRight?.x ?? getNodeX(right.node)) ||
    left.node.displayName.localeCompare(right.node.displayName) ||
    left.node.id.localeCompare(right.node.id)
  );
}

function buildNodeLaneIdById(entries: LayoutEntry[]) {
  return new Map(entries.map((entry) => [entry.node.id, entry.lane.id]));
}

function normalizeLaneBounds(
  laneBoundsById: Map<string, AttackGraphLayoutLaneBounds>,
  offset: AttackGraphPoint,
) {
  return new Map(
    [...laneBoundsById.entries()].map(([laneId, bounds]) => [
      laneId,
      {
        height: bounds.height,
        y: bounds.y - offset.y,
      },
    ]),
  );
}

function getNormalizationOffset(nodes: AttackGraphNodeModel[]): AttackGraphPoint {
  if (nodes.length === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: Math.min(...nodes.map((node) => getNodeX(node))),
    y: Math.min(...nodes.map((node) => getNodeY(node))),
  };
}

function normalizeNodePositions(
  nodes: AttackGraphNodeModel[],
): AttackGraphNodeModel[] {
  if (nodes.length === 0) return nodes;

  const { x: minX, y: minY } = getNormalizationOffset(nodes);

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
