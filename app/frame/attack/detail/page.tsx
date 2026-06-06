"use client"

import { useEffect, useMemo, useState } from "react"
import { BarChart3 } from "lucide-react"
import { useTranslations } from "next-intl"

import { fetchAttackDashboardData } from "@/features/attack/dashboard/api"
import OverviewCarousel from "@/features/attack/dashboard/components/overview-carousel"
import StageDetails from "@/features/attack/dashboard/components/stage-details"
import type { AttckData } from "@/features/attack/utils/attck-utils"
import { slugify } from "@/features/attack/utils/stage-color"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

function stageIdentity(stage: { stageKey?: string; stage: string }) {
  return stage.stageKey || slugify(stage.stage)
}

const EMPTY_DATA: AttckData = {
  starttime: "",
  endtime: "",
  range: "fixed",
  "affected-hosts": 0,
  "attck-counts": 0,
  "stage-counts": 0,
  severity: [
    { severity: "高", "affected-hosts": 0 },
    { severity: "中", "affected-hosts": 0 },
    { severity: "低", "affected-hosts": 0 },
  ],
  top10: [],
  stages: [],
}

export default function AttackDetailPage() {
  const t = useTranslations("pages.attack.dashboard")
  const [data, setData] = useState<AttckData | null>(null)
  const stages = data?.stages || []
  const firstStageSlug = stages.length > 0 ? stageIdentity(stages[0]) : null
  const [selectedStageSlug, setSelectedStageSlug] = useState<string | null>(null)

  useEffect(() => {
    void loadDetail()
  }, [])

  useEffect(() => {
    if (!selectedStageSlug && firstStageSlug) {
      setSelectedStageSlug(firstStageSlug)
    }
  }, [firstStageSlug, selectedStageSlug])

  const selectedStage = useMemo(() => {
    if (!selectedStageSlug) return null
    return stages.find((stage) => stageIdentity(stage) === selectedStageSlug) || null
  }, [selectedStageSlug, stages])

  async function loadDetail() {
    try {
      const result = await fetchAttackDashboardData()
      setData(result.data)
    } catch (error) {
      console.error("load attack detail failed", error)
      setData(EMPTY_DATA)
    }
  }

  function onSelectStage(stage: (typeof stages)[number]) {
    const slug = stageIdentity(stage)
    setSelectedStageSlug(slug)
    const el = document.getElementById("stage-details")
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-8 text-sm text-gray-500 shadow-sm">
            {t("loading")}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-purple-50 p-2">
                <BarChart3 className="h-5 w-5 text-purple-300" />
              </div>
              <div>
                <CardTitle className="text-lg font-medium text-gray-900">{t("stageStats")}</CardTitle>
                <CardDescription className="text-sm text-gray-500">
                  {t("stageStatsDescription")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <OverviewCarousel
              stages={stages}
              selectedStageSlug={selectedStageSlug}
              onSelectStage={onSelectStage}
            />

            <div className="mt-6" id="stage-details">
              <StageDetails stage={selectedStage} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
