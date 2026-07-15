import { describe, expect, it } from "vitest";

import type { AttackGraphNodeModel } from "@/features/attack/dgraph/model/core/attack-graph-data";

import type {
  RemediationActionAgentDecision,
  RemediationActionDecision,
  RemediationActionDescriptor,
  RemediationDraftItemsUpsertData,
  RemediationOrderDraftItemInput,
} from "./types";
import {
  assertRemediationDraftItemsPersisted,
  getRemediationHistoryItems,
  getRemediationHistoryNodeStates,
  getRemediationSelectableActions,
  getRemediationSelectableAgentIds,
  isRemediationTargetComplete,
  remediationSelectionChanged,
  selectRemediationActionForAgent,
  selectRemediationReverseSourceItemId,
  type RemediationTargetDraft,
} from "./use-remediation-order-workspace";
import type { RemediationOrder, RemediationOrderItem } from "./types";

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
    prepare_disposition: status === "unavailable" ? "block" : "execute",
    draft_selectable: status !== "unavailable",
    ...overrides,
  };
}

function decision(
  descriptor: RemediationActionDescriptor,
  agentDecisions: RemediationActionAgentDecision[] = [agentDecision("agent-1")],
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

  it("allows an uncertain same action to be added for an operator-approved retry", () => {
    const descriptor = action({ action_code: "process.terminate" });
    expect(
      isRemediationTargetComplete(
        target({
          actions: [descriptor],
          selectedActionCode: descriptor.action_code,
          actionDecisions: [
            decision(descriptor, [
              agentDecision("agent-1", "available", {
                reason_code: "REMEDIATION_RESULT_UNCERTAIN",
                current_effect_state: "uncertain",
                prepare_disposition: "execute",
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
                required_input_fields: ["file_ea.ea_names|file_ea.delete_all"],
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

describe("ControlPanel reverse-action selection", () => {
  it("replaces a no-longer-selectable quarantine with restore and carries its only source Item", () => {
    const quarantine = action({ action_code: "file.quarantine" });
    const restore = action({ action_code: "file.restore" });

    const selection = selectRemediationActionForAgent({
      agentId: "agent-1",
      retainedActionCode: "file.quarantine",
      actionDecisions: [
        decision(quarantine, [
          agentDecision("agent-1", "available", {
            current_effect_state: "satisfied",
            draft_selectable: false,
          }),
        ]),
        decision(restore, [
          agentDecision("agent-1", "available", {
            reverse_contexts: [
              {
                source_item_id: "successful-quarantine-item",
                source_action_code: "file.quarantine",
              },
            ],
          }),
        ]),
      ],
    });

    expect(selection).toEqual({
      selectedActionCode: "file.restore",
      reverseSourceItemId: "successful-quarantine-item",
    });
    expect(
      remediationSelectionChanged(
        target({
          selectedActionCode: "file.quarantine",
          reverseSourceItemId: "",
        }),
        selection,
      ),
    ).toBe(true);
  });

  it("retains a valid source but leaves multiple restore sources for orchestration", () => {
    const contexts = [
      {
        source_item_id: "successful-quarantine-item-1",
        source_action_code: "file.quarantine",
      },
      {
        source_item_id: "successful-quarantine-item-2",
        source_action_code: "file.quarantine",
      },
    ];

    expect(selectRemediationReverseSourceItemId(contexts)).toBe("");
    expect(
      selectRemediationReverseSourceItemId(
        contexts,
        "successful-quarantine-item-2",
      ),
    ).toBe("successful-quarantine-item-2");
  });
});

describe("ControlPanel Draft save result", () => {
  const requested: RemediationOrderDraftItemInput = {
    action_code: "file.restore",
    graph_target: { node_key: "file:node-1", agent_id: "agent-1" },
    reverse_source_item_id: "quarantine-item-1",
  };
  const persistedItem = {
    item_id: "restore-item-1",
    round_no: 4,
    node_key: "file:node-1",
    agent_id: "agent-1",
    action_code: "file.restore",
    reverse_source_id: "quarantine-item-1",
  } as RemediationOrderItem;
  const response = (
    disposition: "created" | "already_present" | "already_satisfied",
    items: RemediationOrderItem[] = [persistedItem],
  ) =>
    ({
      order: { current_round: 4, items } as RemediationOrder,
      item_results: [
        {
          input_index: 0,
          item_id: disposition === "already_satisfied" ? "" : "restore-item-1",
          round_no: 4,
          disposition,
          reason_code:
            disposition === "already_satisfied" ? "ALREADY_SATISFIED" : "",
          reason_message:
            disposition === "already_satisfied" ? "effect already exists" : "",
        },
      ],
    }) as RemediationDraftItemsUpsertData;

  it("accepts a restore target only when it exists in the returned current Draft Round", () => {
    expect(() =>
      assertRemediationDraftItemsPersisted(response("created"), [requested]),
    ).not.toThrow();
    expect(() =>
      assertRemediationDraftItemsPersisted(response("already_present"), [
        requested,
      ]),
    ).not.toThrow();
    expect(() =>
      assertRemediationDraftItemsPersisted(response("created", []), [
        requested,
      ]),
    ).toThrow("Remediation target 1 was not added to the Draft");
  });

  it("surfaces an item-level skip instead of navigating to an empty workspace", () => {
    expect(() =>
      assertRemediationDraftItemsPersisted(response("already_satisfied", []), [
        requested,
      ]),
    ).toThrow("ALREADY_SATISFIED: effect already exists");
  });
});

describe("ControlPanel remediation history", () => {
  const item = (roundNo: number, itemStatus = "success") =>
    ({
      item_id: `item-${roundNo}`,
      round_no: roundNo,
      node_key: `node-${roundNo}`,
      status: itemStatus,
      uncertainty_since_at: "",
    }) as RemediationOrderItem;

  const order = (
    status: string,
    currentRound: number,
    items: RemediationOrderItem[],
  ) =>
    ({
      status,
      current_round: currentRound,
      items,
    }) as RemediationOrder;

  it("keeps earlier rounds as read-only history while the current round is a Draft", () => {
    expect(
      getRemediationHistoryItems(
        order("draft", 2, [item(1), item(2, "draft")]),
      ).map((value) => value.item_id),
    ).toEqual(["item-1"]);
  });

  it("shows a confirmed or executing current round as history", () => {
    expect(
      getRemediationHistoryItems(
        order("running", 2, [item(1), item(2, "running")]),
      ).map((value) => value.item_id),
    ).toEqual(["item-1", "item-2"]);
  });

  it("marks unreported and uncertain history so the graph menu cannot submit it again", () => {
    const pending = item(1, "pending");
    const uncertain = {
      ...item(2, "failed"),
      uncertainty_since_at: "2026-07-15T12:00:00Z",
    } as RemediationOrderItem;
    const current = order("completed", 2, [pending, uncertain]);

    expect(
      Array.from(getRemediationHistoryNodeStates(current).entries()),
    ).toEqual([
      ["node-1", "awaiting_endpoint_report"],
      ["node-2", "result_uncertain"],
    ]);
  });
});
