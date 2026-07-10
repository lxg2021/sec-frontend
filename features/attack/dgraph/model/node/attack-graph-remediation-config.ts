import type { AttackGraphEntityType } from "./attack-graph-node-types";

export type AttackGraphRemediationCapability =
  | "process"
  | "file"
  | "scheduled-task"
  | "service"
  | "account"
  | "registry"
  | "wmi"
  | "bits"
  | "network";

export interface AttackGraphRemediationNodeConfig {
  entityType: AttackGraphEntityType;
  capability: AttackGraphRemediationCapability;
  snapshotKind:
    | "process"
    | "file"
    | "scheduled_task"
    | "service"
    | "account"
    | "registry"
    | "wmi_class"
    | "wmi_subscription"
    | "bits_job"
    | "network";
}

export const ATTACK_GRAPH_REMEDIATION_NODE_CONFIG: Partial<
  Record<AttackGraphEntityType, AttackGraphRemediationNodeConfig>
> = {
  Account: {
    entityType: "Account",
    capability: "account",
    snapshotKind: "account",
  },
  Bits: {
    entityType: "Bits",
    capability: "bits",
    snapshotKind: "bits_job",
  },
  DnsName: {
    entityType: "DnsName",
    capability: "network",
    snapshotKind: "network",
  },
  File: {
    entityType: "File",
    capability: "file",
    snapshotKind: "file",
  },
  FileStream: {
    entityType: "FileStream",
    capability: "file",
    snapshotKind: "file",
  },
  NetAddress: {
    entityType: "NetAddress",
    capability: "network",
    snapshotKind: "network",
  },
  NetEndpoint: {
    entityType: "NetEndpoint",
    capability: "network",
    snapshotKind: "network",
  },
  Process: {
    entityType: "Process",
    capability: "process",
    snapshotKind: "process",
  },
  RegistryKey: {
    entityType: "RegistryKey",
    capability: "registry",
    snapshotKind: "registry",
  },
  RegistryValue: {
    entityType: "RegistryValue",
    capability: "registry",
    snapshotKind: "registry",
  },
  ScheduledJob: {
    entityType: "ScheduledJob",
    capability: "scheduled-task",
    snapshotKind: "scheduled_task",
  },
  Service: {
    entityType: "Service",
    capability: "service",
    snapshotKind: "service",
  },
  Task: {
    entityType: "Task",
    capability: "scheduled-task",
    snapshotKind: "scheduled_task",
  },
  URLResource: {
    entityType: "URLResource",
    capability: "network",
    snapshotKind: "network",
  },
  WmiClass: {
    entityType: "WmiClass",
    capability: "wmi",
    snapshotKind: "wmi_class",
  },
  WmiConsumer: {
    entityType: "WmiConsumer",
    capability: "wmi",
    snapshotKind: "wmi_subscription",
  },
  WmiFilter: {
    entityType: "WmiFilter",
    capability: "wmi",
    snapshotKind: "wmi_subscription",
  },
};

export const ATTACK_GRAPH_REMEDIATION_ENTITY_TYPES = Object.freeze(
  Object.keys(ATTACK_GRAPH_REMEDIATION_NODE_CONFIG) as AttackGraphEntityType[],
);

const ATTACK_GRAPH_ENTITY_TYPE_ALIASES: Record<string, AttackGraphEntityType> = {
  account: "Account",
  bits: "Bits",
  bitsjob: "Bits",
  bits_job: "Bits",
  dns: "DnsName",
  dnsname: "DnsName",
  dns_name: "DnsName",
  file: "File",
  filestream: "FileStream",
  file_stream: "FileStream",
  netaddress: "NetAddress",
  net_address: "NetAddress",
  netendpoint: "NetEndpoint",
  net_endpoint: "NetEndpoint",
  process: "Process",
  registrykey: "RegistryKey",
  registry_key: "RegistryKey",
  registryvalue: "RegistryValue",
  registry_value: "RegistryValue",
  scheduledjob: "ScheduledJob",
  scheduled_job: "ScheduledJob",
  service: "Service",
  task: "Task",
  url: "URLResource",
  urlresource: "URLResource",
  url_resource: "URLResource",
  wmiclass: "WmiClass",
  wmi_class: "WmiClass",
  wmiconsumer: "WmiConsumer",
  wmi_consumer: "WmiConsumer",
  wmifilter: "WmiFilter",
  wmi_filter: "WmiFilter",
};

export function normalizeAttackGraphRemediationEntityType(
  entityType: string | null | undefined,
): AttackGraphEntityType | null {
  const normalized = String(entityType ?? "").trim();
  if (!normalized) return null;
  if (normalized in ATTACK_GRAPH_REMEDIATION_NODE_CONFIG) {
    return normalized as AttackGraphEntityType;
  }
  return ATTACK_GRAPH_ENTITY_TYPE_ALIASES[
    normalized.replace(/[\s-]+/g, "_").toLowerCase()
  ] ?? null;
}

export function getAttackGraphRemediationNodeConfig(
  entityType: string | null | undefined,
) {
  const normalized = normalizeAttackGraphRemediationEntityType(entityType);
  return normalized
    ? ATTACK_GRAPH_REMEDIATION_NODE_CONFIG[normalized] ?? null
    : null;
}

export function canShowAttackGraphRemediationMenu(
  entityType: string | null | undefined,
) {
  return Boolean(getAttackGraphRemediationNodeConfig(entityType));
}
