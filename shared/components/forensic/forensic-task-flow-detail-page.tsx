"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Database,
  FileArchive,
  FileJson,
  FileText,
  Loader2,
  RefreshCw,
  ScrollText,
  Server,
  Trash2,
  UploadCloud,
  XCircle,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { cn } from "@/shared/lib/utils"
import {
  cancelForensicTask,
  deleteForensicTask,
  downloadForensicTaskFlowZip,
  getForensicTaskFlowDetail,
} from "@/shared/lib/forensic/api"
import type {
  ForensicTaskFlowCollection,
  ForensicTaskFlowRequests,
  ForensicTaskFlowTable,
  ForensicTaskItem,
  ForensicTaskStatus,
  GetForensicTaskFlowDetailData,
} from "@/shared/lib/forensic/types"

interface Props {
  taskId?: string
}

function formatUnixTime(value?: number): string {
  if (!value) return "-"
  const date = new Date(value * 1000)
  const pad = (num: number) => String(num).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function statusClass(status?: string): string {
  const normalized = (status || "").trim().toLowerCase() as ForensicTaskStatus
  const classes: Record<ForensicTaskStatus, string> = {
    pending: "bg-slate-100 text-slate-600",
    running: "bg-blue-100 text-blue-700",
    success: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-700",
    canceled: "bg-slate-100 text-slate-500",
    timeout: "bg-amber-100 text-amber-700",
  }
  return classes[normalized] || "bg-slate-100 text-slate-600"
}

function statusIcon(status?: string) {
  const normalized = (status || "").trim().toLowerCase()
  if (normalized === "success") return <CheckCircle2 className="h-5 w-5" />
  if (normalized === "failed" || normalized === "timeout") return <AlertTriangle className="h-5 w-5" />
  if (normalized === "canceled") return <XCircle className="h-5 w-5" />
  if (normalized === "running") return <Activity className="h-5 w-5" />
  return <Clock3 className="h-5 w-5" />
}

function cleanList(values?: string[]): string[] {
  return (values ?? []).map((item) => item.trim()).filter(Boolean)
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

function parseRows(rowsJson?: string): Record<string, unknown>[] {
  if (!rowsJson?.trim()) return []
  try {
    const parsed = JSON.parse(rowsJson)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is Record<string, unknown> => item !== null && typeof item === "object" && !Array.isArray(item))
  } catch {
    return []
  }
}

function parseJsonPretty(value?: string): string {
  if (!value?.trim()) return "-"
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

function inferColumns(table?: ForensicTaskFlowTable | null, rows: Record<string, unknown>[] = []): string[] {
  if (table?.columns?.length) return table.columns
  const seen = new Set<string>()
  for (const row of rows) {
    Object.keys(row).forEach((key) => seen.add(key))
  }
  return Array.from(seen).sort()
}

function cellValue(value: unknown): string {
  if (value === null || value === undefined) return "-"
  if (typeof value === "string") return value || "-"
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function canCancelTask(status?: string): boolean {
  return status === "pending" || status === "running"
}

function InfoItem({ label, value, mono = false, className }: { label: string; value?: string; mono?: boolean; className?: string }) {
  return (
    <div className={cn("min-w-0 rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]", className)}>
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={cn("mt-1.5 truncate text-sm font-semibold text-slate-900", mono && "font-mono text-xs")} title={value || "-"}>
        {value || "-"}
      </div>
    </div>
  )
}

type JsonRecord = Record<string, unknown>

interface FlowParameter {
  key: string
  value: string
}

interface FlowParameterGroup {
  artifact: string
  params: FlowParameter[]
}

interface KeyValueRow {
  label: string
  value: ReactNode
  title?: string
  mono?: boolean
}

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function parseJsonValue(value?: string): unknown {
  if (!value?.trim()) return undefined
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

function parseJsonRecord(value?: string): JsonRecord | null {
  const parsed = parseJsonValue(value)
  if (isRecord(parsed)) return parsed
  if (Array.isArray(parsed) && isRecord(parsed[0])) return parsed[0]
  return null
}

function getPath(record: JsonRecord | null | undefined, path: string[]): unknown {
  let current: unknown = record
  for (const key of path) {
    if (!isRecord(current)) return undefined
    current = current[key]
  }
  return current
}

function firstPath(record: JsonRecord | null | undefined, paths: string[][]): unknown {
  for (const path of paths) {
    const value = getPath(record, path)
    if (value !== undefined && value !== null && value !== "") return value
  }
  return undefined
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function stringValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-"
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function extractFlow(rawJson?: string): JsonRecord | null {
  const row = parseJsonRecord(rawJson)
  if (!row) return null
  const flow = row.Flow ?? row.flow
  if (isRecord(flow)) return flow
  return row
}

function getFlowRequest(flow: JsonRecord | null, collection?: ForensicTaskFlowCollection | null, requests?: ForensicTaskFlowRequests | null): JsonRecord | null {
  const flowRequest = getPath(flow, ["request"])
  if (isRecord(flowRequest)) return flowRequest
  return parseJsonRecord(collection?.request_json) || parseJsonRecord(requests?.velociraptor_request_json) || parseJsonRecord(requests?.raw_json)
}

function microsToUnixSeconds(value: unknown): number | undefined {
  const parsed = numberValue(value)
  if (parsed === undefined || parsed <= 0) return undefined
  if (parsed > 1_000_000_000_000) return Math.floor(parsed / 1_000_000)
  return Math.floor(parsed)
}

function formatFlowTime(primary?: number, fallback?: unknown): string {
  if (primary && primary > 0) return formatUnixTime(primary)
  return formatUnixTime(microsToUnixSeconds(fallback))
}

function formatFlowDuration(flow: JsonRecord | null, collection?: ForensicTaskFlowCollection | null): string | undefined {
  const rawDuration = numberValue(firstPath(flow, [["execution_duration"], ["ExecutionDuration"]]))
  if (rawDuration !== undefined && rawDuration > 0) {
    return formatSeconds(rawDuration / 1_000_000_000)
  }
  const start = collection?.start_time || microsToUnixSeconds(firstPath(flow, [["start_time"], ["StartTime"]]))
  const active = collection?.active_time || microsToUnixSeconds(firstPath(flow, [["active_time"], ["ActiveTime"]]))
  if (start && active && active >= start) return formatSeconds(active - start)
  return undefined
}

function formatSeconds(value: number): string {
  if (!Number.isFinite(value)) return "-"
  if (value < 1) return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")
  if (value < 10) return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")
  return String(Math.round(value))
}

function formatLimit(value: unknown, unlimitedText: string, unit?: string): string {
  const parsed = numberValue(value)
  if (parsed === undefined) return "-"
  if (parsed === 0) return unlimitedText
  return unit ? `${parsed} ${unit}` : String(parsed)
}

function formatRowsLimit(value: unknown, unlimitedText: string, rowsText: string): string {
  const parsed = numberValue(value)
  if (parsed === undefined) return "-"
  if (parsed === 0) return unlimitedText
  if (parsed >= 1_000_000 && parsed % 1_000_000 === 0) return `${parsed / 1_000_000}m ${rowsText}`
  return `${parsed.toLocaleString()} ${rowsText}`
}

function formatMaxMb(value: unknown, unlimitedText: string): string {
  const parsed = numberValue(value)
  if (parsed === undefined) return "-"
  if (parsed === 0) return unlimitedText
  return `${(parsed / 1024 / 1024).toFixed(2)} Mb`
}

function formatBytes(value: unknown): string {
  const parsed = numberValue(value)
  if (parsed === undefined) return "-"
  if (parsed === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  let size = parsed
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }
  const text = size >= 10 || unitIndex === 0 ? size.toFixed(0) : size.toFixed(2)
  return `${text} ${units[unitIndex]}`
}

function formatUploadedBytes(flow: JsonRecord | null): string {
  const uploaded = firstPath(flow, [["total_uploaded_bytes"], ["TotalUploadedBytes"]])
  const expected = firstPath(flow, [["total_expected_uploaded_bytes"], ["TotalExpectedUploadedBytes"]])
  if (uploaded === undefined && expected === undefined) return "-"
  return `${formatBytes(uploaded ?? 0)} / ${formatBytes(expected ?? 0)}`
}

function formatFlowState(state?: string, status?: string): string {
  const normalizedState = (state || "").trim().toUpperCase()
  const normalizedStatus = (status || "").trim().toLowerCase()
  if (normalizedState === "FINISHED" || normalizedStatus === "success") return "Completed"
  if (normalizedState === "RUNNING" || normalizedStatus === "running") return "Running"
  if (normalizedState === "ERROR" || normalizedStatus === "failed") return "Failed"
  if (normalizedState === "CANCELLED" || normalizedState === "CANCELED" || normalizedStatus === "canceled") return "Canceled"
  return state || status || "-"
}

function arrayOfStrings(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }
  const single = stringValue(value)
  return single === "-" ? [] : [single]
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const value of values) {
    const trimmed = value.trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    result.push(trimmed)
  }
  return result
}

function artifactNamesFrom(flow: JsonRecord | null, request: JsonRecord | null, collection: ForensicTaskFlowCollection | null | undefined, task: ForensicTaskItem): string[] {
  return uniqueStrings([
    ...arrayOfStrings(getPath(request, ["artifacts"])),
    ...arrayOfStrings(getPath(flow, ["artifacts_with_results"])),
    collection?.artifact || "",
    task.velociraptor_artifact || "",
    task.artifact_key || "",
  ])
}

function paramsFromEnv(value: unknown): FlowParameter[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!isRecord(item)) return null
      const key = stringValue(item.key ?? item.Key)
      if (key === "-") return null
      return { key, value: stringValue(item.value ?? item.Value) }
    })
    .filter((item): item is FlowParameter => item !== null)
}

function paramsFromRecord(record: JsonRecord | null): FlowParameter[] {
  if (!record) return []
  return Object.entries(record)
    .filter(([key]) => key.trim() !== "")
    .map(([key, value]) => ({ key, value: stringValue(value) }))
}

function parameterGroupsFrom(request: JsonRecord | null, task: ForensicTaskItem, requests?: ForensicTaskFlowRequests | null): FlowParameterGroup[] {
  const specs = getPath(request, ["specs"])
  if (Array.isArray(specs)) {
    const groups = specs
      .map((spec) => {
        if (!isRecord(spec)) return null
        const artifact = stringValue(spec.artifact ?? spec.Artifact)
        const params = paramsFromEnv(getPath(spec, ["parameters", "env"]))
        return { artifact: artifact === "-" ? task.velociraptor_artifact || task.artifact_key : artifact, params }
      })
      .filter((item): item is FlowParameterGroup => item !== null)
    if (groups.length > 0) return groups
  }

  const velociraptorParams = paramsFromRecord(parseJsonRecord(requests?.velociraptor_args_json))
  const fallbackParams = velociraptorParams.length > 0 ? velociraptorParams : paramsFromRecord(parseJsonRecord(requests?.params_json || task.params_json))
  if (fallbackParams.length === 0) return []
  return [
    {
      artifact: task.velociraptor_artifact || task.artifact_key,
      params: fallbackParams,
    },
  ]
}

function InlineList({ values, tone = "slate" }: { values: string[]; tone?: "slate" | "emerald" }) {
  if (values.length === 0) return <span>-</span>

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <span
          key={value}
          className={cn(
            "inline-flex max-w-full items-center rounded-md px-2 py-1 font-mono text-[11px] font-semibold",
            tone === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700",
          )}
        >
          <span className="truncate">{value}</span>
        </span>
      ))}
    </div>
  )
}

function EmptyTableState({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("flex min-h-[132px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-center", className)}>
      <FileText className="h-9 w-9 text-slate-300" />
      <div className="mt-2 text-sm font-semibold text-slate-700">{text}</div>
    </div>
  )
}

function KeyValueTable({
  rows,
  emptyText,
  fieldHeader,
  valueHeader,
  className,
}: {
  rows: KeyValueRow[]
  emptyText: string
  fieldHeader: string
  valueHeader: string
  className?: string
}) {
  if (rows.length === 0) return <EmptyTableState text={emptyText} />

  return (
    <div className={cn("min-h-0 overflow-auto rounded-xl border border-slate-200 bg-white", className)}>
      <table className="w-full table-fixed border-separate border-spacing-0 text-left text-xs">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="w-[220px] border-b border-slate-200 px-4 py-3 font-semibold">{fieldHeader}</th>
            <th className="border-b border-slate-200 px-4 py-3 font-semibold">{valueHeader}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <tr key={`${row.label}:${index}`} className="bg-white hover:bg-slate-50/70">
              <td className="align-top px-4 py-3 font-medium text-slate-600">{row.label}</td>
              <td className={cn("min-w-0 px-4 py-3 text-slate-800", row.mono && "font-mono text-[11px] leading-5")} title={row.title}>
                <div className="max-w-full break-words">{row.value || "-"}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FlowTable({ table, emptyText }: { table?: ForensicTaskFlowTable | null; emptyText: string }) {
  const rows = useMemo(() => parseRows(table?.rows_json), [table?.rows_json])
  const columns = useMemo(() => inferColumns(table, rows), [rows, table])
  const tableHeightClass = "h-full min-h-0"

  if (rows.length === 0 || columns.length === 0) {
    return <EmptyTableState text={emptyText} className={tableHeightClass} />
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border border-slate-200 bg-white", tableHeightClass)}>
      <div className="h-full overflow-auto">
        <table className="min-w-full border-separate border-spacing-0 text-left text-xs">
          <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column} className="whitespace-nowrap border-b border-slate-200 px-4 py-3 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => (
              <tr key={index} className="bg-white hover:bg-slate-50">
                {columns.map((column) => (
                  <td key={`${index}:${column}`} className="max-w-[360px] whitespace-nowrap px-4 py-2.5 font-mono text-[11px] text-slate-700">
                    <span className="block truncate" title={cellValue(row[column])}>
                      {cellValue(row[column])}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CollectionTab({
  task,
  collection,
  results,
  uploadedFiles,
  requests,
  onDownloadFlow,
  downloading,
}: {
  task: ForensicTaskItem
  collection?: ForensicTaskFlowCollection | null
  results?: ForensicTaskFlowTable | null
  uploadedFiles?: ForensicTaskFlowTable | null
  requests?: ForensicTaskFlowRequests | null
  onDownloadFlow: () => void
  downloading?: boolean
}) {
  const t = useTranslations("pages.investigation.tasks.detail")
  const flow = useMemo(() => extractFlow(collection?.raw_json), [collection?.raw_json])
  const request = useMemo(() => getFlowRequest(flow, collection, requests), [collection, flow, requests])
  const artifacts = useMemo(() => artifactNamesFrom(flow, request, collection, task), [collection, flow, request, task])
  const parameterGroups = useMemo(() => parameterGroupsFrom(request, task, requests), [request, requests, task])
  const rawState = stringValue(firstPath(flow, [["state"], ["State"]]))
  const displayState = formatFlowState(rawState === "-" ? collection?.state : rawState, collection?.status || task.status)
  const duration = formatFlowDuration(flow, collection)
  const artifactsWithResults = uniqueStrings(arrayOfStrings(firstPath(flow, [["artifacts_with_results"], ["ArtifactsWithResults"]])))
  const totalRows = stringValue(firstPath(flow, [["total_collected_rows"], ["TotalCollectedRows"]]) ?? results?.row_count)
  const uploadedCount = stringValue(firstPath(flow, [["total_uploaded_files"], ["TotalUploadedFiles"]]) ?? uploadedFiles?.row_count)
  const rows: KeyValueRow[] = [
    { label: t("collection.artifactNames"), value: <InlineList values={artifacts} tone="emerald" /> },
    { label: t("collection.flowId"), value: collection?.flow_id || task.remote_flow_id || "-", title: collection?.flow_id || task.remote_flow_id || "-", mono: true },
    { label: t("collection.creator"), value: stringValue(getPath(request, ["creator"]) ?? task.created_by) },
    {
      label: t("collection.createTime"),
      value: formatFlowTime(collection?.create_time || task.created_at, firstPath(flow, [["create_time"], ["CreateTime"]])),
      mono: true,
    },
    {
      label: t("collection.startTime"),
      value: formatFlowTime(collection?.start_time || task.started_at, firstPath(flow, [["start_time"], ["StartTime"]])),
      mono: true,
    },
    {
      label: t("collection.lastActive"),
      value: formatFlowTime(collection?.active_time || task.finished_at, firstPath(flow, [["active_time"], ["ActiveTime"]])),
      mono: true,
    },
    { label: t("collection.duration"), value: duration ? t("collection.seconds", { value: duration }) : "-" },
    { label: t("collection.state"), value: displayState },
    { label: t("collection.opsSec"), value: formatLimit(getPath(request, ["ops_per_second"]), t("collection.unlimited")) },
    { label: t("collection.cpuLimit"), value: formatLimit(getPath(request, ["cpu_limit"]), t("collection.unlimited")) },
    { label: t("collection.iopsLimit"), value: formatLimit(getPath(request, ["iops_limit"]), t("collection.unlimited")) },
    { label: t("collection.timeout"), value: formatLimit(getPath(request, ["timeout"]), t("collection.unlimited"), t("collection.secondUnit")) },
    { label: t("collection.maxRows"), value: formatRowsLimit(getPath(request, ["max_rows"]), t("collection.unlimited"), t("collection.rows")) },
    { label: t("collection.maxMb"), value: formatMaxMb(getPath(request, ["max_upload_bytes"]), t("collection.unlimited")) },
    { label: t("collection.artifactsWithResults"), value: <InlineList values={artifactsWithResults} /> },
    { label: t("collection.totalRows"), value: totalRows, mono: true },
    { label: t("collection.uploadedBytes"), value: formatUploadedBytes(flow), mono: true },
    { label: t("collection.filesUploaded"), value: uploadedCount, mono: true },
  ]

  if (parameterGroups.length === 0) {
    rows.push({ label: t("collection.parameters"), value: t("collection.noParameters") })
  } else {
    parameterGroups.forEach((group) => {
      if (group.params.length === 0) {
        rows.push({ label: `${t("collection.parameters")} / ${group.artifact}`, value: t("collection.noParameters") })
        return
      }
      group.params.forEach((param) => {
        rows.push({
          label: param.key,
          value: param.value,
          title: param.value,
          mono: true,
        })
      })
    })
  }

  rows.push({
    label: t("collection.downloadResults"),
    value: (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 rounded-md border-slate-200 bg-slate-100 px-2.5 font-mono text-[11px] text-slate-700 hover:bg-slate-200"
        onClick={onDownloadFlow}
        disabled={!task.remote_flow_id || downloading}
      >
        {downloading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FileArchive className="mr-1.5 h-3.5 w-3.5" />}
        {t("collection.flowZip")}
      </Button>
    ),
  })

  return (
    <KeyValueTable rows={rows} emptyText={t("emptyTitle")} fieldHeader={t("table.field")} valueHeader={t("table.value")} className="h-full" />
  )
}

function RequestsTab({ requests }: { requests?: ForensicTaskFlowRequests | null }) {
  const t = useTranslations("pages.investigation.tasks.detail")
  const tableHeightClass = "h-full min-h-0"
  const rows = [
    { source: t("requestPanels.params"), value: requests?.params_json },
    { source: t("requestPanels.args"), value: requests?.velociraptor_args_json },
    { source: t("requestPanels.velociraptor"), value: requests?.velociraptor_request_json || requests?.raw_json },
  ].filter((row) => row.value?.trim())

  if (rows.length === 0) {
    return <EmptyTableState text={t("collection.noParameters")} className={tableHeightClass} />
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border border-slate-200 bg-white", tableHeightClass)}>
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] text-left text-xs">
        <div className="grid grid-cols-[220px_minmax(0,1fr)] border-b border-slate-200 bg-slate-50 text-slate-500">
          <div className="px-4 py-3 font-semibold">{t("table.source")}</div>
          <div className="px-4 py-3 font-semibold">{t("table.value")}</div>
        </div>
        <div className="flex min-h-0 flex-col divide-y divide-slate-100 overflow-hidden">
          {rows.map((row, index) => {
            const isLast = index === rows.length - 1
            return (
              <div key={row.source} className={cn("grid grid-cols-[220px_minmax(0,1fr)] bg-white hover:bg-slate-50/70", isLast ? "min-h-0 flex-1" : "shrink-0")}>
                <div className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">{row.source}</div>
                <div className="min-h-0 px-4 py-3">
                  <pre
                    className={cn(
                      "rounded-lg bg-slate-950 p-3.5 font-mono text-[11px] leading-5 text-slate-100",
                      isLast ? "h-full min-h-0 overflow-auto" : "overflow-visible",
                    )}
                  >
                    {parseJsonPretty(row.value)}
                  </pre>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function ForensicTaskFlowDetailPage({ taskId }: Props) {
  const t = useTranslations("pages.investigation.tasks")
  const detailT = useTranslations("pages.investigation.tasks.detail")
  const router = useRouter()
  const [detail, setDetail] = useState<GetForensicTaskFlowDetailData | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState("")

  const task = detail?.task
  const collection = detail?.artifact_collection
  const displayStatus = collection?.status || task?.status
  const target = task?.target_host
  const ip = cleanList(target?.ip).join(", ")
  const mac = cleanList(target?.macs).join(", ")

  const load = useCallback(async () => {
    if (!taskId?.trim()) return
    setLoading(true)
    try {
      const next = await getForensicTaskFlowDetail({
        task_id: taskId.trim(),
        result_page: 1,
        result_page_size: 200,
        log_page: 1,
        log_page_size: 300,
      })
      setDetail(next)
    } catch (error) {
      toast.error(t("toast.detailLoadFailed"), {
        description: error instanceof Error ? error.message : t("toast.retry"),
      })
    } finally {
      setLoading(false)
    }
  }, [taskId, t])

  useEffect(() => {
    void load()
  }, [load])

  const handleDownloadFlow = useCallback(async () => {
    if (!task) return
    setActionLoading("download")
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
  }, [task, t])

  const handleCancel = useCallback(async () => {
    if (!task || !window.confirm(t("confirm.cancel"))) return
    setActionLoading("cancel")
    try {
      await cancelForensicTask({ task_id: task.task_id, reason: "operator canceled from task detail" })
      toast.success(t("toast.canceled"))
      await load()
    } catch (error) {
      toast.error(t("toast.cancelFailed"), {
        description: error instanceof Error ? error.message : t("toast.retry"),
      })
    } finally {
      setActionLoading("")
    }
  }, [load, task, t])

  const handleDelete = useCallback(async () => {
    if (!task || !window.confirm(t("confirm.deleteTask"))) return
    setActionLoading("delete")
    try {
      const result = await deleteForensicTask({
        task_id: task.task_id,
        reason: "operator deleted from task detail",
        delete_mode: "remote_sync",
      })
      if (result.remote_delete_status === "failed") {
        toast.error(t("toast.remoteDeleteFailed"), {
          description: result.remote_delete_error || t("toast.retry"),
        })
        return
      }
      toast.success(t("toast.deleted"))
      router.push("/frame/investigation/tasks")
    } catch (error) {
      toast.error(t("toast.deleteFailed"), {
        description: error instanceof Error ? error.message : t("toast.retry"),
      })
    } finally {
      setActionLoading("")
    }
  }, [router, task, t])

  if (!taskId?.trim()) {
    return (
      <main className="bg-slate-100/70 p-5">
        <Card className="flex min-h-[220px] items-center justify-center rounded-[22px] border border-slate-200/80 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.08)]">
          <div className="text-center">
            <FileText className="mx-auto h-10 w-10 text-slate-300" />
            <div className="mt-3 text-sm font-semibold text-slate-700">{detailT("missingTaskTitle")}</div>
            <Button asChild className="mt-4 rounded-full">
              <Link href="/frame/investigation/tasks">{detailT("back")}</Link>
            </Button>
          </div>
        </Card>
      </main>
    )
  }

  return (
    <main className="h-full overflow-hidden bg-slate-100/70">
      <div className="flex h-full min-h-0 w-full flex-col gap-4 overflow-hidden p-4 xl:p-5">
        <header className="w-full shrink-0 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <Button asChild variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-full text-slate-500 hover:bg-slate-100">
                <Link href="/frame/investigation/tasks">
                  <ArrowLeft className="h-5 w-5" />
                  <span className="sr-only">{detailT("back")}</span>
                </Link>
              </Button>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 text-sky-600">
                <ScrollText aria-hidden className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold text-slate-950">{detailT("title")}</h1>
                <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-sm text-slate-500">
                  <span className="truncate font-mono text-xs">{task?.task_id || taskId}</span>
                  {task?.case_id ? (
                    <>
                      <span className="h-4 w-px bg-slate-200" />
                      <span className="truncate font-mono text-xs">{task.case_id}</span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                className="h-10 rounded-full px-3 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                onClick={() => void load()}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                <span>{t("header.refresh")}</span>
              </Button>
              {task ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-full border-indigo-200 bg-indigo-50 px-3 text-indigo-700 hover:bg-indigo-100"
                    onClick={() => void handleDownloadFlow()}
                    disabled={!task.remote_flow_id || actionLoading === "download"}
                  >
                    {actionLoading === "download" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileArchive className="h-4 w-4" />}
                    <span>{t("actions.downloadZip")}</span>
                  </Button>
                  {canCancelTask(task.status) ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-full border-amber-200 bg-amber-50 px-3 text-amber-700 hover:bg-amber-100"
                      onClick={() => void handleCancel()}
                      disabled={actionLoading === "cancel"}
                    >
                      {actionLoading === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                      <span>{t("actions.cancel")}</span>
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-full border-red-200 bg-red-50 px-3 text-red-700 hover:bg-red-100"
                    onClick={() => void handleDelete()}
                    disabled={actionLoading === "delete"}
                  >
                    {actionLoading === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    <span>{t("actions.deleteTask")}</span>
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </header>

        {loading && !task ? (
          <Card className="shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <CardContent className="p-5">
              <div className="flex min-h-[160px] items-center justify-center text-sm text-slate-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {detailT("loading")}
              </div>
            </CardContent>
          </Card>
        ) : task ? (
          <Card className="shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <CardContent className="p-3.5">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[150px_minmax(0,1fr)_210px_240px_200px]">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-3">
                  <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl", statusClass(displayStatus))}>
                    {statusIcon(displayStatus)}
                  </span>
                  <div>
                    <div className="text-xs font-medium text-slate-500">{detailT("fields.status")}</div>
                    <Badge className={cn("mt-1 border-0", statusClass(displayStatus))}>{displayStatus || "-"}</Badge>
                  </div>
                </div>
                <InfoItem label={detailT("fields.host")} value={target?.hostname || task.agent_id || task.endpoint_id} />
                <InfoItem label={detailT("fields.hostId")} value={target?.agent_id || task.agent_id || "-"} mono />
                <InfoItem label={detailT("fields.network")} value={[ip, mac].filter(Boolean).join(" / ")} mono />
                <InfoItem label={detailT("fields.created")} value={formatUnixTime(task.created_at)} mono />
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="flex min-h-0 w-full flex-1 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <Tabs defaultValue="collection" className="flex h-full min-h-0 w-full flex-col">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3">
              <TabsList className="h-9 rounded-full bg-slate-50 p-1 shadow-sm ring-1 ring-slate-200">
                <TabsTrigger value="collection" className="rounded-full px-3.5 text-xs data-[state=active]:bg-sky-100 data-[state=active]:text-sky-700">
                  <Server className="mr-2 h-4 w-4" />
                  {detailT("tabs.collection")}
                </TabsTrigger>
                <TabsTrigger value="results" className="rounded-full px-3.5 text-xs data-[state=active]:bg-sky-100 data-[state=active]:text-sky-700">
                  <Database className="mr-2 h-4 w-4" />
                  {detailT("tabs.results")}
                </TabsTrigger>
                <TabsTrigger value="uploads" className="rounded-full px-3.5 text-xs data-[state=active]:bg-sky-100 data-[state=active]:text-sky-700">
                  <UploadCloud className="mr-2 h-4 w-4" />
                  {detailT("tabs.uploads")}
                </TabsTrigger>
                <TabsTrigger value="requests" className="rounded-full px-3.5 text-xs data-[state=active]:bg-sky-100 data-[state=active]:text-sky-700">
                  <FileJson className="mr-2 h-4 w-4" />
                  {detailT("tabs.requests")}
                </TabsTrigger>
                <TabsTrigger value="logs" className="rounded-full px-3.5 text-xs data-[state=active]:bg-sky-100 data-[state=active]:text-sky-700">
                  <ScrollText className="mr-2 h-4 w-4" />
                  {detailT("tabs.logs")}
                </TabsTrigger>
              </TabsList>
              <div className="text-xs text-slate-500">
                {detailT("lastRefresh", { time: formatUnixTime(collection?.last_refresh_at) })}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden bg-slate-50/60 p-3.5">
              {!task ? (
                <div className="flex h-full min-h-[160px] flex-col items-center justify-center text-center">
                  <FileText className="h-10 w-10 text-slate-300" />
                  <div className="mt-3 text-sm font-semibold text-slate-700">{detailT("emptyTitle")}</div>
                  <div className="mt-1 text-xs text-slate-500">{detailT("emptyDescription")}</div>
                </div>
              ) : (
                <>
                  <TabsContent value="collection" className="m-0 h-full min-h-0 data-[state=inactive]:hidden">
                    <CollectionTab
                      task={task}
                      collection={collection}
                      results={detail?.results}
                      uploadedFiles={detail?.uploaded_files}
                      requests={detail?.requests}
                      onDownloadFlow={() => void handleDownloadFlow()}
                      downloading={actionLoading === "download"}
                    />
                  </TabsContent>
                  <TabsContent value="results" className="m-0 h-full min-h-0 data-[state=inactive]:hidden">
                    <FlowTable table={detail?.results} emptyText={detailT("emptyResults")} />
                  </TabsContent>
                  <TabsContent value="uploads" className="m-0 h-full min-h-0 data-[state=inactive]:hidden">
                    <FlowTable table={detail?.uploaded_files} emptyText={detailT("emptyUploads")} />
                  </TabsContent>
                  <TabsContent value="requests" className="m-0 h-full min-h-0 data-[state=inactive]:hidden">
                    <RequestsTab requests={detail?.requests} />
                  </TabsContent>
                  <TabsContent value="logs" className="m-0 h-full min-h-0 data-[state=inactive]:hidden">
                    <FlowTable table={detail?.logs} emptyText={detailT("emptyLogs")} />
                  </TabsContent>
                </>
              )}
            </div>
          </Tabs>
        </Card>
      </div>
    </main>
  )
}
