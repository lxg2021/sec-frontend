"use client"

import { useMemo } from "react"
import { useSearchParams } from "next/navigation"

import { AttackWorkflowControlCenter } from "@/features/attack/workflow-center"

interface WorkflowRouteParams {
  caseId: string
  snapshotId: string
  workflowId: string
  tenantId: string
}

function getParam(value: string | null) {
  return value?.trim() || ""
}

export default function AttackWorkflowPage() {
  const searchParams = useSearchParams()
  const params = useMemo<WorkflowRouteParams>(() => ({
    caseId: getParam(searchParams.get("caseId")) || getParam(searchParams.get("case_id")),
    snapshotId: getParam(searchParams.get("snapshotId")) || getParam(searchParams.get("snapshot_id")),
    workflowId: getParam(searchParams.get("workflowId")) || getParam(searchParams.get("workflow_id")),
    tenantId: getParam(searchParams.get("tenantId")) || getParam(searchParams.get("tenant_id")),
  }), [searchParams])

  return (
    <AttackWorkflowControlCenter
      caseId={params.caseId}
      snapshotId={params.snapshotId}
      tenantId={params.tenantId}
      workflowId={params.workflowId}
    />
  )
}
