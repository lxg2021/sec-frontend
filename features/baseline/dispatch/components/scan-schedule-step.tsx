"use client"
import type { ReactNode } from "react"
import { ArrowRight, CalendarClock, ChevronLeft } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

interface ScanScheduleStepProps {
  canProceed: boolean
  content?: ReactNode
  creating: boolean
  headerAction?: ReactNode
  onBack: () => void
  onPrimaryAction: () => void
}

export function ScanScheduleStep({
  canProceed,
  content,
  creating,
  headerAction,
  onBack,
  onPrimaryAction,
}: ScanScheduleStepProps) {
  const t = useTranslations("pages.baseline.dispatch")
  return (
    <Card className="border bg-card shadow-sm">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
              <CalendarClock className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">{t("steps.schedule.title")}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {t("steps.schedule.description")}
              </CardDescription>
            </div>
          </div>
          {headerAction ? <div className="shrink-0 self-end sm:self-center">{headerAction}</div> : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        {content}
        <div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
          <Button variant="outline" onClick={onBack} className="h-11 px-5">
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t("steps.baselineSelection.title")}
          </Button>
          <Button
            onClick={onPrimaryAction}
            disabled={!canProceed || creating}
            className="h-11 px-6"
          >
            {creating ? t("schedule.actions.creating") : t("schedule.actions.createTask")}
            {!creating ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
