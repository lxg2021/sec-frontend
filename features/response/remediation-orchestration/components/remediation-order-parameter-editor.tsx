"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type {
  RemediationActionDecision,
  RemediationActionInput as OrderActionInput,
  RemediationOrderItem,
  RemediationTargetSnapshot,
} from "@/features/attack/remediation-order";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";

import type {
  RemediationActionInput as PreviewActionInput,
  RemediationActionOption,
} from "../types";
import {
  buildRemediationTemplateInput,
  getRemediationPreviewTemplate,
  initialRemediationTemplateValues,
  remediationTemplateActionDisplayName,
  validateRemediationTemplateValues,
  type RemediationPreviewTemplate,
  type RemediationTemplateValues,
} from "./remediation-preview-templates";
import {
  normalizeFileEANames,
  remediationActionApplicabilityError,
  validateFileEAEditor,
  validateWmiSubscriptionEditor,
} from "../remediation-order-model";

const RESTORE_ACTION_PATTERN = /(?:\.restore|\.enable|\.bypass(?:_execute)?)$/;

type TemplateField = RemediationPreviewTemplate["parameters"][number];

function humanizeRemediationIdentifier(value: string) {
  const words: Record<string, string> = {
    ads: "ADS",
    bits: "BITS",
    ea: "EA",
    id: "ID",
    ip: "IP",
    ntfs: "NTFS",
    wmi: "WMI",
  };
  return value
    .trim()
    .split(/[._\s-]+/)
    .filter(Boolean)
    .map(
      (part) =>
        words[part.toLowerCase()] ??
        `${part.charAt(0).toUpperCase()}${part.slice(1)}`,
    )
    .join(" ");
}

const ENGLISH_ACTION_LABELS: Record<string, string> = {
  "process.terminate": "Terminate Process",
  "file.quarantine": "Quarantine File",
  "file.restore": "Restore File",
  "scheduled_job.delete": "Delete Scheduled Job",
  "task.delete": "Delete Scheduled Task",
  "scheduled_task.delete": "Delete Scheduled Task",
  "task.disable": "Disable Scheduled Task",
  "scheduled_task.disable": "Disable Scheduled Task",
  "scheduled_job.restore": "Restore Scheduled Job",
  "task.restore": "Restore Scheduled Task",
  "scheduled_task.restore": "Restore Scheduled Task",
  "task.enable": "Enable Scheduled Task",
  "scheduled_task.enable": "Enable Scheduled Task",
  "service.disable": "Disable Service",
  "service.delete": "Delete Service",
  "service.restore": "Restore Service",
  "service.enable": "Enable Service",
  "account.disable": "Disable Account",
  "account.delete": "Delete Account",
  "account.reset_password": "Reset Password",
  "account.enable": "Enable Account",
  "registry.delete_key": "Delete Registry Key",
  "registry.delete_value": "Delete Registry Value",
  "registry.restore": "Restore Registry",
  "wmi_class.delete": "Delete WMI Class",
  "wmi_class.restore": "Restore WMI Class",
  "wmi_subscription.delete": "Delete WMI Subscription",
  "wmi_subscription.restore": "Restore WMI Subscription",
  "bits.delete": "Delete BITS Job",
  "bits_job.delete": "Delete BITS Job",
  "bits.restore": "Restore BITS Job",
  "bits_job.restore": "Restore BITS Job",
  "file_ea.delete": "Delete File EA",
  "file_ea.restore": "Restore File EA",
  "ntfs_ads.delete": "Delete NTFS ADS",
  "ntfs_ads.restore": "Restore NTFS ADS",
  "process.block_execute": "Block Process Execution",
  "process.block": "Block Process Execution",
  "process.bypass_execute": "Allow Process Execution",
  "process.bypass": "Allow Process Execution",
  "net.block": "Block Network",
  "network.block": "Block Network",
  "net.bypass": "Allow Network",
  "network.bypass": "Allow Network",
};

function englishActionLabel(actionCode: string) {
  const normalized = actionCode.trim().toLowerCase();
  return (
    ENGLISH_ACTION_LABELS[normalized] ??
    humanizeRemediationIdentifier(normalized)
  );
}

type ParameterTextKey =
  | "processTermination"
  | "terminateTarget"
  | "terminateTargetDescription"
  | "terminateChildren"
  | "terminateChildrenDescription"
  | "forceTerminateDescription"
  | "forceTerminateRisk"
  | "deleteScope"
  | "selectDeleteScope"
  | "deleteNamedEa"
  | "deleteAllEa"
  | "eaNames"
  | "eaNamesPlaceholder"
  | "eaNamesHint"
  | "deleteAllEaHint"
  | "forceDelete"
  | "forceDeleteDescription"
  | "quarantineBehavior"
  | "deleteOriginal"
  | "deleteOriginalDescription"
  | "quarantineStorage"
  | "localSecureStorage"
  | "centralStorage"
  | "encryptPackage"
  | "encryptPackageDescription"
  | "quarantineSuffix";

function parameterText(locale: string, key: ParameterTextKey) {
  const zh = locale.toLowerCase().startsWith("zh");
  const values: Record<ParameterTextKey, [string, string]> = {
    terminateTarget: ["终止目标进程", "Terminate Target Process"],
    terminateTargetDescription: [
      "结束由可信 PID、Process GUID 和路径共同标识的目标进程",
      "Terminate the target identified by its trusted PID, Process GUID, and path",
    ],
    processTermination: ["进程结束行为", "Process Termination Behavior"],
    terminateChildren: ["终止子进程", "Terminate Child Processes"],
    terminateChildrenDescription: [
      "结束目标进程时一并结束其子进程",
      "Terminate child processes together with the target process",
    ],
    forceTerminateDescription: [
      "使用强制方式结束目标进程",
      "Use forceful termination for the target process",
    ],
    forceTerminateRisk: [
      "强制结束会立即终止进程，未保存的数据可能丢失；请仅在普通结束无法满足处置目标时使用。",
      "Force termination stops the process immediately and may discard unsaved data. Use it only when normal termination cannot meet the response objective.",
    ],
    deleteScope: ["删除范围", "Deletion Scope"],
    selectDeleteScope: ["请选择删除范围", "Select a deletion scope"],
    deleteNamedEa: ["按 EA 名称删除", "Delete by EA Name"],
    deleteAllEa: ["明确删除全部 EA", "Explicitly Delete All EAs"],
    eaNames: ["EA 名称", "EA Names"],
    eaNamesPlaceholder: ["每行填写一个 EA 名称", "Enter one EA name per line"],
    eaNamesHint: [
      "最多 128 个名称，支持换行或逗号分隔。",
      "Up to 128 names; separate them with new lines or commas.",
    ],
    deleteAllEaHint: [
      "已明确选择删除该文件上的全部 EA。",
      "All EAs on this file will be explicitly deleted.",
    ],
    forceDelete: ["强制删除", "Force Delete"],
    forceDeleteDescription: [
      "仅在普通删除失败时使用强制方式",
      "Use force only when normal deletion fails",
    ],
    quarantineBehavior: ["隔离行为", "Quarantine Behavior"],
    deleteOriginal: [
      "隔离成功后删除原文件",
      "Delete Original File After Quarantine",
    ],
    deleteOriginalDescription: [
      "默认开启；隔离失败时不会删除原文件",
      "Enabled by default; the original file is retained if quarantine fails",
    ],
    quarantineStorage: ["隔离存储", "Quarantine Storage"],
    localSecureStorage: ["本地安全区", "Local Secure Storage"],
    centralStorage: ["中心存储", "Central Storage"],
    encryptPackage: ["隔离包加密", "Encrypt Quarantine Package"],
    encryptPackageDescription: [
      "使用 Agent 安全密钥加密",
      "Encrypt with the Agent security key",
    ],
    quarantineSuffix: ["隔离文件后缀", "Quarantine File Suffix"],
  };
  return values[key][zh ? 0 : 1];
}

function localizedFieldLabel(templateId: string, key: string, locale: string) {
  if (locale.toLowerCase().startsWith("zh")) {
    if (key === "force") {
      if (templateId.includes("terminate")) return "强制结束";
      if (templateId.includes("disable")) return "强制禁用";
      return "强制删除";
    }
    return null;
  }
  if (key === "force") {
    if (templateId.includes("terminate")) return "Force Terminate";
    if (templateId.includes("disable")) return "Force Disable";
    return "Force Delete";
  }
  const labels: Record<string, string> = {
    include_children: "Terminate Child Processes",
    delete_original: "Delete Original File",
    encrypt: "Encrypt Quarantine Package",
    storage: "Quarantine Storage",
    suffix: "Quarantine File Suffix",
    stop_before_delete: "Stop Service Before Deletion",
    force_logoff: "Force Logoff",
    new_password: "New Password",
    force_change_at_next_logon: "Require Password Change at Next Sign-in",
    unlock_account: "Unlock Account",
    stop_on_failure: "Stop on Failure",
    delete_instances: "Delete Instances",
    recursive_delete: "Delete Recursively",
    remove_binding_only: "Remove Binding Only",
    subject_path: "Parent Process Path",
    subject_hash: "Parent Process Hash",
    except_path: "Exception Path",
    except_hash: "Exception Hash",
    audit: "Enable Audit",
    direction: "Blocking Direction",
  };
  return labels[key] ?? humanizeRemediationIdentifier(key);
}

function localizedTemplate(
  template: RemediationPreviewTemplate,
  locale: string,
  actionCode = template.actionCodes[0] ?? template.id,
) {
  const normalizedActionCode = actionCode.trim().toLowerCase();
  return {
    ...template,
    title: locale.toLowerCase().startsWith("zh")
      ? template.title
      : englishActionLabel(normalizedActionCode),
    parameters: template.parameters
      .filter(
        (field) =>
          normalizedActionCode !== "registry.delete_value" ||
          field.key !== "recursive",
      )
      .map((field) => ({
        ...field,
        label:
          localizedFieldLabel(template.id, field.key, locale) ?? field.label,
        placeholder:
          !locale.toLowerCase().startsWith("zh") && field.placeholder
            ? `Enter ${humanizeRemediationIdentifier(field.key)}`
            : field.placeholder,
        options: field.options?.map((option) => ({
          ...option,
          label: locale.toLowerCase().startsWith("zh")
            ? option.label
            : humanizeRemediationIdentifier(option.value),
        })),
      })),
  };
}

function asPreviewInput(input: OrderActionInput): PreviewActionInput {
  return input as unknown as PreviewActionInput;
}

function asOrderInput(input: PreviewActionInput | undefined): OrderActionInput {
  return (input ?? {}) as unknown as OrderActionInput;
}

export function remediationOrderActionRequiresHistory(actionCode: string) {
  return RESTORE_ACTION_PATTERN.test(actionCode.trim().toLowerCase());
}

export function remediationOrderActionOption(
  item: Pick<RemediationOrderItem, "action_code" | "entity_type">,
): RemediationActionOption {
  return {
    action_code: item.action_code,
    display_name: "",
    action_type: item.action_code,
    requires_agent: true,
    requires_history: remediationOrderActionRequiresHistory(item.action_code),
    required_snapshot_kind: item.entity_type,
    contexts: [],
  };
}

export function remediationOrderDisplayTemplate(
  item: Pick<RemediationOrderItem, "action_code" | "entity_type">,
  locale = "zh-CN",
) {
  const action = remediationOrderActionOption(item);
  return localizedTemplate(
    getRemediationPreviewTemplate(action),
    locale,
    action.action_code,
  );
}

export function remediationOrderActionLabel(
  item: Pick<RemediationOrderItem, "action_code" | "entity_type">,
  locale = "zh-CN",
) {
  const action = remediationOrderActionOption(item);
  const template = getRemediationPreviewTemplate(action);
  if (!locale.toLowerCase().startsWith("zh")) {
    return englishActionLabel(item.action_code || template.id);
  }
  return remediationTemplateActionDisplayName(
    action,
    template,
    item.action_code || "处置动作",
  );
}

function decisionForAgent(
  decision: RemediationActionDecision | null | undefined,
  agentId: string,
) {
  return decision?.agent_decisions.find((item) => item.agent_id === agentId);
}

function nestedInputValue(input: OrderActionInput, path: string) {
  const normalized = path.trim().replace(/^action_input\./, "");
  if (!normalized) return undefined;
  return normalized.split(".").reduce<unknown>((value, part) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return undefined;
    }
    return (value as Record<string, unknown>)[part];
  }, input);
}

function hasInputValue(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "boolean") return value;
  return value !== undefined && value !== null;
}

function requiredFieldMissing(
  requiredField: string,
  input: OrderActionInput,
  reverseSourceItemId: string,
) {
  const alternatives = requiredField
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
  return alternatives.every((path) => {
    if (path === "reverse_source_item_id") {
      return !reverseSourceItemId.trim();
    }
    return !hasInputValue(nestedInputValue(input, path));
  });
}

export function validateRemediationOrderItemParameters({
  actionInput,
  decision,
  item,
  locale = "zh-CN",
  reverseSourceItemId,
}: {
  actionInput: OrderActionInput;
  decision?: RemediationActionDecision | null;
  item: RemediationOrderItem;
  locale?: string;
  reverseSourceItemId: string;
}) {
  const applicabilityError = remediationActionApplicabilityError(
    decision,
    item.agent_id,
    locale,
  );
  if (applicabilityError) return applicabilityError;
  const normalizedActionCode = item.action_code.trim().toLowerCase();
  if (normalizedActionCode === "file_ea.delete") {
    const fileEA = actionInput.file_ea;
    const fileEAError = validateFileEAEditor(
      {
        mode: fileEA?.delete_all
          ? "all"
          : fileEA?.ea_names?.length
            ? "named"
            : "",
        eaNamesText: fileEA?.ea_names?.join("\n") ?? "",
        force: Boolean(fileEA?.force),
      },
      locale,
    );
    if (fileEAError) return fileEAError;
  }
  if (normalizedActionCode === "wmi_subscription.delete") {
    const wmiSubscription = actionInput.wmi_subscription;
    const wmiError = validateWmiSubscriptionEditor(
      {
        targetCandidateId: wmiSubscription?.target_candidate_id?.trim() ?? "",
        removeBindingOnly: Boolean(wmiSubscription?.remove_binding_only),
      },
      decision,
      item.agent_id,
      locale,
    );
    if (wmiError) return wmiError;
  }
  const agentDecision = decisionForAgent(decision, item.agent_id);
  const action = remediationOrderActionOption(item);
  const template = getRemediationPreviewTemplate(action);
  const values = initialRemediationTemplateValues(
    asPreviewInput(actionInput),
    template,
  );
  const templateError = validateRemediationTemplateValues({
    locale,
    selectedAction: action,
    template,
    values,
  });
  if (templateError) return templateError;

  const missing = agentDecision?.required_input_fields.find((field) =>
    requiredFieldMissing(field, actionInput, reverseSourceItemId),
  );
  return missing
    ? locale.toLowerCase().startsWith("zh")
      ? `缺少必要参数：${missing}`
      : `Missing required parameter: ${missing}`
    : "";
}

function targetText(item: RemediationOrderItem) {
  return (
    item.display_name.trim() || item.object_id.trim() || item.node_key.trim()
  );
}

function targetName(item: RemediationOrderItem, unnamedTarget: string) {
  const value = targetText(item).replace(/[\\/]+$/, "");
  return value.split(/[\\/]/).filter(Boolean).pop() || value || unnamedTarget;
}

function entityLabel(item: RemediationOrderItem) {
  const value = item.entity_type.trim().replace(/[\s_-]+/g, " ");
  return value ? value.toUpperCase() : "TARGET";
}

interface TargetSnapshotRow {
  label: string;
  value: string;
  wide?: boolean;
}

type ParameterTranslator = (key: string) => string;

function localizedSnapshotValue(value: unknown, t: ParameterTranslator) {
  const display = stringValue(value).trim();
  if (!display) return "";
  const valueKeys: Record<string, string> = {
    enabled: "values.enabled",
    disabled: "values.disabled",
    locked: "values.locked",
    unlocked: "values.unlocked",
    present: "values.present",
    absent: "values.absent",
    running: "values.running",
    stopped: "values.stopped",
    paused: "values.paused",
    pending: "values.pending",
    transferring: "values.transferring",
    transferred: "values.transferred",
    completed: "values.completed",
    success: "values.succeeded",
    succeeded: "values.succeeded",
    failed: "values.failed",
    error: "values.error",
    unknown: "values.unknown",
    signed: "values.signed",
    unsigned: "values.unsigned",
    download: "values.download",
    upload: "values.upload",
    foreground: "values.foreground",
    background: "values.background",
  };
  const key = valueKeys[display.toLowerCase().replace(/[\s-]+/g, "_")];
  return key ? t(key) : display;
}

export function targetSnapshotRows(
  snapshot: RemediationTargetSnapshot,
  t: ParameterTranslator,
  locale = "zh-CN",
): TargetSnapshotRow[] {
  const rows: Array<TargetSnapshotRow | null> = [];
  const add = (label: string, value: unknown, wide = false) => {
    const display = Array.isArray(value)
      ? value
          .map(stringValue)
          .filter(Boolean)
          .join(locale.toLowerCase().startsWith("zh") ? "、" : ", ")
      : stringValue(value).trim();
    rows.push(display ? { label, value: display, wide } : null);
  };

  if (snapshot.process) {
    add(t("snapshotFields.processName"), snapshot.process.process_name);
    add(t("snapshotFields.pid"), snapshot.process.pid || "");
    add(t("snapshotFields.processPath"), snapshot.process.process_path, true);
    add(t("snapshotFields.processHash"), snapshot.process.process_hash);
    add(t("snapshotFields.processGuid"), snapshot.process.process_guid);
    add(t("snapshotFields.commandLine"), snapshot.process.command_line, true);
  } else if (snapshot.file) {
    add(t("snapshotFields.filePath"), snapshot.file.file_path, true);
    add(
      t("snapshotFields.fileHash"),
      snapshot.file.file_hash || t("fileHashUnavailable"),
      true,
    );
    add(t("snapshotFields.fileType"), snapshot.file.file_type);
    add(
      t("snapshotFields.signatureStatus"),
      localizedSnapshotValue(snapshot.file.signature, t),
    );
    add(t("snapshotFields.signer"), snapshot.file.signer);
    add(t("snapshotFields.streamName"), snapshot.file.stream_name, true);
    add(t("snapshotFields.observedEa"), snapshot.file.observed_ea_names, true);
  } else if (snapshot.scheduled_task) {
    add(t("snapshotFields.taskName"), snapshot.scheduled_task.task_name);
    add(t("snapshotFields.taskPath"), snapshot.scheduled_task.task_path, true);
    add(t("snapshotFields.jobId"), snapshot.scheduled_task.job_id, true);
    add(t("snapshotFields.command"), snapshot.scheduled_task.command, true);
    add(
      t("snapshotFields.binaryPath"),
      snapshot.scheduled_task.binary_path,
      true,
    );
    add(
      t("snapshotFields.binaryHash"),
      snapshot.scheduled_task.binary_hash,
      true,
    );
    add(t("snapshotFields.runAs"), snapshot.scheduled_task.run_as);
    add(
      t("snapshotFields.currentStatus"),
      localizedSnapshotValue(snapshot.scheduled_task.state, t),
    );
  } else if (snapshot.service) {
    add(t("snapshotFields.serviceName"), snapshot.service.service_name);
    add(t("snapshotFields.displayName"), snapshot.service.display_name);
    add(t("snapshotFields.binaryPath"), snapshot.service.binary_path, true);
    add(t("snapshotFields.binaryHash"), snapshot.service.binary_hash, true);
    add(t("snapshotFields.startAccount"), snapshot.service.start_account);
    add(
      t("snapshotFields.currentStatus"),
      localizedSnapshotValue(snapshot.service.state, t),
    );
  } else if (snapshot.account) {
    add(t("snapshotFields.accountName"), snapshot.account.account_name);
    add(t("snapshotFields.domain"), snapshot.account.domain);
    add(t("snapshotFields.sid"), snapshot.account.sid, true);
    if (snapshot.account.enabled !== undefined) {
      add(
        t("snapshotFields.enabledStatus"),
        t(snapshot.account.enabled ? "values.enabled" : "values.disabled"),
      );
    }
    if (snapshot.account.locked !== undefined) {
      add(
        t("snapshotFields.lockedStatus"),
        t(snapshot.account.locked ? "values.locked" : "values.unlocked"),
      );
    }
  } else if (snapshot.registry) {
    add(t("snapshotFields.hive"), snapshot.registry.hive);
    add(t("snapshotFields.sid"), snapshot.registry.user_sid, true);
    add(t("snapshotFields.keyPath"), snapshot.registry.key_path, true);
    add(t("snapshotFields.valueName"), snapshot.registry.value_name);
    if (snapshot.registry.present !== undefined) {
      add(
        t("snapshotFields.presenceStatus"),
        t(snapshot.registry.present ? "values.present" : "values.absent"),
      );
    }
  } else if (snapshot.wmi_class) {
    add(t("snapshotFields.namespace"), snapshot.wmi_class.namespace);
    add(t("snapshotFields.className"), snapshot.wmi_class.class_name);
    add(t("snapshotFields.classPath"), snapshot.wmi_class.class_path, true);
    add(t("snapshotFields.server"), snapshot.wmi_class.server_name);
  } else if (snapshot.wmi_subscription) {
    add(t("snapshotFields.namespace"), snapshot.wmi_subscription.namespace);
    add(t("snapshotFields.filter"), snapshot.wmi_subscription.filter_name);
    add(t("snapshotFields.consumer"), snapshot.wmi_subscription.consumer_name);
    add(
      t("snapshotFields.consumerType"),
      snapshot.wmi_subscription.consumer_type,
      true,
    );
    add(
      t("snapshotFields.filterBindingCount"),
      snapshot.wmi_subscription.filter_binding_count || "",
    );
    add(
      t("snapshotFields.consumerBindingCount"),
      snapshot.wmi_subscription.consumer_binding_count || "",
    );
  } else if (snapshot.bits_job) {
    add(t("snapshotFields.jobId"), snapshot.bits_job.job_id, true);
    add(t("snapshotFields.jobName"), snapshot.bits_job.job_name);
    add(
      t("snapshotFields.jobType"),
      localizedSnapshotValue(snapshot.bits_job.job_type, t),
    );
    add(
      t("snapshotFields.jobStatus"),
      localizedSnapshotValue(snapshot.bits_job.job_status, t),
    );
    add(t("snapshotFields.remoteUrl"), snapshot.bits_job.remote_url, true);
    add(t("snapshotFields.localFiles"), snapshot.bits_job.local_files, true);
  } else if (snapshot.network) {
    add(t("snapshotFields.targetIp"), snapshot.network.ip);
    add(t("snapshotFields.targetPort"), snapshot.network.port || "");
    add(t("snapshotFields.protocol"), snapshot.network.protocol);
    add(t("snapshotFields.domainName"), snapshot.network.domain, true);
    add(t("snapshotFields.url"), snapshot.network.url, true);
  }

  return rows.filter(Boolean) as TargetSnapshotRow[];
}

function TargetSnapshotPanel({
  expanded,
  item,
  onExpandedChange,
  snapshot,
}: {
  expanded: boolean;
  item: RemediationOrderItem;
  onExpandedChange: (expanded: boolean) => void;
  snapshot: RemediationTargetSnapshot | null;
}) {
  const locale = useLocale();
  const t = useTranslations("pages.collection.orchestration.parameters");
  const translate = (key: string) => t(key);
  const snapshotAvailable = snapshot?.status === "available";
  const snapshotRows = snapshotAvailable
    ? targetSnapshotRows(snapshot, translate, locale)
    : [];
  const fallbackRows: TargetSnapshotRow[] = [
    {
      label: t("targetName"),
      value: targetName(item, t("unnamedTarget")),
    },
    { label: t("entityType"), value: entityLabel(item) },
    ...(item.node_key.trim()
      ? [{ label: t("nodeKey"), value: item.node_key.trim(), wide: true }]
      : []),
  ];
  const rows = snapshotRows.length > 0 ? snapshotRows : fallbackRows;
  const unavailableMessage = !snapshot
    ? t("snapshotUnavailable")
    : snapshot.status !== "available"
      ? (locale.toLowerCase().startsWith("zh")
          ? snapshot.reason_message || snapshot.reason_code
          : snapshot.reason_code || snapshot.reason_message) ||
        t("snapshotNoEvidence")
      : snapshotRows.length === 0
        ? t("snapshotNoDisplayableEvidence")
        : "";

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-700">
          {t("targetInfo")}
        </div>
        <SectionCollapseButton
          expanded={expanded}
          onClick={() => onExpandedChange(!expanded)}
          sectionName={t("targetInfo")}
        />
      </div>
      {expanded ? (
        <>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2">
            {rows.map((row, index) => (
              <div
                className={cn(
                  "min-w-0 bg-slate-50 px-4 py-2.5",
                  row.wide ? "sm:col-span-2" : "",
                )}
                key={`${row.label}-${index}`}
              >
                <div className="text-[11px] text-slate-400">{row.label}</div>
                <div
                  className="mt-1 truncate font-mono text-xs font-medium text-slate-700"
                  title={row.value}
                >
                  {row.value}
                </div>
              </div>
            ))}
          </div>
          {unavailableMessage ? (
            <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-700">
              {unavailableMessage}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function SectionCollapseButton({
  expanded,
  onClick,
  sectionName,
}: {
  expanded: boolean;
  onClick: () => void;
  sectionName: string;
}) {
  const locale = useLocale();
  const label = expanded
    ? locale.toLowerCase().startsWith("zh")
      ? "收起"
      : "Collapse"
    : locale.toLowerCase().startsWith("zh")
      ? "展开"
      : "Expand";
  const Icon = expanded ? ChevronUp : ChevronDown;
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-label={`${label}${sectionName}`}
      onClick={onClick}
      className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
    >
      {label}
      <Icon className="size-3.5" aria-hidden />
    </button>
  );
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function booleanValue(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.trim().toLowerCase() === "true") return true;
    if (value.trim().toLowerCase() === "false") return false;
  }
  return fallback;
}

function fieldValue(field: TemplateField, values: RemediationTemplateValues) {
  return values.parameterOverrides[field.key] ?? field.defaultValue;
}

export function RemediationOrderParameterPanel({
  actionInput,
  disabled,
  item,
  onActionInputChange,
}: {
  actionInput: OrderActionInput;
  disabled: boolean;
  item: RemediationOrderItem;
  onActionInputChange: (input: OrderActionInput) => void;
}) {
  const locale = useLocale();
  const t = useTranslations("pages.collection.orchestration");
  const hostIdLabel = t("workspace.hostId");
  const selectedAction = useMemo(
    () => remediationOrderActionOption(item),
    [item],
  );
  const template = useMemo(
    () => remediationOrderDisplayTemplate(item, locale),
    [item, locale],
  );
  const [templateValues, setTemplateValues] =
    useState<RemediationTemplateValues>(() =>
      initialRemediationTemplateValues(asPreviewInput(actionInput), template),
    );
  const [targetInfoExpanded, setTargetInfoExpanded] = useState(true);
  const [parametersExpanded, setParametersExpanded] = useState(true);
  const showTemplateControls = shouldShowRemediationWorkspaceTemplateControls(
    selectedAction.action_code,
  );

  function updateTemplateValues(values: RemediationTemplateValues) {
    setTemplateValues(values);
    onActionInputChange(
      asOrderInput(
        buildRemediationTemplateInput({
          baseInput: asPreviewInput(actionInput),
          selectedAction,
          template,
          values,
        }),
      ),
    );
  }

  return (
    <div>
      <TargetSnapshotPanel
        expanded={targetInfoExpanded}
        item={item}
        onExpandedChange={setTargetInfoExpanded}
        snapshot={item.target_snapshot}
      />

      {targetInfoExpanded ? (
        <div className="mt-4 grid overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 sm:grid-cols-2">
          <div className="min-w-0 px-4 py-3">
            <div className="text-xs text-slate-400">{hostIdLabel}</div>
            <div
              className="mt-1 truncate font-mono text-xs font-semibold text-slate-700"
              title={item.agent_id}
            >
              {item.agent_id || "-"}
            </div>
          </div>
          <div className="min-w-0 border-t border-slate-200 px-4 py-3 sm:border-l sm:border-t-0">
            <div className="text-xs text-slate-400">
              {t("parameters.remediationAction")}
            </div>
            <div
              className="mt-1 truncate text-xs font-semibold text-blue-700"
              title={item.action_code}
            >
              {remediationOrderActionLabel(item, locale)}
            </div>
          </div>
        </div>
      ) : null}

      {showTemplateControls ? (
        <div className="mt-4">
          <WorkspaceTemplateControls
            actionInput={actionInput}
            disabled={disabled}
            onActionInputChange={onActionInputChange}
            onValuesChange={updateTemplateValues}
            parametersExpanded={parametersExpanded}
            onParametersExpandedChange={setParametersExpanded}
            selectedAction={selectedAction}
            template={template}
            values={templateValues}
          />
        </div>
      ) : null}
    </div>
  );
}

export function shouldShowRemediationWorkspaceTemplateControls(
  actionCode: string,
) {
  return actionCode.trim().toLowerCase() !== "file.restore";
}

function WorkspaceTemplateControls({
  actionInput,
  disabled,
  onActionInputChange,
  onValuesChange,
  onParametersExpandedChange,
  parametersExpanded,
  selectedAction,
  template,
  values,
}: {
  actionInput: OrderActionInput;
  disabled: boolean;
  onActionInputChange: (input: OrderActionInput) => void;
  onValuesChange: (values: RemediationTemplateValues) => void;
  onParametersExpandedChange: (expanded: boolean) => void;
  parametersExpanded: boolean;
  selectedAction: RemediationActionOption;
  template: RemediationPreviewTemplate;
  values: RemediationTemplateValues;
}) {
  const locale = useLocale();
  if (selectedAction.requires_history) {
    return null;
  }

  if (selectedAction.action_code.trim().toLowerCase() === "file_ea.delete") {
    return (
      <FileEAWorkspaceControls
        actionInput={actionInput}
        disabled={disabled}
        onActionInputChange={onActionInputChange}
        onParametersExpandedChange={onParametersExpandedChange}
        parametersExpanded={parametersExpanded}
      />
    );
  }

  if (template.id === "file-quarantine") {
    return (
      <FileQuarantineWorkspaceControls
        disabled={disabled}
        onValuesChange={onValuesChange}
        template={template}
        values={values}
      />
    );
  }

  if (template.isProcessTerminate) {
    const forceField = template.parameters.find(
      (field) => field.key === "force",
    );
    const forceChecked = forceField
      ? booleanValue(fieldValue(forceField, values), false)
      : false;
    return (
      <div>
        <div className="mb-2 text-xs font-semibold text-slate-700">
          {parameterText(locale, "processTermination")}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <BooleanParameterCard
            checked={booleanValue(
              values.parameterOverrides.include_self,
              true,
            )}
            description={parameterText(locale, "terminateTargetDescription")}
            disabled={disabled}
            label={parameterText(locale, "terminateTarget")}
            onCheckedChange={(checked) =>
              onValuesChange({
                ...values,
                parameterOverrides: {
                  ...values.parameterOverrides,
                  include_self: checked,
                },
              })
            }
          />
          <BooleanParameterCard
            checked={values.includeChildProcesses}
            description={parameterText(locale, "terminateChildrenDescription")}
            disabled={disabled}
            label={parameterText(locale, "terminateChildren")}
            onCheckedChange={(checked) =>
              onValuesChange({ ...values, includeChildProcesses: checked })
            }
          />
          {forceField ? (
            <BooleanParameterCard
              checked={forceChecked}
              description={parameterText(locale, "forceTerminateDescription")}
              disabled={disabled}
              label={forceField.label}
              onCheckedChange={(checked) =>
                onValuesChange({
                  ...values,
                  parameterOverrides: {
                    ...values.parameterOverrides,
                    [forceField.key]: checked,
                  },
                })
              }
            />
          ) : null}
        </div>
        {forceChecked ? (
          <div
            className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800"
            role="alert"
          >
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <span>{parameterText(locale, "forceTerminateRisk")}</span>
          </div>
        ) : null}
      </div>
    );
  }

  if (template.parameters.length === 0) {
    return null;
  }

  const parameterTitle =
    template.id === "process-block-execute"
      ? locale.toLowerCase().startsWith("zh")
        ? "阻断参数"
        : "Block Parameters"
      : locale.toLowerCase().startsWith("zh")
        ? `${template.title}参数`
        : `${template.title} Parameters`;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-700">
          {parameterTitle}
        </div>
        <SectionCollapseButton
          expanded={parametersExpanded}
          onClick={() => onParametersExpandedChange(!parametersExpanded)}
          sectionName={parameterTitle}
        />
      </div>
      {parametersExpanded ? (
        <div className="grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2">
          {template.parameters.map((field) => (
            <WorkspaceParameterField
              disabled={disabled}
              field={field}
              key={field.key}
              onChange={(value) =>
                onValuesChange({
                  ...values,
                  parameterOverrides: {
                    ...values.parameterOverrides,
                    [field.key]: value,
                  },
                })
              }
              value={fieldValue(field, values)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FileEAWorkspaceControls({
  actionInput,
  disabled,
  onActionInputChange,
  onParametersExpandedChange,
  parametersExpanded,
}: {
  actionInput: OrderActionInput;
  disabled: boolean;
  onActionInputChange: (input: OrderActionInput) => void;
  onParametersExpandedChange: (expanded: boolean) => void;
  parametersExpanded: boolean;
}) {
  const locale = useLocale();
  const parameterTitle = locale.toLowerCase().startsWith("zh")
    ? "删除文件 EA 参数"
    : "Delete File EA Parameters";
  const input = actionInput.file_ea ?? {};
  const mode = input.delete_all
    ? "all"
    : Array.isArray(input.ea_names)
      ? "named"
      : "";
  const [eaNamesText, setEANamesText] = useState(
    () => input.ea_names?.join("\n") ?? "",
  );
  const normalizedNames = normalizeFileEANames(eaNamesText);

  function updateFileEA(next: NonNullable<OrderActionInput["file_ea"]>) {
    onActionInputChange({ ...actionInput, file_ea: next });
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-700">
          {parameterTitle}
        </div>
        <SectionCollapseButton
          expanded={parametersExpanded}
          onClick={() => onParametersExpandedChange(!parametersExpanded)}
          sectionName={parameterTitle}
        />
      </div>

      {parametersExpanded ? (
        <div className="grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2">
          <label className="block min-w-0 bg-slate-50 px-4 py-2.5 sm:col-span-2">
            <span className="text-[11px] font-medium text-slate-400">
              {parameterText(locale, "deleteScope")}
            </span>
            <Select
              disabled={disabled}
              value={mode || undefined}
              onValueChange={(value) =>
                updateFileEA(
                  value === "all"
                    ? { force: Boolean(input.force), delete_all: true }
                    : {
                        force: Boolean(input.force),
                        ea_names: normalizedNames,
                      },
                )
              }
            >
              <SelectTrigger className="mt-1 h-9 rounded-lg border-slate-200 bg-white text-xs shadow-none focus:ring-teal-200">
                <SelectValue
                  placeholder={parameterText(locale, "selectDeleteScope")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="named" className="text-xs">
                  {parameterText(locale, "deleteNamedEa")}
                </SelectItem>
                <SelectItem value="all" className="text-xs">
                  {parameterText(locale, "deleteAllEa")}
                </SelectItem>
              </SelectContent>
            </Select>
          </label>

          {mode === "named" ? (
            <label className="block min-w-0 bg-slate-50 px-4 py-2.5 sm:col-span-2">
              <span className="text-[11px] font-medium text-slate-400">
                {parameterText(locale, "eaNames")}
              </span>
              <span className="ml-1 text-red-500">*</span>
              <Textarea
                aria-label={parameterText(locale, "eaNames")}
                disabled={disabled}
                value={eaNamesText}
                placeholder={parameterText(locale, "eaNamesPlaceholder")}
                onChange={(event) => setEANamesText(event.target.value)}
                onBlur={() =>
                  updateFileEA({
                    force: Boolean(input.force),
                    ea_names: normalizedNames,
                  })
                }
                className="mt-1 min-h-24 resize-y rounded-lg border-slate-200 bg-white font-mono text-xs shadow-none focus-visible:ring-2 focus-visible:ring-teal-100 focus-visible:ring-offset-0"
              />
              <span className="mt-2 block text-[11px] leading-4 text-slate-500">
                {parameterText(locale, "eaNamesHint")}
              </span>
            </label>
          ) : null}

          {mode === "all" ? (
            <div className="bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800 sm:col-span-2">
              {parameterText(locale, "deleteAllEaHint")}
            </div>
          ) : null}

          <div className="flex min-h-[66px] items-center justify-between gap-4 bg-slate-50 px-4 py-2.5 sm:col-span-2">
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-slate-500">
                {parameterText(locale, "forceDelete")}
              </div>
              <div className="mt-1 text-[11px] leading-4 text-slate-500">
                {parameterText(locale, "forceDeleteDescription")}
              </div>
            </div>
            <Switch
              aria-label={parameterText(locale, "forceDelete")}
              checked={Boolean(input.force)}
              disabled={disabled}
              onCheckedChange={(checked) =>
                updateFileEA({
                  force: checked,
                  ...(mode === "all"
                    ? { delete_all: true }
                    : { ea_names: normalizedNames }),
                })
              }
              className="data-[state=checked]:bg-teal-500"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FileQuarantineWorkspaceControls({
  disabled,
  onValuesChange,
  template,
  values,
}: {
  disabled: boolean;
  onValuesChange: (values: RemediationTemplateValues) => void;
  template: RemediationPreviewTemplate;
  values: RemediationTemplateValues;
}) {
  const locale = useLocale();
  const fields = Object.fromEntries(
    template.parameters.map((field) => [field.key, field]),
  ) as Record<string, TemplateField | undefined>;
  const deleteOriginal = fields.delete_original;
  const storage = fields.storage;
  const encrypt = fields.encrypt;
  const suffix = fields.suffix;
  const storageValue = storage
    ? stringValue(fieldValue(storage, values))
    : "local";

  function setField(field: TemplateField | undefined, value: unknown) {
    if (!field) return;
    onValuesChange({
      ...values,
      parameterOverrides: {
        ...values.parameterOverrides,
        [field.key]: value,
      },
    });
  }

  return (
    <div className="space-y-4">
      {deleteOriginal ? (
        <div>
          <div className="mb-2 text-xs font-semibold text-slate-700">
            {parameterText(locale, "quarantineBehavior")}
          </div>
          <BooleanParameterCard
            checked={booleanValue(
              fieldValue(deleteOriginal, values),
              Boolean(deleteOriginal.defaultValue),
            )}
            description={parameterText(locale, "deleteOriginalDescription")}
            disabled={disabled}
            label={parameterText(locale, "deleteOriginal")}
            onCheckedChange={(checked) => setField(deleteOriginal, checked)}
          />
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {storage ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-xs font-semibold text-slate-700">
              {parameterText(locale, "quarantineStorage")}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs">
              {[
                {
                  label: parameterText(locale, "localSecureStorage"),
                  value: "local",
                },
                {
                  label: parameterText(locale, "centralStorage"),
                  value: "central",
                },
              ].map((option) => {
                const selected = storageValue === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    disabled={disabled || !storage.editable}
                    onClick={() => setField(storage, option.value)}
                    className={cn(
                      "inline-flex min-h-8 items-center gap-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2",
                      selected ? "text-slate-700" : "text-slate-400",
                      storage.editable && !disabled
                        ? "cursor-pointer"
                        : "cursor-default",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4 items-center justify-center rounded-full border-2",
                        selected ? "border-teal-600" : "border-slate-300",
                      )}
                      aria-hidden
                    >
                      {selected ? (
                        <span className="size-1.5 rounded-full bg-teal-600" />
                      ) : null}
                    </span>
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {encrypt ? (
          <BooleanParameterCard
            checked={booleanValue(
              fieldValue(encrypt, values),
              Boolean(encrypt.defaultValue),
            )}
            description={parameterText(locale, "encryptPackageDescription")}
            disabled={disabled}
            label={parameterText(locale, "encryptPackage")}
            onCheckedChange={(checked) => setField(encrypt, checked)}
          />
        ) : null}
      </div>

      {suffix ? (
        <label className="block">
          <span className="text-xs font-semibold text-slate-700">
            {parameterText(locale, "quarantineSuffix")}
          </span>
          <Input
            value={stringValue(fieldValue(suffix, values))}
            disabled={disabled}
            readOnly={!suffix.editable}
            onChange={(event) => setField(suffix, event.target.value)}
            className="mt-2 h-11 rounded-xl border-slate-200 bg-white px-4 font-mono text-xs shadow-none focus-visible:ring-2 focus-visible:ring-teal-100 focus-visible:ring-offset-0 read-only:bg-white"
          />
        </label>
      ) : null}
    </div>
  );
}

function BooleanParameterCard({
  checked,
  description,
  disabled,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  description?: string;
  disabled: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex min-h-[62px] items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="min-w-0">
        <div className="text-xs font-semibold text-slate-700">{label}</div>
        {description ? (
          <div className="mt-1 text-[11px] leading-4 text-slate-500">
            {description}
          </div>
        ) : null}
      </div>
      <Switch
        aria-label={label}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        className="data-[state=checked]:bg-teal-500"
      />
    </div>
  );
}

function WorkspaceParameterField({
  disabled,
  field,
  onChange,
  value,
}: {
  disabled: boolean;
  field: TemplateField;
  onChange: (value: unknown) => void;
  value: unknown;
}) {
  if (field.kind === "boolean") {
    return (
      <div
        className={cn(
          "flex min-h-[66px] items-center justify-between gap-4 bg-slate-50 px-4 py-2.5",
          field.span === 2 && "sm:col-span-2",
        )}
      >
        <span className="text-[11px] font-medium text-slate-500">
          {field.label}
        </span>
        <Switch
          aria-label={field.label}
          checked={booleanValue(value, Boolean(field.defaultValue))}
          disabled={disabled}
          onCheckedChange={onChange}
          className="data-[state=checked]:bg-teal-500"
        />
      </div>
    );
  }

  if (field.kind === "select") {
    return (
      <label
        className={cn(
          "block min-w-0 bg-slate-50 px-4 py-2.5",
          field.span === 2 && "sm:col-span-2",
        )}
      >
        <span className="text-[11px] font-medium text-slate-400">
          {field.label}
        </span>
        <Select
          value={stringValue(value)}
          disabled={disabled}
          onValueChange={onChange}
        >
          <SelectTrigger className="mt-1 h-9 rounded-lg border-slate-200 bg-white text-xs shadow-none focus:ring-teal-200">
            <SelectValue placeholder={field.placeholder || field.label} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="text-xs"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
    );
  }

  const editable = field.kind === "password" || Boolean(field.editable);
  return (
    <label
      className={cn(
        "block min-w-0 bg-slate-50 px-4 py-2.5",
        field.span === 2 && "sm:col-span-2",
      )}
    >
      <span className="text-[11px] font-medium text-slate-400">
        {field.label}
        {field.required ? <span className="ml-1 text-red-500">*</span> : null}
      </span>
      <Input
        type={field.kind === "password" ? "password" : "text"}
        value={stringValue(value)}
        disabled={disabled}
        readOnly={!editable}
        placeholder={field.placeholder || field.label}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-9 rounded-lg border-slate-200 bg-white px-3 text-xs shadow-none focus-visible:ring-2 focus-visible:ring-teal-100 focus-visible:ring-offset-0 read-only:text-slate-500"
      />
    </label>
  );
}
