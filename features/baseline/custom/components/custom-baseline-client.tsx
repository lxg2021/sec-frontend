"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CheckCircle2, Plus, RefreshCw, Shield } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

import {
  createCustomBaseline,
  getAllBaselineTemplates,
  getBaselineTemplateItems,
  type BaselineTemplate,
  type BaselineTemplateItemsData,
  type CreateCustomBaselineResult,
} from "../api"
import { BaselineItemsPanel } from "./baseline-items-panel"
import { BaselineTemplateSelector } from "./baseline-template-selector"
import { CreateBaselineForm } from "./create-baseline-form"
import { SelectedItemsSummary } from "./selected-items-summary"

function collectSelectionPayload(selectedItems: Map<string, Set<string>>) {
  return Array.from(selectedItems.entries())
    .filter(([, itemIds]) => itemIds.size > 0)
    .map(([templateUuid, itemIds]) => ({
      template_uuid: templateUuid,
      item_ids: Array.from(itemIds),
    }))
}

export default function CustomBaselineClient() {
  const [templates, setTemplates] = useState<BaselineTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [templatesError, setTemplatesError] = useState("")
  const [selectedTemplateUuid, setSelectedTemplateUuid] = useState("")
  const [itemsDataMap, setItemsDataMap] = useState<Map<string, BaselineTemplateItemsData>>(new Map())
  const [itemsLoadingTemplateUuid, setItemsLoadingTemplateUuid] = useState("")
  const [itemsError, setItemsError] = useState("")
  const [itemSearchTerm, setItemSearchTerm] = useState("")
  const [standardFilter, setStandardFilter] = useState("all")
  const [profileFilter, setProfileFilter] = useState("all")
  const [selectedItems, setSelectedItems] = useState<Map<string, Set<string>>>(new Map())
  const [displayName, setDisplayName] = useState("")
  const [description, setDescription] = useState("")
  const [submitError, setSubmitError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createdResult, setCreatedResult] = useState<CreateCustomBaselineResult | null>(null)

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true)
    setTemplatesError("")

    try {
      const nextTemplates = await getAllBaselineTemplates()
      setTemplates(nextTemplates)
      setSelectedTemplateUuid((current) => {
        if (current && nextTemplates.some((template) => template.uuid === current)) {
          return current
        }
        return nextTemplates[0]?.uuid ?? ""
      })
    } catch (error) {
      setTemplates([])
      setSelectedTemplateUuid("")
      setTemplatesError(error instanceof Error ? error.message : "基线模板加载失败")
    } finally {
      setTemplatesLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTemplates()
  }, [loadTemplates])

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const standard = standardFilter === "all" || template.standard.toLowerCase() === standardFilter
      const profile = profileFilter === "all" || template.profile.toLowerCase() === profileFilter
      return standard && profile
    })
  }, [profileFilter, standardFilter, templates])

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.uuid === selectedTemplateUuid) ?? null,
    [selectedTemplateUuid, templates],
  )

  const selectedCountMap = useMemo(() => {
    const map = new Map<string, number>()
    selectedItems.forEach((itemIds, templateUuid) => {
      map.set(templateUuid, itemIds.size)
    })
    return map
  }, [selectedItems])

  const currentSelectedItems = selectedTemplate ? selectedItems.get(selectedTemplate.uuid) ?? new Set<string>() : new Set<string>()
  const currentTemplateItemsData = selectedTemplate ? itemsDataMap.get(selectedTemplate.uuid) ?? null : null

  useEffect(() => {
    let cancelled = false

    const loadItems = async () => {
      if (!selectedTemplate) return
      if (itemsDataMap.has(selectedTemplate.uuid)) return

      setItemsLoadingTemplateUuid(selectedTemplate.uuid)
      setItemsError("")

      try {
        const data = await getBaselineTemplateItems(selectedTemplate.uuid)
        if (cancelled) return
        if (data) {
          setItemsDataMap((current) => {
            const next = new Map(current)
            next.set(selectedTemplate.uuid, data)
            return next
          })
        }
      } catch (error) {
        if (cancelled) return
        setItemsError(error instanceof Error ? error.message : "模板项加载失败")
      } finally {
        if (!cancelled) {
          setItemsLoadingTemplateUuid("")
        }
      }
    }

    void loadItems()

    return () => {
      cancelled = true
    }
  }, [itemsDataMap, selectedTemplate])

  const totalSelectedCount = useMemo(
    () => Array.from(selectedItems.values()).reduce((sum, itemIds) => sum + itemIds.size, 0),
    [selectedItems],
  )

  const selectedTemplateCount = selectedItems.size

  const handleSelectionChange = useCallback((templateUuid: string, itemIds: Set<string>) => {
    setSelectedItems((current) => {
      const next = new Map(current)
      if (itemIds.size === 0) {
        next.delete(templateUuid)
      } else {
        next.set(templateUuid, new Set(itemIds))
      }
      return next
    })
  }, [])

  const handleRemoveTemplate = useCallback((templateUuid: string) => {
    setSelectedItems((current) => {
      const next = new Map(current)
      next.delete(templateUuid)
      return next
    })
  }, [])

  const handleRemoveItem = useCallback((templateUuid: string, itemId: string) => {
    setSelectedItems((current) => {
      const next = new Map(current)
      const currentItems = next.get(templateUuid)
      if (!currentItems) return current

      const nextItems = new Set(currentItems)
      nextItems.delete(itemId)

      if (nextItems.size === 0) {
        next.delete(templateUuid)
      } else {
        next.set(templateUuid, nextItems)
      }

      return next
    })
  }, [])

  const handleClearAll = useCallback(() => {
    setSelectedItems(new Map())
    setSubmitError("")
    setItemsError("")
    setCreatedResult(null)
  }, [])

  const handleReset = useCallback(() => {
    handleClearAll()
    setDisplayName("")
    setDescription("")
    setItemSearchTerm("")
    setStandardFilter("all")
    setProfileFilter("all")
  }, [handleClearAll])

  const handleOpenCreate = useCallback(() => {
    setSubmitError("")
    setCreatedResult(null)
    if (totalSelectedCount === 0) {
      setSubmitError("请至少勾选一项检查项")
      return
    }
    setCreateOpen(true)
  }, [totalSelectedCount])

  const handleSubmit = useCallback(async () => {
    setSubmitError("")
    setCreatedResult(null)

    if (!displayName.trim()) {
      setSubmitError("请输入基线名称")
      return
    }

    const selectedPayload = collectSelectionPayload(selectedItems)
    if (selectedPayload.length === 0) {
      setSubmitError("请选择要合并的模板条目")
      return
    }

    setSubmitting(true)

    try {
      const result = await createCustomBaseline({
        display_name: displayName.trim(),
        description: description.trim(),
        selected_items: selectedPayload,
      })
      setCreatedResult(result)
      setCreateOpen(false)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "创建自定义基线失败")
    } finally {
      setSubmitting(false)
    }
  }, [description, displayName, selectedItems])

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="flex h-[72px] items-center justify-between border-b border-zinc-200 bg-white px-8">
        <div className="flex items-center gap-4">
          <Shield className="h-7 w-7 text-zinc-950" />
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">自定义基线</h1>
        </div>

        <Button
          type="button"
          onClick={handleOpenCreate}
          className="h-11 gap-3 rounded-xl bg-zinc-950 px-5 text-base font-semibold text-white hover:bg-zinc-800"
        >
          <Plus className="h-5 w-5" />
          <span>创建基线</span>
          <span className="rounded-md bg-white/20 px-2 py-0.5 text-sm tabular-nums">{totalSelectedCount}</span>
        </Button>
      </div>

      <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-6 px-8 py-8">
        {templatesError ? (
          <Card className="border-destructive/20 bg-destructive/5 shadow-none">
            <CardContent className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-destructive">
              <span>{templatesError}</span>
              <Button type="button" variant="outline" size="sm" onClick={loadTemplates} className="h-8 gap-2 border-destructive/30 bg-background px-3 text-destructive">
                <RefreshCw className="h-4 w-4" />
                <span>重试</span>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {createdResult ? (
          <Card className="border-emerald-200 bg-emerald-50/70 shadow-none dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <CardContent className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                <div>
                  <div className="text-sm font-medium text-foreground">自定义基线创建成功</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {createdResult.display_name} · {createdResult.item_count} 项 · {createdResult.baseline_uuid}
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">创建时间 {createdResult.created_at}</div>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-8 xl:grid-cols-[380px_minmax(0,1fr)_376px]">
          <BaselineTemplateSelector
            templates={filteredTemplates}
            loading={templatesLoading}
            selectedTemplateUuid={selectedTemplateUuid}
            selectedCountMap={selectedCountMap}
            standardFilter={standardFilter}
            profileFilter={profileFilter}
            onStandardFilterChange={setStandardFilter}
            onProfileFilterChange={setProfileFilter}
            onSelectTemplate={(template) => setSelectedTemplateUuid(template.uuid)}
            onRefresh={() => void loadTemplates()}
          />

          <BaselineItemsPanel
            template={selectedTemplate}
            itemsData={currentTemplateItemsData}
            loading={itemsLoadingTemplateUuid === selectedTemplateUuid}
            errorMessage={itemsError}
            searchTerm={itemSearchTerm}
            onSearchTermChange={setItemSearchTerm}
            selectedItems={currentSelectedItems}
            onSelectionChange={handleSelectionChange}
          />

          <SelectedItemsSummary
            templates={templates}
            itemsDataMap={itemsDataMap}
            selectedItems={selectedItems}
            onClearAll={handleClearAll}
            onRemoveTemplate={handleRemoveTemplate}
            onRemoveItem={handleRemoveItem}
          />
        </div>
      </div>

      <CreateBaselineForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        displayName={displayName}
        description={description}
        selectedTemplateCount={selectedTemplateCount}
        selectedItemCount={totalSelectedCount}
        errorMessage={submitError}
        submitting={submitting}
        onDisplayNameChange={setDisplayName}
        onDescriptionChange={setDescription}
        onReset={handleReset}
        onSubmit={() => void handleSubmit()}
      />
    </div>
  )
}
