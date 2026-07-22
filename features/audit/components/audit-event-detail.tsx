import { CheckCircle2, X } from "lucide-react"
import type { DispatchAuditEvent } from "@/features/audit/types"
import { auditResultLabels, dispatchTypeLabels } from "@/features/audit/types"

interface AuditEventDetailProps { event?: DispatchAuditEvent; onClose: () => void }

export function AuditEventDetail({ event, onClose }: AuditEventDetailProps) {
  if (!event) return <aside className="hidden min-h-0 overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 xl:block">选择一条下发记录查看详情</aside>
  return <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-label="下发详情">
    <div className="flex shrink-0 items-start justify-between border-b border-slate-100 p-5"><div><h2 className="text-base font-semibold text-slate-900">下发详情</h2><p className="mt-1 text-xs text-slate-500">查看下发上下文与执行结果</p></div><button type="button" onClick={onClose} aria-label="关闭详情" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><X className="h-4 w-4" /></button></div>
    <div className="min-h-0 flex-1 space-y-5 overflow-auto p-5"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{dispatchTypeLabels[event.dispatchType]}</span><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />{auditResultLabels[event.result]}</span></div>
      <dl className="grid grid-cols-[92px_1fr] gap-x-3 gap-y-3 text-xs"><dt className="text-slate-400">事件 ID</dt><dd className="font-mono text-slate-700">{event.id}</dd><dt className="text-slate-400">发生时间</dt><dd className="text-slate-700">{new Date(event.occurredAt).toLocaleString("zh-CN")}</dd><dt className="text-slate-400">操作者</dt><dd className="text-slate-700">{event.actorName} <span className="font-mono text-slate-400">/ {event.actorId}</span></dd><dt className="text-slate-400">对象</dt><dd className="text-slate-700">{event.objectName} · {event.objectVersion}</dd><dt className="text-slate-400">任务 ID</dt><dd className="font-mono text-slate-700">{event.taskId}</dd><dt className="text-slate-400">目标范围</dt><dd className="text-slate-700">{event.targetSummary}</dd></dl>
      <div><h3 className="mb-2 text-xs font-semibold text-slate-600">执行结果</h3><div className="grid grid-cols-3 gap-2"><div className="rounded-lg bg-emerald-50 p-3"><div className="text-lg font-semibold text-emerald-700">{event.successCount}</div><div className="text-[11px] text-emerald-700/70">成功</div></div><div className="rounded-lg bg-red-50 p-3"><div className="text-lg font-semibold text-red-700">{event.failedCount}</div><div className="text-[11px] text-red-700/70">失败</div></div><div className="rounded-lg bg-sky-50 p-3"><div className="text-lg font-semibold text-sky-700">{event.pendingCount}</div><div className="text-[11px] text-sky-700/70">未确认</div></div></div></div>
      {event.reason && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800"><strong>说明：</strong>{event.reason}</div>}
      <div><h3 className="mb-2 text-xs font-semibold text-slate-600">原始载荷</h3><pre className="max-h-48 overflow-auto rounded-lg bg-slate-950 p-3 text-[11px] leading-5 text-slate-200">{JSON.stringify(event.payload, null, 2)}</pre></div>
    </div>
  </aside>
}
