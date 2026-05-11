"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { CheckCircle2, RefreshCw } from "lucide-react"

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
  const t = useTranslations("pages.baseline.custom")
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
      setTemplatesError(error instanceof Error ? error.message : t("loadTemplatesFailed"))
    } finally {
      setTemplatesLoading(false)
    }
  }, [t])

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
        setItemsError(error instanceof Error ? error.message : t("loadItemsFailed"))
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
  }, [itemsDataMap, selectedTemplate, t])

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
      setSubmitError(t("selectAtLeastOneItem"))
      return
    }
    setCreateOpen(true)
  }, [t, totalSelectedCount])

  const handleSubmit = useCallback(async () => {
    setSubmitError("")
    setCreatedResult(null)

    if (!displayName.trim()) {
      setSubmitError(t("nameRequired"))
      return
    }

    const selectedPayload = collectSelectionPayload(selectedItems)
    if (selectedPayload.length === 0) {
      setSubmitError(t("selectItemsToMerge"))
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
    } catch {
      setSubmitError(t("createFailed"))
    } finally {
      setSubmitting(false)
    }
  }, [description, displayName, selectedItems, t])

  return (
    <div className="h-full overflow-hidden bg-gray-50">
      <div className="flex h-full min-h-0 w-full flex-col gap-6 px-6 py-6">
        {templatesError ? (
          <Card className="border-destructive/20 bg-destructive/5 shadow-none">
            <CardContent className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-destructive">
              <span>{templatesError}</span>
              <Button type="button" variant="outline" size="sm" onClick={loadTemplates} className="h-8 gap-2 border-destructive/30 bg-background px-3 text-destructive">
                <RefreshCw className="h-4 w-4" />
                <span>{t("retry")}</span>
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
                  <div className="text-sm font-medium text-foreground">{t("createdSuccessTitle")}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {t("createdSuccessDescription", {
                      displayName: createdResult.display_name,
                      itemCount: createdResult.item_count,
                      baselineUuid: createdResult.baseline_uuid,
                    })}
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">{t("createdAt", { createdAt: createdResult.created_at })}</div>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid min-h-0 flex-1 items-stretch gap-6 xl:grid-cols-[440px_minmax(0,0.9fr)_352px]">
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
            onCreateBaseline={handleOpenCreate}
            createSelectedCount={totalSelectedCount}
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
