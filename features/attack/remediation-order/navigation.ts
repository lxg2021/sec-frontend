import type { RemediationOrder } from "./types"

export function buildRemediationOrchestrationHref(
  order: Pick<RemediationOrder, "order_id">,
) {
  const orderId = order.order_id.trim()
  if (!orderId) throw new Error("The remediation draft has no Order ID")

  const params = new URLSearchParams()
  params.set("order_id", orderId)

  return `/frame/response/orchestration?${params.toString()}`
}
