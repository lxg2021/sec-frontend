import { describe, expect, it } from "vitest";

import { remediationReadinessIssuePresentation } from "./remediation-order-readiness";

describe("remediation readiness presentation", () => {
  it("classifies an identical in-flight intent as processing", () => {
    expect(
      remediationReadinessIssuePresentation(
        "WAIT_EXISTING_REMEDIATION: same remediation action and parameters",
      ),
    ).toMatchObject({
      badge: "处理中",
      action: "查看目标",
    });
  });

  it("keeps opposite actions and uncertain results separate", () => {
    expect(
      remediationReadinessIssuePresentation("CONFLICTING_ACTION_IN_FLIGHT"),
    ).toMatchObject({ badge: "动作冲突" });
    expect(
      remediationReadinessIssuePresentation("REMEDIATION_RESULT_UNCERTAIN"),
    ).toMatchObject({ badge: "结果待确认" });
  });

  it("classifies missing editor input as parameters to complete", () => {
    expect(
      remediationReadinessIssuePresentation("请选择一个具体的处置目标。"),
    ).toMatchObject({
      badge: "待补参数",
      action: "补充参数",
    });
  });
});
