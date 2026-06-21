"use client"

import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"

import type {
  IocQueryEntry,
  IocQueryObservation,
  IocQueryPagination,
  IocQueryRelation,
  IocQueryResult,
  IocVerificationType,
} from "./types"

type ApiResult<T> = {
  data: T
  raw?: unknown
}

type BackendObject = Record<string, unknown>

const IOC_QUERY_TYPE_CODE: Record<IocVerificationType, number> = {
  auto: 1,
  hash: 2,
  md5: 3,
  sha256: 4,
  url: 5,
  domain: 6,
  hostname: 7,
  ip: 8,
  email: 12,
  sha1: 13,
}

const IOC_QUERY_TYPE_LABEL: Record<number, IocVerificationType | string> = {
  1: "auto",
  2: "hash",
  3: "md5",
  4: "sha256",
  5: "url",
  6: "domain",
  7: "hostname",
  8: "ip",
  9: "ip",
  10: "ip",
  11: "certificate",
  12: "email",
  13: "sha1",
}

const HIT_SOURCE_LABEL: Record<number, string> = {
  1: "cache_hit",
  2: "local_hit",
  3: "remote_hit",
  4: "remote_miss",
  5: "miss_cache_hit",
  6: "remote_error_suppressed",
}

function objectValue(value: unknown): BackendObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as BackendObject)
    : {}
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function numberValue(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function boolValue(value: unknown) {
  return value === true
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => stringValue(item)).filter(Boolean)
    : []
}

function enumCode(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  if (typeof value === "string") {
    const numeric = Number(value)
    if (Number.isFinite(numeric)) return numeric
    const normalized = value.trim().toLowerCase()
    const queryType = Object.entries(IOC_QUERY_TYPE_LABEL).find(
      ([, label]) =>
        String(label).toLowerCase() === normalized ||
        `ioc_query_type_${label}`.toLowerCase() === normalized,
    )
    if (queryType) return Number(queryType[0])
    const hitSource = Object.entries(HIT_SOURCE_LABEL).find(
      ([, label]) =>
        label === normalized ||
        `query_hit_source_${label}`.toLowerCase() === normalized,
    )
    if (hitSource) return Number(hitSource[0])
  }
  return 0
}

function normalizeEntry(raw: unknown): IocQueryEntry | null {
  const item = objectValue(raw)
  if (!Object.keys(item).length) return null

  return {
    id: stringValue(item.id),
    ioc_type: stringValue(item.ioc_type),
    normalized_value: stringValue(item.normalized_value),
    display_value: stringValue(item.display_value),
    status: stringValue(item.status),
    risk_score: numberValue(item.risk_score),
    confidence: numberValue(item.confidence),
    tags: stringArray(item.tags),
    extra_json: stringValue(item.extra_json),
    first_seen: stringValue(item.first_seen),
    last_seen: stringValue(item.last_seen),
  }
}

function normalizeObservation(raw: unknown): IocQueryObservation {
  const item = objectValue(raw)
  return {
    source_name: stringValue(item.source_name),
    source_record_id: stringValue(item.source_record_id),
    source_url: stringValue(item.source_url),
    confidence: numberValue(item.confidence),
    first_seen: stringValue(item.first_seen),
    last_seen: stringValue(item.last_seen),
    raw_json: stringValue(item.raw_json),
  }
}

function normalizeRelation(raw: unknown): IocQueryRelation {
  const item = objectValue(raw)
  return {
    relation_type: stringValue(item.relation_type),
    direction: stringValue(item.direction),
    source_name: stringValue(item.source_name),
    source_record_id: stringValue(item.source_record_id),
    first_seen: stringValue(item.first_seen),
    last_seen: stringValue(item.last_seen),
    raw_json: stringValue(item.raw_json),
    peer_entry: normalizeEntry(item.peer_entry),
  }
}

function normalizePagination(raw: unknown): IocQueryPagination | null {
  const item = objectValue(raw)
  if (!Object.keys(item).length) return null

  return {
    total: numberValue(item.total),
    returned: numberValue(item.returned),
    offset: numberValue(item.offset),
    limit: numberValue(item.limit),
    has_more: boolValue(item.has_more),
    next_offset: numberValue(item.next_offset),
    raw_json_trimmed: boolValue(item.raw_json_trimmed),
  }
}

function normalizeQueryResult(raw: unknown): IocQueryResult {
  const item = objectValue(raw)
  const detectedTypeCode = enumCode(item.detected_type)
  const hitSourceCode = enumCode(item.hit_source)
  const truncation = objectValue(item.truncation)

  return {
    request_id: stringValue(item.request_id),
    hit: boolValue(item.hit),
    detected_type:
      IOC_QUERY_TYPE_LABEL[detectedTypeCode] ||
      stringValue(item.detected_type) ||
      "unknown",
    detected_type_code: detectedTypeCode,
    entry: normalizeEntry(item.entry),
    observations: Array.isArray(item.observations)
      ? item.observations.map(normalizeObservation)
      : [],
    relations: Array.isArray(item.relations)
      ? item.relations.map(normalizeRelation)
      : [],
    hit_source:
      HIT_SOURCE_LABEL[hitSourceCode] ||
      stringValue(item.hit_source) ||
      "unknown",
    hit_source_code: hitSourceCode,
    truncation: Object.keys(truncation).length
      ? {
          observations: normalizePagination(truncation.observations),
          relations: normalizePagination(truncation.relations),
        }
      : null,
  }
}

export function iocQueryTypeCode(type: IocVerificationType) {
  return IOC_QUERY_TYPE_CODE[type] ?? IOC_QUERY_TYPE_CODE.auto
}

export async function queryIoc({
  type,
  value,
}: {
  type: IocVerificationType
  value: string
}): Promise<IocQueryResult> {
  const result = (await http.post("/sensor/ioc/query", {
    request_id: createRequestId(),
    type: iocQueryTypeCode(type),
    value: value.trim(),
  })) as ApiResult<unknown>

  return normalizeQueryResult(result.data)
}
