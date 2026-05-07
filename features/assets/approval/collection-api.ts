import { http } from "@/shared/lib/http/client"
import { getAccessToken } from "@/shared/lib/http/auth"
import { resolveApiUrl } from "@/shared/lib/http/config"
import { createRequestId } from "@/shared/lib/utils"
import {
  adaptCollectionApprovalResult,
  adaptCollectionSubmissionDetail,
  adaptCollectionSubmissionListData,
} from "@/features/assets/approval/collection-adapters"
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
  const body = {
    request_id: createRequestId(),
    tenant_id: tenantId,
    page,
    page_size: pageSize,
    ...(status ? { status } : {}),
    ...(keyword?.trim() ? { keyword: keyword.trim() } : {}),
  }

  console.info("[CollectionAPI] POST listCollectionSubmissions", {
    url: await resolveApiUrl("listCollectionSubmissions"),
    hasAccessToken: Boolean(getAccessToken()),
    body,
  })
  const result = await http.post("listCollectionSubmissions", body)
  console.info("[CollectionAPI] listCollectionSubmissions:response", result)

  return adaptCollectionSubmissionListData(result.data, { page, pageSize })
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

  return adaptCollectionSubmissionDetail(result.data)
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

  return adaptCollectionApprovalResult(result.data)
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
