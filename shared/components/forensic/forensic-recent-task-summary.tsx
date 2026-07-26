"use client"

import Link from "next/link"
import { Box, ChevronRight, Clock3 } from "lucide-react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader } from "@/shared/ui/card"
import { cn } from "@/shared/lib/utils"
import type { ForensicRecentTaskView, ForensicTaskTargetHost } from "@/shared/lib/forensic/types"
import { ForensicPanelHeader } from "./forensic-panel-chrome"
import { TASK_STATUS_CONFIG } from "./status-config"

interface Props {
  tasks: ForensicRecentTaskView[]
}

function firstText(values: Array<string | undefined | null>): string {
  for (const value of values) {
    const next = value?.trim()
    if (next) {
      return next
    }
  }
  return ""
}

function cleanList(values?: string[]): string[] {
  return (values ?? []).map((item) => item.trim()).filter(Boolean)
}

function formatUnixTime(value?: number): string {
  if (!value) return "-"
  const date = new Date(value * 1000)
  const pad = (num: number) => String(num).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function onlineStatusKey(target?: ForensicTaskTargetHost | null): "online" | "offline" | "unknown" | "unsynced" {
  const hostStatus = normalizedOnlineStatus(target?.host_status)
  if (hostStatus) {
    return hostStatus
  }
  const forensicStatus = normalizedOnlineStatus(target?.forensic_status)
  if (forensicStatus) {
    return forensicStatus
  }
  return target?.agent_id || target?.hostname || target?.endpoint_id || target?.velociraptor_client_id ? "unknown" : "unsynced"
}

function normalizedOnlineStatus(status?: string): "online" | "offline" | undefined {
  const normalized = status?.trim().toLowerCase()
  if (normalized === "online" || normalized === "offline") {
    return normalized
  }
  return undefined
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

export function ForensicRecentTaskSummary({ tasks }: Props) {
  const t = useTranslations("pages.investigation.collection")
  const items = tasks.slice(0, 5)

  return (
    <Card className="flex h-full min-w-0 flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      <CardHeader className="p-4 pb-3 sm:p-5 sm:pb-4">
        <ForensicPanelHeader
          icon={Clock3}
          tone="teal"
          title={t("recentTasks.title")}
          description={t("recentTasks.description")}
          action={
            <Link
              href="/frame/investigation/tasks"
              className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-3 text-xs font-medium text-blue-700 transition-colors hover:border-blue-200 hover:bg-blue-100 hover:text-blue-800"
            >
              {t("recentTasks.viewMore")}
              <ChevronRight className="size-3.5" />
            </Link>
          }
        />
      </CardHeader>
      <CardContent className="flex min-w-0 flex-1 px-4 pb-4 sm:px-5 sm:pb-5">
        {items.length === 0 ? (
          <div className="flex min-h-[220px] flex-1 flex-col items-center justify-center text-center">
            <Box className="size-12 stroke-[1.8] text-slate-300" aria-hidden />
            <div className="mt-3 text-sm font-medium text-slate-500">{t("recentTasks.emptyTitle")}</div>
            <div className="mt-2 text-xs text-slate-500">{t("recentTasks.emptyDescription")}</div>
          </div>
        ) : (
          <div className="w-full min-w-0 overflow-x-auto">
            <table className="w-full min-w-[1208px] table-fixed text-sm">
              <colgroup>
                <col className="w-[82px]" />
                <col className="w-[150px]" />
                <col className="w-[135px]" />
                <col className="w-[165px]" />
                <col className="w-[105px]" />
                <col className="w-[145px]" />
                <col className="w-[96px]" />
                <col className="w-[170px]" />
                <col className="w-[160px]" />
              </colgroup>
              <thead className="bg-slate-100">
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="px-2 py-3 text-center font-medium">{t("recentTasks.columns.status")}</th>
                  <th className="py-3 pr-3 font-medium">{t("recentTasks.columns.taskId")}</th>
                  <th className="py-3 pr-3 font-medium">{t("recentTasks.columns.caseId")}</th>
                  <th className="py-3 pr-3 font-medium">{t("recentTasks.columns.host")}</th>
                  <th className="py-3 pr-3 font-medium">{t("recentTasks.columns.ip")}</th>
                  <th className="py-3 pr-3 font-medium">{t("recentTasks.columns.mac")}</th>
                  <th className="px-2 py-3 text-center font-medium">{t("recentTasks.columns.online")}</th>
                  <th className="py-3 pr-3 font-medium">{t("recentTasks.columns.artifact")}</th>
                  <th className="px-3 py-3 text-center font-medium">{t("recentTasks.columns.created")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((task) => {
                  const config = TASK_STATUS_CONFIG[task.status]
                  const target = task.target_host
                  const targetStatus = onlineStatusKey(target)
                  const hostname = firstText([target?.hostname])
                  const agentID = firstText([target?.agent_id, task.target_label])
                  const ipList = cleanList(target?.ip)
                  const macList = cleanList(target?.macs)
                  const ipTitle = ipList.join(", ")
                  const macTitle = macList.join(", ")
                  return (
                    <tr key={task.task_id} className="border-b border-border/60 last:border-0 transition-colors hover:bg-accent/40">
                      <td className="px-2 py-3 text-center">
                        <span className={cn("relative inline-flex h-6 w-16 items-center justify-center rounded-full px-2 text-xs font-medium", config.className)}>
                          <span className={cn("absolute left-2 size-1.5 rounded-full", config.dot)} />
                          <span className="min-w-0 truncate text-center lowercase">
                            {t(`taskStatus.${task.status}`)}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <Link href={`/frame/investigation/tasks?task_id=${task.task_id}`} className="block truncate font-mono text-xs font-semibold text-foreground hover:underline">
                          {task.task_id}
                        </Link>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="block truncate font-mono text-xs text-foreground" title={task.case_id || "-"}>
                          {task.case_id || "-"}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="min-w-0">
                          <span className="block truncate text-xs font-medium text-foreground" title={hostname}>
                            {hostname || "-"}
                          </span>
                          <span className="mt-1 block truncate font-mono text-[11px] text-muted-foreground" title={agentID}>
                            {agentID || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        {ipList.length > 0 ? (
                          <div className="flex flex-col gap-0.5 font-mono text-xs leading-5 text-muted-foreground" title={ipTitle}>
                            {ipList.map((item) => (
                              <span key={item} className="block whitespace-nowrap">
                                {item}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="block font-mono text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        {macList.length > 0 ? (
                          <div className="flex flex-col gap-0.5 font-mono text-xs leading-5 text-muted-foreground" title={macTitle}>
                            {macList.map((item) => (
                              <span key={item} className="block whitespace-nowrap">
                                {item}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="block font-mono text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-2 py-3 text-center">
                        <span
                          className={cn(
                            "inline-flex h-5 min-w-20 items-center gap-1 rounded-full px-2 text-[10px] font-medium ring-1",
                            TARGET_ONLINE_STATUS_CLASS[targetStatus]
                          )}
                        >
                          <span className={cn("size-1.5 shrink-0 rounded-full", TARGET_ONLINE_STATUS_DOT[targetStatus])} />
                          <span className="min-w-0 flex-1 truncate text-center">{t(`recentTasks.onlineStatus.${targetStatus}`)}</span>
                        </span>
                      </td>
                      <td className="truncate py-3 pr-3 font-mono text-xs text-muted-foreground">{task.artifact_name || task.artifact_key}</td>
                      <td className="px-3 py-3 text-center text-xs text-muted-foreground tabular-nums">
                        {formatUnixTime(task.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
