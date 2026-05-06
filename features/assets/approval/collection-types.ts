import type { CollectionOwner, UserLogicGroup, UiAssetData } from "@/features/collection/types"

export type CollectionSubmissionStatus =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | "COLLECTION_SUBMISSION_PENDING"
  | "COLLECTION_SUBMISSION_APPROVING"
  | "COLLECTION_SUBMISSION_APPROVED"
  | "COLLECTION_SUBMISSION_REJECTED"
  | "COLLECTION_SUBMISSION_FAILED"
  | "COLLECTION_SUBMISSION_DELETED"

export interface CollectionSubmitter {
  name?: string
  phone?: string
  email?: string
  company?: string
  remark?: string
}

export interface CollectionSubmissionSummary {
  submission_id: string
  tenant_id: string
  status: CollectionSubmissionStatus
  host_count: number
  logic_group_count: number
  submitter?: CollectionSubmitter
  source_ip?: string
  created_at: number
  updated_at: number
  reviewed_by?: string
  reviewed_at?: number
}

export interface CollectionSubmissionDetail extends CollectionSubmissionSummary {
  logic_groups: UserLogicGroup[]
  hosts: UiAssetData[]
  review_note?: string
  import_result_json?: string
  error_msg?: string
}

export interface CollectionSubmissionListData {
  items: CollectionSubmissionSummary[]
  page: number
  page_size: number
  total: number
}

export interface CollectionApprovalResult {
  submission_id: string
  status: CollectionSubmissionStatus
  host_total: number
  host_success_count: number
  host_failure_count: number
  host_results?: Array<{
    agent_id: string
    success: boolean
    msg: string
  }>
}

export type { CollectionOwner, UserLogicGroup, UiAssetData }
