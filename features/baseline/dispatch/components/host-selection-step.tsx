"use client"

import { Server } from "lucide-react"

import HostSelector from "@/shared/components/host-selector"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

interface HostSelectionStepProps {
  canNext: boolean
  data: any[]
  error?: string
  loading?: boolean
  onBack: () => void
  onNext: () => void
  onSelectionChange: (nodes: any[], ids: Set<string>) => void
  selectedHostCount: number
  selectedNodeCount: number
  selectorKey: number
}

export function HostSelectionStep({
  canNext,
  data,
  error,
  loading = false,
  onBack,
  onNext,
  onSelectionChange,
  selectedHostCount,
  selectedNodeCount,
  selectorKey,
}: HostSelectionStepProps) {
  return (
    <Card className="overflow-hidden border-slate-200/80 shadow-lg">
      <div className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-slate-950" />
      <CardHeader className="border-b bg-gradient-to-b from-white to-slate-50/60">
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
            <Server className="h-4 w-4" />
          </div>
          主机选择
        </CardTitle>
        <CardDescription>选择需要接收该基线扫描策略的目标主机范围。</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 p-6">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="rounded-full px-3">
            已选主机 {selectedHostCount}
          </Badge>
          <Badge variant="secondary" className="rounded-full px-3">
            已选节点 {selectedNodeCount}
          </Badge>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>主机数据加载失败</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <HostSelector
          key={selectorKey}
          data={data}
          loading={loading}
          emptyText="未获取到主机树数据。"
          onSelectionChange={onSelectionChange}
        />

        <div className="flex justify-between border-t pt-4">
          <Button variant="outline" onClick={onBack} className="h-11 px-5">
            返回：任务计划
          </Button>
          <Button onClick={onNext} disabled={!canNext} className="h-11 px-6">
            下一步：任务下发
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
