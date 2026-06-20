"use client"

import { useEffect, useRef, useState } from "react"
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
import {
  dedupeAttackCaseItems,
  mergeAttackCaseItems,
} from "@/features/attack/detail/utils/attack-case-list-data"
import OverviewCarousel from "@/features/attack/dashboard/components/overview-carousel"
import type { AttackCaseTimelineSummary, AttackOverview } from "@/features/attack/dashboard/types"
import type { AttckData } from "@/features/attack/utils/attck-utils"
import { slugify } from "@/features/attack/utils/stage-color"

const DEFAULT_CASE_PAGE_SIZE = 10
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

function isAttackTimelineAnchorFallbackError(error: unknown) {
  if (!error || typeof error !== "object") return false

  const value = error as {
    status?: unknown
    code?: unknown
    message?: unknown
  }
  const status = Number(value.status)
  const code = Number(value.code)
  const message = String(value.message ?? "").toLowerCase()

  if (status !== 400 && code !== 400) return false
  if (!message.includes("anchor_case_id")) return false

  return message.includes("not found") || message.includes("requested range")
}

function readTargetCaseIdFromLocation() {
  if (typeof window === "undefined") return ""
  const params = new URLSearchParams(window.location.search)
  return (
    params.get("caseId")?.trim() ||
    params.get("case_id")?.trim() ||
    params.get("targetCaseId")?.trim() ||
    ""
  )
}

function readSnapshotIdFromLocation() {
  if (typeof window === "undefined") return ""
  const params = new URLSearchParams(window.location.search)
  return params.get("snapshotId")?.trim() || params.get("snapshot_id")?.trim() || ""
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
  const [casePreviousPageToken, setCasePreviousPageToken] = useState("")
  const [caseHasMore, setCaseHasMore] = useState(false)
  const [caseHasPrevious, setCaseHasPrevious] = useState(false)
  const [caseCurrentPage, setCaseCurrentPage] = useState(1)
  const [caseLoadingMore, setCaseLoadingMore] = useState(false)
  const [caseLoadingPrevious, setCaseLoadingPrevious] = useState(false)
  const [casePageSize, setCasePageSize] = useState(DEFAULT_CASE_PAGE_SIZE)
  const [targetCaseId, setTargetCaseId] = useState("")
  const [selectedWorkflowCaseId, setSelectedWorkflowCaseId] = useState("")
  const [anchorCaseId, setAnchorCaseId] = useState("")
  const [sourceSnapshotId, setSourceSnapshotId] = useState("")
  const loadingCasePageRequestRef = useRef<{
    token: string
    direction: "next" | "previous"
    promise: Promise<boolean>
  } | null>(null)

  useEffect(() => {
    const initialTargetCaseId = readTargetCaseIdFromLocation()
    const initialSnapshotId = readSnapshotIdFromLocation()
    setTargetCaseId(initialTargetCaseId)
    setSelectedWorkflowCaseId(initialTargetCaseId)
    setAnchorCaseId(initialTargetCaseId)
    setSourceSnapshotId(initialSnapshotId)
    void loadDetail(undefined, casePageSize, initialTargetCaseId, initialSnapshotId)
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

  async function loadDetail(
    selectedOverview?: AttackOverview,
    nextCasePageSize = casePageSize,
    nextAnchorCaseId = anchorCaseId,
    nextSourceSnapshotId = sourceSnapshotId,
  ) {
    try {
      const nextOverview = selectedOverview ?? await fetchAttackOverview("fixed", nextSourceSnapshotId.trim())
      const normalizedAnchorCaseId = nextAnchorCaseId.trim()
      const [nextStages, nextCases] = await Promise.all([
        nextOverview.bucket.snapshot_id
          ? fetchAttackStageInstanceDistribution(nextOverview.bucket.snapshot_id).then(buildAttackStageCardsFromInstanceDistribution)
          : Promise.resolve(EMPTY_DATA.stages),
        (async () => {
          try {
            return await fetchAttackTimelineCases({
              ...buildCaseQueryRange(nextOverview),
              pageSize: nextCasePageSize,
              anchorCaseId: normalizedAnchorCaseId,
            })
          } catch (error) {
            if (!normalizedAnchorCaseId || !isAttackTimelineAnchorFallbackError(error)) {
              throw error
            }

            setAnchorCaseId("")
            return await fetchAttackTimelineCases({
              ...buildCaseQueryRange(nextOverview),
              pageSize: nextCasePageSize,
            })
          }
        })(),
      ])

      setOverview(nextOverview)
      setSourceSnapshotId(nextOverview.bucket.snapshot_id || nextSourceSnapshotId.trim())
      setData(buildDetailData(nextOverview, nextStages))
      const nextCaseItems = dedupeAttackCaseItems(nextCases.items)
      setCaseItems(nextCaseItems)
      setSelectedWorkflowCaseId((currentCaseId) => {
        const normalizedTargetCaseId = normalizedAnchorCaseId.toLowerCase()
        const matchedTarget = normalizedTargetCaseId
          ? nextCaseItems.find((item) => item.case_id.toLowerCase() === normalizedTargetCaseId)
          : null
        if (matchedTarget) return matchedTarget.case_id

        const normalizedCurrentCaseId = currentCaseId.trim().toLowerCase()
        const matchedCurrent = normalizedCurrentCaseId
          ? nextCaseItems.find((item) => item.case_id.toLowerCase() === normalizedCurrentCaseId)
          : null
        if (matchedCurrent) return matchedCurrent.case_id

        return nextCaseItems[0]?.case_id ?? ""
      })
      setCaseNextPageToken(nextCases.page.next_page_token)
      setCasePreviousPageToken(nextCases.page.previous_page_token)
      setCaseHasMore(nextCases.page.has_more)
      setCaseHasPrevious(nextCases.page.has_previous)
      setCaseCurrentPage(nextCases.page.current_page || 1)
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
      setSelectedWorkflowCaseId("")
      setCaseNextPageToken("")
      setCasePreviousPageToken("")
      setCaseHasMore(false)
      setCaseHasPrevious(false)
      setCaseCurrentPage(1)
    }
  }

  async function handleSnapshotChange(snapshot: AttackOverview) {
    setChecking(true)
    try {
      setTargetCaseId("")
      setSelectedWorkflowCaseId("")
      setAnchorCaseId("")
      setSourceSnapshotId(snapshot.bucket.snapshot_id || "")
      await loadDetail(snapshot, casePageSize, "")
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
    if (!overview || !caseNextPageToken) return false
    if (
      loadingCasePageRequestRef.current?.direction === "next" &&
      loadingCasePageRequestRef.current.token === caseNextPageToken
    ) {
      return loadingCasePageRequestRef.current.promise
    }
    if (caseLoadingMore || caseLoadingPrevious) return false

    const loadingPageToken = caseNextPageToken
    setCaseLoadingMore(true)

    const request = (async () => {
      try {
        const nextCases = await fetchAttackTimelineCases({
          ...buildCaseQueryRange(overview),
          pageSize: casePageSize,
          pageToken: loadingPageToken,
        })
        setCaseItems((current) => mergeAttackCaseItems(current, nextCases.items))
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
        if (
          loadingCasePageRequestRef.current?.direction === "next" &&
          loadingCasePageRequestRef.current.token === loadingPageToken
        ) {
          loadingCasePageRequestRef.current = null
        }
        setCaseLoadingMore(false)
      }
    })()

    loadingCasePageRequestRef.current = {
      token: loadingPageToken,
      direction: "next",
      promise: request,
    }
    return request
  }

  async function handleLoadPreviousCases() {
    if (!overview || !casePreviousPageToken) return false
    if (
      loadingCasePageRequestRef.current?.direction === "previous" &&
      loadingCasePageRequestRef.current.token === casePreviousPageToken
    ) {
      return loadingCasePageRequestRef.current.promise
    }
    if (caseLoadingMore || caseLoadingPrevious) return false

    const loadingPageToken = casePreviousPageToken
    setCaseLoadingPrevious(true)

    const request = (async () => {
      try {
        const previousCases = await fetchAttackTimelineCases({
          ...buildCaseQueryRange(overview),
          pageSize: casePageSize,
          pageToken: loadingPageToken,
          pageDirection: "previous",
        })
        setCaseItems((current) => mergeAttackCaseItems(previousCases.items, current))
        setCasePreviousPageToken(previousCases.page.previous_page_token)
        setCaseHasPrevious(previousCases.page.has_previous)
        setCaseCurrentPage((current) => Math.max(1, current - 1))
        return true
      } catch (error) {
        console.error("load previous attack cases failed", error)
        toast({
          title: t("cases.loadFailed"),
          description: error instanceof Error ? error.message : undefined,
          variant: "destructive",
        })
        return false
      } finally {
        if (
          loadingCasePageRequestRef.current?.direction === "previous" &&
          loadingCasePageRequestRef.current.token === loadingPageToken
        ) {
          loadingCasePageRequestRef.current = null
        }
        setCaseLoadingPrevious(false)
      }
    })()

    loadingCasePageRequestRef.current = {
      token: loadingPageToken,
      direction: "previous",
      promise: request,
    }
    return request
  }

  async function handleCasePageSizeChange(nextPageSize: number) {
    setCasePageSize(nextPageSize)
    if (!overview || caseLoadingMore || caseLoadingPrevious) return

    setCaseLoadingMore(true)
    try {
      const nextCases = await fetchAttackTimelineCases({
        ...buildCaseQueryRange(overview),
        pageSize: nextPageSize,
        anchorCaseId: anchorCaseId.trim(),
      })
      setCaseItems(dedupeAttackCaseItems(nextCases.items))
      setSelectedWorkflowCaseId((currentCaseId) => {
        const nextCaseItems = dedupeAttackCaseItems(nextCases.items)
        const normalizedCurrentCaseId = currentCaseId.trim().toLowerCase()
        const matchedCurrent = normalizedCurrentCaseId
          ? nextCaseItems.find((item) => item.case_id.toLowerCase() === normalizedCurrentCaseId)
          : null
        return matchedCurrent?.case_id ?? nextCaseItems[0]?.case_id ?? ""
      })
      setCaseNextPageToken(nextCases.page.next_page_token)
      setCasePreviousPageToken(nextCases.page.previous_page_token)
      setCaseHasMore(nextCases.page.has_more)
      setCaseHasPrevious(nextCases.page.has_previous)
      setCaseCurrentPage(nextCases.page.current_page || 1)
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
          snapshotId={overview.bucket.snapshot_id}
          targetCaseId={selectedWorkflowCaseId || targetCaseId}
          hasMore={caseHasMore}
          hasPrevious={caseHasPrevious}
          currentPage={caseCurrentPage}
          loadingMore={caseLoadingMore}
          loadingPrevious={caseLoadingPrevious}
          pageSize={casePageSize}
          onLoadMore={handleLoadMoreCases}
          onLoadPrevious={handleLoadPreviousCases}
          onPageSizeChange={handleCasePageSizeChange}
          onCaseSelect={setSelectedWorkflowCaseId}
        />
      </div>
    </div>
  )
}
