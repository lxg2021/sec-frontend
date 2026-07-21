"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { RefreshCw } from "lucide-react"

import { useToast } from "@/shared/hooks/use-toast"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog"

import {
  createCustomBaseline,
  getAllBaselines,
  getAllBaselineTemplates,
  getBaselineTemplateItems,
  type BaselineListItem,
  type BaselineTemplate,
  type BaselineTemplateItemsData,
} from "../api"
import { BaselineItemsPanel } from "./baseline-items-panel"
import { BaselineTemplateSelector } from "./baseline-template-selector"
import { CreateBaselineForm } from "./create-baseline-form"
import { CustomBaselineWorkspaceHeader } from "./custom-baseline-workspace-header"
import { ExistingCustomBaselineList } from "./existing-custom-baseline-list"
import { SelectedItemsSummary } from "./selected-items-summary"

const BASELINE_VERSION_PATTERN = /^\d+\.\d+\.\d+$/

function collectSelectionPayload(selectedItems: Map<string, Set<string>>) {
  return Array.from(selectedItems.entries())
    .filter(([, itemIds]) => itemIds.size > 0)
    .map(([templateUuid, itemIds]) => ({
      template_uuid: templateUuid,
      item_ids: Array.from(itemIds),
    }))
}

function extractTemplateRequestMetadata(template: BaselineTemplate) {
  return {
    product: template.product.trim(),
  }
}

function getTemplateMetadataSignature(template: BaselineTemplate) {
  const metadata = extractTemplateRequestMetadata(template)
  return metadata.product
}

export default function CustomBaselineClient() {
  const t = useTranslations("pages.baseline.custom")
  const { toast } = useToast()
  const [templates, setTemplates] = useState<BaselineTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [templatesError, setTemplatesError] = useState("")
  const [customBaselines, setCustomBaselines] = useState<BaselineListItem[]>([])
  const [customBaselinesLoading, setCustomBaselinesLoading] = useState(true)
  const [customBaselinesError, setCustomBaselinesError] = useState("")
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
  const [selectedStandard, setSelectedStandard] = useState("custom")
  const [selectedProfile, setSelectedProfile] = useState("machine")
  const [osVersion, setOsVersion] = useState("any")
  const [baselineVersion, setBaselineVersion] = useState("")
  const [submitError, setSubmitError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [existingOpen, setExistingOpen] = useState(false)

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

  const loadCustomBaselines = useCallback(async () => {
    setCustomBaselinesLoading(true)
    setCustomBaselinesError("")

    try {
      const baselines = await getAllBaselines()
      setCustomBaselines(
        baselines.filter((baseline) => baseline.baseline_type.trim().toLowerCase() === "custom"),
      )
    } catch (error) {
      setCustomBaselinesError(error instanceof Error ? error.message : t("existingList.loadFailed"))
    } finally {
      setCustomBaselinesLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadTemplates()
  }, [loadTemplates])

  useEffect(() => {
    void loadCustomBaselines()
  }, [loadCustomBaselines])

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const standard = standardFilter === "all" || template.standard.toLowerCase() === standardFilter
      const profile = profileFilter === "all" || template.profile.toLowerCase() === profileFilter
      return standard && profile
    })
  }, [profileFilter, standardFilter, templates])

  const visibleSelectedTemplate = useMemo(
    () => filteredTemplates.find((template) => template.uuid === selectedTemplateUuid) ?? null,
    [filteredTemplates, selectedTemplateUuid],
  )

  const selectedCountMap = useMemo(() => {
    const map = new Map<string, number>()
    selectedItems.forEach((itemIds, templateUuid) => {
      map.set(templateUuid, itemIds.size)
    })
    return map
  }, [selectedItems])

  const currentSelectedItems = visibleSelectedTemplate ? selectedItems.get(visibleSelectedTemplate.uuid) ?? new Set<string>() : new Set<string>()
  const currentTemplateItemsData = visibleSelectedTemplate ? itemsDataMap.get(visibleSelectedTemplate.uuid) ?? null : null

  useEffect(() => {
    let cancelled = false

    const loadItems = async () => {
      if (!visibleSelectedTemplate) return
      if (itemsDataMap.has(visibleSelectedTemplate.uuid)) return

      setItemsLoadingTemplateUuid(visibleSelectedTemplate.uuid)
      setItemsError("")

      try {
        const data = await getBaselineTemplateItems(visibleSelectedTemplate.uuid)
        if (cancelled) return
        if (data) {
          setItemsDataMap((current) => {
            const next = new Map(current)
            next.set(visibleSelectedTemplate.uuid, data)
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
  }, [itemsDataMap, t, visibleSelectedTemplate])

  const totalSelectedCount = useMemo(
    () => Array.from(selectedItems.values()).reduce((sum, itemIds) => sum + itemIds.size, 0),
    [selectedItems],
  )

  const selectedTemplateCount = selectedItems.size
  const selectedRiskCounts = useMemo(() => {
    let high = 0
    let medium = 0
    let low = 0

    selectedItems.forEach((itemIds, templateUuid) => {
      const itemsData = itemsDataMap.get(templateUuid)
      if (!itemsData) return

      itemsData.category_groups.forEach((group) => {
        group.items.forEach((item) => {
          if (!itemIds.has(item.id)) return
          if (item.severity === "High") high += 1
          else if (item.severity === "Medium") medium += 1
          else low += 1
        })
      })
    })

    return { high, medium, low }
  }, [itemsDataMap, selectedItems])
  const templateMap = useMemo(() => new Map(templates.map((template) => [template.uuid, template])), [templates])
  const selectedProfileDefault = useMemo(() => {
    const firstSelectedTemplateUuid = selectedItems.keys().next().value
    if (!firstSelectedTemplateUuid) return "machine"

    const firstSelectedTemplate = templateMap.get(firstSelectedTemplateUuid)
    return firstSelectedTemplate?.profile?.trim() || "machine"
  }, [selectedItems, templateMap])
  const selectedTemplateMetadataState = useMemo(() => {
    const selectedTemplates = Array.from(selectedItems.keys())
      .map((templateUuid) => templateMap.get(templateUuid))
      .filter((template): template is BaselineTemplate => Boolean(template))

    if (selectedTemplates.length === 0) {
      return { metadata: null, errorKey: "" }
    }

    if (selectedTemplates.length !== selectedItems.size) {
      return { metadata: null, errorKey: "templateMetadataUnavailable" }
    }

    const baseTemplate = selectedTemplates[0]
    const metadata = extractTemplateRequestMetadata(baseTemplate)

    if (!metadata.product) {
      return { metadata: null, errorKey: "templateMetadataIncomplete" }
    }

    const metadataSignature = getTemplateMetadataSignature(baseTemplate)
    if (selectedTemplates.some((template) => getTemplateMetadataSignature(template) !== metadataSignature)) {
      return { metadata: null, errorKey: "templateMetadataMismatch" }
    }

    return { metadata, errorKey: "" }
  }, [selectedItems, templateMap])
  const metadataErrorMessage = selectedTemplateMetadataState.errorKey ? t(selectedTemplateMetadataState.errorKey) : ""

  const handleSelectionChange = useCallback((templateUuid: string, itemIds: Set<string>) => {
    setSubmitError("")
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
    setSubmitError("")
    setSelectedItems((current) => {
      const next = new Map(current)
      next.delete(templateUuid)
      return next
    })
  }, [])

  const handleRemoveItem = useCallback((templateUuid: string, itemId: string) => {
    setSubmitError("")
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
  }, [])

  const handleReset = useCallback(() => {
    handleClearAll()
    setDisplayName("")
    setDescription("")
    setSelectedStandard("custom")
    setSelectedProfile("machine")
    setOsVersion("any")
    setBaselineVersion("")
    setItemSearchTerm("")
    setStandardFilter("all")
    setProfileFilter("all")
  }, [handleClearAll])

  const handleOpenCreate = useCallback(() => {
    setSubmitError("")
    if (totalSelectedCount === 0) {
      setSubmitError(t("selectAtLeastOneItem"))
      return
    }
    setSelectedStandard("custom")
    setSelectedProfile(selectedProfileDefault)
    setOsVersion("any")
    setBaselineVersion((current) => current || "1.0.0")
    setCreateOpen(true)
  }, [selectedProfileDefault, t, totalSelectedCount])

  const handleSubmit = useCallback(async () => {
    setSubmitError("")

    if (!displayName.trim()) {
      setSubmitError(t("nameRequired"))
      return
    }

    if (!selectedStandard.trim()) {
      setSubmitError(t("standardRequired"))
      return
    }

    if (!selectedProfile.trim()) {
      setSubmitError(t("profileRequired"))
      return
    }

    if (!osVersion.trim()) {
      setSubmitError(t("osVersionRequired"))
      return
    }

    if (!baselineVersion.trim()) {
      setSubmitError(t("baselineVersionRequired"))
      return
    }

    if (!BASELINE_VERSION_PATTERN.test(baselineVersion.trim())) {
      setSubmitError(t("baselineVersionInvalid"))
      return
    }

    const selectedPayload = collectSelectionPayload(selectedItems)
    if (selectedPayload.length === 0) {
      setSubmitError(t("selectItemsToMerge"))
      return
    }

    if (!selectedTemplateMetadataState.metadata) {
      setSubmitError(metadataErrorMessage || t("templateMetadataUnavailable"))
      return
    }

    setSubmitting(true)

    try {
      const result = await createCustomBaseline({
        display_name: displayName.trim(),
        description: description.trim(),
        standard: selectedStandard.trim(),
        profile: selectedProfile.trim(),
        product: selectedTemplateMetadataState.metadata.product,
        os_version: osVersion.trim(),
        baseline_version: baselineVersion.trim(),
        selected_items: selectedPayload,
      })
      setCreateOpen(false)
      await loadCustomBaselines()
      toast({
        title: t("createdSuccessTitle"),
        description: t("createdSuccessDescription", {
          displayName: result.display_name,
          itemCount: result.item_count,
          baselineUuid: result.baseline_uuid,
        }),
      })
    } catch (error) {
      const errorMessage = error instanceof Error && error.message ? error.message : t("createFailed")
      setSubmitError(errorMessage)
      toast({
        title: t("createFailed"),
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }, [baselineVersion, description, displayName, loadCustomBaselines, metadataErrorMessage, osVersion, selectedItems, selectedProfile, selectedStandard, selectedTemplateMetadataState.metadata, t, toast])

  return (
    <div className="h-full min-h-0 overflow-hidden bg-slate-100">
      <div className="flex h-full min-h-0 w-full flex-col gap-3 p-4">
        <CustomBaselineWorkspaceHeader
          selectedTemplateCount={selectedTemplateCount}
          selectedItemCount={totalSelectedCount}
          existingBaselineCount={customBaselines.length}
          canCreate={totalSelectedCount > 0 && Boolean(selectedTemplateMetadataState.metadata)}
          onOpenExisting={() => setExistingOpen(true)}
          onCreate={handleOpenCreate}
        />

        {templatesError ? (
          <Card className="shrink-0 border-destructive/20 bg-destructive/5 shadow-sm">
            <CardContent className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-destructive">
              <span>{templatesError}</span>
              <Button type="button" variant="outline" size="sm" onClick={loadTemplates} className="h-8 gap-2 border-destructive/30 bg-background px-3 text-destructive">
                <RefreshCw className="h-4 w-4" />
                <span>{t("retry")}</span>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <main className="grid min-h-0 flex-1 items-stretch gap-3 overflow-y-auto xl:grid-cols-[minmax(280px,0.82fr)_minmax(440px,1.45fr)_minmax(300px,0.88fr)] xl:overflow-hidden">
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
            template={visibleSelectedTemplate}
            itemsData={currentTemplateItemsData}
            loading={visibleSelectedTemplate ? itemsLoadingTemplateUuid === visibleSelectedTemplate.uuid : false}
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
            onCreateBaseline={handleOpenCreate}
            createDisabled={totalSelectedCount === 0 || !selectedTemplateMetadataState.metadata}
            metadataValid={Boolean(selectedTemplateMetadataState.metadata)}
            metadataMessage={metadataErrorMessage}
          />
        </main>
      </div>

      <Dialog open={existingOpen} onOpenChange={setExistingOpen}>
        <DialogContent className="h-[min(76vh,720px)] w-[min(1180px,calc(100vw-32px))] max-w-none gap-0 overflow-hidden border-0 bg-transparent p-0 shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>{t("existingList.title")}</DialogTitle>
            <DialogDescription>{t("existingList.subtitle")}</DialogDescription>
          </DialogHeader>
          <ExistingCustomBaselineList
            baselines={customBaselines}
            loading={customBaselinesLoading}
            errorMessage={customBaselinesError}
            onRefresh={() => void loadCustomBaselines()}
            className="h-full rounded-[24px] shadow-2xl"
          />
        </DialogContent>
      </Dialog>

      <CreateBaselineForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        displayName={displayName}
        description={description}
        standard={selectedStandard}
        profile={selectedProfile}
        osVersion={osVersion}
        baselineVersion={baselineVersion}
        metadata={selectedTemplateMetadataState.metadata}
        selectedTemplateCount={selectedTemplateCount}
        selectedItemCount={totalSelectedCount}
        errorMessage={submitError || metadataErrorMessage}
        submitting={submitting}
        submitDisabled={!selectedTemplateMetadataState.metadata}
        onDisplayNameChange={setDisplayName}
        onDescriptionChange={setDescription}
        onStandardChange={setSelectedStandard}
        onProfileChange={setSelectedProfile}
        onOsVersionChange={setOsVersion}
        onBaselineVersionChange={setBaselineVersion}
        onReset={handleReset}
        onSubmit={() => void handleSubmit()}
      />
    </div>
  )
}
