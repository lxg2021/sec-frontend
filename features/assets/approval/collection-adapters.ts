import type {
  CollectionApprovalResult,
  CollectionSubmissionDetail,
  CollectionSubmissionListData,
  CollectionSubmissionStatus,
  CollectionSubmissionSummary,
} from "@/features/assets/approval/collection-types"

interface AdaptPaginationFallback {
  page: number
  pageSize: number
}

type UnknownRecord = Record<string, unknown>

function asRecord(value: unknown): UnknownRecord {
  return typeof value === "object" && value !== null ? (value as UnknownRecord) : {}
}

function toNumber(value: unknown, fallback: number) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function toOptionalNumber(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : undefined
}

function adaptStatus(value: unknown): CollectionSubmissionStatus {
  if (
    value === 1 ||
    value === 2 ||
    value === 3 ||
    value === 4 ||
    value === 5 ||
    value === 6 ||
    value === "COLLECTION_SUBMISSION_PENDING" ||
    value === "COLLECTION_SUBMISSION_APPROVING" ||
    value === "COLLECTION_SUBMISSION_APPROVED" ||
    value === "COLLECTION_SUBMISSION_REJECTED" ||
    value === "COLLECTION_SUBMISSION_FAILED" ||
    value === "COLLECTION_SUBMISSION_DELETED"
  ) {
    return value
  }

  return 1
}

export function adaptCollectionSubmissionSummary(value: unknown): CollectionSubmissionSummary {
  const summary = asRecord(value)

  return {
    submission_id: String(summary?.submission_id || ""),
    tenant_id: String(summary?.tenant_id || ""),
    status: adaptStatus(summary?.status),
    host_count: toNumber(summary?.host_count, 0),
    logic_group_count: toNumber(summary?.logic_group_count, 0),
    submitter: (summary.submitter || undefined) as CollectionSubmissionSummary["submitter"],
    source_ip: (summary.source_ip || undefined) as string | undefined,
    created_at: toNumber(summary?.created_at, 0),
    updated_at: toNumber(summary?.updated_at, 0),
    reviewed_by: (summary.reviewed_by || undefined) as string | undefined,
    reviewed_at: toOptionalNumber(summary?.reviewed_at),
  }
}

export function adaptCollectionSubmissionListData(
  value: unknown,
  fallback: AdaptPaginationFallback,
): CollectionSubmissionListData {
  const data = asRecord(value)
  const items = Array.isArray(data.items) ? data.items.map(adaptCollectionSubmissionSummary) : []

  return {
    items,
    page: toNumber(data?.page, fallback.page),
    page_size: toNumber(data?.page_size, fallback.pageSize),
    total: toNumber(data?.total, items.length),
  }
}

export function adaptCollectionSubmissionDetail(value: unknown): CollectionSubmissionDetail {
  const data = asRecord(value)
  const summary = adaptCollectionSubmissionSummary({
    ...data,
    host_count: data?.host_count ?? (Array.isArray(data?.hosts) ? data.hosts.length : 0),
    logic_group_count: data?.logic_group_count ?? (Array.isArray(data?.logic_groups) ? data.logic_groups.length : 0),
  })

  return {
    ...summary,
    logic_groups: (Array.isArray(data.logic_groups) ? data.logic_groups : []) as CollectionSubmissionDetail["logic_groups"],
    hosts: (Array.isArray(data.hosts) ? data.hosts : []) as CollectionSubmissionDetail["hosts"],
    review_note: (data.review_note || undefined) as string | undefined,
    import_result_json: (data.import_result_json || undefined) as string | undefined,
    error_msg: (data.error_msg || undefined) as string | undefined,
  }
}

export function adaptCollectionApprovalResult(value: unknown): CollectionApprovalResult {
  const data = asRecord(value)

  return {
    submission_id: String(data?.submission_id || ""),
    status: adaptStatus(data?.status),
    host_total: toNumber(data?.host_total, 0),
    host_success_count: toNumber(data?.host_success_count, 0),
    host_failure_count: toNumber(data?.host_failure_count, 0),
    host_results: (Array.isArray(data.host_results) ? data.host_results : []) as CollectionApprovalResult["host_results"],
  }
}

