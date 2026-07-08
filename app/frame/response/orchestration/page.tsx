import { RemediationOrchestrationPage } from "@/features/response/remediation-orchestration/components/remediation-orchestration-page"
import type { RemediationOrchestrationContext } from "@/features/response/remediation-orchestration/types"

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function pick(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function ResponseOrchestrationPage({
  searchParams,
}: PageProps) {
  const params = searchParams ? await searchParams : {}
  const context: RemediationOrchestrationContext = {
    case_id:
      pick(params.case_id) ||
      pick(params.caseId) ||
      pick(params.caseid),
    workflow_id: pick(params.workflow_id) || pick(params.workflowId),
    workflow_action_id:
      pick(params.workflow_action_id) || pick(params.workflowActionId),
    tenant_id: pick(params.tenant_id) || pick(params.tenantId),
    source_type: pick(params.source_type) || pick(params.sourceType),
    scope_type: pick(params.scope_type) || pick(params.scopeType),
    scope_id: pick(params.scope_id) || pick(params.scopeId),
    node_key: pick(params.node_key) || pick(params.nodeKey),
    entity_type: pick(params.entity_type) || pick(params.entityType),
    display_name: pick(params.display_name) || pick(params.displayName),
    return_to: pick(params.returnTo),
  }

  return <RemediationOrchestrationPage context={context} />
}
