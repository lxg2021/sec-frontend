import type {
  AttackGraphEdgeModel,
  AttackGraphNodeModel,
} from "./attack-graph-data";
import type { AttackGraphNodePresentationKind } from "./attack-graph-node-types";

export type AttackGraphLayoutLaneId = string;

export interface AttackGraphLayoutLaneConfig {
  id: AttackGraphLayoutLaneId;
  label: string;
  order: number;
  centered?: boolean;
  presentationKinds: AttackGraphNodePresentationKind[];
}

const PROCESS_LANE_KINDS: AttackGraphNodePresentationKind[] = [
  "process",
  "powershell",
  "service",
  "task",
];

const MIN_LANE_NODE_COUNT = 2;
const MERGE_STOP_RATIO = 0.4;

export function buildDynamicLanes(
  nodes: AttackGraphNodeModel[],
  edges: AttackGraphEdgeModel[],
): {
  lanes: AttackGraphLayoutLaneConfig[];
  laneByKind: Map<AttackGraphNodePresentationKind, AttackGraphLayoutLaneConfig>;
} {
  const kinds = collectKinds(nodes);
  if (kinds.length === 0) {
    return { lanes: [], laneByKind: new Map() };
  }

  const matrix = buildCooccurrenceMatrix(kinds, nodes, edges);
  const clusters = hierarchicalCluster(kinds, matrix);
  const lanes = buildLanesFromClusters(clusters, nodes, edges);

  const laneByKind = new Map<AttackGraphNodePresentationKind, AttackGraphLayoutLaneConfig>();
  for (const lane of lanes) {
    for (const kind of lane.presentationKinds) {
      laneByKind.set(kind, lane);
    }
  }

  return { lanes, laneByKind };
}

export function getAttackGraphLayoutLane(
  kind: AttackGraphNodePresentationKind,
  laneByKind: Map<string, AttackGraphLayoutLaneConfig>,
): AttackGraphLayoutLaneConfig | undefined {
  return laneByKind.get(kind);
}

function collectKinds(nodes: AttackGraphNodeModel[]): AttackGraphNodePresentationKind[] {
  const seen = new Set<AttackGraphNodePresentationKind>();
  for (const node of nodes) {
    seen.add(node.presentationKind);
  }
  return [...seen].sort();
}

function buildCooccurrenceMatrix(
  kinds: AttackGraphNodePresentationKind[],
  nodes: AttackGraphNodeModel[],
  edges: AttackGraphEdgeModel[],
): number[][] {
  const kindIndex = new Map(kinds.map((k, i) => [k, i]));
  const nodeKind = new Map<string, AttackGraphNodePresentationKind>();
  for (const node of nodes) {
    nodeKind.set(node.id, node.presentationKind);
  }

  const size = kinds.length;
  const matrix = Array.from({ length: size }, () => new Array<number>(size).fill(0));

  for (const edge of edges) {
    const sourceKind = nodeKind.get(edge.source);
    const targetKind = nodeKind.get(edge.target);
    if (!sourceKind || !targetKind || sourceKind === targetKind) continue;

    const i = kindIndex.get(sourceKind);
    const j = kindIndex.get(targetKind);
    if (i == null || j == null) continue;

    matrix[i][j] += 1;
    matrix[j][i] += 1;
  }

  return matrix;
}

interface Cluster {
  kinds: AttackGraphNodePresentationKind[];
}

function hierarchicalCluster(
  kinds: AttackGraphNodePresentationKind[],
  matrix: number[][],
): AttackGraphNodePresentationKind[][] {
  const kindIndex = new Map(kinds.map((k, i) => [k, i]));
  const clusters: Cluster[] = kinds.map((k) => ({ kinds: [k] }));

  const optimalCount = decideLaneCount(kinds.length, clusters, kindIndex, matrix);
  if (optimalCount >= clusters.length) {
    return clusters.map((c) => c.kinds);
  }

  let lastMergeStrengh = Number.POSITIVE_INFINITY;
  while (clusters.length > optimalCount && clusters.length > 1) {
    let bestI = 0;
    let bestJ = 1;
    let bestStrength = -1;

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const strength = clusterPairStrength(clusters[i], clusters[j], kindIndex, matrix);
        if (strength > bestStrength) {
          bestStrength = strength;
          bestI = i;
          bestJ = j;
        }
      }
    }

    if (bestStrength <= 0) break;
    if (
      lastMergeStrengh !== Number.POSITIVE_INFINITY &&
      bestStrength < lastMergeStrengh * MERGE_STOP_RATIO
    ) {
      break;
    }

    clusters[bestI].kinds.push(...clusters[bestJ].kinds);
    clusters.splice(bestJ, 1);
    lastMergeStrengh = bestStrength;
  }

  return clusters.map((c) => c.kinds);
}

function decideLaneCount(
  kindCount: number,
  clusters: Cluster[],
  kindIndex: Map<AttackGraphNodePresentationKind, number>,
  matrix: number[][],
): number {
  if (kindCount <= 2) return clusters.length;
  if (kindCount <= 5) return Math.max(2, Math.min(clusters.length, 3));
  if (kindCount <= 10) return Math.max(2, Math.min(clusters.length, 4));
  if (kindCount <= 18) return Math.max(2, Math.min(clusters.length, 6));
  return Math.max(2, Math.min(clusters.length, 7));
}

function clusterPairStrength(
  a: Cluster,
  b: Cluster,
  kindIndex: Map<AttackGraphNodePresentationKind, number>,
  matrix: number[][],
): number {
  let total = 0;
  for (const ka of a.kinds) {
    for (const kb of b.kinds) {
      const i = kindIndex.get(ka);
      const j = kindIndex.get(kb);
      if (i != null && j != null) {
        total += matrix[i][j];
      }
    }
  }
  return total;
}

function buildLanesFromClusters(
  clusters: AttackGraphNodePresentationKind[][],
  nodes: AttackGraphNodeModel[],
  edges: AttackGraphEdgeModel[],
): AttackGraphLayoutLaneConfig[] {
  if (clusters.length === 0) return [];
  const nodeKind = new Map<string, AttackGraphNodePresentationKind>();
  for (const node of nodes) {
    nodeKind.set(node.id, node.presentationKind);
  }

  const clusterEdges = clusters.map((clusterKinds, ci) => {
    const kindSet = new Set(clusterKinds);
    let externalEdges = 0;
    for (const edge of edges) {
      const sk = nodeKind.get(edge.source);
      const tk = nodeKind.get(edge.target);
      if (!sk || !tk) continue;
      const sIn = kindSet.has(sk);
      const tIn = kindSet.has(tk);
      if (sIn !== tIn) externalEdges++;
    }

    let internalEdges = 0;
    for (const edge of edges) {
      const sk = nodeKind.get(edge.source);
      const tk = nodeKind.get(edge.target);
      if (sk && tk && kindSet.has(sk) && kindSet.has(tk)) {
        internalEdges++;
      }
    }

    return { ci, externalEdges, internalEdges };
  });

  const centeredIndex = findCenteredIndex(clusters, clusterEdges);
  const above = clusterEdges
    .filter((c) => c.ci < centeredIndex)
    .sort((a, b) => b.externalEdges - a.externalEdges || b.internalEdges - a.internalEdges);
  const below = clusterEdges
    .filter((c) => c.ci > centeredIndex)
    .sort((a, b) => b.externalEdges - a.externalEdges || b.internalEdges - a.internalEdges);

  let order = 0;
  const lanes: AttackGraphLayoutLaneConfig[] = [];

  for (const ce of above) {
    const clusterKinds = clusters[ce.ci];
    lanes.push({
      id: `lane-${ce.ci}`,
      label: clusterLabel(clusterKinds),
      order: order++,
      presentationKinds: clusterKinds,
    });
  }

  const centerKinds = clusters[centeredIndex];
  lanes.push({
    centered: true,
    id: `lane-${centeredIndex}`,
    label: clusterLabel(centerKinds),
    order: order++,
    presentationKinds: centerKinds,
  });

  for (const ce of below) {
    const clusterKinds = clusters[ce.ci];
    lanes.push({
      id: `lane-${ce.ci}`,
      label: clusterLabel(clusterKinds),
      order: order++,
      presentationKinds: clusterKinds,
    });
  }

  return lanes;
}

function findCenteredIndex(
  clusters: AttackGraphNodePresentationKind[][],
  clusterEdges: Array<{ ci: number; externalEdges: number; internalEdges: number }>,
): number {
  for (let i = 0; i < clusters.length; i++) {
    if (clusters[i].some((k) => PROCESS_LANE_KINDS.includes(k))) {
      return i;
    }
  }

  let bestIndex = 0;
  let bestScore = -1;
  for (const ce of clusterEdges) {
    const score = ce.externalEdges + ce.internalEdges * 0.5;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = ce.ci;
    }
  }
  return bestIndex;
}

function clusterLabel(kinds: AttackGraphNodePresentationKind[]): string {
  if (kinds.length === 0) return "Empty";
  if (kinds.length === 1) return labelForKind(kinds[0]);
  const primary = kinds.find((k) => PROCESS_LANE_KINDS.includes(k));
  if (primary) {
    const rest = kinds.filter((k) => k !== primary);
    return rest.length === 0 ? labelForKind(primary) : `${labelForKind(primary)} + ${rest.length}`;
  }
  const sorted = [...kinds].sort();
  if (kinds.length <= 2) return sorted.map(labelForKind).join(" & ");
  return `${labelForKind(sorted[0])} + ${kinds.length - 1}`;
}

function labelForKind(kind: AttackGraphNodePresentationKind): string {
  const labels: Partial<Record<AttackGraphNodePresentationKind, string>> = {
    account: "Account",
    bits: "BITS",
    case: "Case",
    "case-group": "Case Group",
    "case-instance": "Case Instance",
    "credential-theft": "Credential",
    crypto: "Crypto",
    device: "Device",
    "dns-name": "DNS",
    evidence: "Evidence",
    file: "File",
    "file-stream": "Stream",
    host: "Host",
    "host-ref": "Host Ref",
    "ipc-object": "IPC",
    mbr: "MBR",
    "message-hook": "Hook",
    "net-address": "Address",
    "net-endpoint": "Endpoint",
    powershell: "PowerShell",
    process: "Process",
    registry: "Registry",
    service: "Service",
    task: "Task",
    "token-impersonation": "Token",
    "url-resource": "URL",
    volume: "Volume",
    wmi: "WMI",
    unknown: "Unknown",
  };
  return labels[kind] ?? kind;
}
