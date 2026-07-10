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
  precheckEligible: boolean;
  precheckUnavailableReason: string;
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

      const identity = buildAttackGraphIocIdentityKey(config.type, value);
      if (seen.has(identity)) continue;
      seen.add(identity);
      const precheckUnavailableReason =
        config.type === "ip" && isPrivateOrNonRoutableIp(value)
          ? "私网或不可路由 IP 无需预检"
          : "";
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
        precheckEligible: precheckUnavailableReason === "",
        precheckUnavailableReason,
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
    buildAttackGraphIocIdentityKey(input.iocType, input.value),
  ].join("\u0000");
}

export function buildAttackGraphIocIdentityKey(
  iocType: string,
  value: string,
) {
  return [
    iocType.trim().toLowerCase(),
    normalizeIocValueForIdentity(iocType, value),
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
    const domain = value.replace(/\.+$/, "").toLowerCase();
    return domain.includes(".") && !domain.includes(" ") ? domain : "";
  }
  if (type === "ip") {
    return normalizeIpValue(value);
  }
  if (type === "url") {
    return normalizeHttpUrl(value);
  }
  return value;
}

function normalizeIocValueForIdentity(type: string, rawValue: string) {
  const normalizedType = type.trim().toLowerCase() as AttackGraphIocType;
  return normalizeIocValue(normalizedType, rawValue) || rawValue.trim().toLowerCase();
}

function normalizeHttpUrl(rawValue: string) {
  const value = rawValue.trim();
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
  } catch {
    return "";
  }

  const match = value.match(/^(https?):\/\/([^/?#]+)(.*)$/i);
  if (!match) return "";
  const authority = match[2];
  const userInfoEnd = authority.lastIndexOf("@");
  const userInfo = userInfoEnd >= 0 ? authority.slice(0, userInfoEnd + 1) : "";
  const host = authority.slice(userInfoEnd + 1).toLowerCase();
  return `${match[1].toLowerCase()}://${userInfo}${host}${match[3]}`;
}

function normalizeIpValue(rawValue: string) {
  const value = rawValue.trim();
  const ipv4 = parseIpv4(value);
  if (ipv4) return ipv4.join(".");
  if (!value.includes(":")) return "";

  try {
    const hostname = new URL(`http://[${value}]/`).hostname;
    return hostname.replace(/^\[|\]$/g, "").toLowerCase();
  } catch {
    return "";
  }
}

function parseIpv4(value: string) {
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(value)) return null;
  const parts = value.split(".");
  if (parts.some((part) => part.length > 1 && part.startsWith("0"))) {
    return null;
  }
  const octets = parts.map(Number);
  return octets.every((octet) => octet >= 0 && octet <= 255)
    ? octets
    : null;
}

function isPrivateOrNonRoutableIp(value: string) {
  const ipv4 = parseIpv4(value);
  if (ipv4) return isPrivateOrNonRoutableIpv4(ipv4);

  const normalized = normalizeIpValue(value);
  if (!normalized) return true;
  if (normalized === "::" || normalized === "::1") return true;
  const firstHextet = Number.parseInt(normalized.split(":", 1)[0] || "0", 16);
  if ((firstHextet & 0xfe00) === 0xfc00) return true;
  if ((firstHextet & 0xffc0) === 0xfe80) return true;
  if ((firstHextet & 0xff00) === 0xff00) return true;

  if (normalized.startsWith("::ffff:")) {
    const mapped = ipv4FromMappedIpv6(normalized.slice("::ffff:".length));
    return mapped ? isPrivateOrNonRoutableIpv4(mapped) : true;
  }
  return false;
}

function ipv4FromMappedIpv6(value: string) {
  const dotted = parseIpv4(value);
  if (dotted) return dotted;
  const parts = value.split(":");
  if (parts.length !== 2) return null;
  const high = Number.parseInt(parts[0], 16);
  const low = Number.parseInt(parts[1], 16);
  if (![high, low].every((part) => Number.isFinite(part) && part >= 0 && part <= 0xffff)) {
    return null;
  }
  return [high >> 8, high & 0xff, low >> 8, low & 0xff];
}

function isPrivateOrNonRoutableIpv4([first, second, third, fourth]: number[]) {
  return (
    first === 10 ||
    first === 127 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 169 && second === 254) ||
    (first === 224 && second === 0 && third === 0 && fourth === 0) ||
    (first >= 224 && first <= 239) ||
    (first === 0 && second === 0 && third === 0 && fourth === 0)
  );
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
