import { ForensicTaskCenterPage } from "@/shared/components/forensic/forensic-task-center-page"
import type { ForensicTaskStatus } from "@/shared/lib/forensic/types"

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function pick(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function ForensicTasksPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {}
  const rawStatus = pick(params.status)
  const ctx = {
    case_id: pick(params.case_id),
    workflow_id: pick(params.workflow_id),
    workflow_action_id: pick(params.workflow_action_id),
    agent_id: pick(params.agent_id),
    endpoint_id: pick(params.endpoint_id),
    artifact_key: pick(params.artifact_key),
    velociraptor_client_id: pick(params.velociraptor_client_id),
    task_id: pick(params.task_id),
    action: pick(params.action),
    status: ["pending", "running", "success", "failed", "canceled", "timeout"].includes(rawStatus || "")
      ? (rawStatus as ForensicTaskStatus)
      : undefined,
  }

  return <ForensicTaskCenterPage context={ctx} />
}
