import { describe, expect, it } from "vitest";

import type { AttackGraphNodeModel } from "@/features/attack/dgraph/model/core/attack-graph-data";

import type {
  RemediationActionAgentDecision,
  RemediationActionDecision,
  RemediationActionDescriptor,
} from "./types";
import {
  getRemediationSelectableActions,
  getRemediationSelectableAgentIds,
  isRemediationTargetComplete,
  type RemediationTargetDraft,
} from "./use-remediation-order-workspace";

const node: AttackGraphNodeModel = {
  id: "node-1",
  key: "node-1",
  entityType: "File",
  displayName: "suspicious.exe",
  presentationKind: "file",
  properties: {},
};

function action(
  overrides: Partial<RemediationActionDescriptor> = {},
): RemediationActionDescriptor {
  return {
    action_code: "file.quarantine",
    display_name: "隔离文件",
    risk_level: "high",
    reversible: true,
    ...overrides,
  };
}

function agentDecision(
  agentId: string,
  status: RemediationActionAgentDecision["status"] = "available",
  overrides: Partial<RemediationActionAgentDecision> = {},
): RemediationActionAgentDecision {
  return {
    agent_id: agentId,
    status,
    reason_code: "",
    reason_message: "",
    required_input_fields: [],
    reverse_contexts: [],
    target_candidates: [],
    current_effect_state: "none",
    prepare_disposition:
      status === "unavailable" ? "block" : "execute",
    draft_selectable: status !== "unavailable",
    ...overrides,
  };
}

function decision(
  descriptor: RemediationActionDescriptor,
  agentDecisions: RemediationActionAgentDecision[] = [
    agentDecision("agent-1"),
  ],
): RemediationActionDecision {
  return { action: descriptor, agent_decisions: agentDecisions };
}

function target(
  overrides: Partial<RemediationTargetDraft> = {},
): RemediationTargetDraft {
  const actions = overrides.actions ?? [action()];
  const actionDecisions =
    overrides.actionDecisions ?? actions.map((item) => decision(item));
  return {
    key: node.key,
    node,
    itemId: "",
    agentCandidates: ["agent-1"],
    selectedAgentId: "agent-1",
    actions,
    actionDecisions,
    selectedActionCode: actions[0]?.action_code ?? "",
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

describe("isRemediationTargetComplete", () => {
  it("requires a resolved target, Agent and selected action", () => {
    expect(
      isRemediationTargetComplete(target({ resolutionStatus: "resolving" })),
    ).toBe(false);
    expect(isRemediationTargetComplete(target({ selectedAgentId: "" }))).toBe(
      false,
    );
    expect(
      isRemediationTargetComplete(target({ selectedActionCode: "" })),
    ).toBe(false);
  });

  it("rejects an Agent-unavailable action", () => {
    const descriptor = action();
    expect(
      isRemediationTargetComplete(
        target({
          actions: [descriptor],
          actionDecisions: [
            decision(descriptor, [
              agentDecision("agent-1", "unavailable", {
                reason_code: "CONFLICTING_ACTION_IN_FLIGHT",
              }),
            ]),
          ],
        }),
      ),
    ).toBe(false);
  });

  it("allows a same-action in-flight decision to remain draft-selectable", () => {
    const descriptor = action({ action_code: "process.terminate" });
    expect(
      isRemediationTargetComplete(
        target({
          actions: [descriptor],
          selectedActionCode: descriptor.action_code,
          actionDecisions: [
            decision(descriptor, [
              agentDecision("agent-1", "available", {
                current_effect_state: "same_action_in_flight",
                prepare_disposition: "wait_existing",
                draft_selectable: true,
              }),
            ]),
          ],
        }),
      ),
    ).toBe(true);
  });

  it("allows available and configuration-required actions into the draft", () => {
    const restore = action({ action_code: "file.restore" });
    expect(
      isRemediationTargetComplete(
        target({
          actions: [restore],
          selectedActionCode: "file.restore",
          actionDecisions: [
            decision(restore, [
              agentDecision("agent-1", "available", {
                reverse_contexts: [
                  {
                    source_item_id: "source-item-1",
                    source_action_code: "file.quarantine",
                  },
                ],
              }),
            ]),
          ],
        }),
      ),
    ).toBe(true);

    const fileEA = action({ action_code: "file_ea.delete" });
    expect(
      isRemediationTargetComplete(
        target({
          actions: [fileEA],
          selectedActionCode: "file_ea.delete",
          actionDecisions: [
            decision(fileEA, [
              agentDecision("agent-1", "requires_configuration", {
                required_input_fields: [
                  "file_ea.ea_names|file_ea.delete_all",
                ],
              }),
            ]),
          ],
        }),
      ),
    ).toBe(true);
  });

  it("fails closed when the selected action has no Agent decision", () => {
    expect(isRemediationTargetComplete(target({ actionDecisions: [] }))).toBe(
      false,
    );
  });
});

describe("ControlPanel draft choices", () => {
  it("shows only Agents that have at least one selectable action", () => {
    const descriptor = action();
    const current = target({
      agentCandidates: ["agent-1", "agent-2"],
      actions: [descriptor],
      actionDecisions: [
        decision(descriptor, [
          agentDecision("agent-1"),
          agentDecision("agent-2", "unavailable"),
        ]),
      ],
    });
    expect(getRemediationSelectableAgentIds(current)).toEqual(["agent-1"]);
  });

  it("keeps configuration-required actions and hides unavailable actions", () => {
    const configurable = action({ action_code: "file_ea.delete" });
    const unavailable = action({ action_code: "file.restore" });
    const current = target({
      actions: [configurable, unavailable],
      selectedActionCode: "",
      actionDecisions: [
        decision(configurable, [
          agentDecision("agent-1", "requires_configuration"),
        ]),
        decision(unavailable, [
          agentDecision("agent-1", "unavailable", {
            reason_code: "NO_VALID_BACKUP",
          }),
        ]),
      ],
    });
    expect(
      getRemediationSelectableActions(current).map((item) => item.action_code),
    ).toEqual(["file_ea.delete"]);
  });
});
