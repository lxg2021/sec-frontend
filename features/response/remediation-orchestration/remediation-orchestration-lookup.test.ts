import { describe, expect, it, vi } from "vitest";

import { resolveRemediationOrchestrationLookup } from "./remediation-orchestration-lookup";

describe("resolveRemediationOrchestrationLookup", () => {
  it("opens an exact remediation order before treating the value as a case ID", async () => {
    const queryOrderId = vi.fn().mockResolvedValue(" canonical-order-id ");

    await expect(
      resolveRemediationOrchestrationLookup(" entered-order-id ", queryOrderId),
    ).resolves.toEqual({ kind: "order", orderId: "canonical-order-id" });
    expect(queryOrderId).toHaveBeenCalledWith("entered-order-id");
  });

  it("falls back to the existing case flow when no matching order exists", async () => {
    const queryOrderId = vi.fn().mockRejectedValue(new Error("not found"));

    await expect(
      resolveRemediationOrchestrationLookup(" case-123 ", queryOrderId),
    ).resolves.toEqual({ caseId: "case-123", kind: "case" });
  });

  it("does not query an empty identifier", async () => {
    const queryOrderId = vi.fn();

    await expect(
      resolveRemediationOrchestrationLookup("   ", queryOrderId),
    ).resolves.toEqual({ kind: "empty" });
    expect(queryOrderId).not.toHaveBeenCalled();
  });
});
