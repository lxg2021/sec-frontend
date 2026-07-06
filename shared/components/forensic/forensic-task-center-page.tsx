"use client"

import type { FormEvent } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  Activity,
  AlertTriangle,
  Archive,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FileArchive,
  FileText,
  Hexagon,
  ListChecks,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  ScrollText,
  Trash2,
  XCircle,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { cn } from "@/shared/lib/utils"
import {
  cancelForensicTask,
  deleteForensicEvidence,
  deleteForensicTask,
  downloadForensicEvidence,
  downloadForensicTaskFlowZip,
  listForensicEvidence,
  listForensicTasks,
  syncForensicTaskResult,
} from "@/shared/lib/forensic/api"
import type {
  ForensicEvidenceItem,
  ForensicOverviewContext,
  ForensicTaskItem,
  ForensicTaskStatus,
  ListForensicTasksRequest,
} from "@/shared/lib/forensic/types"
import { ForensicCreateTaskForm } from "./forensic-create-task-dialog"

interface ForensicTaskCenterContext extends ForensicOverviewContext {
  artifact_key?: string
  status?: ForensicTaskStatus
  task_id?: string
  action?: string
  velociraptor_client_id?: string
}

interface Props {
  context: ForensicTaskCenterContext
}

const TASK_STATUSES: ForensicTaskStatus[] = [
  "pending",
  "running",
  "success",
  "failed",
  "timeout",
  "canceled",
]

const CREATE_TASK_FORM_ID = "forensic-task-center-create-form"
const TASK_PANEL_MIN_HEIGHT = 680
const TASK_PANEL_FIXED_HEIGHT = 173
const TASK_LIST_ROW_HEIGHT = 58
const TASK_LIST_EMPTY_ROWS = 5

function formatUnixTime(value?: number): string {
  if (!value) return "-"
  const date = new Date(value * 1000)
  const pad = (num: number) => String(num).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function formatClock(value?: number): string {
  if (!value) return "-"
  const date = new Date(value * 1000)
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date)
}

function formatRefreshTime(value?: Date | null): string {
  if (!value) return "--"
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
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

function formatRelative(value?: number): string {
  if (!value) return "-"
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - value)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

function formatBytes(value?: number): string {
  if (value === undefined || value === null) return "-"
  if (value < 1024) return `${value} B`
  const units = ["KB", "MB", "GB", "TB"]
  let size = value / 1024
  let index = 0
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index += 1
  }
  return `${size.toFixed(1)} ${units[index]}`
}

function parseJson(value?: string): unknown {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function compactParams<T extends Record<string, unknown>>(input: T): Partial<T> {
  const output: Partial<T> = {}
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && value !== null && value !== "") {
      output[key as keyof T] = value as T[keyof T]
    }
  }
  return output
}

function statusClass(status: ForensicTaskStatus): string {
  const classes: Record<ForensicTaskStatus, string> = {
    pending: "bg-slate-100 text-slate-600",
    running: "bg-blue-100 text-blue-700",
    success: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-700",
    canceled: "bg-slate-100 text-slate-500",
    timeout: "bg-amber-100 text-amber-700",
  }
  return classes[status]
}

function firstText(values: Array<string | undefined | null>): string {
  for (const value of values) {
    const next = value?.trim()
    if (next) return next
  }
  return ""
}

function cleanList(values?: string[]): string[] {
  return (values ?? []).map((item) => item.trim()).filter(Boolean)
}

function normalizedOnlineStatus(status?: string): "online" | "offline" | undefined {
  const normalized = status?.trim().toLowerCase()
  if (normalized === "online" || normalized === "offline") {
    return normalized
  }
  return undefined
}

function taskOnlineStatus(task: ForensicTaskItem): "online" | "offline" | "unknown" | "unsynced" {
  const target = task.target_host
  const hostStatus = normalizedOnlineStatus(target?.host_status)
  if (hostStatus) return hostStatus
  const forensicStatus = normalizedOnlineStatus(target?.forensic_status)
  if (forensicStatus) return forensicStatus
  return target?.agent_id || target?.hostname || task.agent_id || task.endpoint_id ? "unknown" : "unsynced"
}

function taskHostAgentID(task: ForensicTaskItem): string {
  return firstText([task.target_host?.agent_id, task.agent_id, task.endpoint_id])
}

function taskHostname(task: ForensicTaskItem): string {
  return firstText([task.target_host?.hostname])
}

function keepTaskTargetHost(next: ForensicTaskItem, previous: ForensicTaskItem): ForensicTaskItem {
  if (next.target_host) {
    return next
  }
  return {
    ...next,
    target_host: previous.target_host,
  }
}

const TARGET_ONLINE_STATUS_CLASS = {
  online: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  offline: "bg-slate-100 text-slate-600 ring-slate-200",
  unknown: "bg-amber-50 text-amber-700 ring-amber-200",
  unsynced: "bg-rose-50 text-rose-700 ring-rose-200",
} as const

const TARGET_ONLINE_STATUS_DOT = {
  online: "bg-emerald-600",
  offline: "bg-slate-500",
  unknown: "bg-amber-500",
  unsynced: "bg-rose-500",
} as const

function evidenceName(evidence: ForensicEvidenceItem): string {
  if (evidence.file_name) return evidence.file_name
  if (evidence.source_path) {
    const parts = evidence.source_path.split(/[\\/]/)
    return parts[parts.length - 1] || evidence.source_path
  }
  return evidence.artifact_id
}

function saveDownload(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

function flowInfo(task: ForensicTaskItem): { state: string; uploads: number; logs: number } {
  const parsed = parseJson(task.flow_status_json)
  if (!parsed || typeof parsed !== "object") return { state: task.status.toUpperCase(), uploads: 0, logs: 0 }
  const obj = parsed as Record<string, unknown>
  const getFlow = Array.isArray(obj.get_flow) ? obj.get_flow : []
  const first = getFlow[0] as Record<string, unknown> | undefined
  const flow = first?.Flow as Record<string, unknown> | undefined
  const state = typeof flow?.state === "string" ? flow.state : task.status.toUpperCase()
  const uploads = Array.isArray(obj.uploads) ? obj.uploads.length : 0
  const logs = Array.isArray(obj.flow_logs) ? obj.flow_logs.length : 0
  return { state, uploads, logs }
}

function JsonBlock({ value }: { value?: string }) {
  const parsed = parseJson(value)
  const content = parsed ? JSON.stringify(parsed, null, 2) : value || "-"
  return (
    <pre className="max-h-48 overflow-auto rounded-lg bg-slate-950 p-3 text-xs leading-5 text-slate-100">
      {content}
    </pre>
  )
}

export function ForensicTaskCenterPage({ context }: Props) {
  const t = useTranslations("pages.investigation.tasks")
  const [tasks, setTasks] = useState<ForensicTaskItem[]>([])
  const [selectedTask, setSelectedTask] = useState<ForensicTaskItem | null>(null)
  const [evidence, setEvidence] = useState<ForensicEvidenceItem[]>([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [keyword, setKeyword] = useState("")
  const [caseId, setCaseId] = useState(context.case_id || "")
  const [endpointId, setEndpointId] = useState(context.endpoint_id || "")
  const [artifactKey, setArtifactKey] = useState(context.artifact_key || "")
  const [status, setStatus] = useState<ForensicTaskStatus | "all">(context.status || "all")
  const [loading, setLoading] = useState(false)
  const [evidenceLoading, setEvidenceLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState("")
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null)
  const [headerCaseInput, setHeaderCaseInput] = useState(context.case_id || "")
  const selectedTaskIdRef = useRef<string>("")
  const createPanelRef = useRef<HTMLDivElement | null>(null)

  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const filteredTasks = useMemo(() => {
    const query = keyword.trim().toLowerCase()
    if (!query) return tasks
    return tasks.filter((task) =>
      [
        task.task_id,
        task.case_id,
        task.remote_flow_id,
        task.agent_id,
        task.endpoint_id,
        task.velociraptor_client_id,
        task.target_host?.hostname,
        ...(task.target_host?.ip ?? []),
        ...(task.target_host?.macs ?? []),
        task.artifact_key,
        task.artifact_name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    )
  }, [keyword, tasks])

  const selectedFlow = selectedTask ? flowInfo(selectedTask) : null
  const taskPanelRows = filteredTasks.length === 0 ? TASK_LIST_EMPTY_ROWS : Math.min(filteredTasks.length, pageSize)
  const taskPanelHeight = Math.max(TASK_PANEL_MIN_HEIGHT, TASK_PANEL_FIXED_HEIGHT + taskPanelRows * TASK_LIST_ROW_HEIGHT)
  const createDialogContext = useMemo(
    () => ({
      ...context,
      case_id: caseId.trim() || context.case_id,
      endpoint_id: endpointId.trim() || context.endpoint_id,
    }),
    [caseId, context, endpointId],
  )

  useEffect(() => {
    selectedTaskIdRef.current = selectedTask?.task_id || ""
  }, [selectedTask?.task_id])

  useEffect(() => {
    setHeaderCaseInput(caseId)
  }, [caseId])

  useEffect(() => {
    if (context.action !== "create") return
    window.requestAnimationFrame(() => {
      createPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }, [context.action])

  const loadEvidence = useCallback(
    async (taskId: string) => {
      setEvidenceLoading(true)
      try {
        const result = await listForensicEvidence({ task_id: taskId, page: 1, page_size: 10 })
        setEvidence(result.items)
      } catch (error) {
        setEvidence([])
        toast.error(t("toast.evidenceLoadFailed"), {
          description: error instanceof Error ? error.message : t("toast.retry"),
        })
      } finally {
        setEvidenceLoading(false)
      }
    },
    [t],
  )

  const selectTask = useCallback(
    (task: ForensicTaskItem) => {
      setSelectedTask(task)
      void loadEvidence(task.task_id)
    },
    [loadEvidence],
  )

  const refresh = useCallback(async () => {
    setLoading(true)
    const taskParams: ListForensicTasksRequest = compactParams({
      page,
      page_size: pageSize,
      case_id: caseId.trim(),
      endpoint_id: endpointId.trim(),
      velociraptor_client_id: context.velociraptor_client_id,
      artifact_key: artifactKey.trim(),
      status: status === "all" ? undefined : status,
      workflow_id: context.workflow_id,
      workflow_action_id: context.workflow_action_id,
    })

    try {
      const result = await listForensicTasks(taskParams)
      setTasks(result.items)
      setTotal(result.pagination.total_count)
      const nextSelected =
        (context.task_id
          ? result.items.find((item) => item.task_id === context.task_id)
          : undefined) ||
        (selectedTaskIdRef.current
          ? result.items.find((item) => item.task_id === selectedTaskIdRef.current)
          : undefined) ||
        result.items[0] ||
        null
      setSelectedTask(nextSelected)
      if (nextSelected) {
        void loadEvidence(nextSelected.task_id)
      } else {
        setEvidence([])
      }
      setRefreshedAt(new Date())
    } catch (error) {
      toast.error(t("toast.tasksLoadFailed"), {
        description: error instanceof Error ? error.message : t("toast.retry"),
      })
    } finally {
      setLoading(false)
    }
  }, [
    artifactKey,
    caseId,
    context.task_id,
    context.velociraptor_client_id,
    context.workflow_action_id,
    context.workflow_id,
    endpointId,
    loadEvidence,
    page,
    pageSize,
    status,
    t,
  ])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handleHeaderCaseSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const nextCaseId = headerCaseInput.trim()
      if (nextCaseId !== caseId.trim() || page !== 1) {
        setCaseId(nextCaseId)
        setPage(1)
        return
      }
      void refresh()
    },
    [caseId, headerCaseInput, page, refresh],
  )

  const handleHeaderRefreshClick = useCallback(() => {
    const nextCaseId = headerCaseInput.trim()
    if (nextCaseId !== caseId.trim()) {
      setCaseId(nextCaseId)
      setPage(1)
      return
    }
    void refresh()
  }, [caseId, headerCaseInput, refresh])

  const handleSync = useCallback(
    async (task: ForensicTaskItem) => {
      setActionLoading(`sync:${task.task_id}`)
      try {
        const next = await syncForensicTaskResult(task.task_id)
        const merged = keepTaskTargetHost(next, task)
        setTasks((current) => current.map((item) => (item.task_id === merged.task_id ? keepTaskTargetHost(merged, item) : item)))
        setSelectedTask(merged)
        await loadEvidence(merged.task_id)
        toast.success(t("toast.synced"))
      } catch (error) {
        toast.error(t("toast.syncFailed"), {
          description: error instanceof Error ? error.message : t("toast.retry"),
        })
      } finally {
        setActionLoading("")
      }
    },
    [loadEvidence, t],
  )

  const handleCancel = useCallback(
    async (task: ForensicTaskItem) => {
      if (!window.confirm(t("confirm.cancel"))) return
      setActionLoading(`cancel:${task.task_id}`)
      try {
        const next = await cancelForensicTask({ task_id: task.task_id, reason: "operator canceled from task center" })
        const merged = keepTaskTargetHost(next, task)
        setTasks((current) => current.map((item) => (item.task_id === merged.task_id ? keepTaskTargetHost(merged, item) : item)))
        setSelectedTask(merged)
        toast.success(t("toast.canceled"))
      } catch (error) {
        toast.error(t("toast.cancelFailed"), {
          description: error instanceof Error ? error.message : t("toast.retry"),
        })
      } finally {
        setActionLoading("")
      }
    },
    [t],
  )

  const handleDeleteTask = useCallback(
    async (task: ForensicTaskItem) => {
      if (!window.confirm(t("confirm.deleteTask"))) return
      setActionLoading(`delete:${task.task_id}`)
      try {
        const result = await deleteForensicTask({
          task_id: task.task_id,
          reason: "operator deleted from task center",
          delete_mode: "remote_sync",
        })
        if (result.remote_delete_status === "failed") {
          toast.error(t("toast.remoteDeleteFailed"), {
            description: result.remote_delete_error || t("toast.retry"),
          })
        } else {
          toast.success(t("toast.deleted"))
        }
        await refresh()
      } catch (error) {
        toast.error(t("toast.deleteFailed"), {
          description: error instanceof Error ? error.message : t("toast.retry"),
        })
      } finally {
        setActionLoading("")
      }
    },
    [refresh, t],
  )

  const handleDownloadFlow = useCallback(
    async (task: ForensicTaskItem) => {
      setActionLoading(`flow:${task.task_id}`)
      try {
        const result = await downloadForensicTaskFlowZip(task.task_id)
        saveDownload(result.blob, result.fileName)
      } catch (error) {
        toast.error(t("toast.downloadFailed"), {
          description: error instanceof Error ? error.message : t("toast.retry"),
        })
      } finally {
        setActionLoading("")
      }
    },
    [t],
  )

  const handleDownloadEvidence = useCallback(
    async (item: ForensicEvidenceItem) => {
      setActionLoading(`evidence:${item.artifact_id}`)
      try {
        const result = await downloadForensicEvidence(item.artifact_id)
        saveDownload(result.blob, result.fileName || evidenceName(item))
      } catch (error) {
        toast.error(t("toast.downloadFailed"), {
          description: error instanceof Error ? error.message : t("toast.retry"),
        })
      } finally {
        setActionLoading("")
      }
    },
    [t],
  )

  const handleDeleteEvidence = useCallback(
    async (item: ForensicEvidenceItem) => {
      if (!window.confirm(t("confirm.deleteEvidence"))) return
      setActionLoading(`deleteEvidence:${item.artifact_id}`)
      try {
        await deleteForensicEvidence({
          artifact_id: item.artifact_id,
          reason: "operator deleted from task center",
        })
        toast.success(t("toast.evidenceDeleted"))
        if (selectedTask) await loadEvidence(selectedTask.task_id)
      } catch (error) {
        toast.error(t("toast.evidenceDeleteFailed"), {
          description: error instanceof Error ? error.message : t("toast.retry"),
        })
      } finally {
        setActionLoading("")
      }
    },
    [loadEvidence, selectedTask, t],
  )

  return (
    <main className="bg-gray-50">
      <div className="flex min-h-[calc(100vh-3rem)] flex-col gap-6 p-6">
        <header className="w-full rounded-[28px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_12px_34px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 text-teal-600">
                <Archive aria-hidden className="h-5 w-5" />
              </div>

              <div className="min-w-0 space-y-1.5">
                <h1 className="line-clamp-2 break-words text-lg font-semibold leading-tight text-slate-950">
                  {t("header.title")}
                </h1>
                <div className="flex flex-wrap items-center gap-2.5 text-sm">
                  <span className="inline-flex h-7 items-center rounded-full border border-teal-500/20 bg-teal-500/10 px-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-teal-600">
                    FORENSIC
                  </span>
                  <span className="min-w-0 truncate text-slate-500">{t("header.subtitle")}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:gap-3">
              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                <form
                  className="flex h-12 w-full min-w-[320px] max-w-full items-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 px-4 shadow-inner shadow-slate-200/20 sm:w-[420px] xl:w-[520px]"
                  onSubmit={handleHeaderCaseSubmit}
                >
                  <Search aria-hidden className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    type="search"
                    aria-label={t("header.caseInputLabel")}
                    value={headerCaseInput}
                    onChange={(event) => setHeaderCaseInput(event.target.value)}
                    placeholder={t("header.casePlaceholder")}
                    disabled={loading}
                    className="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </form>

                <span className="h-6 w-px bg-slate-200" aria-hidden="true" />

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400">
                    <Clock3 aria-hidden className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-slate-400">{t("header.updatedAtLabel")}</div>
                    <div className="whitespace-nowrap text-sm font-medium tabular-nums text-slate-700">
                      {formatRefreshTime(refreshedAt)}
                    </div>
                  </div>
                </div>

                <span className="h-6 w-px bg-slate-200" aria-hidden="true" />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleHeaderRefreshClick}
                  disabled={loading}
                  aria-label={t("header.refreshLabel")}
                  className="h-10 w-10 shrink-0 rounded-full border-0 text-slate-400 shadow-none hover:bg-slate-100 hover:text-slate-600"
                >
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                  <span className="sr-only">{t("header.refreshLabel")}</span>
                </Button>

                <Button
                  asChild
                  variant="ghost"
                  className="h-10 shrink-0 rounded-full px-3 text-slate-500 shadow-none hover:bg-slate-100 hover:text-slate-700"
                >
                  <Link href="/frame/investigation/artifacts">
                    <Hexagon className="h-4 w-4" />
                    <span>{t("header.artifactConfigLabel")}</span>
                  </Link>
                </Button>

              </div>
            </div>
          </div>
        </header>

        <Card
          ref={createPanelRef}
          className="overflow-hidden rounded-[18px] border-0 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.08)]"
        >
          <CardHeader className="flex-row items-center justify-between gap-4 space-y-0 border-b border-slate-200 px-6 py-5">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-500/20">
                <Plus aria-hidden className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base font-semibold text-slate-950">{t("create.title")}</CardTitle>
                <p className="mt-1 text-sm leading-6 text-slate-500">{t("create.description")}</p>
              </div>
            </div>
            <Button
              type="submit"
              form={CREATE_TASK_FORM_ID}
              className="h-10 shrink-0 rounded-full bg-teal-600 px-4 text-white shadow-sm hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" />
              <span>{t("header.createTask")}</span>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <ForensicCreateTaskForm
              context={createDialogContext}
              initialArtifactKey={artifactKey.trim()}
              layout="workspace"
              formId={CREATE_TASK_FORM_ID}
              showFooter={false}
              className="px-6 py-5"
              onCreated={(task) => {
                setSelectedTask(task)
                void refresh()
              }}
            />
          </CardContent>
        </Card>

        <section className="grid flex-1 grid-cols-1 items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_640px]">
          <Card className="flex h-full flex-col overflow-hidden rounded-[18px] border-0 shadow-[0_12px_34px_rgba(15,23,42,0.08)]" style={{ height: taskPanelHeight }}>
            <CardHeader className="flex-row items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-500/20">
                  <ListChecks aria-hidden className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base font-semibold text-slate-950">
                    {t("list.title")}
                    <span className="ml-2 text-xs font-normal text-slate-500">{t("list.count", { count: total })}</span>
                  </CardTitle>
                </div>
              </div>
              <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                <div className="relative w-full max-w-[240px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder={t("filters.keyword")}
                    className="h-9 rounded-lg border-slate-200 bg-slate-50 pl-9 text-xs"
                  />
                </div>
                <Input
                  value={caseId}
                  onChange={(event) => {
                    setCaseId(event.target.value)
                    setPage(1)
                  }}
                  placeholder={t("filters.caseId")}
                  className="h-9 w-[130px] rounded-lg border-slate-200 bg-slate-50 text-xs"
                />
                <Select
                  value={status}
                  onValueChange={(value) => {
                    setStatus(value as ForensicTaskStatus | "all")
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="h-9 w-[120px] rounded-lg border-slate-200 bg-slate-50 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filters.allStatus")}</SelectItem>
                    {TASK_STATUSES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {t(`status.${item}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="icon" onClick={() => void refresh()} disabled={loading} className="h-9 w-9 shrink-0 rounded-lg" title={t("filters.apply")}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col p-0">
              <div className="flex-1 overflow-x-auto">
                <div className="flex h-full min-w-[1440px] flex-col">
                  <div className="grid grid-cols-[82px_170px_165px_220px_120px_180px_96px_minmax(180px,1fr)_170px_60px] border-b border-slate-200 px-6 py-3 text-xs text-slate-500">
                    <span>{t("list.columns.status")}</span>
                    <span>{t("list.columns.task")}</span>
                    <span>{t("list.columns.case")}</span>
                    <span>{t("list.columns.hostname")}</span>
                    <span>{t("list.columns.ip")}</span>
                    <span>{t("list.columns.mac")}</span>
                    <span className="text-center">{t("list.columns.online")}</span>
                    <span>{t("list.columns.artifact")}</span>
                    <span>{t("list.columns.created")}</span>
                    <span className="text-right">{t("list.columns.actions")}</span>
                  </div>

                  <div className="flex-1">
                    {loading && tasks.length === 0 ? (
                      <div className="flex h-full min-h-72 items-center justify-center text-sm text-slate-500">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("list.loading")}
                      </div>
                    ) : filteredTasks.length === 0 ? (
                      <div className="flex h-full min-h-72 flex-col items-center justify-center text-center">
                        <FileText className="h-10 w-10 text-slate-300" />
                        <div className="mt-3 text-sm font-semibold text-slate-700">{t("list.emptyTitle")}</div>
                        <div className="mt-1 text-xs text-slate-500">{t("list.emptyDescription")}</div>
                      </div>
                    ) : (
                      filteredTasks.map((task) => {
                        const hostname = taskHostname(task)
                        const agentID = taskHostAgentID(task)
                        const ipList = cleanList(task.target_host?.ip)
                        const macList = cleanList(task.target_host?.macs)
                        const ipTitle = ipList.join(", ")
                        const macTitle = macList.join(", ")
                        const targetStatus = taskOnlineStatus(task)
                        return (
                          <button
                            key={task.task_id}
                            type="button"
                            onClick={() => selectTask(task)}
                            className={cn(
                              "grid w-full grid-cols-[82px_170px_165px_220px_120px_180px_96px_minmax(180px,1fr)_170px_60px] items-center border-b border-slate-100 px-6 py-3 text-left transition-colors hover:bg-slate-50",
                              selectedTask?.task_id === task.task_id && "bg-blue-50/70 hover:bg-blue-50",
                            )}
                          >
                            <span className={cn("inline-flex h-6 w-16 items-center justify-center rounded-full text-xs font-semibold", statusClass(task.status))}>
                              {t(`status.${task.status}`)}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate font-mono text-xs font-semibold text-slate-800">{task.task_id}</span>
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate font-mono text-xs text-slate-700" title={task.case_id || t("list.noCase")}>
                                {task.case_id || t("list.noCase")}
                              </span>
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-medium text-slate-800" title={hostname}>
                                {hostname || "-"}
                              </span>
                              <span className="mt-1 block truncate font-mono text-[11px] text-slate-400" title={agentID}>
                                {agentID || "-"}
                              </span>
                            </span>
                            <span className="min-w-0 font-mono text-xs text-slate-700" title={ipTitle}>
                              {ipList.length > 0 ? (
                                ipList.map((item) => (
                                  <span key={item} className="block truncate leading-5">
                                    {item}
                                  </span>
                                ))
                              ) : (
                                <span className="block">-</span>
                              )}
                            </span>
                            <span className="min-w-0 font-mono text-xs text-slate-700" title={macTitle}>
                              {macList.length > 0 ? (
                                macList.map((item) => (
                                  <span key={item} className="block truncate leading-5">
                                    {item}
                                  </span>
                                ))
                              ) : (
                                <span className="block">-</span>
                              )}
                            </span>
                            <span className="flex justify-center">
                              <span className={cn("inline-flex h-5 min-w-20 items-center gap-1 rounded-full px-2 text-[10px] font-medium ring-1", TARGET_ONLINE_STATUS_CLASS[targetStatus])}>
                                <span className={cn("size-1.5 shrink-0 rounded-full", TARGET_ONLINE_STATUS_DOT[targetStatus])} />
                                <span className="min-w-0 flex-1 truncate text-center">{t(`list.onlineStatus.${targetStatus}`)}</span>
                              </span>
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate font-mono text-xs text-slate-700">{task.artifact_name || task.artifact_key}</span>
                            </span>
                            <span>
                              <span className="block font-mono text-xs text-slate-700">{formatUnixTime(task.created_at)}</span>
                            </span>
                            <span className="flex justify-end">
                              <MoreHorizontal className="h-5 w-5 text-slate-500" />
                            </span>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
                <span className="text-xs text-slate-500">{t("list.page", { page, total: pageCount })}</span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-slate-950 px-2 text-xs font-semibold text-white">{page}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page >= pageCount || loading}
                    onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex h-full min-h-0 flex-col overflow-hidden rounded-[18px] border-0 shadow-[0_12px_34px_rgba(15,23,42,0.08)]" style={{ height: taskPanelHeight }}>
            <CardHeader className="flex-row items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                  <ScrollText aria-hidden className="h-5 w-5" />
                </div>
                <CardTitle className="truncate text-base font-semibold text-slate-950">{t("detail.title")}</CardTitle>
              </div>
              {selectedTask ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={actionLoading === `sync:${selectedTask.task_id}`}
                    onClick={() => void handleSync(selectedTask)}
                    title={t("actions.sync")}
                  >
                    {actionLoading === `sync:${selectedTask.task_id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={!selectedTask.remote_flow_id || actionLoading === `flow:${selectedTask.task_id}`}
                    onClick={() => void handleDownloadFlow(selectedTask)}
                    title={t("actions.downloadZip")}
                  >
                    {actionLoading === `flow:${selectedTask.task_id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileArchive className="h-4 w-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 shrink-0 whitespace-nowrap border-red-200 px-3 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => void handleDeleteTask(selectedTask)}
                    disabled={actionLoading === `delete:${selectedTask.task_id}`}
                    title={t("actions.deleteTask")}
                  >
                    {actionLoading === `delete:${selectedTask.task_id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    {t("actions.deleteTask")}
                  </Button>
                </div>
              ) : null}
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-hidden p-5">
              {!selectedTask ? (
                <div className="flex h-full min-h-72 flex-col items-center justify-center text-center">
                  <FileText className="h-10 w-10 text-slate-300" />
                  <div className="mt-3 text-sm font-semibold text-slate-700">{t("detail.emptyTitle")}</div>
                  <div className="mt-1 text-xs text-slate-500">{t("detail.emptyDescription")}</div>
                </div>
              ) : (
                <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
                  <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <span className={cn("inline-flex h-10 w-10 items-center justify-center rounded-xl", statusClass(selectedTask.status))}>
                        {selectedTask.status === "success" ? <CheckCircle2 className="h-5 w-5" /> : selectedTask.status === "failed" ? <AlertTriangle className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-mono text-sm font-semibold text-slate-900">{selectedTask.task_id}</div>
                        <div className="mt-0.5 truncate font-mono text-[11px] text-slate-400">Flow {selectedTask.remote_flow_id || "-"}</div>
                      </div>
                      <span className={cn("inline-flex h-7 min-w-16 items-center justify-center rounded-full px-3 text-xs font-semibold", statusClass(selectedTask.status))}>
                        {t(`status.${selectedTask.status}`)}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-x-6 gap-y-3 border-t border-slate-200 pt-3 sm:grid-cols-2">
                      <div className="min-w-0">
                        <div className="text-xs text-slate-500">{t("detail.caseId")}</div>
                        <div className="mt-1 truncate font-mono text-xs text-slate-800">{selectedTask.case_id || "-"}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-slate-500">{t("detail.agentId")}</div>
                        <div className="mt-1 truncate font-mono text-xs text-slate-800">{selectedTask.agent_id || "-"}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-slate-500">{t("detail.artifact")}</div>
                        <div className="mt-1 truncate font-mono text-xs text-slate-800">{selectedTask.artifact_name || selectedTask.artifact_key}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-slate-500">{t("detail.createdAt")}</div>
                        <div className="mt-1 font-mono text-xs text-slate-800">{formatUnixTime(selectedTask.created_at)}</div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-slate-950">{t("detail.flowStatus")}</h3>
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="font-mono text-xs text-slate-800">{selectedFlow?.state || "-"}</span>
                      </span>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-slate-600">{t("detail.uploads", { count: selectedFlow?.uploads ?? 0 })}</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-slate-600">{t("detail.logs", { count: selectedFlow?.logs ?? 0 })}</span>
                      </div>
                    </div>
                  </section>

                  <div className="min-h-0 flex-1 overflow-hidden">
                    <div className="grid h-full min-h-0 grid-rows-[minmax(96px,0.9fr)_minmax(128px,1fr)_auto] gap-4">
                      <section className="flex min-h-0 flex-col space-y-3 overflow-hidden">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-slate-950">{t("detail.evidence")}</h3>
                        <Button
                          type="button"
                          size="sm"
                          disabled={!selectedTask.remote_flow_id || actionLoading === `flow:${selectedTask.task_id}`}
                          onClick={() => void handleDownloadFlow(selectedTask)}
                          className="h-8 rounded-lg bg-slate-950 text-white hover:bg-slate-800"
                        >
                          <Download className="h-4 w-4" />
                          {t("actions.zip")}
                        </Button>
                      </div>

                      {evidenceLoading ? (
                        <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-slate-500">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("detail.evidenceLoading")}
                        </div>
                      ) : evidence.length === 0 ? (
                        <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 py-4 text-center text-sm text-slate-500">
                          {t("detail.noEvidence")}
                        </div>
                      ) : (
                        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                          {evidence.map((item) => (
                            <div key={item.artifact_id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                              <FileText className="h-5 w-5 shrink-0 text-slate-500" />
                              <div className="min-w-0 flex-1">
                                <div className="truncate font-mono text-xs text-slate-800">{evidenceName(item)}</div>
                                <div className="mt-0.5 truncate font-mono text-[11px] text-slate-400">{item.source_path || item.artifact_id}</div>
                              </div>
                              <span className="shrink-0 text-xs text-slate-500">{formatBytes(item.size)}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600"
                                disabled={actionLoading === `evidence:${item.artifact_id}`}
                                onClick={() => void handleDownloadEvidence(item)}
                              >
                                {actionLoading === `evidence:${item.artifact_id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600"
                                disabled={actionLoading === `deleteEvidence:${item.artifact_id}`}
                                onClick={() => void handleDeleteEvidence(item)}
                              >
                                {actionLoading === `deleteEvidence:${item.artifact_id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      </section>

                      <section className="flex min-h-0 flex-col space-y-3 overflow-hidden">
                        <h3 className="shrink-0 text-sm font-semibold text-slate-950">{t("detail.params")}</h3>
                        <JsonBlock value={selectedTask.params_json} />
                      </section>

                      <div className="space-y-4 overflow-hidden">
                        {selectedTask.error_msg ? (
                          <section className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            <div className="font-semibold">{selectedTask.error_code || t("detail.error")}</div>
                            <div className="mt-1 text-xs leading-5">{selectedTask.error_msg}</div>
                          </section>
                        ) : null}

                        {selectedTask.status === "pending" || selectedTask.status === "running" ? (
                          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => void handleCancel(selectedTask)}
                              disabled={actionLoading === `cancel:${selectedTask.task_id}`}
                            >
                              {actionLoading === `cancel:${selectedTask.task_id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                              {t("actions.cancel")}
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
