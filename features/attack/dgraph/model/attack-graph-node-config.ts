import type {
  AttackGraphEntityPresentationKind,
  AttackGraphEntityType,
  AttackGraphNodePresentationKind,
} from "./attack-graph-node-types";
import { getAttackGraphNodePresentationKind } from "./attack-graph-node-types";

export interface AttackGraphNodeSize {
  width: number;
  height: number;
  icon: number;
  labelMaxWidth: number;
}

export const ATTACK_GRAPH_NODE_SIZE: AttackGraphNodeSize = {
  width: 112,
  height: 84,
  icon: 58,
  labelMaxWidth: 112,
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

export type AttackGraphNodeFamily =
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
  priority: number;
  accentColor?: string;
  icon?: AttackGraphNodeIcon;
  size?: Partial<AttackGraphNodeSize>;
  state?: Partial<Record<AttackGraphNodeInteractionState, AttackGraphNodeStateConfig>>;
}

export interface AttackGraphEntityNodeDisplayNameInput {
  entityType: AttackGraphEntityType;
  key: string;
  displayName: string;
  properties: Record<string, string>;
}

export interface AttackGraphNodeDisplayNameInput {
  entityType: string | null | undefined;
  key?: string | null;
  displayName?: string | null;
  properties?: Record<string, string> | null;
}

export type AttackGraphEntityNodeDisplayNameExtractor = (
  input: AttackGraphEntityNodeDisplayNameInput,
) => string;

export interface AttackGraphEntityNodeConfig {
  label: string;
  presentationKind: AttackGraphEntityPresentationKind;
  extractDisplayName: AttackGraphEntityNodeDisplayNameExtractor;
}

export const ATTACK_GRAPH_ENTITY_NODE_CONFIG: Record<
  AttackGraphEntityType,
  AttackGraphEntityNodeConfig
> = {
  Account: {
    label: "Account",
    presentationKind: "account",
    extractDisplayName: extractAccountDisplayName,
  },
  AccountGroup: {
    label: "Account Group",
    presentationKind: "account",
    extractDisplayName: extractAccountGroupDisplayName,
  },
  Bits: {
    label: "BITS",
    presentationKind: "bits",
    extractDisplayName: extractBitsDisplayName,
  },
  CredentialTheft: {
    label: "Credential Theft",
    presentationKind: "credential-theft",
    extractDisplayName: extractCredentialTheftDisplayName,
  },
  Crypto: {
    label: "Crypto",
    presentationKind: "crypto",
    extractDisplayName: extractCryptoDisplayName,
  },
  Device: {
    label: "Device",
    presentationKind: "device",
    extractDisplayName: extractDeviceDisplayName,
  },
  DnsName: {
    label: "DNS Name",
    presentationKind: "dns-name",
    extractDisplayName: extractDnsNameDisplayName,
  },
  File: {
    label: "File",
    presentationKind: "file",
    extractDisplayName: extractFileDisplayName,
  },
  FileMapping: {
    label: "File Mapping",
    presentationKind: "ipc-object",
    extractDisplayName: extractFileMappingDisplayName,
  },
  FileStream: {
    label: "File Stream",
    presentationKind: "file-stream",
    extractDisplayName: extractFileStreamDisplayName,
  },
  Host: {
    label: "Host",
    presentationKind: "host",
    extractDisplayName: extractHostDisplayName,
  },
  HostRef: {
    label: "Host Reference",
    presentationKind: "host-ref",
    extractDisplayName: extractHostRefDisplayName,
  },
  MailSlot: {
    label: "MailSlot",
    presentationKind: "ipc-object",
    extractDisplayName: extractMailSlotDisplayName,
  },
  Mbr: {
    label: "MBR",
    presentationKind: "mbr",
    extractDisplayName: extractMbrDisplayName,
  },
  MessageHook: {
    label: "Message Hook",
    presentationKind: "message-hook",
    extractDisplayName: extractMessageHookDisplayName,
  },
  NamedEvent: {
    label: "Named Event",
    presentationKind: "ipc-object",
    extractDisplayName: extractNamedEventDisplayName,
  },
  NamedPipe: {
    label: "Named Pipe",
    presentationKind: "ipc-object",
    extractDisplayName: extractNamedPipeDisplayName,
  },
  NetAddress: {
    label: "Network Address",
    presentationKind: "net-address",
    extractDisplayName: extractNetAddressDisplayName,
  },
  NetEndpoint: {
    label: "Network Endpoint",
    presentationKind: "net-endpoint",
    extractDisplayName: extractNetEndpointDisplayName,
  },
  PowerShellExecution: {
    label: "PowerShell Execution",
    presentationKind: "powershell",
    extractDisplayName: extractPowerShellExecutionDisplayName,
  },
  Process: {
    label: "Process",
    presentationKind: "process",
    extractDisplayName: extractProcessDisplayName,
  },
  RegistryKey: {
    label: "Registry Key",
    presentationKind: "registry",
    extractDisplayName: extractRegistryKeyDisplayName,
  },
  RegistryValue: {
    label: "Registry Value",
    presentationKind: "registry",
    extractDisplayName: extractRegistryValueDisplayName,
  },
  ScheduledJob: {
    label: "Scheduled Job",
    presentationKind: "task",
    extractDisplayName: extractScheduledJobDisplayName,
  },
  Service: {
    label: "Service",
    presentationKind: "service",
    extractDisplayName: extractServiceDisplayName,
  },
  Task: {
    label: "Task",
    presentationKind: "task",
    extractDisplayName: extractTaskDisplayName,
  },
  TokenImpersonation: {
    label: "Token Impersonation",
    presentationKind: "token-impersonation",
    extractDisplayName: extractTokenImpersonationDisplayName,
  },
  URLResource: {
    label: "URL Resource",
    presentationKind: "url-resource",
    extractDisplayName: extractUrlResourceDisplayName,
  },
  Volume: {
    label: "Volume",
    presentationKind: "volume",
    extractDisplayName: extractVolumeDisplayName,
  },
  WmiClass: {
    label: "WMI Class",
    presentationKind: "wmi",
    extractDisplayName: extractWmiClassDisplayName,
  },
  WmiConsumer: {
    label: "WMI Consumer",
    presentationKind: "wmi",
    extractDisplayName: extractWmiConsumerDisplayName,
  },
  WmiExecute: {
    label: "WMI Execute",
    presentationKind: "wmi",
    extractDisplayName: extractWmiExecuteDisplayName,
  },
  WmiFilter: {
    label: "WMI Filter",
    presentationKind: "wmi",
    extractDisplayName: extractWmiFilterDisplayName,
  },
  WmiQuery: {
    label: "WMI Query",
    presentationKind: "wmi",
    extractDisplayName: extractWmiQueryDisplayName,
  },
};

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
    priority: 58,
    accentColor: "#039be5",
    icon: "identity",
  },
  bits: {
    label: "BITS",
    family: "persistence",
    image: "/icons/nodes/bits-job-node.svg",
    priority: 54,
    accentColor: "#f57c00",
    icon: "persistence",
  },
  "credential-theft": {
    label: "Credential Theft",
    family: "security",
    image: "/icons/nodes/credentials-node.svg",
    priority: 92,
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
    priority: 78,
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
    priority: 52,
    accentColor: "#455a64",
    icon: "host",
  },
  "dns-name": {
    label: "DNS",
    family: "network",
    image: "/icons/nodes/dns-node.svg",
    priority: 45,
    accentColor: "#03a9f4",
    icon: "network",
  },
  file: {
    label: "File",
    family: "file",
    image: "/icons/nodes/file-node.svg",
    priority: 50,
    accentColor: "#ff9800",
    icon: "file",
  },
  "file-stream": {
    label: "File Stream",
    family: "file",
    image: "/icons/nodes/file-stream-node.svg",
    priority: 56,
    accentColor: "#ffb74d",
    icon: "file",
  },
  host: {
    label: "Host",
    family: "host",
    image: "/icons/nodes/agent-node.svg",
    priority: 62,
    accentColor: "#388e3c",
    icon: "host",
  },
  "host-ref": {
    label: "Remote Host",
    family: "host",
    image: "/icons/nodes/host-ref-node.svg",
    priority: 60,
    accentColor: "#388e3c",
    icon: "host",
  },
  "ipc-object": {
    label: "IPC Object",
    family: "ipc",
    image: "/icons/nodes/ipc-object-node.svg",
    priority: 44,
    accentColor: "#607d8b",
    icon: "ipc",
  },
  mbr: {
    label: "MBR",
    family: "security",
    image: "/icons/nodes/mbr-node.svg",
    priority: 86,
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
    priority: 74,
    accentColor: "#cddc39",
    icon: "persistence",
  },
  "net-address": {
    label: "Network Address",
    family: "network",
    image: "/icons/nodes/net-node.svg",
    priority: 46,
    accentColor: "#2196f3",
    icon: "network",
  },
  "net-endpoint": {
    label: "Network Endpoint",
    family: "network",
    image: "/icons/nodes/net-endpoint-node.svg",
    priority: 48,
    accentColor: "#00acc1",
    icon: "network",
  },
  powershell: {
    label: "PowerShell",
    family: "process",
    image: "/icons/nodes/powershell-node.svg",
    priority: 82,
    accentColor: "#5391fe",
    icon: "process",
  },
  process: {
    label: "Process",
    family: "process",
    image: "/icons/nodes/process-node.svg",
    priority: 90,
    accentColor: "#4caf50",
    icon: "process",
  },
  registry: {
    label: "Registry",
    family: "registry",
    image: "/icons/nodes/reg-key-node.svg",
    priority: 55,
    accentColor: "#53b7b7",
    icon: "registry",
  },
  service: {
    label: "Service",
    family: "persistence",
    image: "/icons/nodes/service-node.svg",
    priority: 66,
    accentColor: "#ff7043",
    icon: "persistence",
  },
  task: {
    label: "Task",
    family: "persistence",
    image: "/icons/nodes/task-node.svg",
    priority: 64,
    accentColor: "#9c27b0",
    icon: "persistence",
  },
  "token-impersonation": {
    label: "Token Impersonation",
    family: "identity",
    image: "/icons/nodes/impersonation-token-node.svg",
    priority: 80,
    accentColor: "#ad1457",
    icon: "identity",
  },
  "url-resource": {
    label: "URL Resource",
    family: "network",
    image: "/icons/nodes/url-node.svg",
    priority: 47,
    accentColor: "#00bcd4",
    icon: "network",
  },
  volume: {
    label: "Volume",
    family: "file",
    image: "/icons/nodes/volume-node.svg",
    priority: 40,
    accentColor: "#8bc34a",
    icon: "file",
  },
  wmi: {
    label: "WMI",
    family: "persistence",
    image: "/icons/nodes/wmi-node.svg",
    priority: 76,
    accentColor: "#00897b",
    icon: "persistence",
  },
  case: {
    label: "Case",
    family: "case",
    image: "/icons/nodes/attack-node.svg",
    priority: 100,
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
    priority: 98,
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
    priority: 96,
    accentColor: "#795548",
    icon: "case",
  },
  evidence: {
    label: "Evidence",
    family: "evidence",
    image: "/icons/nodes/attack-node.svg",
    priority: 94,
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
    priority: 1,
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

export function getAttackGraphEntityNodeDisplayName({
  entityType,
  key,
  displayName,
  properties,
}: AttackGraphNodeDisplayNameInput) {
  const normalizedEntityType = stringValue(entityType);
  const normalizedKey = stringValue(key);
  const normalizedDisplayName = stringValue(displayName);
  const normalizedProperties = properties ?? {};

  if (normalizedEntityType in ATTACK_GRAPH_ENTITY_NODE_CONFIG) {
    const typedEntityType = normalizedEntityType as AttackGraphEntityType;
    return (
      ATTACK_GRAPH_ENTITY_NODE_CONFIG[
        typedEntityType
      ].extractDisplayName({
        entityType: typedEntityType,
        key: normalizedKey,
        displayName: normalizedDisplayName,
        properties: normalizedProperties,
      }) ||
      normalizedDisplayName ||
      normalizedKey
    );
  }

  return normalizedDisplayName || normalizedKey;
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
  const kind = getAttackGraphNodePresentationKind(entityType);
  const nodeConfig = getAttackGraphNodeKindConfig(kind);
  return {
    kind,
    label,
    entityType,
    entityLabel: nodeConfig.label,
    family: nodeConfig.family,
    image: nodeConfig.image,
    evidenceHit: Boolean(options.evidenceHit),
    missingFromResponse: Boolean(options.missingFromResponse),
  };
}

function extractAccountDisplayName(input: AttackGraphEntityNodeDisplayNameInput) {
  const user = firstValue(input, ["user"]);
  const domain = firstValue(input, ["domain"]);
  if (domain && user && !user.includes("\\")) {
    return `${domain}\\${user}`;
  }
  return user || fallback(input);
}

function extractAccountGroupDisplayName(
  input: AttackGraphEntityNodeDisplayNameInput,
) {
  return firstValue(input, ["group_name"]) || fallback(input);
}

function extractBitsDisplayName(input: AttackGraphEntityNodeDisplayNameInput) {
  return firstValue(input, ["job_name", "job_id"]) || fallback(input);
}

function extractCredentialTheftDisplayName(
  input: AttackGraphEntityNodeDisplayNameInput,
) {
  return firstValue(input, ["cred_desc", "cred_type"]) || fallback(input);
}

function extractCryptoDisplayName(input: AttackGraphEntityNodeDisplayNameInput) {
  return (
    firstValue(input, [
      "crypt_flag_description",
      "operation_kind",
      "crypt_flag",
    ]) || fallback(input)
  );
}

function extractDeviceDisplayName(input: AttackGraphEntityNodeDisplayNameInput) {
  return (
    firstValue(input, ["device_description", "device_guid", "hid"]) ||
    fallback(input)
  );
}

function extractDnsNameDisplayName(input: AttackGraphEntityNodeDisplayNameInput) {
  const domain = firstValue(input, ["domain"]);
  return domain ? hostLike(domain) : fallback(input);
}

function extractFileDisplayName(input: AttackGraphEntityNodeDisplayNameInput) {
  return basename(
    firstValue(input, ["file_name", "org_file_name", "description"]) ||
      fallback(input),
  );
}

function extractFileMappingDisplayName(
  input: AttackGraphEntityNodeDisplayNameInput,
) {
  return objectLeaf(firstValue(input, ["file_mapping_name"]) || fallback(input));
}

function extractFileStreamDisplayName(
  input: AttackGraphEntityNodeDisplayNameInput,
) {
  const streamName = firstValue(input, ["stream_name"]);
  const fileName = basename(firstValue(input, ["base_path"]) || input.displayName);

  if (fileName && streamName && !fileName.includes(`:${streamName}`)) {
    return `${fileName}:${streamName}`;
  }

  return objectLeaf(firstValue(input, ["base_path"]) || fallback(input));
}

function extractHostDisplayName(input: AttackGraphEntityNodeDisplayNameInput) {
  const host = firstValue(input, ["computer_name", "domain", "agent_id"]);
  return host ? hostLike(host) : fallback(input);
}

function extractHostRefDisplayName(input: AttackGraphEntityNodeDisplayNameInput) {
  const host = firstValue(input, ["server_name"]);
  return host ? hostLike(host) : fallback(input);
}

function extractMailSlotDisplayName(input: AttackGraphEntityNodeDisplayNameInput) {
  return objectLeaf(firstValue(input, ["mail_slot_name"]) || fallback(input));
}

function extractMbrDisplayName(input: AttackGraphEntityNodeDisplayNameInput) {
  return firstValue(input, ["physical_name", "driver_type"]) || fallback(input);
}

function extractMessageHookDisplayName(
  input: AttackGraphEntityNodeDisplayNameInput,
) {
  return (
    firstValue(input, [
      "hook_type_description",
      "message_hook_module",
      "hook_type",
      "module_fingerprint",
    ]) || fallback(input)
  );
}

function extractNamedEventDisplayName(
  input: AttackGraphEntityNodeDisplayNameInput,
) {
  return objectLeaf(firstValue(input, ["event_name"]) || fallback(input));
}

function extractNamedPipeDisplayName(input: AttackGraphEntityNodeDisplayNameInput) {
  return objectLeaf(firstValue(input, ["pipe_name"]) || fallback(input));
}

function extractNetAddressDisplayName(
  input: AttackGraphEntityNodeDisplayNameInput,
) {
  return firstValue(input, ["ip"]) || fallback(input);
}

function extractNetEndpointDisplayName(
  input: AttackGraphEntityNodeDisplayNameInput,
) {
  const host = firstValue(input, ["ip"]);
  const port = firstValue(input, ["port"]);
  if (host && port && !host.endsWith(`:${port}`)) {
    return `${formatEndpointHost(host)}:${port}`;
  }
  return host || fallback(input);
}

function extractPowerShellExecutionDisplayName(
  input: AttackGraphEntityNodeDisplayNameInput,
) {
  return (
    basename(firstValue(input, ["file_name"])) ||
    commandSummary(firstValue(input, ["process_command_line", "content"])) ||
    firstValue(input, ["script_fingerprint"]) ||
    fallback(input)
  );
}

function extractProcessDisplayName(input: AttackGraphEntityNodeDisplayNameInput) {
  return (
    firstValue(input, ["process_name"]) ||
    basename(firstValue(input, ["process_image"])) ||
    commandSummary(firstValue(input, ["process_command_line"])) ||
    firstValue(input, ["process_id"]) ||
    basename(fallback(input))
  );
}

function extractRegistryKeyDisplayName(
  input: AttackGraphEntityNodeDisplayNameInput,
) {
  return registryLeaf(
    firstValue(input, ["object_name", "description", "classification"]) ||
      fallback(input),
  );
}

function extractRegistryValueDisplayName(
  input: AttackGraphEntityNodeDisplayNameInput,
) {
  return (
    registryLeaf(firstValue(input, ["object_name"])) ||
    firstValue(input, ["object_value", "description", "classification"]) ||
    fallback(input)
  );
}

function extractScheduledJobDisplayName(
  input: AttackGraphEntityNodeDisplayNameInput,
) {
  return (
    basename(firstValue(input, ["job_binary_path_name"])) ||
    commandSummary(firstValue(input, ["command"])) ||
    firstValue(input, ["job_id", "flag"]) ||
    fallback(input)
  );
}

function extractServiceDisplayName(input: AttackGraphEntityNodeDisplayNameInput) {
  return (
    firstValue(input, ["display_name", "service_name"]) ||
    basename(firstValue(input, ["service_binary_path_name"])) ||
    fallback(input)
  );
}

function extractTaskDisplayName(input: AttackGraphEntityNodeDisplayNameInput) {
  return (
    firstValue(input, ["task_name", "task_path", "server_name"]) ||
    fallback(input)
  );
}

function extractTokenImpersonationDisplayName(
  input: AttackGraphEntityNodeDisplayNameInput,
) {
  return (
    firstValue(input, [
      "token_flag_description",
      "token_flag",
      "operator_token_context",
      "target_token_context",
    ]) ||
    fallback(input)
  );
}

function extractUrlResourceDisplayName(
  input: AttackGraphEntityNodeDisplayNameInput,
) {
  return urlLabel(firstValue(input, ["url"]) || fallback(input));
}

function extractVolumeDisplayName(input: AttackGraphEntityNodeDisplayNameInput) {
  return (
    basename(firstValue(input, ["file_name"])) ||
    firstValue(input, ["driver_type", "access_type"]) ||
    fallback(input)
  );
}

function extractWmiClassDisplayName(input: AttackGraphEntityNodeDisplayNameInput) {
  return (
    firstValue(input, ["class_name", "namespace", "server_name"]) ||
    fallback(input)
  );
}

function extractWmiConsumerDisplayName(
  input: AttackGraphEntityNodeDisplayNameInput,
) {
  return (
    firstValue(input, [
      "event_consumer_name",
      "event_consumer_type_description",
      "class_name",
      "namespace",
    ]) || fallback(input)
  );
}

function extractWmiExecuteDisplayName(
  input: AttackGraphEntityNodeDisplayNameInput,
) {
  const className = firstValue(input, ["class_name"]);
  const methodName = firstValue(input, ["method_name"]);
  if (className && methodName) {
    return `${className}.${methodName}`;
  }

  return (
    methodName ||
    className ||
    commandSummary(firstValue(input, ["method_parameters"])) ||
    firstValue(input, ["namespace", "server_name"]) ||
    fallback(input)
  );
}

function extractWmiFilterDisplayName(input: AttackGraphEntityNodeDisplayNameInput) {
  return (
    firstValue(input, ["event_filter_name"]) ||
    commandSummary(firstValue(input, ["query"])) ||
    firstValue(input, ["namespace", "server_name"]) ||
    fallback(input)
  );
}

function extractWmiQueryDisplayName(input: AttackGraphEntityNodeDisplayNameInput) {
  return (
    commandSummary(firstValue(input, ["query"])) ||
    firstValue(input, ["query_fingerprint", "namespace", "server_name"]) ||
    fallback(input)
  );
}

function firstValue(
  input: AttackGraphEntityNodeDisplayNameInput,
  keys: string[],
) {
  for (const key of keys) {
    const value = stringValue(input.properties[key]);
    if (value) {
      return value;
    }
  }
  return "";
}

function fallback(input: AttackGraphEntityNodeDisplayNameInput) {
  return input.displayName || input.key;
}

function basename(value: string) {
  const normalized = stringValue(value).replace(/^["']|["']$/g, "");
  if (!normalized) {
    return "";
  }

  const pathWithoutTrailingSlash = normalized.replace(/[\\/]+$/g, "");
  const parts = pathWithoutTrailingSlash.split(/[\\/]/);
  return parts[parts.length - 1] || normalized;
}

function objectLeaf(value: string) {
  const normalized = stringValue(value);
  if (!normalized) {
    return "";
  }

  const parts = normalized.replace(/[\\/]+$/g, "").split(/[\\/]/);
  return parts[parts.length - 1] || normalized;
}

function registryLeaf(value: string) {
  const normalized = stringValue(value);
  if (!normalized) {
    return "";
  }

  const parts = normalized.replace(/[\\]+$/g, "").split(/[\\]/);
  return parts[parts.length - 1] || normalized;
}

function hostLike(value: string) {
  return stringValue(value)
    .replace(/^https?:\/\//i, "")
    .replace(/[/:].*$/g, "");
}

function formatEndpointHost(value: string) {
  const normalized = stringValue(value);
  if (!normalized) {
    return "";
  }
  return normalized.includes(":") && !normalized.startsWith("[")
    ? `[${normalized}]`
    : normalized;
}

function urlLabel(value: string) {
  const normalized = stringValue(value);
  if (!normalized) {
    return "";
  }

  try {
    const url = new URL(normalized);
    const path = url.pathname && url.pathname !== "/" ? basename(url.pathname) : "";
    return path ? `${url.hostname}/${path}` : url.hostname;
  } catch {
    return normalized.replace(/^https?:\/\//i, "");
  }
}

function commandSummary(value: string) {
  const normalized = stringValue(value);
  if (!normalized) {
    return "";
  }
  return normalized.length > 48 ? `${normalized.slice(0, 45)}...` : normalized;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
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
