import type {
  CollectionApprovalResult,
  CollectionSubmissionStatus,
} from "@/features/assets/approval/collection-types"

export interface ParsedImportResult {
  parsed: unknown | null
  formatted: string
}

export interface ApprovalResultSummary {
  submissionId: string
  status: CollectionSubmissionStatus
  total: number
  successCount: number
  failureCount: number
  failedResults: NonNullable<CollectionApprovalResult["host_results"]>
  hostResults: NonNullable<CollectionApprovalResult["host_results"]>
}

export function canApproveCollectionSubmission(status?: CollectionSubmissionStatus) {
  return (
    status === 1 ||
    status === 5 ||
    status === "COLLECTION_SUBMISSION_PENDING" ||
    status === "COLLECTION_SUBMISSION_FAILED"
  )
}

export function canRejectCollectionSubmission(status?: CollectionSubmissionStatus) {
  return (
    status === 1 ||
    status === 5 ||
    status === "COLLECTION_SUBMISSION_PENDING" ||
    status === "COLLECTION_SUBMISSION_FAILED"
  )
}

export function summarizeApprovalResult(result: CollectionApprovalResult): ApprovalResultSummary {
  const hostResults = result.host_results || []

  return {
    submissionId: result.submission_id,
    status: result.status,
    total: Number(result.host_total || hostResults.length || 0),
    successCount: Number(result.host_success_count || hostResults.filter((item) => item.success).length || 0),
    failureCount: Number(result.host_failure_count || hostResults.filter((item) => !item.success).length || 0),
    failedResults: hostResults.filter((item) => !item.success),
    hostResults,
  }
}

export function parseImportResultJson(value?: string | null): ParsedImportResult {
  if (!value) {
    return {
      parsed: null,
      formatted: "-",
    }
  }

  try {
    const parsed = JSON.parse(value)
    return {
      parsed,
      formatted: JSON.stringify(parsed, null, 2),
    }
  } catch {
    return {
      parsed: null,
      formatted: value,
    }
  }
}
