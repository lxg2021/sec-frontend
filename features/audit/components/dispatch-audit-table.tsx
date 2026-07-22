"use client"

import { ChevronRight, CircleCheck, Clock3, Copy, FileOutput, Settings2, TriangleAlert } from "lucide-react"
import type { DispatchAuditEvent } from "@/features/audit/types"
import { auditResultLabels, dispatchTypeLabels } from "@/features/audit/types"

interface DispatchAuditTableProps {
  events: DispatchAuditEvent[]
  selectedId?: string
  onSelect: (event: DispatchAuditEvent) => void
}

const typeIcons = { policy: FileOutput, command: Copy, config: Settings2 }
const typeStyles = { policy: "bg-blue-50 text-blue-700", command: "bg-cyan-50 text-cyan-700", config: "bg-indigo-50 text-indigo-700" }
const resultStyles = { success: "bg-emerald-50 text-emerald-700", failed: "bg-red-50 text-red-700", pending: "bg-sky-50 text-sky-700", timeout: "bg-amber-50 text-amber-700" }

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value))
}

export function DispatchAuditTable({ events, selectedId, onSelect }: DispatchAuditTableProps) {
  return (
    <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900">下发记录</h2>
          <p className="mt-1 truncate text-xs text-slate-500">共 {events.length.toLocaleString()} 条 · 按下发时间倒序</p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{events.length} 条结果</span>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-semibold text-slate-500">
            <tr>
              <th className="w-[104px] px-4 py-3">下发时间</th>
              <th className="w-[108px] px-3 py-3">下发类型</th>
              <th className="px-3 py-3">下发对象</th>
              <th className="hidden w-[130px] px-3 py-3 2xl:table-cell">下发任务</th>
              <th className="hidden w-[96px] px-3 py-3 2xl:table-cell">操作者</th>
              <th className="hidden w-[150px] px-3 py-3 2xl:table-cell">目标范围</th>
              <th className="w-[88px] px-3 py-3">状态</th>
              <th className="w-[62px] px-3 py-3 text-right">详情</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {events.map((event) => {
              const Icon = typeIcons[event.dispatchType]
              const ResultIcon = event.result === "success" ? CircleCheck : event.result === "failed" || event.result === "timeout" ? TriangleAlert : Clock3

              return (
                <tr key={event.id} className={selectedId === event.id ? "bg-blue-50/60" : "hover:bg-slate-50/80"}>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{formatDate(event.occurredAt)}</td>
                  <td className="px-3 py-3">
                    <span className={"inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold " + typeStyles[event.dispatchType]}>
                      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{dispatchTypeLabels[event.dispatchType]}</span>
                    </span>
                    <div className="mt-1 truncate text-[11px] text-slate-400">{event.eventType}</div>
                  </td>
                  <td className="min-w-0 px-3 py-3">
                    <div className="truncate font-medium text-slate-800" title={event.objectName}>{event.objectName}</div>
                    <div className="mt-1 truncate text-xs text-slate-400">{event.objectVersion}</div>
                  </td>
                  <td className="hidden px-3 py-3 2xl:table-cell">
                    <div className="truncate font-mono text-xs text-slate-600" title={event.taskId}>{event.taskId}</div>
                    <div className="mt-1 truncate text-[11px] text-slate-400" title={event.operationId}>{event.operationId}</div>
                  </td>
                  <td className="hidden px-3 py-3 2xl:table-cell">
                    <div className="truncate font-medium text-slate-700">{event.actorName}</div>
                    <div className="mt-1 truncate font-mono text-[11px] text-slate-400">{event.actorId}</div>
                  </td>
                  <td className="hidden px-3 py-3 2xl:table-cell">
                    <div className="truncate text-xs text-slate-700" title={event.targetSummary}>{event.targetSummary}</div>
                    <div className="mt-1 truncate text-[11px] text-slate-400">{event.agentSummary}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={"inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold " + resultStyles[event.result]}>
                      <ResultIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {auditResultLabels[event.result]}
                    </span>
                    <div className="mt-1 truncate text-[11px] text-slate-400">{event.successCount}/{event.totalCount} 成功</div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onSelect(event)}
                      aria-label={"查看 " + event.objectName + " 下发详情"}
                      className="inline-flex min-h-9 items-center gap-0.5 rounded-lg px-2 text-xs font-medium text-blue-600 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      查看
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {events.length === 0 && <div className="px-5 py-12 text-center text-sm text-slate-500">没有匹配的下发审计记录</div>}
    </div>
  )
}
