import { describe, expect, it } from "vitest";

import { remediationReadinessIssuePresentation } from "./remediation-order-readiness";

describe("remediation readiness presentation", () => {
  it("classifies active effects as an action conflict", () => {
    expect(
      remediationReadinessIssuePresentation(
        "A related remediation effect is running or uncertain on this Agent",
      ),
    ).toMatchObject({
      badge: "动作冲突",
      action: "查看目标",
    });
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
