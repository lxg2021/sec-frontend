"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { useToast } from "@/shared/hooks/use-toast"

import {
  buildAttackStageCardsFromInstanceDistribution,
  fetchAttackOverview,
  fetchAttackStageInstanceDistribution,
} from "@/features/attack/dashboard/api"
import { AttackDetailHeader } from "@/features/attack/detail/components/attack-detail-header"
import OverviewCarousel from "@/features/attack/dashboard/components/overview-carousel"
import type { AttackOverview } from "@/features/attack/dashboard/types"
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
  const { toast } = useToast()
  const [data, setData] = useState<AttckData | null>(null)
  const [overview, setOverview] = useState<AttackOverview | null>(null)
  const stages = data?.stages || []
  const firstStageSlug = stages.length > 0 ? stageIdentity(stages[0]) : null
  const [selectedStageSlug, setSelectedStageSlug] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    void loadDetail()
  }, [])

  useEffect(() => {
    if (!selectedStageSlug && firstStageSlug) {
      setSelectedStageSlug(firstStageSlug)
    }
  }, [firstStageSlug, selectedStageSlug])

  function buildDetailData(nextOverview: AttackOverview, nextStages = data?.stages ?? EMPTY_DATA.stages): AttckData {
    return {
      ...EMPTY_DATA,
      starttime: nextOverview.bucket.bucket_start,
      endtime: nextOverview.bucket.bucket_end,
      range: nextOverview.bucket.bucket_type,
      "affected-hosts": nextOverview.total_hosts,
      "attck-counts": nextOverview.total_rules,
      "stage-counts": nextStages.length,
      stages: nextStages,
    }
  }

  async function loadDetail(selectedOverview?: AttackOverview) {
    try {
      const nextOverview = selectedOverview ?? await fetchAttackOverview()
      const nextStages = nextOverview.bucket.snapshot_id
        ? buildAttackStageCardsFromInstanceDistribution(
            await fetchAttackStageInstanceDistribution(nextOverview.bucket.snapshot_id),
          )
        : EMPTY_DATA.stages

      setOverview(nextOverview)
      setData(buildDetailData(nextOverview, nextStages))
    } catch (error) {
      console.error("load attack detail failed", error)
      setOverview({
        bucket: {
          bucket_type: "fixed",
          bucket_start: "",
          bucket_end: "",
        },
        scope: "",
        total_rules: 0,
        total_groups: 0,
        total_instances: 0,
        total_sources: 0,
        total_hosts: 0,
        total_cases: 0,
        critical_count: 0,
        high_count: 0,
        medium_count: 0,
        low_count: 0,
      })
      setData(EMPTY_DATA)
    }
  }

  async function handleSnapshotChange(snapshot: AttackOverview) {
    setChecking(true)
    try {
      await loadDetail(snapshot)
    } catch (error) {
      console.error("load selected attack snapshot failed", error)
      toast({
        title: t("header.snapshotLoadFailed"),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setChecking(false)
    }
  }

  async function handleRefresh() {
    setChecking(true)
    try {
      await loadDetail(overview ?? undefined)
    } finally {
      setChecking(false)
    }
  }

  function onSelectStage(stage: (typeof stages)[number]) {
    const slug = stageIdentity(stage)
    setSelectedStageSlug(slug)
  }

  if (!data || !overview) {
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
      <div className="p-6 space-y-6">
        <AttackDetailHeader
          overview={overview}
          checking={checking}
          onRefresh={handleRefresh}
          onSnapshotChange={handleSnapshotChange}
        />
        <OverviewCarousel
          stages={stages}
          selectedStageSlug={selectedStageSlug}
          onSelectStage={onSelectStage}
        />
      </div>
    </div>
  )
}
