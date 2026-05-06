import { http } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"
import type {
  CollectionApprovalResult,
  CollectionSubmissionDetail,
  CollectionSubmissionListData,
  CollectionSubmissionStatus,
} from "@/features/assets/approval/collection-types"

interface ListCollectionSubmissionsParams {
  tenantId: string
  page: number
  pageSize: number
  status?: CollectionSubmissionStatus
  keyword?: string
}

export async function listCollectionSubmissions({
  tenantId,
  page,
  pageSize,
  status,
  keyword,
}: ListCollectionSubmissionsParams): Promise<CollectionSubmissionListData> {
  const result = await http.post("listCollectionSubmissions", {
    request_id: createRequestId(),
    tenant_id: tenantId,
    page,
    page_size: pageSize,
    ...(status ? { status } : {}),
    ...(keyword?.trim() ? { keyword: keyword.trim() } : {}),
  })

  return {
    items: result.data?.items || [],
    page: Number(result.data?.page || page),
    page_size: Number(result.data?.page_size || pageSize),
    total: Number(result.data?.total || 0),
  }
}

export async function getCollectionSubmission(
  tenantId: string,
  submissionId: string,
): Promise<CollectionSubmissionDetail> {
  const result = await http.post("getCollectionSubmission", {
    request_id: createRequestId(),
    tenant_id: tenantId,
    submission_id: submissionId,
  })

  return result.data
}

export async function approveCollectionSubmission(
  tenantId: string,
  submissionId: string,
  reviewNote?: string,
): Promise<CollectionApprovalResult> {
  const result = await http.post("approveCollectionSubmission", {
    request_id: createRequestId(),
    tenant_id: tenantId,
    submission_id: submissionId,
    ...(reviewNote?.trim() ? { review_note: reviewNote.trim() } : {}),
  })

  return result.data
}

export async function rejectCollectionSubmission(
  tenantId: string,
  submissionId: string,
  reviewNote: string,
) {
  return http.post("rejectCollectionSubmission", {
    request_id: createRequestId(),
    tenant_id: tenantId,
    submission_id: submissionId,
    review_note: reviewNote.trim(),
  })
}
