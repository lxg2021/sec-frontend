"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react"
import { useTranslations } from "next-intl"
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock3,
  FileText,
  GitBranch,
  History,
  Loader2,
  PlayCircle,
  RefreshCw,
  Route,
  ShieldCheck,
  ShieldQuestion,
  UserRound,
} from "lucide-react"

import {
  getAttackWorkflow,
  getAttackWorkflowByCaseId,
  updateAttackWorkflowStatus,
} from "@/features/attack/workflow/api"
import {
  ATTACK_WORKFLOW_CLOSE_REASONS,
  ATTACK_WORKFLOW_STATUSES,
  type AttackWorkflowCloseReason,
} from "@/features/attack/workflow/constants"
import type {
  AttackWorkflowActionItem,
  AttackWorkflowDetail,
  AttackWorkflowEventItem,
  AttackWorkflowItem,
  AttackWorkflowStatus,
} from "@/features/attack/workflow/types"
import {
  buildWorkflowStatusPayloadJson,
  formatWorkflowTime,
  getAllowedWorkflowTransitions,
  getRecommendedNextWorkflowStatus,
  isAttackWorkflowStatus,
  normalizeWorkflowStatus,
  workflowEventComment,
  workflowEventTime,
  workflowStatusIndex,
  workflowStatusTime,
} from "@/features/attack/workflow/utils"
import { cn } from "@/shared/lib/utils"
import { toast } from "@/shared/hooks/use-toast"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { Textarea } from "@/shared/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip"

export interface AttackWorkflowClosurePanelProps {
  caseId?: string
  workflowId?: string
  tenantId?: string
  includeActions?: boolean
  includeEvents?: boolean
  compact?: boolean
  className?: string
  onWorkflowUpdated?: (workflow: AttackWorkflowItem) => void
}

function displayValue(value: string) {
  return value.trim() || "-"
}

function compactList(values: string[], limit = 4) {
  const normalized = values.map((value) => value.trim()).filter(Boolean)
  if (normalized.length === 0) return "-"
  const visible = normalized.slice(0, limit)
  const hidden = normalized.length - visible.length
  return hidden > 0 ? `${visible.join(", ")} +${hidden}` : visible.join(", ")
}

function statusTone(status: string) {
  switch (status) {
    case "closed":
      return "border-slate-300 bg-slate-100 text-slate-700"
    case "remediated":
    case "contained":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "responding":
    case "forensics":
      return "border-blue-200 bg-blue-50 text-blue-700"
    case "confirmed":
      return "border-amber-200 bg-amber-50 text-amber-700"
    case "investigating":
      return "border-cyan-200 bg-cyan-50 text-cyan-700"
    case "detected":
      return "border-rose-200 bg-rose-50 text-rose-700"
    default:
      return "border-slate-200 bg-slate-50 text-slate-600"
  }
}

function actionStatusTone(status: string) {
  switch (status) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "failed":
      return "border-rose-200 bg-rose-50 text-rose-700"
    case "running":
      return "border-blue-200 bg-blue-50 text-blue-700"
    case "skipped":
      return "border-slate-200 bg-slate-50 text-slate-600"
    default:
      return "border-amber-200 bg-amber-50 text-amber-700"
  }
}

const KNOWN_ACTION_STATUSES = [
  "pending",
  "running",
  "success",
  "failed",
  "skipped",
] as const

function knownActionStatus(status: string) {
  return KNOWN_ACTION_STATUSES.includes(status as (typeof KNOWN_ACTION_STATUSES)[number])
    ? status as (typeof KNOWN_ACTION_STATUSES)[number]
    : ""
}

function StatusPill({
  label,
  status,
}: {
  label: string
  status: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-7 shrink-0 rounded-full px-2.5 text-xs font-semibold",
        statusTone(status),
      )}
    >
      {label}
    </Badge>
  )
}

function MetaItem({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="min-w-0">
      <div className="text-xs font-medium leading-5 text-slate-400">{label}</div>
      <div
        className={cn(
          "mt-0.5 truncate text-sm font-semibold leading-5 text-slate-800",
          mono && "font-mono text-xs",
        )}
        title={value || "-"}
      >
        {displayValue(value)}
      </div>
    </div>
  )
}

function IdChip({ value }: { value: string }) {
  return (
    <span
      className="inline-flex max-w-full items-center rounded-md border border-sky-100 bg-sky-50/80 px-2 py-1 font-mono text-xs font-semibold leading-4 text-sky-700"
      title={value}
    >
      <span className="min-w-0 truncate">{displayValue(value)}</span>
    </span>
  )
}

function WorkflowLoadingState({ className }: { className?: string }) {
  const t = useTranslations("pages.attack.dashboard.workflow")

  return (
    <Card className={cn("overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm", className)}>
      <CardHeader className="border-b border-slate-200 px-6 py-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Loader2 className="size-5 animate-spin" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-lg font-semibold text-slate-950">
              {t("loadingTitle")}
            </CardTitle>
            <CardDescription>{t("loadingDescription")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-6 py-5">
        <div className="h-8 w-64 rounded-lg bg-slate-100" />
        <div className="grid gap-3 md:grid-cols-4">
          <div className="h-16 rounded-lg bg-slate-100" />
          <div className="h-16 rounded-lg bg-slate-100" />
          <div className="h-16 rounded-lg bg-slate-100" />
          <div className="h-16 rounded-lg bg-slate-100" />
        </div>
      </CardContent>
    </Card>
  )
}

function WorkflowStateMessage({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
  action?: ReactNode
  className?: string
}) {
  return (
    <Card className={cn("overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm", className)}>
      <CardHeader className="border-b border-slate-200 px-6 py-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-100">
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-lg font-semibold text-slate-950">
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      {action ? (
        <CardContent className="flex justify-end px-6 py-4">{action}</CardContent>
      ) : null}
    </Card>
  )
}

function WorkflowStatusStepper({
  workflow,
  statusLabel,
}: {
  workflow: AttackWorkflowItem
  statusLabel: (status: string) => string
}) {
  const t = useTranslations("pages.attack.dashboard.workflow")
  const currentIndex = workflowStatusIndex(workflow.status)

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50/70">
      <div className="grid min-w-[980px] grid-cols-8">
        {ATTACK_WORKFLOW_STATUSES.map((status, index) => {
          const current = workflow.status === status
          const time = workflowStatusTime(workflow, status)
          const reached = current || Boolean(time) || (currentIndex >= 0 && index < currentIndex)
          const Icon = current ? PlayCircle : reached ? CheckCircle2 : Circle

          return (
            <div
              key={status}
              className={cn(
                "relative min-w-0 border-r border-slate-200 px-3 py-3 last:border-r-0",
                current && "bg-white shadow-sm",
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border bg-white",
                    current
                      ? "border-blue-200 text-blue-600"
                      : reached
                        ? "border-emerald-200 text-emerald-600"
                        : "border-slate-200 text-slate-300",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <div
                    className={cn(
                      "truncate text-sm font-semibold leading-5",
                      current ? "text-blue-700" : reached ? "text-slate-800" : "text-slate-400",
                    )}
                    title={statusLabel(status)}
                  >
                    {statusLabel(status)}
                  </div>
                  <div className="mt-0.5 truncate font-mono text-[11px] leading-4 text-slate-400">
                    {time ? formatWorkflowTime(time) : t("notRecorded")}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WorkflowActions({
  currentStatus,
  updating,
  statusLabel,
  onSelectStatus,
}: {
  currentStatus: string
  updating: boolean
  statusLabel: (status: string) => string
  onSelectStatus: (status: AttackWorkflowStatus) => void
}) {
  const t = useTranslations("pages.attack.dashboard.workflow")
  const allowed = getAllowedWorkflowTransitions(currentStatus)
  const recommended = getRecommendedNextWorkflowStatus(currentStatus)
  const secondaryStatuses = allowed.filter((status) => status !== recommended)

  if (allowed.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        {normalizeWorkflowStatus(currentStatus) === "closed"
          ? t("noTransitionsClosed")
          : t("noTransitions")}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-900">{t("transitionTitle")}</div>
        <p className="mt-1 text-sm leading-5 text-slate-500">{t("transitionDescription")}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {recommended ? (
          <Button
            type="button"
            onClick={() => onSelectStatus(recommended)}
            disabled={updating}
            className="h-10 rounded-full bg-blue-600 px-4 text-white hover:bg-blue-700 disabled:cursor-wait"
          >
            {updating ? <Loader2 className="size-4 animate-spin" /> : <Route className="size-4" />}
            {t("recommendedAction", { status: statusLabel(recommended) })}
          </Button>
        ) : null}
        {secondaryStatuses.map((status) => (
          <Button
            key={status}
            type="button"
            variant="outline"
            onClick={() => onSelectStatus(status)}
            disabled={updating}
            className="h-10 rounded-full bg-white px-3 text-slate-700"
          >
            {status === "closed" ? <ShieldCheck className="size-4" /> : <GitBranch className="size-4" />}
            {statusLabel(status)}
          </Button>
        ))}
      </div>
    </div>
  )
}

function WorkflowEventList({
  events,
  statusLabel,
}: {
  events: AttackWorkflowEventItem[]
  statusLabel: (status: string) => string
}) {
  const t = useTranslations("pages.attack.dashboard.workflow")

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        {t("events.empty")}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="grid min-w-[860px] grid-cols-[160px_220px_minmax(0,1fr)_180px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
        <div>{t("events.time")}</div>
        <div>{t("events.transition")}</div>
        <div>{t("events.comment")}</div>
        <div>{t("events.operator")}</div>
      </div>
      <div className="max-h-[360px] overflow-auto">
        {events.map((event) => {
          const comment = workflowEventComment(event)
          const operatorName = event.operator_name || event.operator_id

          return (
            <div
              key={`${event.event_id}:${event.event_key}`}
              className="grid min-w-[860px] grid-cols-[160px_220px_minmax(0,1fr)_180px] gap-3 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0"
            >
              <div className="font-mono text-xs leading-5 text-slate-500">
                {workflowEventTime(event)}
              </div>
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-slate-500" title={event.old_status}>
                  {event.old_status ? statusLabel(event.old_status) : "-"}
                </span>
                <span className="text-slate-300">-&gt;</span>
                <span className="truncate font-semibold text-slate-800" title={event.new_status}>
                  {event.new_status ? statusLabel(event.new_status) : "-"}
                </span>
              </div>
              <div className="min-w-0 truncate text-slate-600" title={comment || event.payload_json}>
                {comment || displayValue(event.payload_json)}
              </div>
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-1.5">
                  <UserRound className="size-3.5 shrink-0 text-slate-400" />
                  <span className="truncate text-slate-700" title={operatorName}>
                    {displayValue(operatorName)}
                  </span>
                </div>
                <div className="mt-0.5 truncate font-mono text-[11px] text-slate-400" title={event.operator_id}>
                  {event.operator_type || "-"} / {event.operator_id || "-"}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ActionRefGrid({ action }: { action: AttackWorkflowActionItem }) {
  const t = useTranslations("pages.attack.dashboard.workflow")
  const refs = [
    ["investigationJobId", action.investigation?.investigation_job_id],
    ["investigationTraceId", action.investigation?.investigation_trace_id],
    ["forensicPlanId", action.forensic?.forensic_plan_id],
    ["forensicExecutionId", action.forensic?.forensic_execution_id],
    ["forensicTaskId", action.forensic?.forensic_task_id],
    ["forensicTraceId", action.forensic?.forensic_trace_id],
    ["artifactUri", action.forensic?.artifact_uri],
    ["previewId", action.remediation?.preview_id],
    ["executionId", action.remediation?.execution_id],
    ["executeTaskId", action.remediation?.execute_task_id],
    ["pmcTraceId", action.remediation?.pmc_trace_id],
  ].filter(([, value]) => Boolean(value?.trim()))

  if (refs.length === 0) return null

  return (
    <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {refs.map(([key, value]) => (
        <div key={key} className="min-w-0 rounded-md border border-slate-100 bg-slate-50 px-2.5 py-2">
          <div className="text-[11px] font-semibold leading-4 text-slate-400">
            {t(`actionRefs.${key}`)}
          </div>
          <div className="mt-0.5 truncate font-mono text-xs leading-5 text-slate-700" title={value}>
            {value}
          </div>
        </div>
      ))}
    </div>
  )
}

function WorkflowActionList({ actions }: { actions: AttackWorkflowActionItem[] }) {
  const t = useTranslations("pages.attack.dashboard.workflow")

  if (actions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        {t("actions.empty")}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {actions.map((action) => (
        <div
          key={action.workflow_action_id}
          className="min-w-0 rounded-lg border border-slate-200 bg-white px-4 py-3"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "h-7 rounded-full px-2.5 text-xs font-semibold",
                    actionStatusTone(action.action_status),
                  )}
                >
                  {knownActionStatus(action.action_status)
                    ? t(`actionStatuses.${knownActionStatus(action.action_status)}`)
                    : displayValue(action.action_status)}
                </Badge>
                <span className="truncate text-sm font-semibold text-slate-900" title={action.action_type}>
                  {displayValue(action.action_type)}
                </span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  {displayValue(action.action_phase)}
                </span>
              </div>
              <div className="mt-2 grid gap-x-4 gap-y-2 text-sm md:grid-cols-2 xl:grid-cols-4">
                <MetaItem label={t("actions.actionId")} value={action.workflow_action_id} mono />
                <MetaItem label={t("actions.batchId")} value={action.action_batch_id} mono />
                <MetaItem
                  label={t("actions.target")}
                  value={[action.target_type, action.target_key].filter(Boolean).join(": ")}
                  mono
                />
                <MetaItem label={t("actions.agentId")} value={action.agent_id} mono />
                <MetaItem label={t("actions.requestedAt")} value={formatWorkflowTime(action.requested_at)} />
                <MetaItem label={t("actions.executedAt")} value={formatWorkflowTime(action.executed_at)} />
                <MetaItem label={t("actions.createdBy")} value={action.created_by} mono />
                <MetaItem label={t("actions.updatedAt")} value={formatWorkflowTime(action.updated_at)} />
              </div>
              {action.error_code || action.error_msg ? (
                <div className="mt-3 rounded-md border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  <span className="font-mono text-xs">{action.error_code || "-"}</span>
                  <span className="mx-2 text-rose-300">|</span>
                  {action.error_msg || "-"}
                </div>
              ) : null}
              <ActionRefGrid action={action} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function AttackWorkflowClosurePanel({
  caseId = "",
  workflowId = "",
  tenantId = "",
  includeActions = true,
  includeEvents = true,
  compact = false,
  className,
  onWorkflowUpdated,
}: AttackWorkflowClosurePanelProps) {
  const t = useTranslations("pages.attack.dashboard.workflow")
  const [detail, setDetail] = useState<AttackWorkflowDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<AttackWorkflowStatus | "">("")
  const [comment, setComment] = useState("")
  const [closeReason, setCloseReason] =
    useState<AttackWorkflowCloseReason>("resolved")
  const [updating, setUpdating] = useState(false)
  const loadSeqRef = useRef(0)

  const normalizedCaseId = caseId.trim()
  const normalizedWorkflowId = workflowId.trim()

  const statusLabel = useCallback(
    (status: string) => {
      const normalized = normalizeWorkflowStatus(status)
      return normalized ? t(`statuses.${normalized}`) : status.trim() || t("unknown")
    },
    [t],
  )

  const closeReasonLabel = useCallback(
    (reason: string) => t(`closeReasons.${reason}`),
    [t],
  )

  const loadWorkflow = useCallback(async () => {
    const nextSeq = loadSeqRef.current + 1
    loadSeqRef.current = nextSeq

    if (!normalizedWorkflowId && !normalizedCaseId) {
      setDetail(null)
      setError("")
      setLoading(false)
      return null
    }

    setLoading(true)
    setError("")

    try {
      const nextDetail = normalizedWorkflowId
        ? await getAttackWorkflow({
            tenantId,
            workflowId: normalizedWorkflowId,
            includeActions,
            includeEvents,
          })
        : await getAttackWorkflowByCaseId({
            tenantId,
            caseId: normalizedCaseId,
            includeActions,
            includeEvents,
          })

      if (loadSeqRef.current !== nextSeq) return nextDetail
      setDetail(nextDetail)
      return nextDetail
    } catch (err) {
      if (loadSeqRef.current === nextSeq) {
        const message = err instanceof Error ? err.message : t("loadFailed")
        setError(message)
        setDetail(null)
      }
      return null
    } finally {
      if (loadSeqRef.current === nextSeq) {
        setLoading(false)
      }
    }
  }, [
    includeActions,
    includeEvents,
    normalizedCaseId,
    normalizedWorkflowId,
    t,
    tenantId,
  ])

  useEffect(() => {
    void loadWorkflow()
  }, [loadWorkflow])

  const workflow = detail?.workflow ?? null
  const currentStatus = workflow?.status ?? ""
  const currentStatusLabel = statusLabel(currentStatus)
  const statusIsKnown = isAttackWorkflowStatus(currentStatus)

  const selectedStatusLabel = selectedStatus ? statusLabel(selectedStatus) : ""
  const canSubmitStatus =
    Boolean(workflow && selectedStatus && !updating) &&
    (selectedStatus !== "closed" || Boolean(closeReason.trim()))

  const headerDescription = useMemo(() => {
    if (!workflow) return ""
    const ids = [
      workflow.instance_ids.length > 0 ? t("summary.instances", { count: workflow.instance_ids.length }) : "",
      workflow.group_ids.length > 0 ? t("summary.groups", { count: workflow.group_ids.length }) : "",
      workflow.rule_ids.length > 0 ? t("summary.rules", { count: workflow.rule_ids.length }) : "",
    ].filter(Boolean)
    return ids.length > 0 ? ids.join(" / ") : t("summary.empty")
  }, [t, workflow])

  function openStatusDialog(status: AttackWorkflowStatus) {
    setSelectedStatus(status)
    setComment("")
    setCloseReason(workflow?.close_reason as AttackWorkflowCloseReason || "resolved")
    setDialogOpen(true)
  }

  async function submitStatusUpdate() {
    if (!workflow || !selectedStatus || !canSubmitStatus) return

    setUpdating(true)
    try {
      const updated = await updateAttackWorkflowStatus({
        tenantId,
        workflowId: workflow.workflow_id,
        status: selectedStatus,
        closeReason: selectedStatus === "closed" ? closeReason : undefined,
        payloadJson: buildWorkflowStatusPayloadJson(comment),
      })

      if (updated) {
        setDetail((current) =>
          current
            ? {
                ...current,
                workflow: updated,
              }
            : current,
        )
        onWorkflowUpdated?.(updated)
      }

      setDialogOpen(false)
      toast({ title: t("updateSuccess", { status: selectedStatusLabel }) })
      await loadWorkflow()
    } catch (err) {
      toast({
        title: t("updateFailed"),
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  if (!normalizedWorkflowId && !normalizedCaseId) {
    return (
      <WorkflowStateMessage
        icon={ShieldQuestion}
        title={t("emptyInputTitle")}
        description={t("emptyInputDescription")}
        className={className}
      />
    )
  }

  if (loading && !detail) {
    return <WorkflowLoadingState className={className} />
  }

  if (error) {
    return (
      <WorkflowStateMessage
        icon={AlertTriangle}
        title={t("loadFailed")}
        description={error}
        className={className}
        action={
          <Button type="button" variant="outline" size="sm" onClick={() => void loadWorkflow()}>
            <RefreshCw className="size-4" />
            {t("retry")}
          </Button>
        }
      />
    )
  }

  if (!workflow) {
    return (
      <WorkflowStateMessage
        icon={ShieldQuestion}
        title={t("notFoundTitle")}
        description={t("notFoundDescription")}
        className={className}
        action={
          <Button type="button" variant="outline" size="sm" onClick={() => void loadWorkflow()}>
            <RefreshCw className="size-4" />
            {t("retry")}
          </Button>
        }
      />
    )
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Card className={cn("min-w-0 overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm", className)}>
        <CardHeader className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <ShieldCheck className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <CardTitle className="truncate text-lg font-semibold text-slate-950">
                      {t("title")}
                    </CardTitle>
                    <StatusPill label={currentStatusLabel} status={currentStatus} />
                    {!statusIsKnown ? (
                      <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 text-amber-700">
                        {t("unknownStatus")}
                      </Badge>
                    ) : null}
                  </div>
                  <CardDescription className="mt-1 truncate">
                    {workflow.title || headerDescription}
                  </CardDescription>
                </div>
              </div>
              <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
                <IdChip value={`Case ${displayValue(workflow.case_id || normalizedCaseId)}`} />
                <IdChip value={`Workflow ${displayValue(workflow.workflow_id)}`} />
                {workflow.close_reason ? (
                  <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 text-slate-600">
                    {t("closeReason")}: {displayValue(workflow.close_reason)}
                  </Badge>
                ) : null}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadWorkflow()}
              disabled={loading || updating}
              className="h-10 shrink-0 rounded-full bg-white px-3 text-slate-600"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              {t("refresh")}
            </Button>
          </div>
        </CardHeader>

        <CardContent className={cn("space-y-5 px-6 py-5", compact && "space-y-4 px-4 py-4")}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetaItem label={t("meta.tenantId")} value={workflow.tenant_id} mono />
            <MetaItem label={t("meta.root")} value={`${workflow.root_type || "-"} / ${workflow.root_id || "-"}`} mono />
            <MetaItem label={t("meta.primaryAgent")} value={workflow.primary_agent_id} mono />
            <MetaItem label={t("meta.updatedAt")} value={formatWorkflowTime(workflow.updated_at)} />
            <MetaItem label={t("meta.agents")} value={compactList(workflow.agent_ids)} mono />
            <MetaItem label={t("meta.rules")} value={compactList(workflow.rule_ids)} mono />
            <MetaItem label={t("meta.instances")} value={compactList(workflow.instance_ids)} mono />
            <MetaItem label={t("meta.groups")} value={compactList(workflow.group_ids)} mono />
          </div>

          <WorkflowStatusStepper workflow={workflow} statusLabel={statusLabel} />

          <WorkflowActions
            currentStatus={currentStatus}
            updating={updating}
            statusLabel={statusLabel}
            onSelectStatus={openStatusDialog}
          />

          <Tabs defaultValue="events" className="min-w-0">
            <TabsList className="h-10 rounded-lg bg-slate-100 p-1">
              <TabsTrigger value="events" className="gap-2 rounded-md px-3 text-sm">
                <History className="size-4" />
                {t("events.title", { count: detail?.events.length ?? 0 })}
              </TabsTrigger>
              <TabsTrigger value="actions" className="gap-2 rounded-md px-3 text-sm">
                <FileText className="size-4" />
                {t("actions.title", { count: detail?.actions.length ?? 0 })}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="events" className="mt-3">
              <WorkflowEventList
                events={detail?.events ?? []}
                statusLabel={statusLabel}
              />
            </TabsContent>
            <TabsContent value="actions" className="mt-3">
              <WorkflowActionList actions={detail?.actions ?? []} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (updating) return
          setDialogOpen(open)
        }}
      >
        <DialogContent className="max-w-xl rounded-lg border-slate-200 p-0 shadow-xl">
          <DialogHeader className="border-b border-slate-100 px-5 py-4 pr-12">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                <Clock3 className="size-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold text-slate-950">
                  {t("dialog.title", { status: selectedStatusLabel })}
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm leading-5">
                  {t("dialog.description", {
                    from: currentStatusLabel,
                    to: selectedStatusLabel,
                  })}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 px-5 py-4">
            {selectedStatus === "closed" ? (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800" htmlFor="attack-workflow-close-reason">
                  {t("dialog.closeReasonLabel")}
                </label>
                <Select
                  value={closeReason}
                  onValueChange={(value) => setCloseReason(value as AttackWorkflowCloseReason)}
                >
                  <SelectTrigger
                    id="attack-workflow-close-reason"
                    className="h-10 rounded-lg border-slate-200"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ATTACK_WORKFLOW_CLOSE_REASONS.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {closeReasonLabel(reason)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800" htmlFor="attack-workflow-comment">
                {t("dialog.commentLabel")}
              </label>
              <Textarea
                id="attack-workflow-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder={t("dialog.commentPlaceholder")}
                className="min-h-28 resize-y rounded-lg border-slate-200 text-sm leading-6 focus-visible:ring-blue-200"
              />
              <p className="text-xs leading-5 text-slate-500">{t("dialog.commentHint")}</p>
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-slate-100 px-5 py-4 sm:space-x-0">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={updating}>
                {t("dialog.cancel")}
              </Button>
            </DialogClose>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    type="button"
                    onClick={() => void submitStatusUpdate()}
                    disabled={!canSubmitStatus}
                    className="bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed"
                  >
                    {updating ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                    {t("dialog.confirm")}
                  </Button>
                </span>
              </TooltipTrigger>
              {!canSubmitStatus && selectedStatus === "closed" && !closeReason ? (
                <TooltipContent>{t("dialog.closeReasonRequired")}</TooltipContent>
              ) : null}
            </Tooltip>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
