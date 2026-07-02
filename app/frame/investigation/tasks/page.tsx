import { ForensicOverview } from "@/features/investigation/forensic-overview/forensic-overview"
import type { ForensicContext } from "@/features/investigation/forensic-overview/types"

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function pick(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function ForensicTasksPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {}
  const ctx: ForensicContext = {
    case_id: pick(params.case_id),
    workflow_id: pick(params.workflow_id),
    workflow_action_id: pick(params.workflow_action_id),
    agent_id: pick(params.agent_id),
    endpoint_id: pick(params.endpoint_id),
  }

  return <ForensicOverview ctx={ctx} />
}
