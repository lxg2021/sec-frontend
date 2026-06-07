"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"

import { fetchAttackDashboardData } from "@/features/attack/dashboard/api"
import OverviewCarousel from "@/features/attack/dashboard/components/overview-carousel"
import type { AttckData } from "@/features/attack/utils/attck-utils"
import { slugify } from "@/features/attack/utils/stage-color"

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
        <OverviewCarousel
          stages={stages}
          selectedStageSlug={selectedStageSlug}
          onSelectStage={onSelectStage}
        />
      </div>
    </div>
  )
}
