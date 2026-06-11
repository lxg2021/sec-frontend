import type {
  AttackGraphBackendEntityType,
  AttackGraphCaseEntityType,
  AttackGraphEntityType,
} from "./attack-graph-node-types";
import {
  ATTACK_GRAPH_RELATION_TYPES,
  type AttackGraphRelationType,
} from "./attack-graph-edge-types";

export type AttackGraphLayoutLaneId =
  | "network"
  | "host"
  | "identity"
  | "process"
  | "security"
  | "file"
  | "registry"
  | "persistence"
  | "ipc"
  | "case"
  | "unknown";

export type AttackGraphLayoutBand = "above" | "center" | "below" | "hidden";

export type AttackGraphNodeLayoutRole =
  | "case-structure"
  | "actor"
  | "network-resource"
  | "host-resource"
  | "identity-resource"
  | "file-resource"
  | "registry-resource"
  | "persistence-resource"
  | "ipc-resource"
  | "security-behavior"
  | "unknown";

export interface AttackGraphLayoutLaneRule {
  id: AttackGraphLayoutLaneId;
  label: string;
  order: number;
  band: AttackGraphLayoutBand;
  minHeight: number;
  nodeGap: number;
}

export interface AttackGraphNodeLayoutRule {
  lane: AttackGraphLayoutLaneId;
  role: AttackGraphNodeLayoutRole;
  order: number;
  preferStraightWithSameType: boolean;
}

export type AttackGraphRelationLayoutRole =
  | "case-structure"
  | "evidence-link"
  | "primary-process-chain"
  | "process-to-upper-resource"
  | "process-to-lower-resource"
  | "process-to-side-resource"
  | "resource-structure-chain"
  | "resource-association"
  | "security-impact"
  | "unknown";

export type AttackGraphRelationLayoutDirection =
  | "same-lane"
  | "up"
  | "down"
  | "side"
  | "hidden";

export interface AttackGraphRelationLayoutRule {
  role: AttackGraphRelationLayoutRole;
  direction: AttackGraphRelationLayoutDirection;
  priority: number;
  preferStraightChain: boolean;
}

export type AttackGraphSmallGraphRuleKind =
  | "two-node-direct"
  | "three-node-linear"
  | "same-lane-chain"
  | "process-centered-star";

export interface AttackGraphSmallGraphLayoutRule {
  kind: AttackGraphSmallGraphRuleKind;
  maxNodes: number;
  description: string;
}

export interface AttackGraphLayoutCoverageReport {
  backendNodeTypeCount: number;
  relationTypeCount: number;
  missingNodeTypes: string[];
  missingRelationTypes: string[];
  extraNodeTypes: string[];
  extraRelationTypes: string[];
}

export interface AttackGraphLayoutNodeLike {
  id: string;
  key: string;
  entityType: string;
  displayName: string;
}

export interface AttackGraphLayoutEdgeLike {
  id: string;
  relationType: string;
  source: string;
  target: string;
}

export const ATTACK_GRAPH_DAGRE_LAYOUT_RULE = {
  rankdir: "LR",
  ranksep: 190,
  nodesep: 96,
  edgeLabelSpace: true,
  controlPoints: true,
  parallelEdgeDistance: 26,
  parallelLoopDistance: 18,
} as const;

export const ATTACK_GRAPH_ENTITY_TYPES = [
  "Account",
  "AccountGroup",
  "Bits",
  "CredentialTheft",
  "Crypto",
  "Device",
  "DnsName",
  "File",
  "FileMapping",
  "FileStream",
  "Host",
  "HostRef",
  "MailSlot",
  "Mbr",
  "MessageHook",
  "NamedEvent",
  "NamedPipe",
  "NetAddress",
  "NetEndpoint",
  "PowerShellExecution",
  "Process",
  "RegistryKey",
  "RegistryValue",
  "ScheduledJob",
  "Service",
  "Task",
  "TokenImpersonation",
  "URLResource",
  "Volume",
  "WmiClass",
  "WmiConsumer",
  "WmiExecute",
  "WmiFilter",
  "WmiQuery",
] as const satisfies readonly AttackGraphEntityType[];

export const ATTACK_GRAPH_CASE_ENTITY_TYPES = [
  "AttackCase",
  "AttackCaseGroup",
  "AttackCaseInstance",
  "AttackCaseEvidence",
] as const satisfies readonly AttackGraphCaseEntityType[];

export const ATTACK_GRAPH_BACKEND_ENTITY_TYPES = [
  ...ATTACK_GRAPH_ENTITY_TYPES,
  ...ATTACK_GRAPH_CASE_ENTITY_TYPES,
] as const satisfies readonly AttackGraphBackendEntityType[];

export const ATTACK_GRAPH_LAYOUT_LANES: Record<
  AttackGraphLayoutLaneId,
  AttackGraphLayoutLaneRule
> = {
  network: {
    id: "network",
    label: "Network",
    order: 10,
    band: "above",
    minHeight: 132,
    nodeGap: 88,
  },
  host: {
    id: "host",
    label: "Host / Device",
    order: 20,
    band: "above",
    minHeight: 120,
    nodeGap: 88,
  },
  identity: {
    id: "identity",
    label: "Identity / Token",
    order: 30,
    band: "above",
    minHeight: 120,
    nodeGap: 88,
  },
  process: {
    id: "process",
    label: "Process",
    order: 40,
    band: "center",
    minHeight: 150,
    nodeGap: 104,
  },
  security: {
    id: "security",
    label: "Security Behavior",
    order: 50,
    band: "below",
    minHeight: 120,
    nodeGap: 88,
  },
  file: {
    id: "file",
    label: "File / Volume",
    order: 60,
    band: "below",
    minHeight: 140,
    nodeGap: 92,
  },
  registry: {
    id: "registry",
    label: "Registry",
    order: 70,
    band: "below",
    minHeight: 120,
    nodeGap: 88,
  },
  persistence: {
    id: "persistence",
    label: "Persistence / WMI",
    order: 80,
    band: "below",
    minHeight: 150,
    nodeGap: 92,
  },
  ipc: {
    id: "ipc",
    label: "IPC",
    order: 90,
    band: "below",
    minHeight: 120,
    nodeGap: 88,
  },
  case: {
    id: "case",
    label: "Case Structure",
    order: 100,
    band: "hidden",
    minHeight: 0,
    nodeGap: 72,
  },
  unknown: {
    id: "unknown",
    label: "Unknown",
    order: 110,
    band: "below",
    minHeight: 120,
    nodeGap: 88,
  },
};

export const ATTACK_GRAPH_NODE_LAYOUT_RULES: Record<
  AttackGraphBackendEntityType,
  AttackGraphNodeLayoutRule
> = {
  Account: nodeRule("identity", "identity-resource", 10, true),
  AccountGroup: nodeRule("identity", "identity-resource", 20, true),
  Bits: nodeRule("persistence", "persistence-resource", 20, true),
  CredentialTheft: nodeRule("security", "security-behavior", 10, false),
  Crypto: nodeRule("security", "security-behavior", 20, false),
  Device: nodeRule("host", "host-resource", 30, true),
  DnsName: nodeRule("network", "network-resource", 10, true),
  File: nodeRule("file", "file-resource", 10, true),
  FileMapping: nodeRule("ipc", "ipc-resource", 10, true),
  FileStream: nodeRule("file", "file-resource", 20, true),
  Host: nodeRule("host", "host-resource", 10, true),
  HostRef: nodeRule("host", "host-resource", 20, true),
  MailSlot: nodeRule("ipc", "ipc-resource", 20, true),
  Mbr: nodeRule("security", "security-behavior", 30, false),
  MessageHook: nodeRule("persistence", "persistence-resource", 30, false),
  NamedEvent: nodeRule("ipc", "ipc-resource", 30, true),
  NamedPipe: nodeRule("ipc", "ipc-resource", 40, true),
  NetAddress: nodeRule("network", "network-resource", 20, true),
  NetEndpoint: nodeRule("network", "network-resource", 30, true),
  PowerShellExecution: nodeRule("process", "actor", 20, true),
  Process: nodeRule("process", "actor", 10, true),
  RegistryKey: nodeRule("registry", "registry-resource", 10, true),
  RegistryValue: nodeRule("registry", "registry-resource", 20, true),
  ScheduledJob: nodeRule("persistence", "persistence-resource", 40, true),
  Service: nodeRule("persistence", "persistence-resource", 50, true),
  Task: nodeRule("persistence", "persistence-resource", 60, true),
  TokenImpersonation: nodeRule("identity", "identity-resource", 30, false),
  URLResource: nodeRule("network", "network-resource", 40, true),
  Volume: nodeRule("file", "file-resource", 30, true),
  WmiClass: nodeRule("persistence", "persistence-resource", 70, true),
  WmiConsumer: nodeRule("persistence", "persistence-resource", 80, true),
  WmiExecute: nodeRule("persistence", "persistence-resource", 90, true),
  WmiFilter: nodeRule("persistence", "persistence-resource", 100, true),
  WmiQuery: nodeRule("persistence", "persistence-resource", 110, true),
  AttackCase: nodeRule("case", "case-structure", 10, false),
  AttackCaseGroup: nodeRule("case", "case-structure", 20, false),
  AttackCaseInstance: nodeRule("case", "case-structure", 30, false),
  AttackCaseEvidence: nodeRule("case", "case-structure", 40, false),
};

export const ATTACK_GRAPH_RELATION_LAYOUT_RULES: Record<
  AttackGraphRelationType,
  AttackGraphRelationLayoutRule
> = {
  ACCOUNT_GROUP_HAS_MEMBER: relationRule(
    "resource-structure-chain",
    "same-lane",
    68,
    true,
  ),
  ADDRESS_HAS_ENDPOINT: relationRule(
    "resource-structure-chain",
    "same-lane",
    78,
    true,
  ),
  ASSOCIATED_WITH_FILE: relationRule(
    "resource-association",
    "down",
    38,
    false,
  ),
  BITS_LOCAL_FILE: relationRule(
    "resource-association",
    "down",
    52,
    false,
  ),
  BITS_REMOTE_URL: relationRule(
    "resource-association",
    "up",
    52,
    false,
  ),
  CASE_HAS_GROUP: relationRule("case-structure", "hidden", 10, true),
  DEVICE_BELONG_TO_HOST: relationRule(
    "resource-structure-chain",
    "same-lane",
    54,
    true,
  ),
  DNS_NAME_RESOLVE_ADDRESS: relationRule(
    "resource-structure-chain",
    "same-lane",
    76,
    true,
  ),
  EVIDENCE_REFER_ENTITY: relationRule(
    "evidence-link",
    "hidden",
    20,
    false,
  ),
  FILE_HAS_STREAM: relationRule(
    "resource-structure-chain",
    "same-lane",
    72,
    true,
  ),
  FILE_MOVE_TO: relationRule(
    "resource-structure-chain",
    "same-lane",
    64,
    true,
  ),
  FILE_RENAME_TO: relationRule(
    "resource-structure-chain",
    "same-lane",
    64,
    true,
  ),
  GROUP_HAS_INSTANCE: relationRule(
    "case-structure",
    "hidden",
    10,
    true,
  ),
  INSTANCE_HAS_EVIDENCE: relationRule(
    "case-structure",
    "hidden",
    10,
    true,
  ),
  MESSAGE_HOOK_MODULE_MATCH_FILE: relationRule(
    "resource-association",
    "down",
    46,
    false,
  ),
  POWERSHELL_SCRIPT_MATCH_FILE: relationRule(
    "resource-association",
    "down",
    46,
    false,
  ),
  PROCESS_ACCESS_PROCESS: relationRule(
    "primary-process-chain",
    "same-lane",
    88,
    true,
  ),
  PROCESS_ACCESS_URL: relationRule(
    "process-to-upper-resource",
    "up",
    62,
    false,
  ),
  PROCESS_ACCESS_VOLUME: relationRule(
    "process-to-lower-resource",
    "down",
    54,
    false,
  ),
  PROCESS_ADD_ACCOUNT_TO_GROUP: relationRule(
    "process-to-upper-resource",
    "up",
    58,
    false,
  ),
  PROCESS_ADD_FILES_TO_BITS: relationRule(
    "process-to-lower-resource",
    "down",
    62,
    false,
  ),
  PROCESS_ADJUST_TOKEN_PRIVILEGES: relationRule(
    "process-to-upper-resource",
    "up",
    82,
    false,
  ),
  PROCESS_CHANGE_BITS_STATUS: relationRule(
    "process-to-lower-resource",
    "down",
    60,
    false,
  ),
  PROCESS_CHANGE_FILE_ATTRIBUTES: relationRule(
    "process-to-lower-resource",
    "down",
    54,
    false,
  ),
  PROCESS_CONFIG_SERVICE: relationRule(
    "process-to-lower-resource",
    "down",
    66,
    false,
  ),
  PROCESS_CONNECT_ENDPOINT: relationRule(
    "process-to-upper-resource",
    "up",
    72,
    false,
  ),
  PROCESS_CONNECT_FILE_MAPPING: relationRule(
    "process-to-lower-resource",
    "down",
    46,
    false,
  ),
  PROCESS_CONNECT_MAIL_SLOT: relationRule(
    "process-to-lower-resource",
    "down",
    46,
    false,
  ),
  PROCESS_CONNECT_NAMED_PIPE: relationRule(
    "process-to-lower-resource",
    "down",
    46,
    false,
  ),
  PROCESS_CONTROL_SERVICE: relationRule(
    "process-to-lower-resource",
    "down",
    66,
    false,
  ),
  PROCESS_CREATE_ACCOUNT: relationRule(
    "process-to-upper-resource",
    "up",
    58,
    false,
  ),
  PROCESS_CREATE_ACCOUNT_GROUP: relationRule(
    "process-to-upper-resource",
    "up",
    58,
    false,
  ),
  PROCESS_CREATE_BITS: relationRule(
    "process-to-lower-resource",
    "down",
    62,
    false,
  ),
  PROCESS_CREATE_FILE: relationRule(
    "process-to-lower-resource",
    "down",
    58,
    false,
  ),
  PROCESS_CREATE_FILE_MAPPING: relationRule(
    "process-to-lower-resource",
    "down",
    48,
    false,
  ),
  PROCESS_CREATE_FILE_STREAM: relationRule(
    "process-to-lower-resource",
    "down",
    58,
    false,
  ),
  PROCESS_CREATE_MAIL_SLOT: relationRule(
    "process-to-lower-resource",
    "down",
    48,
    false,
  ),
  PROCESS_CREATE_NAMED_EVENT: relationRule(
    "process-to-lower-resource",
    "down",
    48,
    false,
  ),
  PROCESS_CREATE_NAMED_PIPE: relationRule(
    "process-to-lower-resource",
    "down",
    48,
    false,
  ),
  PROCESS_CREATE_PROCESS: relationRule(
    "primary-process-chain",
    "same-lane",
    100,
    true,
  ),
  PROCESS_CREATE_REGISTRY_KEY: relationRule(
    "process-to-lower-resource",
    "down",
    58,
    false,
  ),
  PROCESS_CREATE_REMOTE_THREAD: relationRule(
    "primary-process-chain",
    "same-lane",
    86,
    false,
  ),
  PROCESS_CREATE_SCHEDULED_JOB: relationRule(
    "process-to-lower-resource",
    "down",
    64,
    false,
  ),
  PROCESS_CREATE_SERVICE: relationRule(
    "process-to-lower-resource",
    "down",
    66,
    false,
  ),
  PROCESS_CREATE_TASK: relationRule(
    "process-to-lower-resource",
    "down",
    64,
    false,
  ),
  PROCESS_CREATE_WMI_CLASS: relationRule(
    "process-to-lower-resource",
    "down",
    64,
    false,
  ),
  PROCESS_CREATE_WMI_CONSUMER: relationRule(
    "process-to-lower-resource",
    "down",
    64,
    false,
  ),
  PROCESS_CREATE_WMI_FILTER: relationRule(
    "process-to-lower-resource",
    "down",
    64,
    false,
  ),
  PROCESS_CROSS_MEMORY_EXECUTE: relationRule(
    "primary-process-chain",
    "same-lane",
    86,
    false,
  ),
  PROCESS_DELETE_ACCOUNT: relationRule(
    "process-to-upper-resource",
    "up",
    58,
    false,
  ),
  PROCESS_DELETE_ACCOUNT_GROUP: relationRule(
    "process-to-upper-resource",
    "up",
    58,
    false,
  ),
  PROCESS_DELETE_FILE: relationRule(
    "process-to-lower-resource",
    "down",
    56,
    false,
  ),
  PROCESS_DELETE_FILE_STREAM: relationRule(
    "process-to-lower-resource",
    "down",
    56,
    false,
  ),
  PROCESS_DELETE_REGISTRY_KEY: relationRule(
    "process-to-lower-resource",
    "down",
    58,
    false,
  ),
  PROCESS_DELETE_REGISTRY_VALUE: relationRule(
    "process-to-lower-resource",
    "down",
    58,
    false,
  ),
  PROCESS_DELETE_SCHEDULED_JOB: relationRule(
    "process-to-lower-resource",
    "down",
    64,
    false,
  ),
  PROCESS_DELETE_SERVICE: relationRule(
    "process-to-lower-resource",
    "down",
    66,
    false,
  ),
  PROCESS_DELETE_TASK: relationRule(
    "process-to-lower-resource",
    "down",
    64,
    false,
  ),
  PROCESS_DISABLE_ACCOUNT: relationRule(
    "process-to-upper-resource",
    "up",
    58,
    false,
  ),
  PROCESS_ENABLE_ACCOUNT: relationRule(
    "process-to-upper-resource",
    "up",
    58,
    false,
  ),
  PROCESS_EXECUTE_CRYPTO: relationRule(
    "security-impact",
    "down",
    82,
    false,
  ),
  PROCESS_EXECUTE_POWERSHELL: relationRule(
    "process-to-side-resource",
    "same-lane",
    76,
    true,
  ),
  PROCESS_EXECUTE_WMI: relationRule(
    "process-to-lower-resource",
    "down",
    72,
    false,
  ),
  PROCESS_IMPERSONATE_TOKEN: relationRule(
    "process-to-upper-resource",
    "up",
    82,
    false,
  ),
  PROCESS_LOAD_DLL: relationRule(
    "process-to-lower-resource",
    "down",
    56,
    false,
  ),
  PROCESS_LOAD_DRIVER: relationRule(
    "process-to-lower-resource",
    "down",
    58,
    false,
  ),
  PROCESS_MODIFY_ACCOUNT: relationRule(
    "process-to-upper-resource",
    "up",
    58,
    false,
  ),
  PROCESS_MOVE_FILE: relationRule(
    "process-to-lower-resource",
    "down",
    56,
    false,
  ),
  PROCESS_OPEN_NAMED_EVENT: relationRule(
    "process-to-lower-resource",
    "down",
    46,
    false,
  ),
  PROCESS_QUERY_DNS_NAME: relationRule(
    "process-to-upper-resource",
    "up",
    70,
    false,
  ),
  PROCESS_QUERY_REGISTRY_VALUE: relationRule(
    "process-to-lower-resource",
    "down",
    58,
    false,
  ),
  PROCESS_QUERY_WMI: relationRule(
    "process-to-lower-resource",
    "down",
    66,
    false,
  ),
  PROCESS_READ_FILE: relationRule(
    "process-to-lower-resource",
    "down",
    52,
    false,
  ),
  PROCESS_REMOVE_ACCOUNT_FROM_GROUP: relationRule(
    "process-to-upper-resource",
    "up",
    58,
    false,
  ),
  PROCESS_RENAME_FILE: relationRule(
    "process-to-lower-resource",
    "down",
    56,
    false,
  ),
  PROCESS_RENAME_REGISTRY_KEY: relationRule(
    "process-to-lower-resource",
    "down",
    58,
    false,
  ),
  PROCESS_RESET_ACCOUNT_PASSWORD: relationRule(
    "process-to-upper-resource",
    "up",
    60,
    false,
  ),
  PROCESS_SET_FILE_EA: relationRule(
    "process-to-lower-resource",
    "down",
    54,
    false,
  ),
  PROCESS_SET_MESSAGE_HOOK: relationRule(
    "security-impact",
    "down",
    82,
    false,
  ),
  PROCESS_SET_REGISTRY_VALUE: relationRule(
    "process-to-lower-resource",
    "down",
    58,
    false,
  ),
  PROCESS_SET_TOKEN: relationRule(
    "process-to-upper-resource",
    "up",
    80,
    false,
  ),
  PROCESS_START_SERVICE: relationRule(
    "process-to-lower-resource",
    "down",
    68,
    false,
  ),
  PROCESS_STEAL_CREDENTIALS: relationRule(
    "security-impact",
    "down",
    86,
    false,
  ),
  PROCESS_STOP_SERVICE: relationRule(
    "process-to-lower-resource",
    "down",
    66,
    false,
  ),
  PROCESS_TERMINATE_PROCESS: relationRule(
    "primary-process-chain",
    "same-lane",
    84,
    true,
  ),
  PROCESS_TOUCH_MBR: relationRule(
    "security-impact",
    "down",
    88,
    false,
  ),
  PROCESS_WRITE_FILE: relationRule(
    "process-to-lower-resource",
    "down",
    58,
    false,
  ),
  REGISTRY_KEY_RENAME_TO: relationRule(
    "resource-structure-chain",
    "same-lane",
    64,
    true,
  ),
  SERVICE_IMAGE_MATCH_FILE: relationRule(
    "resource-association",
    "down",
    48,
    false,
  ),
  TARGET_REMOTE_HOST: relationRule(
    "resource-association",
    "up",
    56,
    false,
  ),
  TASK_IMAGE_MATCH_FILE: relationRule(
    "resource-association",
    "down",
    48,
    false,
  ),
  URL_DOWNLOAD_TO_FILE: relationRule(
    "resource-association",
    "down",
    58,
    false,
  ),
  WMI_FILTER_BIND_CONSUMER: relationRule(
    "resource-structure-chain",
    "same-lane",
    68,
    true,
  ),
};

export const ATTACK_GRAPH_SMALL_GRAPH_LAYOUT_RULES: readonly AttackGraphSmallGraphLayoutRule[] =
  [
    {
      kind: "two-node-direct",
      maxNodes: 2,
      description: "Two connected nodes are placed left-to-right on one line.",
    },
    {
      kind: "three-node-linear",
      maxNodes: 3,
      description: "A three-node path is placed left-to-right in path order.",
    },
    {
      kind: "same-lane-chain",
      maxNodes: 8,
      description:
        "Same-lane structural chains keep one horizontal row before fan-out rules run.",
    },
    {
      kind: "process-centered-star",
      maxNodes: 12,
      description:
        "Process fan-out keeps Process on the center line, network/identity above, file/registry/persistence below.",
    },
  ] as const;

export function getAttackGraphNodeLayoutRule(
  entityType: string | null | undefined,
): AttackGraphNodeLayoutRule {
  const normalized = String(entityType ?? "").trim();
  if (normalized in ATTACK_GRAPH_NODE_LAYOUT_RULES) {
    return ATTACK_GRAPH_NODE_LAYOUT_RULES[
      normalized as AttackGraphBackendEntityType
    ];
  }
  return nodeRule("unknown", "unknown", 999, false);
}

export function getAttackGraphRelationLayoutRule(
  relationType: string | null | undefined,
): AttackGraphRelationLayoutRule {
  const normalized = String(relationType ?? "").trim();
  if (normalized in ATTACK_GRAPH_RELATION_LAYOUT_RULES) {
    return ATTACK_GRAPH_RELATION_LAYOUT_RULES[
      normalized as AttackGraphRelationType
    ];
  }
  return relationRule("unknown", "side", 1, false);
}

export function compareAttackGraphNodesByLayout(
  left: AttackGraphLayoutNodeLike,
  right: AttackGraphLayoutNodeLike,
): number {
  const leftRule = getAttackGraphNodeLayoutRule(left.entityType);
  const rightRule = getAttackGraphNodeLayoutRule(right.entityType);
  const leftLane = ATTACK_GRAPH_LAYOUT_LANES[leftRule.lane];
  const rightLane = ATTACK_GRAPH_LAYOUT_LANES[rightRule.lane];
  if (leftLane.order !== rightLane.order) {
    return leftLane.order - rightLane.order;
  }
  if (leftRule.order !== rightRule.order) {
    return leftRule.order - rightRule.order;
  }
  return compareStableText(
    `${left.displayName}|${left.key}|${left.id}`,
    `${right.displayName}|${right.key}|${right.id}`,
  );
}

export function compareAttackGraphEdgesByLayout(
  left: AttackGraphLayoutEdgeLike,
  right: AttackGraphLayoutEdgeLike,
): number {
  const leftRule = getAttackGraphRelationLayoutRule(left.relationType);
  const rightRule = getAttackGraphRelationLayoutRule(right.relationType);
  if (leftRule.priority !== rightRule.priority) {
    return rightRule.priority - leftRule.priority;
  }
  if (leftRule.preferStraightChain !== rightRule.preferStraightChain) {
    return leftRule.preferStraightChain ? -1 : 1;
  }
  return compareStableText(
    `${left.source}|${left.target}|${left.relationType}|${left.id}`,
    `${right.source}|${right.target}|${right.relationType}|${right.id}`,
  );
}

export function getAttackGraphRelationLayoutWeight(
  relationType: string | null | undefined,
): number {
  const rule = getAttackGraphRelationLayoutRule(relationType);
  if (rule.role === "primary-process-chain") {
    return 8;
  }
  if (rule.preferStraightChain) {
    return 5;
  }
  if (rule.role === "case-structure" || rule.role === "evidence-link") {
    return 1;
  }
  return Math.max(1, Math.round(rule.priority / 25));
}

export function getAttackGraphLayoutCoverageReport(): AttackGraphLayoutCoverageReport {
  const expectedNodeTypes = new Set<string>(ATTACK_GRAPH_BACKEND_ENTITY_TYPES);
  const configuredNodeTypes = new Set<string>(
    Object.keys(ATTACK_GRAPH_NODE_LAYOUT_RULES),
  );
  const expectedRelationTypes = new Set<string>(ATTACK_GRAPH_RELATION_TYPES);
  const configuredRelationTypes = new Set<string>(
    Object.keys(ATTACK_GRAPH_RELATION_LAYOUT_RULES),
  );

  return {
    backendNodeTypeCount: expectedNodeTypes.size,
    relationTypeCount: expectedRelationTypes.size,
    missingNodeTypes: diffSets(expectedNodeTypes, configuredNodeTypes),
    missingRelationTypes: diffSets(expectedRelationTypes, configuredRelationTypes),
    extraNodeTypes: diffSets(configuredNodeTypes, expectedNodeTypes),
    extraRelationTypes: diffSets(configuredRelationTypes, expectedRelationTypes),
  };
}

function nodeRule(
  lane: AttackGraphLayoutLaneId,
  role: AttackGraphNodeLayoutRole,
  order: number,
  preferStraightWithSameType: boolean,
): AttackGraphNodeLayoutRule {
  return {
    lane,
    role,
    order,
    preferStraightWithSameType,
  };
}

function relationRule(
  role: AttackGraphRelationLayoutRole,
  direction: AttackGraphRelationLayoutDirection,
  priority: number,
  preferStraightChain: boolean,
): AttackGraphRelationLayoutRule {
  return {
    role,
    direction,
    priority,
    preferStraightChain,
  };
}

function diffSets(left: Set<string>, right: Set<string>): string[] {
  return [...left].filter((value) => !right.has(value)).sort();
}

function compareStableText(left: string, right: string): number {
  return left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}
