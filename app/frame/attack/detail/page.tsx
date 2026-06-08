"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { useToast } from "@/shared/hooks/use-toast"

import {
  buildAttackStageCardsFromInstanceDistribution,
  fetchAttackTimelineCases,
  fetchAttackOverview,
  fetchAttackStageInstanceDistribution,
} from "@/features/attack/dashboard/api"
import { AttackDetailHeader } from "@/features/attack/detail/components/attack-detail-header"
import { AttackCaseList } from "@/features/attack/detail/components/attack-case-list"
import OverviewCarousel from "@/features/attack/dashboard/components/overview-carousel"
import type { AttackCaseTimelineSummary, AttackOverview } from "@/features/attack/dashboard/types"
import type { AttckData } from "@/features/attack/utils/attck-utils"
import { slugify } from "@/features/attack/utils/stage-color"

const DEFAULT_CASE_PAGE_SIZE = 20
const DETAIL_TIMEZONE = "Asia/Shanghai"

function stageIdentity(stage: { stageKey?: string; stage: string }) {
  return stage.stageKey || slugify(stage.stage)
}

function parseOverviewBucketTime(value?: string) {
  if (!value) return null
  const normalized = value.trim().replace(" ", "T")
  if (!normalized) return null
  const hasExplicitTimezone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(normalized)
  const date = new Date(hasExplicitTimezone ? normalized : `${normalized}Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

function toTimezoneTimeText(value?: string, timeZone = DETAIL_TIMEZONE) {
  const date = parseOverviewBucketTime(value)
  if (!date) return ""
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "00"
  return `${part("year")}-${part("month")}-${part("day")} ${part("hour")}:${part("minute")}:${part("second")}`
}

function buildCaseQueryRange(nextOverview: AttackOverview) {
  const startTime = toTimezoneTimeText(nextOverview.bucket.bucket_start)
  const endTime = toTimezoneTimeText(nextOverview.bucket.bucket_end)
  return startTime && endTime
    ? { startTime, endTime, timezone: DETAIL_TIMEZONE }
    : { timezone: DETAIL_TIMEZONE }
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
  const [caseItems, setCaseItems] = useState<AttackCaseTimelineSummary[]>([])
  const [caseNextPageToken, setCaseNextPageToken] = useState("")
  const [caseHasMore, setCaseHasMore] = useState(false)
  const [caseLoadingMore, setCaseLoadingMore] = useState(false)
  const [casePageSize, setCasePageSize] = useState(DEFAULT_CASE_PAGE_SIZE)

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

  async function loadDetail(selectedOverview?: AttackOverview, nextCasePageSize = casePageSize) {
    try {
      const nextOverview = selectedOverview ?? await fetchAttackOverview()
      const [nextStages, nextCases] = await Promise.all([
        nextOverview.bucket.snapshot_id
          ? fetchAttackStageInstanceDistribution(nextOverview.bucket.snapshot_id).then(buildAttackStageCardsFromInstanceDistribution)
          : Promise.resolve(EMPTY_DATA.stages),
        fetchAttackTimelineCases({
          ...buildCaseQueryRange(nextOverview),
          pageSize: nextCasePageSize,
        }),
      ])

      setOverview(nextOverview)
      setData(buildDetailData(nextOverview, nextStages))
      setCaseItems(nextCases.items)
      setCaseNextPageToken(nextCases.page.next_page_token)
      setCaseHasMore(nextCases.page.has_more)
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
      setCaseItems([])
      setCaseNextPageToken("")
      setCaseHasMore(false)
    }
  }

  async function handleSnapshotChange(snapshot: AttackOverview) {
    setChecking(true)
    try {
      await loadDetail(snapshot, casePageSize)
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
      await loadDetail(overview ?? undefined, casePageSize)
    } finally {
      setChecking(false)
    }
  }

  async function handleLoadMoreCases() {
    if (!overview || !caseNextPageToken || caseLoadingMore) return false

    setCaseLoadingMore(true)
    try {
      const nextCases = await fetchAttackTimelineCases({
        ...buildCaseQueryRange(overview),
        pageSize: casePageSize,
        pageToken: caseNextPageToken,
      })
      setCaseItems((current) => [...current, ...nextCases.items])
      setCaseNextPageToken(nextCases.page.next_page_token)
      setCaseHasMore(nextCases.page.has_more)
      return true
    } catch (error) {
      console.error("load more attack cases failed", error)
      toast({
        title: t("cases.loadFailed"),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
      return false
    } finally {
      setCaseLoadingMore(false)
    }
  }

  async function handleCasePageSizeChange(nextPageSize: number) {
    setCasePageSize(nextPageSize)
    if (!overview || caseLoadingMore) return

    setCaseLoadingMore(true)
    try {
      const nextCases = await fetchAttackTimelineCases({
        ...buildCaseQueryRange(overview),
        pageSize: nextPageSize,
      })
      setCaseItems(nextCases.items)
      setCaseNextPageToken(nextCases.page.next_page_token)
      setCaseHasMore(nextCases.page.has_more)
    } catch (error) {
      console.error("reload attack cases failed", error)
      toast({
        title: t("cases.loadFailed"),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setCaseLoadingMore(false)
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
        <AttackCaseList
          items={caseItems}
          hasMore={caseHasMore}
          loadingMore={caseLoadingMore}
          pageSize={casePageSize}
          onLoadMore={handleLoadMoreCases}
          onPageSizeChange={handleCasePageSizeChange}
        />
      </div>
    </div>
  )
}
