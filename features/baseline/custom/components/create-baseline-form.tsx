"use client"

import { RefreshCw } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"

interface CreateBaselineFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  displayName: string
  description: string
  selectedTemplateCount: number
  selectedItemCount: number
  errorMessage: string
  submitting: boolean
  onDisplayNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onReset: () => void
  onSubmit: () => void
}

export function CreateBaselineForm({
  open,
  onOpenChange,
  displayName,
  description,
  selectedTemplateCount,
  selectedItemCount,
  errorMessage,
  submitting,
  onDisplayNameChange,
  onDescriptionChange,
  onReset,
  onSubmit,
}: CreateBaselineFormProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>创建自定义基线</DialogTitle>
          <DialogDescription>
            已选择 {selectedItemCount} 个检查项，来自 {selectedTemplateCount} 个模板。
          </DialogDescription>
        </DialogHeader>

        <Card className="border-border/60 shadow-none">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-base font-semibold text-foreground">自定义信息</CardTitle>
            <CardDescription className="mt-1 text-sm text-muted-foreground">
              为当前勾选的检查项创建一个新的自定义基线
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 p-4">
            {errorMessage ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="display-name">
                基线名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(event) => onDisplayNameChange(event.target.value)}
                placeholder="例如：Windows 服务器自定义基线"
                className="h-10"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">说明</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(event) => onDescriptionChange(event.target.value)}
                placeholder="补充这个自定义基线的用途、环境或适用范围"
                className="min-h-28 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onReset} disabled={submitting}>
            重置
          </Button>
          <Button type="button" onClick={onSubmit} disabled={submitting || selectedItemCount === 0}>
            {submitting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            创建基线
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
