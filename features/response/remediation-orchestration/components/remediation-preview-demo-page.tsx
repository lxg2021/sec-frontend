"use client"

import { useMemo, useRef, useState, type ComponentType } from "react"
import {
  BadgeCheck,
  Braces,
  CalendarClock,
  Check,
  Copy,
  Database,
  FileCog,
  FileStack,
  FileWarning,
  History,
  Network,
  ServerCog,
  ShieldCheck,
  SlidersHorizontal,
  TerminalSquare,
  UserCog,
  Workflow,
} from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"

import {
  buildDemoAction,
  buildDemoCreateRequest,
  buildDemoNode,
  buildDemoPreviewDetail,
  buildDemoPreviewSnapshot,
  defaultDemoValues,
  demoActionVariants,
  remediationDemoCommonFields,
  remediationPreviewDemoTemplates,
  resolveDemoActionVariant,
  type DemoActionMode,
  type DemoActionVariant,
  type DemoField,
  type DemoValues,
} from "../demo-data"
import type { RemediationActionContext, RemediationPreviewSnapshot } from "../types"
import { CreateRemediationPreviewDialog } from "./create-remediation-preview-dialog"

type JsonView = "request" | "target" | "snapshot" | "input" | "context"

const iconByDemoId: Record<string, ComponentType<{ className?: string }>> = {
  process: TerminalSquare,
  file: FileWarning,
  "scheduled-task": CalendarClock,
  service: ServerCog,
  account: UserCog,
  registry: Database,
  "wmi-class": Braces,
  "wmi-subscription": Workflow,
  "bits-job": FileStack,
  "file-ea": FileCog,
  "ntfs-ads": FileCog,
  "proc-execute": ShieldCheck,
  "net-quarantine": Network,
}

export function RemediationPreviewDemoPage() {
  const [selectedId, setSelectedId] = useState(remediationPreviewDemoTemplates[0].id)
  const selected =
    remediationPreviewDemoTemplates.find((item) => item.id === selectedId) ??
    remediationPreviewDemoTemplates[0]
  const [actionMode, setActionMode] = useState<DemoActionMode>("forward")
  const actionVariants = useMemo(() => demoActionVariants(selected), [selected])
  const selectedVariant = useMemo(
    () => resolveDemoActionVariant(selected, actionMode),
    [actionMode, selected],
  )
  const [values, setValues] = useState<DemoValues>(() =>
    defaultDemoValues(selected, "forward"),
  )
  const [jsonView, setJsonView] = useState<JsonView>("request")
  const [copied, setCopied] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [lastPreview, setLastPreview] =
    useState<RemediationPreviewSnapshot | null>(null)
  const previewRef = useRef<RemediationPreviewSnapshot | null>(null)

  const request = useMemo(
    () => buildDemoCreateRequest(selected, values, selectedVariant.mode),
    [selected, selectedVariant.mode, values],
  )
  const selectedNode = useMemo(
    () => buildDemoNode(selected, values, selectedVariant.mode),
    [selected, selectedVariant.mode, values],
  )
  const selectedAction = useMemo(
    () => buildDemoAction(selected, values, selectedVariant.mode),
    [selected, selectedVariant.mode, values],
  )
  const selectedTarget = request.targets[0]
  const selectedContext = selectedTarget.agents[0]?.action_context
  const jsonPayload = useMemo(() => {
    if (jsonView === "target") return selectedTarget
    if (jsonView === "snapshot") return selectedTarget.snapshot
    if (jsonView === "input") return selectedTarget.input ?? {}
    if (jsonView === "context") return selectedContext ?? {}
    return request
  }, [jsonView, request, selectedContext, selectedTarget])
  const jsonText = useMemo(
    () => JSON.stringify(jsonPayload, null, 2),
    [jsonPayload],
  )

  function selectTemplate(id: string) {
    const next =
      remediationPreviewDemoTemplates.find((item) => item.id === id) ??
      remediationPreviewDemoTemplates[0]
    const nextMode: DemoActionMode = "forward"
    const commonValues = remediationDemoCommonFields.reduce<DemoValues>(
      (result, field) => {
        result[field.key] = values[field.key] ?? field.defaultValue
        return result
      },
      {},
    )
    const nextValues = {
      ...defaultDemoValues(next, nextMode),
      ...commonValues,
    }
    nextValues.node_key = `${next.id}:${String(nextValues.agent_id || "agent-demo-01")}:demo-object`
    nextValues.target_display = ""
    setSelectedId(next.id)
    setActionMode(nextMode)
    setValues(nextValues)
    setJsonView("request")
    setLastPreview(null)
  }

  function selectActionMode(mode: DemoActionMode) {
    const variant = resolveDemoActionVariant(selected, mode)
    const nextValues = {
      ...defaultDemoValues(selected, variant.mode),
      ...values,
    }
    setActionMode(variant.mode)
    setValues(nextValues)
    setJsonView("request")
    setLastPreview(null)
  }

  function updateValue(field: DemoField, nextValue: string | boolean) {
    setValues((current) => ({
      ...current,
      [field.key]: field.type === "number" ? Number(nextValue) : nextValue,
    }))
  }

  async function copyJson() {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(jsonText)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  const commandCount = remediationPreviewDemoTemplates.filter(
    (item) => item.objectType === "Command",
  ).length
  const policyCount = remediationPreviewDemoTemplates.length - commandCount

  return (
    <main className="min-h-[calc(100dvh-3rem)] bg-[#f5f8fb] p-4 text-slate-900 xl:p-5">
      <div className="flex w-full min-w-0 flex-col gap-5">
        <header className="w-full rounded-[28px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_12px_34px_rgba(15,23,42,0.08)]">
          <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 text-teal-600">
                <ShieldCheck aria-hidden className="h-5 w-5" />
              </div>
              <div className="min-w-0 space-y-1.5">
                <h1 className="line-clamp-2 break-words text-lg font-semibold leading-tight text-slate-950">
                  处置预览 Dialog Demo
                </h1>
                <p className="min-w-0 truncate text-sm text-slate-500">
                  模拟 QueryRemediationNodeActions 返回动作，再生成 CreateRemediationPreviewRequest
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
              <HeaderMetric label="Target Types" value="13" />
              <HeaderMetric label="Command" value={String(commandCount)} />
              <HeaderMetric label="Policy" value={String(policyCount)} />
            </div>
          </div>
        </header>

        <section className="grid gap-5 2xl:grid-cols-[360px_minmax(420px,0.9fr)_minmax(500px,1.1fr)]">
          <TypeSelector selectedId={selected.id} onSelect={selectTemplate} />

          <section className="min-w-0 rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_52px_-44px_rgba(15,23,42,0.55)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <SlidersHorizontal aria-hidden className="h-4 w-4 text-slate-500" />
                  参数模板
                </div>
                <div className="mt-1 text-xs leading-5 text-slate-500">
                  Snapshot 来自图谱节点，Action Input 是用户补充参数，Action Context 来自后台历史任务
                </div>
              </div>
              <Button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="h-10 rounded-full bg-teal-600 px-4 text-white shadow-sm hover:bg-teal-700"
              >
                <ShieldCheck aria-hidden className="h-4 w-4" />
                打开预览弹窗
              </Button>
            </div>

            <div className="mt-5 space-y-5">
              <ActionModeSwitch
                mode={selectedVariant.mode}
                onChange={selectActionMode}
                variants={actionVariants}
              />
              <FieldGroup
                fields={remediationDemoCommonFields}
                title="基础上下文"
                values={values}
                onChange={updateValue}
              />
              <FieldGroup
                fields={selected.targetFields}
                title={`目标模板参数 ${selected.snapshotBranch}`}
                values={values}
                onChange={updateValue}
              />
              <FieldGroup
                fields={selectedVariant.mode === "forward" ? selected.inputFields : []}
                title={
                  selectedVariant.mode === "forward"
                    ? `动作扩展参数 ${selectedVariant.inputBranch}`
                    : "动作扩展参数（无，使用历史上下文）"
                }
                values={values}
                onChange={updateValue}
              />
              {selectedVariant.requiresHistory ? (
                <ActionContextMockPanel
                  context={selectedContext}
                  variant={selectedVariant}
                />
              ) : null}
            </div>
          </section>

          <section className="min-w-0 space-y-5">
            <MappingPanel
              context={selectedContext}
              lastPreview={lastPreview}
              selected={selected}
              variant={selectedVariant}
            />

            <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_18px_52px_-44px_rgba(15,23,42,0.55)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                  <div className="text-sm font-semibold text-slate-950">
                    生成的 CreateRemediationPreviewRequest
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    这里展示参数化结果；点击按钮后由 CreateRemediationPreviewDialog 走 mock preview/detail
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void copyJson()}
                  className="h-9 rounded-full border-slate-200 px-3 text-xs shadow-none hover:bg-slate-50"
                >
                  {copied ? (
                    <Check aria-hidden className="h-3.5 w-3.5 text-teal-600" />
                  ) : (
                    <Copy aria-hidden className="h-3.5 w-3.5" />
                  )}
                  {copied ? "已复制" : "复制JSON"}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 px-5 py-3">
                <JsonSwitch
                  active={jsonView === "request"}
                  label="完整请求"
                  onClick={() => setJsonView("request")}
                />
                <JsonSwitch
                  active={jsonView === "target"}
                  label="Target"
                  onClick={() => setJsonView("target")}
                />
                <JsonSwitch
                  active={jsonView === "snapshot"}
                  label="Snapshot"
                  onClick={() => setJsonView("snapshot")}
                />
                <JsonSwitch
                  active={jsonView === "input"}
                  label="Input"
                  onClick={() => setJsonView("input")}
                />
                <JsonSwitch
                  active={jsonView === "context"}
                  label="Action Context"
                  onClick={() => setJsonView("context")}
                />
              </div>

              <pre className="max-h-[560px] overflow-auto border-t border-slate-100 bg-slate-950 p-5 text-[12px] leading-5 text-slate-100">
                <code>{jsonText}</code>
              </pre>
            </section>
          </section>
        </section>
      </div>

      <CreateRemediationPreviewDialog
        agentResolve={{
          request_id: "demo-resolve-agent",
          tenant_id: String(values.tenant_id || "public"),
          scope_type: String(values.scope_type || "case"),
          scope_id: String(values.scope_id || values.case_id || ""),
          node_key: selectedNode.node_key,
          entity_type: selectedNode.entity_type,
          status: "resolved",
          agent_ids: selectedNode.agent_ids,
          resolve_source: "demo",
          message: "demo agent resolved",
        }}
        buildActionInput={() => selectedTarget.input}
        caseId={String(values.case_id || "")}
        createPreview={async (params) => {
          const preview = buildDemoPreviewSnapshot(selected, values, {
            ...params,
            request_id: `demo-dialog-${selected.id}`,
          }, selectedVariant.mode)
          previewRef.current = preview
          return preview
        }}
        expireSeconds={Number(values.expire_seconds || 600)}
        getPreviewDetail={async () => {
          const preview =
            previewRef.current ??
            buildDemoPreviewSnapshot(selected, values, request, selectedVariant.mode)
          return buildDemoPreviewDetail(selected, values, preview, selectedVariant.mode)
        }}
        onCreated={(preview) => {
          setLastPreview(preview)
        }}
        onOpenChange={setDialogOpen}
        open={dialogOpen}
        prepareWorkflowContext={async () => ({
          case_id: String(values.case_id || ""),
          workflow_id: String(values.workflow_id || ""),
          workflow_action_id: String(values.workflow_action_id || ""),
        })}
        scopeId={String(values.scope_id || "")}
        scopeType={String(values.scope_type || "")}
        selectedAction={selectedAction}
        selectedNode={selectedNode}
        sourceType={String(values.source_type || "")}
        tenantId={String(values.tenant_id || "")}
        workflowActionId={String(values.workflow_action_id || "")}
        workflowId={String(values.workflow_id || "")}
      />
    </main>
  )
}

function ActionModeSwitch({
  mode,
  onChange,
  variants,
}: {
  mode: DemoActionMode
  onChange: (mode: DemoActionMode) => void
  variants: DemoActionVariant[]
}) {
  const reverse = variants.find((variant) => variant.mode === "reverse")
  return (
    <section className="rounded-[20px] border border-slate-100 bg-slate-50/70 p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-700">
        <Workflow aria-hidden className="h-4 w-4 text-teal-600" />
        QueryRemediationNodeActions 动作裁决
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {variants.map((variant) => {
          const active = variant.mode === mode
          return (
            <button
              key={variant.mode}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(variant.mode)}
              className={cn(
                "min-h-16 rounded-2xl border px-4 py-3 text-left transition-colors duration-200",
                active
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:bg-teal-50/60",
              )}
            >
              <div className="text-sm font-semibold">
                {variant.mode === "forward" ? "正向动作" : "反向动作（历史）"}
              </div>
              <div
                className={cn(
                  "mt-1 truncate font-mono text-[11px]",
                  active ? "text-slate-300" : "text-slate-400",
                )}
              >
                {variant.actionCode}
              </div>
            </button>
          )
        })}
        {!reverse ? (
          <div className="min-h-16 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-left">
            <div className="text-sm font-semibold text-slate-500">
              无反向动作
            </div>
            <div className="mt-1 text-[11px] leading-5 text-slate-400">
              当前类型没有通用恢复、放行或启用动作
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function TypeSelector({
  onSelect,
  selectedId,
}: {
  onSelect: (id: string) => void
  selectedId: string
}) {
  return (
    <section className="min-w-0 rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_52px_-44px_rgba(15,23,42,0.55)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-950">处置类型</div>
          <div className="mt-1 text-xs leading-5 text-slate-500">
            选择一种模板后，中间参数表单会同步切换
          </div>
        </div>
        <Badge
          variant="outline"
          className="rounded-full border-slate-200 bg-slate-50 px-2.5 text-[11px] text-slate-500"
        >
          13
        </Badge>
      </div>

      <div className="mt-4 grid gap-2">
        {remediationPreviewDemoTemplates.map((item) => {
          const Icon = iconByDemoId[item.id] ?? ShieldCheck
          const active = item.id === selectedId
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(item.id)}
              className={cn(
                "group flex min-h-16 items-center gap-3 rounded-[18px] border px-3 py-3 text-left transition-colors duration-200",
                active
                  ? "border-teal-300 bg-teal-50/70"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                  active
                    ? "bg-teal-600 text-white"
                    : "bg-slate-100 text-slate-500 group-hover:bg-slate-200",
                )}
              >
                <Icon aria-hidden className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-slate-950">
                  {item.title}
                </div>
                <div className="mt-0.5 truncate text-xs text-slate-400">
                  {item.actionCode}
                </div>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-1 text-[10px] font-medium",
                  item.objectType === "Policy"
                    ? "bg-cyan-50 text-cyan-700"
                    : "bg-slate-100 text-slate-600",
                )}
              >
                {item.targetTypeValue}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function FieldGroup({
  fields,
  onChange,
  title,
  values,
}: {
  fields: DemoField[]
  onChange: (field: DemoField, value: string | boolean) => void
  title: string
  values: DemoValues
}) {
  return (
    <section className="rounded-[20px] border border-slate-100 bg-slate-50/70 p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-700">
        <BadgeCheck aria-hidden className="h-4 w-4 text-teal-600" />
        {title}
      </div>
      {fields.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-4 text-xs leading-5 text-slate-400">
          当前动作不需要额外 Action Input，执行凭证来自 RemediationActionContext
        </div>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        {fields.map((field) => (
          <label key={field.key} className="min-w-0">
            <span className="mb-1.5 block text-[11px] font-medium text-slate-500">
              {field.label}
            </span>
            {field.type === "boolean" ? (
              <button
                type="button"
                aria-pressed={Boolean(values[field.key])}
                onClick={() => onChange(field, !Boolean(values[field.key]))}
                className={cn(
                  "flex h-10 w-full items-center justify-between rounded-2xl border px-3 text-xs font-medium transition-colors",
                  values[field.key]
                    ? "border-teal-200 bg-teal-50 text-teal-700"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                )}
              >
                <span>{values[field.key] ? "true" : "false"}</span>
                <span
                  className={cn(
                    "h-5 w-9 rounded-full p-0.5 transition-colors",
                    values[field.key] ? "bg-teal-500" : "bg-slate-200",
                  )}
                >
                  <span
                    className={cn(
                      "block h-4 w-4 rounded-full bg-white transition-transform",
                      values[field.key] && "translate-x-4",
                    )}
                  />
                </span>
              </button>
            ) : (
              <input
                type={field.type === "number" ? "number" : "text"}
                value={String(values[field.key] ?? "")}
                onChange={(event) => onChange(field, event.target.value)}
                placeholder={field.placeholder}
                className="h-10 w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition-colors placeholder:text-slate-300 focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
              />
            )}
          </label>
        ))}
      </div>
    </section>
  )
}

function ActionContextMockPanel({
  context,
  variant,
}: {
  context?: RemediationActionContext
  variant: DemoActionVariant
}) {
  return (
    <section className="rounded-[20px] border border-amber-100 bg-amber-50/70 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
          <History aria-hidden className="h-4 w-4" />
          RemediationActionContext
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-amber-700">
          后端返回 · 前端原样带回
        </span>
      </div>
      <div className="text-xs leading-5 text-amber-800">
        这里模拟 QueryRemediationNodeActions 返回的 contexts[]。真实页面不让用户编辑这些字段，只在创建预览时写入 targets[].agents[].action_context
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <ContextFact label="context_type" value={contextTypeLabel(context)} />
        <ContextFact label="agent_id" value={context?.agent_id} />
        <ContextFact label="source_task_id" value={context?.source_task_id} />
        <ContextFact
          label="source_action_code"
          value={context?.source_action_code || variant.sourceActionCode}
        />
        <ContextFact label="target_key" value={context?.target_key} />
        <ContextFact
          label={context?.policy_id ? "policy_id" : "backup_id"}
          value={context?.policy_id || context?.backup_id}
        />
      </div>
    </section>
  )
}

function MappingPanel({
  context,
  lastPreview,
  selected,
  variant,
}: {
  context?: RemediationActionContext
  lastPreview: RemediationPreviewSnapshot | null
  selected: (typeof remediationPreviewDemoTemplates)[number]
  variant: DemoActionVariant
}) {
  return (
    <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_52px_-44px_rgba(15,23,42,0.55)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-950">
            当前映射关系
          </div>
          <div className="mt-1 text-xs leading-5 text-slate-500">
            前端传 action_code / snapshot / input / action_context，target_type 由后台 builder 映射
          </div>
        </div>
        <Badge className="rounded-full bg-slate-950 text-white hover:bg-slate-950">
          {selected.objectType}
        </Badge>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MappingItem label="action_code" value={variant.actionCode} />
        <MappingItem label="节点类型" value={selected.entityType} />
        <MappingItem label="snapshot branch" value={selected.snapshotBranch} />
        <MappingItem label="input branch" value={variant.inputBranch} />
        <MappingItem
          label="action_context"
          value={variant.requiresHistory ? contextTypeLabel(context) : "不需要"}
        />
        <MappingItem label="mitigation cmd_info" value={selected.cmdInfo} />
        <MappingItem label="target_type" value={selected.targetType} />
        <MappingItem label="action_type" value={variant.actionType} />
      </div>

      {variant.requiresHistory && context ? (
        <div className="mt-4 rounded-[18px] border border-amber-100 bg-amber-50 px-4 py-3">
          <div className="text-xs font-semibold text-amber-800">
            历史上下文会写入 targets[].agents[].action_context
          </div>
          <div className="mt-2 grid gap-2 text-[11px] text-amber-900 sm:grid-cols-2">
            <ContextFact label="source_task_id" value={context.source_task_id} />
            <ContextFact label="source_action_code" value={context.source_action_code} />
            <ContextFact label="target_key" value={context.target_key} />
            <ContextFact
              label={context.policy_id ? "policy_id" : "backup_id"}
              value={context.policy_id || context.backup_id}
            />
          </div>
        </div>
      ) : null}

      {lastPreview ? (
        <div className="mt-4 rounded-[18px] border border-teal-100 bg-teal-50 px-4 py-3 text-xs text-teal-800">
          已通过弹窗生成 mock preview：
          <span className="ml-1 font-mono">{lastPreview.preview_id}</span>
        </div>
      ) : null}
    </section>
  )
}

function HeaderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
        {value}
      </div>
    </div>
  )
}

function MappingItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[18px] border border-slate-100 bg-slate-50 px-3 py-3">
      <div className="truncate text-[11px] text-slate-400">{label}</div>
      <div className="mt-1 truncate font-mono text-xs text-slate-800" title={value}>
        {value}
      </div>
    </div>
  )
}

function ContextFact({
  label,
  value,
}: {
  label: string
  value?: string | number
}) {
  return (
    <div className="min-w-0 rounded-2xl bg-white/70 px-3 py-2">
      <div className="truncate text-[10px] text-amber-700/70">{label}</div>
      <div className="mt-1 truncate font-mono text-[11px]" title={String(value || "-")}>
        {value || "-"}
      </div>
    </div>
  )
}

function contextTypeLabel(context?: RemediationActionContext) {
  const type = String(context?.context_type ?? "")
  if (type === "1" || type.includes("RESTORE")) return "RESTORE 恢复上下文"
  if (type === "2" || type.includes("BYPASS")) return "BYPASS 放行上下文"
  if (type === "3" || type.includes("ENABLE")) return "ENABLE 启用上下文"
  return "NONE"
}

function JsonSwitch({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-8 rounded-full px-3 text-xs font-medium transition-colors duration-200",
        active
          ? "bg-slate-950 text-white"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800",
      )}
    >
      {label}
    </button>
  )
}
