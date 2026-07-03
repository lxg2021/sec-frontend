"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import {
  Archive,
  Boxes,
  ClipboardCheck,
  Clock3,
  Cpu,
  Database,
  FileSearch,
  FileText,
  FolderSearch,
  HardDrive,
  Layers3,
  ListFilter,
  Loader2,
  Monitor,
  Network,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { ScrollArea } from "@/shared/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/shared/ui/select"
import { Skeleton } from "@/shared/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { cn } from "@/shared/lib/utils"
import {
  getForensicArtifactDefinition,
  listForensicArtifacts,
} from "@/shared/lib/forensic/api"
import type { ForensicArtifactDefinitionItem } from "@/shared/lib/forensic/types"

type EnabledFilter = "all" | "enabled" | "disabled"

type JsonResult<T> = {
  ok: boolean
  value: T
}

type LocalizedText = string | Record<string, string> | undefined

interface ArtifactDisplay {
  name?: string
  summary?: string
  description?: string
  use_cases?: string[]
  collects?: string[]
  warnings?: string[]
}

interface ArtifactDocItem {
  name?: string
  type?: string
  required?: boolean
  default?: unknown
  label?: LocalizedText
  description?: LocalizedText
  examples?: unknown[]
  tips?: Record<string, string[]> | string[]
  maps_to?: string
  transform?: string
}

interface ArtifactExample {
  title?: LocalizedText
  description?: LocalizedText
  params?: unknown
}

const ALL_VALUE = "all"
const DEFAULT_PLATFORM_VALUES = ["windows", "linux", "macos"]

function safeParseJson<T>(raw: string | undefined, fallback: T, context: string): JsonResult<T> {
  if (!raw) {
    return { ok: true, value: fallback }
  }
  try {
    return { ok: true, value: JSON.parse(raw) as T }
  } catch (error) {
    console.warn(`Failed to parse ${context}`, error)
    return { ok: false, value: fallback }
  }
}

function localeKey(locale: string) {
  return locale === "zh-CN" ? "zh-CN" : "en"
}

function localizedText(value: LocalizedText, locale: string): string {
  if (!value) {
    return ""
  }
  if (typeof value === "string") {
    return value
  }
  const key = localeKey(locale)
  return value[key] || value.en || value["zh-CN"] || ""
}

function localizedArray(value: Record<string, string[]> | string[] | undefined, locale: string): string[] {
  if (!value) {
    return []
  }
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean)
  }
  const key = localeKey(locale)
  return value[key] || value.en || value["zh-CN"] || []
}

function toPrettyJson(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return ""
  }
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function sortArtifacts(items: ForensicArtifactDefinitionItem[]) {
  return [...items].sort((a, b) => {
    const order = (a.sort_order ?? 0) - (b.sort_order ?? 0)
    if (order !== 0) {
      return order
    }
    return a.artifact_key.localeCompare(b.artifact_key)
  })
}

function getArtifactDisplay(item: ForensicArtifactDefinitionItem | null | undefined, locale: string) {
  const parsed = safeParseJson<Record<string, ArtifactDisplay>>(
    item?.display_json,
    {},
    `${item?.artifact_key || "artifact"}.display_json`,
  )
  const display = parsed.value[localeKey(locale)] || parsed.value.en || parsed.value["zh-CN"] || {}
  return {
    parseOk: parsed.ok,
    name: display.name || item?.name || item?.artifact_key || "",
    summary: display.summary || item?.description || "",
    description: display.description || item?.description || "",
    useCases: Array.isArray(display.use_cases) ? display.use_cases : [],
    collects: Array.isArray(display.collects) ? display.collects : [],
    warnings: Array.isArray(display.warnings) ? display.warnings : [],
  }
}

function getSearchText(item: ForensicArtifactDefinitionItem, locale: string) {
  const display = getArtifactDisplay(item, locale)
  return [
    item.artifact_key,
    item.name,
    item.description,
    item.category,
    item.platform,
    display.name,
    display.summary,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error || "")
}

function formatRefreshTime(value?: Date | null): string {
  if (!value) {
    return "--"
  }

  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(value)
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "00"

  return `${getPart("year")}-${getPart("month")}-${getPart("day")} ${getPart("hour")}:${getPart("minute")}:${getPart("second")}`
}

type CategoryVisual = {
  icon: LucideIcon
  iconClass: string
  dotClass: string
  activeClass: string
}

const DEFAULT_CATEGORY_VISUAL: CategoryVisual = {
  icon: Boxes,
  iconClass: "bg-slate-600 text-white shadow-slate-200",
  dotClass: "bg-slate-500",
  activeClass: "border-slate-300 bg-slate-50 text-slate-800",
}

const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  file: {
    icon: FolderSearch,
    iconClass: "bg-sky-500 text-white shadow-sky-100",
    dotClass: "bg-sky-500",
    activeClass: "border-sky-300 bg-sky-50 text-sky-800",
  },
  registry: {
    icon: Database,
    iconClass: "bg-violet-500 text-white shadow-violet-100",
    dotClass: "bg-violet-500",
    activeClass: "border-violet-300 bg-violet-50 text-violet-800",
  },
  eventlog: {
    icon: FileText,
    iconClass: "bg-orange-500 text-white shadow-orange-100",
    dotClass: "bg-orange-500",
    activeClass: "border-orange-300 bg-orange-50 text-orange-800",
  },
  forensic: {
    icon: ShieldCheck,
    iconClass: "bg-emerald-500 text-white shadow-emerald-100",
    dotClass: "bg-emerald-500",
    activeClass: "border-emerald-300 bg-emerald-50 text-emerald-800",
  },
  network: {
    icon: Network,
    iconClass: "bg-slate-600 text-white shadow-slate-100",
    dotClass: "bg-slate-500",
    activeClass: "border-slate-300 bg-slate-50 text-slate-800",
  },
  system: {
    icon: Cpu,
    iconClass: "bg-teal-500 text-white shadow-teal-100",
    dotClass: "bg-teal-500",
    activeClass: "border-teal-300 bg-teal-50 text-teal-800",
  },
  ntfs: {
    icon: HardDrive,
    iconClass: "bg-indigo-500 text-white shadow-indigo-100",
    dotClass: "bg-indigo-500",
    activeClass: "border-indigo-300 bg-indigo-50 text-indigo-800",
  },
  application: {
    icon: Archive,
    iconClass: "bg-rose-500 text-white shadow-rose-100",
    dotClass: "bg-rose-500",
    activeClass: "border-rose-300 bg-rose-50 text-rose-800",
  },
}

function getCategoryVisual(category?: string) {
  return category ? CATEGORY_VISUALS[category] || DEFAULT_CATEGORY_VISUAL : DEFAULT_CATEGORY_VISUAL
}

function formatPlatformLabel(value: string) {
  if (!value) {
    return "-"
  }
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function getPlatformIconSrc(value: string) {
  const normalized = value.toLowerCase()
  if (normalized.includes("windows")) {
    return "/icons/system/windows.svg"
  }
  if (normalized.includes("linux")) {
    return "/icons/system/linux.svg"
  }
  if (normalized.includes("mac") || normalized.includes("darwin")) {
    return "/icons/system/macos.svg"
  }
  return "/icons/system/patchcategory.svg"
}

function PlatformOptionLabel({
  value,
  label,
  className,
  block,
}: {
  value: string
  label: string
  className?: string
  block?: boolean
}) {
  const content = (
    <>
      <img
        src={getPlatformIconSrc(value)}
        alt=""
        aria-hidden="true"
        className="h-4 w-4 shrink-0 object-contain"
      />
      <span className="min-w-0 truncate">{label}</span>
    </>
  )

  if (block) {
    return (
      <div className={cn("flex min-w-0 items-center gap-2 whitespace-nowrap", className)}>
        {content}
      </div>
    )
  }

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2 whitespace-nowrap", className)}>
      {content}
    </span>
  )
}

function CategoryIcon({
  category,
  className,
  size = "md",
}: {
  category?: string
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const visual = getCategoryVisual(category)
  const Icon = visual.icon
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl shadow-sm",
        size === "sm" && "size-10",
        size === "md" && "size-12",
        size === "lg" && "size-14",
        visual.iconClass,
        className,
      )}
    >
      <Icon className={cn(size === "sm" ? "size-5" : "size-6")} aria-hidden />
    </span>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
  tone,
  glow,
  valueClassName,
}: {
  icon: LucideIcon
  label: string
  value: number | string
  description: string
  tone: string
  glow: string
  valueClassName?: string
}) {
  return (
    <div className="group relative min-h-[112px] min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.07),0_1px_2px_-1px_rgba(0,0,0,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-950">
      <div
        className={cn(
          "absolute -left-10 -top-10 h-36 w-36 rounded-full opacity-[0.06] blur-3xl transition-opacity duration-500 group-hover:opacity-[0.12]",
          glow,
        )}
        aria-hidden
      />
      <div className="relative flex min-h-[112px] items-center gap-5 px-6 py-5">
        <span className={cn("inline-flex size-[52px] shrink-0 items-center justify-center rounded-xl text-white shadow-lg", tone)}>
          <Icon className="size-5" strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="mb-1.5 truncate text-[11px] font-semibold leading-4 text-slate-400 dark:text-slate-500">{label}</p>
          <p
            className={cn(
              "truncate text-[28px] font-bold leading-none tabular-nums text-slate-800 dark:text-white",
              valueClassName,
            )}
          >
            {value}
          </p>
          <p className="mt-2 truncate text-xs leading-5 text-slate-400 dark:text-slate-500">{description}</p>
        </div>
      </div>
    </div>
  )
}

function JsonBlock({ value, emptyText }: { value: unknown; emptyText: string }) {
  const text = typeof value === "string" ? value : toPrettyJson(value)
  if (!text) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>
  }
  return (
    <pre className="max-h-64 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs leading-5 text-slate-100 shadow-inner">
      {text}
    </pre>
  )
}

function InfoList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return null
  }
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2 text-sm leading-5 text-foreground dark:border-slate-800 dark:bg-slate-900/60">
          {item}
        </li>
      ))}
    </ul>
  )
}

export function ForensicConfigPage() {
  const t = useTranslations("pages.investigation.artifacts")
  const locale = useLocale()
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get("category") || ALL_VALUE

  const [catalogItems, setCatalogItems] = useState<ForensicArtifactDefinitionItem[]>([])
  const [items, setItems] = useState<ForensicArtifactDefinitionItem[]>([])
  const [selectedKey, setSelectedKey] = useState("")
  const [detail, setDetail] = useState<ForensicArtifactDefinitionItem | null>(null)
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState(initialCategory)
  const [platform, setPlatform] = useState(ALL_VALUE)
  const [enabled, setEnabled] = useState<EnabledFilter>("all")
  const [loadingList, setLoadingList] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)

  const loadCatalog = useCallback(async () => {
    try {
      const data = await listForensicArtifacts()
      setCatalogItems(sortArtifacts(data.items))
    } catch (error) {
      console.warn("load forensic artifact catalog failed", error)
    }
  }, [])

  const loadList = useCallback(async () => {
    setLoadingList(true)
    setListError(null)
    try {
      const hasServerFilters = category !== ALL_VALUE || platform !== ALL_VALUE || enabled !== "all"
      const data = await listForensicArtifacts({
        ...(category !== ALL_VALUE ? { category } : {}),
        ...(platform !== ALL_VALUE ? { platform } : {}),
        ...(enabled !== "all" ? { enabled: enabled === "enabled" } : {}),
      })
      const nextItems = sortArtifacts(data.items)
      setItems(nextItems)
      if (!hasServerFilters) {
        setCatalogItems(nextItems)
      }
      setSelectedKey((current) => {
        if (current && nextItems.some((item) => item.artifact_key === current)) {
          return current
        }
        return nextItems[0]?.artifact_key || ""
      })
      setRefreshedAt(new Date())
    } catch (error) {
      const message = getErrorMessage(error) || t("errors.loadFailedDescription")
      setListError(message)
      toast.error(t("errors.loadFailedTitle"), { description: message })
    } finally {
      setLoadingList(false)
    }
  }, [category, enabled, platform, t])

  useEffect(() => {
    if (initialCategory !== ALL_VALUE) {
      void loadCatalog()
    }
  }, [initialCategory, loadCatalog])

  useEffect(() => {
    setCategory(initialCategory)
  }, [initialCategory])

  useEffect(() => {
    void loadList()
  }, [loadList])

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) {
      return items
    }
    return items.filter((item) => getSearchText(item, locale).includes(keyword))
  }, [items, locale, query])

  useEffect(() => {
    if (filteredItems.length === 0) {
      setSelectedKey("")
      return
    }
    if (!selectedKey || !filteredItems.some((item) => item.artifact_key === selectedKey)) {
      setSelectedKey(filteredItems[0].artifact_key)
    }
  }, [filteredItems, selectedKey])

  useEffect(() => {
    if (!selectedKey) {
      setDetail(null)
      setDetailError(null)
      return
    }

    let active = true
    setLoadingDetail(true)
    setDetailError(null)
    void getForensicArtifactDefinition(selectedKey)
      .then((artifact) => {
        if (active) {
          setDetail(artifact)
        }
      })
      .catch((error) => {
        if (!active) {
          return
        }
        const message = getErrorMessage(error) || t("errors.detailLoadFailedDescription")
        setDetail(null)
        setDetailError(message)
        toast.error(t("errors.detailLoadFailedTitle"), { description: message })
      })
      .finally(() => {
        if (active) {
          setLoadingDetail(false)
        }
      })

    return () => {
      active = false
    }
  }, [selectedKey, t])

  const statsSource = catalogItems.length > 0 ? catalogItems : items
  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of statsSource) {
      if (!item.category) {
        continue
      }
      counts.set(item.category, (counts.get(item.category) || 0) + 1)
    }
    return [...counts.entries()]
  }, [statsSource])

  const platforms = useMemo(() => {
    const values = new Map<string, string>()
    for (const value of DEFAULT_PLATFORM_VALUES) {
      values.set(value, value)
    }
    for (const item of statsSource) {
      if (item.platform) {
        values.set(item.platform.toLowerCase(), item.platform)
      }
    }
    return [...values.values()]
  }, [statsSource])

  const summary = useMemo(() => {
    const enabledItems = statsSource.filter((item) => item.enabled)
    const highRiskItems = statsSource.filter((item) => item.risk_level === "high")
    return {
      total: statsSource.length,
      enabled: enabledItems.length,
      categories: categories.length,
      highRisk: highRiskItems.length,
    }
  }, [categories.length, statsSource])

  const currentPlatformLabel = useMemo(() => {
    if (platform !== ALL_VALUE) {
      return formatPlatformLabel(platform)
    }
    if (platforms.length === 1) {
      return formatPlatformLabel(platforms[0])
    }
    const windowsPlatform = platforms.find((value) => value.toLowerCase() === "windows")
    return windowsPlatform ? formatPlatformLabel(windowsPlatform) : t("filters.allPlatforms")
  }, [platform, platforms, t])

  const createTaskHref = useMemo(() => {
    const params = new URLSearchParams({ action: "create" })
    if (selectedKey) {
      params.set("artifact_key", selectedKey)
    }
    return `/frame/investigation/tasks?${params.toString()}`
  }, [selectedKey])

  const selectedDisplay = getArtifactDisplay(detail, locale)
  const selectedItem = detail || filteredItems.find((item) => item.artifact_key === selectedKey) || null
  const selectedListDisplay = getArtifactDisplay(selectedItem, locale)

  const parameterDocs = safeParseJson<ArtifactDocItem[]>(
    detail?.parameter_docs_json,
    [],
    `${detail?.artifact_key || "artifact"}.parameter_docs_json`,
  )
  const outputDocs = safeParseJson<ArtifactDocItem[]>(
    detail?.output_docs_json,
    [],
    `${detail?.artifact_key || "artifact"}.output_docs_json`,
  )
  const examples = safeParseJson<ArtifactExample[]>(
    detail?.examples_json,
    [],
    `${detail?.artifact_key || "artifact"}.examples_json`,
  )
  const inputSchema = safeParseJson<Record<string, unknown>>(
    detail?.input_schema_json,
    {},
    `${detail?.artifact_key || "artifact"}.input_schema_json`,
  )
  const defaultParams = safeParseJson<Record<string, unknown>>(
    detail?.default_params_json,
    {},
    `${detail?.artifact_key || "artifact"}.default_params_json`,
  )

  const jsonParseFailed =
    Boolean(detail) &&
    (!selectedDisplay.parseOk ||
      !parameterDocs.ok ||
      !outputDocs.ok ||
      !examples.ok ||
      !inputSchema.ok ||
      !defaultParams.ok)

  function categoryLabel(key: string) {
    const labels: Record<string, string> = {
      file: t("categories.file"),
      registry: t("categories.registry"),
      eventlog: t("categories.eventlog"),
      forensic: t("categories.forensic"),
      network: t("categories.network"),
      system: t("categories.system"),
      ntfs: t("categories.ntfs"),
      application: t("categories.application"),
    }
    return labels[key] || key
  }

  function impactLabel(value?: string) {
    if (value === "medium") {
      return t("impact.medium")
    }
    if (value === "high") {
      return t("impact.high")
    }
    return t("impact.low")
  }

  function impactClass(value?: string) {
    if (value === "high") {
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
    }
    if (value === "medium") {
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
    }
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
  }

  return (
    <main className="bg-gray-50">
      <div className="flex min-h-[calc(100vh-3rem)] flex-col gap-6 p-6">
        <header className="w-full rounded-[28px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_12px_34px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 text-teal-600">
                <FileSearch aria-hidden className="h-5 w-5" />
              </div>

              <div className="min-w-0 space-y-1.5">
                <h1 className="line-clamp-2 break-words text-lg font-semibold leading-tight text-slate-950">
                  {t("header.title")}
                </h1>
                <div className="flex flex-wrap items-center gap-2.5 text-sm">
                  <span className="inline-flex h-7 items-center rounded-full border border-teal-500/20 bg-teal-500/10 px-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-teal-600">
                    FORENSIC
                  </span>
                  <span className="min-w-0 truncate text-slate-500">{t("header.subtitle")}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 2xl:ml-auto 2xl:justify-end">
              <div className="flex h-12 w-full min-w-[280px] max-w-full items-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 px-4 shadow-inner shadow-slate-200/20 sm:w-[360px] 2xl:w-[460px]">
                <Search aria-hidden className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type="search"
                  aria-label={t("header.searchPlaceholder")}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("header.searchPlaceholder")}
                  disabled={loadingList}
                  className="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="h-12 w-[176px] rounded-full border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 shadow-inner shadow-slate-200/20">
                  <PlatformOptionLabel
                    value={platform}
                    label={platform === ALL_VALUE ? t("filters.allPlatforms") : formatPlatformLabel(platform)}
                    block
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>
                    <PlatformOptionLabel value={ALL_VALUE} label={t("filters.allPlatforms")} />
                  </SelectItem>
                  {platforms.map((value) => (
                    <SelectItem key={value} value={value}>
                      <PlatformOptionLabel value={value} label={formatPlatformLabel(value)} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="grid h-12 w-[258px] grid-cols-3 rounded-full border border-slate-200 bg-slate-50 p-1 shadow-inner shadow-slate-200/20">
                {([
                  ["all", t("filters.allStatus")],
                  ["enabled", t("status.enabled")],
                  ["disabled", t("status.disabled")],
                ] as [EnabledFilter, string][]).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setEnabled(value)}
                    disabled={loadingList}
                    className={cn(
                      "rounded-full px-2 text-xs transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60",
                      enabled === value
                        ? "bg-white font-medium text-teal-700 shadow-sm"
                        : "text-slate-500 hover:bg-white/70 hover:text-slate-700",
                    )}
                  >
                    <span className="block truncate">{label}</span>
                  </button>
                ))}
              </div>

              <span className="hidden h-6 w-px bg-slate-200 2xl:block" aria-hidden="true" />

              <div className="hidden items-center gap-3 2xl:flex">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400">
                  <Clock3 aria-hidden className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-slate-400">{t("header.updatedAt")}</div>
                  <div className="whitespace-nowrap text-sm font-medium tabular-nums text-slate-700">
                    {formatRefreshTime(refreshedAt)}
                  </div>
                </div>
              </div>

              <span className="hidden h-6 w-px bg-slate-200 2xl:block" aria-hidden="true" />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  void loadCatalog()
                  void loadList()
                }}
                disabled={loadingList}
                aria-label={t("header.refresh")}
                className="h-10 w-10 shrink-0 rounded-full border-0 text-slate-400 shadow-none hover:bg-slate-100 hover:text-slate-600"
              >
                <RefreshCw className={cn("h-4 w-4", loadingList && "animate-spin")} />
                <span className="sr-only">{t("header.refresh")}</span>
              </Button>

              <Button
                asChild
                className="h-10 shrink-0 rounded-full bg-teal-600 px-4 text-white shadow-sm hover:bg-teal-700"
              >
                <Link href={createTaskHref}>
                  <Plus className="h-4 w-4" aria-hidden />
                  <span>{t("header.createTask")}</span>
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={ClipboardCheck}
            label={t("summary.enabled")}
            value={summary.enabled}
            description={t("summary.enabledHint")}
            tone="bg-gradient-to-br from-sky-500 to-cyan-600 shadow-sky-200/70"
            glow="bg-blue-500"
          />
          <MetricCard
            icon={Layers3}
            label={t("summary.categories")}
            value={summary.categories}
            description={t("summary.categoriesHint")}
            tone="bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200/70"
            glow="bg-emerald-500"
          />
          <MetricCard
            icon={TriangleAlert}
            label={t("summary.highRisk")}
            value={summary.highRisk}
            description={t("summary.highRiskHint")}
            tone="bg-gradient-to-br from-orange-500 to-amber-500 shadow-orange-200/70"
            glow="bg-orange-500"
            valueClassName={summary.highRisk === 0 ? "text-emerald-500" : undefined}
          />
          <MetricCard
            icon={Monitor}
            label={t("summary.platform")}
            value={currentPlatformLabel}
            description={t("summary.platformHint")}
            tone="bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-200/70"
            glow="bg-purple-500"
            valueClassName="text-2xl"
          />
        </div>

        <section className="mt-6 grid gap-5 xl:grid-cols-[312px_minmax(380px,1fr)_minmax(340px,0.68fr)]">
          <aside className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ListFilter className="size-4 text-blue-600" />
                <h2 className="text-base font-semibold text-slate-950 dark:text-white">{t("filters.title")}</h2>
              </div>
              <span className="font-mono text-xs text-slate-500">{summary.total}</span>
            </div>

            <div className="space-y-2 p-4">
              <button
                type="button"
                onClick={() => setCategory(ALL_VALUE)}
                className={cn(
                  "flex h-10 w-full items-center justify-between rounded-lg border px-3 text-left text-sm transition-all duration-200",
                  category === ALL_VALUE
                    ? "border-blue-300 bg-blue-50 text-blue-800 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200"
                    : "border-transparent bg-slate-100/70 text-slate-600 hover:bg-slate-50 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-900",
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white">
                    <Boxes className="size-3.5" aria-hidden />
                  </span>
                  <span className="truncate">{t("filters.allArtifacts")}</span>
                </span>
                <span className="font-mono text-xs">{statsSource.length}</span>
              </button>
              {categories.map(([key, count]) => {
                const visual = getCategoryVisual(key)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    className={cn(
                      "flex h-10 w-full items-center justify-between rounded-lg border px-3 text-left text-sm transition-all duration-200",
                      category === key
                        ? cn("shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white", visual.activeClass)
                        : "border-transparent bg-slate-100/70 text-slate-600 hover:bg-slate-50 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-900",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className={cn("size-5 shrink-0 rounded-md", visual.dotClass)} />
                      <span className="truncate">{categoryLabel(key)}</span>
                    </span>
                    <span className="font-mono text-xs">{count}</span>
                  </button>
                )
              })}
            </div>

            <div className="border-t border-slate-100 p-4 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-950 dark:text-white">{t("filters.impactLegend")}</p>
              <div className="mt-3 flex flex-nowrap items-center gap-5 text-xs text-slate-500 dark:text-slate-400">
                {(["low", "medium", "high"] as const).map((value) => (
                  <span key={value} className="flex shrink-0 items-center gap-2 whitespace-nowrap">
                    <span
                      className={cn(
                        "size-3 rounded-full",
                        value === "high" && "bg-red-500",
                        value === "medium" && "bg-amber-500",
                        value === "low" && "bg-emerald-500",
                      )}
                    />
                    {impactLabel(value)}
                  </span>
                ))}
              </div>
            </div>
          </aside>

          <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-950">
            <div className="flex min-h-[64px] items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 dark:border-slate-800">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-slate-950 dark:text-white">{t("list.title")}</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {t("list.count", { count: filteredItems.length })}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="outline" className="rounded-full bg-slate-50 px-3 text-xs font-normal text-slate-600 dark:bg-slate-900">
                  {currentPlatformLabel}
                </Badge>
                {loadingList && <Loader2 className="size-4 animate-spin text-slate-500" />}
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-330px)] min-h-[520px]">
              <div className="space-y-3 p-4">
                {loadingList && items.length === 0 ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                      <Skeleton className="h-4 w-44" />
                      <Skeleton className="mt-3 h-3 w-64" />
                    </div>
                  ))
                ) : listError ? (
                  <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-6 text-center dark:border-slate-800">
                    <TriangleAlert className="size-9 text-red-500" />
                    <p className="mt-3 text-sm font-medium text-slate-950 dark:text-white">{t("errors.loadFailedTitle")}</p>
                    <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">{listError}</p>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-6 text-center dark:border-slate-800">
                    <Database className="size-9 text-slate-400" />
                    <p className="mt-3 text-sm font-medium text-slate-950 dark:text-white">{t("list.emptyTitle")}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("list.emptyDescription")}</p>
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const display = getArtifactDisplay(item, locale)
                    const active = item.artifact_key === selectedKey
                    return (
                      <button
                        key={item.artifact_key}
                        type="button"
                        onClick={() => setSelectedKey(item.artifact_key)}
                        className={cn(
                          "group flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all duration-200",
                          active
                            ? "border-blue-300 bg-blue-50/80 shadow-[0_12px_24px_rgba(37,99,235,0.12)] dark:border-blue-900/60 dark:bg-blue-950/30"
                            : "border-slate-200/80 bg-white shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900",
                        )}
                      >
                        <CategoryIcon category={item.category} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold leading-5 text-slate-950 dark:text-white">{display.name}</p>
                              <p className="mt-0.5 truncate font-mono text-[11px] leading-4 text-slate-500">{item.artifact_key}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <Badge variant="outline" className={cn("rounded-full px-2.5 py-0 text-[11px]", impactClass(item.risk_level))}>
                                {impactLabel(item.risk_level)}
                              </Badge>
                              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                <span className={cn("size-2 rounded-full", item.enabled ? "bg-emerald-500" : "bg-slate-300")} />
                                {item.enabled ? t("status.enabled") : t("status.disabled")}
                              </span>
                            </div>
                          </div>
                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{display.summary || item.description}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge variant="outline" className="rounded-full bg-white px-2.5 text-[11px] font-normal text-slate-600 dark:bg-slate-900">
                              {categoryLabel(item.category)}
                            </Badge>
                            <Badge variant="outline" className="rounded-full bg-white px-2.5 text-[11px] font-normal text-slate-600 dark:bg-slate-900">
                              {formatPlatformLabel(item.platform)}
                            </Badge>
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-950">
            <ScrollArea className="h-[calc(100vh-330px)] min-h-[520px]">
              <div className="space-y-4 p-4">
                {!selectedKey ? (
                  <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 text-center dark:border-slate-800">
                    <FileSearch className="size-10 text-slate-400" />
                    <p className="mt-3 text-sm font-medium text-slate-950 dark:text-white">{t("detail.emptyTitle")}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("detail.emptyDescription")}</p>
                  </div>
                ) : detailError ? (
                  <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-6 text-center dark:border-slate-800">
                    <TriangleAlert className="size-10 text-red-500" />
                    <p className="mt-3 text-sm font-medium text-slate-950 dark:text-white">{t("errors.detailLoadFailedTitle")}</p>
                    <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">{detailError}</p>
                  </div>
                ) : loadingDetail && !detail ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <Skeleton className="h-48 w-full rounded-xl" />
                  </div>
                ) : detail ? (
                  <>
                    <section className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                      <div className="flex items-start gap-4">
                        <CategoryIcon category={detail.category} size="lg" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h2 className="line-clamp-2 text-base font-semibold leading-5 text-slate-950 dark:text-white">{selectedListDisplay.name}</h2>
                              <p className="mt-1 truncate font-mono text-xs text-slate-500">{detail.artifact_key}</p>
                            </div>
                            {loadingDetail ? (
                              <Loader2 className="size-4 shrink-0 animate-spin text-slate-500" />
                            ) : (
                              <Badge variant="outline" className={cn("shrink-0 rounded-full px-3", impactClass(detail.risk_level))}>
                                {impactLabel(detail.risk_level)}
                              </Badge>
                            )}
                          </div>
                          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {selectedDisplay.summary || selectedDisplay.description || t("detail.noContent")}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-white px-3 py-2 dark:bg-slate-950">
                          <p className="text-[11px] text-slate-500">{t("detail.meta.category")}</p>
                          <p className="mt-1 truncate text-sm font-medium text-slate-950 dark:text-white">{categoryLabel(detail.category)}</p>
                        </div>
                        <div className="rounded-lg bg-white px-3 py-2 dark:bg-slate-950">
                          <p className="text-[11px] text-slate-500">{t("detail.meta.platform")}</p>
                          <p className="mt-1 truncate text-sm font-medium text-slate-950 dark:text-white">{formatPlatformLabel(detail.platform)}</p>
                        </div>
                        <div className="rounded-lg bg-white px-3 py-2 dark:bg-slate-950">
                          <p className="text-[11px] text-slate-500">{t("detail.meta.version")}</p>
                          <p className="mt-1 truncate text-sm font-medium text-slate-950 dark:text-white">{detail.version || "-"}</p>
                        </div>
                        <div className="rounded-lg bg-white px-3 py-2 dark:bg-slate-950">
                          <p className="text-[11px] text-slate-500">{t("detail.meta.status")}</p>
                          <p className="mt-1 truncate text-sm font-medium text-slate-950 dark:text-white">{detail.enabled ? t("status.enabled") : t("status.disabled")}</p>
                        </div>
                      </div>
                    </section>

                    {jsonParseFailed && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                        {t("errors.jsonParseFailed")}
                      </div>
                    )}

                    <Tabs defaultValue="params" className="w-full">
                      <TabsList className="grid h-10 w-full grid-cols-4 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
                        <TabsTrigger value="overview" className="rounded-lg text-xs">{t("tabs.overview")}</TabsTrigger>
                        <TabsTrigger value="params" className="rounded-lg text-xs">{t("tabs.params")}</TabsTrigger>
                        <TabsTrigger value="output" className="rounded-lg text-xs">{t("tabs.output")}</TabsTrigger>
                        <TabsTrigger value="examples" className="rounded-lg text-xs">{t("tabs.examples")}</TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="space-y-3 pt-3">
                        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                          <p className="text-sm font-medium text-slate-950 dark:text-white">{selectedDisplay.summary || t("detail.noContent")}</p>
                          {selectedDisplay.description && (
                            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-500 dark:text-slate-400">
                              {selectedDisplay.description}
                            </p>
                          )}
                        </section>
                        <div className="grid gap-3">
                          <section className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                            <h3 className="mb-2 text-xs font-semibold text-slate-500">{t("detail.useCases")}</h3>
                            <InfoList items={selectedDisplay.useCases} />
                          </section>
                          <section className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                            <h3 className="mb-2 text-xs font-semibold text-slate-500">{t("detail.collects")}</h3>
                            <InfoList items={selectedDisplay.collects} />
                          </section>
                          <section className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                            <h3 className="mb-2 text-xs font-semibold text-slate-500">{t("detail.warnings")}</h3>
                            <InfoList items={selectedDisplay.warnings} />
                          </section>
                        </div>
                      </TabsContent>

                      <TabsContent value="params" className="space-y-3 pt-3">
                        {parameterDocs.value.length === 0 ? (
                          <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-800">
                            {t("detail.noContent")}
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {parameterDocs.value.map((item, index) => (
                              <div key={`${item.name || index}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
                                    {localizedText(item.label, locale) || item.name || "-"}
                                  </h3>
                                  {item.name && <Badge variant="outline" className="rounded-full font-mono text-[11px]">{item.name}</Badge>}
                                  {item.type && <Badge variant="secondary" className="rounded-full text-[11px]">{item.type}</Badge>}
                                  {item.required && <Badge className="rounded-full bg-red-600 text-[11px]">{t("detail.required")}</Badge>}
                                </div>
                                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                  {localizedText(item.description, locale) || t("detail.noDescription")}
                                </p>
                                <div className="mt-3 grid gap-3">
                                  {item.default !== undefined && (
                                    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                                      <p className="text-xs text-slate-500">{t("detail.defaultValue")}</p>
                                      <p className="mt-1 overflow-x-auto whitespace-nowrap font-mono text-xs text-slate-800 dark:text-slate-200">{toPrettyJson(item.default)}</p>
                                    </div>
                                  )}
                                  {(item.maps_to || item.transform) && (
                                    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                                      <p className="text-xs text-slate-500">{t("detail.mapping")}</p>
                                      <p className="mt-1 overflow-x-auto whitespace-nowrap font-mono text-xs text-slate-800 dark:text-slate-200">
                                        {[item.maps_to, item.transform].filter(Boolean).join(" / ")}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                {Array.isArray(item.examples) && item.examples.length > 0 && (
                                  <div className="mt-3">
                                    <p className="mb-2 text-xs text-slate-500">{t("detail.examples")}</p>
                                    <div className="space-y-1">
                                      {item.examples.map((example, exampleIndex) => (
                                        <p key={exampleIndex} className="overflow-x-auto whitespace-nowrap rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800 dark:bg-slate-900 dark:text-slate-200">
                                          {String(example)}
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {localizedArray(item.tips, locale).length > 0 && (
                                  <div className="mt-3">
                                    <p className="mb-2 text-xs text-slate-500">{t("detail.tips")}</p>
                                    <InfoList items={localizedArray(item.tips, locale)} />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="grid gap-3">
                          <section className="space-y-2">
                            <h3 className="text-xs font-semibold text-slate-500">{t("detail.inputSchema")}</h3>
                            <JsonBlock value={inputSchema.value} emptyText={t("detail.noContent")} />
                          </section>
                          <section className="space-y-2">
                            <h3 className="text-xs font-semibold text-slate-500">{t("detail.defaultParams")}</h3>
                            <JsonBlock value={defaultParams.value} emptyText={t("detail.noContent")} />
                          </section>
                        </div>
                      </TabsContent>

                      <TabsContent value="output" className="space-y-3 pt-3">
                        {outputDocs.value.length === 0 ? (
                          <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-800">
                            {t("detail.noContent")}
                          </p>
                        ) : (
                          outputDocs.value.map((item, index) => (
                            <div key={`${item.name || index}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
                                  {localizedText(item.label, locale) || item.name || "-"}
                                </h3>
                                {item.name && <Badge variant="outline" className="rounded-full font-mono text-[11px]">{item.name}</Badge>}
                              </div>
                              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                {localizedText(item.description, locale) || t("detail.noDescription")}
                              </p>
                            </div>
                          ))
                        )}
                      </TabsContent>

                      <TabsContent value="examples" className="space-y-3 pt-3">
                        {examples.value.length === 0 ? (
                          <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-800">
                            {t("detail.noContent")}
                          </p>
                        ) : (
                          examples.value.map((item, index) => (
                            <div key={index} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                              <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
                                {localizedText(item.title, locale) || t("detail.exampleTitle", { index: index + 1 })}
                              </h3>
                              {localizedText(item.description, locale) && (
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{localizedText(item.description, locale)}</p>
                              )}
                              <div className="mt-3">
                                <JsonBlock value={item.params ?? {}} emptyText={t("detail.noContent")} />
                              </div>
                            </div>
                          ))
                        )}
                      </TabsContent>

                    </Tabs>
                  </>
                ) : null}
              </div>
            </ScrollArea>
          </section>
        </section>
      </div>
    </main>
  )
}
