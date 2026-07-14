"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, DatabaseBackup } from "lucide-react";

import type {
  RemediationActionDecision,
  RemediationActionInput as OrderActionInput,
  RemediationOrderItem,
} from "@/features/attack/remediation-order";
import { cn } from "@/shared/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import type {
  RemediationActionInput as PreviewActionInput,
  RemediationActionOption,
} from "../types";
import {
  RemediationTemplateParameterControls,
  buildRemediationTemplateInput,
  getRemediationPreviewTemplate,
  initialRemediationTemplateValues,
  remediationTemplateActionDisplayName,
  validateRemediationTemplateValues,
  type RemediationTemplateValues,
} from "./remediation-preview-templates";

const RESTORE_ACTION_PATTERN = /(?:\.restore|\.enable|\.bypass(?:_execute)?)$/;

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

  const actionCode = item.action_code.trim().toLowerCase();
  if (actionCode === "file_ea.delete") {
    const fileEA = actionInput.file_ea;
    if (!fileEA?.delete_all && !fileEA?.ea_names?.length) {
      return "请选择删除全部 EA，或至少填写一个 EA 名称。";
    }
  }
  if (
    actionCode === "wmi_subscription.delete" &&
    !actionInput.wmi_subscription?.target_candidate_id?.trim()
  ) {
    return "请选择具体的 WMI Filter–Binding–Consumer 候选关系。";
  }
  if (
    remediationOrderActionRequiresHistory(actionCode) &&
    !reverseSourceItemId.trim()
  ) {
    return "请选择权威的历史处置或备份来源。";
  }

  const agentDecision = decisionForAgent(decision, item.agent_id);
  const missing = agentDecision?.required_input_fields.find((field) =>
    requiredFieldMissing(field, actionInput, reverseSourceItemId),
  );
  return missing ? `缺少必要参数：${missing}` : "";
}

export function RemediationOrderParameterEditor({
  actionInput,
  decision,
  disabled,
  item,
  onActionInputChange,
  onReverseSourceItemIdChange,
  reverseSourceItemId,
}: {
  actionInput: OrderActionInput;
  decision?: RemediationActionDecision | null;
  disabled: boolean;
  item: RemediationOrderItem;
  onActionInputChange: (input: OrderActionInput) => void;
  onReverseSourceItemIdChange: (sourceItemId: string) => void;
  reverseSourceItemId: string;
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
  const agentDecision = decisionForAgent(decision, item.agent_id);
  const targetCandidates = agentDecision?.target_candidates ?? [];
  const reverseContexts = agentDecision?.reverse_contexts ?? [];
  const actionCode = item.action_code.trim().toLowerCase();

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
    <div className="space-y-4">
      <div>
        <div className="mb-2 text-xs font-semibold text-slate-600">
          {template.title}参数
        </div>
        <RemediationTemplateParameterControls
          actionInput={asPreviewInput(actionInput)}
          disabled={disabled}
          onValuesChange={updateTemplateValues}
          selectedAction={selectedAction}
          template={template}
          values={templateValues}
        />
      </div>

      {actionCode === "file_ea.delete" ? (
        <FileEAControls
          disabled={disabled}
          input={actionInput}
          onChange={onActionInputChange}
        />
      ) : null}

      {actionCode === "wmi_subscription.delete" ? (
        <WmiTargetControls
          candidates={targetCandidates}
          disabled={disabled}
          input={actionInput}
          onChange={onActionInputChange}
        />
      ) : null}

      {remediationOrderActionRequiresHistory(actionCode) ? (
        <ReverseSourceControls
          contexts={reverseContexts}
          disabled={disabled}
          onChange={onReverseSourceItemIdChange}
          value={reverseSourceItemId}
        />
      ) : null}
    </div>
  );
}

function FileEAControls({
  disabled,
  input,
  onChange,
}: {
  disabled: boolean;
  input: OrderActionInput;
  onChange: (input: OrderActionInput) => void;
}) {
  const current = input.file_ea ?? {};
  const mode = current.delete_all ? "all" : "named";
  const names = current.ea_names?.join("\n") ?? "";

  return (
    <section className="rounded-2xl border border-slate-200 p-3.5">
      <div className="text-xs font-semibold text-slate-700">EA 删除范围</div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[
          { label: "按名称删除", value: "named" },
          { label: "删除全部 EA", value: "all" },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() =>
              onChange({
                ...input,
                file_ea:
                  option.value === "all"
                    ? { ...(current.force ? { force: true } : {}), delete_all: true }
                    : {
                        ...(current.force ? { force: true } : {}),
                        ...(current.ea_names?.length
                          ? { ea_names: current.ea_names }
                          : {}),
                      },
              })
            }
            className={cn(
              "min-h-10 rounded-xl border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              mode === option.value
                ? "border-teal-500 bg-teal-50 text-teal-800"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      {mode === "named" ? (
        <label className="mt-3 block">
          <span className="text-xs font-medium text-slate-600">EA 名称</span>
          <textarea
            value={names}
            disabled={disabled}
            onChange={(event) => {
              const values = Array.from(
                new Set(
                  event.target.value
                    .split(/[\n,]/)
                    .map((value) => value.trim())
                    .filter(Boolean),
                ),
              );
              onChange({
                ...input,
                file_ea: {
                  ...(current.force ? { force: true } : {}),
                  ...(values.length ? { ea_names: values } : {}),
                },
              });
            }}
            placeholder="每行填写一个 EA 名称"
            className="mt-2 min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-700 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </label>
      ) : (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          删除全部 EA 属于显式高风险选择，Prepare 时仍会重新校验目标状态。
        </div>
      )}
    </section>
  );
}

function WmiTargetControls({
  candidates,
  disabled,
  input,
  onChange,
}: {
  candidates: NonNullable<
    ReturnType<typeof decisionForAgent>
  >["target_candidates"];
  disabled: boolean;
  input: OrderActionInput;
  onChange: (input: OrderActionInput) => void;
}) {
  const current = input.wmi_subscription ?? {};

  return (
    <section className="rounded-2xl border border-slate-200 p-3.5">
      <div className="text-xs font-semibold text-slate-700">
        Filter–Binding–Consumer 目标
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        仅允许选择 Graph 返回的权威候选，不支持手工输入原始标识。
      </p>
      <Select
        disabled={disabled || candidates.length === 0}
        value={current.target_candidate_id ?? ""}
        onValueChange={(value) =>
          onChange({
            ...input,
            wmi_subscription: {
              ...current,
              target_candidate_id: value,
            },
          })
        }
      >
        <SelectTrigger className="mt-3 h-10 rounded-xl border-slate-200 text-xs">
          <SelectValue
            placeholder={
              candidates.length ? "请选择权威候选关系" : "暂无可用候选关系"
            }
          />
        </SelectTrigger>
        <SelectContent>
          {candidates.map((candidate) => (
            <SelectItem
              key={candidate.candidate_id}
              value={candidate.candidate_id}
              className="text-xs"
            >
              {candidate.display_name || candidate.candidate_id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </section>
  );
}

function ReverseSourceControls({
  contexts,
  disabled,
  onChange,
  value,
}: {
  contexts: NonNullable<
    ReturnType<typeof decisionForAgent>
  >["reverse_contexts"];
  disabled: boolean;
  onChange: (sourceItemId: string) => void;
  value: string;
}) {
  const options = contexts.length
    ? contexts
    : value
      ? [{ source_item_id: value, source_action_code: "" }]
      : [];

  return (
    <section className="rounded-2xl border border-slate-200 p-3.5">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
        <DatabaseBackup className="size-4 text-teal-600" aria-hidden />
        恢复依据
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        恢复动作必须绑定后端返回的有效历史处置或备份来源。
      </p>
      <Select disabled={disabled || options.length === 0} value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-3 h-10 rounded-xl border-slate-200 text-xs">
          <SelectValue
            placeholder={options.length ? "请选择恢复来源" : "暂无有效恢复来源"}
          />
        </SelectTrigger>
        <SelectContent>
          {options.map((context) => (
            <SelectItem
              key={context.source_item_id}
              value={context.source_item_id}
              className="text-xs"
            >
              {context.source_action_code
                ? `${context.source_action_code} · ${context.source_item_id}`
                : context.source_item_id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value ? (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700">
          <Check className="size-3.5" aria-hidden />
          已选择恢复来源
        </div>
      ) : null}
    </section>
  );
}
