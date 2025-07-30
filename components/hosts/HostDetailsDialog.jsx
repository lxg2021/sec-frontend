import { Monitor, Cpu, HardDrive, MemoryStick, Globe, Hash, Wifi } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// 状态颜色映射
const getStatusColor = (status) => {
  switch (status) {
    case "online":
      return "bg-emerald-500"
    case "offline":
      return "bg-rose-500"
    case "maintenance":
      return "bg-amber-500"
    default:
      return "bg-slate-400"
  }
}

const getStatusBadge = (status) => {
  switch (status) {
    case "online":
      return "bg-emerald-100 text-emerald-700 border-emerald-200"
    case "offline":
      return "bg-rose-100 text-rose-700 border-rose-200"
    case "maintenance":
      return "bg-amber-100 text-amber-700 border-amber-200"
    default:
      return "bg-slate-100 text-slate-700 border-slate-200"
  }
}

export function HostDetailsDialog({ host, children }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 border-slate-200/60">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-slate-700">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
              <Monitor className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold">{host.name}</span>
            <Badge className={cn("ml-auto", getStatusBadge(host.status))}>
              <div className={cn("w-2 h-2 rounded-full mr-2", getStatusColor(host.status))} />
              {host.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-3 bg-gradient-to-r from-slate-50/80 to-blue-50/40">
              <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
                <Globe className="h-4 w-4 text-blue-500" />
                网络信息
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="font-medium text-slate-600 flex items-center gap-2">
                  <Monitor className="h-3.5 w-3.5 text-slate-400" />
                  主机名
                </span>
                <p className="text-slate-700 bg-slate-100/80 px-2 py-1 rounded-md font-mono text-xs">{host.hostname}</p>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-slate-600 flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5 text-slate-400" />
                  主机ID
                </span>
                <p className="text-slate-700 bg-slate-100/80 px-2 py-1 rounded-md font-mono text-xs">{host.hostId}</p>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-slate-600 flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-slate-400" />
                  IP地址
                </span>
                <p className="text-slate-700 bg-slate-100/80 px-2 py-1 rounded-md font-mono text-xs">{host.ip}</p>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-slate-600 flex items-center gap-2">
                  <Wifi className="h-3.5 w-3.5 text-slate-400" />
                  MAC地址
                </span>
                <p className="text-slate-700 bg-slate-100/80 px-2 py-1 rounded-md font-mono text-xs">{host.mac}</p>
              </div>
              <div className="col-span-2 space-y-1">
                <span className="font-medium text-slate-600">操作系统</span>
                <p className="text-slate-700 bg-gradient-to-r from-blue-100/80 to-indigo-100/60 px-3 py-2 rounded-lg border border-blue-200/60">
                  {host.os}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-3 bg-gradient-to-r from-slate-50/80 to-emerald-50/40">
              <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
                <Cpu className="h-4 w-4 text-emerald-500" />
                硬件配置
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm">
              <div className="space-y-2">
                <span className="font-medium text-slate-600 flex items-center gap-2">
                  <Cpu className="h-3.5 w-3.5 text-slate-400" />
                  处理器
                </span>
                <p className="text-slate-700 bg-gradient-to-r from-emerald-100/80 to-teal-100/60 px-3 py-2 rounded-lg border border-emerald-200/60">
                  {host.cpu}
                </p>
              </div>
              <div className="space-y-2">
                <span className="font-medium text-slate-600 flex items-center gap-2">
                  <MemoryStick className="h-3.5 w-3.5 text-slate-400" />
                  内存
                </span>
                <p className="text-slate-700 bg-gradient-to-r from-purple-100/80 to-pink-100/60 px-3 py-2 rounded-lg border border-purple-200/60">
                  {host.memory}
                </p>
              </div>
              <div className="space-y-2">
                <span className="font-medium text-slate-600 flex items-center gap-2">
                  <HardDrive className="h-3.5 w-3.5 text-slate-400" />
                  存储
                </span>
                <p className="text-slate-700 bg-gradient-to-r from-amber-100/80 to-orange-100/60 px-3 py-2 rounded-lg border border-amber-200/60">
                  {host.disk}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
