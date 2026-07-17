"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type {
  RemediationActionDecision,
  RemediationActionInput,
  RemediationOrderItem,
  RemediationTargetSnapshot,
} from "@/features/attack/remediation-order";
import { Badge } from "@/shared/ui/badge";

import type {
  DemoActionVariant,
  DemoValues,
  RemediationPreviewDemoTemplate,
} from "../demo-data";
import { RemediationOrderAuthorityReference } from "./remediation-order-authority-reference";
import {
  RemediationOrderParameterPanel,
  remediationOrderActionLabel,
} from "./remediation-order-parameter-editor";

const DEMO_AGENT_ID = "agent-demo-01";

export interface DynamicParameterDemoScenario {
  decision: RemediationActionDecision;
  item: RemediationOrderItem;
  reverseSourceItemId: string;
  sourceItems: RemediationOrderItem[];
}

export function RemediationDynamicParameterDemo({
  actionInput,
  onActionInputChange,
  template,
  values,
  variant,
}: {
  actionInput: RemediationActionInput;
  onActionInputChange: (input: RemediationActionInput) => void;
  template: RemediationPreviewDemoTemplate;
  values: DemoValues;
  variant: DemoActionVariant;
}) {
  const locale = useLocale();
  const t = useTranslations("pages.collection.orchestration.parameters");
  const scenario = useMemo(
    () =>
      buildDynamicParameterDemoScenario(template, variant, values, actionInput),
    [actionInput, template, values, variant],
  );
  const [reverseSourceItemId, setReverseSourceItemId] = useState(
    scenario.reverseSourceItemId,
  );
  const requiresHistory = variant.requiresHistory;
  const authorityReference = (
    <RemediationOrderAuthorityReference
      actionInput={actionInput}
      decision={scenario.decision}
      disabled={false}
      item={scenario.item}
      onActionInputChange={onActionInputChange}
      onReverseSourceChange={setReverseSourceItemId}
      reverseSourceItemId={reverseSourceItemId}
      sourceItems={scenario.sourceItems}
    />
  );

  return (
    <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <SlidersHorizontal className="size-4 text-violet-600" aria-hidden />
            {t("demoTitle")}
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {t("demoDescription")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="rounded-full border-slate-200 bg-slate-50 text-slate-600"
          >
            {variant.requiresHistory ? t("reverse") : t("forward")}
          </Badge>
          <Badge className="rounded-full bg-slate-950 text-white hover:bg-slate-950">
            {remediationOrderActionLabel(scenario.item, locale)}
          </Badge>
        </div>
      </div>

      <div className="px-5 py-4">
        {!requiresHistory ? authorityReference : null}
        <RemediationOrderParameterPanel
          key={`${scenario.item.item_id}:${variant.actionCode}`}
          actionInput={actionInput}
          disabled={false}
          item={scenario.item}
          onActionInputChange={onActionInputChange}
        />
        {requiresHistory ? authorityReference : null}
      </div>
    </section>
  );
}

export function buildDynamicParameterDemoScenario(
  template: RemediationPreviewDemoTemplate,
  variant: DemoActionVariant,
  values: DemoValues,
  actionInput: RemediationActionInput,
): DynamicParameterDemoScenario {
  const agentId = text(values, "agent_id") || DEMO_AGENT_ID;
  const nodeKey =
    text(values, "node_key") || `${template.id}:${agentId}:demo-object`;
  const reverseSourceItemId = variant.requiresHistory
    ? `source-${template.id}-success`
    : "";
  const targetSnapshot = buildDemoTargetSnapshot(template.id, nodeKey, values);
  const item = createDemoOrderItem({
    actionCode: variant.actionCode,
    actionInput,
    agentId,
    displayName: demoDisplayName(template.id, values),
    entityType: template.entityType,
    itemId: `demo-${template.id}-${variant.mode}`,
    nodeKey,
    reverseSourceItemId,
    targetSnapshot,
  });
  const sourceItems = reverseSourceItemId
    ? [
        createDemoSourceItem({
          agentId,
          displayName: item.display_name,
          itemId: reverseSourceItemId,
          nodeKey,
          sourceActionCode: variant.sourceActionCode || template.actionCode,
          targetSnapshot,
        }),
      ]
    : [];
  const targetCandidates =
    variant.actionCode === "wmi_subscription.delete"
      ? [
          {
            candidate_id:
              "9c6cc0c123be20ae36a72410ac86ec727baaa50c0a12cf0c4aaf742f0b0f54b1",
            target_type: "wmi_subscription",
            display_name: `${text(values, "filter_name")} → ${text(values, "consumer_name")}`,
            shared_source: false,
            shared_target: false,
            source_binding_count: 1,
            target_binding_count: 1,
          },
        ]
      : [];

  return {
    item,
    reverseSourceItemId,
    sourceItems,
    decision: {
      action: {
        action_code: variant.actionCode,
        display_name: variant.displayName,
        risk_level: variant.mode === "reverse" ? "low" : "medium",
        reversible: Boolean(variant.requiresHistory),
      },
      agent_decisions: [
        {
          agent_id: agentId,
          status: variant.requiresHistory
            ? "requires_configuration"
            : "available",
          reason_code: variant.requiresHistory
            ? "REVERSE_SOURCE_SELECTION_REQUIRED"
            : "",
          reason_message: "",
          required_input_fields: variant.requiresHistory
            ? ["reverse_source_item_id"]
            : [],
          reverse_contexts: reverseSourceItemId
            ? [
                {
                  source_item_id: reverseSourceItemId,
                  source_action_code:
                    variant.sourceActionCode || template.actionCode,
                },
              ]
            : [],
          target_candidates: targetCandidates,
          current_effect_state: "none",
          prepare_disposition: "execute",
          draft_selectable: true,
        },
      ],
    },
  };
}

function createDemoOrderItem({
  actionCode,
  actionInput,
  agentId,
  displayName,
  entityType,
  itemId,
  nodeKey,
  reverseSourceItemId,
  targetSnapshot,
}: {
  actionCode: string;
  actionInput: RemediationActionInput;
  agentId: string;
  displayName: string;
  entityType: string;
  itemId: string;
  nodeKey: string;
  reverseSourceItemId: string;
  targetSnapshot: RemediationTargetSnapshot;
}): RemediationOrderItem {
  return {
    item_id: itemId,
    round_no: 1,
    position: 1,
    node_key: nodeKey,
    entity_type: entityType,
    display_name: displayName,
    graph_origin: "demo",
    agent_id: agentId,
    action_code: actionCode,
    action_input: actionInput,
    reverse_source_type: reverseSourceItemId ? "item" : "",
    reverse_source_id: reverseSourceItemId,
    status: "draft",
    reason_code: "",
    reason_message: "",
    risk_level: "medium",
    catalog_version: "",
    executor_kind: "command",
    result_authority: "mitigation",
    retry_safety: "verify_before_retry",
    effect_group: "demo",
    execution_timeout_seconds: 300,
    created_at: "",
    updated_at: "",
    object_type: 0,
    object_id: "",
    object_version: "",
    capability_profile: "",
    capability_contract_version: 0,
    capability_fingerprint: "",
    resolved_operation: "",
    catalog_delete_mode: "",
    operation_id: "",
    dispatch_id: "",
    error_code: "",
    error_message: "",
    result_version: 0,
    uncertainty_since_at: "",
    finished_at: "",
    execution: null,
    backup: null,
    order_id: "demo-order",
    target_snapshot: targetSnapshot,
    agent_snapshot: {
      agent_id: agentId,
      host_name: "WIN-DEMO-01",
      primary_ip: "192.168.56.20",
      ip_addresses: ["192.168.56.20"],
      mac_addresses: ["00-15-5D-01-02-03"],
      observed_at: "2026-07-16T10:00:00Z",
    },
  };
}

function createDemoSourceItem({
  agentId,
  displayName,
  itemId,
  nodeKey,
  sourceActionCode,
  targetSnapshot,
}: {
  agentId: string;
  displayName: string;
  itemId: string;
  nodeKey: string;
  sourceActionCode: string;
  targetSnapshot: RemediationTargetSnapshot;
}) {
  const source = createDemoOrderItem({
    actionCode: sourceActionCode,
    actionInput: {},
    agentId,
    displayName,
    entityType: "History",
    itemId,
    nodeKey,
    reverseSourceItemId: "",
    targetSnapshot,
  });
  const sourcePath = targetSnapshot.file?.file_path || displayName;
  return {
    ...source,
    status: "success",
    backup: {
      backup_id: `backup-${itemId}`,
      source_item_id: itemId,
      resource_type: "demo",
      resource_state: "available",
      available: true,
      unavailable_reason_code: "",
      created_at: "2026-07-16T10:00:00Z",
      updated_at: "2026-07-16T10:00:00Z",
      last_verified_at: "2026-07-16T10:00:00Z",
      expires_at: "",
      path_pairs: [
        {
          source_path: sourcePath,
          backup_path: `C:\\ProgramData\\WatchPoint\\Backup\\${basename(sourcePath)}.bak`,
          original_md5: targetSnapshot.file?.file_hash || "",
        },
      ],
    },
  };
}

function emptyTargetSnapshot(nodeKey: string): RemediationTargetSnapshot {
  return {
    status: "available",
    source: "graph_current",
    reason_code: "",
    reason_message: "",
    canonical_node_key: nodeKey,
    observed_at: "2026-07-16T10:00:00Z",
    process: null,
    file: null,
    scheduled_task: null,
    service: null,
    account: null,
    registry: null,
    wmi_class: null,
    wmi_subscription: null,
    bits_job: null,
    network: null,
  };
}

function buildDemoTargetSnapshot(
  templateId: string,
  nodeKey: string,
  values: DemoValues,
): RemediationTargetSnapshot {
  const snapshot = emptyTargetSnapshot(nodeKey);
  switch (templateId) {
    case "process":
    case "proc-execute":
      snapshot.process = {
        process_guid: text(values, "process_guid"),
        pid: number(values, "pid"),
        process_name: text(values, "process_name"),
        process_path: text(values, "process_path"),
        process_hash: text(values, "process_hash"),
        command_line: text(values, "command_line"),
      };
      break;
    case "file":
    case "file-ea":
    case "ntfs-ads":
      snapshot.file = {
        file_path: text(values, "file_path"),
        file_hash: text(values, "file_hash"),
        file_type: "PE",
        signature: "unsigned",
        signer: "",
        observed_ea_names: csv(values, "ea_names"),
        stream_name: text(values, "stream_name"),
      };
      break;
    case "scheduled-task":
      snapshot.scheduled_task = {
        kind: "task",
        task_name: text(values, "task_name"),
        task_path: text(values, "task_path"),
        job_id: text(values, "job_id"),
        command: "powershell.exe -File updater.ps1",
        binary_path:
          "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
        binary_hash: "44d88612fea8a8f36de82e1278abb02f",
        run_as: "SYSTEM",
        state: "Ready",
      };
      break;
    case "service":
      snapshot.service = {
        service_name: text(values, "service_name"),
        display_name: text(values, "display_name"),
        binary_path: "C:\\ProgramData\\WinUpdateSvc.exe",
        binary_hash: "44d88612fea8a8f36de82e1278abb02f",
        start_account: "LocalSystem",
        state: "Running",
      };
      break;
    case "account":
      snapshot.account = {
        account_name: text(values, "account_name"),
        domain: text(values, "domain"),
        sid: text(values, "sid"),
        enabled: true,
        locked: false,
      };
      break;
    case "registry":
      snapshot.registry = {
        kind: text(values, "value_name") ? "value" : "key",
        hive: text(values, "hive"),
        key_path: text(values, "key_path"),
        value_name: text(values, "value_name"),
        present: true,
      };
      break;
    case "wmi-class":
      snapshot.wmi_class = {
        namespace: text(values, "namespace"),
        class_name: text(values, "class_name"),
        class_path: `${text(values, "namespace")}:${text(values, "class_name")}`,
        server_name: "WIN-DEMO-01",
      };
      break;
    case "wmi-subscription":
      snapshot.wmi_subscription = {
        candidate_id:
          "9c6cc0c123be20ae36a72410ac86ec727baaa50c0a12cf0c4aaf742f0b0f54b1",
        namespace: text(values, "namespace"),
        filter_name: text(values, "filter_name"),
        consumer_name: text(values, "consumer_name"),
        consumer_type: text(values, "consumer_type"),
        shared_filter: false,
        shared_consumer: false,
        filter_binding_count: 1,
        consumer_binding_count: 1,
      };
      break;
    case "bits-job":
      snapshot.bits_job = {
        job_id: text(values, "job_id"),
        job_name: text(values, "job_name"),
        job_type: "download",
        job_status: "transferring",
        remote_url: text(values, "remote_url"),
        local_files: csv(values, "local_files"),
      };
      break;
    case "net-quarantine":
      snapshot.network = {
        kind: "endpoint",
        ip: text(values, "remote_address"),
        port: number(values, "remote_port"),
        protocol: text(values, "protocol"),
        domain: "",
        url: "",
      };
      break;
  }
  return snapshot;
}

function demoDisplayName(templateId: string, values: DemoValues) {
  switch (templateId) {
    case "process":
    case "proc-execute":
      return text(values, "process_name") || text(values, "process_path");
    case "file":
    case "file-ea":
    case "ntfs-ads":
      return text(values, "file_path");
    case "scheduled-task":
      return text(values, "task_name");
    case "service":
      return text(values, "service_name");
    case "account":
      return text(values, "account_name");
    case "registry":
      return `${text(values, "hive")}\\${text(values, "key_path")}`;
    case "wmi-class":
      return text(values, "class_name");
    case "wmi-subscription":
      return text(values, "filter_name");
    case "bits-job":
      return text(values, "job_name");
    case "net-quarantine":
      return `${text(values, "remote_address")}:${text(values, "remote_port")}`;
    default:
      return templateId;
  }
}

function text(values: DemoValues, key: string) {
  const value = values[key];
  return value == null ? "" : String(value).trim();
}

function number(values: DemoValues, key: string) {
  const value = Number(values[key]);
  return Number.isFinite(value) ? value : 0;
}

function csv(values: DemoValues, key: string) {
  return text(values, key)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function basename(value: string) {
  const normalized = value.trim().replace(/[\\/]+$/, "");
  return normalized.split(/[\\/]/).filter(Boolean).pop() || "backup";
}
