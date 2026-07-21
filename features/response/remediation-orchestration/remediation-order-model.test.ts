import { describe, expect, it } from "vitest";

import type {
  RemediationOrder,
  RemediationOrderItem,
} from "@/features/attack/remediation-order";

import {
  applicableHistoryContexts,
  applicableWmiSubscriptionCandidates,
  buildRemediationOrderDraftItemsFromInputs,
  buildRemediationOrderDraftItems,
  fileEAEditorFromItem,
  fileEAInputFromEditor,
  getRemediationOrderCurrentRoundItems,
  getRemediationOrderHistoricalItems,
  normalizeFileEANames,
  remediationActionApplicabilityError,
  remediationOrderLifecycleActions,
  shouldPollRemediationOrder,
  validateOrderForPrepare,
  validateHistorySource,
  validateWmiSubscriptionEditor,
  wmiSubscriptionEditorFromItem,
} from "./remediation-order-model";

function fileEAItem(
  input: RemediationOrderItem["action_input"] = {},
): RemediationOrderItem {
  return {
    item_id: "item-ea",
    node_key: "file:public:agent-1:c:/a.exe",
    agent_id: "agent-1",
    action_code: "file_ea.delete",
    action_input: input,
    reverse_source_id: "",
  } as RemediationOrderItem;
}

function order(item = fileEAItem()): RemediationOrder {
  return {
    order_id: "order-1",
    status: "draft",
    items: [item],
  } as RemediationOrder;
}

function wmiItem(): RemediationOrderItem {
  return {
    item_id: "item-wmi",
    node_key: "wmi-filter-1",
    entity_type: "WmiFilter",
    agent_id: "agent-1",
    action_code: "wmi_subscription.delete",
    action_input: {},
    reverse_source_id: "",
  } as RemediationOrderItem;
}

function restoreItem(): RemediationOrderItem {
  return {
    item_id: "item-restore",
    node_key: "file:public:agent-1:c:/a.exe",
    entity_type: "File",
    agent_id: "agent-1",
    action_code: "file.restore",
    action_input: {},
    reverse_source_id: "",
  } as RemediationOrderItem;
}

const wmiDecision = {
  action: { action_code: "wmi_subscription.delete" },
  agent_decisions: [
    {
      agent_id: "agent-1",
      target_candidates: [
        {
          candidate_id: "candidate-1",
          target_type: "wmi_subscription",
          display_name: "Filter-A → Consumer-A",
          shared_source: true,
          shared_target: false,
          source_binding_count: 2,
          target_binding_count: 1,
        },
      ],
    },
  ],
} as import("@/features/attack/remediation-order").RemediationActionDecision;

const restoreDecision = {
  action: {
    action_code: "file.restore",
  },
  agent_decisions: [
    {
      agent_id: "agent-1",
      status: "available",
      reverse_contexts: [
        {
          source_item_id: "source-item-1",
          source_action_code: "file.quarantine",
        },
      ],
    },
  ],
} as import("@/features/attack/remediation-order").RemediationActionDecision;

describe("remediation Order orchestration model", () => {
  it("separates the current editable Round from historical execution Rounds", () => {
    const current = {
      current_round: 3,
      items: [
        { item_id: "round-3", round_no: 3 },
        { item_id: "round-2", round_no: 2 },
        { item_id: "round-1", round_no: 1 },
      ],
    } as RemediationOrder;

    expect(
      getRemediationOrderCurrentRoundItems(current).map((item) => item.item_id),
    ).toEqual(["round-3"]);
    expect(
      getRemediationOrderHistoricalItems(current).map((item) => item.item_id),
    ).toEqual(["round-2", "round-1"]);
  });

  it("normalizes comma/newline EA names case-insensitively", () => {
    expect(
      normalizeFileEANames(
        " Zone.Identifier, MalwareMeta\nzone.identifier\n  CustomEA ",
      ),
    ).toEqual(["CustomEA", "MalwareMeta", "Zone.Identifier"]);
  });

  it("round-trips named and delete-all scopes", () => {
    const namedItem = fileEAItem({
      file_ea: { force: true, ea_names: ["Zone.Identifier"] },
    });
    expect(fileEAEditorFromItem(namedItem)).toEqual({
      mode: "named",
      eaNamesText: "Zone.Identifier",
      force: true,
    });
    expect(
      fileEAInputFromEditor({
        mode: "all",
        eaNamesText: "ignored",
        force: false,
      }),
    ).toEqual({ delete_all: true });
  });

  it("keeps named scope selected while the EA name list is empty", () => {
    expect(
      fileEAEditorFromItem(fileEAItem({ file_ea: { ea_names: [] } })),
    ).toEqual({
      mode: "named",
      eaNamesText: "",
      force: false,
    });
  });

  it("blocks Prepare until scope is explicit", () => {
    const current = order();
    expect(
      validateOrderForPrepare(current, {
        "item-ea": { mode: "", eaNamesText: "", force: false },
      }),
    ).toHaveProperty("item-ea");
    expect(
      validateOrderForPrepare(current, {
        "item-ea": {
          mode: "named",
          eaNamesText: "Zone.Identifier",
          force: false,
        },
      }),
    ).toEqual({});
  });

  it("builds an Update payload with explicit File EA input", () => {
    const items = buildRemediationOrderDraftItems(order(), {
      "item-ea": {
        mode: "all",
        eaNamesText: "",
        force: true,
      },
    });
    expect(items[0]).toMatchObject({
      item_id: "item-ea",
      action_code: "file_ea.delete",
      graph_target: {
        node_key: "file:public:agent-1:c:/a.exe",
        agent_id: "agent-1",
      },
      action_input: { file_ea: { force: true, delete_all: true } },
    });
  });

  it("polls only running Orders", () => {
    expect(shouldPollRemediationOrder(order())).toBe(false);
    expect(shouldPollRemediationOrder({ ...order(), status: "running" })).toBe(
      true,
    );
    expect(
      shouldPollRemediationOrder({ ...order(), status: "completed" }),
    ).toBe(false);
  });

  it("keeps lifecycle actions aligned with the backend state machine", () => {
    expect(remediationOrderLifecycleActions(order())).toEqual({
      edit: true,
      delete: true,
      prepare: true,
      confirm: false,
      cancel: false,
      poll: false,
    });
    expect(
      remediationOrderLifecycleActions({
        ...order(),
        status: "prepared",
        confirmable: true,
      }),
    ).toEqual({
      edit: false,
      delete: false,
      prepare: true,
      confirm: true,
      cancel: true,
      poll: false,
    });
    expect(
      remediationOrderLifecycleActions({ ...order(), status: "running" }),
    ).toMatchObject({
      edit: false,
      delete: false,
      prepare: false,
      confirm: false,
      cancel: false,
      poll: true,
    });
  });

  it("fails closed when current Agent applicability evidence is missing or unavailable", () => {
    expect(remediationActionApplicabilityError(null, "agent-1")).toContain(
      "适用性依据",
    );
    expect(
      remediationActionApplicabilityError(
        {
          action: {
            action_code: "file.quarantine",
            display_name: "Quarantine file",
            risk_level: "high",
            reversible: true,
          },
          agent_decisions: [
            {
              agent_id: "agent-1",
              status: "unavailable",
              reason_code: "CONFLICTING_ACTION_IN_FLIGHT",
              reason_message: "该文件正在执行隔离",
              required_input_fields: [],
              reverse_contexts: [],
              target_candidates: [],
              current_effect_state: "conflicting_action_in_flight",
              prepare_disposition: "block",
              draft_selectable: false,
            },
          ],
        } as import("@/features/attack/remediation-order").RemediationActionDecision,
        "agent-1",
      ),
    ).toContain("冲突动作");
  });

  it("returns English applicability and dynamic parameter validation messages", () => {
    expect(remediationActionApplicabilityError(null, "agent-1", "en")).toBe(
      "No node-level applicability evidence is available for this action yet.",
    );
    expect(
      validateWmiSubscriptionEditor(
        { targetCandidateId: "", removeBindingOnly: false },
        null,
        "agent-1",
        "en",
      ),
    ).toContain("authoritative WMI Subscription target");
  });

  it("allows an uncertain result to be retried when the backend marks it selectable", () => {
    expect(
      remediationActionApplicabilityError(
        {
          action: {
            action_code: "process.terminate",
            display_name: "Terminate process",
            risk_level: "high",
            reversible: false,
          },
          agent_decisions: [
            {
              agent_id: "agent-1",
              status: "available",
              reason_code: "REMEDIATION_RESULT_UNCERTAIN",
              reason_message: "A previous remediation result is uncertain",
              required_input_fields: [],
              reverse_contexts: [],
              target_candidates: [],
              current_effect_state: "uncertain",
              prepare_disposition: "execute",
              draft_selectable: true,
            },
          ],
        } as import("@/features/attack/remediation-order").RemediationActionDecision,
        "agent-1",
      ),
    ).toBe("");
  });

  it("does not treat the same action in flight as a parameter error", () => {
    expect(
      remediationActionApplicabilityError(
        {
          action: {
            action_code: "process.terminate",
            display_name: "Terminate process",
            risk_level: "high",
            reversible: false,
          },
          agent_decisions: [
            {
              agent_id: "agent-1",
              status: "available",
              reason_code: "SAME_ACTION_IN_FLIGHT",
              reason_message: "The same remediation is being processed",
              required_input_fields: [],
              reverse_contexts: [],
              target_candidates: [],
              current_effect_state: "same_action_in_flight",
              prepare_disposition: "wait_existing",
              draft_selectable: true,
            },
          ],
        } as import("@/features/attack/remediation-order").RemediationActionDecision,
        "agent-1",
      ),
    ).toBe("");
  });

  it("builds a complete Draft update from the generic parameter editor", () => {
    const current = order(restoreItem());
    expect(
      buildRemediationOrderDraftItemsFromInputs(
        current,
        { "item-restore": { file_quarantine: { encrypt: true } } },
        { "item-restore": "source-item-1" },
      ),
    ).toEqual([
      {
        item_id: "item-restore",
        action_code: "file.restore",
        action_input: { file_quarantine: { encrypt: true } },
        graph_target: {
          node_key: "file:public:agent-1:c:/a.exe",
          agent_id: "agent-1",
        },
        reverse_source_item_id: "source-item-1",
      },
    ]);
  });

  it("keeps completed Rounds out of the editable workspace", () => {
    const historicalItem = {
      ...fileEAItem(),
      item_id: "item-history",
      round_no: 2,
    };
    const draftItem = {
      ...restoreItem(),
      item_id: "item-restore-draft",
      round_no: 3,
    };
    const current = {
      ...order(draftItem),
      current_round: 3,
      items: [historicalItem, draftItem],
    };

    expect(
      getRemediationOrderCurrentRoundItems(current).map((item) => item.item_id),
    ).toEqual(["item-restore-draft"]);
  });

  it("requires binding-only scope for a shared WMI Subscription candidate", () => {
    const item = wmiItem();
    const editor = wmiSubscriptionEditorFromItem(item);
    expect(
      applicableWmiSubscriptionCandidates(wmiDecision, item.agent_id),
    ).toHaveLength(1);
    expect(
      validateWmiSubscriptionEditor(editor, wmiDecision, item.agent_id),
    ).toContain("只允许移除当前 Binding");
    expect(
      validateWmiSubscriptionEditor(
        {
          targetCandidateId: "candidate-1",
          removeBindingOnly: true,
        },
        wmiDecision,
        item.agent_id,
      ),
    ).toBe("");
  });

  it("persists only the WMI candidate reference and binding scope", () => {
    const current = order(wmiItem());
    const items = buildRemediationOrderDraftItems(
      current,
      {},
      {
        "item-wmi": {
          targetCandidateId: "candidate-1",
          removeBindingOnly: true,
        },
      },
    );
    expect(items[0].action_input).toEqual({
      wmi_subscription: {
        target_candidate_id: "candidate-1",
        remove_binding_only: true,
      },
    });
  });

  it("validates and persists a history source in orchestration", () => {
    const item = restoreItem();
    const current = order(item);
    expect(
      applicableHistoryContexts(restoreDecision, item.agent_id),
    ).toHaveLength(1);
    expect(validateHistorySource("", restoreDecision, item.agent_id)).toContain(
      "请选择",
    );
    expect(
      validateHistorySource("source-item-1", restoreDecision, item.agent_id),
    ).toBe("");
    expect(
      validateOrderForPrepare(
        current,
        {},
        {},
        { "item-restore": restoreDecision },
        { "item-restore": "" },
      ),
    ).toHaveProperty("item-restore");

    const items = buildRemediationOrderDraftItems(
      current,
      {},
      {},
      { "item-restore": "source-item-1" },
    );
    expect(items[0]).toMatchObject({
      action_code: "file.restore",
      reverse_source_item_id: "source-item-1",
    });
  });
});
