import type { AttackGraphNodePresentationKind } from "../model/attack-graph-node-types";
import type { AttackGraphNodeFamily } from "../model/attack-graph-node-presentation";
import { getAttackGraphNodePresentation } from "../model/attack-graph-node-presentation";

export interface AttackGraphNodeSize {
  width: number;
  height: number;
  icon: number;
  labelMaxWidth: number;
}

export const ATTACK_GRAPH_NODE_SIZE: AttackGraphNodeSize = {
  width: 176,
  height: 84,
  icon: 58,
  labelMaxWidth: 176,
} as const;

export interface AttackGraphNodeVisualData {
  kind: AttackGraphNodePresentationKind;
  label: string;
  entityType: string;
  entityLabel: string;
  family: AttackGraphNodeFamily;
  image: string;
  evidenceHit: boolean;
  missingFromResponse: boolean;
}

type AttackGraphNodeIcon =
  | "case"
  | "evidence"
  | "process"
  | "identity"
  | "host"
  | "network"
  | "file"
  | "registry"
  | "persistence"
  | "ipc"
  | "security"
  | "unknown";

type AttackGraphNodeInteractionState = "active" | "selected";

export interface AttackGraphNodeStateConfig {
  size?: number | [number, number];
  haloStroke?: string;
  haloStrokeOpacity?: number;
  haloLineWidth?: number;
  haloRadius?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetY?: number;
}

interface AttackGraphNodeFamilyConfig {
  fill: string;
  glow: string;
  haloStroke: string;
  icon: AttackGraphNodeIcon;
  labelFill: string;
  labelSubFill: string;
  state?: Partial<Record<AttackGraphNodeInteractionState, AttackGraphNodeStateConfig>>;
}

export interface AttackGraphNodeKindConfig {
  label: string;
  family: AttackGraphNodeFamily;
  image: string;
  accentColor?: string;
  icon?: AttackGraphNodeIcon;
  size?: Partial<AttackGraphNodeSize>;
  state?: Partial<Record<AttackGraphNodeInteractionState, AttackGraphNodeStateConfig>>;
}

export const ATTACK_GRAPH_NODE_FAMILY_CONFIG: Record<
  AttackGraphNodeFamily,
  AttackGraphNodeFamilyConfig
> = {
  case: {
    fill: "#334155",
    glow: "#94a3b8",
    haloStroke: "#64748b",
    icon: "case",
    labelFill: "#0f172a",
    labelSubFill: "#64748b",
  },
  evidence: {
    fill: "#e11d48",
    glow: "#fb7185",
    haloStroke: "#fb7185",
    icon: "evidence",
    labelFill: "#0f172a",
    labelSubFill: "#64748b",
    state: {
      active: { haloStrokeOpacity: 0.32, haloLineWidth: 12, size: 68 },
      selected: { haloStrokeOpacity: 0.46, haloLineWidth: 15, size: 74 },
    },
  },
  process: {
    fill: "#13a7c5",
    glow: "#38bdf8",
    haloStroke: "#38bdf8",
    icon: "process",
    labelFill: "#0f172a",
    labelSubFill: "#64748b",
  },
  identity: {
    fill: "#6366f1",
    glow: "#818cf8",
    haloStroke: "#818cf8",
    icon: "identity",
    labelFill: "#0f172a",
    labelSubFill: "#64748b",
  },
  host: {
    fill: "#475569",
    glow: "#94a3b8",
    haloStroke: "#94a3b8",
    icon: "host",
    labelFill: "#0f172a",
    labelSubFill: "#64748b",
  },
  network: {
    fill: "#0ea5b7",
    glow: "#22d3ee",
    haloStroke: "#22d3ee",
    icon: "network",
    labelFill: "#0f172a",
    labelSubFill: "#64748b",
  },
  file: {
    fill: "#f59e0b",
    glow: "#fbbf24",
    haloStroke: "#fbbf24",
    icon: "file",
    labelFill: "#0f172a",
    labelSubFill: "#64748b",
  },
  registry: {
    fill: "#8b5cf6",
    glow: "#a78bfa",
    haloStroke: "#a78bfa",
    icon: "registry",
    labelFill: "#0f172a",
    labelSubFill: "#64748b",
  },
  persistence: {
    fill: "#7c3aed",
    glow: "#a78bfa",
    haloStroke: "#a78bfa",
    icon: "persistence",
    labelFill: "#0f172a",
    labelSubFill: "#64748b",
  },
  ipc: {
    fill: "#64748b",
    glow: "#94a3b8",
    haloStroke: "#94a3b8",
    icon: "ipc",
    labelFill: "#0f172a",
    labelSubFill: "#64748b",
  },
  security: {
    fill: "#e11d48",
    glow: "#fb7185",
    haloStroke: "#fb7185",
    icon: "security",
    labelFill: "#0f172a",
    labelSubFill: "#64748b",
    state: {
      active: { haloStrokeOpacity: 0.31, haloLineWidth: 11, size: 66 },
      selected: { haloStrokeOpacity: 0.44, haloLineWidth: 14, size: 72 },
    },
  },
  unknown: {
    fill: "#737373",
    glow: "#a3a3a3",
    haloStroke: "#a3a3a3",
    icon: "unknown",
    labelFill: "#0f172a",
    labelSubFill: "#64748b",
  },
};

export const ATTACK_GRAPH_NODE_KIND_CONFIG: Record<
  AttackGraphNodePresentationKind,
  AttackGraphNodeKindConfig
> = {
  account: {
    label: "Account",
    family: "identity",
    image: "/icons/nodes/account-node.svg",
    accentColor: "#039be5",
    icon: "identity",
  },
  bits: {
    label: "BITS",
    family: "persistence",
    image: "/icons/nodes/bits-job-node.svg",
    accentColor: "#f57c00",
    icon: "persistence",
  },
  "credential-theft": {
    label: "Credential Theft",
    family: "security",
    image: "/icons/nodes/credentials-node.svg",
    accentColor: "#3f51b5",
    icon: "security",
    state: {
      active: { size: 68 },
      selected: { haloLineWidth: 16, shadowBlur: 18, size: 76 },
    },
  },
  crypto: {
    label: "Crypto",
    family: "security",
    image: "/icons/nodes/endecrypt-node.svg",
    accentColor: "#5e35b1",
    icon: "security",
    state: {
      selected: { haloLineWidth: 15, shadowBlur: 18, size: 74 },
    },
  },
  device: {
    label: "Device",
    family: "host",
    image: "/icons/nodes/device-node.svg",
    accentColor: "#455a64",
    icon: "host",
  },
  "dns-name": {
    label: "DNS",
    family: "network",
    image: "/icons/nodes/dns-node.svg",
    accentColor: "#03a9f4",
    icon: "network",
  },
  file: {
    label: "File",
    family: "file",
    image: "/icons/nodes/file-node.svg",
    accentColor: "#ff9800",
    icon: "file",
  },
  "file-stream": {
    label: "File Stream",
    family: "file",
    image: "/icons/nodes/file-stream-node.svg",
    accentColor: "#ffb74d",
    icon: "file",
  },
  host: {
    label: "Host",
    family: "host",
    image: "/icons/nodes/agent-node.svg",
    accentColor: "#388e3c",
    icon: "host",
  },
  "host-ref": {
    label: "Remote Host",
    family: "host",
    image: "/icons/nodes/host-ref-node.svg",
    accentColor: "#388e3c",
    icon: "host",
  },
  "ipc-object": {
    label: "IPC Object",
    family: "ipc",
    image: "/icons/nodes/ipc-object-node.svg",
    accentColor: "#607d8b",
    icon: "ipc",
  },
  mbr: {
    label: "MBR",
    family: "security",
    image: "/icons/nodes/mbr-node.svg",
    accentColor: "#b71c1c",
    icon: "security",
    state: {
      active: { size: 68 },
      selected: { haloLineWidth: 16, shadowBlur: 20, size: 76 },
    },
  },
  "message-hook": {
    label: "Message Hook",
    family: "persistence",
    image: "/icons/nodes/message-node.svg",
    accentColor: "#cddc39",
    icon: "persistence",
  },
  "net-address": {
    label: "Network Address",
    family: "network",
    image: "/icons/nodes/net-node.svg",
    accentColor: "#2196f3",
    icon: "network",
  },
  "net-endpoint": {
    label: "Network Endpoint",
    family: "network",
    image: "/icons/nodes/net-endpoint-node.svg",
    accentColor: "#00acc1",
    icon: "network",
  },
  powershell: {
    label: "PowerShell",
    family: "process",
    image: "/icons/nodes/powershell-node.svg",
    accentColor: "#5391fe",
    icon: "process",
  },
  process: {
    label: "Process",
    family: "process",
    image: "/icons/nodes/process-node.svg",
    accentColor: "#4caf50",
    icon: "process",
  },
  registry: {
    label: "Registry",
    family: "registry",
    image: "/icons/nodes/reg-key-node.svg",
    accentColor: "#53b7b7",
    icon: "registry",
  },
  service: {
    label: "Service",
    family: "persistence",
    image: "/icons/nodes/service-node.svg",
    accentColor: "#ff7043",
    icon: "persistence",
  },
  task: {
    label: "Task",
    family: "persistence",
    image: "/icons/nodes/task-node.svg",
    accentColor: "#9c27b0",
    icon: "persistence",
  },
  "token-impersonation": {
    label: "Token Impersonation",
    family: "identity",
    image: "/icons/nodes/impersonation-token-node.svg",
    accentColor: "#ad1457",
    icon: "identity",
  },
  "url-resource": {
    label: "URL Resource",
    family: "network",
    image: "/icons/nodes/url-node.svg",
    accentColor: "#00bcd4",
    icon: "network",
  },
  volume: {
    label: "Volume",
    family: "file",
    image: "/icons/nodes/volume-node.svg",
    accentColor: "#8bc34a",
    icon: "file",
  },
  wmi: {
    label: "WMI",
    family: "persistence",
    image: "/icons/nodes/wmi-node.svg",
    accentColor: "#00897b",
    icon: "persistence",
  },
  case: {
    label: "Case",
    family: "case",
    image: "/icons/nodes/attack-node.svg",
    accentColor: "#d32f2f",
    icon: "case",
    size: { icon: 62, height: 88 },
    state: {
      active: { size: 68 },
      selected: { haloStrokeOpacity: 0.42, haloLineWidth: 15, size: 78 },
    },
  },
  "case-group": {
    label: "Case Group",
    family: "case",
    image: "/icons/nodes/attack-node.svg",
    accentColor: "#d32f2f",
    icon: "case",
    size: { icon: 62, height: 88 },
    state: {
      active: { size: 68 },
      selected: { haloStrokeOpacity: 0.42, haloLineWidth: 15, size: 78 },
    },
  },
  "case-instance": {
    label: "Case Instance",
    family: "case",
    image: "/icons/nodes/event-node.svg",
    accentColor: "#795548",
    icon: "case",
  },
  evidence: {
    label: "Evidence",
    family: "evidence",
    image: "/icons/nodes/attack-node.svg",
    accentColor: "#d32f2f",
    icon: "evidence",
    size: { icon: 62, height: 88 },
    state: {
      active: { haloLineWidth: 13, size: 70 },
      selected: { haloLineWidth: 17, shadowBlur: 20, size: 80 },
    },
  },
  unknown: {
    label: "Unknown",
    family: "unknown",
    image: "/icons/nodes/event-node.svg",
    accentColor: "#795548",
    icon: "unknown",
    state: {
      active: { haloStrokeOpacity: 0.2, haloLineWidth: 8, size: 60 },
      selected: { haloStrokeOpacity: 0.28, haloLineWidth: 10, size: 64 },
    },
  },
};

export const ATTACK_GRAPH_NODE_DEMO_KINDS = Object.keys(
  ATTACK_GRAPH_NODE_KIND_CONFIG,
) as AttackGraphNodePresentationKind[];

export function toAttackGraphNodeVisualData(
  entityType: string,
  label: string,
  options: {
    evidenceHit?: boolean;
    missingFromResponse?: boolean;
  } = {},
): Record<string, unknown> {
  return { ...buildAttackGraphNodeVisualData(entityType, label, options) };
}

export function getAttackGraphNodeHaloColor(family: AttackGraphNodeFamily) {
  return ATTACK_GRAPH_NODE_FAMILY_CONFIG[family].haloStroke;
}

export function getAttackGraphNodeKindConfig(
  kind: AttackGraphNodePresentationKind,
) {
  return ATTACK_GRAPH_NODE_KIND_CONFIG[kind] ?? ATTACK_GRAPH_NODE_KIND_CONFIG.unknown;
}

export function getAttackGraphNodeSize(config: AttackGraphNodeKindConfig) {
  return {
    ...ATTACK_GRAPH_NODE_SIZE,
    ...config.size,
  };
}

export function getAttackGraphNodeMergedStateConfig(
  nodeConfig: AttackGraphNodeKindConfig,
  familyConfig: AttackGraphNodeFamilyConfig,
  state: AttackGraphNodeInteractionState,
  size = getAttackGraphNodeSize(nodeConfig),
): Required<AttackGraphNodeStateConfig> {
  return {
    ...getAttackGraphNodeDefaultStateConfig(familyConfig, state, size),
    ...familyConfig.state?.[state],
    ...nodeConfig.state?.[state],
  };
}

export function getAttackGraphNodeDemoItems() {
  return ATTACK_GRAPH_NODE_DEMO_KINDS.map((kind) => {
    const nodeConfig = getAttackGraphNodeKindConfig(kind);
    const familyConfig = ATTACK_GRAPH_NODE_FAMILY_CONFIG[nodeConfig.family];

    return {
      kind,
      ...nodeConfig,
      size: getAttackGraphNodeSize(nodeConfig),
      color: nodeConfig.accentColor ?? familyConfig.fill,
      glow: familyConfig.glow,
      labelFill: familyConfig.labelFill,
      labelSubFill: familyConfig.labelSubFill,
      activeState: getAttackGraphNodeMergedStateConfig(
        nodeConfig,
        familyConfig,
        "active",
      ),
      selectedState: getAttackGraphNodeMergedStateConfig(
        nodeConfig,
        familyConfig,
        "selected",
      ),
    };
  });
}

function getAttackGraphNodeDefaultStateConfig(
  familyConfig: AttackGraphNodeFamilyConfig,
  state: AttackGraphNodeInteractionState,
  size: AttackGraphNodeSize,
): Required<AttackGraphNodeStateConfig> {
  return {
    haloStroke: familyConfig.haloStroke,
    haloStrokeOpacity: state === "selected" ? 0.36 : 0.26,
    haloLineWidth: state === "selected" ? 12 : 10,
    haloRadius: size.icon,
    size: state === "selected" ? size.icon + 10 : size.icon + 6,
    shadowColor: toRgba(familyConfig.glow, state === "selected" ? 0.28 : 0.18),
    shadowBlur: state === "selected" ? 16 : 12,
    shadowOffsetY: state === "selected" ? 6 : 4,
  };
}

function buildAttackGraphNodeVisualData(
  entityType: string,
  label: string,
  options: {
    evidenceHit?: boolean;
    missingFromResponse?: boolean;
  } = {},
): AttackGraphNodeVisualData {
  const presentation = getAttackGraphNodePresentation(entityType);
  const nodeConfig = getAttackGraphNodeKindConfig(presentation.kind);
  return {
    kind: presentation.kind,
    label,
    entityType,
    entityLabel: nodeConfig.label,
    family: nodeConfig.family,
    image: nodeConfig.image,
    evidenceHit: Boolean(options.evidenceHit),
    missingFromResponse: Boolean(options.missingFromResponse),
  };
}

function toRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  if (!/^[\da-f]{6}$/i.test(normalized)) {
    return `rgba(15, 23, 42, ${alpha})`;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
