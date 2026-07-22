"use client"

import { ChevronRight, CircleCheck, Clock3, Copy, FileOutput, Settings2, TriangleAlert } from "lucide-react"
import type { DispatchAuditEvent } from "@/features/audit/types"
import { auditResultLabels, dispatchTypeLabels } from "@/features/audit/types"

interface DispatchAuditTableProps {
  events: DispatchAuditEvent[]
  selectedId?: string
  onSelect: (event: DispatchAuditEvent) => void
  onView: (event: DispatchAuditEvent) => void
}

const typeIcons = { policy: FileOutput, command: Copy, config: Settings2 }
const typeIconStyles = { policy: "text-blue-600", command: "text-cyan-600", config: "text-indigo-600" }
const resultIconStyles = { success: "text-emerald-600", failed: "text-red-600", pending: "text-sky-600", timeout: "text-amber-600" }

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

export function DispatchAuditTable({ events, selectedId, onSelect, onView }: DispatchAuditTableProps) {
  return (
    <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900">下发记录</h2>
          <p className="mt-1 truncate text-xs text-slate-500">共 {events.length.toLocaleString()} 条 · 按下发时间倒序</p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{events.length} 条结果</span>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-auto">
        <table className="w-full table-fixed text-left text-xs 2xl:min-w-[1700px]">
          <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-semibold text-slate-500">
            <tr>
              <th className="w-[104px] px-4 py-3 2xl:w-[120px]">下发时间</th>
              <th className="w-[108px] px-3 py-3 2xl:w-[120px]">下发类型</th>
              <th className="px-3 py-3 2xl:w-[240px]">下发对象</th>
              <th className="hidden px-3 py-3 2xl:table-cell 2xl:w-[80px]">版本</th>
              <th className="hidden px-3 py-3 2xl:table-cell 2xl:w-[220px]">下发任务</th>
              <th className="hidden px-3 py-3 2xl:table-cell 2xl:w-[220px]">任务ID</th>
              <th className="hidden px-3 py-3 2xl:table-cell 2xl:w-[90px]">操作者</th>
              <th className="hidden px-3 py-3 2xl:table-cell 2xl:w-[220px]">操作者ID</th>
              <th className="hidden px-3 py-3 2xl:table-cell 2xl:w-[110px]">目标范围</th>
              <th className="w-[88px] px-3 py-3 2xl:w-[100px]">状态</th>
              <th className="hidden px-3 py-3 2xl:table-cell 2xl:w-[110px]">执行结果</th>
              <th className="w-[62px] px-3 py-3 text-right 2xl:w-[70px]">详情</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {events.map((event) => {
              const Icon = typeIcons[event.dispatchType]
              const ResultIcon = event.result === "success" ? CircleCheck : event.result === "failed" || event.result === "timeout" ? TriangleAlert : Clock3

              return (
                <tr
                  key={event.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedId === event.id}
                  onClick={() => onSelect(event)}
                  onKeyDown={(keyboardEvent) => {
                    if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                      keyboardEvent.preventDefault()
                      onSelect(event)
                    }
                  }}
                  className={selectedId === event.id
                    ? "cursor-pointer bg-blue-50/60 outline-none"
                    : "cursor-pointer outline-none hover:bg-slate-50/80 focus-visible:bg-sky-50/70"}
                >
                  <td className="relative whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                    {selectedId === event.id && (
                      <span className="absolute inset-y-1 left-0 w-1 rounded-r-full bg-cyan-500" aria-hidden="true" />
                    )}
                    {formatDate(event.occurredAt)}
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
                      <Icon className={`h-3.5 w-3.5 shrink-0 ${typeIconStyles[event.dispatchType]}`} aria-hidden="true" />
                      <span className="truncate">{dispatchTypeLabels[event.dispatchType]}</span>
                    </span>
                  </td>
                  <td className="min-w-0 px-3 py-3">
                    <div className="truncate font-medium text-slate-800" title={event.objectName}>{event.objectName}</div>
                    <div className="mt-1 truncate text-xs text-slate-400 2xl:hidden">{event.objectVersion}</div>
                  </td>
                  <td className="hidden px-3 py-3 text-xs text-slate-500 2xl:table-cell">
                    <div className="truncate" title={event.objectVersion}>{event.objectVersion || "-"}</div>
                  </td>
                  <td className="hidden px-3 py-3 2xl:table-cell">
                    <div className="truncate font-mono text-xs text-slate-600" title={event.taskId}>{event.taskId}</div>
                  </td>
                  <td className="hidden px-3 py-3 2xl:table-cell">
                    <div className="truncate font-mono text-xs text-slate-600" title={event.operationId}>{event.operationId}</div>
                  </td>
                  <td className="hidden px-3 py-3 2xl:table-cell">
                    <div className="truncate font-medium text-slate-700" title={event.actorName}>{event.actorName}</div>
                  </td>
                  <td className="hidden px-3 py-3 2xl:table-cell">
                    <div className="truncate font-mono text-xs text-slate-500" title={event.actorId}>{event.actorId}</div>
                  </td>
                  <td className="hidden px-3 py-3 2xl:table-cell">
                    <div className="truncate text-xs text-slate-700" title={event.targetSummary}>{event.targetSummary}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
                      <ResultIcon className={`h-3.5 w-3.5 shrink-0 ${resultIconStyles[event.result]}`} aria-hidden="true" />
                      {auditResultLabels[event.result]}
                    </span>
                    <div className="mt-1 truncate text-xs text-slate-400 2xl:hidden">{event.successCount}/{event.totalCount} 成功</div>
                  </td>
                  <td className="hidden px-3 py-3 text-xs text-slate-600 2xl:table-cell">
                    <div className="truncate">{event.successCount}/{event.totalCount} 成功</div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation()
                        onView(event)
                      }}
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
