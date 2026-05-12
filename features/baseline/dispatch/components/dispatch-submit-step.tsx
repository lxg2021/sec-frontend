"use client"

import { AlertCircle, ArrowRight, CheckCircle2, ChevronLeft, FileText } from "lucide-react"

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
    <Card className="border bg-card shadow-sm">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <FileText className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">任务下发</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              确认策略对象和目标范围，然后进入下发预览。
            </CardDescription>
          </div>
        </div>
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
            <div className="mt-2 text-sm font-medium text-slate-950">{selectedHostCount} 台</div>
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
            <AlertDescription>请先回到“任务计划”步骤，创建基线扫描策略对象。</AlertDescription>
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

        <div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
          <Button variant="outline" onClick={onBack} className="h-11 px-5">
            <ChevronLeft className="mr-2 h-4 w-4" />
            返回：主机选择
          </Button>
          <Button onClick={onPreview} disabled={!canPreview} className="h-11 px-6">
            下发预览
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
