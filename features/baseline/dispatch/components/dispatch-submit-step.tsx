"use client"

import { AlertCircle, ArrowRight, CheckCircle2, FileText } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

interface DispatchSubmitStepProps {
  canPreview: boolean
  hasPolicy: boolean
  invalidHostCount: number
  offlineHostCount: number
  onBack: () => void
  onPreview: () => void
  policyName: string
  selectedHostCount: number
}

export function DispatchSubmitStep({
  canPreview,
  hasPolicy,
  invalidHostCount,
  offlineHostCount,
  onBack,
  onPreview,
  policyName,
  selectedHostCount,
}: DispatchSubmitStepProps) {
  return (
    <Card className="overflow-hidden border-slate-200/80 shadow-lg">
      <div className="h-1 bg-gradient-to-r from-slate-950 via-blue-600 to-cyan-400" />
      <CardHeader className="border-b bg-gradient-to-b from-white to-slate-50/60">
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <div className="rounded-xl bg-slate-950 p-2 text-white">
            <FileText className="h-4 w-4" />
          </div>
          任务下发
        </CardTitle>
        <CardDescription>确认策略对象和目标范围，然后进入下发预览。</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 p-6">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border bg-slate-50/70 p-4">
            <div className="text-xs text-slate-500">策略对象</div>
            <div className="mt-2 text-sm font-medium text-slate-950">
              {hasPolicy ? policyName : "尚未创建"}
            </div>
          </div>
          <div className="rounded-2xl border bg-slate-50/70 p-4">
            <div className="text-xs text-slate-500">目标主机</div>
            <div className="mt-2 text-sm font-medium text-slate-950">
              {selectedHostCount} 台
            </div>
          </div>
          <div className="rounded-2xl border bg-slate-50/70 p-4">
            <div className="text-xs text-slate-500">风险提示</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">离线 {offlineHostCount}</Badge>
              <Badge variant="outline">不可下发 {invalidHostCount}</Badge>
            </div>
          </div>
        </div>

        {!hasPolicy ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>策略对象不存在</AlertTitle>
            <AlertDescription>
              请先回到“任务计划”步骤，创建基线扫描策略对象。
            </AlertDescription>
          </Alert>
        ) : null}

        {hasPolicy ? (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>已完成前置配置</AlertTitle>
            <AlertDescription>
              当前策略对象和主机范围已就绪，可以先进入下发预览再确认提交。
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex justify-between border-t pt-4">
          <Button variant="outline" onClick={onBack} className="h-11 px-5">
            返回：主机选择
          </Button>
          <Button onClick={onPreview} disabled={!canPreview} className="h-11 px-6">
            <ArrowRight className="mr-2 h-4 w-4" />
            下发预览
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
