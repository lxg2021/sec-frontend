"use client"

import { ArrowRight, CalendarClock, ChevronLeft } from "lucide-react"
import { useTranslations } from "next-intl"

import { ScanScheduleForm, type ScanSchedule } from "@/shared/components/scan-schedule"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

interface ScanScheduleStepProps {
  canCreatePolicy: boolean
  creating: boolean
  onBack: () => void
  onCreatePolicy: () => void
  onNameChange: (value: string) => void
  onScheduleChange: (value: ScanSchedule) => void
  onVersionChange: (value: string) => void
  policyName: string
  schedule: ScanSchedule
  version: string
}

export function ScanScheduleStep({
  canCreatePolicy,
  creating,
  onBack,
  onCreatePolicy,
  onNameChange,
  onScheduleChange,
  onVersionChange,
  policyName,
  schedule,
  version,
}: ScanScheduleStepProps) {
  const t = useTranslations("pages.baseline.dispatch")
  return (
    <Card className="border bg-card shadow-sm">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <CalendarClock className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">{t("steps.schedule.title")}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {t("schedule.description")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Label htmlFor="policy-name" className="shrink-0 sm:w-24">
                {t("schedule.fields.taskName")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="policy-name"
                value={policyName}
                onChange={(event) => onNameChange(event.target.value)}
                placeholder={t("schedule.fields.taskNamePlaceholder")}
                className="flex-1"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Label htmlFor="policy-version" className="shrink-0 sm:w-20">
                {t("schedule.fields.version")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="policy-version"
                value={version}
                onChange={(event) => onVersionChange(event.target.value)}
                placeholder={t("schedule.fields.versionPlaceholder")}
                className="flex-1"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <ScanScheduleForm
            value={schedule}
            onChange={onScheduleChange}
            title={null}
            description={null}
            text={{
              modeLabel: t("schedule.form.modeLabel"),
              modePlaceholder: t("schedule.form.modePlaceholder"),
              modeInterval: t("schedule.form.modeInterval"),
              intervalLabel: t("schedule.form.intervalLabel"),
              intervalValue: (hours) => t("schedule.form.intervalValue", { hours }),
              fixedTimeLabel: t("schedule.form.fixedTimeLabel"),
              randomDelayLabel: t("schedule.form.randomDelayLabel"),
              randomDelayValue: (minutes) => t("schedule.form.randomDelayValue", { minutes }),
              retryCountLabel: t("schedule.form.retryCountLabel"),
              retryIntervalLabel: t("schedule.form.retryIntervalLabel"),
              retryNone: t("schedule.form.retryNone"),
              retryTimes: (count) => t("schedule.form.retryTimes", { count }),
              minutesUnit: t("schedule.form.minutesUnit"),
              startupTitle: t("schedule.form.startupTitle"),
              startupDescription: t("schedule.form.startupDescription"),
            }}
            className="max-w-none border-0 shadow-none [&_[class*='text-2xl']]:text-base"
          />
        </section>

        <div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
          <Button variant="outline" onClick={onBack} className="h-11 px-5">
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t("steps.baselineSelection.title")}
          </Button>
          <Button
            onClick={onCreatePolicy}
            disabled={!canCreatePolicy || creating}
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
