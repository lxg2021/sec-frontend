"use client"

import { useMemo } from "react"
import { useSearchParams } from "next/navigation"

import { AttackWorkflowControlCenter } from "@/features/attack/workflow-center"

interface WorkflowRouteParams {
  caseId: string
  endTime: string
  focusQueue: boolean
  queuePage: number
  snapshotId: string
  startTime: string
  timezone: string
  workflowId: string
  tenantId: string
}

function getParam(value: string | null) {
  return value?.trim() || ""
}

function getPageParam(value: string | null) {
  const normalized = getParam(value)
  if (!normalized) return undefined
  const parsed = Number.parseInt(normalized, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

export default function AttackWorkflowPage() {
  const searchParams = useSearchParams()
  const params = useMemo<WorkflowRouteParams>(() => {
    const focusQueue =
      getParam(searchParams.get("focusQueue")) ||
      getParam(searchParams.get("focus_queue"))
    const queuePage =
      getPageParam(searchParams.get("queuePage")) ||
      getPageParam(searchParams.get("queue_page")) ||
      1

    return {
      caseId: getParam(searchParams.get("caseId")) || getParam(searchParams.get("case_id")),
      endTime: getParam(searchParams.get("endTime")) || getParam(searchParams.get("end_time")),
      focusQueue: focusQueue === "1" || focusQueue.toLowerCase() === "true",
      queuePage,
      snapshotId: getParam(searchParams.get("snapshotId")) || getParam(searchParams.get("snapshot_id")),
      startTime: getParam(searchParams.get("startTime")) || getParam(searchParams.get("start_time")),
      timezone: getParam(searchParams.get("timezone")),
      workflowId: getParam(searchParams.get("workflowId")) || getParam(searchParams.get("workflow_id")),
      tenantId: getParam(searchParams.get("tenantId")) || getParam(searchParams.get("tenant_id")),
    }
  }, [searchParams])

  return (
    <AttackWorkflowControlCenter
      caseId={params.caseId}
      endTime={params.endTime}
      focusQueue={params.focusQueue}
      initialQueuePage={params.queuePage}
      snapshotId={params.snapshotId}
      startTime={params.startTime}
      tenantId={params.tenantId}
      timezone={params.timezone}
      workflowId={params.workflowId}
    />
  )
}
