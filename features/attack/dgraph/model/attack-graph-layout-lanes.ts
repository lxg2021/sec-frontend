import type { AttackGraphNodePresentationKind } from "./attack-graph-node-types";

export type AttackGraphLayoutLaneId =
  | "identity-security"
  | "infrastructure"
  | "process-chain"
  | "file-resource"
  | "registry-resource"
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
    order: 1,
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
    order: 2,
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
    order: 3,
    presentationKinds: ["process", "powershell", "service", "task"],
  },
  {
    id: "file-resource",
    label: "File Resources",
    order: 4,
    presentationKinds: ["file", "file-stream", "volume"],
  },
  {
    id: "registry-resource",
    label: "Registry Resources",
    order: 5,
    presentationKinds: ["registry"],
  },
  {
    id: "ipc-persistence-meta",
    label: "IPC, Persistence & Meta",
    order: 6,
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

export const ATTACK_GRAPH_LAYOUT_LANE_BY_KIND = new Map(
  ATTACK_GRAPH_LAYOUT_LANES.flatMap((lane) =>
    lane.presentationKinds.map((kind) => [kind, lane] as const),
  ),
);

export function getAttackGraphLayoutLane(
  kind: AttackGraphNodePresentationKind,
) {
  return ATTACK_GRAPH_LAYOUT_LANE_BY_KIND.get(kind) ?? ATTACK_GRAPH_LAYOUT_LANES[5];
}
