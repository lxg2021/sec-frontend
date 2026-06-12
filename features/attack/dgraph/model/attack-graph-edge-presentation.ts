import type { CSSProperties } from "react";

import {
  ATTACK_GRAPH_RELATION_TYPES,
  getAttackGraphEdgeKind,
  type AttackGraphEdgeKind,
  type AttackGraphRelationType,
} from "./attack-graph-edge-types";

export type AttackGraphEdgeInteractionState =
  | "default"
  | "hover"
  | "selected"
  | "dimmed";

export type AttackGraphEdgeMarkerType = "arrow" | "diamond" | "none";

export type AttackGraphEdgeColorMode = "solid" | "gradient";

export interface AttackGraphEdgeMarkerConfig {
  type: AttackGraphEdgeMarkerType;
  size: number;
}

export interface AttackGraphEdgeStateConfig {
  color?: string;
  width?: number;
  opacity?: number;
  strokeDasharray?: string;
}

export interface AttackGraphEdgePresentation {
  kind: AttackGraphEdgeKind;
  label: string;
  color: string;
  colorMode?: AttackGraphEdgeColorMode;
  width: number;
  priority: number;
  animated: boolean;
  strokeDasharray?: string;
  opacity: number;
  marker?: Partial<AttackGraphEdgeMarkerConfig>;
  state?: Partial<Record<AttackGraphEdgeInteractionState, AttackGraphEdgeStateConfig>>;
}

export interface AttackGraphEdgeVisualDataInput {
  relationType: string | null | undefined;
  edgeKey?: string | null;
  graphOrigin?: string | null;
  properties?: Record<string, string> | null;
}

export interface AttackGraphEdgeVisualData {
  relationType: string;
  kind: AttackGraphEdgeKind;
  kindLabel: string;
  label: string;
  tooltip: string;
  color: string;
  colorMode: AttackGraphEdgeColorMode;
  width: number;
  opacity: number;
  strokeDasharray?: string;
  marker: AttackGraphEdgeMarkerConfig;
  priority: number;
  animated: boolean;
  state: Record<AttackGraphEdgeInteractionState, Required<AttackGraphEdgeStateConfig>>;
}

export const ATTACK_GRAPH_EDGE_PRESENTATIONS: Record<
  AttackGraphEdgeKind,
  AttackGraphEdgePresentation
> = {
  "case-structure": {
    kind: "case-structure",
    label: "Case Structure",
    color: "#64748b",
    width: 1.4,
    priority: 30,
    animated: false,
    opacity: 0.72,
    colorMode: "solid",
    marker: { type: "arrow" },
  },
  "evidence-link": {
    kind: "evidence-link",
    label: "Evidence Link",
    color: "#e11d48",
    width: 1.8,
    priority: 88,
    animated: false,
    strokeDasharray: "5 4",
    opacity: 0.82,
    colorMode: "solid",
  },
  "process-execution": {
    kind: "process-execution",
    label: "Execution",
    color: "#dc2626",
    width: 2.2,
    priority: 96,
    animated: false,
    opacity: 0.9,
    colorMode: "gradient",
  },
  "process-access": {
    kind: "process-access",
    label: "Process Access",
    color: "#f97316",
    width: 2,
    priority: 86,
    animated: false,
    opacity: 0.86,
    colorMode: "gradient",
  },
  "file-activity": {
    kind: "file-activity",
    label: "File Activity",
    color: "#d97706",
    width: 1.8,
    priority: 64,
    animated: false,
    opacity: 0.78,
    colorMode: "gradient",
  },
  "registry-activity": {
    kind: "registry-activity",
    label: "Registry",
    color: "#7c3aed",
    width: 1.8,
    priority: 68,
    animated: false,
    opacity: 0.78,
    colorMode: "gradient",
  },
  "network-activity": {
    kind: "network-activity",
    label: "Network",
    color: "#0891b2",
    width: 1.8,
    priority: 72,
    animated: false,
    opacity: 0.8,
    colorMode: "gradient",
  },
  "account-activity": {
    kind: "account-activity",
    label: "Account",
    color: "#4f46e5",
    width: 1.8,
    priority: 74,
    animated: false,
    opacity: 0.8,
    colorMode: "gradient",
  },
  persistence: {
    kind: "persistence",
    label: "Persistence",
    color: "#9333ea",
    width: 1.9,
    priority: 82,
    animated: false,
    opacity: 0.82,
    colorMode: "gradient",
  },
  "ipc-activity": {
    kind: "ipc-activity",
    label: "IPC",
    color: "#475569",
    width: 1.6,
    priority: 56,
    animated: false,
    opacity: 0.7,
    colorMode: "gradient",
  },
  "security-impact": {
    kind: "security-impact",
    label: "Security Impact",
    color: "#be123c",
    width: 2.2,
    priority: 94,
    animated: false,
    opacity: 0.9,
    colorMode: "solid",
  },
  association: {
    kind: "association",
    label: "Association",
    color: "#71717a",
    width: 1.4,
    priority: 34,
    animated: false,
    strokeDasharray: "4 4",
    opacity: 0.62,
    colorMode: "gradient",
    marker: { type: "arrow" },
  },
  unknown: {
    kind: "unknown",
    label: "Unknown",
    color: "#737373",
    width: 1.2,
    priority: 1,
    animated: false,
    strokeDasharray: "3 5",
    opacity: 0.55,
    colorMode: "solid",
  },
};

export const ATTACK_GRAPH_RELATION_LABELS: Record<
  AttackGraphRelationType,
  string
> = {
  ACCOUNT_GROUP_HAS_MEMBER: "has member",
  ADDRESS_HAS_ENDPOINT: "has endpoint",
  ASSOCIATED_WITH_FILE: "matches file",
  BITS_LOCAL_FILE: "local file",
  BITS_REMOTE_URL: "remote url",
  CASE_HAS_GROUP: "has group",
  DEVICE_BELONG_TO_HOST: "belongs to",
  DNS_NAME_RESOLVE_ADDRESS: "resolves",
  EVIDENCE_REFER_ENTITY: "refers",
  FILE_HAS_STREAM: "has stream",
  FILE_MOVE_TO: "moves to",
  FILE_RENAME_TO: "renames to",
  GROUP_HAS_INSTANCE: "has instance",
  INSTANCE_HAS_EVIDENCE: "has evidence",
  MESSAGE_HOOK_MODULE_MATCH_FILE: "module file",
  POWERSHELL_SCRIPT_MATCH_FILE: "script file",
  PROCESS_ACCESS_PROCESS: "access",
  PROCESS_ACCESS_URL: "access url",
  PROCESS_ACCESS_VOLUME: "access volume",
  PROCESS_ADD_ACCOUNT_TO_GROUP: "add member",
  PROCESS_ADD_FILES_TO_BITS: "add files",
  PROCESS_ADJUST_TOKEN_PRIVILEGES: "adjust token",
  PROCESS_CHANGE_BITS_STATUS: "change bits",
  PROCESS_CHANGE_FILE_ATTRIBUTES: "set attrs",
  PROCESS_CONFIG_SERVICE: "config service",
  PROCESS_CONNECT_ENDPOINT: "connect",
  PROCESS_CONNECT_FILE_MAPPING: "connect mapping",
  PROCESS_CONNECT_MAIL_SLOT: "connect mailslot",
  PROCESS_CONNECT_NAMED_PIPE: "connect pipe",
  PROCESS_CONTROL_SERVICE: "control service",
  PROCESS_CREATE_ACCOUNT: "create account",
  PROCESS_CREATE_ACCOUNT_GROUP: "create group",
  PROCESS_CREATE_BITS: "create bits",
  PROCESS_CREATE_FILE: "create file",
  PROCESS_CREATE_FILE_MAPPING: "create mapping",
  PROCESS_CREATE_FILE_STREAM: "create stream",
  PROCESS_CREATE_MAIL_SLOT: "create mailslot",
  PROCESS_CREATE_NAMED_EVENT: "create event",
  PROCESS_CREATE_NAMED_PIPE: "create pipe",
  PROCESS_CREATE_PROCESS: "create process",
  PROCESS_CREATE_REGISTRY_KEY: "create key",
  PROCESS_CREATE_REMOTE_THREAD: "remote thread",
  PROCESS_CREATE_SCHEDULED_JOB: "create job",
  PROCESS_CREATE_SERVICE: "create service",
  PROCESS_CREATE_TASK: "create task",
  PROCESS_CREATE_WMI_CLASS: "create class",
  PROCESS_CREATE_WMI_CONSUMER: "create consumer",
  PROCESS_CREATE_WMI_FILTER: "create filter",
  PROCESS_CROSS_MEMORY_EXECUTE: "mem execute",
  PROCESS_DELETE_ACCOUNT: "delete account",
  PROCESS_DELETE_ACCOUNT_GROUP: "delete group",
  PROCESS_DELETE_FILE: "delete file",
  PROCESS_DELETE_FILE_STREAM: "delete stream",
  PROCESS_DELETE_REGISTRY_KEY: "delete key",
  PROCESS_DELETE_REGISTRY_VALUE: "delete value",
  PROCESS_DELETE_SCHEDULED_JOB: "delete job",
  PROCESS_DELETE_SERVICE: "delete service",
  PROCESS_DELETE_TASK: "delete task",
  PROCESS_DISABLE_ACCOUNT: "disable account",
  PROCESS_ENABLE_ACCOUNT: "enable account",
  PROCESS_EXECUTE_CRYPTO: "crypto",
  PROCESS_EXECUTE_POWERSHELL: "powershell",
  PROCESS_EXECUTE_WMI: "execute wmi",
  PROCESS_IMPERSONATE_TOKEN: "impersonate",
  PROCESS_LOAD_DLL: "load dll",
  PROCESS_LOAD_DRIVER: "load driver",
  PROCESS_MODIFY_ACCOUNT: "modify account",
  PROCESS_MOVE_FILE: "move file",
  PROCESS_OPEN_NAMED_EVENT: "open event",
  PROCESS_QUERY_DNS_NAME: "query dns",
  PROCESS_QUERY_REGISTRY_VALUE: "query value",
  PROCESS_QUERY_WMI: "query wmi",
  PROCESS_READ_FILE: "read file",
  PROCESS_REMOVE_ACCOUNT_FROM_GROUP: "remove member",
  PROCESS_RENAME_FILE: "rename file",
  PROCESS_RENAME_REGISTRY_KEY: "rename key",
  PROCESS_RESET_ACCOUNT_PASSWORD: "reset password",
  PROCESS_SET_FILE_EA: "set file ea",
  PROCESS_SET_MESSAGE_HOOK: "set hook",
  PROCESS_SET_REGISTRY_VALUE: "set value",
  PROCESS_SET_TOKEN: "set token",
  PROCESS_START_SERVICE: "start service",
  PROCESS_STEAL_CREDENTIALS: "steal creds",
  PROCESS_STOP_SERVICE: "stop service",
  PROCESS_TERMINATE_PROCESS: "terminate",
  PROCESS_TOUCH_MBR: "touch mbr",
  PROCESS_WRITE_FILE: "write file",
  REGISTRY_KEY_RENAME_TO: "renames to",
  SERVICE_IMAGE_MATCH_FILE: "image file",
  TARGET_REMOTE_HOST: "remote host",
  TASK_IMAGE_MATCH_FILE: "task image",
  URL_DOWNLOAD_TO_FILE: "downloads",
  WMI_FILTER_BIND_CONSUMER: "binds",
};

export function getAttackGraphEdgePresentation(
  relationType: string | null | undefined,
): AttackGraphEdgePresentation {
  return ATTACK_GRAPH_EDGE_PRESENTATIONS[getAttackGraphEdgeKind(relationType)];
}

export function getAttackGraphRelationLabel(
  relationType: string | null | undefined,
) {
  const normalized = String(relationType ?? "").trim();
  if (normalized in ATTACK_GRAPH_RELATION_LABELS) {
    return ATTACK_GRAPH_RELATION_LABELS[normalized as AttackGraphRelationType];
  }
  return toRelationLabel(normalized);
}

export function getAttackGraphEdgeMarker(
  presentation: AttackGraphEdgePresentation,
): AttackGraphEdgeMarkerConfig {
  return {
    type: presentation.marker?.type ?? "arrow",
    size: presentation.marker?.size ?? 16,
  };
}

export function getAttackGraphEdgeStateConfig(
  presentation: AttackGraphEdgePresentation,
  state: AttackGraphEdgeInteractionState,
): Required<AttackGraphEdgeStateConfig> {
  return {
    ...getAttackGraphEdgeDefaultStateConfig(presentation, state),
    ...presentation.state?.[state],
  };
}

export function getAttackGraphEdgeStyle(
  relationType: string | null | undefined,
  options?: {
    dimmed?: boolean;
    highlighted?: boolean;
  },
): CSSProperties {
  const presentation = getAttackGraphEdgePresentation(relationType);
  const highlighted = options?.highlighted === true;
  const dimmed = options?.dimmed === true && !highlighted;
  const state = highlighted ? "selected" : dimmed ? "dimmed" : "default";
  const stateConfig = getAttackGraphEdgeStateConfig(presentation, state);

  return {
    stroke: stateConfig.color,
    strokeWidth: stateConfig.width,
    strokeDasharray: stateConfig.strokeDasharray,
    opacity: stateConfig.opacity,
  };
}

export function toAttackGraphEdgeVisualData(
  input: AttackGraphEdgeVisualDataInput,
): AttackGraphEdgeVisualData {
  const relationType = String(input.relationType ?? "").trim();
  const presentation = getAttackGraphEdgePresentation(relationType);
  const label = getAttackGraphRelationLabel(relationType);
  const state = {
    default: getAttackGraphEdgeStateConfig(presentation, "default"),
    hover: getAttackGraphEdgeStateConfig(presentation, "hover"),
    selected: getAttackGraphEdgeStateConfig(presentation, "selected"),
    dimmed: getAttackGraphEdgeStateConfig(presentation, "dimmed"),
  };

  return {
    relationType,
    kind: presentation.kind,
    kindLabel: presentation.label,
    label,
    tooltip: buildEdgeTooltip(input, label, presentation.label),
    color: state.default.color,
    colorMode: presentation.colorMode ?? "gradient",
    width: state.default.width,
    opacity: state.default.opacity,
    strokeDasharray: state.default.strokeDasharray,
    marker: getAttackGraphEdgeMarker(presentation),
    priority: presentation.priority,
    animated: presentation.animated,
    state,
  };
}

export function getAttackGraphEdgeDemoItems() {
  return ATTACK_GRAPH_RELATION_TYPES.map((relationType) =>
    toAttackGraphEdgeVisualData({ relationType }),
  );
}

function getAttackGraphEdgeDefaultStateConfig(
  presentation: AttackGraphEdgePresentation,
  state: AttackGraphEdgeInteractionState,
): Required<AttackGraphEdgeStateConfig> {
  const base = {
    color: presentation.color,
    width: presentation.width,
    opacity: presentation.opacity,
    strokeDasharray: presentation.strokeDasharray ?? "",
  };
  if (state === "hover") {
    return {
      ...base,
      width: presentation.width + 0.5,
      opacity: Math.min(1, presentation.opacity + 0.12),
    };
  }
  if (state === "selected") {
    return {
      ...base,
      width: presentation.width + 1,
      opacity: 1,
    };
  }
  if (state === "dimmed") {
    return {
      ...base,
      opacity: Math.min(presentation.opacity, 0.28),
    };
  }
  return base;
}

function buildEdgeTooltip(
  input: AttackGraphEdgeVisualDataInput,
  label: string,
  kindLabel: string,
) {
  const relationType = String(input.relationType ?? "").trim();
  const lines = [`${label} (${kindLabel})`, relationType].filter(Boolean);
  const edgeKey = String(input.edgeKey ?? "").trim();
  const graphOrigin = String(input.graphOrigin ?? "").trim();
  if (edgeKey) {
    lines.push(`edge: ${edgeKey}`);
  }
  if (graphOrigin) {
    lines.push(`origin: ${graphOrigin}`);
  }
  return lines.join("\n");
}

function toRelationLabel(relationType: string) {
  if (!relationType) {
    return "related";
  }
  return relationType
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .slice(-2)
    .join(" ");
}
