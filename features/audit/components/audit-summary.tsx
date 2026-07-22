import { AlertTriangle, FileCog, FileOutput, ListChecks } from "lucide-react"

interface AuditSummaryProps {
  total: number
  policy: number
  command: number
  config: number
  abnormal: number
}

export function AuditSummary({ total, policy, command, config, abnormal }: AuditSummaryProps) {
  const items = [
    { label: "下发事件总数", value: total, helper: "按当前筛选条件统计", icon: ListChecks, tone: "text-slate-900" },
    { label: "策略下发", value: policy, helper: "策略对象发布记录", icon: FileOutput, tone: "text-blue-600" },
    { label: "命令下发", value: command, helper: "命令投递与回执记录", icon: FileCog, tone: "text-cyan-600" },
    { label: "配置下发", value: config, helper: "配置版本发布记录", icon: FileOutput, tone: "text-indigo-600" },
    { label: "异常事件", value: abnormal, helper: "失败、超时和拒绝", icon: AlertTriangle, tone: "text-red-600" },
  ]

  return (
    <div className="grid shrink-0 gap-3 md:grid-cols-2 xl:grid-cols-5" aria-label="下发审计统计">
      {items.map(({ label, value, helper, icon: Icon, tone }) => (
        <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">{label}</span>
            <Icon className={"h-4 w-4 " + tone} aria-hidden="true" />
          </div>
          <div className={"mt-2 text-2xl font-semibold tracking-tight " + tone}>{value.toLocaleString()}</div>
          <p className="mt-1 text-xs text-slate-400">{helper}</p>
        </div>
      ))}
    </div>
  )
}
