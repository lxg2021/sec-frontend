"use client"

import type { FormEvent } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Hexagon,
  ListChecks,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { Input } from "@/shared/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { cn } from "@/shared/lib/utils"
import {
  cancelForensicTask,
  deleteForensicTask,
  downloadForensicTaskFlowZip,
  listForensicTasks,
} from "@/shared/lib/forensic/api"
import type {
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
const TASK_TABLE_GRID_CLASS =
  "grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,2fr)_minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]"

function formatUnixTime(value?: number): string {
  if (!value) return "-"
  const date = new Date(value * 1000)
  const pad = (num: number) => String(num).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function formatUnixClockTime(value?: number): string {
  if (!value) return "-"
  const date = new Date(value * 1000)
  const pad = (num: number) => String(num).padStart(2, "0")
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function formatTaskDuration(task: ForensicTaskItem): string {
  const start = task.started_at || task.created_at
  if (!start) return "-"
  const terminalEnd = task.finished_at || task.last_sync_at || task.updated_at
  const end = terminalEnd || (canCancelTask(task.status) ? Math.floor(Date.now() / 1000) : 0)
  if (!end || end < start) return "-"
  const seconds = Math.max(0, end - start)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainSeconds = seconds % 60
  if (minutes < 60) return `${minutes}m ${String(remainSeconds).padStart(2, "0")}s`
  const hours = Math.floor(minutes / 60)
  const remainMinutes = minutes % 60
  return `${hours}h ${String(remainMinutes).padStart(2, "0")}m`
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

function taskErrorSummary(task: ForensicTaskItem): string {
  return firstText([task.error_msg, task.error_code])
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

function canCancelTask(status: ForensicTaskStatus): boolean {
  return status === "pending" || status === "running"
}

function taskDetailHref(task: ForensicTaskItem): string {
  const params = new URLSearchParams({ task_id: task.task_id })
  const target = task.target_host
  const hostname = taskHostname(task)
  const agentID = taskHostAgentID(task)
  const ip = cleanList(target?.ip).join(",")
  const macs = cleanList(target?.macs).join(",")
  if (hostname) params.set("hostname", hostname)
  if (agentID) params.set("agent_id", agentID)
  if (ip) params.set("ip", ip)
  if (macs) params.set("macs", macs)
  return `/frame/investigation/tasks/detail?${params.toString()}`
}

export function ForensicTaskCenterPage({ context }: Props) {
  const t = useTranslations("pages.investigation.tasks")
  const router = useRouter()
  const [tasks, setTasks] = useState<ForensicTaskItem[]>([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [keyword, setKeyword] = useState("")
  const [caseId, setCaseId] = useState(context.case_id || "")
  const [endpointId] = useState(context.endpoint_id || "")
  const [status, setStatus] = useState<ForensicTaskStatus | "all">(context.status || "all")
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState("")
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null)
  const [headerCaseInput, setHeaderCaseInput] = useState(context.case_id || "")
  const createPanelRef = useRef<HTMLDivElement | null>(null)
  const initialCreateArtifactKey = context.artifact_key?.trim() || ""

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

  const createDialogContext = useMemo(
    () => ({
      ...context,
      case_id: caseId.trim() || context.case_id,
      endpoint_id: endpointId.trim() || context.endpoint_id,
    }),
    [caseId, context, endpointId],
  )

  useEffect(() => {
    setHeaderCaseInput(caseId)
  }, [caseId])

  useEffect(() => {
    if (context.action !== "create") return
    window.requestAnimationFrame(() => {
      createPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }, [context.action])

  useEffect(() => {
    if (!context.task_id || context.action === "create") return
    router.replace(`/frame/investigation/tasks/detail?task_id=${encodeURIComponent(context.task_id)}`)
  }, [context.action, context.task_id, router])

  const refresh = useCallback(async () => {
    setLoading(true)
    const taskParams: ListForensicTasksRequest = compactParams({
      page,
      page_size: pageSize,
      case_id: caseId.trim(),
      endpoint_id: endpointId.trim(),
      velociraptor_client_id: context.velociraptor_client_id,
      status: status === "all" ? undefined : status,
      workflow_id: context.workflow_id,
      workflow_action_id: context.workflow_action_id,
    })

    try {
      const result = await listForensicTasks(taskParams)
      setTasks(result.items)
      setTotal(result.pagination.total_count)
      setRefreshedAt(new Date())
    } catch (error) {
      toast.error(t("toast.tasksLoadFailed"), {
        description: error instanceof Error ? error.message : t("toast.retry"),
      })
    } finally {
      setLoading(false)
    }
  }, [
    caseId,
    context.velociraptor_client_id,
    context.workflow_action_id,
    context.workflow_id,
    endpointId,
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

  const handleCancel = useCallback(
    async (task: ForensicTaskItem) => {
      if (!window.confirm(t("confirm.cancel"))) return
      setActionLoading(`cancel:${task.task_id}`)
      try {
        const next = await cancelForensicTask({ task_id: task.task_id, reason: "operator canceled from task center" })
        const merged = keepTaskTargetHost(next, task)
        setTasks((current) => current.map((item) => (item.task_id === merged.task_id ? keepTaskTargetHost(merged, item) : item)))
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

            <div className="flex flex-col gap-3 lg:items-end">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className="text-xs text-slate-400">{t("header.updatedAt", { time: formatRefreshTime(refreshedAt) })}</span>
                <span className="h-4 w-px bg-slate-200" />
                <form className="flex items-center gap-2" onSubmit={handleHeaderCaseSubmit}>
                  <Input
                    aria-label={t("header.caseInputLabel")}
                    value={headerCaseInput}
                    onChange={(event) => setHeaderCaseInput(event.target.value)}
                    placeholder={t("header.casePlaceholder")}
                    className="h-10 w-[220px] rounded-full border-slate-200 bg-slate-50 px-4 text-sm shadow-none"
                  />
                </form>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full text-slate-500 shadow-none hover:bg-slate-100 hover:text-slate-700"
                  onClick={handleHeaderRefreshClick}
                  disabled={loading}
                  title={t("header.refreshLabel")}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
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
              initialArtifactKey={initialCreateArtifactKey}
              layout="workspace"
              formId={CREATE_TASK_FORM_ID}
              showFooter={false}
              className="px-6 py-5"
              onCreated={(task) => {
                setPage(1)
                void refresh()
                router.push(taskDetailHref(task))
              }}
            />
          </CardContent>
        </Card>

        <Card className="flex min-h-[560px] flex-1 flex-col overflow-hidden rounded-[18px] border-0 shadow-[0_12px_34px_rgba(15,23,42,0.08)]">
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
              <div className="relative w-full max-w-[260px]">
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
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => void refresh()}
                disabled={loading}
                className="h-9 w-9 shrink-0 rounded-lg"
                title={t("filters.apply")}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col p-0">
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="flex h-full min-w-0 flex-col">
                <div className={cn("grid min-w-0 border-b border-slate-200 px-4 py-3 text-center text-xs text-slate-500", TASK_TABLE_GRID_CLASS)}>
                  <span className="min-w-0 truncate">{t("list.columns.status")}</span>
                  <span className="min-w-0 truncate">{t("list.columns.task")}</span>
                  <span className="min-w-0 truncate">{t("list.columns.case")}</span>
                  <span className="min-w-0 truncate">{t("list.columns.flow")}</span>
                  <span className="min-w-0 truncate">{t("list.columns.hostname")}</span>
                  <span className="min-w-0 truncate">{t("list.columns.ip")}</span>
                  <span className="min-w-0 truncate">{t("list.columns.mac")}</span>
                  <span className="min-w-0 truncate text-center">{t("list.columns.online")}</span>
                  <span className="min-w-0 truncate">{t("list.columns.artifact")}</span>
                  <span className="min-w-0 truncate">{t("list.columns.created")}</span>
                  <span className="min-w-0 truncate">{t("list.columns.synced")}</span>
                  <span className="min-w-0 truncate">{t("list.columns.duration")}</span>
                  <span className="min-w-0 truncate">{t("list.columns.error")}</span>
                  <span className="min-w-0 truncate text-center">{t("list.columns.download")}</span>
                  <span className="min-w-0 truncate text-center">{t("list.columns.detail")}</span>
                  <span className="min-w-0 truncate text-center">{t("list.columns.actions")}</span>
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
                      const downloadingFlow = actionLoading === `flow:${task.task_id}`
                      const canceling = actionLoading === `cancel:${task.task_id}`
                      const deleting = actionLoading === `delete:${task.task_id}`
                      const flowID = task.remote_flow_id || ""
                      const duration = formatTaskDuration(task)
                      const errorSummary = taskErrorSummary(task)
                      return (
                        <div
                          key={task.task_id}
                          role="button"
                          tabIndex={0}
                          onDoubleClick={() => router.push(taskDetailHref(task))}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault()
                              router.push(taskDetailHref(task))
                            }
                          }}
                          className={cn(
                            "grid min-w-0 w-full cursor-pointer items-center border-b border-slate-100 px-4 py-3 text-center transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200",
                            TASK_TABLE_GRID_CLASS
                          )}
                        >
                          <span className={cn("inline-flex h-6 w-14 justify-self-center items-center justify-center rounded-full text-xs font-semibold", statusClass(task.status))}>
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
                            <span className="block truncate font-mono text-xs text-slate-700" title={flowID || t("list.notDispatched")}>
                              {flowID || t("list.notDispatched")}
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
                          <span className="flex min-w-0 justify-center">
                            <span className={cn("inline-flex h-5 w-14 min-w-0 items-center gap-1 rounded-full px-1.5 text-[10px] font-medium ring-1", TARGET_ONLINE_STATUS_CLASS[targetStatus])}>
                              <span className={cn("size-1.5 shrink-0 rounded-full", TARGET_ONLINE_STATUS_DOT[targetStatus])} />
                              <span className="min-w-0 flex-1 truncate text-center">{t(`list.onlineStatus.${targetStatus}`)}</span>
                            </span>
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-mono text-xs text-slate-700">{task.artifact_name || task.artifact_key}</span>
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-mono text-xs text-slate-700" title={formatUnixTime(task.created_at)}>{formatUnixClockTime(task.created_at)}</span>
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-mono text-xs text-slate-700" title={formatUnixTime(task.last_sync_at)}>{formatUnixClockTime(task.last_sync_at)}</span>
                          </span>
                          <span className="min-w-0 truncate font-mono text-xs text-slate-700" title={duration}>{duration}</span>
                          <span className="min-w-0">
                            <span
                              className={cn("block truncate text-xs", errorSummary ? "text-red-600" : "text-slate-400")}
                              title={errorSummary || "-"}
                            >
                              {errorSummary || "-"}
                            </span>
                          </span>
                          <span
                            className="flex justify-center"
                            onClick={(event) => event.stopPropagation()}
                            onDoubleClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 disabled:text-slate-300"
                              aria-label={t("actions.downloadZip")}
                              title={t("actions.downloadZip")}
                              disabled={!task.remote_flow_id || downloadingFlow}
                              onClick={() => void handleDownloadFlow(task)}
                            >
                              {downloadingFlow ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            </Button>
                          </span>
                          <span
                            className="flex justify-center"
                            onClick={(event) => event.stopPropagation()}
                            onDoubleClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            <Button
                              asChild
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 min-w-9 rounded-lg px-2 font-mono text-xs font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                              aria-label={t("actions.viewDetail")}
                              title={t("actions.viewDetail")}
                            >
                              <Link href={taskDetailHref(task)}>-&gt;</Link>
                            </Button>
                          </span>
                          <span
                            className="flex items-center justify-center gap-1"
                            onClick={(event) => event.stopPropagation()}
                            onDoubleClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg text-slate-500 hover:bg-white hover:text-slate-800"
                                  aria-label={t("list.columns.actions")}
                                >
                                  {canceling || deleting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreHorizontal className="h-5 w-5" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44 rounded-xl">
                                {canCancelTask(task.status) ? (
                                  <DropdownMenuItem disabled={canceling} onSelect={() => void handleCancel(task)}>
                                    {canceling ? <Loader2 className="h-4 w-4 animate-spin text-amber-600" /> : <XCircle className="h-4 w-4 text-amber-600" />}
                                    {t("actions.cancel")}
                                  </DropdownMenuItem>
                                ) : null}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  disabled={deleting}
                                  onSelect={() => void handleDeleteTask(task)}
                                  className="text-red-600 focus:bg-red-50 focus:text-red-700"
                                >
                                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                  {t("actions.deleteTask")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </span>
                        </div>
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
      </div>
    </main>
  )
}
