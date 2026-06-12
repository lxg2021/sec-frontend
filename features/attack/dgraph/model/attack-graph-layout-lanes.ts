import type { AttackGraphNodeModel } from "./attack-graph-data";
import type { AttackGraphNodePresentationKind } from "./attack-graph-node-types";

export type AttackGraphLayoutLaneId =
  | "identity-security"
  | "infrastructure"
  | "process-chain"
  | "files"
  | "registry"
  | "ipc-persistence-meta";

export interface AttackGraphLayoutLaneConfig {
  id: AttackGraphLayoutLaneId;
  label: string;
  order: number;
  centered?: boolean;
  presentationKinds: AttackGraphNodePresentationKind[];
}

export const ATTACK_GRAPH_LAYOUT_LANES: AttackGraphLayoutLaneConfig[] = [
  {
    id: "identity-security",
    label: "Identity & Security",
    order: 0,
    presentationKinds: [
      "account",
      "token-impersonation",
      "credential-theft",
      "crypto",
      "mbr",
    ],
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    order: 1,
    presentationKinds: [
      "dns-name",
      "net-address",
      "net-endpoint",
      "url-resource",
      "host",
      "host-ref",
      "device",
    ],
  },
  {
    centered: true,
    id: "process-chain",
    label: "Process Chain",
    order: 2,
    presentationKinds: ["process", "powershell", "service", "task"],
  },
  {
    id: "files",
    label: "Files",
    order: 3,
    presentationKinds: ["file", "file-stream", "volume"],
  },
  {
    id: "registry",
    label: "Registry",
    order: 4,
    presentationKinds: ["registry"],
  },
  {
    id: "ipc-persistence-meta",
    label: "IPC, Persistence & Meta",
    order: 5,
    presentationKinds: [
      "ipc-object",
      "bits",
      "message-hook",
      "wmi",
      "case",
      "case-group",
      "case-instance",
      "evidence",
      "unknown",
    ],
  },
];

export const ATTACK_GRAPH_FALLBACK_LAYOUT_LANE =
  ATTACK_GRAPH_LAYOUT_LANES[ATTACK_GRAPH_LAYOUT_LANES.length - 1];

const LANE_BY_KIND = new Map<
  AttackGraphNodePresentationKind,
  AttackGraphLayoutLaneConfig
>(
  ATTACK_GRAPH_LAYOUT_LANES.flatMap((lane) =>
    lane.presentationKinds.map((kind) => [kind, lane] as const),
  ),
);

export function buildActiveLayoutLanes(
  nodes: AttackGraphNodeModel[],
): {
  lanes: AttackGraphLayoutLaneConfig[];
  laneByKind: Map<AttackGraphNodePresentationKind, AttackGraphLayoutLaneConfig>;
} {
  const activeLaneIds = new Set<AttackGraphLayoutLaneId>();

  for (const node of nodes) {
    const lane = LANE_BY_KIND.get(node.presentationKind);
    if (lane) {
      activeLaneIds.add(lane.id);
    }
  }

  const lanes = ATTACK_GRAPH_LAYOUT_LANES.filter((lane) =>
    activeLaneIds.has(lane.id),
  );
  const laneByKind = new Map<
    AttackGraphNodePresentationKind,
    AttackGraphLayoutLaneConfig
  >();

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
