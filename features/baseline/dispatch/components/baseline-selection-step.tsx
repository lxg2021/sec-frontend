"use client"

import type { ReactNode } from "react"
import { LayoutGrid } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

interface BaselineSelectionStepProps {
  canNext: boolean
  onNameChange: (value: string) => void
  onNext: () => void
  onVersionChange: (value: string) => void
  policyName: string
  selector: ReactNode
  version: string
}

export function BaselineSelectionStep({
  canNext,
  onNameChange,
  onNext,
  onVersionChange,
  policyName,
  selector,
  version,
}: BaselineSelectionStepProps) {
  return (
    <Card className="overflow-hidden border-slate-200/80 shadow-lg">
      <div className="h-1 bg-gradient-to-r from-slate-950 via-blue-600 to-cyan-400" />
      <CardHeader className="border-b bg-gradient-to-b from-white to-slate-50/60">
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
            <LayoutGrid className="h-4 w-4" />
          </div>
          基线选择
        </CardTitle>
        <CardDescription>
          填写策略名称、版本，并选择本次下发所依赖的基线模板。
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="policy-name">策略名称 *</Label>
            <Input
              id="policy-name"
              value={policyName}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="例如：Windows 基线巡检策略"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="policy-version">版本号 *</Label>
            <Input
              id="policy-version"
              value={version}
              onChange={(event) => onVersionChange(event.target.value)}
              placeholder="例如：1.0.0"
            />
          </div>
        </div>

        <div className="border-t pt-6">{selector}</div>

        <div className="flex justify-end border-t pt-4">
          <Button onClick={onNext} disabled={!canNext} className="h-11 px-6">
            下一步：任务计划
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
