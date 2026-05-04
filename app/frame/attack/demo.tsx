"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import KibanaDatePicker from "@/shared/components/kibana-date-picker"

interface DateRange {
  startTime: Date
  endTime: Date
}

export default function Demo() {
  const t = useTranslations("pages.attack.demo")
  const [selectedRange, setSelectedRange] = useState<DateRange | null>(null)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <div className="max-w-md space-y-4">
        <KibanaDatePicker onChange={setSelectedRange} />

        {selectedRange && (
          <div className="rounded-lg border bg-background p-4 space-y-2">
            <div className="text-sm font-medium">{t("selectedRange")}</div>
            <div className="text-xs text-muted-foreground">
              {selectedRange.startTime.toLocaleString()} - {selectedRange.endTime.toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
