"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  Check,
  CheckCircle2,
  CircleAlert,
  FileCog,
  PackageCheck,
  RotateCcw,
  Search,
  Server,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react"

import { configStorage } from "@/features/sensor-config/data/config-storage"
import {
  buildEnabledConfigCategories,
  cloneConfigCategories,
  countConfigItems,
  countEnabledConfigItems,
  createSensorConfigEditorSignature,
  getSensorConfigChanges,
  isSemanticConfigVersion,
} from "@/features/sensor-config/sensor-config-editor"
import type { ConfigCategory } from "@/features/sensor-config/types/config-item"
import { useToast } from "@/shared/hooks/use-toast"
import { cn } from "@/shared/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Progress } from "@/shared/ui/progress"
import { ScrollArea } from "@/shared/ui/scroll-area"
import { Switch } from "@/shared/ui/switch"
import { Tooltip, TooltipContent, TooltipPortal, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip"

const ALL_CATEGORIES = "__all_categories__"
const BASE_VERSION = "1.0.0"
const DEFAULT_NEW_VERSION = "1.1.0"
const DEFAULT_CONFIG_NAME = "传感器默认配置"

interface EditorSnapshot {
  name: string
  version: string
  categories: ConfigCategory[]
}

interface SensorConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: ConfigCategory[]
  onConfigChange: (categories: ConfigCategory[]) => void
  onConfigSaved: () => void
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function snapshotSignature(snapshot: EditorSnapshot) {
  return createSensorConfigEditorSignature(snapshot.name, snapshot.version, snapshot.categories)
}

export function SensorConfigDialog({
  open,
  onOpenChange,
  categories,
  onConfigChange,
  onConfigSaved,
}: SensorConfigDialogProps) {
  const { toast } = useToast()
  const [baselineCategories, setBaselineCategories] = useState(() => cloneConfigCategories(categories))
  const [draftCategories, setDraftCategories] = useState(() => cloneConfigCategories(categories))
  const [name, setName] = useState(DEFAULT_CONFIG_NAME)
  const [version, setVersion] = useState(DEFAULT_NEW_VERSION)
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES)
  const [searchTerm, setSearchTerm] = useState("")
  const [onlyModified, setOnlyModified] = useState(false)
  const [validationError, setValidationError] = useState("")
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false)
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<EditorSnapshot>(() => ({
    name: DEFAULT_CONFIG_NAME,
    version: DEFAULT_NEW_VERSION,
    categories: cloneConfigCategories(categories),
  }))
  const [existingVersions, setExistingVersions] = useState<Array<{ name: string; version: string }>>([])

  useEffect(() => {
    if (!open) return

    const baseline = cloneConfigCategories(categories)
    let storedVersions: Array<{ name: string; version: string }> = []

    try {
      storedVersions = configStorage.getAllConfigs().map(({ name: savedName, version: savedVersion }) => ({
        name: savedName,
        version: savedVersion,
      }))
    } catch {
      storedVersions = []
    }

    const initialSnapshot: EditorSnapshot = {
      name: DEFAULT_CONFIG_NAME,
      version: DEFAULT_NEW_VERSION,
      categories: cloneConfigCategories(baseline),
    }
    const preferredCategory = baseline.some((category) => category.label === "文件组")
      ? "文件组"
      : (baseline[0]?.label ?? ALL_CATEGORIES)

    setBaselineCategories(baseline)
    setDraftCategories(cloneConfigCategories(initialSnapshot.categories))
    setName(initialSnapshot.name)
    setVersion(initialSnapshot.version)
    setSelectedCategory(preferredCategory)
    setSearchTerm("")
    setOnlyModified(false)
    setValidationError("")
    setConfirmCloseOpen(false)
    setLastSavedSnapshot({ ...initialSnapshot, categories: cloneConfigCategories(initialSnapshot.categories) })
    setExistingVersions(storedVersions)
  }, [categories, open])

  const totalItems = useMemo(() => countConfigItems(draftCategories), [draftCategories])
  const enabledItems = useMemo(() => countEnabledConfigItems(draftCategories), [draftCategories])
  const businessChanges = useMemo(
    () => getSensorConfigChanges(baselineCategories, draftCategories),
    [baselineCategories, draftCategories],
  )
  const unsavedItemChanges = useMemo(
    () => getSensorConfigChanges(lastSavedSnapshot.categories, draftCategories),
    [draftCategories, lastSavedSnapshot.categories],
  )
  const modifiedItemIds = useMemo(
    () => new Set(businessChanges.map((change) => `${change.categoryLabel}\u0000${change.itemKey}`)),
    [businessChanges],
  )
  const currentSnapshot = useMemo<EditorSnapshot>(
    () => ({ name, version, categories: draftCategories }),
    [draftCategories, name, version],
  )
  const hasUnsavedChanges = snapshotSignature(currentSnapshot) !== snapshotSignature(lastSavedSnapshot)
  const unsavedMetadataChanges =
    Number(name.trim() !== lastSavedSnapshot.name.trim()) +
    Number(version.trim() !== lastSavedSnapshot.version.trim())
  const unsavedChangeCount = unsavedItemChanges.length + unsavedMetadataChanges
  const normalizedName = name.trim()
  const normalizedVersion = version.trim()
  const versionIsValid = isSemanticConfigVersion(normalizedVersion)
  const isDuplicateVersion = existingVersions.some(
    (config) =>
      config.name.trim().toLocaleLowerCase() === normalizedName.toLocaleLowerCase() &&
      config.version.trim() === normalizedVersion,
  )

  const filteredCategories = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase()
    return draftCategories
      .filter((category) => selectedCategory === ALL_CATEGORIES || category.label === selectedCategory)
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => {
          const matchesSearch =
            normalizedSearch.length === 0 ||
            item.label.toLocaleLowerCase().includes(normalizedSearch) ||
            item.key.toLocaleLowerCase().includes(normalizedSearch) ||
            (item.description ?? "").toLocaleLowerCase().includes(normalizedSearch)
          const matchesModification =
            !onlyModified || modifiedItemIds.has(`${category.label}\u0000${item.key}`)
          return matchesSearch && matchesModification
        }),
      }))
      .filter((category) => category.items.length > 0)
  }, [draftCategories, modifiedItemIds, onlyModified, searchTerm, selectedCategory])

  const visibleItems = filteredCategories.reduce((total, category) => total + category.items.length, 0)
  const enabledChangeCount = businessChanges.filter((change) => change.enabled).length
  const disabledChangeCount = businessChanges.length - enabledChangeCount
  const enabledPercentage = totalItems === 0 ? 0 : Math.round((enabledItems / totalItems) * 100)

  const updateItem = (categoryLabel: string, itemKey: string, enabled: boolean) => {
    setDraftCategories((current) =>
      current.map((category) =>
        category.label === categoryLabel
          ? {
              ...category,
              items: category.items.map((item) => (item.key === itemKey ? { ...item, enabled } : item)),
            }
          : category,
      ),
    )
    setValidationError("")
  }

  const toggleCurrentCategory = () => {
    const targetLabels = new Set(
      selectedCategory === ALL_CATEGORIES
        ? draftCategories.map((category) => category.label)
        : [selectedCategory],
    )
    const targetItems = draftCategories.flatMap((category) =>
      targetLabels.has(category.label) ? category.items : [],
    )
    const shouldEnable = !targetItems.every((item) => item.enabled)

    setDraftCategories((current) =>
      current.map((category) =>
        targetLabels.has(category.label)
          ? { ...category, items: category.items.map((item) => ({ ...item, enabled: shouldEnable })) }
          : category,
      ),
    )
    setValidationError("")
  }

  const validateDraft = () => {
    if (!normalizedName) return "配置名称不能为空"
    if (!normalizedVersion) return "新版本不能为空"
    if (!versionIsValid) return "新版本必须使用 x.y.z 格式，例如 1.1.0"
    if (enabledItems === 0) return "至少需要启用一个配置项"
    return null
  }

  const saveNewVersion = () => {
    const error = validateDraft()
    if (error) {
      setValidationError(error)
      return
    }
    if (isDuplicateVersion) {
      setValidationError("相同名称和版本的配置已存在，请调整新版本号")
      return
    }

    const currentDate = formatLocalDate(new Date())
    try {
      configStorage.saveConfig({
        name: normalizedName,
        version: normalizedVersion,
        date: currentDate,
        categories: buildEnabledConfigCategories(draftCategories),
      })
      onConfigChange(cloneConfigCategories(draftCategories))
      onConfigSaved()
      setValidationError("")
      setExistingVersions((current) => [...current, { name: normalizedName, version: normalizedVersion }])
      toast({
        duration: 3000,
        title: "新版本已创建",
        description: `${normalizedName} ${normalizedVersion} 已生成；Agent 内置 ${BASE_VERSION} 版本未被覆盖。`,
      })
      onOpenChange(false)
    } catch {
      setValidationError("创建新版本失败，请重试")
    }
  }

  const requestClose = () => {
    if (hasUnsavedChanges) {
      setConfirmCloseOpen(true)
      return
    }
    onOpenChange(false)
  }

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (nextOpen) onOpenChange(true)
    else requestClose()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent
          overlayClassName="bg-slate-950/55 backdrop-blur-[1px]"
          className={cn(
            "h-[min(94dvh,940px)] w-[calc(100vw-1rem)] max-w-[1320px] gap-0 overflow-y-auto overflow-x-hidden p-0 sm:rounded-2xl lg:overflow-hidden",
            "[&>button]:hidden",
          )}
        >
          <div className="flex min-h-full flex-col bg-slate-50 lg:h-full lg:min-h-0">
            <DialogHeader className="sticky top-0 z-20 shrink-0 space-y-2 border-b border-slate-200 bg-white px-5 py-4 sm:px-7 sm:py-5 lg:static">
              <div className="flex w-full flex-wrap items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                  <Settings2 className="h-4 w-4" />
                </div>
                <DialogTitle className="text-lg text-slate-950 sm:text-xl">编辑传感器配置</DialogTitle>
                <Badge className="px-2 py-0 text-[11px] border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-50">创建新版本</Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="ml-auto h-8 w-8 shrink-0 rounded-full text-slate-500 hover:text-slate-900"
                  onClick={requestClose}
                  aria-label="关闭"
                  title="关闭"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <DialogDescription className="sr-only">编辑传感器配置并创建新版本。</DialogDescription>
            </DialogHeader>

            <section className="shrink-0 border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-[minmax(220px,1.35fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)_minmax(220px,1fr)]">
                <div className="col-span-2 space-y-1.5 md:col-span-1">
                  <Label htmlFor="sensor-config-name" className="text-xs font-medium text-slate-600">配置名称 <span className="text-rose-500">*</span></Label>
                  <Input
                    id="sensor-config-name"
                    value={name}
                    onChange={(event) => { setName(event.target.value); setValidationError("") }}
                    className="h-10 bg-white"
                    placeholder="输入配置名称"
                  />
                </div>
                <InfoField label="来源"><Server className="h-4 w-4 text-cyan-600" />系统内置</InfoField>
                <InfoField label="基础版本"><span className="font-mono">{BASE_VERSION}</span></InfoField>
                <div className="col-span-2 space-y-1.5 md:col-span-1">
                  <Label htmlFor="sensor-config-version" className="text-xs font-medium text-slate-600">新版本 <span className="text-rose-500">*</span></Label>
                  <div className="relative">
                    <Input
                      id="sensor-config-version"
                      value={version}
                      onChange={(event) => { setVersion(event.target.value); setValidationError("") }}
                      className={cn(
                        "h-10 bg-white pr-10 font-mono",
                        normalizedVersion && (!versionIsValid || isDuplicateVersion) && "border-rose-300 focus-visible:ring-rose-200",
                      )}
                      placeholder="例如 1.1.0"
                      aria-describedby="sensor-config-version-status"
                    />
                    {normalizedVersion && versionIsValid && !isDuplicateVersion && (
                      <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
                    )}
                  </div>
                  <p id="sensor-config-version-status" className={cn("text-xs", normalizedVersion && (!versionIsValid || isDuplicateVersion) ? "text-rose-600" : "text-emerald-700")}>
                    {!normalizedVersion ? "请输入 x.y.z 格式版本号" : !versionIsValid ? "版本格式应为 x.y.z" : isDuplicateVersion ? "该名称和版本已存在" : "版本号可用"}
                  </p>
                </div>
              </div>
            </section>

            <div className="grid flex-none overflow-visible lg:min-h-0 lg:flex-1 lg:grid-cols-[220px_minmax(0,1fr)_300px] lg:overflow-hidden">
              <aside className="flex flex-col border-b border-slate-200 bg-white lg:min-h-0 lg:border-b-0 lg:border-r">
                <div className="flex items-center justify-between px-4 pb-2 pt-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">配置分类</span>
                  <span className="text-xs text-slate-400">{draftCategories.length} 类</span>
                </div>
                <ScrollArea className="h-[220px] px-2 pb-2 lg:h-auto lg:min-h-0 lg:flex-1">
                  <div className="space-y-1 pr-2">
                    <CategoryButton
                      selected={selectedCategory === ALL_CATEGORIES}
                      onClick={() => setSelectedCategory(ALL_CATEGORIES)}
                      label="全部配置"
                      count={String(totalItems)}
                      icon={<SlidersHorizontal className="h-4 w-4 shrink-0" />}
                    />
                    {draftCategories.map((category) => (
                      <CategoryButton
                        key={category.label}
                        selected={selectedCategory === category.label}
                        onClick={() => setSelectedCategory(category.label)}
                        label={category.label}
                        count={`${category.items.filter((item) => item.enabled).length}/${category.items.length}`}
                      />
                    ))}
                  </div>
                </ScrollArea>
                <div className="grid shrink-0 gap-2 border-t border-slate-100 p-3">
                  <Button variant="outline" size="sm" className="h-9 justify-start rounded-full px-4" onClick={toggleCurrentCategory}>
                    <Check className="mr-2 h-4 w-4" />
                    {selectedCategory === ALL_CATEGORIES ? "切换全部配置项" : "启用/关闭当前分类"}
                  </Button>
                  <Button variant="outline" size="sm" className="h-9 justify-start rounded-full border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50 hover:text-slate-900" onClick={() => { setDraftCategories(cloneConfigCategories(baselineCategories)); setValidationError("") }}>
                    <RotateCcw className="mr-2 h-4 w-4 text-slate-600" />恢复为内置默认值
                  </Button>
                </div>
              </aside>

              <main className="flex min-h-[420px] min-w-0 flex-col bg-slate-50 lg:min-h-0">
                <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative min-w-0 flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="搜索配置名称、说明或事件 key" className="h-10 bg-white pl-9" />
                    </div>
                    <label className="flex min-h-10 shrink-0 cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
                      <span>仅显示已修改</span>
                      <Switch checked={onlyModified} onCheckedChange={setOnlyModified} aria-label="仅显示已修改配置" />
                    </label>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                    <span>{selectedCategory === ALL_CATEGORIES ? "全部配置" : selectedCategory}</span>
                    <span>显示 {visibleItems} 项</span>
                  </div>
                </div>

                <ScrollArea className="min-h-0 flex-1">
                  <TooltipProvider delayDuration={250} skipDelayDuration={100}>
                    <div className="space-y-4 p-4 pr-5 sm:p-5 sm:pr-6">
                    {filteredCategories.length === 0 ? (
                      <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center">
                        <Search className="mb-3 h-7 w-7 text-slate-300" />
                        <p className="font-medium text-slate-700">没有匹配的配置项</p>
                        <p className="mt-1 text-sm text-slate-500">请调整搜索词、分类或已修改筛选条件。</p>
                      </div>
                    ) : filteredCategories.map((category) => (
                      <section key={category.label} aria-labelledby={`category-${category.label}`}>
                        <div className="mb-2 flex items-center justify-between">
                          <h3 id={`category-${category.label}`} className="text-sm font-semibold text-slate-800">{category.label}</h3>
                          <span className="text-xs text-slate-500">{category.items.length} 项</span>
                        </div>
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                          {category.items.map((item, itemIndex) => {
                            const isModified = modifiedItemIds.has(`${category.label}\u0000${item.key}`)
                            return (
                              <div key={item.key} className={cn("flex gap-4 px-4 py-3.5 transition-colors hover:bg-slate-50 sm:px-5", itemIndex > 0 && "border-t border-slate-100")}>
                                <Switch checked={item.enabled} onCheckedChange={(enabled) => updateItem(category.label, item.key, enabled)} aria-label={`${item.label}：${item.enabled ? "已启用" : "已关闭"}`} className="mt-0.5 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span
                                          tabIndex={0}
                                          className="cursor-help text-sm font-medium text-slate-900 outline-none decoration-slate-400 underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-cyan-500"
                                        >
                                          {item.label}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipPortal>
                                        <TooltipContent
                                          side="top"
                                          align="start"
                                          sideOffset={8}
                                          className="z-[80] max-w-sm px-3 py-2 text-sm leading-6"
                                        >
                                          {item.description || "暂无说明"}
                                        </TooltipContent>
                                      </TooltipPortal>
                                    </Tooltip>
                                    {isModified && <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">已修改</Badge>}
                                  </div>
                                </div>
                                <span className={cn("shrink-0 pt-0.5 text-xs font-medium", item.enabled ? "text-emerald-700" : "text-slate-400")}>
                                  {item.enabled ? "已启用" : "已关闭"}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </section>
                    ))}
                    </div>
                  </TooltipProvider>
                </ScrollArea>
              </main>

              <aside className="border-t border-slate-200 bg-white lg:min-h-0 lg:border-l lg:border-t-0">
                <ScrollArea className="h-full max-h-[520px] lg:max-h-none">
                  <div className="space-y-5 p-5 pr-6">
                    <section>
                      <div className="mb-3 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-700" /><h3 className="text-sm font-semibold text-slate-900">配置摘要</h3></div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-end justify-between">
                          <div><span className="text-2xl font-semibold text-slate-950">{enabledItems}</span><span className="ml-1 text-sm text-slate-500">/ {totalItems} 已启用</span></div>
                          <span className="text-sm font-medium text-cyan-700">{enabledPercentage}%</span>
                        </div>
                        <Progress value={enabledPercentage} className="mt-3 h-2 bg-slate-200" indicatorClassName="bg-cyan-600" />
                      </div>
                    </section>

                    <section>
                      <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-900">相对内置版本</h3><Badge variant="secondary">{businessChanges.length} 项变化</Badge></div>
                      <div className="grid grid-cols-2 gap-2">
                        <MetricBox label="新启用" value={enabledChangeCount} tone="emerald" />
                        <MetricBox label="已关闭" value={disabledChangeCount} tone="amber" />
                      </div>
                      {businessChanges.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          {businessChanges.slice(0, 6).map((change) => (
                            <div key={`${change.categoryLabel}-${change.itemKey}`} className="flex items-start justify-between gap-3 text-xs">
                              <div className="min-w-0"><p className="truncate font-medium text-slate-700">{change.itemLabel}</p><p className="truncate text-slate-400">{change.categoryLabel}</p></div>
                              <span className={change.enabled ? "text-emerald-700" : "text-amber-700"}>{change.enabled ? "启用" : "关闭"}</span>
                            </div>
                          ))}
                          {businessChanges.length > 6 && <p className="text-xs text-slate-400">另有 {businessChanges.length - 6} 项变化</p>}
                        </div>
                      ) : <p className="mt-3 text-xs leading-5 text-slate-500">配置项与当前基础版本一致。</p>}
                    </section>

                    <ValidationSummary nameValid={Boolean(normalizedName)} versionValid={versionIsValid} duplicate={isDuplicateVersion} enabledItems={enabledItems} />

                    <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-4 text-xs leading-5 text-cyan-900">
                      <div className="mb-1 flex items-center gap-2 font-semibold"><PackageCheck className="h-4 w-4" />版本与下发相互独立</div>
                      创建操作只会生成新的控制对象版本，不会立即下发。后续可从管理中心选择目标主机执行下发。
                    </div>
                  </div>
                </ScrollArea>
              </aside>
            </div>

            <footer className="shrink-0 border-t border-slate-200 bg-white px-5 py-3 sm:px-7 sm:py-4">
              {validationError && (
                <div role="alert" className="mb-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0" /><span>{validationError}</span>
                </div>
              )}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm">
                  {hasUnsavedChanges ? (
                    <><CircleAlert className="h-4 w-4 text-amber-600" /><span className="font-medium text-amber-700">{unsavedChangeCount > 0 ? `${unsavedChangeCount} 项未保存修改` : "存在未保存修改"}</span></>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4 text-emerald-600" /><span className="text-slate-600">当前无未保存修改</span></>
                  )}
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                  <Button variant="ghost" className="h-10 rounded-full px-5" onClick={requestClose}>取消</Button>
                  <Button className="h-10 rounded-full bg-cyan-700 px-5 hover:bg-cyan-800" onClick={saveNewVersion}><FileCog className="mr-2 h-4 w-4" />校验并创建新版本</Button>
                </div>
              </div>
            </footer>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmCloseOpen} onOpenChange={setConfirmCloseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>放弃未保存的修改？</AlertDialogTitle>
            <AlertDialogDescription>当前修改尚未创建为正式配置版本。放弃后，这些修改将不会保留。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>继续编辑</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={() => { setConfirmCloseOpen(false); onOpenChange(false) }}>放弃修改</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function InfoField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700">{children}</div>
    </div>
  )
}

function CategoryButton({ selected, onClick, label, count, icon }: { selected: boolean; onClick: () => void; label: string; count: string; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-10 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-1",
        selected ? "bg-cyan-50 font-medium text-cyan-800" : "text-slate-700 hover:bg-slate-100",
      )}
    >
      <span className="flex min-w-0 items-center gap-2">{icon}<span className="truncate">{label}</span></span>
      <span className="ml-2 shrink-0 text-xs text-slate-500">{count}</span>
    </button>
  )
}

function MetricBox({ label, value, tone }: { label: string; value: number; tone: "emerald" | "amber" }) {
  return (
    <div className={cn("rounded-lg border p-3", tone === "emerald" ? "border-emerald-100 bg-emerald-50" : "border-amber-100 bg-amber-50")}>
      <span className={cn("text-xs", tone === "emerald" ? "text-emerald-700" : "text-amber-700")}>{label}</span>
      <p className={cn("mt-1 text-xl font-semibold", tone === "emerald" ? "text-emerald-800" : "text-amber-800")}>{value}</p>
    </div>
  )
}

function ValidationSummary({ nameValid, versionValid, duplicate, enabledItems }: { nameValid: boolean; versionValid: boolean; duplicate: boolean; enabledItems: number }) {
  const rows = [
    ["配置名称", nameValid ? "已填写" : "待填写", nameValid],
    ["版本格式", versionValid ? "正确" : "需修正", versionValid],
    ["版本唯一性", duplicate ? "已存在" : "可创建", !duplicate],
    ["启用配置项", enabledItems > 0 ? `${enabledItems} 项` : "至少启用一项", enabledItems > 0],
  ] as const
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-slate-900">创建前校验</h3>
      <div className="space-y-2.5 text-sm">
        {rows.map(([label, value, valid]) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <span className="text-slate-600">{label}</span><span className={valid ? "text-emerald-700" : "text-rose-600"}>{value}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
