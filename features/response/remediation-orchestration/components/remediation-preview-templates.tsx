"use client";

import { Checkbox } from "@/shared/ui/checkbox";
import { cn } from "@/shared/lib/utils";

import type {
  RemediationActionInput,
  RemediationActionOption,
  RemediationTargetSnapshot,
} from "../types";

type InputBranch = keyof RemediationActionInput;
type SnapshotBranch = keyof RemediationTargetSnapshot;
type ParameterKind = "boolean" | "text";

export interface RemediationTemplateValues {
  includeChildProcesses: boolean;
}

interface TemplateParameter {
  key: string;
  label: string;
  kind: ParameterKind;
  defaultValue?: string | number | boolean;
}

export interface RemediationPreviewTemplate {
  id: string;
  title: string;
  actionCodes: string[];
  inputBranch: InputBranch;
  snapshotBranch: SnapshotBranch;
  parameters: TemplateParameter[];
  isProcessTerminate?: boolean;
}

export const REMEDIATION_PREVIEW_TEMPLATES: RemediationPreviewTemplate[] = [
  {
    id: "process-terminate",
    title: "结束进程",
    actionCodes: ["process.terminate", "process.force_terminate"],
    inputBranch: "process_terminate",
    snapshotBranch: "process",
    isProcessTerminate: true,
    parameters: [
      { key: "include_children", label: "终止子进程", kind: "boolean", defaultValue: true },
    ],
  },
  {
    id: "file-quarantine",
    title: "隔离文件",
    actionCodes: ["file.quarantine"],
    inputBranch: "file_quarantine",
    snapshotBranch: "file",
    parameters: [
      { key: "delete_original", label: "删除原文件", kind: "boolean", defaultValue: true },
      { key: "encrypt", label: "加密隔离", kind: "boolean", defaultValue: true },
      { key: "storage", label: "存储位置", kind: "text", defaultValue: "local" },
      { key: "suffix", label: "隔离后缀", kind: "text", defaultValue: "qtn" },
    ],
  },
  {
    id: "scheduled-task-delete",
    title: "删除计划任务",
    actionCodes: ["scheduled_job.delete", "task.delete", "scheduled_task.delete"],
    inputBranch: "scheduled_task",
    snapshotBranch: "scheduled_task",
    parameters: [{ key: "force", label: "强制删除", kind: "boolean", defaultValue: true }],
  },
  {
    id: "service-delete",
    title: "删除服务",
    actionCodes: ["service.delete"],
    inputBranch: "service",
    snapshotBranch: "service",
    parameters: [
      { key: "stop_before_delete", label: "先停止服务", kind: "boolean", defaultValue: true },
    ],
  },
  {
    id: "account-disable",
    title: "禁用账号",
    actionCodes: ["account.disable"],
    inputBranch: "account",
    snapshotBranch: "account",
    parameters: [{ key: "force_logoff", label: "强制注销会话", kind: "boolean", defaultValue: true }],
  },
  {
    id: "registry-delete",
    title: "删除注册表",
    actionCodes: ["registry.delete_key", "registry.delete_value"],
    inputBranch: "registry",
    snapshotBranch: "registry",
    parameters: [
      { key: "recursive", label: "递归删除", kind: "boolean", defaultValue: true },
      { key: "stop_on_failure", label: "失败即停止", kind: "boolean", defaultValue: true },
    ],
  },
  {
    id: "wmi-class-delete",
    title: "删除 WMI Class",
    actionCodes: ["wmi_class.delete"],
    inputBranch: "wmi_class",
    snapshotBranch: "wmi_class",
    parameters: [
      { key: "delete_instances", label: "删除实例", kind: "boolean", defaultValue: true },
      { key: "recursive_delete", label: "递归删除", kind: "boolean", defaultValue: false },
    ],
  },
  {
    id: "wmi-subscription-delete",
    title: "删除 WMI 订阅",
    actionCodes: ["wmi_subscription.delete"],
    inputBranch: "wmi_subscription",
    snapshotBranch: "wmi_subscription",
    parameters: [
      { key: "remove_binding_only", label: "仅删除绑定", kind: "boolean", defaultValue: false },
    ],
  },
  {
    id: "bits-job-delete",
    title: "删除 BITS Job",
    actionCodes: ["bits.delete", "bits_job.delete"],
    inputBranch: "bits_job",
    snapshotBranch: "bits_job",
    parameters: [{ key: "force", label: "强制删除", kind: "boolean", defaultValue: true }],
  },
  {
    id: "file-ea-delete",
    title: "删除文件 EA",
    actionCodes: ["file_ea.delete"],
    inputBranch: "file_ea",
    snapshotBranch: "file",
    parameters: [{ key: "force", label: "强制删除", kind: "boolean", defaultValue: true }],
  },
  {
    id: "ntfs-ads-delete",
    title: "删除 NTFS ADS",
    actionCodes: ["ntfs_ads.delete"],
    inputBranch: "ntfs_ads",
    snapshotBranch: "file",
    parameters: [{ key: "force", label: "强制删除", kind: "boolean", defaultValue: true }],
  },
  {
    id: "process-block-execute",
    title: "进程执行阻断",
    actionCodes: ["process.block_execute", "process.block"],
    inputBranch: "process_block",
    snapshotBranch: "process",
    parameters: [
      { key: "object_path", label: "阻断路径", kind: "text" },
      { key: "object_hash", label: "阻断 Hash", kind: "text" },
      { key: "audit", label: "开启审计", kind: "boolean", defaultValue: true },
    ],
  },
  {
    id: "network-block",
    title: "网络阻断",
    actionCodes: ["net.block", "network.block"],
    inputBranch: "net_block",
    snapshotBranch: "network",
    parameters: [{ key: "direction", label: "阻断方向", kind: "text", defaultValue: "out" }],
  },
];

const FALLBACK_TEMPLATE: RemediationPreviewTemplate = {
  id: "generic",
  title: "处置动作",
  actionCodes: [],
  inputBranch: "process_terminate",
  snapshotBranch: "process",
  parameters: [],
};

export function getRemediationPreviewTemplate(
  action: RemediationActionOption | null | undefined,
) {
  const actionCode = normalizeActionCode(action?.action_code);
  if (!actionCode) return FALLBACK_TEMPLATE;

  return (
    REMEDIATION_PREVIEW_TEMPLATES.find((template) =>
      template.actionCodes.some((code) => actionCode === normalizeActionCode(code)),
    ) ??
    REMEDIATION_PREVIEW_TEMPLATES.find((template) =>
      template.actionCodes.some((code) => actionCode.startsWith(normalizeActionCode(code))),
    ) ??
    templateByActionFamily(actionCode) ??
    FALLBACK_TEMPLATE
  );
}

export function initialRemediationTemplateValues(
  input: RemediationActionInput | undefined,
): RemediationTemplateValues {
  return {
    includeChildProcesses: boolValue(
      objectValue(input?.process_terminate).include_children,
      true,
    ),
  };
}

export function buildRemediationTemplateInput({
  baseInput,
  selectedAction,
  template,
  values,
}: {
  baseInput: RemediationActionInput | undefined;
  selectedAction: RemediationActionOption | null | undefined;
  template: RemediationPreviewTemplate;
  values: RemediationTemplateValues;
}): RemediationActionInput | undefined {
  if (!selectedAction || selectedAction.requires_history) return undefined;
  if (!template.isProcessTerminate) return baseInput;

  return {
    ...baseInput,
    process_terminate: {
      ...objectValue(baseInput?.process_terminate),
      include_self: true,
      include_children: values.includeChildProcesses,
    },
  };
}

export function remediationTemplateActionDisplayName(
  action: RemediationActionOption | null | undefined,
  template: RemediationPreviewTemplate,
  fallback: string,
) {
  if (!action) return fallback;
  if (template.id !== "generic") return template.title;
  return action.display_name || fallback;
}

export function remediationTemplateSnapshotBranch(
  action: RemediationActionOption | null | undefined,
  template: RemediationPreviewTemplate,
): SnapshotBranch | undefined {
  if (template.id !== "generic") return template.snapshotBranch;

  const kind = String(action?.required_snapshot_kind ?? "").toLowerCase();
  if (kind.includes("process")) return "process";
  if (kind.includes("file")) return "file";
  if (kind.includes("scheduled")) return "scheduled_task";
  if (kind.includes("service")) return "service";
  if (kind.includes("account")) return "account";
  if (kind.includes("registry")) return "registry";
  if (kind.includes("wmi_subscription")) return "wmi_subscription";
  if (kind.includes("wmi_class")) return "wmi_class";
  if (kind.includes("bits")) return "bits_job";
  if (kind.includes("network")) return "network";
  return undefined;
}

export function RemediationTemplateParameterControls({
  actionInput,
  disabled,
  onValuesChange,
  selectedAction,
  template,
  values,
}: {
  actionInput: RemediationActionInput | undefined;
  disabled: boolean;
  onValuesChange: (values: RemediationTemplateValues) => void;
  selectedAction: RemediationActionOption | null | undefined;
  template: RemediationPreviewTemplate;
  values: RemediationTemplateValues;
}) {
  if (!selectedAction) {
    return <span className="text-xs text-slate-400">未选择动作</span>;
  }
  if (selectedAction.requires_history) {
    return <span className="text-xs text-slate-600">使用后台返回的历史上下文</span>;
  }
  if (template.isProcessTerminate) {
    return (
      <label
        className={cn(
          "inline-flex min-h-8 cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 text-xs text-slate-700 transition-colors hover:bg-slate-50",
          disabled ? "cursor-not-allowed opacity-60" : "",
        )}
      >
        <Checkbox
          checked={values.includeChildProcesses}
          disabled={disabled}
          onCheckedChange={(checked) =>
            onValuesChange({
              ...values,
              includeChildProcesses: checked === true,
            })
          }
          className="size-4 rounded border-slate-300 data-[state=checked]:border-slate-950 data-[state=checked]:bg-slate-950"
        />
        <span className="font-medium leading-none">终止子进程</span>
      </label>
    );
  }

  const fields = parameterValues(template, actionInput);
  if (fields.length === 0) {
    return <span className="text-xs text-slate-500">使用默认参数</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {fields.map((item) => (
        <span
          key={item.label}
          className="inline-flex h-7 items-center rounded-full bg-slate-100 px-2.5 text-[11px] font-medium text-slate-600"
          title={`${item.label}: ${item.value}`}
        >
          {item.label}: {item.value}
        </span>
      ))}
    </div>
  );
}

function parameterValues(
  template: RemediationPreviewTemplate,
  input: RemediationActionInput | undefined,
) {
  const record = objectValue(input?.[template.inputBranch]);
  return template.parameters
    .map((field) => {
      const rawValue =
        record[field.key] === undefined ? field.defaultValue : record[field.key];
      const value =
        field.kind === "boolean"
          ? boolValue(rawValue, Boolean(field.defaultValue))
            ? "是"
            : "否"
          : shortValue(stringValue(rawValue));
      return { label: field.label, value };
    })
    .filter((item) => item.value !== "");
}

function templateByActionFamily(actionCode: string) {
  if (actionCode.startsWith("file.")) {
    return REMEDIATION_PREVIEW_TEMPLATES.find((item) => item.id === "file-quarantine");
  }
  if (actionCode.startsWith("task.") || actionCode.startsWith("scheduled")) {
    return REMEDIATION_PREVIEW_TEMPLATES.find((item) => item.id === "scheduled-task-delete");
  }
  if (actionCode.startsWith("service.")) {
    return REMEDIATION_PREVIEW_TEMPLATES.find((item) => item.id === "service-delete");
  }
  if (actionCode.startsWith("account.")) {
    return REMEDIATION_PREVIEW_TEMPLATES.find((item) => item.id === "account-disable");
  }
  if (actionCode.startsWith("registry.")) {
    return REMEDIATION_PREVIEW_TEMPLATES.find((item) => item.id === "registry-delete");
  }
  if (actionCode.startsWith("wmi_class.")) {
    return REMEDIATION_PREVIEW_TEMPLATES.find((item) => item.id === "wmi-class-delete");
  }
  if (actionCode.startsWith("wmi_subscription.")) {
    return REMEDIATION_PREVIEW_TEMPLATES.find((item) => item.id === "wmi-subscription-delete");
  }
  if (actionCode.startsWith("bits.")) {
    return REMEDIATION_PREVIEW_TEMPLATES.find((item) => item.id === "bits-job-delete");
  }
  if (actionCode.startsWith("file_ea.")) {
    return REMEDIATION_PREVIEW_TEMPLATES.find((item) => item.id === "file-ea-delete");
  }
  if (actionCode.startsWith("ntfs_ads.")) {
    return REMEDIATION_PREVIEW_TEMPLATES.find((item) => item.id === "ntfs-ads-delete");
  }
  if (actionCode.startsWith("process.")) {
    return REMEDIATION_PREVIEW_TEMPLATES.find((item) => item.id === "process-block-execute");
  }
  if (actionCode.startsWith("net.")) {
    return REMEDIATION_PREVIEW_TEMPLATES.find((item) => item.id === "network-block");
  }
  return undefined;
}

function normalizeActionCode(actionCode: string | undefined) {
  return String(actionCode ?? "").trim().toLowerCase();
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function boolValue(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return fallback;
}

function shortValue(value: string) {
  const normalized = value.trim();
  if (!normalized) return "";
  if (normalized.length <= 18) return normalized;
  return `${normalized.slice(0, 12)}...${normalized.slice(-4)}`;
}
