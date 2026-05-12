"use client"

import { ArrowRight, ChevronLeft, Server } from "lucide-react"

import HostSelector from "@/shared/components/host-selector"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
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
    <Card className="border bg-card shadow-sm">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <Server className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">主机选择</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              选择需要接收该基线扫描策略的目标主机范围。
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-6">
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
          showHeader={false}
          emptyText="未获取到主机树数据。"
          onSelectionChange={onSelectionChange}
        />

        <div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
          <Button variant="outline" onClick={onBack} className="h-11 px-5">
            <ChevronLeft className="mr-2 h-4 w-4" />
            任务计划
          </Button>
          <Button onClick={onNext} disabled={!canNext} className="h-11 px-6">
            任务下发
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
