import { describe, expect, it } from "vitest";

import type {
  RemediationOrder,
  RemediationOrderItem,
} from "@/features/attack/remediation-order";

import {
  applicableHistoryContexts,
  applicableWmiSubscriptionCandidates,
  buildRemediationOrderDraftItems,
  fileEAEditorFromItem,
  fileEAInputFromEditor,
  normalizeFileEANames,
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
    expect(applicableHistoryContexts(restoreDecision, item.agent_id)).toHaveLength(
      1,
    );
    expect(validateHistorySource("", restoreDecision, item.agent_id)).toContain(
      "请选择",
    );
    expect(
      validateHistorySource(
        "source-item-1",
        restoreDecision,
        item.agent_id,
      ),
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
