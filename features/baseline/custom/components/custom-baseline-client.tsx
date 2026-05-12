"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { CheckCircle2, RefreshCw } from "lucide-react"

import { useToast } from "@/shared/hooks/use-toast"
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
    setCreatedResult(null)
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
    setCreatedResult(null)
    setSelectedItems((current) => {
      const next = new Map(current)
      next.delete(templateUuid)
      return next
    })
  }, [])

  const handleRemoveItem = useCallback((templateUuid: string, itemId: string) => {
    setSubmitError("")
    setCreatedResult(null)
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
    setCreatedResult(null)
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
    setCreatedResult(null)

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
      setCreatedResult(result)
      setCreateOpen(false)
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
  }, [baselineVersion, description, displayName, metadataErrorMessage, osVersion, selectedItems, selectedProfile, selectedStandard, selectedTemplateMetadataState.metadata, t, toast])

  return (
    <div className="relative h-full overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_58%,#eef4ff_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_26%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_22%),radial-gradient(circle_at_bottom,rgba(99,102,241,0.05),transparent_24%)]" />
      <div className="relative flex h-full min-h-0 w-full flex-col gap-6 px-6 py-6">
        {templatesError ? (
          <Card className="border-destructive/20 bg-destructive/5 shadow-sm">
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
          <Card className="border-emerald-200 bg-emerald-50/70 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
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

        <div className="grid min-h-0 flex-1 items-stretch gap-6 xl:grid-cols-[460px_minmax(0,1fr)_minmax(0,0.9fr)]">
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
          />
        </div>
      </div>

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
