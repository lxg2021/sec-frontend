"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  FileSearch,
  ListTree,
  ShieldCheck,
  Target,
} from "lucide-react"

import type { AttackCaseTimelineSummary } from "@/features/attack/dashboard/types"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { Input } from "@/shared/ui/input"
import { TooltipProvider } from "@/shared/ui/tooltip"
import { toast } from "@/shared/hooks/use-toast"
import { AttackCaseRow } from "./attack-case-row"
import { buildTraceHref } from "../utils/attack-case-format"
import { dedupeAttackCaseItems } from "../utils/attack-case-list-data"

export type { AttackCaseTimelineSummary } from "@/features/attack/dashboard/types"

interface AttackCaseListProps {
  items: AttackCaseTimelineSummary[]
  onViewDetail?: (caseId: string) => void
  className?: string
  snapshotId?: string
  targetCaseId?: string
  hasMore?: boolean
  loadingMore?: boolean
  pageSize?: number
  onLoadMore?: () => boolean | Promise<boolean>
  onPageSizeChange?: (pageSize: number) => void | Promise<void>
}

const DEFAULT_PAGE_SIZE = 10
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export function AttackCaseList({
  items,
  onViewDetail,
  className,
  snapshotId = "",
  targetCaseId = "",
  hasMore = false,
  loadingMore = false,
  pageSize: controlledPageSize,
  onLoadMore,
  onPageSizeChange,
}: AttackCaseListProps) {
  const t = useTranslations("pages.attack.dashboard.cases")
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [localPageSize, setLocalPageSize] = useState(controlledPageSize ?? DEFAULT_PAGE_SIZE)
  const [caseItems, setCaseItems] = useState(() => dedupeAttackCaseItems(items))
  const [selectedCaseId, setSelectedCaseId] = useState("")
  const [caseIdQuery, setCaseIdQuery] = useState("")
  const [pendingScrollCaseId, setPendingScrollCaseId] = useState("")
  const [autoLoadingCaseId, setAutoLoadingCaseId] = useState("")
  const [autoLocateFailedCaseId, setAutoLocateFailedCaseId] = useState("")
  const [autoLocatedCaseId, setAutoLocatedCaseId] = useState("")
  const pageSize = controlledPageSize ?? localPageSize
  const loadedTotal = caseItems.length
  const totalPages = Math.max(1, Math.ceil(loadedTotal / pageSize))
  const normalizedPage = Math.min(page, Math.max(1, totalPages))
  const pageStartIndex = (normalizedPage - 1) * pageSize
  const pageEndIndex = Math.min(pageStartIndex + pageSize, loadedTotal)
  const visibleItems = caseItems.slice(pageStartIndex, pageEndIndex)
  const visibleStart = loadedTotal > 0 ? pageStartIndex + 1 : 0
  const visibleEnd = loadedTotal > 0 ? pageEndIndex : 0

  useEffect(() => {
    setCaseItems(dedupeAttackCaseItems(items))
  }, [items])

  useEffect(() => {
    if (!selectedCaseId) return
    if (caseItems.some((item) => item.case_id === selectedCaseId)) return
    setSelectedCaseId("")
    setCaseIdQuery("")
  }, [caseItems, selectedCaseId])

  useEffect(() => {
    setAutoLocateFailedCaseId("")
    setAutoLocatedCaseId("")
  }, [targetCaseId])

  useEffect(() => {
    setPage((current) => Math.min(current, Math.max(1, Math.ceil(caseItems.length / pageSize))))
  }, [caseItems.length, pageSize])

  useEffect(() => {
    if (!pendingScrollCaseId) return
    const timer = window.setTimeout(() => {
      const target = Array.from(document.querySelectorAll<HTMLElement>("[data-attack-case-id]")).find(
        (node) => node.dataset.attackCaseId === pendingScrollCaseId,
      )
      target?.scrollIntoView({ block: "center", behavior: "smooth" })
      setPendingScrollCaseId("")
    }, 80)
    return () => window.clearTimeout(timer)
  }, [pendingScrollCaseId, normalizedPage, visibleItems])

  useEffect(() => {
    const normalizedTarget = targetCaseId.trim()
    if (!normalizedTarget) return
    if (autoLocatedCaseId === normalizedTarget) return

    const matchedIndex = caseItems.findIndex(
      (item) => item.case_id.toLowerCase() === normalizedTarget.toLowerCase(),
    )

    if (matchedIndex >= 0) {
      const matched = caseItems[matchedIndex]
      if (selectedCaseId !== matched.case_id) {
        setSelectedCaseId(matched.case_id)
      }
      setCaseIdQuery(matched.case_id)
      setPage(Math.floor(matchedIndex / pageSize) + 1)
      setPendingScrollCaseId(matched.case_id)
      setAutoLocatedCaseId(normalizedTarget)
      return
    }

    setCaseIdQuery(normalizedTarget)
    if (
      !hasMore ||
      !onLoadMore ||
      loadingMore ||
      autoLoadingCaseId === normalizedTarget ||
      autoLocateFailedCaseId === normalizedTarget
    ) {
      return
    }

    setAutoLoadingCaseId(normalizedTarget)
    void Promise.resolve(onLoadMore())
      .then((loaded) => {
        if (loaded === false) {
          setAutoLocateFailedCaseId(normalizedTarget)
        }
      })
      .catch(() => {
        setAutoLocateFailedCaseId(normalizedTarget)
      })
      .finally(() => {
        setAutoLoadingCaseId("")
      })
  }, [
    autoLoadingCaseId,
    autoLocatedCaseId,
    autoLocateFailedCaseId,
    caseItems,
    hasMore,
    loadingMore,
    onLoadMore,
    pageSize,
    selectedCaseId,
    targetCaseId,
  ])

  function handleCaseUpdated(nextItem: AttackCaseTimelineSummary) {
    setCaseItems((current) =>
      dedupeAttackCaseItems(
        current.map((item) => (item.case_id === nextItem.case_id ? nextItem : item)),
      ),
    )
  }

  function handleSelectCase(caseId: string) {
    setSelectedCaseId(caseId)
    setCaseIdQuery(caseId)
  }

  function handleViewDetail(caseId: string) {
    handleSelectCase(caseId)

    if (onViewDetail) {
      onViewDetail(caseId)
      return
    }

    router.push(buildTraceHref(caseId, snapshotId))
  }

  function handleLocateCase() {
    const normalizedQuery = caseIdQuery.trim()
    if (!normalizedQuery) return

    const matchedIndex = caseItems.findIndex(
      (item) => item.case_id.toLowerCase() === normalizedQuery.toLowerCase(),
    )

    if (matchedIndex < 0) {
      toast({
        title: t("caseLocator.notFound"),
        variant: "destructive",
      })
      return
    }

    const matched = caseItems[matchedIndex]
    setSelectedCaseId(matched.case_id)
    setCaseIdQuery(matched.case_id)
    setPage(Math.floor(matchedIndex / pageSize) + 1)
    setPendingScrollCaseId(matched.case_id)
  }

  async function handlePageSizeChange(value: string) {
    const nextPageSize = Number(value)
    if (!Number.isFinite(nextPageSize) || nextPageSize <= 0) return
    setPage(1)
    if (controlledPageSize === undefined) {
      setLocalPageSize(nextPageSize)
    }
    await onPageSizeChange?.(nextPageSize)
  }

  async function handleNextPage() {
    if (normalizedPage < totalPages) {
      setPage((current) => current + 1)
      return
    }

    if (!hasMore || loadingMore || !onLoadMore) return
    const loaded = await onLoadMore()
    if (loaded !== false) {
      setPage((current) => current + 1)
    }
  }

  function handlePreviousPage() {
    setPage((current) => Math.max(current - 1, 1))
  }

  if (caseItems.length === 0) {
    return (
      <Card
        className={cn(
          "overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm",
          className,
        )}
      >
        <AttackCaseListHeader
          selectedCaseId=""
          caseIdQuery={caseIdQuery}
          canLocate={false}
          onCaseIdQueryChange={setCaseIdQuery}
          onLocateCase={handleLocateCase}
        />
        <CardContent className="px-6 py-14">
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card py-12 text-center">
            <ShieldCheck className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <Card
        className={cn(
          "overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm",
          className,
        )}
      >
        <AttackCaseListHeader
          selectedCaseId={selectedCaseId}
          caseIdQuery={caseIdQuery}
          canLocate={caseItems.length > 0}
          onCaseIdQueryChange={setCaseIdQuery}
          onLocateCase={handleLocateCase}
        />
        <CardContent className="px-4 py-3">
          <div className="space-y-3">
            {visibleItems.map((item, index) => (
              <AttackCaseRow
                key={item.case_id}
                item={item}
                snapshotId={snapshotId}
                selected={item.case_id === selectedCaseId}
                onSelect={handleSelectCase}
                onViewDetail={handleViewDetail}
                onCaseUpdated={handleCaseUpdated}
              />
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 text-sm text-slate-600 lg:flex-row lg:items-center lg:justify-between">
          <div>
            {t("pagination.total", {
              total: loadedTotal,
              start: visibleStart,
              end: visibleEnd,
            })}
            {hasMore ? (
              <span className="ml-1 text-slate-400">{t("pagination.moreAvailable")}</span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500">
              {t("pagination.page", {
                page: normalizedPage,
                totalPages: hasMore ? `${totalPages}+` : totalPages,
              })}
            </span>
            <span className="ml-2 text-slate-500">{t("pagination.pageSize")}</span>
            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-9 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={loadingMore || normalizedPage <= 1}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              {t("pagination.previous")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={loadingMore || (!hasMore && normalizedPage >= totalPages)}
            >
              {loadingMore ? t("loadingMore") : t("pagination.next")}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </TooltipProvider>
  )
}

function AttackCaseListHeader({
  selectedCaseId,
  caseIdQuery,
  canLocate,
  onCaseIdQueryChange,
  onLocateCase,
}: {
  selectedCaseId: string
  caseIdQuery: string
  canLocate: boolean
  onCaseIdQueryChange: (value: string) => void
  onLocateCase: () => void
}) {
  const t = useTranslations("pages.attack.dashboard.cases")

  return (
    <CardHeader className="gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
          <ListTree className="size-6" />
        </div>
        <div className="min-w-0">
          <CardTitle className="text-lg font-semibold leading-6 text-slate-950">
            {t("title")}
          </CardTitle>
          <CardDescription className="mt-1 text-sm text-slate-500">
            {t("description")}
          </CardDescription>
        </div>
      </div>
      <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
        <div
          className="flex h-10 min-w-[320px] max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-3 shadow-sm"
          title={selectedCaseId || t("caseLocator.empty")}
        >
          <Target className="size-4 shrink-0 text-slate-400" />
          <Input
            value={caseIdQuery}
            disabled={!canLocate}
            onChange={(event) => onCaseIdQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                onLocateCase()
              }
            }}
            placeholder={t("caseLocator.placeholder")}
            className="h-8 min-w-0 flex-1 border-0 bg-transparent px-0 py-0 font-mono text-xs text-slate-700 shadow-none ring-offset-transparent placeholder:font-sans placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!canLocate || !caseIdQuery.trim()}
            onClick={onLocateCase}
            className="h-7 shrink-0 rounded-full px-2 text-cyan-600 hover:bg-cyan-50 hover:text-cyan-700 disabled:text-slate-300"
          >
            {t("caseLocator.locate")}
          </Button>
        </div>
      </div>
    </CardHeader>
  )
}
