"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Boxes,
  Braces,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleStop,
  FileSliders,
  LibraryBig,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  SquareTerminal,
  Trash2,
  Unplug,
} from "lucide-react"

import { BaselineScanPolicyDialog } from "@/features/baseline/policy/baseline-scan-policy-dialog"
import {
  BUILTIN_CONTROL_OBJECT_IDS,
  listControlObjectDefinitions,
  type ControlObjectDefinition,
  type ControlObjectOperation,
  type ControlObjectSource,
  type ControlObjectType,
} from "@/features/control-object-library/api"
import { ControlObjectDeleteDialog } from "@/features/control-object-library/control-object-delete-dialog"
import { ControlObjectDetailDialog } from "@/features/control-object-library/control-object-detail-dialog"
import {
  ControlObjectOperationDialog,
  type ControlObjectOperationTarget,
} from "@/features/control-object-library/control-object-operation-dialog"
import {
  CONTROL_OBJECT_TABLE_COLUMNS,
  controlObjectDeleteModeLabel,
} from "@/features/control-object-library/table-presentation"
import { GeneralConfigDialog } from "@/features/general-config/general-config-dialog"
import { ReportConfigDialog } from "@/features/report-config/report-config-dialog"
import { defaultConfigCategory } from "@/features/sensor-config/data/default-config-category"
import { SensorConfigDialog } from "@/features/sensor-config/sensor-config-dialog"
import type { ConfigCategory } from "@/features/sensor-config/types/config-item"
import { PatchScanPolicyDialog } from "@/features/vulnerability/policy/patch-scan-policy-dialog"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { Input } from "@/shared/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { Skeleton } from "@/shared/ui/skeleton"

type TypeFilter = "all" | ControlObjectType
type SourceFilter = "all" | ControlObjectSource
type CapabilityFilter = "all" | "update" | ControlObjectOperation
type EditorKind = "baseline" | "patch" | "general" | "report" | "sensor"

const PAGE_SIZE = 10

const TYPE_PRESENTATION: Record<ControlObjectType, {
  label: string
  icon: typeof Settings2
  iconClassName: string
}> = {
  config: {
    label: "配置",
    icon: FileSliders,
    iconClassName: "text-blue-600",
  },
  policy: {
    label: "策略",
    icon: ShieldCheck,
    iconClassName: "text-violet-600",
  },
  command: {
    label: "命令",
    icon: SquareTerminal,
    iconClassName: "text-amber-600",
  },
}

const EDITOR_BY_OBJECT_ID = new Map<string, EditorKind>([
  [BUILTIN_CONTROL_OBJECT_IDS.baselineScanPolicy, "baseline"],
  [BUILTIN_CONTROL_OBJECT_IDS.patchScanPolicy, "patch"],
  [BUILTIN_CONTROL_OBJECT_IDS.generalConfig, "general"],
  [BUILTIN_CONTROL_OBJECT_IDS.reportConfig, "report"],
  [BUILTIN_CONTROL_OBJECT_IDS.sensorConfig, "sensor"],
])

function editorKind(definition: ControlObjectDefinition) {
  return EDITOR_BY_OBJECT_ID.get(definition.objectId.toLowerCase())
}

function loadErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message.trim() : ""
  if (message === "PMC_OBJECT_DEFINITION_INVALID" || message === "PMC_OBJECT_LIST_INVALID") {
    return "后台返回的控制对象数据不完整，请检查 PMC Catalog 接口。"
  }
  if (message === "PMC_OBJECT_LIST_TRUNCATED") {
    return "控制对象数量超过当前安全分页上限，请缩小后台数据范围后重试。"
  }
  return message || "控制对象加载失败，请稍后重试。"
}

function operationMenuPresentation(
  definition: ControlObjectDefinition,
  operation: ControlObjectOperation,
) {
  if (operation === "apply") {
    return {
      label: definition.objectType === "config" ? "选择下发" : "选择应用",
      icon: Send,
      iconClassName: "text-cyan-600",
    }
  }
  if (operation === "execute") {
    return { label: "选择执行", icon: SquareTerminal, iconClassName: "text-violet-600" }
  }
  if (operation === "stop") {
    return { label: "停止", icon: CircleStop, iconClassName: "text-amber-600" }
  }
  return { label: "移除", icon: Unplug, iconClassName: "text-rose-600" }
}

function sourceLabel(source: ControlObjectSource) {
  const labels: Record<ControlObjectSource, string> = {
    builtin: "系统内置",
    manual: "手动创建",
    remediation: "处置编排",
    mitigation: "直接处置",
    unknown: "未标明",
  }
  return labels[source]
}

function sourceTextClassName(source: ControlObjectSource) {
  const classNames: Record<ControlObjectSource, string> = {
    builtin: "text-emerald-700",
    manual: "text-blue-700",
    remediation: "text-violet-700",
    mitigation: "text-amber-700",
    unknown: "text-slate-600",
  }
  return classNames[source]
}

function stateLabel(state: string) {
  if (state.toLowerCase() === "active") return "可用"
  return state || "—"
}

export function ControlObjectLibraryPage() {
  const [objects, setObjects] = useState<ControlObjectDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [keyword, setKeyword] = useState("")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all")
  const [capabilityFilter, setCapabilityFilter] = useState<CapabilityFilter>("all")
  const [page, setPage] = useState(1)
  const [categories, setCategories] = useState<ConfigCategory[]>(defaultConfigCategory)
  const [activeEditor, setActiveEditor] = useState<EditorKind | null>(null)
  const [detailTarget, setDetailTarget] = useState<ControlObjectDefinition | null>(null)
  const [operationTarget, setOperationTarget] = useState<ControlObjectOperationTarget | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ControlObjectDefinition | null>(null)
  const requestSequence = useRef(0)

  const loadObjects = useCallback(async () => {
    const sequence = ++requestSequence.current
    setLoading(true)
    setLoadError("")

    try {
      const definitions = await listControlObjectDefinitions()
      if (sequence !== requestSequence.current) return
      setObjects(definitions)
    } catch (error) {
      if (sequence !== requestSequence.current) return
      setLoadError(loadErrorMessage(error))
    } finally {
      if (sequence === requestSequence.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadObjects()
    return () => {
      requestSequence.current += 1
    }
  }, [loadObjects])

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = "hidden"
    document.body.style.overflow = "hidden"

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
    }
  }, [])

  const counts = useMemo(() => ({
    all: objects.length,
    config: objects.filter((definition) => definition.objectType === "config").length,
    policy: objects.filter((definition) => definition.objectType === "policy").length,
    command: objects.filter((definition) => definition.objectType === "command").length,
  }), [objects])

  const filteredObjects = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLocaleLowerCase()

    return objects.filter((definition) => {
      const matchesType = typeFilter === "all" || definition.objectType === typeFilter
      const matchesSource = sourceFilter === "all" || definition.source === sourceFilter
      const matchesCapability = capabilityFilter === "all"
        || (capabilityFilter === "update"
          ? definition.capabilities.canUpdate
          : definition.capabilities.allowedOperations.includes(capabilityFilter))
      const matchesKeyword = !normalizedKeyword || [
        definition.displayName,
        definition.internalName,
        definition.objectId,
        definition.version,
      ].join(" ").toLocaleLowerCase().includes(normalizedKeyword)

      return matchesType && matchesSource && matchesCapability && matchesKeyword
    })
  }, [capabilityFilter, keyword, objects, sourceFilter, typeFilter])

  const totalPages = Math.max(1, Math.ceil(filteredObjects.length / PAGE_SIZE))
  const paginatedObjects = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredObjects.slice(start, start + PAGE_SIZE)
  }, [filteredObjects, page])

  useEffect(() => {
    setPage(1)
  }, [capabilityFilter, keyword, sourceFilter, typeFilter])

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages))
  }, [totalPages])

  const resetFilters = () => {
    setKeyword("")
    setSourceFilter("all")
    setCapabilityFilter("all")
  }

  const hasSecondaryFilters = Boolean(keyword.trim())
    || sourceFilter !== "all"
    || capabilityFilter !== "all"

  const handleObjectUpdated = () => {
    void loadObjects()
  }

  return (
    <div className="h-full min-h-0 overflow-hidden bg-slate-100 p-3 max-md:pl-[4.75rem] md:p-4">
        <div className="flex h-full min-h-0 w-full flex-col gap-3">
          <header className="w-full shrink-0 rounded-[24px] border border-slate-200/80 bg-white px-4 py-3 shadow-[0_12px_34px_rgba(15,23,42,0.08)] sm:rounded-[28px] sm:px-5 sm:py-[13px]">
            <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center">
              <div className="flex min-w-0 items-center gap-3 sm:gap-4 xl:w-[430px] xl:flex-none">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-100 text-blue-600 sm:h-12 sm:w-12">
                  <LibraryBig className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 space-y-1">
                  <h1 className="truncate text-lg font-semibold leading-tight text-slate-950">控制对象库</h1>
                  <p className="truncate text-xs text-slate-500 sm:text-sm">
                    统一管理 Agent 内置配置、策略和命令
                  </p>
                </div>
              </div>

              <div className="flex min-w-0 flex-1 items-center gap-2 xl:justify-end">
                <TypeTabs
                  value={typeFilter}
                  counts={counts}
                  disabled={loading && objects.length === 0}
                  onChange={setTypeFilter}
                />
                <div className="ml-auto flex shrink-0 items-center border-l border-slate-200 pl-2 sm:pl-3 xl:ml-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="刷新控制对象"
                    title="刷新控制对象"
                    disabled={loading}
                    onClick={() => void loadObjects()}
                    className="h-10 w-10 rounded-full text-teal-600 hover:bg-teal-50 hover:text-teal-700"
                  >
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <main className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.06)] sm:rounded-[28px]">
            <section aria-label="对象筛选" className="shrink-0 border-b border-slate-200 bg-white px-3 py-3 sm:px-4">
              <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
                <div className="relative min-w-0 flex-1 lg:max-w-xl">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <Input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="搜索对象名称、内部名称或 ID"
                    aria-label="搜索控制对象"
                    className="h-10 rounded-full border-slate-200 bg-slate-50 pl-9 pr-4 focus-visible:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                  <Select value={sourceFilter} onValueChange={(value) => setSourceFilter(value as SourceFilter)}>
                    <SelectTrigger className="h-10 min-w-0 rounded-full border-slate-200 bg-white px-4 sm:w-[132px]" aria-label="按来源筛选">
                      <SelectValue placeholder="全部来源" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部来源</SelectItem>
                      <SelectItem value="builtin">系统内置</SelectItem>
                      <SelectItem value="manual">手动创建</SelectItem>
                      <SelectItem value="unknown">未标明</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={capabilityFilter} onValueChange={(value) => setCapabilityFilter(value as CapabilityFilter)}>
                    <SelectTrigger className="h-10 min-w-0 rounded-full border-slate-200 bg-white px-4 sm:w-[142px]" aria-label="按能力筛选">
                      <SelectValue placeholder="全部能力" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部能力</SelectItem>
                      <SelectItem value="update">可更新</SelectItem>
                      <SelectItem value="apply">可应用</SelectItem>
                      <SelectItem value="execute">可执行</SelectItem>
                      <SelectItem value="stop">可停止</SelectItem>
                      <SelectItem value="remove">可移除</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex min-h-10 items-center justify-between gap-2 lg:justify-end">
                  <span className="whitespace-nowrap text-xs text-slate-500">
                    {loading ? "正在同步…" : `${filteredObjects.length} 个对象`}
                  </span>
                  {hasSecondaryFilters && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetFilters}
                      className="h-9 rounded-full px-3 text-slate-600 hover:bg-slate-100"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      重置
                    </Button>
                  )}
                </div>
              </div>
            </section>

            {loadError && (
              <div className="mx-3 mt-3 flex shrink-0 items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:mx-4" role="alert">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">控制对象加载失败</p>
                  <p className="mt-0.5 break-words text-xs leading-5 text-rose-700">{loadError}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void loadObjects()}
                  className="h-8 shrink-0 rounded-full border-rose-200 bg-white px-3 text-rose-700 hover:bg-rose-100"
                >
                  重试
                </Button>
              </div>
            )}

            <section aria-label="控制对象列表" className="min-h-0 flex-1 overflow-hidden">
              {loading && objects.length === 0 ? (
                <ObjectListSkeleton />
              ) : filteredObjects.length === 0 ? (
                <EmptyState filtered={objects.length > 0} onReset={resetFilters} />
              ) : (
                <>
                  <div className="hidden h-full min-h-0 overflow-auto lg:block">
                    <table className="w-full min-w-[1060px] table-fixed border-collapse text-sm">
                      <thead className="sticky top-0 z-10 bg-slate-50/95 text-xs text-slate-500 backdrop-blur">
                        <tr className="border-b border-slate-200">
                          {CONTROL_OBJECT_TABLE_COLUMNS.map((column) => (
                            <th
                              key={column.key}
                              scope="col"
                              className={cn(
                                column.widthClassName,
                                "px-3 py-3 font-medium",
                                column.align === "center" && "text-center",
                                column.align === "left" && "text-left",
                                column.align === "right" && "text-right",
                                column.key === "actions" && "sticky right-0 z-20 bg-slate-50 px-4 shadow-[-10px_0_16px_-16px_rgba(15,23,42,0.6)]",
                              )}
                            >
                              {column.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedObjects.map((definition) => (
                          <ObjectTableRow
                            key={`${definition.objectTypeValue}:${definition.objectId}`}
                            definition={definition}
                            onEdit={(kind) => setActiveEditor(kind)}
                            onViewJson={setDetailTarget}
                            onOperate={(operation) => setOperationTarget({ definition, operation })}
                            onDelete={() => setDeleteTarget(definition)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="h-full min-h-0 overflow-y-auto bg-slate-50/60 p-3 lg:hidden">
                    <div className="space-y-3">
                      {paginatedObjects.map((definition) => (
                        <ObjectMobileCard
                          key={`${definition.objectTypeValue}:${definition.objectId}`}
                          definition={definition}
                          onEdit={(kind) => setActiveEditor(kind)}
                          onViewJson={setDetailTarget}
                          onOperate={(operation) => setOperationTarget({ definition, operation })}
                          onDelete={() => setDeleteTarget(definition)}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </section>

            {!loading && filteredObjects.length > 0 && (
              <PaginationFooter
                page={page}
                totalPages={totalPages}
                total={filteredObjects.length}
                onPageChange={setPage}
              />
            )}
          </main>
        </div>

        <SensorConfigDialog
          open={activeEditor === "sensor"}
          onOpenChange={(open) => setActiveEditor(open ? "sensor" : null)}
          categories={categories}
          onConfigChange={setCategories}
          onConfigSaved={handleObjectUpdated}
        />
        <PatchScanPolicyDialog
          open={activeEditor === "patch"}
          onOpenChange={(open) => setActiveEditor(open ? "patch" : null)}
          onCreated={handleObjectUpdated}
        />
        <BaselineScanPolicyDialog
          open={activeEditor === "baseline"}
          onOpenChange={(open) => setActiveEditor(open ? "baseline" : null)}
          onPolicyCreated={handleObjectUpdated}
        />
        <GeneralConfigDialog
          open={activeEditor === "general"}
          onOpenChange={(open) => setActiveEditor(open ? "general" : null)}
          onUpdated={handleObjectUpdated}
        />
        <ReportConfigDialog
          open={activeEditor === "report"}
          onOpenChange={(open) => setActiveEditor(open ? "report" : null)}
          onUpdated={handleObjectUpdated}
        />
        <ControlObjectDetailDialog
          open={Boolean(detailTarget)}
          definition={detailTarget}
          onOpenChange={(open) => {
            if (!open) setDetailTarget(null)
          }}
        />
        <ControlObjectOperationDialog
          target={operationTarget}
          onOpenChange={(open) => {
            if (!open) setOperationTarget(null)
          }}
        />
        <ControlObjectDeleteDialog
          definition={deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null)
          }}
          onDeleted={handleObjectUpdated}
        />
    </div>
  )
}

function TypeTabs({
  value,
  counts,
  disabled,
  onChange,
}: {
  value: TypeFilter
  counts: Record<TypeFilter, number>
  disabled: boolean
  onChange: (value: TypeFilter) => void
}) {
  const tabs: Array<{ value: TypeFilter; label: string; icon?: typeof Boxes }> = [
    { value: "all", label: "全部", icon: Boxes },
    { value: "config", label: "配置" },
    { value: "policy", label: "策略" },
    { value: "command", label: "命令" },
  ]

  return (
    <div className="min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="inline-flex min-w-max items-center rounded-full border border-slate-200 bg-slate-50 p-1" role="tablist" aria-label="控制对象类型">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = value === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={disabled}
              onClick={() => onChange(tab.value)}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50 sm:px-3.5",
                active
                  ? "bg-white text-cyan-700 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-500 hover:bg-white/70 hover:text-slate-800",
              )}
            >
              {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
              <span>{tab.label}</span>
              <span className={cn("tabular-nums", active ? "text-cyan-600" : "text-slate-400")}>
                {counts[tab.value]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ObjectTableRow({
  definition,
  onEdit,
  onViewJson,
  onOperate,
  onDelete,
}: {
  definition: ControlObjectDefinition
  onEdit: (kind: EditorKind) => void
  onViewJson: (definition: ControlObjectDefinition) => void
  onOperate: (operation: ControlObjectOperation) => void
  onDelete: () => void
}) {
  const type = TYPE_PRESENTATION[definition.objectType]
  const TypeIcon = type.icon

  return (
    <tr className="group border-b border-slate-100 transition-colors last:border-b-0 hover:bg-cyan-50/30">
      <td className="px-3 py-3 align-middle">
        <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <TypeIcon className={cn("h-4 w-4 shrink-0", type.iconClassName)} aria-hidden="true" />
          <span className="text-xs font-medium text-black">{type.label}</span>
        </div>
      </td>
      <td className="px-3 py-3 align-middle">
        <p className="truncate font-medium text-slate-900" title={definition.displayName}>
          {definition.displayName}
        </p>
      </td>
      <td className="px-3 py-3 align-middle">
        <p className="truncate text-xs text-slate-600" title={definition.internalName}>
          {definition.internalName}
        </p>
      </td>
      <td className="px-3 py-3 align-middle">
        <p className="truncate font-mono text-[11px] text-slate-500" title={definition.objectId}>
          {definition.objectId}
        </p>
      </td>
      <td className="px-3 py-3 text-center align-middle">
        <span className="font-mono text-xs font-medium tabular-nums text-slate-700">
          {definition.subType}
        </span>
      </td>
      <td className="px-3 py-3 align-middle">
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 font-mono text-xs font-medium text-slate-700">
          {definition.version}
        </span>
      </td>
      <td className="px-3 py-3 align-middle">
        <SourceText source={definition.source} />
      </td>
      <td className="px-3 py-3 align-middle">
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
          <span className={cn(
            "h-1.5 w-1.5 rounded-full",
            definition.state.toLowerCase() === "active" ? "bg-emerald-500" : "bg-slate-400",
          )} />
          {stateLabel(definition.state)}
        </span>
      </td>
      <td className="sticky right-0 z-[5] bg-white px-4 py-3 align-middle shadow-[-10px_0_16px_-16px_rgba(15,23,42,0.6)] transition-colors group-hover:bg-cyan-50">
        <ObjectActions
          definition={definition}
          onEdit={onEdit}
          onViewJson={onViewJson}
          onOperate={onOperate}
          onDelete={onDelete}
          align="right"
        />
      </td>
    </tr>
  )
}

function ObjectMobileCard({
  definition,
  onEdit,
  onViewJson,
  onOperate,
  onDelete,
}: {
  definition: ControlObjectDefinition
  onEdit: (kind: EditorKind) => void
  onViewJson: (definition: ControlObjectDefinition) => void
  onOperate: (operation: ControlObjectOperation) => void
  onDelete: () => void
}) {
  const type = TYPE_PRESENTATION[definition.objectType]
  const TypeIcon = type.icon

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-4">
        <div className="flex min-w-0 items-center gap-3">
          <TypeIcon className={cn("h-5 w-5 shrink-0", type.iconClassName)} aria-hidden="true" />
          <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900" title={definition.displayName}>
            {definition.displayName}
          </h2>
          <span className="shrink-0 text-xs font-medium text-black">{type.label}</span>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-4 text-xs">
          <MobileField label="内部名称" value={definition.internalName} className="col-span-2" />
          <MobileField label="ID" value={definition.objectId} mono className="col-span-2" />
          <MobileField label="类型" value={String(definition.subType)} mono />
          <MobileField label="当前版本" value={definition.version} mono />
          <MobileField label="来源" value={sourceLabel(definition.source)} />
          <MobileField label="状态" value={stateLabel(definition.state)} />
        </dl>
      </div>

      <div className="border-t border-slate-100 p-4">
        <ObjectActions
          definition={definition}
          onEdit={onEdit}
          onViewJson={onViewJson}
          onOperate={onOperate}
          onDelete={onDelete}
          align="stretch"
        />
      </div>
    </article>
  )
}

function SourceText({ source }: { source: ControlObjectSource }) {
  return (
    <span className={cn("whitespace-nowrap text-xs font-medium", sourceTextClassName(source))}>
      {sourceLabel(source)}
    </span>
  )
}

function MobileField({
  label,
  value,
  mono,
  className,
}: {
  label: string
  value: string
  mono?: boolean
  className?: string
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-slate-400">{label}</dt>
      <dd className={cn("mt-1 truncate font-medium text-slate-700", mono && "font-mono text-[11px]")} title={value}>
        {value}
      </dd>
    </div>
  )
}

function ObjectActions({
  definition,
  onEdit,
  onViewJson,
  onOperate,
  onDelete,
  align,
}: {
  definition: ControlObjectDefinition
  onEdit: (kind: EditorKind) => void
  onViewJson: (definition: ControlObjectDefinition) => void
  onOperate: (operation: ControlObjectOperation) => void
  onDelete: () => void
  align: "right" | "stretch"
}) {
  const kind = editorKind(definition)
  const canEdit = Boolean(kind && definition.capabilities.canUpdate)
  const editReason = !definition.capabilities.canUpdate
    ? "后台能力合同不允许更新此对象"
    : "该对象尚未提供安全的可视化编辑器"
  const operationOrder: Record<ControlObjectOperation, number> = {
    apply: 0,
    stop: 1,
    remove: 2,
    execute: 3,
  }
  const operations = [...definition.capabilities.allowedOperations]
    .sort((left, right) => operationOrder[left] - operationOrder[right])
  const deleteMode = definition.capabilities.deleteMode
  const deleteAllowedByCapability = deleteMode === "metadata_only" || deleteMode === "remove_effects"
  const canDelete = deleteAllowedByCapability
    && definition.state.toLowerCase() === "active"
    && definition.stateVersion > 0
  const deleteReason = !deleteAllowedByCapability
    ? "后台能力合同禁止删除此对象"
    : definition.state.toLowerCase() !== "active"
      ? "只有 active 状态的对象可以删除"
      : definition.stateVersion <= 0
        ? "后台未返回有效的 state_version，请刷新后重试"
        : undefined

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`打开“${definition.displayName}”操作菜单`}
          className={cn(
            "h-8 rounded-lg border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700",
            align === "right" ? "w-8 p-0" : "w-full gap-2",
          )}
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          {align === "stretch" && <span>操作</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-56 rounded-xl p-1.5">
        <DropdownMenuItem
          onSelect={() => onViewJson(definition)}
          className="cursor-pointer rounded-lg py-2"
        >
          <Braces className="text-violet-600" aria-hidden="true" />
          查看 JSON
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!canEdit}
          title={canEdit ? undefined : editReason}
          onSelect={() => {
            if (kind) onEdit(kind)
          }}
          className="cursor-pointer rounded-lg py-2"
        >
          <Pencil className="text-cyan-600" aria-hidden="true" />
          编辑
          {!canEdit && (
            <span className="ml-auto text-xs text-slate-400">
              {definition.capabilities.canUpdate ? "未支持" : "不可用"}
            </span>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="px-2 py-1 text-xs font-medium text-slate-400">
          Agent 操作
        </DropdownMenuLabel>
        {operations.length > 0 ? operations.map((operation) => {
          const presentation = operationMenuPresentation(definition, operation)
          const OperationIcon = presentation.icon
          return (
            <DropdownMenuItem
              key={operation}
              onSelect={() => onOperate(operation)}
              className="cursor-pointer rounded-lg py-2"
            >
              <OperationIcon className={presentation.iconClassName} aria-hidden="true" />
              {presentation.label}
            </DropdownMenuItem>
          )
        }) : (
          <DropdownMenuItem disabled className="rounded-lg py-2 text-slate-400">
            无可用 Agent 操作
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!canDelete}
          onSelect={onDelete}
          className={cn("rounded-lg py-2", canDelete && "text-rose-600")}
          title={deleteReason}
        >
          <Trash2 aria-hidden="true" />
          {controlObjectDeleteModeLabel(deleteMode)}
          {!canDelete && <span className="ml-auto text-xs text-slate-400">不可用</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ObjectListSkeleton() {
  return (
    <div className="h-full overflow-hidden p-3 sm:p-4" aria-label="正在加载控制对象" aria-busy="true">
      <div className="space-y-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex items-center gap-4 rounded-xl border border-slate-100 px-4 py-3">
            <Skeleton className="h-6 w-20 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-44 max-w-full" />
              <Skeleton className="h-3 w-64 max-w-full" />
            </div>
            <Skeleton className="hidden h-6 w-16 rounded-full sm:block" />
            <Skeleton className="hidden h-6 w-24 rounded-full md:block" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyState({ filtered, onReset }: { filtered: boolean; onReset: () => void }) {
  return (
    <div className="flex h-full min-h-64 items-center justify-center p-6 text-center">
      <div className="max-w-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <LibraryBig className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-sm font-semibold text-slate-900">
          {filtered ? "没有符合条件的控制对象" : "暂无可用控制对象"}
        </h2>
        <p className="mt-1.5 text-xs leading-5 text-slate-500">
          {filtered
            ? "请调整搜索词或筛选条件。"
            : "后台 PMC Catalog 当前没有返回 active 状态的配置、策略或命令。"}
        </p>
        {filtered && (
          <Button type="button" variant="outline" size="sm" onClick={onReset} className="mt-4 rounded-full px-4">
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            清除筛选
          </Button>
        )}
      </div>
    </div>
  )
}

function PaginationFooter({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
}) {
  const start = (page - 1) * PAGE_SIZE + 1
  const end = Math.min(page * PAGE_SIZE, total)

  return (
    <footer className="flex min-h-12 shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-3 py-2 sm:px-4">
      <p className="truncate text-xs text-slate-500">
        显示 {start}–{end}，共 {total} 个
      </p>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="上一页"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-8 w-8 rounded-full border-slate-200"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
        <span className="min-w-16 text-center text-xs tabular-nums text-slate-600">
          {page} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="下一页"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-8 w-8 rounded-full border-slate-200"
        >
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </footer>
  )
}
