import { AlertTriangle, FileCog, FileOutput, ListChecks } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

interface AuditSummaryProps {
  total: number
  policy: number
  command: number
  config: number
  abnormal: number
}

export function AuditSummary({ total, policy, command, config, abnormal }: AuditSummaryProps) {
  const items = [
    { label: "下发事件总数", value: total, helper: "按当前筛选条件统计", icon: ListChecks, color: "from-slate-500 to-slate-600" },
    { label: "策略下发", value: policy, helper: "策略对象发布记录", icon: FileOutput, color: "from-blue-500 to-blue-600" },
    { label: "命令下发", value: command, helper: "命令投递与回执记录", icon: FileCog, color: "from-cyan-500 to-cyan-600" },
    { label: "配置下发", value: config, helper: "配置版本发布记录", icon: FileOutput, color: "from-indigo-500 to-indigo-600" },
    { label: "异常事件", value: abnormal, helper: "失败、超时和拒绝", icon: AlertTriangle, color: "from-red-500 to-red-600" },
  ]

  return (
    <div className="grid shrink-0 gap-3 md:grid-cols-2 xl:grid-cols-5" aria-label="下发审计统计">
      {items.map(({ label, value, helper, icon: Icon, color }) => (
        <Card
          key={label}
          className="relative overflow-hidden border-0 shadow-none transition-transform duration-200 hover:-translate-y-0.5"
        >
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${color} opacity-5`}
            aria-hidden="true"
          />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 px-4 pb-2 pt-4">
            <CardTitle className="text-sm font-medium text-slate-600">{label}</CardTitle>
            <div className={`rounded-lg bg-gradient-to-br p-2 ${color}`}>
              <Icon className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="relative px-4 pb-4 pt-0">
            <div className="text-2xl font-bold text-slate-800">{value.toLocaleString()}</div>
            <p className="mt-1 text-xs text-slate-500">{helper}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}


