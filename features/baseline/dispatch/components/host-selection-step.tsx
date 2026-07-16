"use client"

import { ArrowRight, ChevronLeft, Server } from "lucide-react"
import { useTranslations } from "next-intl"

import HostSelector from "@/shared/components/host-selector"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

interface HostSelectionStepProps {
  canNext: boolean
  data: any[]
  error?: string
  loading?: boolean
  onBack: () => void
  onNext: () => void
  onSelectionChange: (nodes: any[], ids: Set<string>) => void
  selectedHostCount: number
  selectedNodeCount: number
  selectorKey: number
}

export function HostSelectionStep({
  canNext,
  data,
  error,
  loading = false,
  onBack,
  onNext,
  onSelectionChange,
  selectedHostCount,
  selectedNodeCount,
  selectorKey,
}: HostSelectionStepProps) {
  const t = useTranslations("pages.baseline.dispatch")
  return (
    <Card className="flex h-full min-h-0 flex-col border bg-card shadow-sm">
      <CardHeader className="shrink-0 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <Server className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">{t("steps.hostSelection.title")}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {t("hostSelection.description")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-5 p-6">
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>{t("hostSelection.loadFailed")}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <HostSelector
            key={selectorKey}
            data={data}
            loading={loading}
            showHeader={false}
            emptyText={t("hostSelection.empty")}
            text={{
              title: t("hostSelection.selector.title"),
              searchPlaceholder: t("hostSelection.selector.searchPlaceholder"),
              selectAll: t("hostSelection.selector.selectAll"),
              clear: t("hostSelection.selector.clear"),
              searchResults: (term, count) => t("hostSelection.selector.searchResults", { term, count }),
              clearSearch: t("hostSelection.selector.clearSearch"),
              selectedSummary: (total, hostCount, groupCount, deptCount, companyCount) =>
                t("hostSelection.selector.selectedSummary", {
                  total,
                  hostCount,
                  groupCount,
                  deptCount,
                  companyCount,
                }),
            }}
            onSelectionChange={onSelectionChange}
          />
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
          <Button variant="outline" onClick={onBack} className="h-11 px-5">
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t("steps.schedule.title")}
          </Button>
          <Button onClick={onNext} disabled={!canNext} className="h-11 px-6">
            {t("steps.dispatchSubmit.title")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
