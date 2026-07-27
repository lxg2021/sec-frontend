"use client"

import { useMemo, useState, type ReactNode } from "react"
import { useLocale } from "next-intl"
import {
  Check,
  ChevronDown,
  ChevronUp,
  Code2,
  Copy,
  Database,
  ExternalLink,
  FileText,
  Info,
  LinkIcon,
  Settings2,
  SlidersHorizontal,
} from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip"
import { cn } from "@/shared/lib/utils"

import type { BaselineTemplateItem } from "../../dashboard/api"

interface BaselineDetailSpecProps {
  item: BaselineTemplateItem | null
  isLoading?: boolean
}

type Labels = ReturnType<typeof getLabels>

type Field = {
  key: string
  label: string
  value?: string
  mono?: boolean
}

function hasValue(value?: string) {
  return typeof value === "string" && value.trim().length > 0
}

function isUrl(value: string) {
  return /^https?:\/\//i.test(value)
}

function splitReferences(value?: string) {
  const text = value?.trim()
  if (!text) return []

  const parts = text
    .split(/[\n;]+/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length > 1) return parts

  const urls = text.match(/https?:\/\/[^\s)]+/gi)
  if (urls?.length) return urls

  return [text]
}

function getLabels(useZh: boolean) {
  return {
    title: useZh ? "检查项说明" : "Item Overview",
    subtitle: useZh ? "来自基线详情接口的结构化配置" : "Structured configuration from baseline detail",
    empty: useZh ? "暂无检查项详情" : "No item detail available",
    copied: useZh ? "已复制" : "Copied",
    copy: useZh ? "复制" : "Copy",
    expand: useZh ? "展开" : "Expand",
    collapse: useZh ? "折叠" : "Collapse",
    description: useZh ? "说明" : "Description",
    recommendation: useZh ? "推荐配置" : "Recommended configuration",
    detection: useZh ? "检测方式" : "Detection method",
    registry: useZh ? "注册表配置" : "Registry configuration",
    wmi: useZh ? "WMI / CIM 配置" : "WMI / CIM configuration",
    intune: useZh ? "Intune / DCP 配置" : "Intune / DCP configuration",
    references: useZh ? "参考文档" : "References",
    method: useZh ? "检测方法" : "Method",
    methodArgument: useZh ? "注册表项" : "Registry item",
    itemId: useZh ? "条目 ID" : "Item ID",
    category: useZh ? "分类" : "Category",
    recommendedValue: useZh ? "推荐值" : "Recommended value",
    defaultValue: useZh ? "默认值" : "Default value",
    operator: useZh ? "比较符" : "Operator",
    filter: useZh ? "适用条件" : "Filter",
    path: useZh ? "路径" : "Path",
    namespace: useZh ? "命名空间" : "Namespace",
    className: useZh ? "类名" : "Class name",
    property: useZh ? "属性" : "Property",
    query: useZh ? "查询/参数" : "Query / argument",
    intunePath: useZh ? "Intune 路径" : "Intune path",
    intuneItem: useZh ? "Intune 项" : "Intune item",
    intuneDefault: useZh ? "Intune 默认值" : "Intune default",
    intuneRecommended: useZh ? "Intune 推荐值" : "Intune recommended",
    intuneOperator: useZh ? "Intune 比较符" : "Intune operator",
    dcpPath: useZh ? "DCP 路径" : "DCP path",
  }
}

function SkeletonRow() {
  return <div className="h-10 animate-pulse rounded-xl bg-muted/70" />
}

function SkeletonCard() {
  return (
    <Card className="flex min-h-0 shrink flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      <CardContent className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
            <div className="h-4 w-[28rem] max-w-full animate-pulse rounded bg-muted" />
          </div>
          <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="h-14 rounded-2xl border-l-4 border-blue-500 bg-muted/30 p-4" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-2xl border p-4">
            <SkeletonRow />
            <SkeletonRow />
          </div>
          <div className="space-y-3 rounded-2xl border p-4">
            <SkeletonRow />
            <SkeletonRow />
          </div>
        </div>
        <div className="space-y-3 rounded-2xl border p-4">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <Card className="min-h-0 shrink rounded-[24px] border-dashed bg-background shadow-sm">
      <CardContent className="py-12 text-center text-sm text-muted-foreground">{label}</CardContent>
    </Card>
  )
}

function CopyButton({
  value,
  copied,
  labels,
  onCopy,
}: {
  value: string
  copied: boolean
  labels: Labels
  onCopy: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0 rounded-full opacity-60 transition-opacity hover:opacity-100"
      aria-label={labels.copy}
      onClick={onCopy}
      disabled={!value}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  )
}

function ValuePill({
  field,
  copied,
  labels,
  onCopy,
}: {
  field: Field
  copied: boolean
  labels: Labels
  onCopy: () => void
}) {
  const value = field.value?.trim() || ""

  return (
    <div className="flex min-w-0 items-center gap-2">
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "min-w-0 flex-1 truncate rounded-xl bg-slate-100 px-3 py-1.5 text-right text-sm text-slate-900",
                field.mono && "font-mono text-xs",
              )}
            >
              {value}
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-[40rem] whitespace-pre-wrap break-words">{value}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <CopyButton value={value} copied={copied} labels={labels} onCopy={onCopy} />
    </div>
  )
}

function InfoRow({
  field,
  copiedKey,
  labels,
  onCopy,
}: {
  field: Field
  copiedKey: string | null
  labels: Labels
  onCopy: (key: string, value: string) => void
}) {
  const value = field.value?.trim() || ""
  if (!value) return null

  return (
    <div className="flex items-center justify-between gap-4 border-b border-dashed border-slate-200 py-3 last:border-0">
      <div className="min-w-0 text-sm text-slate-500">{field.label}</div>
      <div className="min-w-0 max-w-[70%]">
        <ValuePill field={field} copied={copiedKey === field.key} labels={labels} onCopy={() => onCopy(field.key, value)} />
      </div>
    </div>
  )
}

function Panel({
  title,
  accentClassName,
  icon,
  children,
}: {
  title: string
  accentClassName: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-background p-4 shadow-sm">
      <div className="flex items-center gap-2 pb-4">
        <span aria-hidden="true" className={cn("h-5 w-1.5 rounded-full", accentClassName)} />
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span className="ml-auto text-slate-400">{icon}</span>
      </div>
      {children}
    </div>
  )
}

function PrimaryBlock({
  item,
  labels,
  copiedKey,
  onCopy,
}: {
  item: BaselineTemplateItem
  labels: Labels
  copiedKey: string | null
  onCopy: (key: string, value: string) => void
}) {
  const hasRegistry = hasValue(item.registry_path) || hasValue(item.registry_item)
  const hasWmi = hasValue(item.namespace) || hasValue(item.class_name) || hasValue(item.property)
  const hasIntune =
    hasValue(item.registry_path_intune) ||
    hasValue(item.registry_item_intune) ||
    hasValue(item.default_value_intune) ||
    hasValue(item.recommended_value_intune) ||
    hasValue(item.operator_intune) ||
    hasValue(item.registry_path_dcp)

  const renderLine = (key: string, label: string, value?: string) => {
    if (!hasValue(value)) return null
    const text = value!.trim()
    return (
      <div key={key} className="flex items-center justify-between gap-4 border-b border-white/10 py-3 last:border-0">
        <div className="text-sm text-slate-300">{label}</div>
        <div className="min-w-0 max-w-[72%]">
          <ValuePill field={{ key, label, value: text, mono: true }} copied={copiedKey === key} labels={labels} onCopy={() => onCopy(key, text)} />
        </div>
      </div>
    )
  }

  if (hasWmi) {
    return (
      <Panel title={labels.wmi} accentClassName="bg-orange-500" icon={<Code2 className="h-4 w-4" />}>
        <div className="rounded-2xl bg-slate-950 px-4 py-4">
          <div className="space-y-0">
            {renderLine("namespace", labels.namespace, item.namespace)}
            {renderLine("class_name", labels.className, item.class_name)}
            {renderLine("property", labels.property, item.property)}
            {renderLine("method_argument", labels.query, item.method_argument)}
          </div>
        </div>
      </Panel>
    )
  }

  if (hasRegistry) {
    return (
      <Panel title={labels.registry} accentClassName="bg-orange-500" icon={<Database className="h-4 w-4" />}>
        <div className="space-y-3">
          {hasValue(item.registry_path) && (
            <div className="rounded-2xl bg-slate-950 px-4 py-4">
              <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">{labels.path}</div>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 font-mono text-sm leading-7 text-emerald-400">
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="truncate">{item.registry_path}</div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[42rem] whitespace-pre-wrap break-words">
                        {item.registry_path}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <CopyButton
                  value={item.registry_path}
                  copied={copiedKey === "registry_path"}
                  labels={labels}
                  onCopy={() => onCopy("registry_path", item.registry_path)}
                />
              </div>
            </div>
          )}
          {hasValue(item.registry_item) && (
            <InfoRow
              field={{ key: "registry_item", label: labels.methodArgument, value: item.registry_item, mono: true }}
              copiedKey={copiedKey}
              labels={labels}
              onCopy={onCopy}
            />
          )}
        </div>
      </Panel>
    )
  }

  if (hasIntune) {
    return (
      <Panel title={labels.intune} accentClassName="bg-orange-500" icon={<Settings2 className="h-4 w-4" />}>
        <div className="space-y-3">
          {hasValue(item.registry_path_intune) && (
            <InfoRow
              field={{ key: "registry_path_intune", label: labels.intunePath, value: item.registry_path_intune, mono: true }}
              copiedKey={copiedKey}
              labels={labels}
              onCopy={onCopy}
            />
          )}
          {hasValue(item.registry_item_intune) && (
            <InfoRow
              field={{ key: "registry_item_intune", label: labels.intuneItem, value: item.registry_item_intune, mono: true }}
              copiedKey={copiedKey}
              labels={labels}
              onCopy={onCopy}
            />
          )}
          {hasValue(item.default_value_intune) && (
            <InfoRow
              field={{ key: "default_value_intune", label: labels.intuneDefault, value: item.default_value_intune, mono: true }}
              copiedKey={copiedKey}
              labels={labels}
              onCopy={onCopy}
            />
          )}
          {hasValue(item.recommended_value_intune) && (
            <InfoRow
              field={{
                key: "recommended_value_intune",
                label: labels.intuneRecommended,
                value: item.recommended_value_intune,
                mono: true,
              }}
              copiedKey={copiedKey}
              labels={labels}
              onCopy={onCopy}
            />
          )}
          {hasValue(item.operator_intune) && (
            <InfoRow
              field={{ key: "operator_intune", label: labels.intuneOperator, value: item.operator_intune, mono: true }}
              copiedKey={copiedKey}
              labels={labels}
              onCopy={onCopy}
            />
          )}
          {hasValue(item.registry_path_dcp) && (
            <InfoRow
              field={{ key: "registry_path_dcp", label: labels.dcpPath, value: item.registry_path_dcp, mono: true }}
              copiedKey={copiedKey}
              labels={labels}
              onCopy={onCopy}
            />
          )}
        </div>
      </Panel>
    )
  }

  return null
}

export function BaselineDetailSpec({ item, isLoading = false }: BaselineDetailSpecProps) {
  const locale = useLocale()
  const useZh = locale.toLowerCase().startsWith("zh")
  const labels = getLabels(useZh)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  const references = useMemo(() => splitReferences(item?.references), [item?.references])
  const descriptionCn = item?.description?.trim() || ""
  const descriptionEn = item?.description_en?.trim() || ""
  const description = useZh ? descriptionCn || descriptionEn : descriptionEn

  if (isLoading) return <SkeletonCard />
  if (!item) return <EmptyState label={labels.empty} />

  const handleCopy = async (key: string, value: string) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(key)
      window.setTimeout(() => setCopiedKey(null), 1200)
    } catch {
      setCopiedKey(null)
    }
  }

  const recommendedFields: Field[] = [
    { key: "recommended_value", label: labels.recommendedValue, value: item.recommended_value, mono: true },
    { key: "default_value", label: labels.defaultValue, value: item.default_value, mono: true },
  ]

  const detectionFields: Field[] = [
    { key: "method", label: labels.method, value: item.method, mono: true },
    { key: "method_argument", label: labels.methodArgument, value: item.method_argument, mono: true },
  ]

  return (
    <TooltipProvider delayDuration={200}>
      <Card className="flex min-h-0 shrink flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
        <div className="border-b border-slate-200 px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <FileText className="size-6" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-base font-medium text-slate-950">{labels.title}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">{labels.subtitle}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full border border-slate-200 bg-background text-slate-600 hover:bg-slate-50"
              aria-label={collapsed ? labels.expand : labels.collapse}
              onClick={() => setCollapsed((current) => !current)}
            >
              {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {!collapsed && (
          <CardContent className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
            {description && (
              <div className="rounded-2xl border-l-4 border-blue-500 bg-blue-50/50 px-4 py-3 text-sm leading-7 text-slate-700">
                {description}
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title={labels.recommendation} accentClassName="bg-emerald-500" icon={<Check className="h-4 w-4" />}>
                <div className="space-y-1">
                  {recommendedFields.map((field) => (
                    <InfoRow key={field.key} field={field} copiedKey={copiedKey} labels={labels} onCopy={handleCopy} />
                  ))}
                </div>
              </Panel>

              <Panel title={labels.detection} accentClassName="bg-violet-500" icon={<SlidersHorizontal className="h-4 w-4" />}>
                <div className="space-y-1">
                  {detectionFields.map((field) => (
                    <InfoRow key={field.key} field={field} copiedKey={copiedKey} labels={labels} onCopy={handleCopy} />
                  ))}
                </div>
              </Panel>
            </div>

            <PrimaryBlock item={item} labels={labels} copiedKey={copiedKey} onCopy={handleCopy} />

            {references.length > 0 && (
              <div className="border-t border-slate-200 pt-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <LinkIcon className="h-4 w-4 text-blue-600" />
                  {labels.references}
                </div>
                <div className="flex flex-wrap gap-2">
                  {references.map((ref) =>
                    isUrl(ref) ? (
                      <a
                        key={ref}
                        href={ref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span className="truncate">{ref}</span>
                      </a>
                    ) : (
                      <span
                        key={ref}
                        className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
                      >
                        <Info className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate">{ref}</span>
                      </span>
                    ),
                  )}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </TooltipProvider>
  )
}

export default BaselineDetailSpec
