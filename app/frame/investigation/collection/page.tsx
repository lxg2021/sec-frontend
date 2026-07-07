import { ForensicOverviewPage as ForensicOverviewPageClient } from "@/shared/components/forensic/forensic-overview-page"
import type { ForensicOverviewContext } from "@/shared/lib/forensic/types"

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function pick(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function ForensicOverviewPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {}
  const caseId =
    pick(params.case_id) || pick(params.caseId) || pick(params.caseid)
  const context: ForensicOverviewContext = {
    case_id: caseId,
    workflow_id: pick(params.workflow_id),
    workflow_action_id: pick(params.workflow_action_id),
    agent_id: pick(params.agent_id),
    endpoint_id: pick(params.endpoint_id),
  }

  return <ForensicOverviewPageClient context={context} />
}
