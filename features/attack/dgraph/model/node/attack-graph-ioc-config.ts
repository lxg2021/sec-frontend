import { v5 as uuidv5 } from "uuid";

import type { AttackGraphNodeModel } from "../core/attack-graph-data";

export type AttackGraphIocType =
  | "md5"
  | "sha1"
  | "sha256"
  | "ip"
  | "domain"
  | "url";

export interface AttackGraphNodeIocCandidate {
  iocType: AttackGraphIocType;
  queryType: AttackGraphIocType;
  value: string;
  sourceRefId: string;
  sourceField: string;
  sourceEntityType: string;
  sourceDisplayName: string;
  fileName: string;
  filePath: string;
}

interface IocFieldConfig {
  field: string;
  type: AttackGraphIocType;
  multiple?: boolean;
}

const HASH_PATTERN_BY_TYPE: Record<"md5" | "sha1" | "sha256", RegExp> = {
  md5: /^[a-f0-9]{32}$/i,
  sha1: /^[a-f0-9]{40}$/i,
  sha256: /^[a-f0-9]{64}$/i,
};

const ATTACK_GRAPH_IOC_SOURCE_REF_MAX_LENGTH = 128;

const IOC_FIELDS_BY_ENTITY_TYPE: Record<string, readonly IocFieldConfig[]> = {
  DnsName: [{ field: "domain", type: "domain" }],
  File: [
    { field: "file_md5", type: "md5" },
    { field: "file_sha1", type: "sha1" },
    { field: "file_sha256", type: "sha256" },
    { field: "md5", type: "md5" },
    { field: "sha1", type: "sha1" },
    { field: "sha256", type: "sha256" },
  ],
  FileStream: [
    { field: "file_md5", type: "md5" },
    { field: "file_sha1", type: "sha1" },
    { field: "file_sha256", type: "sha256" },
  ],
  NetAddress: [{ field: "ip", type: "ip" }],
  Process: [
    { field: "process_md5", type: "md5" },
    { field: "process_sha1", type: "sha1" },
    { field: "process_sha256", type: "sha256" },
  ],
  ScheduledJob: [
    { field: "job_binary_md5", type: "md5" },
    { field: "job_binary_sha1", type: "sha1" },
    { field: "job_binary_sha256", type: "sha256" },
  ],
  Service: [
    { field: "service_binary_md5", type: "md5" },
    { field: "service_binary_sha1", type: "sha1" },
    { field: "service_binary_sha256", type: "sha256" },
  ],
  Task: [
    { field: "task_image_md5s", type: "md5", multiple: true },
    { field: "task_image_sha1s", type: "sha1", multiple: true },
    { field: "task_image_sha256s", type: "sha256", multiple: true },
  ],
  URLResource: [{ field: "url", type: "url" }],
};

export function getAttackGraphNodeIocCandidates(
  node: AttackGraphNodeModel,
): AttackGraphNodeIocCandidate[] {
  const sourceRefId = compactAttackGraphIocSourceRefId(node.key || node.id);
  const fieldConfigs = IOC_FIELDS_BY_ENTITY_TYPE[node.entityType] ?? [];
  if (!sourceRefId || fieldConfigs.length === 0) return [];

  const fileName = pickProperty(node.properties, [
    "file_name",
    "org_file_name",
    "process_name",
  ]);
  const filePath = pickProperty(node.properties, [
    "path",
    "base_path",
    "process_image",
    "service_binary_path_name",
    "job_binary_path_name",
  ]);
  const candidates: AttackGraphNodeIocCandidate[] = [];
  const seen = new Set<string>();

  for (const config of fieldConfigs) {
    const propertyValue = node.properties[config.field];
    const fallbackValue = getEntityFallbackValue(node, config);
    const values = config.multiple
      ? splitMultipleValues(propertyValue)
      : [String(propertyValue || fallbackValue || "").trim()];

    for (const rawValue of values) {
      const value = normalizeIocValue(config.type, rawValue);
      if (!value) continue;

      const identity = `${config.type}\u0000${config.field}\u0000${value}`;
      if (seen.has(identity)) continue;
      seen.add(identity);
      candidates.push({
        iocType: config.type,
        queryType: config.type,
        value,
        sourceRefId,
        sourceField: config.field,
        sourceEntityType: node.entityType,
        sourceDisplayName: node.displayName || sourceRefId,
        fileName,
        filePath,
      });
    }
  }

  return candidates;
}

export function compactAttackGraphIocSourceRefId(rawSourceRefId: string) {
  const sourceRefId = rawSourceRefId.trim();
  if (sourceRefId.length <= ATTACK_GRAPH_IOC_SOURCE_REF_MAX_LENGTH) {
    return sourceRefId;
  }

  return `graph-node:${uuidv5(sourceRefId, uuidv5.URL)}`;
}

export function buildAttackGraphIocSourceKey(input: {
  iocType: string;
  value: string;
  sourceRefId: string;
  sourceField: string;
}) {
  return [
    input.sourceRefId.trim(),
    input.sourceField.trim().toLowerCase(),
    input.iocType.trim().toLowerCase(),
    normalizeIocValueForIdentity(input.iocType, input.value),
  ].join("\u0000");
}

function getEntityFallbackValue(
  node: AttackGraphNodeModel,
  config: IocFieldConfig,
) {
  if (
    (node.entityType === "DnsName" && config.type === "domain") ||
    (node.entityType === "NetAddress" && config.type === "ip") ||
    (node.entityType === "URLResource" && config.type === "url")
  ) {
    return node.displayName;
  }
  return "";
}

function normalizeIocValue(type: AttackGraphIocType, rawValue: string) {
  const value = rawValue.trim();
  if (!value || value.toUpperCase() === "NULL") return "";

  if (type === "md5" || type === "sha1" || type === "sha256") {
    return HASH_PATTERN_BY_TYPE[type].test(value) ? value.toLowerCase() : "";
  }
  if (type === "domain") {
    const domain = value.replace(/\.$/, "").toLowerCase();
    return domain.includes(".") && !domain.includes(" ") ? domain : "";
  }
  if (type === "url") {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:"
        ? parsed.toString()
        : "";
    } catch {
      return "";
    }
  }
  return value;
}

function normalizeIocValueForIdentity(type: string, rawValue: string) {
  const normalizedType = type.trim().toLowerCase() as AttackGraphIocType;
  return normalizeIocValue(normalizedType, rawValue) || rawValue.trim().toLowerCase();
}

function splitMultipleValues(rawValue: string | undefined) {
  const value = String(rawValue || "").trim();
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item || "").trim()).filter(Boolean);
    }
  } catch {
    // Graph list fields may also arrive as comma or semicolon separated text.
  }
  return value.split(/[,;|\s]+/).map((item) => item.trim()).filter(Boolean);
}

function pickProperty(
  properties: Record<string, string>,
  keys: readonly string[],
) {
  for (const key of keys) {
    const value = String(properties[key] || "").trim();
    if (value && value.toUpperCase() !== "NULL") return value;
  }
  return "";
}
