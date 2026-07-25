"use client"

import { useEffect, useState } from "react"
import {
  Check,
  CircleAlert,
  Copy,
  FileJson2,
  LoaderCircle,
  RotateCcw,
} from "lucide-react"

import {
  getControlObjectDefinition,
  type ControlObjectDefinition,
  type ControlObjectDetail,
  type ControlObjectSource,
} from "@/features/control-object-library/api"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"

const SOURCE_PRESENTATION: Record<ControlObjectSource, { label: string; className: string }> = {
  builtin: {
    label: "系统内置",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  manual: {
    label: "手动创建",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  remediation: {
    label: "处置编排",
    className: "border-violet-200 bg-violet-50 text-violet-700",
  },
  mitigation: {
    label: "直接处置",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  unknown: {
    label: "未标明",
    className: "border-slate-200 bg-slate-50 text-slate-600",
  },
}

const TYPE_LABELS = {
  config: "配置",
  policy: "策略",
  command: "命令",
} as const

function detailErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message.trim() : ""
  if (message === "PMC_OBJECT_DETAIL_INVALID") {
    return "后台没有返回完整的对象定义，请检查单对象详情接口。"
  }
  if (message === "PMC_OBJECT_DETAIL_MISMATCH") {
    return "后台返回的对象身份或版本与当前选择不一致，已停止展示。"
  }
  if (message === "PMC_OBJECT_DEFINITION_INVALID") {
    return "后台返回的对象定义缺少类型、Object ID、名称或版本。"
  }
  return message || "完整对象内容加载失败，请稍后重试。"
}

export function ControlObjectDetailDialog({
  open,
  definition,
  onOpenChange,
}: {
  open: boolean
  definition: ControlObjectDefinition | null
  onOpenChange: (open: boolean) => void
}) {
  const [detail, setDetail] = useState<ControlObjectDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [reloadToken, setReloadToken] = useState(0)
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle")

  useEffect(() => {
    if (!open || !definition) {
      setDetail(null)
      setLoading(false)
      setError("")
      setCopyState("idle")
      return
    }

    let active = true
    setDetail(null)
    setLoading(true)
    setError("")
    setCopyState("idle")

    void getControlObjectDefinition(definition)
      .then((result) => {
        if (active) setDetail(result)
      })
      .catch((loadError: unknown) => {
        if (active) setError(detailErrorMessage(loadError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [definition, open, reloadToken])

  useEffect(() => {
    if (copyState !== "copied") return
    const timer = window.setTimeout(() => setCopyState("idle"), 1800)
    return () => window.clearTimeout(timer)
  }, [copyState])

  const handleCopy = async () => {
    if (!detail) return
    try {
      await navigator.clipboard.writeText(detail.displayJson)
      setCopyState("copied")
    } catch {
      setCopyState("failed")
    }
  }

  const visibleDefinition = detail?.definition ?? definition
  const source = visibleDefinition ? SOURCE_PRESENTATION[visibleDefinition.source] : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-slate-950/45 backdrop-blur-[2px]"
        className={cn(
          "flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1.5rem)] max-w-[900px] flex-col gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-2xl sm:rounded-2xl",
          "[&>button]:right-4 [&>button]:top-3.5 [&>button]:flex [&>button]:h-8 [&>button]:w-8 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:border [&>button]:border-slate-200 [&>button]:bg-white [&>button]:text-slate-500 [&>button]:opacity-100 [&>button]:shadow-sm [&>button]:hover:bg-slate-100 [&>button]:hover:text-slate-800 [&>button]:focus-visible:ring-2 [&>button]:focus-visible:ring-cyan-500",
        )}
      >
        <DialogHeader className="shrink-0 space-y-0 border-b border-slate-200 bg-slate-50/80 px-4 py-3 pr-14 text-left sm:px-5 sm:pr-16">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
              <FileJson2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-sm font-semibold leading-5 text-slate-950">
                {visibleDefinition?.displayName || "完整对象 JSON"}
              </DialogTitle>
              <DialogDescription className="mt-0.5 truncate text-xs text-slate-500">
                通过单对象详情接口读取的完整定义
              </DialogDescription>
            </div>
          </div>

          {visibleDefinition && (
            <div className="mt-2.5 flex min-w-0 flex-wrap items-center gap-1.5 pl-0 sm:pl-[42px]">
              <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                {TYPE_LABELS[visibleDefinition.objectType]}
              </Badge>
              {source && (
                <Badge variant="outline" className={cn("font-medium", source.className)}>
                  {source.label}
                </Badge>
              )}
              <span className="inline-flex rounded-full border border-slate-200 bg-white px-2 py-0.5 font-mono text-[11px] font-medium text-slate-600">
                v{visibleDefinition.version}
              </span>
              <span
                className="min-w-0 truncate font-mono text-[10px] text-slate-400 sm:max-w-[420px]"
                title={visibleDefinition.objectId}
              >
                {visibleDefinition.objectId}
              </span>
            </div>
          )}
        </DialogHeader>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-slate-950">
          {loading ? (
            <div className="flex min-h-72 flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-slate-300" aria-busy="true">
              <LoaderCircle className="h-6 w-6 animate-spin text-cyan-400" aria-hidden="true" />
              <p className="text-sm">正在读取完整对象内容…</p>
            </div>
          ) : error ? (
            <div className="flex min-h-72 flex-1 items-center justify-center px-6 py-10">
              <div className="max-w-md text-center">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/15 text-rose-300">
                  <CircleAlert className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="mt-3 text-sm font-medium text-white">对象内容加载失败</p>
                <p className="mt-1.5 text-xs leading-5 text-slate-300">{error}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReloadToken((token) => token + 1)}
                  className="mt-4 h-8 rounded-full border-slate-600 bg-slate-900 px-3 text-slate-100 hover:bg-slate-800 hover:text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  重试
                </Button>
              </div>
            </div>
          ) : detail ? (
            <pre
              className="min-h-0 min-w-0 w-full max-w-full flex-1 overflow-auto p-4 font-mono text-[12px] leading-5 text-slate-200 [tab-size:2] sm:p-5"
              tabIndex={0}
              aria-label={`${detail.definition.displayName} 的完整 JSON`}
            >
              <code>{detail.displayJson}</code>
            </pre>
          ) : null}
        </div>

        <div className="flex min-h-12 shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-2 sm:px-5">
          <p className={cn(
            "min-w-0 truncate text-xs",
            copyState === "failed" ? "text-rose-600" : "text-slate-500",
          )} aria-live="polite">
            {copyState === "copied"
              ? "完整 JSON 已复制"
              : copyState === "failed"
                ? "复制失败，请检查浏览器剪贴板权限"
                : "context 为合法 JSON 时会展开显示，原始响应不会被修改"}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!detail || loading}
            onClick={() => void handleCopy()}
            className="h-8 shrink-0 rounded-full border-slate-200 bg-white px-3 text-slate-700 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
          >
            {copyState === "copied" ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {copyState === "copied" ? "已复制" : "复制 JSON"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
