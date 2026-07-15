import { describe, expect, it } from "vitest";

import {
  normalizeRemediationItemList,
  normalizeRemediationNodeActionsResult,
  normalizeRemediationOrder,
  normalizeRemediationOrderList,
  normalizeRemediationSummary,
  normalizeResolveRemediationNodeAgents,
} from "./normalizers";

describe("remediation order normalizers", () => {
  it("normalizes graph Agent resolution responses", () => {
    expect(
      normalizeResolveRemediationNodeAgents({
        request_id: " request-1 ",
        scope_type: "case",
        scope_id: "case-1",
        node_key: "file:1",
        status: "ambiguous",
        agent_ids: ["agent-1", "", "agent-2"],
        resolve_source: "neighbor",
      }),
    ).toMatchObject({
      request_id: "request-1",
      scope_type: "case",
      scope_id: "case-1",
      node_key: "file:1",
      status: "ambiguous",
      agent_ids: ["agent-1", "agent-2"],
      resolve_source: "neighbor",
    });
  });

  it("returns a stable empty order for missing data", () => {
    const order = normalizeRemediationOrder(null);

    expect(order).toMatchObject({
      tenant_id: "",
      order_id: "",
      revision: "0",
      confirmable: false,
      source: {
        source_type: "",
        source_ref_id: "",
        case_id: "",
        workflow_id: "",
      },
      summary: { total: 0, ready: 0, blocked: 0, uncertain: 0 },
      items: [],
    });
  });

  it("normalizes a prepared order and preserves optional action-input values", () => {
    const order = normalizeRemediationOrder({
      tenant_id: " public ",
      order_id: "order-1",
      source: {
        source_type: "REMEDIATION_SOURCE_TYPE_CASE_GRAPH",
        source_ref_id: "case-1",
        case_id: "case-1",
        workflow_id: "workflow-1",
      },
      title: "Case remediation",
      status: "prepared",
      revision: "0003",
      prepared_fingerprint_version: "v4",
      prepared_fingerprint: "a".repeat(64),
      confirmable: true,
      summary: { total: "1", ready: 1 },
      items: [
        {
          item_id: "item-1",
          order_id: "order-1",
          position: "1",
          node_key: "file:public:agent-1:c:/evil.exe",
          entity_type: "File",
          display_name: "evil.exe",
          agent_id: "agent-1",
          action_code: "file.quarantine",
          action_input: {
            file_quarantine: {
              delete_original: false,
              encrypt: true,
              storage: " local ",
            },
          },
          status: "ready",
          risk_level: "high",
          result_version: "2",
          execution: null,
          backup: null,
        },
      ],
    });

    expect(order.revision).toBe("3");
    expect(order.confirmable).toBe(true);
    expect(order.source.source_type).toBe("REMEDIATION_SOURCE_TYPE_CASE_GRAPH");
    expect(order.items[0]).toMatchObject({
      position: 1,
      status: "ready",
      result_version: 2,
      execution: null,
      backup: null,
      action_input: {
        file_quarantine: {
          delete_original: false,
          encrypt: true,
          storage: "local",
        },
      },
    });
  });

  it("normalizes execution, uncertainty, and backup projections", () => {
    const order = normalizeRemediationOrder({
      order_id: "order-2",
      status: "completed",
      outcome: "partial_success",
      revision: 8,
      items: [
        {
          item_id: "item-2",
          order_id: "order-2",
          status: "failed",
          uncertainty_since_at: "2026-07-14T10:00:00Z",
          execution: {
            operation_id: "operation-1",
            dispatch_id: "dispatch-1",
            operation_status: "completed",
            execution_status: "failed",
            failure_certainty: "uncertain",
            publish_acceptance_unknown: "true",
            uncertain_count: "1",
            dispatch_result_version: "4",
          },
          backup: {
            backup_id: "backup-1",
            source_item_id: "item-source",
            resource_type: "file",
            resource_state: "available",
            available: 1,
          },
        },
      ],
    });

    const item = order.items[0];
    expect(item.uncertainty_since_at).toBe("2026-07-14T10:00:00Z");
    expect(item.execution).toMatchObject({
      operation_id: "operation-1",
      dispatch_id: "dispatch-1",
      failure_certainty: "uncertain",
      publish_acceptance_unknown: true,
      uncertain_count: 1,
      dispatch_result_version: 4,
    });
    expect(item.backup).toMatchObject({
      backup_id: "backup-1",
      source_item_id: "item-source",
      available: true,
    });
  });

  it("keeps force as a process.terminate parameter", () => {
    const order = normalizeRemediationOrder({
      order_id: "order-process",
      revision: 1,
      items: [
        {
          item_id: "item-process",
          action_code: "process.terminate",
          action_input: {
            process_terminate: {
              include_self: true,
              include_children: false,
              force: true,
            },
          },
        },
      ],
    });

    expect(order.items[0].action_code).toBe("process.terminate");
    expect(order.items[0].action_input.process_terminate).toEqual({
      include_self: true,
      include_children: false,
      force: true,
    });
  });

  it("normalizes the current per-Action and per-Agent protocol shape", () => {
    const result = normalizeRemediationNodeActionsResult({
      tenant_id: "public",
      source_type: "case_graph",
      scope_type: "case",
      scope_id: "case-1",
      node: {
        node_key: "file:1",
        entity_type: "File",
        resolution_status: 1,
        reason_code: "",
        reason_message: "",
        actions: [
          {
            action: {
              action_code: "file.restore",
              display_name: "恢复文件",
              risk_level: "low",
              reversible: false,
            },
            agent_decisions: [
              {
                agent_id: "agent-1",
                status: 1,
                reverse_contexts: [
                  {
                    source_item_id: "item-source",
                    source_action_code: "file.quarantine",
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(result.node).toMatchObject({
      resolution_status: "resolved",
      reason_code: "",
    });
    expect(result.node.actions[0]).toMatchObject({
      action: {
        action_code: "file.restore",
        risk_level: "low",
      },
      agent_decisions: [
        {
          agent_id: "agent-1",
          status: "available",
          reverse_contexts: [
            {
              source_item_id: "item-source",
              source_action_code: "file.quarantine",
            },
          ],
        },
      ],
    });
  });

  it("keeps uint64 list totals and revisions exact", () => {
    const total = "18446744073709551615";
    const list = normalizeRemediationOrderList({
      total,
      page: "2",
      page_size: "20",
      items: [{ order_id: "order-large", revision: total }],
    });
    const items = normalizeRemediationItemList({ total, items: [] });
    const summary = normalizeRemediationSummary({
      order_count: total,
      item_count: "0009",
    });

    expect(list.total).toBe(total);
    expect(list.items[0].revision).toBe(total);
    expect(list.page).toBe(2);
    expect(items.total).toBe(total);
    expect(summary.order_count).toBe(total);
    expect(summary.item_count).toBe("9");
  });

  it("normalizes per-Agent applicability decisions and configuration state", () => {
    const result = normalizeRemediationNodeActionsResult({
      node: {
        node_key: "file:1",
        entity_type: "File",
        resolution_status:
          "REMEDIATION_NODE_RESOLUTION_STATUS_RESOLVED",
        actions: [
          {
            action: {
              action_code: "file.quarantine",
              display_name: "隔离文件",
              risk_level: "high",
            },
            agent_decisions: [
              {
                agent_id: "agent-1",
                status: "REMEDIATION_ACTION_APPLICABILITY_STATUS_UNAVAILABLE",
                reason_code: "CONFLICTING_ACTION_IN_FLIGHT",
                current_effect_state: 4,
                prepare_disposition: 4,
                draft_selectable: false,
              },
              {
                agent_id: "agent-2",
                status: 1,
                current_effect_state: 1,
                prepare_disposition: 1,
                draft_selectable: true,
              },
            ],
          },
          {
            action: { action_code: "file_ea.delete" },
            agent_decisions: [
              {
                agent_id: "agent-1",
                status:
                  "REMEDIATION_ACTION_APPLICABILITY_STATUS_REQUIRES_CONFIGURATION",
                reason_code: "EA_DELETE_SCOPE_REQUIRED",
                required_input_fields: [
                  "file_ea.ea_names|file_ea.delete_all",
                ],
                target_candidates: [
                  {
                    candidate_id: "candidate-1",
                    target_type: "wmi_subscription",
                    display_name: "Filter-A → Consumer-A",
                    shared_source: 1,
                    shared_target: false,
                    source_binding_count: "2",
                    target_binding_count: 1,
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(result.node.actions[0]).toMatchObject({
      agent_decisions: [
        {
          agent_id: "agent-1",
          status: "unavailable",
          reason_code: "CONFLICTING_ACTION_IN_FLIGHT",
          current_effect_state: "conflicting_action_in_flight",
          prepare_disposition: "block",
          draft_selectable: false,
        },
        {
          agent_id: "agent-2",
          status: "available",
          current_effect_state: "none",
          prepare_disposition: "execute",
          draft_selectable: true,
        },
      ],
    });
    expect(result.node.actions[1].agent_decisions[0]).toMatchObject({
      status: "requires_configuration",
      reason_code: "EA_DELETE_SCOPE_REQUIRED",
      required_input_fields: ["file_ea.ea_names|file_ea.delete_all"],
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
    });
  });

  it("normalizes explicit File EA name and delete-all inputs", () => {
    const named = normalizeRemediationOrder({
      items: [
        {
          action_input: {
            file_ea: {
              force: "true",
              ea_names: [" Zone.Identifier ", "", "MalwareMeta"],
              delete_all: false,
            },
          },
        },
      ],
    });
    expect(named.items[0].action_input.file_ea).toEqual({
      force: true,
      ea_names: ["Zone.Identifier", "MalwareMeta"],
      delete_all: false,
    });

    const all = normalizeRemediationOrder({
      items: [{ action_input: { file_ea: { delete_all: 1 } } }],
    });
    expect(all.items[0].action_input.file_ea).toEqual({ delete_all: true });
  });

  it("normalizes a WMI Subscription candidate reference without raw target fields", () => {
    const result = normalizeRemediationOrder({
      items: [
        {
          action_input: {
            wmi_subscription: {
              target_candidate_id: " candidate-1 ",
              remove_binding_only: "true",
            },
          },
        },
      ],
    });
    expect(result.items[0].action_input.wmi_subscription).toEqual({
      target_candidate_id: "candidate-1",
      remove_binding_only: true,
    });
  });

  it("normalizes typed target snapshots without accepting raw target JSON", () => {
    const result = normalizeRemediationOrder({
      items: [
        {
          target_snapshot: {
            status: "REMEDIATION_TARGET_SNAPSHOT_STATUS_AVAILABLE",
            source: 2,
            canonical_node_key: " file:1 ",
            observed_at: "2026-07-14T10:00:00Z",
            file: {
              file_path: " C:\\Windows\\Temp\\evil.exe ",
              file_hash: " abcdef ",
              file_type: "exe",
              signature: "unsigned",
              observed_ea_names: [" Zone.Identifier ", ""],
            },
            target_identifier_json: '{"file_path":"must-not-pass"}',
          },
        },
        {
          target_snapshot: {
            status: 1,
            source: "REMEDIATION_TARGET_SNAPSHOT_SOURCE_GRAPH_CURRENT",
            wmi_subscription: {
              candidate_id: " candidate-1 ",
              namespace: "root\\subscription",
              filter_name: "Filter-A",
              consumer_name: "Consumer-A",
              consumer_type: "CommandLineEventConsumer",
              shared_filter: 1,
              shared_consumer: false,
              filter_binding_count: "2",
              consumer_binding_count: 1,
            },
          },
        },
      ],
    });

    expect(result.items[0].target_snapshot).toEqual({
      status: "available",
      source: "prepared_frozen",
      reason_code: "",
      reason_message: "",
      canonical_node_key: "file:1",
      observed_at: "2026-07-14T10:00:00Z",
      process: null,
      file: {
        file_path: "C:\\Windows\\Temp\\evil.exe",
        file_hash: "abcdef",
        file_type: "exe",
        signature: "unsigned",
        signer: "",
        observed_ea_names: ["Zone.Identifier"],
        stream_name: "",
      },
      scheduled_task: null,
      service: null,
      account: null,
      registry: null,
      wmi_class: null,
      wmi_subscription: null,
      bits_job: null,
      network: null,
    });
    expect(result.items[1].target_snapshot?.wmi_subscription).toMatchObject({
      candidate_id: "candidate-1",
      shared_filter: true,
      filter_binding_count: 2,
    });
  });
});
