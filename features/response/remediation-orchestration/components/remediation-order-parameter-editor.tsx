"use client";

import { useMemo, useState } from "react";
import { History, ShieldCheck } from "lucide-react";

import type {
  RemediationActionDecision,
  RemediationActionInput as OrderActionInput,
  RemediationOrderItem,
  RemediationTargetSnapshot,
} from "@/features/attack/remediation-order";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui/input";
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

const RESTORE_ACTION_PATTERN = /(?:\.restore|\.enable|\.bypass(?:_execute)?)$/;

type TemplateField = RemediationPreviewTemplate["parameters"][number];

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

export function remediationOrderActionLabel(
  item: Pick<RemediationOrderItem, "action_code" | "entity_type">,
) {
  const action = remediationOrderActionOption(item);
  const template = getRemediationPreviewTemplate(action);
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
  reverseSourceItemId,
}: {
  actionInput: OrderActionInput;
  decision?: RemediationActionDecision | null;
  item: RemediationOrderItem;
  reverseSourceItemId: string;
}) {
  const action = remediationOrderActionOption(item);
  const template = getRemediationPreviewTemplate(action);
  const values = initialRemediationTemplateValues(
    asPreviewInput(actionInput),
    template,
  );
  const templateError = validateRemediationTemplateValues({
    selectedAction: action,
    template,
    values,
  });
  if (templateError) return templateError;

  const agentDecision = decisionForAgent(decision, item.agent_id);
  const missing = agentDecision?.required_input_fields.find((field) =>
    requiredFieldMissing(field, actionInput, reverseSourceItemId),
  );
  return missing ? `缺少必要参数：${missing}` : "";
}

function targetText(item: RemediationOrderItem) {
  return item.display_name.trim() || item.object_id.trim() || item.node_key.trim();
}

function targetName(item: RemediationOrderItem) {
  const value = targetText(item).replace(/[\\/]+$/, "");
  return value.split(/[\\/]/).filter(Boolean).pop() || value || "未命名目标";
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

function targetSnapshotRows(
  snapshot: RemediationTargetSnapshot,
): TargetSnapshotRow[] {
  const rows: Array<TargetSnapshotRow | null> = [];
  const add = (label: string, value: unknown, wide = false) => {
    const display = Array.isArray(value)
      ? value.map(stringValue).filter(Boolean).join("、")
      : stringValue(value).trim();
    rows.push(display ? { label, value: display, wide } : null);
  };

  if (snapshot.process) {
    add("进程名", snapshot.process.process_name);
    add("PID", snapshot.process.pid || "");
    add("进程路径", snapshot.process.process_path, true);
    add("进程 Hash", snapshot.process.process_hash, true);
    add("Process GUID", snapshot.process.process_guid, true);
    add("命令行", snapshot.process.command_line, true);
  } else if (snapshot.file) {
    add("文件完整路径", snapshot.file.file_path, true);
    add("文件 Hash", snapshot.file.file_hash || "暂无可信 Hash", true);
    add("文件类型", snapshot.file.file_type);
    add("签名状态", snapshot.file.signature);
    add("签名厂商", snapshot.file.signer);
    add("Stream Name", snapshot.file.stream_name, true);
    add("已观测 EA", snapshot.file.observed_ea_names, true);
  } else if (snapshot.scheduled_task) {
    add("任务名称", snapshot.scheduled_task.task_name);
    add("任务路径", snapshot.scheduled_task.task_path, true);
    add("Job ID", snapshot.scheduled_task.job_id, true);
    add("命令", snapshot.scheduled_task.command, true);
    add("二进制路径", snapshot.scheduled_task.binary_path, true);
    add("二进制 Hash", snapshot.scheduled_task.binary_hash, true);
    add("运行账号", snapshot.scheduled_task.run_as);
    add("当前状态", snapshot.scheduled_task.state);
  } else if (snapshot.service) {
    add("服务名", snapshot.service.service_name);
    add("显示名称", snapshot.service.display_name);
    add("二进制路径", snapshot.service.binary_path, true);
    add("二进制 Hash", snapshot.service.binary_hash, true);
    add("启动账号", snapshot.service.start_account);
    add("当前状态", snapshot.service.state);
  } else if (snapshot.account) {
    add("账号名称", snapshot.account.account_name);
    add("域", snapshot.account.domain);
    add("SID", snapshot.account.sid, true);
    if (snapshot.account.enabled !== undefined) {
      add("启用状态", snapshot.account.enabled ? "已启用" : "已禁用");
    }
    if (snapshot.account.locked !== undefined) {
      add("锁定状态", snapshot.account.locked ? "已锁定" : "未锁定");
    }
  } else if (snapshot.registry) {
    add("Hive", snapshot.registry.hive);
    add("Key Path", snapshot.registry.key_path, true);
    add("Value Name", snapshot.registry.value_name);
    if (snapshot.registry.present !== undefined) {
      add("存在状态", snapshot.registry.present ? "存在" : "不存在");
    }
  } else if (snapshot.wmi_class) {
    add("Namespace", snapshot.wmi_class.namespace);
    add("Class Name", snapshot.wmi_class.class_name);
    add("Class Path", snapshot.wmi_class.class_path, true);
    add("Server", snapshot.wmi_class.server_name);
  } else if (snapshot.wmi_subscription) {
    add("Namespace", snapshot.wmi_subscription.namespace);
    add("Filter", snapshot.wmi_subscription.filter_name);
    add("Consumer", snapshot.wmi_subscription.consumer_name);
    add("Consumer Type", snapshot.wmi_subscription.consumer_type, true);
    add("Filter 绑定数", snapshot.wmi_subscription.filter_binding_count || "");
    add(
      "Consumer 绑定数",
      snapshot.wmi_subscription.consumer_binding_count || "",
    );
  } else if (snapshot.bits_job) {
    add("Job ID", snapshot.bits_job.job_id, true);
    add("Job Name", snapshot.bits_job.job_name);
    add("Job Type", snapshot.bits_job.job_type);
    add("Job Status", snapshot.bits_job.job_status);
    add("Remote URL", snapshot.bits_job.remote_url, true);
    add("Local Files", snapshot.bits_job.local_files, true);
  } else if (snapshot.network) {
    add("目标 IP", snapshot.network.ip);
    add("目标端口", snapshot.network.port || "");
    add("协议", snapshot.network.protocol);
    add("域名", snapshot.network.domain, true);
    add("URL", snapshot.network.url, true);
  }

  return rows.filter(Boolean) as TargetSnapshotRow[];
}

function TargetSnapshotPanel({
  item,
  snapshot,
}: {
  item: RemediationOrderItem;
  snapshot: RemediationTargetSnapshot | null;
}) {
  const snapshotAvailable = snapshot?.status === "available";
  const snapshotRows = snapshotAvailable ? targetSnapshotRows(snapshot) : [];
  const fallbackRows: TargetSnapshotRow[] = [
    { label: "目标名称", value: targetName(item) },
    { label: "对象类型", value: entityLabel(item) },
    ...(item.node_key.trim()
      ? [{ label: "节点标识", value: item.node_key.trim(), wide: true }]
      : []),
  ];
  const rows = snapshotRows.length > 0 ? snapshotRows : fallbackRows;
  const sourceLabel =
    snapshot?.source === "graph_current"
      ? "Graph 当前证据"
      : snapshot?.source === "prepared_frozen"
        ? "Prepare 已冻结"
        : snapshot?.source === "history_frozen"
          ? "历史冻结"
          : snapshotAvailable
            ? "目标证据"
            : "等待解析";
  const unavailableMessage = !snapshot
    ? "当前接口未返回目标快照，PID、路径、Hash 等可信证据等待后台解析。"
    : snapshot.status !== "available"
      ? snapshot.reason_message ||
        snapshot.reason_code ||
        "后台暂未返回可信目标证据。"
      : snapshotRows.length === 0
        ? "目标快照已返回，但未包含当前对象可展示的证据字段。"
        : "";

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-700">目标信息</div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium",
            snapshotAvailable && snapshotRows.length > 0
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700",
          )}
        >
          {sourceLabel}
        </span>
      </div>
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
    </div>
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

function historyParameterText(actionCode: string) {
  const normalized = actionCode.trim().toLowerCase();
  if (normalized.includes("bypass")) return "使用原处置参数中的 Policy ID 放行依据";
  if (normalized.includes("enable")) return "使用原处置参数中的启用依据";
  return "使用原处置参数中的恢复依据";
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
  const selectedAction = useMemo(
    () => remediationOrderActionOption(item),
    [item.action_code, item.entity_type],
  );
  const template = useMemo(
    () => getRemediationPreviewTemplate(selectedAction),
    [selectedAction],
  );
  const [templateValues, setTemplateValues] =
    useState<RemediationTemplateValues>(() =>
      initialRemediationTemplateValues(asPreviewInput(actionInput), template),
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
      <div className="text-xs text-slate-400">当前目标</div>
      <div className="mt-1 flex min-w-0 items-center gap-3">
        <h3
          className="truncate text-base font-semibold text-slate-950"
          title={targetText(item)}
        >
          {targetName(item)}
        </h3>
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-500">
          {entityLabel(item)}
        </span>
      </div>
      <div
        className="mt-1 truncate font-mono text-xs text-slate-500"
        title={targetText(item)}
      >
        {targetText(item)}
      </div>

      <TargetSnapshotPanel item={item} snapshot={item.target_snapshot} />

      <div className="mt-4 grid overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 sm:grid-cols-2">
        <div className="min-w-0 px-4 py-3">
          <div className="text-xs text-slate-400">执行 Agent</div>
          <div
            className="mt-1 truncate font-mono text-xs font-semibold text-slate-700"
            title={item.agent_id}
          >
            {item.agent_id || "-"}
          </div>
        </div>
        <div className="min-w-0 border-t border-slate-200 px-4 py-3 sm:border-l sm:border-t-0">
          <div className="text-xs text-slate-400">处置动作</div>
          <div
            className="mt-1 truncate text-xs font-semibold text-blue-700"
            title={item.action_code}
          >
            {remediationOrderActionLabel(item)}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-blue-600" aria-hidden />
        <div>
          <div className="text-xs font-semibold">参数由处置页面补充</div>
          <div className="mt-1 text-xs leading-5 text-blue-600">
            Agent 和 Action 来自 ControlPanel 的权威选择，此处不重新推断。
          </div>
        </div>
      </div>

      <div className="mt-4">
        <WorkspaceTemplateControls
          disabled={disabled}
          onValuesChange={updateTemplateValues}
          selectedAction={selectedAction}
          template={template}
          values={templateValues}
        />
      </div>
    </div>
  );
}

function WorkspaceTemplateControls({
  disabled,
  onValuesChange,
  selectedAction,
  template,
  values,
}: {
  disabled: boolean;
  onValuesChange: (values: RemediationTemplateValues) => void;
  selectedAction: RemediationActionOption;
  template: RemediationPreviewTemplate;
  values: RemediationTemplateValues;
}) {
  if (selectedAction.requires_history) {
    return (
      <div className="flex min-h-24 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
          <History className="size-4" aria-hidden />
        </span>
        <div>
          <div className="text-xs font-semibold text-slate-700">无需填写动作参数</div>
          <div className="mt-1 text-xs leading-5 text-slate-500">
            {historyParameterText(selectedAction.action_code)}
          </div>
        </div>
      </div>
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
    const forceField = template.parameters.find((field) => field.key === "force");
    return (
      <div>
        <div className="mb-2 text-xs font-semibold text-slate-700">进程结束行为</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <BooleanParameterCard
            checked={values.includeChildProcesses}
            description="结束目标进程时一并结束其子进程"
            disabled={disabled}
            label="终止子进程"
            onCheckedChange={(checked) =>
              onValuesChange({ ...values, includeChildProcesses: checked })
            }
          />
          {forceField ? (
            <BooleanParameterCard
              checked={booleanValue(fieldValue(forceField, values), false)}
              description="使用强制方式结束目标进程"
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
      </div>
    );
  }

  if (template.parameters.length === 0) {
    return (
      <div className="flex min-h-20 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-500">
        使用原处置参数中的默认配置
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 text-xs font-semibold text-slate-700">{template.title}参数</div>
      <div className="grid gap-3 sm:grid-cols-2">
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
  const fields = Object.fromEntries(
    template.parameters.map((field) => [field.key, field]),
  ) as Record<string, TemplateField | undefined>;
  const deleteOriginal = fields.delete_original;
  const storage = fields.storage;
  const encrypt = fields.encrypt;
  const suffix = fields.suffix;
  const storageValue = storage ? stringValue(fieldValue(storage, values)) : "local";

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
          <div className="mb-2 text-xs font-semibold text-slate-700">隔离行为</div>
          <BooleanParameterCard
            checked={booleanValue(
              fieldValue(deleteOriginal, values),
              Boolean(deleteOriginal.defaultValue),
            )}
            description="默认开启；隔离失败时不会删除原文件"
            disabled={disabled}
            label="隔离成功后删除原文件"
            onCheckedChange={(checked) => setField(deleteOriginal, checked)}
          />
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {storage ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-xs font-semibold text-slate-700">隔离存储</div>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs">
              {[
                { label: "本地安全区", value: "local" },
                { label: "中心存储", value: "central" },
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
                      storage.editable && !disabled ? "cursor-pointer" : "cursor-default",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4 items-center justify-center rounded-full border-2",
                        selected ? "border-teal-600" : "border-slate-300",
                      )}
                      aria-hidden
                    >
                      {selected ? <span className="size-1.5 rounded-full bg-teal-600" /> : null}
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
            description="使用 Agent 安全密钥加密"
            disabled={disabled}
            label="隔离包加密"
            onCheckedChange={(checked) => setField(encrypt, checked)}
          />
        ) : null}
      </div>

      {suffix ? (
        <label className="block">
          <span className="text-xs font-semibold text-slate-700">隔离文件后缀</span>
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
          <div className="mt-1 text-[11px] leading-4 text-slate-500">{description}</div>
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
      <div className={field.span === 2 ? "sm:col-span-2" : ""}>
        <BooleanParameterCard
          checked={booleanValue(value, Boolean(field.defaultValue))}
          disabled={disabled}
          label={field.label}
          onCheckedChange={onChange}
        />
      </div>
    );
  }

  if (field.kind === "select") {
    return (
      <label
        className={cn(
          "block rounded-2xl border border-slate-200 bg-white px-4 py-3",
          field.span === 2 && "sm:col-span-2",
        )}
      >
        <span className="text-xs font-semibold text-slate-700">{field.label}</span>
        <Select
          value={stringValue(value)}
          disabled={disabled}
          onValueChange={onChange}
        >
          <SelectTrigger className="mt-2 h-10 rounded-xl border-slate-200 bg-slate-50 text-xs shadow-none focus:ring-teal-200">
            <SelectValue placeholder={field.placeholder || field.label} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-xs">
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
        "block rounded-2xl border border-slate-200 bg-white px-4 py-3",
        field.span === 2 && "sm:col-span-2",
      )}
    >
      <span className="text-xs font-semibold text-slate-700">
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
        className="mt-2 h-10 rounded-xl border-slate-200 bg-slate-50 px-3 text-xs shadow-none focus-visible:ring-2 focus-visible:ring-teal-100 focus-visible:ring-offset-0 read-only:text-slate-500"
      />
    </label>
  );
}
