export type RemediationOrchestrationLookup =
  | { kind: "empty" }
  | { kind: "order"; orderId: string }
  | { caseId: string; kind: "case" };

export async function resolveRemediationOrchestrationLookup(
  rawIdentifier: string,
  queryOrderId: (orderId: string) => Promise<string>,
): Promise<RemediationOrchestrationLookup> {
  const identifier = rawIdentifier.trim();
  if (!identifier) return { kind: "empty" };

  try {
    const orderId = (await queryOrderId(identifier)).trim();
    if (orderId) return { kind: "order", orderId };
  } catch {
    // A value that is not an Order ID may still be a valid case ID. The case
    // flow owns its normal not-found and load-failure feedback.
  }

  return { caseId: identifier, kind: "case" };
}
