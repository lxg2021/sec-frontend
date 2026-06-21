"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Activity, Loader2, ShieldCheck } from "lucide-react"

import { fetchAttackOverview } from "@/features/attack/dashboard/api"
import type { AttackOverview } from "@/features/attack/dashboard/types"
import { AttackDetailHeader } from "@/features/attack/detail/components/attack-detail-header"
import { AttackWorkflowActivityPanel } from "./attack-workflow-activity-panel"
import { AttackWorkflowProcessCard } from "./attack-workflow-process-card"
import {
  AttackWorkflowQueue,
  type AttackWorkflowQueueFilters,
  type AttackWorkflowQueueItem,
} from "./attack-workflow-queue"
import { AttackWorkflowStageWorkbench } from "./attack-workflow-stage-workbench"
import {
  getAttackWorkflow,
  getAttackWorkflowByCaseId,
  listAttackWorkflows,
  updateAttackWorkflowStatus,
} from "@/features/attack/workflow/api"
import {
  ATTACK_WORKFLOW_CLOSE_REASONS,
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
  getAllowedWorkflowTransitions,
  getRecommendedNextWorkflowStatus,
  normalizeWorkflowStatus,
} from "@/features/attack/workflow/utils"
import {
  buildAIAnalysisHref,
  buildAttackDetailHref,
  buildIOCVerificationHref,
  buildTraceHref,
} from "@/features/attack/detail/utils/attack-case-format"
import { useToast } from "@/shared/hooks/use-toast"
import { Button } from "@/shared/ui/button"
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
import { Textarea } from "@/shared/ui/textarea"

interface AttackWorkflowControlCenterProps {
  caseId?: string
  endTime?: string
  focusQueue?: boolean
  initialQueuePage?: number
  snapshotId?: string
  startTime?: string
  workflowId?: string
  tenantId?: string
  timezone?: string
}

interface WorkflowNavigationHrefs {
  attackDetailHref: string
  traceHref: string
  aiHref: string
  iocHref: string
}

interface WorkflowIdentity {
  caseId?: string
  workflowId?: string
}

type OpenStatusDialog = (status: AttackWorkflowStatus) => void

const DEFAULT_QUEUE_FILTERS: AttackWorkflowQueueFilters = {
  statusScope: "open",
  statuses: [],
  severities: [],
}
const QUEUE_PAGE_SIZE = 10
const WORKFLOW_RANGE_TIMEZONE = "Asia/Shanghai"

function normalizeQueuePage(value?: number) {
  const page = Math.trunc(value ?? 1)
  return Number.isFinite(page) && page > 0 ? page : 1
}

const EMPTY_ATTACK_OVERVIEW: AttackOverview = {
  bucket: {
    bucket_type: "fixed",
    bucket_start: "",
    bucket_end: "",
  },
  scope: "",
  total_rules: 0,
  total_groups: 0,
  total_instances: 0,
  total_sources: 0,
  total_hosts: 0,
  total_cases: 0,
  critical_count: 0,
  high_count: 0,
  medium_count: 0,
  low_count: 0,
}

const STATUS_LABELS: Record<AttackWorkflowStatus, string> = {
  detected: "statuses.detected",
  investigating: "statuses.investigating",
  confirmed: "statuses.confirmed",
  forensics: "statuses.forensics",
  responding: "statuses.responding",
  contained: "statuses.contained",
  remediated: "statuses.remediated",
  closed: "statuses.closed",
}

const CLOSE_REASON_LABELS: Record<AttackWorkflowCloseReason, string> = {
  resolved: "closeReasons.resolved",
  false_positive: "closeReasons.falsePositive",
  duplicate: "closeReasons.duplicate",
  accepted_risk: "closeReasons.acceptedRisk",
  other: "closeReasons.other",
}

type WorkflowCenterT = ReturnType<typeof useTranslations>

function statusLabel(t: WorkflowCenterT, status: string) {
  const normalized = normalizeWorkflowStatus(status)
  return normalized ? t(STATUS_LABELS[normalized]) : status || t("unknown")
}

function closeReasonLabel(
  t: WorkflowCenterT,
  reason: AttackWorkflowCloseReason,
) {
  return t(CLOSE_REASON_LABELS[reason])
}

function buildStatusPayload(comment: string, source: string) {
  const normalized = comment.trim()
  if (!normalized) return ""
  return JSON.stringify({
    comment: normalized,
    source,
  })
}

function parseOverviewBucketTime(value?: string) {
  if (!value) return null
  const normalized = value.trim().replace(" ", "T")
  if (!normalized) return null
  const hasExplicitTimezone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(normalized)
  const date = new Date(hasExplicitTimezone ? normalized : `${normalized}Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

function toWorkflowRangeParam(
  value?: string,
  timeZone = WORKFLOW_RANGE_TIMEZONE,
) {
  const date = parseOverviewBucketTime(value)
  if (!date) return ""
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "00"

  return `${part("year")}-${part("month")}-${part("day")} ${part("hour")}:${part("minute")}:${part("second")}`
}

function actionNeedsAttention(action: AttackWorkflowActionItem) {
  const status = action.action_status.trim().toLowerCase()
  return status === "pending" || status === "running" || status === "failed"
}

function workflowToQueueItem(
  workflow: AttackWorkflowItem,
  actions: AttackWorkflowActionItem[] = [],
  events: AttackWorkflowEventItem[] = [],
): AttackWorkflowQueueItem {
  return {
    workflow_id: workflow.workflow_id,
    tenant_id: workflow.tenant_id,
    case_id: workflow.case_id,
    title: workflow.title,
    severity: workflow.severity,
    status: workflow.status,
    primary_agent_id: workflow.primary_agent_id,
    agent_ids: workflow.agent_ids,
    rule_ids: workflow.rule_ids,
    detected_at: workflow.detected_at,
    updated_at: workflow.updated_at,
    open_action_count: actions.filter(actionNeedsAttention).length,
    event_count: events.length,
  }
}

export function AttackWorkflowControlCenter({
  caseId = "",
  endTime = "",
  focusQueue = false,
  initialQueuePage = 1,
  snapshotId = "",
  startTime = "",
  workflowId = "",
  tenantId = "",
  timezone = "",
}: AttackWorkflowControlCenterProps) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations("pages.attack.workflowCenter")
  const { toast } = useToast()
  const normalizedInitialQueuePage = normalizeQueuePage(initialQueuePage)
  const [attackOverview, setAttackOverview] = useState<AttackOverview | null>(
    null,
  )
  const [attackOverviewLoading, setAttackOverviewLoading] = useState(false)
  const [detail, setDetail] = useState<AttackWorkflowDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [, setError] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<
    AttackWorkflowStatus | ""
  >("")
  const [selectedWorkbenchStatus, setSelectedWorkbenchStatus] =
    useState<AttackWorkflowStatus>("detected")
  const [queueCaseIdQuery, setQueueCaseIdQuery] = useState("")
  const [queueCaseId, setQueueCaseId] = useState("")
  const [queueFilters, setQueueFilters] = useState<AttackWorkflowQueueFilters>(
    DEFAULT_QUEUE_FILTERS,
  )
  const [queueWorkflows, setQueueWorkflows] = useState<AttackWorkflowItem[]>([])
  const [queueLoading, setQueueLoading] = useState(false)
  const [queueRefreshing, setQueueRefreshing] = useState(false)
  const [queueError, setQueueError] = useState("")
  const [queuePage, setQueuePage] = useState(normalizedInitialQueuePage)
  const [queueTotal, setQueueTotal] = useState(0)
  const [queueTotalPages, setQueueTotalPages] = useState(0)
  const [queueHasPrevious, setQueueHasPrevious] = useState(false)
  const [queueHasNext, setQueueHasNext] = useState(false)
  const [comment, setComment] = useState("")
  const [closeReason, setCloseReason] =
    useState<AttackWorkflowCloseReason>("resolved")
  const [updating, setUpdating] = useState(false)
  const loadSeqRef = useRef(0)
  const queueLoadSeqRef = useRef(0)
  const autoSelectedQueueKeyRef = useRef("")
  const tRef = useRef(t)

  const normalizedCaseId = caseId.trim()
  const normalizedEndTime = endTime.trim()
  const normalizedSnapshotId = snapshotId.trim()
  const normalizedStartTime = startTime.trim()
  const normalizedTimezone = timezone.trim()
  const normalizedWorkflowId = workflowId.trim()
  const isChineseLocale = locale.toLowerCase().startsWith("zh")

  useEffect(() => {
    tRef.current = t
  }, [t])

  useEffect(() => {
    setQueuePage(normalizedInitialQueuePage)
  }, [normalizedInitialQueuePage])

  useEffect(() => {
    if (!focusQueue || !normalizedCaseId) return

    setQueueCaseIdQuery(normalizedCaseId)
    setQueueCaseId(normalizedCaseId)
    setQueuePage(1)
    setQueueFilters({ ...DEFAULT_QUEUE_FILTERS, statusScope: "all" })
  }, [focusQueue, normalizedCaseId])

  const loadAttackOverview = useCallback(async () => {
    setAttackOverviewLoading(true)

    try {
      const nextOverview = await fetchAttackOverview(
        "fixed",
        normalizedSnapshotId,
      )
      setAttackOverview(nextOverview)
    } catch (err) {
      setAttackOverview((current) => current ?? EMPTY_ATTACK_OVERVIEW)
      toast({
        title: t("toasts.loadOverviewFailed"),
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      })
    } finally {
      setAttackOverviewLoading(false)
    }
  }, [normalizedSnapshotId, t, toast])

  useEffect(() => {
    void loadAttackOverview()
  }, [loadAttackOverview])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextCaseId = queueCaseIdQuery.trim()
      if (nextCaseId === queueCaseId) return

      setQueuePage(1)
      setQueueCaseId(nextCaseId)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [queueCaseId, queueCaseIdQuery])

  const loadWorkflowDetail = useCallback(
    async ({
      caseId: targetCaseId = "",
      workflowId: targetWorkflowId = "",
    }: WorkflowIdentity = {}) => {
      const nextSeq = loadSeqRef.current + 1
      loadSeqRef.current = nextSeq
      const normalizedTargetCaseId = targetCaseId.trim()
      const normalizedTargetWorkflowId = targetWorkflowId.trim()

      if (!normalizedTargetCaseId && !normalizedTargetWorkflowId) {
        autoSelectedQueueKeyRef.current = ""
        setDetail(null)
        setError("")
        setLoading(false)
        return
      }

      setLoading(true)
      setError("")
      try {
        const nextDetail = normalizedTargetWorkflowId
          ? await getAttackWorkflow({
              tenantId,
              workflowId: normalizedTargetWorkflowId,
              includeActions: true,
              includeEvents: true,
            })
          : await getAttackWorkflowByCaseId({
              tenantId,
              caseId: normalizedTargetCaseId,
              includeActions: true,
              includeEvents: true,
            })

        if (loadSeqRef.current !== nextSeq) return
        setDetail(nextDetail)
      } catch (err) {
        if (loadSeqRef.current !== nextSeq) return
        setError(
          err instanceof Error
            ? err.message
            : tRef.current("errors.loadWorkflowFailed"),
        )
        setDetail(null)
      } finally {
        if (loadSeqRef.current === nextSeq) {
          setLoading(false)
        }
      }
    },
    [tenantId],
  )

  const loadWorkflow = useCallback(
    () =>
      loadWorkflowDetail({
        caseId: normalizedCaseId,
        workflowId: normalizedWorkflowId,
      }),
    [loadWorkflowDetail, normalizedCaseId, normalizedWorkflowId],
  )

  useEffect(() => {
    void loadWorkflow()
  }, [loadWorkflow])

  const loadWorkflowQueue = useCallback(
    async ({
      page = 1,
      refreshing = false,
    }: {
      page?: number
      refreshing?: boolean
    } = {}) => {
      const nextSeq = queueLoadSeqRef.current + 1
      queueLoadSeqRef.current = nextSeq

      if (refreshing) {
        setQueueRefreshing(true)
      } else {
        setQueueLoading(true)
      }
      setQueueError("")

      try {
        const selectedStatus = queueFilters.statuses[0] ?? ""
        const selectedSeverity = queueFilters.severities[0] ?? ""
        const data = await listAttackWorkflows({
          tenantId,
          page,
          pageSize: QUEUE_PAGE_SIZE,
          timezone: normalizedTimezone || undefined,
          startTime: normalizedStartTime || undefined,
          endTime: normalizedEndTime || undefined,
          statusScope: queueFilters.statusScope,
          status: selectedStatus || undefined,
          severity: selectedSeverity || undefined,
          caseId: queueCaseId || undefined,
        })

        if (queueLoadSeqRef.current !== nextSeq) return

        const nextPage = data.pagination.current_page || page
        const nextTotal = data.pagination.total_count || data.items.length
        const nextTotalPages =
          data.pagination.total_pages ||
          (nextTotal > 0 ? Math.ceil(nextTotal / QUEUE_PAGE_SIZE) : 0)

        setQueueWorkflows(data.items)
        setQueuePage(nextPage)
        setQueueTotal(nextTotal)
        setQueueTotalPages(nextTotalPages)
        setQueueHasPrevious(data.pagination.has_previous || nextPage > 1)
        setQueueHasNext(
          data.pagination.has_next ||
            (nextTotalPages > 0 && nextPage < nextTotalPages),
        )
      } catch (err) {
        if (queueLoadSeqRef.current !== nextSeq) return
        setQueueError(
          err instanceof Error ? err.message : t("errors.loadQueueFailed"),
        )
        setQueueHasNext(false)
      } finally {
        if (queueLoadSeqRef.current === nextSeq) {
          setQueueLoading(false)
          setQueueRefreshing(false)
        }
      }
    },
    [
      normalizedEndTime,
      normalizedStartTime,
      normalizedTimezone,
      queueCaseId,
      queueFilters,
      t,
      tenantId,
    ],
  )

  useEffect(() => {
    void loadWorkflowQueue({ page: queuePage })
  }, [loadWorkflowQueue, queuePage])

  function selectAttackOverviewSnapshot(snapshot: AttackOverview) {
    setAttackOverview(snapshot)
    autoSelectedQueueKeyRef.current = ""

    const params = new URLSearchParams()
    const nextSnapshotId = snapshot.bucket.snapshot_id?.trim() || ""
    const nextStartTime = toWorkflowRangeParam(snapshot.bucket.bucket_start)
    const nextEndTime = toWorkflowRangeParam(snapshot.bucket.bucket_end)

    if (nextSnapshotId) params.set("snapshotId", nextSnapshotId)
    if (nextStartTime) params.set("startTime", nextStartTime)
    if (nextEndTime) params.set("endTime", nextEndTime)
    params.set("timezone", WORKFLOW_RANGE_TIMEZONE)
    if (tenantId.trim()) params.set("tenantId", tenantId.trim())

    const query = params.toString()
    router.push(`/frame/attack/workflow${query ? `?${query}` : ""}`)
  }

  const workflow = detail?.workflow ?? null
  const actions = detail?.actions ?? []
  const events = detail?.events ?? []
  const activeCaseId = workflow?.case_id || normalizedCaseId
  const activeWorkflowId = workflow?.workflow_id || normalizedWorkflowId
  const currentStatus = workflow?.status ?? ""
  const normalizedStatus = normalizeWorkflowStatus(currentStatus)
  const recommendedStatus = getRecommendedNextWorkflowStatus(currentStatus)
  const allowedStatuses = getAllowedWorkflowTransitions(currentStatus)
  const canOpenDetails = Boolean(activeCaseId)
  const detailOptions = {
    workflowId: activeWorkflowId,
    returnToWorkflow: true,
    queuePage,
  }
  const attackDetailHref = activeCaseId
    ? buildAttackDetailHref(activeCaseId, normalizedSnapshotId)
    : "/frame/attack/detail"
  const traceHref = canOpenDetails
    ? buildTraceHref(activeCaseId, normalizedSnapshotId, detailOptions)
    : "/frame/attack/drill"
  const aiHref = canOpenDetails
    ? buildAIAnalysisHref(activeCaseId, normalizedSnapshotId, detailOptions)
    : "/frame/ai-ops/threat-analysis"
  const iocHref = canOpenDetails
    ? buildIOCVerificationHref(activeCaseId, normalizedSnapshotId, detailOptions)
    : "/frame/ioc-analysis/ioc-verification"
  const navigationHrefs: WorkflowNavigationHrefs = {
    attackDetailHref,
    traceHref,
    aiHref,
    iocHref,
  }

  useEffect(() => {
    setSelectedWorkbenchStatus(normalizedStatus || "detected")
  }, [workflow?.workflow_id, normalizedStatus])

  const rawQueueItems = useMemo<AttackWorkflowQueueItem[]>(
    () =>
      queueWorkflows.map((queueWorkflow) => {
        const isActiveWorkflow =
          workflow &&
          queueWorkflow.workflow_id &&
          queueWorkflow.workflow_id === workflow.workflow_id

        return workflowToQueueItem(
          queueWorkflow,
          isActiveWorkflow ? actions : [],
          isActiveWorkflow ? events : [],
        )
      }),
    [actions, events, queueWorkflows, workflow],
  )
  const activeQueueItemOnPage = useMemo(
    () =>
      rawQueueItems.some(
        (item) =>
          (activeWorkflowId && item.workflow_id === activeWorkflowId) ||
          (activeCaseId && item.case_id === activeCaseId),
      ),
    [activeCaseId, activeWorkflowId, rawQueueItems],
  )
  const shouldDefaultSelectFirstQueueItem =
    !normalizedCaseId &&
    !normalizedWorkflowId &&
    rawQueueItems.length > 0 &&
    !activeQueueItemOnPage
  const defaultSelectedQueueItem = shouldDefaultSelectFirstQueueItem
    ? rawQueueItems[0]
    : null
  const useActiveQueueSelection =
    activeQueueItemOnPage || Boolean(normalizedCaseId || normalizedWorkflowId)
  const selectedQueueWorkflowId = useActiveQueueSelection
    ? activeWorkflowId
    : defaultSelectedQueueItem?.workflow_id || ""
  const selectedQueueCaseId = useActiveQueueSelection
    ? activeCaseId
    : defaultSelectedQueueItem?.case_id || ""

  async function refreshAttackOverviewHeader() {
    const refreshWorkflowId =
      normalizedWorkflowId ||
      workflow?.workflow_id ||
      defaultSelectedQueueItem?.workflow_id ||
      ""
    const refreshCaseId =
      normalizedCaseId ||
      workflow?.case_id ||
      defaultSelectedQueueItem?.case_id ||
      ""
    const refreshDetail =
      refreshWorkflowId || refreshCaseId
        ? loadWorkflowDetail({
            caseId: refreshCaseId,
            workflowId: refreshWorkflowId,
          })
        : Promise.resolve()

    await Promise.all([
      loadAttackOverview(),
      refreshDetail,
      loadWorkflowQueue({ page: queuePage, refreshing: true }),
    ])
  }

  useEffect(() => {
    if (normalizedCaseId || normalizedWorkflowId) return
    if (queueLoading || queueRefreshing || rawQueueItems.length === 0) return
    if (activeQueueItemOnPage) return

    const firstItem = rawQueueItems[0]
    const firstKey = firstItem.workflow_id || firstItem.case_id
    if (!firstKey || autoSelectedQueueKeyRef.current === firstKey) return
    autoSelectedQueueKeyRef.current = firstKey

    void loadWorkflowDetail({
      caseId: firstItem.case_id,
      workflowId: firstItem.workflow_id,
    })
  }, [
    activeQueueItemOnPage,
    loadWorkflowDetail,
    normalizedCaseId,
    normalizedWorkflowId,
    queueLoading,
    queueRefreshing,
    rawQueueItems,
  ])

  function openStatusDialog(status: AttackWorkflowStatus) {
    setSelectedStatus(status)
    setComment("")
    setCloseReason(
      (workflow?.close_reason as AttackWorkflowCloseReason) || "resolved",
    )
  }

  async function submitStatusUpdate() {
    if (!workflow || !selectedStatus || updating) return
    if (selectedStatus === "closed" && !closeReason.trim()) return

    setUpdating(true)
    try {
      const updated = await updateAttackWorkflowStatus({
        tenantId,
        workflowId: workflow.workflow_id,
        status: selectedStatus,
        closeReason: selectedStatus === "closed" ? closeReason : undefined,
        payloadJson: buildStatusPayload(
          comment,
          "attack_workflow_control_center",
        ),
      })

      if (updated) {
        setDetail((current) =>
          current ? { ...current, workflow: updated } : current,
        )
      }
      setSelectedStatus("")
      toast({
        title: t("toasts.statusUpdated", {
          status: statusLabel(t, selectedStatus),
        }),
      })
      await loadWorkflowDetail({
        caseId: workflow.case_id,
        workflowId: workflow.workflow_id,
      })
      await loadWorkflowQueue({ page: queuePage, refreshing: true })
    } catch (err) {
      toast({
        title: t("toasts.statusUpdateFailed"),
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  function selectQueueWorkflow(item: AttackWorkflowQueueItem) {
    if (
      item.workflow_id === activeWorkflowId &&
      item.case_id === activeCaseId
    ) {
      return
    }

    const params = new URLSearchParams()
    if (item.case_id) params.set("caseId", item.case_id)
    if (item.workflow_id) params.set("workflowId", item.workflow_id)
    if (normalizedSnapshotId) params.set("snapshotId", normalizedSnapshotId)
    if (normalizedStartTime) params.set("startTime", normalizedStartTime)
    if (normalizedEndTime) params.set("endTime", normalizedEndTime)
    if (normalizedTimezone) params.set("timezone", normalizedTimezone)
    if (tenantId.trim()) params.set("tenantId", tenantId.trim())
    params.set("queuePage", String(queuePage))
    router.push(`/frame/attack/workflow?${params.toString()}`)
  }

  function updateQueueFilters(nextFilters: AttackWorkflowQueueFilters) {
    setQueuePage(1)
    setQueueFilters(nextFilters)
  }

  function changeQueuePage(page: number) {
    setQueuePage(normalizeQueuePage(page))
  }

  return (
    <main className="flex min-h-[calc(100dvh-3rem)] w-full overflow-x-hidden bg-gray-50 p-3 sm:p-4 xl:p-5">
      <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
        <AttackDetailHeader
          overview={attackOverview ?? EMPTY_ATTACK_OVERVIEW}
          checking={attackOverviewLoading}
          title={t("title")}
          titleClassName={isChineseLocale ? "font-semibold" : undefined}
          onRefresh={() => void refreshAttackOverviewHeader()}
          onSnapshotChange={selectAttackOverviewSnapshot}
        />

        <section className="grid min-h-0 w-full flex-1 items-stretch gap-4 xl:grid-cols-[clamp(440px,31vw,480px)_minmax(0,1fr)]">
          <AttackWorkflowQueue
            className="xl:h-full"
            caseIdQuery={queueCaseIdQuery}
            error={queueError}
            filters={queueFilters}
            items={rawQueueItems}
            loading={queueLoading}
            currentPage={queuePage}
            pageSize={QUEUE_PAGE_SIZE}
            totalPages={queueTotalPages}
            hasPrevious={queueHasPrevious}
            hasNext={queueHasNext}
            paginationLoading={queueLoading}
            onFiltersChange={updateQueueFilters}
            onCaseIdChange={setQueueCaseIdQuery}
            onRefresh={() =>
              void loadWorkflowQueue({ page: queuePage, refreshing: true })
            }
            onPageChange={changeQueuePage}
            onSelectWorkflow={selectQueueWorkflow}
            refreshing={queueRefreshing}
            selectedCaseId={selectedQueueCaseId}
            selectedWorkflowId={selectedQueueWorkflowId}
            total={queueTotal}
          />

          <WorkflowMainGrid
            actions={actions}
            allowedStatuses={allowedStatuses}
            canOpenDetails={canOpenDetails}
            currentStatus={currentStatus}
            events={events}
            hrefs={navigationHrefs}
            loading={loading}
            onOpenStatusDialog={openStatusDialog}
            onWorkbenchStatusSelect={setSelectedWorkbenchStatus}
            recommendedStatus={recommendedStatus}
            selectedWorkbenchStatus={selectedWorkbenchStatus}
            updating={updating}
            workflow={workflow}
          />
        </section>
      </div>

      <StatusDialog
        closeReason={closeReason}
        comment={comment}
        currentStatus={currentStatus}
        onCloseReasonChange={setCloseReason}
        onCommentChange={setComment}
        onOpenChange={(open) => {
          if (!updating && !open) setSelectedStatus("")
        }}
        onSubmit={() => void submitStatusUpdate()}
        open={Boolean(selectedStatus)}
        selectedStatus={selectedStatus}
        updating={updating}
      />
    </main>
  )
}

function WorkflowMainGrid({
  actions,
  allowedStatuses,
  canOpenDetails,
  currentStatus,
  events,
  hrefs,
  loading,
  onOpenStatusDialog,
  onWorkbenchStatusSelect,
  recommendedStatus,
  selectedWorkbenchStatus,
  updating,
  workflow,
}: {
  actions: AttackWorkflowActionItem[]
  allowedStatuses: AttackWorkflowStatus[]
  canOpenDetails: boolean
  currentStatus: string
  events: AttackWorkflowEventItem[]
  hrefs: WorkflowNavigationHrefs
  loading: boolean
  onOpenStatusDialog: OpenStatusDialog
  onWorkbenchStatusSelect: (status: AttackWorkflowStatus) => void
  recommendedStatus: AttackWorkflowStatus | null
  selectedWorkbenchStatus: AttackWorkflowStatus
  updating: boolean
  workflow: AttackWorkflowItem | null
}) {
  return (
    <section className="flex h-full min-h-0 w-full flex-1 flex-col gap-4">
      <AttackWorkflowProcessCard
        loading={loading}
        onStatusSelect={onWorkbenchStatusSelect}
        recommendedStatus={recommendedStatus}
        selectedStatus={selectedWorkbenchStatus}
        workflow={workflow}
      />

      <AttackWorkflowStageWorkbench
        actions={actions}
        allowedStatuses={allowedStatuses}
        canOpenDetails={canOpenDetails}
        currentStatus={currentStatus}
        events={events}
        hrefs={hrefs}
        loading={loading}
        onOpenStatusDialog={onOpenStatusDialog}
        recommendedStatus={recommendedStatus}
        selectedStatus={selectedWorkbenchStatus}
        updating={updating}
        workflow={workflow}
      />

      <AttackWorkflowActivityPanel
        actions={actions}
        className="flex-1"
        events={events}
        loading={loading}
        variant="card"
        workflow={workflow}
      />
    </section>
  )
}

function StatusDialog({
  closeReason,
  comment,
  currentStatus,
  onCloseReasonChange,
  onCommentChange,
  onOpenChange,
  onSubmit,
  open,
  selectedStatus,
  updating,
}: {
  closeReason: AttackWorkflowCloseReason
  comment: string
  currentStatus: string
  onCloseReasonChange: (value: AttackWorkflowCloseReason) => void
  onCommentChange: (value: string) => void
  onOpenChange: (open: boolean) => void
  onSubmit: () => void
  open: boolean
  selectedStatus: AttackWorkflowStatus | ""
  updating: boolean
}) {
  const t = useTranslations("pages.attack.workflowCenter")
  const canSubmit =
    Boolean(selectedStatus) &&
    !updating &&
    (selectedStatus !== "closed" || Boolean(closeReason.trim()))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-2xl border-slate-200 p-0 shadow-xl">
        <DialogHeader className="border-b border-slate-100 px-5 py-4 pr-12">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <Activity className="size-5" />
            </span>
            <div>
              <DialogTitle className="text-base font-semibold text-slate-950">
                {t("dialog.title")}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {statusLabel(t, currentStatus)} -&gt;{" "}
                {selectedStatus ? statusLabel(t, selectedStatus) : "-"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4 px-5 py-4">
          {selectedStatus === "closed" ? (
            <div className="space-y-2">
              <label
                className="text-sm font-semibold text-slate-800"
                htmlFor="attack-workflow-center-close-reason"
              >
                {t("dialog.closeReason")}
              </label>
              <Select
                value={closeReason}
                onValueChange={(value) =>
                  onCloseReasonChange(value as AttackWorkflowCloseReason)
                }
              >
                <SelectTrigger id="attack-workflow-center-close-reason">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ATTACK_WORKFLOW_CLOSE_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {closeReasonLabel(t, reason)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-slate-800"
              htmlFor="attack-workflow-center-comment"
            >
              {t("dialog.operatorNote")}
            </label>
            <Textarea
              id="attack-workflow-center-comment"
              value={comment}
              onChange={(event) => onCommentChange(event.target.value)}
              placeholder={t("dialog.operatorNotePlaceholder")}
              className="min-h-28 resize-y rounded-xl border-slate-200 text-sm leading-6"
            />
            <p className="text-xs leading-5 text-slate-500">
              {t("dialog.operatorNoteHint")}
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2 border-t border-slate-100 px-5 py-4 sm:space-x-0">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={updating}>
              {t("dialog.cancel")}
            </Button>
          </DialogClose>
          <Button type="button" onClick={onSubmit} disabled={!canSubmit}>
            {updating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
            {t("dialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
