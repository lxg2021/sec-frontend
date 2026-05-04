"use client"

import { useState } from "react"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { AlertCircle } from "lucide-react"
import type { ConfigCategory } from "@/features/sensor-config/types/config-item"
import { configStorage } from "@/features/sensor-config/data/config-storage"
import { useToast } from "@/shared/hooks/use-toast"
import { CheckCircle2 } from "lucide-react"

interface ConfigCreateDialogProps {
  categories: ConfigCategory[]
  onConfigSaved: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConfigCreateDialog({
  categories,
  onConfigSaved,
  open,
  onOpenChange,
}: ConfigCreateDialogProps) {
  const [name, setName] = useState("")
  const [version, setVersion] = useState("")
  const [error, setError] = useState("")
  const { toast } = useToast()

  const resetForm = () => {
    setName("")
    setVersion("")
    setError("")
  }

  const validateForm = (): string | null => {
    if (!name.trim()) return "配置名称不能为空"
    if (!version.trim()) return "配置版本不能为空"

    const existingConfigs = configStorage.getConfigs()
    const duplicate = existingConfigs.some((c) => c.name === name.trim())
    if (duplicate) return "配置名称已存在，请使用不同的名称"

    return null
  }

  const handleSave = () => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    const currentDate = new Date().toISOString().split("T")[0] // YYYY-MM-DD
    const configData = {
      name: name.trim(),
      version: version.trim(),
      date: currentDate,
      categories: categories
        .map((category) => ({
          label: category.label,
          items: category.items
            .filter((item) => item.enabled)
            .map((item) => ({
              key: item.key,
              label: item.label,
              description: item.description,
              enabled: item.enabled,
            })),
        }))
        .filter((c) => c.items.length > 0),
    }

    try {
      configStorage.saveConfig(configData)

      toast({
        duration: 2000, // 2秒自动消失
        className: "bg-white/90 backdrop-blur-sm text-slate-700 shadow-md rounded-xl flex items-center gap-3 p-4 border border-slate-200",
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-teal-500" />
            <span className="font-medium">创建成功</span>
          </div>
        ),
        description: (
          <span className="ml-7 text-slate-600">
            配置文件 <strong className="text-slate-800">{name}-{version}-{currentDate}.json</strong> 已创建
          </span>
        ),
      })

      resetForm()
      onOpenChange(false)
      onConfigSaved()
    } catch {
      setError("保存配置失败，请重试")
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetForm()
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">创建新配置</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            填写配置信息，将生成格式为 name-version-date.json 的配置文件
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label htmlFor="name">
              配置名称 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入配置名称"
              className="h-10"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="version">
              配置版本 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="version"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="例如: v1.0"
              className="h-10"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} className="min-w-[100px]">
            创建配置
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
