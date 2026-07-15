import { describe, expect, it } from "vitest";

import type { AttackGraphNodeModel } from "@/features/attack/dgraph/model/core/attack-graph-data";

import type { RemediationTargetDraft } from "./use-remediation-order-workspace";
import {
  isLegacyCaseRemediationTitle,
  remediationOrderTitleError,
  suggestRemediationOrderTitle,
} from "./remediation-order-title";

const node: AttackGraphNodeModel = {
  id: "node-1",
  key: "node-1",
  entityType: "Process",
  displayName: "C:\\Program Files\\Microsoft Office\\winword.exe",
  presentationKind: "process",
  properties: {},
};

function target(
  overrides: Partial<RemediationTargetDraft> = {},
): RemediationTargetDraft {
  return {
    key: node.key,
    node,
    itemId: "",
    agentCandidates: ["agent-1"],
    selectedAgentId: "agent-1",
    actions: [
      {
        action_code: "process.terminate",
        display_name: "结束进程",
        risk_level: "high",
        reversible: false,
      },
    ],
    actionDecisions: [],
    selectedActionCode: "process.terminate",
    actionInput: {},
    reverseSourceItemId: "",
    resolutionStatus: "ready",
    blockedReason: "",
    error: "",
    itemStatus: "draft",
    reasonCode: "",
    reasonMessage: "",
    riskLevel: "high",
    resultVersion: 0,
    uncertaintySinceAt: "",
    ...overrides,
  };
}

describe("remediation order titles", () => {
  it("suggests a target and action based name without exposing the Case ID", () => {
    expect(suggestRemediationOrderTitle([target()], "zh")).toBe(
      "winword.exe · 结束进程",
    );
  });

  it("summarizes multiple targets as a response collection", () => {
    expect(
      suggestRemediationOrderTitle([target(), target({ key: "node-2" })], "zh"),
    ).toBe("结束进程等 2 项处置");
  });

  it("applies the server's UTF-8 byte limit before submit", () => {
    expect(remediationOrderTitleError("处".repeat(85), "zh")).toBe("");
    expect(remediationOrderTitleError("处".repeat(86), "zh")).toContain("255");
  });

  it("keeps a generated title within the server byte limit", () => {
    const longTarget = target({
      node: { ...node, displayName: "处".repeat(100) },
      actions: [
        {
          action_code: "process.terminate",
          display_name: "置".repeat(100),
          risk_level: "high",
          reversible: false,
        },
      ],
    });

    expect(
      remediationOrderTitleError(
        suggestRemediationOrderTitle([longTarget], "zh"),
        "zh",
      ),
    ).toBe("");
  });

  it("recognizes only the historical technical Case title", () => {
    const caseId = "619fef36105e4e58c3803c0f156d4fce64c64c90";
    expect(
      isLegacyCaseRemediationTitle(`Case ${caseId} remediation`, caseId),
    ).toBe(true);
    expect(
      isLegacyCaseRemediationTitle("Office 可疑进程处置", caseId),
    ).toBe(false);
  });
});
