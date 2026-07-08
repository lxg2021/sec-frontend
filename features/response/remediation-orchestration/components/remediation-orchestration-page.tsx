"use client"

import { useCallback, useEffect, useMemo, useState, type ComponentType, type FormEvent, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  Clock3,
  DatabaseZap,
  FileCode2,
  FileWarning,
  GitBranch,
  Loader2,
  Network,
  Play,
  Plus,
  RefreshCcw,
  RotateCcw,
  Route,
  Search,
  Square,
  TerminalSquare,
  Workflow,
} from "lucide-react"

import {
  createAttackWorkflowAction,
  getAttackWorkflow,
  getAttackWorkflowByCaseId,
  updateAttackWorkflowStatus,
} from "@/features/attack/workflow/api"
import type {
  AttackWorkflowActionItem,
  AttackWorkflowItem,
  AttackWorkflowStatus,
} from "@/features/attack/workflow/types"
import {
  formatWorkflowTime,
  normalizeWorkflowStatus,
  workflowStatusIndex,
} from "@/features/attack/workflow/utils"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { useToast } from "@/shared/ui/use-toast"

import {
  cancelRemediationPreview,
  confirmRemediationPreview,
  createRemediationPreview,
  queryRemediationNodeActions,
  queryRemediationWorkflowDetail,
  queryRemediationWorkflowStats,
  queryRemediationWorkflowStatus,
  resolveRemediationNodeAgents,
} from "../api"
import {
  MOCK_ACTION_OPTIONS,
  MOCK_DETAIL,
  MOCK_EXECUTION,
  MOCK_NODES,
  MOCK_REMEDIATION_ACTION,
  MOCK_STATS,
  MOCK_WORKFLOW,
} from "../mock"
import type {
  RemediationActionInput,
  RemediationActionOption,
  RemediationCandidateNode,
  RemediationExecutionSnapshot,
  RemediationExecutionStats,
  RemediationOrchestrationContext,
  RemediationPreviewSnapshot,
  RemediationPreviewStats,
  RemediationPreviewTargetInput,
  RemediationWorkflowDetail,
  RemediationWorkflowStats,
  RemediationWorkflowStatsItem,
  ResolveRemediationNodeAgentsResponse,
} from "../types"

const RESPONSE_TIMEZONE = "Asia/Shanghai"
const PAGE_SOURCE = "remediation_orchestration_page"
const RESPONDING_STATUS: AttackWorkflowStatus = "responding"
const RUNNING_EXECUTION_STATUSES = new Set(["created", "dispatched"])

const STATUS_LABELS: Record<string, string> = {
  detected: "已发现",
  investigating: "调查中",
  confirmed: "已确认",
  forensics: "取证中",
  responding: "处置中",
  contained: "已遏制",
  remediated: "已处置",
  closed: "已关闭",
  pending: "等待中",
  running: "运行中",
  success: "成功",
  failed: "失败",
  skipped: "已跳过",
  created: "已创建",
  dispatched: "已下发",
  confirmed_preview: "已确认",
  canceled: "已取消",
  expired: "已过期",
  ready: "就绪",
  partial: "部分可执行",
  blocked: "阻断",
  resolved: "已解析",
  ambiguous: "多 Agent",
  unresolvable: "不可解析",
}

const ACTION_LABELS: Record<string, string> = {
  "file.quarantine": "隔离文件",
  "file.restore": "恢复文件",
  "process.terminate": "终止进程",
  "process.force_terminate": "强制终止",
  "process.block_execute": "阻断执行",
  "process.bypass_execute": "放行执行",
  "net.block": "阻断网络",
  "net.bypass": "放行网络",
}

function canonicalRemediationAction(
  actions: AttackWorkflowActionItem[],
  caseId: string,
) {
  const normalizedCaseId = caseId.trim()
  return (
    actions.find((action) => {
      const actionPhase = action.action_phase.trim().toLowerCase()
      const targetType = action.target_type.trim().toLowerCase()
      const actionType = action.action_type.trim().toLowerCase()
      const targetKey = action.target_key.trim()
      return (
        actionPhase === "remediation" &&
        targetType === "case" &&
        actionType === "remediation_orchestration" &&
        !action.action_batch_id.trim() &&
        (!normalizedCaseId || targetKey === normalizedCaseId)
      )
    }) ??
    actions.find(
      (action) => action.action_phase.trim().toLowerCase() === "remediation",
    ) ??
    null
  )
}

function todayDate() {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function monthAgoDate() {
  const now = new Date()
  now.setMonth(now.getMonth() - 1)
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function formatHeaderRefreshTime(value?: Date | null) {
  if (!value) return "--"

  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: RESPONSE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(value)
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "00"

  return `${getPart("year")}-${getPart("month")}-${getPart("day")} ${getPart("hour")}:${getPart("minute")}:${getPart("second")}`
}

function workflowBeforeResponding(status: string) {
  const normalized = normalizeWorkflowStatus(status)
  return Boolean(
    normalized &&
      workflowStatusIndex(normalized) >= 0 &&
      workflowStatusIndex(normalized) < workflowStatusIndex(RESPONDING_STATUS),
  )
}

function statusLabel(status: string | number | undefined) {
  const normalized =
    typeof status === "number"
      ? String(status)
      : String(status ?? "").trim().toLowerCase()
  return STATUS_LABELS[normalized] ?? String(status ?? "-")
}

function statusTone(status: string | number | undefined) {
  const normalized = String(status ?? "").trim().toLowerCase()
  if (["success", "ready", "resolved", "confirmed", "confirmed_preview", "remediated"].includes(normalized)) {
    return "emerald"
  }
  if (["failed", "blocked", "unresolvable", "canceled", "expired"].includes(normalized)) {
    return "red"
  }
  if (["created", "dispatched", "running", "pending", "ambiguous", "partial", "responding"].includes(normalized)) {
    return "amber"
  }
  if (["closed", "skipped"].includes(normalized)) return "slate"
  return "blue"
}

function toneClasses(tone: string) {
  switch (tone) {
    case "emerald":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "red":
      return "border-red-200 bg-red-50 text-red-700"
    case "amber":
      return "border-amber-200 bg-amber-50 text-amber-700"
    case "slate":
      return "border-slate-200 bg-slate-50 text-slate-600"
    default:
      return "border-sky-200 bg-sky-50 text-sky-700"
  }
}

function formatExecutionTime(value: string) {
  return formatWorkflowTime(value)
}

function actionLabel(actionCode: string) {
  return ACTION_LABELS[actionCode] ?? actionCode
}

function actionInputFor(actionCode: string): RemediationActionInput | undefined {
  switch (actionCode) {
    case "file.quarantine":
      return { file_quarantine: { delete_original: true, encrypt: true } }
    case "process.terminate":
    case "process.force_terminate":
      return { process_terminate: { include_self: true, include_children: true } }
    case "process.block_execute":
    case "process.bypass_execute":
      return { process_block: { audit: true } }
    case "net.block":
    case "net.bypass":
      return { net_block: { direction: "out" } }
    default:
      return undefined
  }
}

function nodeIcon(entityType: string): ComponentType<{ className?: string }> {
  const normalized = entityType.trim().toLowerCase()
  if (normalized.includes("file")) return FileWarning
  if (normalized.includes("process")) return TerminalSquare
  if (normalized.includes("net") || normalized.includes("dns") || normalized.includes("url")) {
    return Network
  }
  return Square
}

function statsTotal(stats: RemediationWorkflowStats | null) {
  return stats?.summary.preview_stats.total_count ?? 0
}

function targetTotal(stats: RemediationWorkflowStats | null) {
  return stats?.summary.execution_stats.total_count ?? 0
}

function buildStatsSummary(item: RemediationWorkflowStatsItem) {
  const execution = item.stats.execution_stats
  if (!item.execution_id) return "未确认执行"
  return `${execution.success_count} success / ${execution.failed_count} failed / ${execution.skipped_count} skipped`
}

function isMockContext(context: RemediationOrchestrationContext) {
  return !context.case_id?.trim() && !context.workflow_id?.trim()
}

function readDetailExecution(
  detail: RemediationWorkflowDetail | null,
  fallback: RemediationExecutionSnapshot | null,
) {
  return detail?.execution ?? fallback
}

function statusBadge(status: string | number | undefined, className?: string) {
  const tone = statusTone(status)
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 rounded-full px-2.5 text-[11px] font-medium",
        toneClasses(tone),
        className,
      )}
    >
      {statusLabel(status)}
    </Badge>
  )
}

function HeaderMeta({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: "green" | "amber" | "blue"
}) {
  return (
    <div
      className={cn(
        "flex h-12 min-w-0 flex-col justify-center rounded-full border px-4",
        accent === "green"
          ? "border-emerald-500/20 bg-emerald-500/10"
          : accent === "amber"
            ? "border-amber-500/20 bg-amber-500/10"
            : accent === "blue"
              ? "border-sky-500/20 bg-sky-500/10"
              : "border-slate-200 bg-slate-50",
      )}
    >
      <div
        className={cn(
          "truncate text-[11px] font-medium",
          accent === "green"
            ? "text-emerald-600"
            : accent === "amber"
              ? "text-amber-600"
              : accent === "blue"
                ? "text-sky-600"
                : "text-slate-400",
        )}
      >
        {label}
      </div>
      <div className="mt-0.5 truncate font-mono text-xs font-medium text-slate-700" title={value}>
        {value || "-"}
      </div>
    </div>
  )
}

function InterfaceCard({
  step,
  title,
  endpoint,
  children,
  tone = "blue",
}: {
  step: string
  title: string
  endpoint: string
  children: ReactNode
  tone?: "blue" | "green" | "amber" | "slate"
}) {
  const dotClass =
    tone === "green"
      ? "bg-emerald-500"
      : tone === "amber"
        ? "bg-amber-500"
        : tone === "slate"
          ? "bg-slate-500"
          : "bg-sky-500"
  const boxClass =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50/80"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50/80"
        : tone === "slate"
          ? "border-slate-200 bg-slate-50/80"
          : "border-sky-200 bg-sky-50/80"

  return (
    <div className={cn("rounded-2xl border p-4", boxClass)}>
      <div className="flex items-start gap-3">
        <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white", dotClass)}>
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 truncate font-mono text-[11px] text-slate-500" title={endpoint}>
            {endpoint}
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-1.5 font-mono text-[11px] leading-5 text-slate-600">
        {children}
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  tone = "slate",
}: {
  label: string
  value: ReactNode
  tone?: "slate" | "green" | "red" | "amber" | "blue"
}) {
  const valueClass =
    tone === "green"
      ? "text-emerald-600"
      : tone === "red"
        ? "text-red-600"
        : tone === "amber"
          ? "text-amber-600"
          : tone === "blue"
            ? "text-sky-600"
            : "text-slate-900"
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className={cn("mt-1 text-2xl font-semibold tabular-nums", valueClass)}>{value}</div>
    </div>
  )
}

function ProgressBar({
  stats,
}: {
  stats: RemediationExecutionStats
}) {
  const total = Math.max(stats.total_count, 1)
  const segments = [
    { value: stats.success_count, className: "bg-emerald-500" },
    { value: stats.failed_count, className: "bg-red-500" },
    { value: stats.dispatched_count + stats.created_count, className: "bg-sky-500" },
    { value: stats.skipped_count, className: "bg-slate-300" },
  ]
  return (
    <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">
      {segments.map((segment, index) => (
        <span
          key={index}
          className={segment.className}
          style={{ width: `${(segment.value / total) * 100}%` }}
        />
      ))}
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
      <Icon className="size-8 text-slate-300" />
      <div className="mt-3 text-sm font-medium text-slate-700">{title}</div>
      <div className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{description}</div>
    </div>
  )
}

function normalizeNodeFromContext(context: RemediationOrchestrationContext): RemediationCandidateNode | null {
  const nodeKey = context.node_key?.trim()
  if (!nodeKey) return null
  const entityType = context.entity_type?.trim() || "File"
  const displayName = context.display_name?.trim() || nodeKey
  const agentId = context.workflow_id ? "" : MOCK_WORKFLOW.primary_agent_id
  return {
    node_key: nodeKey,
    entity_type: entityType,
    display_name: displayName,
    description: "来自图谱入口参数",
    resolve_status: agentId ? "resolved" : "unresolved",
    agent_ids: agentId ? [agentId] : [],
    snapshot:
      entityType.toLowerCase().includes("process")
        ? { process: { process_name: displayName, command_line: displayName } }
        : entityType.toLowerCase().includes("net")
          ? { network: { remote_address: displayName, protocol: "tcp" } }
          : { file: { file_path: displayName } },
  }
}

export function RemediationOrchestrationPage({
  context,
}: {
  context: RemediationOrchestrationContext
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [workflow, setWorkflow] = useState<AttackWorkflowItem | null>(null)
  const [action, setAction] = useState<AttackWorkflowActionItem | null>(null)
  const [stats, setStats] = useState<RemediationWorkflowStats | null>(null)
  const [detail, setDetail] = useState<RemediationWorkflowDetail | null>(null)
  const [execution, setExecution] = useState<RemediationExecutionSnapshot | null>(null)
  const [preview, setPreview] = useState<RemediationPreviewSnapshot | null>(null)
  const [nodes, setNodes] = useState<RemediationCandidateNode[]>(MOCK_NODES)
  const [selectedNodeKey, setSelectedNodeKey] = useState(MOCK_NODES[0]?.node_key ?? "")
  const [actionOptions, setActionOptions] = useState<RemediationActionOption[]>(MOCK_ACTION_OPTIONS)
  const [selectedActionCode, setSelectedActionCode] = useState(MOCK_ACTION_OPTIONS[0]?.action_code ?? "")
  const [agentResolve, setAgentResolve] = useState<ResolveRemediationNodeAgentsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [working, setWorking] = useState("")
  const [error, setError] = useState("")
  const [mockMode, setMockMode] = useState(isMockContext(context))
  const [headerCaseInput, setHeaderCaseInput] = useState(context.case_id?.trim() || "")
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null)
  const [startTime] = useState(monthAgoDate)
  const [endTime] = useState(todayDate)

  const routeCaseId = context.case_id?.trim() || ""
  const routeWorkflowId = context.workflow_id?.trim() || ""
  const routeActionId = context.workflow_action_id?.trim() || ""
  const tenantId = context.tenant_id?.trim() || ""
  const currentCaseId = workflow?.case_id || routeCaseId || MOCK_WORKFLOW.case_id
  const currentWorkflowId = workflow?.workflow_id || routeWorkflowId || MOCK_WORKFLOW.workflow_id
  const currentActionId = action?.workflow_action_id || routeActionId || MOCK_REMEDIATION_ACTION.workflow_action_id
  const scopeType = context.scope_type?.trim() || "case"
  const scopeId = context.scope_id?.trim() || currentCaseId
  const sourceType = context.source_type?.trim() || "case_graph"
  const workflowClosed = normalizeWorkflowStatus(workflow?.status ?? "") === "closed"
  const selectedNode = nodes.find((node) => node.node_key === selectedNodeKey) ?? nodes[0]
  const selectedAction =
    actionOptions.find((option) => option.action_code === selectedActionCode) ??
    actionOptions[0]
  const detailExecution = readDetailExecution(detail, execution)

  const statsItems = useMemo(() => stats?.items ?? [], [stats])
  const latestItem = statsItems[0]

  const refreshStats = useCallback(
    async ({
      actionId,
      caseId,
      workflowId,
      useMockFallback,
    }: {
      actionId: string
      caseId: string
      workflowId: string
      useMockFallback: boolean
    }) => {
      if (!actionId && !workflowId && !caseId) {
        setStats(MOCK_STATS)
        setDetail(MOCK_DETAIL)
        setExecution(MOCK_EXECUTION)
        return
      }

      try {
        const nextStats = await queryRemediationWorkflowStats({
          tenant_id: tenantId,
          workflow_action_id: actionId,
          workflow_id: workflowId,
          case_id: caseId,
          start_time: startTime,
          end_time: endTime,
          timezone: RESPONSE_TIMEZONE,
        })
        setStats(nextStats)

        const first = nextStats.items[0]
        if (first?.execution_id || first?.preview_id) {
          const nextDetail = await queryRemediationWorkflowDetail({
            tenant_id: tenantId,
            execution_id: first.execution_id,
            preview_id: first.execution_id ? undefined : first.preview_id,
          })
          setDetail(nextDetail)
          setExecution(nextDetail.execution)
        } else {
          setDetail(null)
          setExecution(null)
        }
      } catch (err) {
        if (!useMockFallback) throw err
        setMockMode(true)
        setStats(MOCK_STATS)
        setDetail(MOCK_DETAIL)
        setExecution(MOCK_EXECUTION)
      }
    },
    [endTime, startTime, tenantId],
  )

  const loadPage = useCallback(
    async (refreshingOnly = false) => {
      if (refreshingOnly) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError("")

      try {
        const demoMode = isMockContext(context)
        let nextWorkflow: AttackWorkflowItem | null = null
        let nextActions: AttackWorkflowActionItem[] = []

        if (!demoMode) {
          const detailResult = routeWorkflowId
            ? await getAttackWorkflow({
                tenantId,
                workflowId: routeWorkflowId,
                includeActions: true,
                includeEvents: false,
              })
            : routeCaseId
              ? await getAttackWorkflowByCaseId({
                  tenantId,
                  caseId: routeCaseId,
                  includeActions: true,
                  includeEvents: false,
                })
              : null

          nextWorkflow = detailResult?.workflow ?? null
          nextActions = detailResult?.actions ?? []
        }

        if (!nextWorkflow) {
          setMockMode(true)
          nextWorkflow = {
            ...MOCK_WORKFLOW,
            case_id: routeCaseId || MOCK_WORKFLOW.case_id,
            root_id: routeCaseId || MOCK_WORKFLOW.root_id,
            workflow_id: routeWorkflowId || MOCK_WORKFLOW.workflow_id,
          }
          nextActions = [MOCK_REMEDIATION_ACTION]
        } else {
          setMockMode(false)
        }

        const nextCaseId = nextWorkflow.case_id || routeCaseId
        const routeAction = routeActionId
          ? nextActions.find((item) => item.workflow_action_id === routeActionId) ?? null
          : null
        const nextAction =
          routeAction ?? canonicalRemediationAction(nextActions, nextCaseId)

        setWorkflow(nextWorkflow)
        setAction(
          nextAction ??
            (demoMode
              ? {
                  ...MOCK_REMEDIATION_ACTION,
                  workflow_id: nextWorkflow.workflow_id,
                  case_id: nextWorkflow.case_id,
                  target_key: nextWorkflow.case_id,
                }
              : null),
        )

        const contextNode = normalizeNodeFromContext(context)
        if (contextNode) {
          setNodes([contextNode, ...MOCK_NODES])
          setSelectedNodeKey(contextNode.node_key)
        }

        await refreshStats({
          actionId: nextAction?.workflow_action_id || routeActionId,
          caseId: nextCaseId,
          workflowId: nextWorkflow.workflow_id,
          useMockFallback: demoMode,
        })
      } catch (err) {
        setMockMode(true)
        setWorkflow(MOCK_WORKFLOW)
        setAction(MOCK_REMEDIATION_ACTION)
        setStats(MOCK_STATS)
        setDetail(MOCK_DETAIL)
        setExecution(MOCK_EXECUTION)
        setError(err instanceof Error ? err.message : "处置编排数据加载失败，当前展示接口示例数据")
      } finally {
        setRefreshedAt(new Date())
        setLoading(false)
        setRefreshing(false)
      }
    },
    [context, refreshStats, routeActionId, routeCaseId, routeWorkflowId, tenantId],
  )

  useEffect(() => {
    void loadPage(false)
  }, [loadPage])

  useEffect(() => {
    setHeaderCaseInput(routeCaseId || workflow?.case_id || "")
  }, [routeCaseId, workflow?.case_id])

  function submitHeaderCase(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    const nextCaseId = headerCaseInput.trim()
    const current = (routeCaseId || workflow?.case_id || "").trim()

    if (nextCaseId === current) {
      void loadPage(true)
      return
    }

    const params = new URLSearchParams(window.location.search)
    if (nextCaseId) {
      params.set("case_id", nextCaseId)
      params.set("scope_type", "case")
      params.set("scope_id", nextCaseId)
    } else {
      params.delete("case_id")
      params.delete("scope_id")
    }
    params.delete("workflow_id")
    params.delete("workflow_action_id")

    const query = params.toString()
    router.push(`${window.location.pathname}${query ? `?${query}` : ""}`)
  }

  function refreshHeader() {
    const nextCaseId = headerCaseInput.trim()
    const current = (routeCaseId || workflow?.case_id || "").trim()
    if (nextCaseId !== current) {
      submitHeaderCase()
      return
    }
    void loadPage(true)
  }

  async function ensureCanonicalAction() {
    if (action?.workflow_action_id) return action
    if (!workflow?.workflow_id || !currentCaseId || workflowClosed) return null

    setWorking("ensure-action")
    try {
      const created = await createAttackWorkflowAction({
        tenantId,
        workflowId: workflow.workflow_id,
        actionPhase: "remediation",
        targetType: "case",
        targetKey: currentCaseId,
        caseId: currentCaseId,
        actionType: "remediation_orchestration",
        actionStatus: "pending",
        createdBy: PAGE_SOURCE,
      })

      if (!created?.workflow_action_id) {
        throw new Error("后端未返回 workflow_action_id")
      }

      setAction(created)
      toast({ title: "已创建处置阶段 action" })
      return created
    } finally {
      setWorking("")
    }
  }

  async function moveWorkflowToResponding() {
    if (!workflow || workflowClosed || !workflowBeforeResponding(workflow.status)) return workflow
    setWorking("move-responding")
    try {
      const updated = await updateAttackWorkflowStatus({
        tenantId,
        workflowId: workflow.workflow_id,
        status: RESPONDING_STATUS,
        payloadJson: JSON.stringify({
          source: PAGE_SOURCE,
          comment: "enter remediation orchestration",
        }),
      })
      if (updated) {
        setWorkflow(updated)
        toast({ title: "工作流已进入处置阶段" })
        return updated
      }
      return workflow
    } finally {
      setWorking("")
    }
  }

  async function resolveSelectedNode() {
    if (!selectedNode || mockMode) return
    setWorking("resolve-node")
    try {
      const resolved = await resolveRemediationNodeAgents({
        tenant_id: tenantId,
        scope_type: scopeType,
        scope_id: scopeId,
        node_key: selectedNode.node_key,
        entity_type: selectedNode.entity_type,
      })
      setAgentResolve(resolved)
      setNodes((current) =>
        current.map((node) =>
          node.node_key === selectedNode.node_key
            ? {
                ...node,
                resolve_status: resolved.status,
                agent_ids: resolved.agent_ids,
              }
            : node,
        ),
      )
    } catch (err) {
      toast({
        title: "Agent 解析失败",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      })
    } finally {
      setWorking("")
    }
  }

  async function querySelectedNodeActions() {
    if (!selectedNode || mockMode) return
    setWorking("query-actions")
    try {
      const result = await queryRemediationNodeActions({
        tenant_id: tenantId,
        source_type: sourceType,
        scope_type: scopeType,
        scope_id: scopeId,
        node: {
          node_key: selectedNode.node_key,
          entity_type: selectedNode.entity_type,
          agent_ids: selectedNode.agent_ids,
        },
      })
      const actions = result.node.actions
      setActionOptions(actions.length > 0 ? actions : [])
      setSelectedActionCode(actions[0]?.action_code ?? "")
    } catch (err) {
      toast({
        title: "动作查询失败",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      })
    } finally {
      setWorking("")
    }
  }

  function buildPreviewTarget(): RemediationPreviewTargetInput | null {
    if (!selectedNode || !selectedAction) return null
    const agentIds = selectedNode.agent_ids.length > 0 ? selectedNode.agent_ids : agentResolve?.agent_ids ?? []
    if (agentIds.length === 0) return null

    return {
      node_key: selectedNode.node_key,
      entity_type: selectedNode.entity_type,
      action_code: selectedAction.action_code,
      agents: agentIds.map((agentId) => ({
        agent_id: agentId,
        action_context:
          selectedAction.contexts.find((contextItem) => contextItem.agent_id === agentId) ??
          selectedAction.contexts[0],
      })),
      target_display: selectedNode.display_name,
      snapshot: selectedNode.snapshot,
      input: actionInputFor(selectedAction.action_code),
    }
  }

  async function handleCreatePreview() {
    if (workflowClosed) return
    if (mockMode) {
      setPreview(MOCK_DETAIL.preview)
      toast({ title: "演示模式已生成预览示例" })
      return
    }

    const target = buildPreviewTarget()
    if (!target) {
      toast({
        title: "无法创建预览",
        description: "请先选择已解析 Agent 的处置节点和动作",
        variant: "destructive",
      })
      return
    }

    setWorking("create-preview")
    try {
      const ensuredAction = await ensureCanonicalAction()
      if (!ensuredAction?.workflow_action_id) {
        throw new Error("缺少 remediation workflow_action_id，不能创建处置预览")
      }
      await moveWorkflowToResponding()
      const nextPreview = await createRemediationPreview({
        tenant_id: tenantId,
        expire_seconds: 600,
        workflow_id: currentWorkflowId,
        workflow_action_id: ensuredAction.workflow_action_id,
        case_id: currentCaseId,
        source_type: sourceType,
        scope_type: scopeType,
        scope_id: scopeId,
        targets: [target],
      })
      if (!nextPreview?.preview_id) throw new Error("后端未返回 preview_id")
      setPreview(nextPreview)
      toast({ title: "处置预览已创建" })
      await refreshStats({
        actionId: ensuredAction.workflow_action_id,
        caseId: currentCaseId,
        workflowId: currentWorkflowId,
        useMockFallback: false,
      })
    } catch (err) {
      toast({
        title: "创建预览失败",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      })
    } finally {
      setWorking("")
    }
  }

  async function handleConfirmPreview() {
    const previewId = preview?.preview_id || latestItem?.preview_id
    if (!previewId || workflowClosed) return
    if (mockMode) {
      setExecution(MOCK_EXECUTION)
      setDetail(MOCK_DETAIL)
      toast({ title: "演示模式已确认执行示例" })
      return
    }

    setWorking("confirm-preview")
    try {
      const nextExecution = await confirmRemediationPreview({
        tenant_id: tenantId,
        preview_id: previewId,
      })
      if (!nextExecution?.execution_id) throw new Error("后端未返回 execution_id")
      setExecution(nextExecution)
      const nextDetail = await queryRemediationWorkflowDetail({
        tenant_id: tenantId,
        execution_id: nextExecution.execution_id,
      })
      setDetail(nextDetail)
      await refreshStats({
        actionId: currentActionId,
        caseId: currentCaseId,
        workflowId: currentWorkflowId,
        useMockFallback: false,
      })
      toast({ title: "处置预览已确认并下发" })
    } catch (err) {
      toast({
        title: "确认预览失败",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      })
    } finally {
      setWorking("")
    }
  }

  async function handleCancelPreview() {
    const previewId = preview?.preview_id || latestItem?.preview_id
    if (!previewId || workflowClosed) return
    if (mockMode) {
      setPreview(null)
      toast({ title: "演示预览已取消" })
      return
    }

    setWorking("cancel-preview")
    try {
      const nextPreview = await cancelRemediationPreview({
        tenant_id: tenantId,
        preview_id: previewId,
        cancel_reason: "operator canceled from remediation orchestration page",
      })
      setPreview(nextPreview)
      await refreshStats({
        actionId: currentActionId,
        caseId: currentCaseId,
        workflowId: currentWorkflowId,
        useMockFallback: false,
      })
      toast({ title: "处置预览已取消" })
    } catch (err) {
      toast({
        title: "取消预览失败",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      })
    } finally {
      setWorking("")
    }
  }

  async function refreshExecutionStatus() {
    const executionId = detailExecution?.execution_id || latestItem?.execution_id
    const previewId = preview?.preview_id || latestItem?.preview_id
    if (!executionId && !previewId) return
    if (mockMode) {
      setExecution(MOCK_EXECUTION)
      return
    }
    setWorking("refresh-execution")
    try {
      const nextExecution = await queryRemediationWorkflowStatus({
        tenant_id: tenantId,
        execution_id: executionId,
        preview_id: executionId ? undefined : previewId,
      })
      setExecution(nextExecution)
      if (nextExecution?.execution_id) {
        const nextDetail = await queryRemediationWorkflowDetail({
          tenant_id: tenantId,
          execution_id: nextExecution.execution_id,
        })
        setDetail(nextDetail)
      }
    } catch (err) {
      toast({
        title: "执行状态刷新失败",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      })
    } finally {
      setWorking("")
    }
  }

  async function selectBatch(item: RemediationWorkflowStatsItem) {
    if (mockMode) {
      setDetail(MOCK_DETAIL)
      setExecution(MOCK_EXECUTION)
      return
    }
    setWorking(`detail-${item.preview_id}`)
    try {
      const nextDetail = await queryRemediationWorkflowDetail({
        tenant_id: tenantId,
        execution_id: item.execution_id,
        preview_id: item.execution_id ? undefined : item.preview_id,
      })
      setDetail(nextDetail)
      setExecution(nextDetail.execution)
    } catch (err) {
      toast({
        title: "批次详情查询失败",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      })
    } finally {
      setWorking("")
    }
  }

  const canCreatePreview = Boolean(selectedNode && selectedAction && !workflowClosed)
  const canConfirm =
    Boolean(preview?.preview_id || (latestItem?.preview_status === "created" && latestItem.preview_id)) &&
    !workflowClosed

  return (
    <main className="min-h-[calc(100dvh-3rem)] bg-[#f5f8fb] p-4 text-slate-900 xl:p-5">
      <div className="flex w-full min-w-0 flex-col gap-5">
        <header className="w-full rounded-[28px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_12px_34px_rgba(15,23,42,0.08)]">
          <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center">
            <div className="flex min-w-0 items-center gap-4 xl:w-[330px] xl:flex-none 2xl:w-[380px]">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 text-teal-600">
                <Workflow aria-hidden className="h-5 w-5" />
              </div>

              <div className="min-w-0 space-y-1.5">
                <h1 className="line-clamp-2 break-words text-lg font-semibold leading-tight text-slate-950">
                  处置编排
                </h1>
                <p className="min-w-0 truncate text-sm text-slate-500">
                  预览、下发、跟踪处置动作
                </p>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 xl:flex-nowrap xl:justify-end">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 xl:flex-nowrap xl:justify-end">
                <form
                  className="flex h-12 min-w-[260px] flex-1 basis-full items-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 px-4 shadow-inner shadow-slate-200/20 sm:min-w-[320px] lg:basis-[420px] xl:min-w-[360px] xl:basis-auto 2xl:min-w-[520px]"
                  onSubmit={submitHeaderCase}
                >
                  <Search aria-hidden className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    type="search"
                    aria-label="CaseID"
                    value={headerCaseInput}
                    onChange={(event) => setHeaderCaseInput(event.target.value)}
                    placeholder="请输入 CaseID"
                    disabled={loading}
                    className="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </form>

                <span className="hidden h-6 w-px shrink-0 bg-slate-200 xl:block" aria-hidden="true" />

                <div className="flex shrink-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400">
                    <Clock3 aria-hidden className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-slate-400">更新时间</div>
                    <div className="whitespace-nowrap text-sm font-medium tabular-nums text-slate-700">
                      {formatHeaderRefreshTime(refreshedAt)}
                    </div>
                  </div>
                </div>

                <span className="hidden h-6 w-px shrink-0 bg-slate-200 xl:block" aria-hidden="true" />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={refreshHeader}
                  disabled={loading || refreshing}
                  aria-label="刷新"
                  className="h-10 w-10 shrink-0 rounded-full border-0 text-slate-400 shadow-none hover:bg-slate-100 hover:text-slate-600"
                >
                  <RefreshCcw className={cn("h-4 w-4", (loading || refreshing) && "animate-spin")} />
                  <span className="sr-only">刷新</span>
                </Button>

                <Button
                  type="button"
                  disabled={!canCreatePreview || working === "create-preview"}
                  onClick={() => void handleCreatePreview()}
                  className="h-10 shrink-0 rounded-full bg-teal-600 px-4 text-white shadow-sm hover:bg-teal-700"
                >
                  {working === "create-preview" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span>新建预览</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {mockMode || error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div>
              <div className="font-medium">
                {mockMode ? "当前为接口示例视图" : "处置编排数据加载异常"}
              </div>
              <div className="mt-0.5 text-xs leading-5 text-amber-700">
                {error ||
                  "URL 未携带 case_id / workflow_id，页面使用与后端 proto 对齐的示例数据展示结构，不会真实下发处置。"}
              </div>
            </div>
          </div>
        ) : null}

        <section className="grid min-h-[760px] gap-5 xl:grid-cols-[370px_minmax(480px,520px)_minmax(600px,1fr)]">
          <aside className="flex min-h-0 flex-col rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.45)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-950">上下文与接口链路</h2>
                <p className="mt-1 text-sm text-slate-500">
                  初始化必须先拿到 remediation workflow_action_id
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading || refreshing}
                onClick={() => void loadPage(true)}
                className="rounded-xl border-slate-200"
              >
                {refreshing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
              </Button>
            </div>

            <div className="mt-5 space-y-4">
              <InterfaceCard
                step="1"
                title="GetAttackWorkflow"
                endpoint="POST /analysis/attack-workflow/get"
              >
                <div>include_actions=true</div>
                <div>root_type=case / workflow_id</div>
              </InterfaceCard>
              <InterfaceCard
                step="2"
                title="Ensure canonical action"
                endpoint="POST /analysis/attack-workflow/action/create"
                tone="green"
              >
                <div>action_phase=remediation</div>
                <div>target_type=case · action_batch_id=""</div>
                <div>action_type=remediation_orchestration</div>
              </InterfaceCard>
              <InterfaceCard
                step="3"
                title="Move to responding"
                endpoint="POST /analysis/attack-workflow/status/update"
                tone="amber"
              >
                <div>status=responding</div>
                <div>occurred_at=YYYY-MM-DD HH:mm:ss</div>
              </InterfaceCard>
            </div>

            <div className="mt-6 flex min-h-0 flex-1 flex-col">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">可处置节点</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    source_type={sourceType} · scope_type={scopeType}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!selectedNode || mockMode || working === "resolve-node"}
                  onClick={() => void resolveSelectedNode()}
                  className="rounded-xl border-slate-200"
                >
                  {working === "resolve-node" ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                  解析
                </Button>
              </div>

              <div className="mt-4 space-y-3">
                {nodes.map((node) => {
                  const Icon = nodeIcon(node.entity_type)
                  const active = node.node_key === selectedNodeKey
                  return (
                    <button
                      key={node.node_key}
                      type="button"
                      onClick={() => {
                        setSelectedNodeKey(node.node_key)
                        setActionOptions(MOCK_ACTION_OPTIONS.filter((option) => {
                          const entity = node.entity_type.toLowerCase()
                          if (entity.includes("file")) return option.action_code.startsWith("file.")
                          if (entity.includes("process")) return option.action_code.startsWith("process.")
                          if (entity.includes("net")) return option.action_code.startsWith("net.")
                          return true
                        }))
                        const next = MOCK_ACTION_OPTIONS.find((option) => {
                          const entity = node.entity_type.toLowerCase()
                          if (entity.includes("file")) return option.action_code.startsWith("file.")
                          if (entity.includes("process")) return option.action_code.startsWith("process.")
                          if (entity.includes("net")) return option.action_code.startsWith("net.")
                          return true
                        })
                        setSelectedActionCode(next?.action_code ?? "")
                      }}
                      className={cn(
                        "group w-full rounded-2xl border p-3 text-left transition-colors duration-200",
                        active
                          ? "border-sky-300 bg-sky-50"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 group-hover:bg-white">
                          <Icon className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">{node.entity_type}</span>
                            {statusBadge(node.resolve_status)}
                          </div>
                          <div className="mt-1 truncate text-xs text-slate-500" title={node.display_name}>
                            {node.display_name}
                          </div>
                          <div className="mt-1 truncate font-mono text-[11px] text-slate-400" title={node.description}>
                            {node.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </aside>

          <section className="flex min-h-0 flex-col rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.45)]">
            <div>
              <h2 className="text-base font-semibold text-slate-950">动作选择与处置预览</h2>
              <p className="mt-1 text-sm text-slate-500">
                Graph 解析 Agent，Workflow 查询动作并创建 preview
              </p>
            </div>

            <div className="mt-5 space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">ResolveRemediationNodeAgents</div>
                    <div className="mt-1 font-mono text-[11px] text-slate-500">
                      POST /graph/remediation/node-agents/resolve
                    </div>
                  </div>
                  {statusBadge(agentResolve?.status || selectedNode?.resolve_status || "pending")}
                </div>
                <div className="mt-4 grid gap-3 text-xs text-slate-600 sm:grid-cols-2">
                  <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
                    <div className="text-slate-400">scope</div>
                    <div className="mt-1 truncate font-mono">{scopeType} / {scopeId}</div>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
                    <div className="text-slate-400">agent_ids</div>
                    <div className="mt-1 truncate font-mono">
                      {(selectedNode?.agent_ids ?? []).join(" / ") || "-"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">QueryRemediationNodeActions</div>
                    <div className="mt-1 font-mono text-[11px] text-slate-500">
                      POST /workflow/remediation/node/actions/query
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!selectedNode || mockMode || working === "query-actions"}
                    onClick={() => void querySelectedNodeActions()}
                    className="rounded-xl border-sky-200 bg-white"
                  >
                    {working === "query-actions" ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                    查询
                  </Button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {actionOptions.length > 0 ? (
                    actionOptions.map((option) => {
                      const active = option.action_code === selectedActionCode
                      return (
                        <button
                          type="button"
                          key={option.action_code}
                          onClick={() => setSelectedActionCode(option.action_code)}
                          className={cn(
                            "rounded-2xl border bg-white px-3 py-3 text-left transition-colors duration-200",
                            active
                              ? "border-sky-400 ring-2 ring-sky-100"
                              : "border-sky-100 hover:border-sky-300",
                          )}
                        >
                          <div className="font-mono text-xs text-slate-900">{option.action_code}</div>
                          <div className="mt-1 text-[11px] text-slate-500">
                            {actionLabel(option.action_code)} · snapshot={String(option.required_snapshot_kind || "-").toLowerCase()}
                          </div>
                        </button>
                      )
                    })
                  ) : (
                    <EmptyState
                      icon={Ban}
                      title="当前节点没有可用动作"
                      description="请检查节点类型、Agent 解析结果，或确认后端 QueryRemediationNodeActions 返回内容"
                    />
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">CreateRemediationPreview</div>
                    <div className="mt-1 font-mono text-[11px] text-slate-500">
                      POST /workflow/remediation/preview
                    </div>
                  </div>
                  {preview ? statusBadge(preview.preview_status || "created") : statusBadge("pending")}
                </div>
                <div className="mt-4 space-y-1.5 font-mono text-[11px] leading-5 text-slate-600">
                  <div>workflow_id={currentWorkflowId}</div>
                  <div>workflow_action_id={currentActionId}</div>
                  <div>case_id={currentCaseId}</div>
                  <div>source_type={sourceType} · scope_type={scopeType}</div>
                  <div>targets[].input={selectedActionCode ? Object.keys(actionInputFor(selectedActionCode) ?? {}).join(",") || "default" : "-"}</div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-emerald-100">
                    <div className="text-[11px] text-slate-400">preview_id</div>
                    <div className="mt-1 truncate font-mono text-xs text-slate-700">
                      {preview?.preview_id || latestItem?.preview_id || "-"}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-emerald-100">
                    <div className="text-[11px] text-slate-400">plan_status</div>
                    <div className="mt-1 text-xs text-emerald-700">
                      {statusLabel(preview?.plan_status || "ready")}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-emerald-100">
                    <div className="text-[11px] text-slate-400">summary</div>
                    <div className="mt-1 truncate text-xs text-slate-700">
                      {selectedNode?.agent_ids.length || 0} agent · {selectedActionCode || "-"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  disabled={!canCreatePreview || working === "create-preview"}
                  onClick={() => void handleCreatePreview()}
                  className="h-[72px] justify-between rounded-2xl bg-slate-950 px-5 text-white hover:bg-slate-800"
                >
                  <span className="flex flex-col items-start">
                    <span className="text-sm font-semibold">Create Preview</span>
                    <span className="mt-1 font-mono text-[11px] text-slate-300">POST /preview</span>
                  </span>
                  {working === "create-preview" ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canConfirm || working === "confirm-preview"}
                  onClick={() => void handleConfirmPreview()}
                  className="h-[72px] justify-between rounded-2xl border-slate-200 bg-white px-5 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <span className="flex flex-col items-start">
                    <span className="text-sm font-semibold">Confirm Preview</span>
                    <span className="mt-1 font-mono text-[11px] text-slate-400">POST /preview/confirm</span>
                  </span>
                  {working === "confirm-preview" ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canConfirm || working === "cancel-preview"}
                  onClick={() => void handleCancelPreview()}
                  className="h-11 rounded-2xl border-slate-200 bg-white hover:bg-red-50 hover:text-red-700 sm:col-span-2"
                >
                  {working === "cancel-preview" ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}
                  Cancel Preview
                </Button>
              </div>
            </div>
          </section>

          <section className="flex min-h-0 flex-col rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.45)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-950">
                  执行批次、目标明细与聚合回写
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  按 workflow_action_id 查询全部批次，按 execution_id 查看明细
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!latestItem || working === "refresh-execution"}
                onClick={() => void refreshExecutionStatus()}
                className="rounded-xl border-slate-200"
              >
                {working === "refresh-execution" ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
                执行状态
              </Button>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">QueryRemediationWorkflowStats</div>
                  <div className="mt-1 font-mono text-[11px] text-slate-500">
                    POST /workflow/remediation/stats/query
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div className="text-[11px] text-slate-400">summary</div>
                  <div className="mt-1 flex items-end gap-2">
                    <span className="text-2xl font-semibold text-emerald-600">{statsTotal(stats)}</span>
                    <span className="pb-1 text-xs text-slate-500">batches</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <Metric label="Targets" value={targetTotal(stats)} tone="blue" />
                <Metric label="Success" value={stats?.summary.execution_stats.success_count ?? 0} tone="green" />
                <Metric label="Failed" value={stats?.summary.execution_stats.failed_count ?? 0} tone="red" />
                <Metric label="Running" value={(stats?.summary.execution_stats.created_count ?? 0) + (stats?.summary.execution_stats.dispatched_count ?? 0)} tone="amber" />
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div className="text-sm font-semibold text-slate-900">处置批次列表</div>
                <div className="font-mono text-[11px] text-slate-400">preview_status / execute_status</div>
              </div>
              <div className="divide-y divide-slate-100">
                {statsItems.length > 0 ? (
                  statsItems.map((item) => {
                    const active =
                      item.execution_id === detailExecution?.execution_id ||
                      item.preview_id === detail?.preview_id
                    const running = RUNNING_EXECUTION_STATUSES.has(item.execute_status)
                    return (
                      <button
                        type="button"
                        key={item.preview_id}
                        onClick={() => void selectBatch(item)}
                        className={cn(
                          "grid w-full gap-3 px-4 py-3 text-left transition-colors duration-200 md:grid-cols-[98px_108px_1fr_96px_150px]",
                          active ? "bg-sky-50" : "hover:bg-slate-50",
                        )}
                      >
                        <span className="truncate font-mono text-xs text-slate-700">{item.preview_id}</span>
                        <span className="truncate font-mono text-xs text-slate-700">{item.execution_id || "-"}</span>
                        <span className="truncate text-xs text-slate-600">
                          {item.source_type} · {item.scope_type}
                        </span>
                        <span>{statusBadge(item.execute_status || item.preview_status)}</span>
                        <span className="truncate font-mono text-[11px] text-slate-400">
                          {running ? "polling" : buildStatsSummary(item)}
                        </span>
                      </button>
                    )
                  })
                ) : (
                  <div className="p-4">
                    <EmptyState
                      icon={DatabaseZap}
                      title="暂无处置批次"
                      description="创建 preview 并确认执行后，这里会按 workflow_action_id 汇总展示全部处置批次"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">QueryRemediationWorkflowDetail</div>
                  <div className="mt-1 font-mono text-[11px] text-slate-500">
                    POST /workflow/remediation/detail/query · execution_id={detailExecution?.execution_id || "-"}
                  </div>
                </div>
                {detailExecution ? statusBadge(detailExecution.execute_status) : null}
              </div>

              {detailExecution ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-sky-100 bg-white">
                  <div className="grid grid-cols-[58px_110px_120px_116px_1fr] border-b border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-400">
                    <span>target</span>
                    <span>agent</span>
                    <span>action_type</span>
                    <span>status</span>
                    <span>task / pmc object</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {detailExecution.targets.map((target) => (
                      <div
                        key={`${target.target_index}-${target.agent_id}-${target.action_type}`}
                        className="grid grid-cols-[58px_110px_120px_116px_1fr] items-center px-3 py-3 text-xs"
                      >
                        <span className="font-mono text-slate-700">#{target.target_index}</span>
                        <span className="truncate font-mono text-slate-600">{target.agent_id}</span>
                        <span className="truncate font-mono text-slate-600">{target.action_type}</span>
                        <span>{statusBadge(target.execute_status)}</span>
                        <span className="truncate font-mono text-slate-500" title={target.execute_task_id || target.pmc_object_id || target.error_msg}>
                          {target.execute_task_id || target.pmc_object_id || target.error_msg || "-"}
                        </span>
                      </div>
                    ))}
                  </div>
                  {detailExecution.targets.some((target) => target.error_msg) ? (
                    <div className="border-t border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      error_msg: {detailExecution.targets.find((target) => target.error_msg)?.error_msg}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-4">
                  <EmptyState
                    icon={FileCode2}
                    title="未选择执行批次"
                    description="选择已确认的 preview 或刷新执行状态后，这里显示 execution target 明细"
                  />
                </div>
              )}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <GitBranch className="size-4 text-emerald-600" />
                  Aggregate Backwrite
                </div>
                <div className="mt-3 space-y-1.5 font-mono text-[11px] leading-5 text-slate-600">
                  <div>Control outbox -&gt; Analysis</div>
                  <div>SyncAttackWorkflowActionResult</div>
                  <div>result_type=remediation</div>
                </div>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Route className="size-4 text-amber-600" />
                  Action Aggregation
                </div>
                <div className="mt-3 space-y-1.5 font-mono text-[11px] leading-5 text-slate-600">
                  <div>workflow_action_id 全量 target 聚合</div>
                  <div>any created/dispatched -&gt; running</div>
                  <div>latest batch -&gt; success / failed / skipped</div>
                </div>
              </div>
            </div>
          </section>
        </section>

        <section className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[17px] border border-slate-200 bg-white px-5 py-3 text-xs text-slate-500">
          <span className="font-medium text-slate-600">状态口径:</span>
          <span className="font-mono">
            workflow: detected -&gt; investigating -&gt; forensics -&gt; responding -&gt; contained -&gt; remediated -&gt; closed
          </span>
          <span className="font-medium text-slate-600">页面主流程:</span>
          <span className="font-mono">发现 -&gt; 调查 -&gt; 取证 -&gt; 处置 -&gt; 关闭</span>
          <span className="font-medium text-slate-600">只读条件:</span>
          <span className="font-mono">workflow.status=closed</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push("/frame/attack/workflow")}
            className="ml-auto rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <Workflow className="size-4" />
            返回工作流
          </Button>
        </section>
      </div>
      {loading ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/55 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-lg">
            <Loader2 className="size-4 animate-spin text-sky-500" />
            正在加载处置编排上下文
          </div>
        </div>
      ) : null}
    </main>
  )
}
