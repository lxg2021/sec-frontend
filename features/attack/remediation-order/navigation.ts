import type { RemediationOrder } from "./types"

export interface BuildRemediationOrchestrationHrefOptions {
  fallbackCaseId?: string
  fallbackWorkflowId?: string
  queuePage?: number
  snapshotId?: string
}

export function buildRemediationOrchestrationHref(
  order: Pick<RemediationOrder, "order_id" | "source" | "tenant_id">,
  options: BuildRemediationOrchestrationHrefOptions = {},
) {
  const orderId = order.order_id.trim()
  if (!orderId) throw new Error("The remediation draft has no Order ID")

  const caseId =
    order.source.case_id.trim() ||
    order.source.source_ref_id.trim() ||
    options.fallbackCaseId?.trim() ||
    ""
  const workflowId =
    order.source.workflow_id.trim() ||
    options.fallbackWorkflowId?.trim() ||
    ""
  const params = new URLSearchParams()
  params.set("order_id", orderId)
  if (caseId) {
    params.set("case_id", caseId)
    params.set("scope_id", caseId)
  }
  if (workflowId) params.set("workflow_id", workflowId)
  if (order.tenant_id.trim()) params.set("tenant_id", order.tenant_id.trim())
  params.set("source_type", "case_graph")
  params.set("scope_type", "case")
  params.set("returnTo", "attack-drill")
  if (options.snapshotId?.trim()) {
    params.set("snapshotId", options.snapshotId.trim())
  }
  if (options.queuePage && options.queuePage > 0) {
    params.set("queuePage", String(Math.trunc(options.queuePage)))
  }

  return `/frame/response/orchestration?${params.toString()}`
}
