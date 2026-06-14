import {
  ATTACK_GRAPH_ENTITY_NODE_CONFIG,
  getAttackGraphEntityNodeDisplayName,
  getAttackGraphNodeKindConfig,
} from "../node/attack-graph-node-config";
import type { AttackGraphEntityType } from "../node/attack-graph-node-types";
import { getAttackGraphNodePresentationKind } from "../node/attack-graph-node-types";
import type {
  AttackGraphBadge,
  AttackGraphDetailField,
  AttackGraphNodeSummary,
  AttackGraphPresentationTone,
} from "./attack-graph-detail-types";

export interface AttackGraphNodeDetailInput {
  entityType: string | null | undefined;
  key?: string | null;
  displayName?: string | null;
  properties?: Record<string, string> | null;
  evidenceHit?: boolean;
  isNew?: boolean;
  missingFromResponse?: boolean;
}

const ATTACK_GRAPH_NODE_FIELD_LABELS: Record<string, string> = {
  access_type: "Access Type",
  account_name: "Account",
  address_family: "Address Family",
  agent_id: "Agent ID",
  base_path: "Base Path",
  class_name: "Class",
  classification: "Classification",
  command: "Command",
  computer_name: "Computer",
  content: "Content",
  cred_desc: "Credential",
  cred_type: "Credential Type",
  crypt_flag: "Crypto Flag",
  crypt_flag_description: "Crypto Operation",
  description: "Description",
  device_description: "Device",
  device_guid: "Device GUID",
  direction: "Direction",
  display_name: "Display Name",
  domain: "Domain",
  driver_type: "Driver Type",
  event_consumer_name: "Consumer",
  event_consumer_type_description: "Consumer Type",
  event_filter_name: "Filter",
  event_name: "Event",
  file_mapping_name: "File Mapping",
  file_name: "File",
  file_size: "File Size",
  flag: "Flag",
  graph_origin: "Graph Origin",
  group_name: "Group",
  hid: "HID",
  hook_type: "Hook Type",
  hook_type_description: "Hook",
  host: "Host",
  ip: "IP",
  job_binary_path_name: "Job Image",
  job_id: "Job ID",
  job_name: "Job",
  job_state: "Job State",
  job_type: "Job Type",
  key: "Key",
  mail_slot_name: "MailSlot",
  md5: "MD5",
  method_name: "Method",
  method_parameters: "Method Parameters",
  module_fingerprint: "Module Fingerprint",
  namespace: "Namespace",
  object_name: "Object",
  object_value: "Value",
  operation_kind: "Operation",
  operator_token_context: "Operator Token",
  org_file_name: "Original File",
  os: "OS",
  owner: "Owner",
  parent_process_id: "Parent PID",
  path: "Path",
  physical_name: "Physical Device",
  pipe_name: "Pipe",
  port: "Port",
  process_command_line: "Command Line",
  process_id: "PID",
  process_image: "Image",
  process_name: "Process",
  protocol: "Protocol",
  query: "Query",
  query_fingerprint: "Query Fingerprint",
  script_fingerprint: "Script Fingerprint",
  server_name: "Server",
  service_binary_path_name: "Service Image",
  service_name: "Service",
  service_type: "Service Type",
  sha1: "SHA1",
  sha256: "SHA256",
  sid: "SID",
  start_type: "Start Type",
  stream_name: "Stream",
  stream_size: "Stream Size",
  target_name: "Target",
  target_token_context: "Target Token",
  task_name: "Task",
  task_path: "Task Path",
  token_flag: "Token Flag",
  token_flag_description: "Token Operation",
  url: "URL",
  user: "User",
  user_name: "User",
  username: "Username",
};

const ATTACK_GRAPH_ENTITY_NODE_DETAIL_FIELD_KEYS: Partial<
  Record<AttackGraphEntityType, string[]>
> = {
  Account: ["domain", "user", "user_name", "username", "account_name", "sid"],
  AccountGroup: ["domain", "group_name", "sid"],
  Bits: ["job_name", "job_id", "job_state", "job_type", "owner"],
  CredentialTheft: ["cred_desc", "cred_type", "target_name", "user_name"],
  Crypto: ["crypt_flag_description", "operation_kind", "crypt_flag"],
  Device: ["device_description", "device_guid", "hid", "driver_type"],
  DnsName: ["domain"],
  File: [
    "file_name",
    "org_file_name",
    "description",
    "file_size",
    "md5",
    "sha1",
    "sha256",
  ],
  FileMapping: ["file_mapping_name"],
  FileStream: ["base_path", "stream_name", "stream_size"],
  Host: ["computer_name", "domain", "agent_id", "os"],
  HostRef: ["server_name", "ip", "domain"],
  MailSlot: ["mail_slot_name"],
  Mbr: ["physical_name", "driver_type"],
  MessageHook: [
    "hook_type_description",
    "message_hook_module",
    "hook_type",
    "module_fingerprint",
  ],
  NamedEvent: ["event_name"],
  NamedPipe: ["pipe_name"],
  NetAddress: ["ip", "address_family"],
  NetEndpoint: ["ip", "port", "protocol", "direction"],
  PowerShellExecution: [
    "file_name",
    "process_command_line",
    "script_fingerprint",
    "content",
  ],
  Process: [
    "process_name",
    "process_image",
    "process_command_line",
    "process_id",
    "parent_process_id",
    "user_name",
  ],
  RegistryKey: ["object_name", "description", "classification"],
  RegistryValue: ["object_name", "object_value", "description", "classification"],
  ScheduledJob: ["job_binary_path_name", "command", "job_id", "flag"],
  Service: [
    "display_name",
    "service_name",
    "service_binary_path_name",
    "start_type",
    "service_type",
  ],
  Task: ["task_name", "task_path", "server_name", "command"],
  TokenImpersonation: [
    "token_flag_description",
    "token_flag",
    "operator_token_context",
    "target_token_context",
  ],
  URLResource: ["url", "host", "path"],
  Volume: ["file_name", "driver_type", "access_type"],
  WmiClass: ["class_name", "namespace", "server_name"],
  WmiConsumer: [
    "event_consumer_name",
    "event_consumer_type_description",
    "class_name",
    "namespace",
  ],
  WmiExecute: [
    "class_name",
    "method_name",
    "method_parameters",
    "namespace",
    "server_name",
  ],
  WmiFilter: ["event_filter_name", "query", "namespace", "server_name"],
  WmiQuery: ["query", "query_fingerprint", "namespace", "server_name"],
};

interface NormalizedAttackGraphNodePresentationInput {
  entityType: string;
  key: string;
  displayName: string;
  properties: Record<string, string>;
  evidenceHit: boolean;
  isNew: boolean;
  missingFromResponse: boolean;
}

export function getAttackGraphNodeSummary(
  input: AttackGraphNodeDetailInput,
): AttackGraphNodeSummary {
  const normalized = normalizeNodePresentationInput(input);
  const entityConfig = getEntityNodeConfig(normalized.entityType);
  const kind = getAttackGraphNodePresentationKind(normalized.entityType);
  const kindConfig = getAttackGraphNodeKindConfig(kind);
  const title =
    getAttackGraphEntityNodeDisplayName(normalized) ||
    normalized.displayName ||
    normalized.key ||
    "Unknown";
  const subtitle = entityConfig?.label ?? kindConfig.label;
  const fields = getAttackGraphNodeDetailFields(normalized);

  return {
    title,
    subtitle,
    badges: buildNodeBadges(normalized, subtitle, kindConfig.accentColor),
    fields,
  };
}

export function getAttackGraphNodeDetailFields(
  input: AttackGraphNodeDetailInput,
): AttackGraphDetailField[] {
  return buildGenericNodeDetailFields(normalizeNodePresentationInput(input));
}

function normalizeNodePresentationInput(
  input: AttackGraphNodeDetailInput,
): NormalizedAttackGraphNodePresentationInput {
  return {
    entityType: stringValue(input.entityType),
    key: stringValue(input.key),
    displayName: stringValue(input.displayName),
    properties: normalizeStringRecord(input.properties),
    evidenceHit: Boolean(input.evidenceHit),
    isNew: Boolean(input.isNew),
    missingFromResponse: Boolean(input.missingFromResponse),
  };
}

function getEntityNodeConfig(entityType: string) {
  if (entityType in ATTACK_GRAPH_ENTITY_NODE_CONFIG) {
    return ATTACK_GRAPH_ENTITY_NODE_CONFIG[entityType as AttackGraphEntityType];
  }
  return null;
}

function buildNodeBadges(
  input: NormalizedAttackGraphNodePresentationInput,
  entityLabel: string,
  accentColor: string | undefined,
): AttackGraphBadge[] {
  const badges: AttackGraphBadge[] = [
    {
      key: "entity-type",
      label: entityLabel,
      tone: getNodePresentationTone(input.entityType, accentColor),
    },
  ];

  if (input.evidenceHit) {
    badges.push({
      key: "evidence-hit",
      label: "Evidence",
      tone: "orange",
      title: "Referenced by attack case evidence",
    });
  }

  if (input.isNew) {
    badges.push({
      key: "new",
      label: "New",
      tone: "green",
    });
  }

  if (input.missingFromResponse) {
    badges.push({
      key: "missing",
      label: "Missing",
      tone: "slate",
      title: "Endpoint was referenced by an edge but was not returned as a node",
    });
  }

  return badges;
}

function buildGenericNodeDetailFields(
  input: NormalizedAttackGraphNodePresentationInput,
): AttackGraphDetailField[] {
  const fields: AttackGraphDetailField[] = [];
  const added = new Set<string>();
  const priorityKeys = getEntityNodeDetailFieldKeys(input.entityType);

  addDetailField(fields, added, {
    key: "entity_type",
    label: "Entity Type",
    value: input.entityType,
    tone: getNodePresentationTone(input.entityType),
    important: true,
  });

  const extractedDisplayName = getAttackGraphEntityNodeDisplayName(input);
  if (input.displayName && input.displayName !== extractedDisplayName) {
    addDetailField(fields, added, {
      key: "display_name",
      label: "Original Label",
      value: input.displayName,
      copyable: true,
      important: true,
    });
  }

  for (const key of priorityKeys) {
    addPropertyDetailField(fields, added, input.properties, key, true);
  }

  for (const key of Object.keys(input.properties).sort()) {
    if (fields.length >= 18) {
      break;
    }
    addPropertyDetailField(fields, added, input.properties, key, false);
  }

  addDetailField(fields, added, {
    key: "key",
    label: "Node Key",
    value: input.key,
    mono: true,
    copyable: true,
  });

  return fields;
}

function getEntityNodeDetailFieldKeys(entityType: string) {
  if (entityType in ATTACK_GRAPH_ENTITY_NODE_DETAIL_FIELD_KEYS) {
    return (
      ATTACK_GRAPH_ENTITY_NODE_DETAIL_FIELD_KEYS[
        entityType as AttackGraphEntityType
      ] ?? []
    );
  }
  return [];
}

function addPropertyDetailField(
  fields: AttackGraphDetailField[],
  added: Set<string>,
  properties: Record<string, string>,
  key: string,
  important: boolean,
) {
  const value = properties[key];
  addDetailField(fields, added, {
    key,
    label: getFieldLabel(key),
    value,
    mono: isMonoField(key),
    copyable: isCopyableField(key),
    important,
  });
}

function addDetailField(
  fields: AttackGraphDetailField[],
  added: Set<string>,
  field: AttackGraphDetailField,
) {
  const value = stringValue(field.value);
  if (!value || added.has(field.key)) {
    return;
  }
  fields.push({
    ...field,
    value,
  });
  added.add(field.key);
}

function getNodePresentationTone(
  entityType: string,
  accentColor?: string,
): AttackGraphPresentationTone {
  const kind = getAttackGraphNodePresentationKind(entityType);
  const config = getAttackGraphNodeKindConfig(kind);
  const color = (accentColor ?? config.accentColor ?? "").toLowerCase();

  if (config.family === "security" || config.family === "evidence") {
    return "red";
  }
  if (config.family === "process") {
    return "cyan";
  }
  if (config.family === "network" || config.family === "host") {
    return "blue";
  }
  if (config.family === "file") {
    return "amber";
  }
  if (config.family === "registry" || config.family === "persistence") {
    return "purple";
  }
  if (config.family === "identity") {
    return "blue";
  }
  if (color.includes("f59") || color.includes("ff9") || color.includes("f57")) {
    return "orange";
  }
  return "slate";
}

function getFieldLabel(key: string) {
  return ATTACK_GRAPH_NODE_FIELD_LABELS[key] ?? toTitleLabel(key);
}

function toTitleLabel(key: string) {
  return key
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isMonoField(key: string) {
  return /(^|_)(id|key|sid|md5|sha1|sha256|fingerprint|guid|pid)($|_)/i.test(
    key,
  );
}

function isCopyableField(key: string) {
  return (
    isMonoField(key) ||
    key.includes("command") ||
    key.includes("name") ||
    key === "url" ||
    key === "object_value"
  );
}

function normalizeStringRecord(
  value: Record<string, string> | null | undefined,
): Record<string, string> {
  if (!value) {
    return {};
  }

  return Object.entries(value).reduce<Record<string, string>>(
    (record, [key, item]) => {
      const normalizedKey = stringValue(key);
      const normalizedValue = stringValue(item);
      if (normalizedKey && normalizedValue) {
        record[normalizedKey] = normalizedValue;
      }
      return record;
    },
    {},
  );
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
