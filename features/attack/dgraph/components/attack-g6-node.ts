import type { NodeData } from "@antv/g6";

import type { AttackGraphNodePresentationKind } from "../model/attack-graph-node-types";
import type { AttackGraphNodeFamily } from "../model/attack-graph-node-presentation";
import { getAttackGraphNodePresentation } from "../model/attack-graph-node-presentation";

export interface AttackG6NodeSize {
  width: number;
  height: number;
  icon: number;
  labelMaxWidth: number;
}

export const ATTACK_G6_NODE_SIZE: AttackG6NodeSize = {
  width: 176,
  height: 84,
  icon: 58,
  labelMaxWidth: 176,
} as const;

export interface AttackG6NodeData {
  kind: AttackGraphNodePresentationKind;
  label: string;
  entityType: string;
  entityLabel: string;
  family: AttackGraphNodeFamily;
  image: string;
  evidenceHit: boolean;
  missingFromResponse: boolean;
}

type AttackG6NodeIcon =
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

type AttackG6NodeInteractionState = "active" | "selected";

export interface AttackG6NodeStateConfig {
  size?: number | [number, number];
  haloStroke?: string;
  haloStrokeOpacity?: number;
  haloLineWidth?: number;
  haloRadius?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetY?: number;
}

interface AttackG6NodeFamilyConfig {
  fill: string;
  glow: string;
  haloStroke: string;
  icon: AttackG6NodeIcon;
  labelFill: string;
  labelSubFill: string;
  state?: Partial<Record<AttackG6NodeInteractionState, AttackG6NodeStateConfig>>;
}

export interface AttackG6NodeKindConfig {
  label: string;
  family: AttackGraphNodeFamily;
  image: string;
  accentColor?: string;
  icon?: AttackG6NodeIcon;
  size?: Partial<AttackG6NodeSize>;
  state?: Partial<Record<AttackG6NodeInteractionState, AttackG6NodeStateConfig>>;
}

export const ATTACK_G6_NODE_FAMILY_CONFIG: Record<
  AttackGraphNodeFamily,
  AttackG6NodeFamilyConfig
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

export const ATTACK_G6_NODE_KIND_CONFIG: Record<
  AttackGraphNodePresentationKind,
  AttackG6NodeKindConfig
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

export const ATTACK_G6_NODE_DEMO_KINDS = Object.keys(
  ATTACK_G6_NODE_KIND_CONFIG,
) as AttackGraphNodePresentationKind[];

export function toAttackG6NodeData(
  entityType: string,
  label: string,
  options: {
    evidenceHit?: boolean;
    missingFromResponse?: boolean;
  } = {},
): Record<string, unknown> {
  return { ...buildAttackG6NodeData(entityType, label, options) };
}

export function getAttackG6NodeStateStyle(
  datum: NodeData,
  state: AttackG6NodeInteractionState,
): Record<string, unknown> {
  const nodeData = readNodeData(datum.data);
  const nodeConfig = getAttackG6NodeKindConfig(nodeData.kind);
  const familyConfig = ATTACK_G6_NODE_FAMILY_CONFIG[nodeConfig.family];
  const size = getAttackG6NodeSize(nodeConfig);
  const stateConfig = getAttackG6NodeMergedStateConfig(
    nodeConfig,
    familyConfig,
    state,
    size,
  );

  return {
    halo: true,
    ...stateConfig,
    badge: true,
    badges: getAttackG6NodeBadges(nodeData, state === "selected"),
  };
}

export function getAttackG6NodeStyle(datum: NodeData): Record<string, unknown> {
  const nodeData = readNodeData(datum.data);
  const nodeConfig = getAttackG6NodeKindConfig(nodeData.kind);
  const familyConfig = ATTACK_G6_NODE_FAMILY_CONFIG[nodeConfig.family];
  const size = getAttackG6NodeSize(nodeConfig);
  const image = nodeData.image || nodeConfig.image;

  return {
    size: [size.icon, size.icon],
    src:
      image ||
      createAttackG6NodeImage(
        nodeData,
        familyConfig,
        nodeConfig.icon ?? familyConfig.icon,
      ),
    opacity: nodeData.missingFromResponse ? 0.5 : 1,
    radius: 999,
    fill: "transparent",
    stroke: "transparent",
    lineWidth: 0,
    shadowColor: toRgba(familyConfig.glow, 0.2),
    shadowBlur: 14,
    shadowOffsetY: 5,
    icon: false,
    label: true,
    labelText: nodeData.label || String(datum.id),
    labelPlacement: "bottom",
    labelOffsetY: 10,
    labelFontSize: 12,
    labelFontWeight: 700,
    labelFill: familyConfig.labelFill,
    labelMaxWidth: size.labelMaxWidth,
    labelWordWrap: true,
    badge: nodeData.evidenceHit,
    badges: getAttackG6NodeBadges(nodeData, false),
  };
}

export function getAttackG6NodeHaloColor(family: AttackGraphNodeFamily) {
  return ATTACK_G6_NODE_FAMILY_CONFIG[family].haloStroke;
}

export function getAttackG6NodeKindConfig(
  kind: AttackGraphNodePresentationKind,
) {
  return ATTACK_G6_NODE_KIND_CONFIG[kind] ?? ATTACK_G6_NODE_KIND_CONFIG.unknown;
}

export function getAttackG6NodeSize(config: AttackG6NodeKindConfig) {
  return {
    ...ATTACK_G6_NODE_SIZE,
    ...config.size,
  };
}

export function getAttackG6NodeMergedStateConfig(
  nodeConfig: AttackG6NodeKindConfig,
  familyConfig: AttackG6NodeFamilyConfig,
  state: AttackG6NodeInteractionState,
  size = getAttackG6NodeSize(nodeConfig),
): Required<AttackG6NodeStateConfig> {
  return {
    ...getAttackG6NodeDefaultStateConfig(familyConfig, state, size),
    ...familyConfig.state?.[state],
    ...nodeConfig.state?.[state],
  };
}

export function getAttackG6NodeDemoItems() {
  return ATTACK_G6_NODE_DEMO_KINDS.map((kind) => {
    const nodeConfig = getAttackG6NodeKindConfig(kind);
    const familyConfig = ATTACK_G6_NODE_FAMILY_CONFIG[nodeConfig.family];

    return {
      kind,
      ...nodeConfig,
      size: getAttackG6NodeSize(nodeConfig),
      color: nodeConfig.accentColor ?? familyConfig.fill,
      glow: familyConfig.glow,
      labelFill: familyConfig.labelFill,
      labelSubFill: familyConfig.labelSubFill,
      activeState: getAttackG6NodeMergedStateConfig(
        nodeConfig,
        familyConfig,
        "active",
      ),
      selectedState: getAttackG6NodeMergedStateConfig(
        nodeConfig,
        familyConfig,
        "selected",
      ),
    };
  });
}

function getAttackG6NodeDefaultStateConfig(
  familyConfig: AttackG6NodeFamilyConfig,
  state: AttackG6NodeInteractionState,
  size: AttackG6NodeSize,
): Required<AttackG6NodeStateConfig> {
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

function getAttackG6NodeBadges(
  nodeData: AttackG6NodeData,
  selected: boolean,
) {
  const badges: Record<string, unknown>[] = [];

  if (nodeData.evidenceHit) {
    badges.push({
      text: "!",
      placement: "right-top",
      backgroundFill: "#ffffff",
      stroke: "#fecdd3",
      lineWidth: 1,
      fill: "#e11d48",
      fontSize: 12,
      fontWeight: 800,
      radius: 10,
      padding: [2, 5],
      offsetX: 3,
      offsetY: -3,
    });
  }

  if (selected) {
    badges.push({
      text: "✓",
      placement: "right-bottom",
      backgroundFill: "#2563eb",
      stroke: "#ffffff",
      lineWidth: 2,
      fill: "#ffffff",
      fontSize: 11,
      fontWeight: 900,
      radius: 11,
      padding: [2, 5],
      offsetX: 4,
      offsetY: 4,
      shadowColor: "rgba(37, 99, 235, 0.28)",
      shadowBlur: 8,
      shadowOffsetY: 2,
    });
  }

  return badges;
}

function readNodeData(value: unknown): AttackG6NodeData {
  const record = readRecord(value);
  const entityType = readString(record.entityType);
  const fallback = buildAttackG6NodeData(
    entityType,
    readString(record.label) || "Unknown",
    {
      evidenceHit: readBoolean(record.evidenceHit),
      missingFromResponse: readBoolean(record.missingFromResponse),
    },
  );
  const family = readString(record.family);
  const kind = readString(record.kind);
  const resolvedKind = isAttackGraphNodePresentationKind(kind)
    ? kind
    : fallback.kind;
  const nodeConfig = getAttackG6NodeKindConfig(resolvedKind);

  return {
    ...fallback,
    kind: resolvedKind,
    entityLabel: readString(record.entityLabel) || fallback.entityLabel,
    family: isAttackGraphNodeFamily(family) ? family : nodeConfig.family,
    image: readString(record.image) || nodeConfig.image || fallback.image,
  };
}

function buildAttackG6NodeData(
  entityType: string,
  label: string,
  options: {
    evidenceHit?: boolean;
    missingFromResponse?: boolean;
  } = {},
): AttackG6NodeData {
  const presentation = getAttackGraphNodePresentation(entityType);
  const nodeConfig = getAttackG6NodeKindConfig(presentation.kind);
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

function isAttackGraphNodeFamily(value: string): value is AttackGraphNodeFamily {
  return value in ATTACK_G6_NODE_FAMILY_CONFIG;
}

function isAttackGraphNodePresentationKind(
  value: string,
): value is AttackGraphNodePresentationKind {
  return value in ATTACK_G6_NODE_KIND_CONFIG;
}

function createAttackG6NodeImage(
  nodeData: AttackG6NodeData,
  config: AttackG6NodeFamilyConfig,
  icon: AttackG6NodeIcon,
) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="58" height="58" viewBox="0 0 58 58">
      <defs>
        <filter id="shadow" x="-30%" y="-25%" width="160%" height="170%">
          <feDropShadow dx="0" dy="4" stdDeviation="3.5" flood-color="${config.glow}" flood-opacity="0.22"/>
        </filter>
      </defs>
      <circle cx="29" cy="29" r="24" fill="${config.fill}" filter="url(#shadow)"/>
      <circle cx="29" cy="29" r="23" fill="none" stroke="#ffffff" stroke-opacity="0.58" stroke-width="1.5"/>
      <g fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        ${getAttackG6NodeIconSvg(icon)}
      </g>
      ${
        nodeData.missingFromResponse
          ? '<circle cx="44" cy="14" r="4" fill="#ffffff" fill-opacity="0.78"/>'
          : ""
      }
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function getAttackG6NodeIconSvg(icon: AttackG6NodeIcon) {
  switch (icon) {
    case "case":
      return '<path d="M20 22h18v14H20z"/><path d="M24 22v-4h10v4"/><path d="M24 29h10"/>';
    case "evidence":
      return '<path d="M29 16v17"/><path d="M22 24l7-8 7 8"/><path d="M21 38h16"/>';
    case "process":
      return '<rect x="18" y="19" width="22" height="20" rx="4"/><path d="M24 25h10"/><path d="M24 31h6"/><path d="M23 16v3M29 16v3M35 16v3M23 39v3M29 39v3M35 39v3"/>';
    case "identity":
      return '<circle cx="29" cy="23" r="5"/><path d="M19 39c1.8-5.4 5.2-8 10-8s8.2 2.6 10 8"/>';
    case "host":
      return '<rect x="19" y="18" width="20" height="16" rx="2"/><path d="M25 40h8"/><path d="M29 34v6"/>';
    case "network":
      return '<circle cx="20" cy="29" r="4"/><circle cx="38" cy="20" r="4"/><circle cx="38" cy="38" r="4"/><path d="M24 27l10-5M24 31l10 5"/>';
    case "file":
      return '<path d="M22 17h10l6 6v18H22z"/><path d="M32 17v7h6"/><path d="M26 31h8"/><path d="M26 36h5"/>';
    case "registry":
      return '<rect x="18" y="18" width="9" height="9" rx="2"/><rect x="31" y="18" width="9" height="9" rx="2"/><rect x="18" y="31" width="9" height="9" rx="2"/><rect x="31" y="31" width="9" height="9" rx="2"/>';
    case "persistence":
      return '<path d="M19 22h20"/><path d="M22 18h14l3 4-3 4H22l-3-4z"/><path d="M24 31h10"/><path d="M20 38h18"/>';
    case "ipc":
      return '<path d="M20 23h18v12H20z"/><path d="M17 29h3M38 29h3"/><path d="M24 19v4M34 19v4M24 35v4M34 35v4"/>';
    case "security":
      return '<path d="M29 17l11 5v7c0 6.5-4.2 10.4-11 13-6.8-2.6-11-6.5-11-13v-7z"/><path d="M29 24v7"/><path d="M29 36h.01"/>';
    case "unknown":
      return '<path d="M24 24a5 5 0 0 1 10 1c0 4-5 4-5 8"/><path d="M29 39h.01"/>';
    default:
      return '<circle cx="29" cy="29" r="9"/>';
  }
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

function readRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false;
}
