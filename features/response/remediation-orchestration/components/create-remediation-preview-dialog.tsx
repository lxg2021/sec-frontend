"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Cpu,
  GitBranch,
  History,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { ScrollArea } from "@/shared/ui/scroll-area";

import {
  createRemediationPreview as defaultCreateRemediationPreview,
  getRemediationPreviewDetail as defaultGetRemediationPreviewDetail,
} from "../api";
import {
  RemediationTemplateParameterControls,
  buildRemediationTemplateInput,
  getRemediationPreviewTemplate,
  initialRemediationTemplateValues,
  remediationTemplateActionDisplayName,
  remediationTemplateSnapshotBranch,
  validateRemediationTemplateValues,
  type RemediationPreviewTemplate,
  type RemediationTemplateValues,
} from "./remediation-preview-templates";
import type {
  RemediationActionContext,
  RemediationActionInput,
  RemediationActionOption,
  RemediationCandidateNode,
  RemediationPreviewDetail,
  RemediationPreviewSnapshot,
  RemediationPreviewTargetAgent,
  RemediationPreviewTargetInput,
  RemediationTargetSnapshot,
  ResolveRemediationNodeAgentsResponse,
} from "../types";

interface PreparedWorkflowContext {
  case_id?: string;
  workflow_id?: string;
  workflow_action_id?: string;
}

interface CreateRemediationPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId?: string;
  caseId?: string;
  workflowId?: string;
  workflowActionId?: string;
  sourceType?: string;
  scopeType?: string;
  scopeId?: string;
  selectedNode: RemediationCandidateNode | null | undefined;
  selectedAction: RemediationActionOption | null | undefined;
  agentResolve?: ResolveRemediationNodeAgentsResponse | null;
  expireSeconds?: number;
  prepareWorkflowContext?: () => Promise<PreparedWorkflowContext | null>;
  buildActionInput?: (
    actionCode: string,
    node: RemediationCandidateNode,
    action: RemediationActionOption,
  ) => RemediationActionInput | undefined;
  createPreview?: typeof defaultCreateRemediationPreview;
  getPreviewDetail?: typeof defaultGetRemediationPreviewDetail;
  onCreated: (
    preview: RemediationPreviewSnapshot,
    detail: RemediationPreviewDetail | null,
  ) => void;
}

type CreateState = "idle" | "preparing" | "creating" | "loading-detail" | "success";

export function CreateRemediationPreviewDialog({
  agentResolve,
  buildActionInput,
  caseId = "",
  createPreview = defaultCreateRemediationPreview,
  expireSeconds = 600,
  getPreviewDetail = defaultGetRemediationPreviewDetail,
  onCreated,
  onOpenChange,
  open,
  prepareWorkflowContext,
  scopeId = "",
  scopeType = "",
  selectedAction,
  selectedNode,
  sourceType = "",
  tenantId = "",
  workflowActionId = "",
  workflowId = "",
}: CreateRemediationPreviewDialogProps) {
  const [createState, setCreateState] = useState<CreateState>("idle");
  const [error, setError] = useState("");
  const [templateValues, setTemplateValues] =
    useState<RemediationTemplateValues>(() =>
      initialRemediationTemplateValues(undefined),
    );

  const baseActionInput = useMemo(() => {
    if (!selectedNode || !selectedAction || selectedAction.requires_history) {
      return undefined;
    }
    return buildActionInput?.(
      selectedAction.action_code,
      selectedNode,
      selectedAction,
    );
  }, [buildActionInput, selectedAction, selectedNode]);

  const selectedTemplate = useMemo(
    () => getRemediationPreviewTemplate(selectedAction),
    [selectedAction],
  );

  useEffect(() => {
    if (!open) return;
    setCreateState("idle");
    setError("");
    setTemplateValues(
      initialRemediationTemplateValues(baseActionInput, selectedTemplate),
    );
  }, [
    baseActionInput,
    open,
    selectedAction?.action_code,
    selectedNode?.node_key,
    selectedTemplate,
  ]);

  const agentIds = useMemo(
    () => resolvePreviewAgentIds(selectedNode, agentResolve),
    [agentResolve, selectedNode],
  );
  const contextPreview = useMemo(
    () => buildAgentContextPreview(agentIds, selectedAction),
    [agentIds, selectedAction],
  );
  const validation = useMemo(
    () =>
      validateCreatePreviewContext({
        agentIds,
        caseId,
        prepareWorkflowContext,
        selectedAction,
        selectedNode,
        workflowActionId,
        workflowId,
      }),
    [
      agentIds,
      caseId,
      prepareWorkflowContext,
      selectedAction,
      selectedNode,
      workflowActionId,
      workflowId,
    ],
  );
  const snapshotView = useMemo(
    () => buildSnapshotView(selectedNode?.snapshot, selectedAction, selectedTemplate),
    [selectedAction, selectedNode?.snapshot, selectedTemplate],
  );
  const actionInputPreview = useMemo(() => {
    return buildRemediationTemplateInput({
      baseInput: baseActionInput,
      selectedAction,
      template: selectedTemplate,
      values: templateValues,
    });
  }, [baseActionInput, selectedAction, selectedTemplate, templateValues]);
  const templateValidationMessage = useMemo(
    () =>
      validateRemediationTemplateValues({
        selectedAction,
        template: selectedTemplate,
        values: templateValues,
      }),
    [selectedAction, selectedTemplate, templateValues],
  );
  const busy =
    createState === "preparing" ||
    createState === "creating" ||
    createState === "loading-detail";
  const canSubmit =
    validation.blocking.length === 0 && !templateValidationMessage && !busy;

  async function handleCreate() {
    if (busy) return;
    setError("");

    const targetValidation = validateCreatePreviewContext({
      agentIds,
      caseId,
      prepareWorkflowContext,
      selectedAction,
      selectedNode,
      workflowActionId,
      workflowId,
    });
    if (targetValidation.blocking.length > 0) {
      setError(targetValidation.blocking[0]);
      return;
    }
    const templateValidation = validateRemediationTemplateValues({
      selectedAction,
      template: selectedTemplate,
      values: templateValues,
    });
    if (templateValidation) {
      setError(templateValidation);
      return;
    }
    if (!selectedNode || !selectedAction) return;

    try {
      setCreateState("preparing");
      const prepared = prepareWorkflowContext
        ? await prepareWorkflowContext()
        : null;
      const nextCaseId = prepared?.case_id || caseId;
      const nextWorkflowId = prepared?.workflow_id || workflowId;
      const nextWorkflowActionId =
        prepared?.workflow_action_id || workflowActionId;

      if (!nextCaseId.trim()) throw new Error("缺少 Case ID");
      if (!nextWorkflowId.trim()) throw new Error("缺少 Workflow ID");
      if (!nextWorkflowActionId.trim()) {
        throw new Error("缺少处置阶段 Action，无法挂载处置预览");
      }

      const target = buildPreviewTarget({
        action: selectedAction,
        actionInput: actionInputPreview,
        agentIds,
        node: selectedNode,
      });

      setCreateState("creating");
      const nextPreview = await createPreview({
        tenant_id: tenantId,
        expire_seconds: expireSeconds,
        workflow_id: nextWorkflowId,
        workflow_action_id: nextWorkflowActionId,
        case_id: nextCaseId,
        source_type: sourceType,
        scope_type: scopeType,
        scope_id: scopeId,
        targets: [target],
      });
      if (!nextPreview?.preview_id) {
        throw new Error("预览创建失败，响应缺少 preview_id");
      }

      setCreateState("loading-detail");
      let detail: RemediationPreviewDetail | null = null;
      try {
        detail = await getPreviewDetail({
          tenant_id: tenantId,
          preview_id: nextPreview.preview_id,
        });
      } catch {
        detail = null;
      }

      onCreated(nextPreview, detail);
      setCreateState("success");
    } catch (err) {
      setCreateState("idle");
      setError(err instanceof Error ? err.message : "创建处置预览失败");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!busy) onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100vh-56px)] gap-0 overflow-hidden border-slate-200 p-0 shadow-[0_26px_80px_-42px_rgba(15,23,42,0.55)] sm:max-w-[1120px] sm:rounded-[24px]">
        <DialogHeader className="border-b border-slate-100 px-6 py-5">
          <div className="flex min-w-0 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <ShieldCheck className="size-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-lg font-semibold text-slate-950">
                  创建处置预览
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs leading-5 text-slate-500">
                  只生成可确认的预览，不会立即下发处置命令
                </DialogDescription>
              </div>
            </div>
            <div className="mr-8 hidden shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 sm:flex">
              {createState === "success" ? (
                <CheckCircle2 className="size-3.5 text-emerald-600" />
              ) : validation.blocking.length > 0 ? (
                <AlertTriangle className="size-3.5 text-amber-600" />
              ) : (
                <ClipboardCheck className="size-3.5 text-teal-600" />
              )}
              {createState === "success"
                ? "预览已创建"
                : validation.blocking.length > 0
                  ? "需要补全信息"
                  : "可以创建"}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(100vh-220px)]">
          <div className="space-y-4 px-6 py-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_440px]">
              <TargetSnapshotPanel snapshotView={snapshotView} />
              <ExecutionSettingsPanel
                actionInput={actionInputPreview}
                agentIds={agentIds}
                disabled={busy || createState === "success"}
                hostId={selectedNode?.snapshot?.host_id || ""}
                hostName={selectedNode?.snapshot?.hostname || ""}
                onTemplateValuesChange={setTemplateValues}
                selectedAction={selectedAction}
                template={selectedTemplate}
                templateValues={templateValues}
              />
            </div>

            {selectedAction?.requires_history ? (
              <ActionContextPanel
                agentIds={agentIds}
                action={selectedAction}
                contextPreview={contextPreview}
                contexts={selectedAction.contexts}
              />
            ) : null}

            <WorkflowLinkStrip
              caseId={caseId}
              scopeType={scopeType}
              sourceType={sourceType}
              workflowActionId={workflowActionId}
              workflowId={workflowId}
            />

            {error ? (
              <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
                <XCircle className="mt-0.5 size-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4 sm:justify-between sm:space-x-0">
          <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
            <ShieldCheck className="size-3.5" />
            创建后刷新处置预览；只有确认执行时才会下发到控制服务
          </div>
          <div className="flex w-full justify-end gap-3 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => onOpenChange(false)}
              className="h-10 rounded-full border-slate-200 px-4 shadow-none"
            >
              {createState === "success" ? "完成" : "取消"}
            </Button>
            <Button
              type="button"
              disabled={!canSubmit || createState === "success"}
              onClick={() => void handleCreate()}
              className="h-10 rounded-full bg-slate-950 px-5 text-white shadow-none hover:bg-slate-800 disabled:bg-slate-300"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {buttonText(createState)}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function validateCreatePreviewContext({
  agentIds,
  caseId,
  prepareWorkflowContext,
  selectedAction,
  selectedNode,
  workflowActionId,
  workflowId,
}: {
  agentIds: string[];
  caseId: string;
  prepareWorkflowContext?: () => Promise<PreparedWorkflowContext | null>;
  selectedAction: RemediationActionOption | null | undefined;
  selectedNode: RemediationCandidateNode | null | undefined;
  workflowActionId: string;
  workflowId: string;
}) {
  const historyState = validateHistoryContexts(agentIds, selectedAction);
  const items = [
    {
      label: "处置对象",
      ok: Boolean(selectedNode?.node_key && selectedNode?.snapshot),
      message: selectedNode?.display_name || "未选择处置对象",
    },
    {
      label: "处置动作",
      ok: Boolean(selectedAction?.action_code),
      message: selectedAction?.display_name || "未选择处置动作",
    },
    {
      label: "执行终端",
      ok: agentIds.length > 0,
      message: agentIds.length > 0 ? `${agentIds.length} 台终端` : "未解析到 Agent",
    },
    {
      label: "工作流关联",
      ok: Boolean(caseId.trim() && workflowId.trim() && (workflowActionId.trim() || prepareWorkflowContext)),
      message: workflowActionId.trim()
        ? "已关联处置阶段 Action"
        : prepareWorkflowContext
          ? "提交时自动准备 Action"
          : "缺少处置阶段 Action",
    },
    {
      label: "历史上下文",
      ok: historyState.ok,
      message: selectedAction?.requires_history
        ? historyState.message
        : "当前动作不需要历史上下文",
    },
  ];
  const blocking = items
    .filter((item) => !item.ok)
    .map((item) => item.message);
  return { blocking, items };
}

function buildPreviewTarget({
  action,
  actionInput,
  agentIds,
  node,
}: {
  action: RemediationActionOption;
  actionInput?: RemediationActionInput;
  agentIds: string[];
  node: RemediationCandidateNode;
}): RemediationPreviewTargetInput {
  return {
    node_key: node.node_key,
    entity_type: node.entity_type,
    action_code: action.action_code,
    agents: buildPreviewAgents(agentIds, action),
    target_display: node.display_name,
    snapshot: node.snapshot,
    input: action.requires_history ? undefined : actionInput,
  };
}

function buildPreviewAgents(
  agentIds: string[],
  action: RemediationActionOption,
): RemediationPreviewTargetAgent[] {
  return agentIds.map((agentId) => ({
    agent_id: agentId,
    action_context: resolveActionContext(agentId, action),
  }));
}

function resolveActionContext(
  agentId: string,
  action: RemediationActionOption,
) {
  if (!action.requires_history) return undefined;
  return exactActionContext(agentId, action.contexts);
}

function exactActionContext(
  agentId: string,
  contexts: RemediationActionContext[],
) {
  const normalizedAgentId = agentId.trim();
  return contexts.find(
    (context) => context.agent_id?.trim() === normalizedAgentId,
  );
}

function validateHistoryContexts(
  agentIds: string[],
  action: RemediationActionOption | null | undefined,
) {
  if (!action?.requires_history) {
    return { ok: true, message: "当前动作不需要历史上下文" };
  }
  if (action.contexts.length === 0) {
    return { ok: false, message: "后台未返回可用历史上下文" };
  }

  const missingAgents = agentIds.filter(
    (agentId) => !exactActionContext(agentId, action.contexts),
  );
  if (missingAgents.length > 0) {
    return {
      ok: false,
      message: `缺少主机历史上下文：${missingAgents.slice(0, 3).join("、")}`,
    };
  }

  const selectedContextKeys = new Set(
    agentIds
      .map((agentId) => exactActionContext(agentId, action.contexts))
      .filter(Boolean)
      .map(historyContextKey),
  );
  if (selectedContextKeys.size > 1) {
    return {
      ok: false,
      message: "存在多个历史上下文，请按主机或上下文分批创建预览",
    };
  }

  return { ok: true, message: "已匹配后端返回的历史上下文" };
}

function historyContextKey(context: RemediationActionContext | undefined) {
  if (!context) return "";
  return [
    String(context.context_type ?? "").trim(),
    context.source_task_id?.trim() ?? "",
    context.source_action_code?.trim() ?? "",
    context.target_key?.trim() ?? "",
    context.backup_id?.trim() ?? "",
    context.policy_id?.trim() ?? "",
  ].join("|");
}

function resolvePreviewAgentIds(
  selectedNode: RemediationCandidateNode | null | undefined,
  agentResolve?: ResolveRemediationNodeAgentsResponse | null,
) {
  const values =
    selectedNode?.agent_ids?.length
      ? selectedNode.agent_ids
      : agentResolve?.agent_ids ?? [];
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

function buildAgentContextPreview(
  agentIds: string[],
  action: RemediationActionOption | null | undefined,
) {
  return agentIds.reduce<Record<string, RemediationActionContext | undefined>>(
    (result, agentId) => {
      result[agentId] = action
        ? exactActionContext(agentId, action.contexts)
        : undefined;
      return result;
    },
    {},
  );
}

interface SnapshotRow {
  label: string;
  value: string | number;
  mono?: boolean;
  wide?: boolean;
}

interface SnapshotView {
  title: string;
  branch: string;
  rows: SnapshotRow[];
}

function TargetSnapshotPanel({
  snapshotView,
}: {
  snapshotView: SnapshotView | null;
}) {
  return (
    <section className="rounded-[20px] border border-slate-200 bg-white p-4">
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
        <SectionTitle icon={Cpu} title={snapshotView?.title || "目标快照"} />
      </div>
      {snapshotView && snapshotView.rows.length > 0 ? (
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {snapshotView.rows.map((row) => (
            <SnapshotField key={row.label} {...row} />
          ))}
        </div>
      ) : (
        <div className="mt-3 flex min-h-20 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400">
          未获取到当前处置对象的快照数据
        </div>
      )}
    </section>
  );
}

function ExecutionSettingsPanel({
  actionInput,
  agentIds,
  disabled,
  hostId,
  hostName,
  onTemplateValuesChange,
  selectedAction,
  template,
  templateValues,
}: {
  actionInput: RemediationActionInput | undefined;
  agentIds: string[];
  disabled: boolean;
  hostId: string;
  hostName: string;
  onTemplateValuesChange: (values: RemediationTemplateValues) => void;
  selectedAction: RemediationActionOption | null | undefined;
  template: RemediationPreviewTemplate;
  templateValues: RemediationTemplateValues;
}) {
  const executionHosts = buildExecutionHostRows(agentIds, hostId, hostName);

  return (
    <section className="rounded-[20px] border border-slate-200 bg-white p-4">
      <SectionTitle icon={ShieldCheck} title="执行设置" />
      <div className="mt-3 divide-y divide-slate-100">
        <SettingRow label="动作" labelAlign="center">
          <div className="truncate text-sm font-semibold text-slate-950">
            {remediationTemplateActionDisplayName(
              selectedAction,
              template,
              "未选择动作",
            )}
          </div>
        </SettingRow>

        <SettingRow label="终端" labelAlign="center">
          <HostInfoList hosts={executionHosts} />
        </SettingRow>

        <SettingRow label="参数" labelAlign="center">
          <RemediationTemplateParameterControls
            actionInput={actionInput}
            disabled={disabled}
            onValuesChange={onTemplateValuesChange}
            selectedAction={selectedAction}
            template={template}
            values={templateValues}
          />
        </SettingRow>
      </div>
    </section>
  );
}

function WorkflowLinkStrip({
  caseId,
  scopeType,
  sourceType,
  workflowActionId,
  workflowId,
}: {
  caseId: string;
  scopeType: string;
  sourceType: string;
  workflowActionId: string;
  workflowId: string;
}) {
  const sourceText =
    [sourceTypeLabel(sourceType), scopeTypeLabel(scopeType)]
      .filter((item) => item && item !== "-")
      .join(" · ") || "来源待确认";

  return (
    <section className="rounded-[20px] border border-slate-200 bg-slate-50/80 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle icon={GitBranch} title="流程归属" />
        <span className="text-xs text-slate-400">{sourceText}</span>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <PlainFact label="Case ID" value={caseId || "提交时确认"} mono />
        <PlainFact label="Workflow ID" value={workflowId || "提交时确认"} mono />
        <PlainFact
          label="Remediation Action ID"
          value={workflowActionId || "提交时准备"}
          mono
        />
      </div>
    </section>
  );
}

function SettingRow({
  children,
  label,
  labelAlign = "start",
}: {
  children: ReactNode;
  label: string;
  labelAlign?: "start" | "center";
}) {
  return (
    <div className="grid gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[72px_minmax(0,1fr)]">
      <div
        className={cn(
          "text-xs font-medium text-slate-400",
          labelAlign === "center" ? "flex items-center" : "pt-0.5",
        )}
      >
        {label}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

interface ExecutionHostRow {
  hostId: string;
  hostName: string;
}

function HostInfoList({ hosts }: { hosts: ExecutionHostRow[] }) {
  const visibleHosts = hosts.slice(0, 5);

  return (
    <div className="overflow-hidden rounded-xl bg-slate-50">
      <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-2 border-b border-slate-100 px-3 py-2 text-[11px] font-medium text-slate-400">
        <span>主机ID</span>
        <span>主机名</span>
      </div>
      <div className="divide-y divide-slate-100">
        {visibleHosts.length > 0 ? (
          visibleHosts.map((host, index) => (
            <div
              key={`${host.hostId}-${index}`}
              className="grid min-h-9 grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] items-center gap-2 px-3 py-2 text-xs"
            >
              <span
                className="truncate font-mono font-medium text-slate-700"
                title={host.hostId}
              >
                {host.hostId || "-"}
              </span>
              <span
                className="truncate font-medium text-slate-700"
                title={host.hostName}
              >
                {host.hostName || "-"}
              </span>
            </div>
          ))
        ) : (
          <div className="px-3 py-3 text-center text-xs text-slate-400">
            未解析到执行主机
          </div>
        )}
        {hosts.length > visibleHosts.length ? (
          <div className="px-3 py-2 text-xs text-slate-400">
            还有 {hosts.length - visibleHosts.length} 台主机将在预览中校验
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PlainFact({
  label,
  mono = false,
  value,
}: {
  label: string;
  mono?: boolean;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl bg-white/70 px-4 py-3">
      <div className="truncate text-[11px] font-medium text-slate-400">{label}</div>
      <div
        className={cn(
          "mt-1 truncate text-sm font-medium text-slate-800",
          mono ? "font-mono text-xs" : "",
        )}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}

function buildExecutionHostRows(
  agentIds: string[],
  snapshotHostId: string,
  snapshotHostName: string,
): ExecutionHostRow[] {
  const uniqueAgentIds = Array.from(
    new Set(agentIds.map((item) => item.trim()).filter(Boolean)),
  );
  const normalizedSnapshotHostId = snapshotHostId.trim();
  const normalizedSnapshotHostName = snapshotHostName.trim();

  if (uniqueAgentIds.length === 0) {
    if (!normalizedSnapshotHostId && !normalizedSnapshotHostName) return [];
    return [
      {
        hostId: normalizedSnapshotHostId || "-",
        hostName: normalizedSnapshotHostName || "-",
      },
    ];
  }

  return uniqueAgentIds.map((agentId) => ({
    hostId: agentId,
    hostName:
      uniqueAgentIds.length === 1 || agentId === normalizedSnapshotHostId
        ? normalizedSnapshotHostName || "-"
        : "-",
  }));
}

function SnapshotField({
  label,
  mono = false,
  value,
  wide = false,
}: SnapshotRow) {
  const display = String(value || "-");
  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl bg-slate-50 px-4 py-3",
        wide ? "md:col-span-2" : "",
      )}
    >
      <div className="text-[11px] font-medium text-slate-400">{label}</div>
      <div
        className={cn(
          "mt-1 text-xs leading-5 text-slate-800",
          mono ? "font-mono" : "",
          wide ? "break-all" : "truncate",
        )}
        title={display}
      >
        {display}
      </div>
    </div>
  );
}

function buildSnapshotView(
  snapshot: RemediationTargetSnapshot | undefined,
  action: RemediationActionOption | null | undefined,
  template: RemediationPreviewTemplate,
): SnapshotView | null {
  if (!snapshot) return null;
  const branch = snapshotBranchForAction(snapshot, action, template);
  if (!branch) return null;
  const record = objectValue(snapshot[branch as keyof RemediationTargetSnapshot]);

  switch (branch) {
    case "process":
      return {
        title: "进程快照",
        branch: "snapshot.process",
        rows: compactSnapshotRows([
          snapshotRow("进程名", record, ["process_name"]),
          snapshotRow("PID", record, ["pid"], { mono: true }),
          snapshotRow("进程路径", record, ["process_path", "path"], {
            mono: true,
            wide: true,
          }),
          snapshotRow("Hash", record, ["hash", "process_hash", "md5"], {
            mono: true,
            wide: true,
          }),
          snapshotRow("Process GUID", record, ["process_guid"], {
            mono: true,
            wide: true,
          }),
          snapshotRow("命令行", record, ["command_line"], {
            mono: true,
            wide: true,
          }),
        ]),
      };
    case "file":
      return {
        title: "文件快照",
        branch: "snapshot.file",
        rows: compactSnapshotRows([
          snapshotRow("文件路径", record, ["file_path", "path"], {
            mono: true,
            wide: true,
          }),
          snapshotRow("Hash", record, ["file_hash", "hash", "md5"], {
            mono: true,
            wide: true,
          }),
          snapshotRow("Stream Name", record, ["stream_name"], {
            mono: true,
            wide: true,
          }),
          snapshotRow("EA Names", record, ["ea_names"], {
            mono: true,
            wide: true,
          }),
          snapshotRow("Backup ID", record, ["backup_id"], {
            mono: true,
            wide: true,
          }),
        ]),
      };
    case "scheduled_task":
      return {
        title: "计划任务快照",
        branch: "snapshot.scheduled_task",
        rows: compactSnapshotRows([
          snapshotRow("任务名", record, ["task_name", "job_name"]),
          snapshotRow("任务路径", record, ["task_path"], { mono: true, wide: true }),
          snapshotRow("Job ID", record, ["job_id"], { mono: true }),
          snapshotRow("命令", record, ["command"], { mono: true, wide: true }),
          snapshotRow("Backup ID", record, ["backup_id"], { mono: true }),
        ]),
      };
    case "service":
      return {
        title: "服务快照",
        branch: "snapshot.service",
        rows: compactSnapshotRows([
          snapshotRow("服务名", record, ["service_name"], { mono: true }),
          snapshotRow("显示名", record, ["display_name"]),
          snapshotRow("状态", record, ["state", "status"]),
          snapshotRow("二进制路径", record, ["binary_path", "image_path"], {
            mono: true,
            wide: true,
          }),
          snapshotRow("Backup ID", record, ["backup_id"], { mono: true }),
        ]),
      };
    case "account":
      return {
        title: "账号快照",
        branch: "snapshot.account",
        rows: compactSnapshotRows([
          snapshotRow("账号名", record, ["account_name", "user"]),
          snapshotRow("域", record, ["domain"]),
          snapshotRow("SID", record, ["sid"], { mono: true, wide: true }),
        ]),
      };
    case "registry":
      return {
        title: "注册表快照",
        branch: "snapshot.registry",
        rows: compactSnapshotRows([
          snapshotRow("Hive", record, ["hive"], { mono: true }),
          snapshotRow("Key Path", record, ["key_path"], { mono: true, wide: true }),
          snapshotRow("Value Name", record, ["value_name"], { mono: true }),
          snapshotRow("Value Data", record, ["value_data"], {
            mono: true,
            wide: true,
          }),
          snapshotRow("Backup ID", record, ["backup_id"], { mono: true }),
        ]),
      };
    case "wmi_class":
      return {
        title: "WMI Class 快照",
        branch: "snapshot.wmi_class",
        rows: compactSnapshotRows([
          snapshotRow("Namespace", record, ["namespace"], { mono: true }),
          snapshotRow("Class Name", record, ["class_name"], { mono: true }),
          snapshotRow("Backup ID", record, ["backup_id"], { mono: true }),
        ]),
      };
    case "wmi_subscription":
      return {
        title: "WMI 订阅快照",
        branch: "snapshot.wmi_subscription",
        rows: compactSnapshotRows([
          snapshotRow("Namespace", record, ["namespace"], { mono: true }),
          snapshotRow("Filter", record, ["filter_name"], { mono: true }),
          snapshotRow("Consumer", record, ["consumer_name"], { mono: true }),
          snapshotRow("Consumer Type", record, ["consumer_type"]),
          snapshotRow("Backup ID", record, ["backup_id"], { mono: true }),
        ]),
      };
    case "bits_job":
      return {
        title: "BITS Job 快照",
        branch: "snapshot.bits_job",
        rows: compactSnapshotRows([
          snapshotRow("Job ID", record, ["job_id"], { mono: true }),
          snapshotRow("Job Name", record, ["job_name"]),
          snapshotRow("Remote URL", record, ["remote_url"], { mono: true, wide: true }),
          snapshotRow("Local Files", record, ["local_files"], { mono: true, wide: true }),
          snapshotRow("Backup ID", record, ["backup_id"], { mono: true }),
        ]),
      };
    case "network":
      return {
        title: "网络快照",
        branch: "snapshot.network",
        rows: compactSnapshotRows([
          snapshotRow("本地地址", record, ["local_address"], { mono: true }),
          snapshotRow("本地端口", record, ["local_port"], { mono: true }),
          snapshotRow("远端地址", record, ["remote_address"], { mono: true }),
          snapshotRow("远端端口", record, ["remote_port"], { mono: true }),
          snapshotRow("协议", record, ["protocol"], { mono: true }),
          snapshotRow("Policy ID", record, ["policy_id"], { mono: true, wide: true }),
        ]),
      };
    default:
      return null;
  }
}

function snapshotBranchForAction(
  snapshot: RemediationTargetSnapshot,
  action: RemediationActionOption | null | undefined,
  template: RemediationPreviewTemplate,
) {
  const templateBranch = remediationTemplateSnapshotBranch(action, template);
  if (templateBranch && hasSnapshotData(snapshot[templateBranch])) {
    return templateBranch;
  }
  const kind = String(action?.required_snapshot_kind ?? "").toLowerCase();
  const branches: Array<keyof RemediationTargetSnapshot> = [
    "process",
    "file",
    "scheduled_task",
    "service",
    "account",
    "registry",
    "wmi_class",
    "wmi_subscription",
    "bits_job",
    "network",
  ];
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
  return branches.find((branch) => hasSnapshotData(snapshot[branch]));
}

function hasSnapshotData(value: unknown) {
  return Object.keys(objectValue(value)).length > 0;
}

function snapshotRow(
  label: string,
  record: Record<string, unknown>,
  keys: string[],
  options: Pick<SnapshotRow, "mono" | "wide"> = {},
): SnapshotRow | null {
  for (const key of keys) {
    const value = formatSnapshotValue(record[key]);
    if (value !== "") {
      return { label, value, ...options };
    }
  }
  return null;
}

function compactSnapshotRows(rows: Array<SnapshotRow | null>) {
  return rows.filter(Boolean) as SnapshotRow[];
}

function formatSnapshotValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => stringValue(item)).filter(Boolean).join(", ");
  }
  return stringValue(value);
}

function ActionContextPanel({
  action,
  agentIds,
  contextPreview,
  contexts,
}: {
  action: RemediationActionOption;
  agentIds: string[];
  contextPreview: Record<string, RemediationActionContext | undefined>;
  contexts: RemediationActionContext[];
}) {
  const rows = agentIds.length > 0 ? agentIds : contexts.map((item) => item.agent_id || "");
  const title = actionContextPanelTitle(action);

  return (
    <section className="rounded-[20px] border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle icon={History} title={title} />
      </div>
      <div className="mt-3 grid gap-3">
        {rows.length > 0 ? (
          rows.map((agentId, index) => {
            const context =
              contextPreview[agentId] ??
              contexts.find((item) => item.agent_id === agentId);
            return (
              <div
                key={`${agentId}-${index}`}
                className={cn(
                  "min-w-0 overflow-hidden rounded-xl border bg-slate-50",
                  context ? "border-slate-100" : "border-red-100 bg-red-50",
                )}
              >
                <div className="grid grid-cols-[minmax(120px,0.8fr)_minmax(180px,1fr)_minmax(140px,0.85fr)_minmax(120px,0.75fr)_minmax(220px,1.4fr)] border-b border-slate-100 px-3 py-2 text-[11px] font-medium text-slate-400">
                  <span>执行终端</span>
                  <span>来源任务</span>
                  <span>来源动作</span>
                  <span>{context?.policy_id ? "Policy ID" : "Backup ID"}</span>
                  <span>节点ID</span>
                </div>
                <div className="grid min-h-11 grid-cols-[minmax(120px,0.8fr)_minmax(180px,1fr)_minmax(140px,0.85fr)_minmax(120px,0.75fr)_minmax(220px,1.4fr)] items-center px-3 py-2 text-xs">
                  <span className="truncate font-mono font-medium text-slate-700" title={agentId || context?.agent_id || "-"}>
                    {agentId || context?.agent_id || "-"}
                  </span>
                  <span className="truncate font-mono text-slate-700" title={String(context?.source_task_id || "-")}>
                    {context?.source_task_id || "-"}
                  </span>
                  <span className="truncate font-mono text-slate-700" title={String(context?.source_action_code || "-")}>
                    {context?.source_action_code || "-"}
                  </span>
                  <span className="truncate font-mono text-slate-700" title={String(context?.policy_id || context?.backup_id || "-")}>
                    {context?.policy_id || context?.backup_id || "-"}
                  </span>
                  <span className="truncate font-mono text-slate-700" title={String(context?.target_key || "-")}>
                    {context?.target_key || "-"}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 px-4 py-6 text-center text-xs text-red-600">
            当前反向动作缺少历史上下文，无法创建预览
          </div>
        )}
      </div>
    </section>
  );
}

function actionContextPanelTitle(action: RemediationActionOption) {
  const actionCode = action.action_code.trim().toLowerCase();
  if (actionCode === "file.restore") return "恢复依据";
  if (actionCode.includes("restore")) return "恢复依据";
  if (actionCode.includes("bypass")) return "放行依据";
  if (actionCode.includes("enable")) return "启用依据";
  return "历史上下文";
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
      <Icon className="size-4 text-slate-500" />
      {title}
    </div>
  );
}

function buttonText(state: CreateState) {
  if (state === "preparing") return "准备处置阶段...";
  if (state === "creating") return "创建预览...";
  if (state === "loading-detail") return "读取结果...";
  if (state === "success") return "已创建";
  return "创建预览";
}

function actionContextTypeLabel(value: string | number | undefined) {
  const key = String(value ?? "").trim();
  const normalized = key.toLowerCase();
  if (key === "1" || normalized.includes("restore")) return "恢复";
  if (key === "2" || normalized.includes("bypass")) return "放行";
  if (key === "3" || normalized.includes("enable")) return "启用";
  return "上下文";
}

function entityTypeLabel(entityType: string) {
  const normalized = entityType.trim().toLowerCase();
  if (normalized.includes("file")) return "文件";
  if (normalized.includes("process")) return "进程";
  if (normalized.includes("net")) return "网络";
  if (normalized.includes("dns")) return "域名";
  if (normalized.includes("url")) return "URL";
  if (normalized.includes("account")) return "账号";
  if (normalized.includes("service")) return "服务";
  if (normalized.includes("registry")) return "注册表";
  return entityType || "-";
}

function sourceTypeLabel(sourceType: string) {
  const normalized = sourceType.trim().toLowerCase();
  if (normalized === "case_graph") return "案件图谱";
  if (normalized === "drill_graph") return "溯源图谱";
  if (normalized === "locate_graph") return "定位图谱";
  if (normalized === "manual") return "手动创建";
  return sourceType || "-";
}

function scopeTypeLabel(scopeType: string) {
  const normalized = scopeType.trim().toLowerCase();
  if (normalized === "case") return "案件范围";
  if (normalized === "positioning") return "定位范围";
  return scopeType || "-";
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}
