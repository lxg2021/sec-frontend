import type { AttackGraphEdgeModel, AttackGraphNodeModel } from "./attack-graph-data";
import {
  ATTACK_GRAPH_DEFAULT_NODE_HEIGHT,
  ATTACK_GRAPH_NODE_HALO_PADDING,
  ATTACK_GRAPH_NODE_TILE_WIDTH,
} from "../components/attack-graph-node";

const NODE_ICON_RADIUS = 33;
const BEZIER_SAMPLES = 20;
const PENALTY_PER_PENETRATION = 100;

interface NodeCenter {
  id: string;
  centerX: number;
  centerY: number;
  radius: number;
  tile: { x: number; y: number; width: number; height: number };
}

export function computePenetrationPenalty(
  nodes: AttackGraphNodeModel[],
  edges: AttackGraphEdgeModel[],
): number {
  const nodeCenters = buildNodeCenters(nodes);
  const nodeCenterById = new Map(nodeCenters.map((n) => [n.id, n]));

  let totalPenalty = 0;

  for (const edge of edges) {
    if (edge.source === edge.target) continue;

    const source = nodeCenterById.get(edge.source);
    const target = nodeCenterById.get(edge.target);
    if (!source || !target) continue;

    const bezierPoints = sampleBezierApprox(source, target, BEZIER_SAMPLES);
    const penetrated = detectPenetratedNodes(
      bezierPoints,
      nodeCenters,
      edge.source,
      edge.target,
    );

    totalPenalty += penetrated.length * PENALTY_PER_PENETRATION;
  }

  return totalPenalty;
}

function buildNodeCenters(nodes: AttackGraphNodeModel[]): NodeCenter[] {
  return nodes.map((node) => {
    const x = node.position?.x ?? 0;
    const y = node.position?.y ?? 0;
    return {
      id: node.id,
      centerX: x + ATTACK_GRAPH_NODE_TILE_WIDTH / 2,
      centerY: y + ATTACK_GRAPH_NODE_HALO_PADDING + NODE_ICON_RADIUS - 4,
      radius: NODE_ICON_RADIUS,
      tile: {
        x,
        y,
        width: ATTACK_GRAPH_NODE_TILE_WIDTH,
        height: ATTACK_GRAPH_DEFAULT_NODE_HEIGHT,
      },
    };
  });
}

function sampleBezierApprox(
  source: NodeCenter,
  target: NodeCenter,
  samples: number,
): Array<{ x: number; y: number }> {
  const deltaX = target.centerX - source.centerX;
  const deltaY = target.centerY - source.centerY;
  const flowDirection: 1 | -1 = deltaX >= 0 ? 1 : -1;

  const chordLength = Math.hypot(deltaX, deltaY);
  const controlDistance = Math.max(38, Math.min(280, chordLength * 0.38));

  const sourceControl = {
    x: source.centerX + flowDirection * controlDistance,
    y: source.centerY + deltaY * 0.25,
  };
  const targetControl = {
    x: target.centerX - flowDirection * controlDistance,
    y: target.centerY - deltaY * 0.25,
  };

  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    points.push(
      cubicBezierPoint(source, sourceControl, targetControl, target, t),
    );
  }
  return points;
}

function cubicBezierPoint(
  p0: NodeCenter,
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: NodeCenter,
  t: number,
): { x: number; y: number } {
  const inv = 1 - t;
  const inv2 = inv * inv;
  const inv3 = inv2 * inv;
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: inv3 * p0.centerX + 3 * inv2 * t * p1.x + 3 * inv * t2 * p2.x + t3 * p3.centerX,
    y: inv3 * p0.centerY + 3 * inv2 * t * p1.y + 3 * inv * t2 * p2.y + t3 * p3.centerY,
  };
}

function detectPenetratedNodes(
  bezierPoints: Array<{ x: number; y: number }>,
  allNodes: NodeCenter[],
  sourceId: string,
  targetId: string,
): string[] {
  const penetrated = new Set<string>();

  for (let i = 0; i < bezierPoints.length - 1; i++) {
    const p1 = bezierPoints[i];
    const p2 = bezierPoints[i + 1];

    for (const node of allNodes) {
      if (node.id === sourceId || node.id === targetId) continue;
      if (penetrated.has(node.id)) continue;

      if (segmentHitsCircle(p1, p2, node.centerX, node.centerY, node.radius)) {
        penetrated.add(node.id);
      } else if (segmentHitsRect(p1, p2, node.tile)) {
        penetrated.add(node.id);
      }
    }
  }

  return [...penetrated];
}

function segmentHitsCircle(
  a: { x: number; y: number },
  b: { x: number; y: number },
  cx: number,
  cy: number,
  radius: number,
): boolean {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;

  let t = ((cx - a.x) * dx + (cy - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const closestX = a.x + t * dx;
  const closestY = a.y + t * dy;
  const distSq = (closestX - cx) * (closestX - cx) + (closestY - cy) * (closestY - cy);

  return distSq < radius * radius;
}

function segmentHitsRect(
  a: { x: number; y: number },
  b: { x: number; y: number },
  rect: { x: number; y: number; width: number; height: number },
): boolean {
  const left = rect.x;
  const right = rect.x + rect.width;
  const top = rect.y;
  const bottom = rect.y + rect.height;

  if (
    (a.x < left && b.x < left) ||
    (a.x > right && b.x > right) ||
    (a.y < top && b.y < top) ||
    (a.y > bottom && b.y > bottom)
  ) {
    return false;
  }

  const edges = [
    { x1: left, y1: top, x2: right, y2: top },
    { x1: right, y1: top, x2: right, y2: bottom },
    { x1: right, y1: bottom, x2: left, y2: bottom },
    { x1: left, y1: bottom, x2: left, y2: top },
  ];

  for (const edge of edges) {
    if (segmentsCross(a, b, { x: edge.x1, y: edge.y1 }, { x: edge.x2, y: edge.y2 })) {
      return true;
    }
  }

  return false;
}

function segmentsCross(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
  d: { x: number; y: number },
): boolean {
  const o1 = cross(a, b, c);
  const o2 = cross(a, b, d);
  const o3 = cross(c, d, a);
  const o4 = cross(c, d, b);
  return o1 * o2 < 0 && o3 * o4 < 0;
}

function cross(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}
