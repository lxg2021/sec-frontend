import { describe, expect, it } from "vitest";

import type { RemediationOrderItem } from "@/features/attack/remediation-order";

import { activeDispatchSkipPresentation } from "./remediation-case-execution-panel";

function item(reasonCode: string) {
  return {
    status: "skipped",
    reason_code: reasonCode,
    error_code: "",
    uncertainty_since_at: "",
    execution: null,
  } as RemediationOrderItem;
}

describe("activeDispatchSkipPresentation", () => {
  it("explains an existing in-progress target Dispatch without calling it a failure", () => {
    expect(activeDispatchSkipPresentation(item("ACTIVE_DISPATCH_IN_PROGRESS"))).toMatchObject({
      label: "未重复下发",
      result: "未重复下发",
    });
  });

  it("explains a published Dispatch with an unconfirmed result without claiming a terminal receipt", () => {
    expect(activeDispatchSkipPresentation(item("ACTIVE_DISPATCH_UNCERTAIN"))).toMatchObject({
      label: "未重复下发",
      result: "未重复下发",
    });
  });

  it("localizes an existing Dispatch reason for the English execution table", () => {
    expect(
      activeDispatchSkipPresentation(
        item("ACTIVE_DISPATCH_UNCERTAIN"),
        "en",
      ),
    ).toMatchObject({
      label: "Not Redispatched",
      result: "Not Redispatched",
      reason:
        "A dispatch already exists for this target; the endpoint result is awaiting confirmation.",
    });
  });

  it("does not change ordinary skipped Items", () => {
    expect(activeDispatchSkipPresentation(item("SATISFIED_AT_DISPATCH"))).toBeNull();
  });
});
