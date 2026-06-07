"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ArrowRight,
  CalendarClock,
  Check,
  Clock,
  Filter,
  Loader2,
  MousePointerClick,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { fetchAttackSnapshots } from "@/features/attack/dashboard/api"
import type { AttackOverview, BucketType } from "@/features/attack/dashboard/types"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { ScrollArea } from "@/shared/ui/scroll-area"
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group"
import { cn } from "@/shared/lib/utils"

interface AttackSnapshotSelectorProps {
  value?: string
  snapshot?: AttackOverview
  disabled?: boolean
  onChange: (snapshot: AttackOverview) => void
}

type SourceFilter = "all" | "manual" | "scheduled"
type BucketFilter = "all" | BucketType

const SOURCE_BADGE_CLASS: Record<Exclude<SourceFilter, "all">, string> = {
  manual: "border-teal-200 bg-teal-50 text-teal-700",
  scheduled: "border-blue-200 bg-blue-50 text-blue-700",
}

const BUCKET_BADGE_CLASS: Record<BucketType, string> = {
  fixed: "border-violet-200 bg-violet-50 text-violet-700",
  hour: "border-sky-200 bg-sky-50 text-sky-700",
  day: "border-amber-200 bg-amber-50 text-amber-700",
}

function formatTime(value?: string) {
  if (!value) return "--"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function formatCount(value: number) {
  return new Intl.NumberFormat().format(value || 0)
}

function snapshotValue(snapshot: AttackOverview) {
  return snapshot.bucket.snapshot_id || `${snapshot.bucket.bucket_type}:${snapshot.bucket.bucket_start}:${snapshot.bucket.bucket_end}`
}

function sourceType(value?: string): Exclude<SourceFilter, "all"> {
  const normalized = value?.trim().toLowerCase()
  if (normalized === "manual" || normalized === "manual_trigger") return "manual"
  return "scheduled"
}

export function AttackSnapshotSelector({
  value,
  snapshot,
  disabled = false,
  onChange,
}: AttackSnapshotSelectorProps) {
  const t = useTranslations("pages.attack.dashboard.header")
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AttackOverview[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all")
  const [bucketFilter, setBucketFilter] = useState<BucketFilter>("all")

  useEffect(() => {
    let cancelled = false

    async function loadSnapshots() {
      setLoading(true)
      setError(false)

      try {
        const result = await fetchAttackSnapshots({ page: 1, pageSize: 100 })
        if (!cancelled) setItems(result.items)
      } catch (err) {
        console.error("load attack snapshots failed", err)
        if (!cancelled) {
          setItems([])
          setError(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadSnapshots()

    return () => {
      cancelled = true
    }
  }, [])

  const selected = useMemo(() => {
    return items.find((item) => snapshotValue(item) === value) || snapshot || items[0]
  }, [items, snapshot, value])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const sourceMatched = sourceFilter === "all" || sourceType(item.bucket.trigger_source) === sourceFilter
      const bucketMatched = bucketFilter === "all" || item.bucket.bucket_type === bucketFilter
      return sourceMatched && bucketMatched
    })
  }, [bucketFilter, items, sourceFilter])

  const selectedStart = formatTime(selected?.bucket.bucket_start)
  const selectedEnd = formatTime(selected?.bucket.bucket_end)

  function handleSelect(snapshot: AttackOverview) {
    onChange(snapshot)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="flex min-w-[320px] items-center gap-3 rounded-2xl bg-slate-50/90 px-3 py-2.5 text-left transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 lg:border-l lg:border-slate-200 lg:bg-transparent lg:pl-5 lg:pr-0 lg:hover:bg-slate-50"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200/80 lg:bg-slate-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs leading-none text-slate-400">{t("checkRange")}</span>
          <span className="mt-1 flex min-w-0 items-center gap-1.5 text-sm font-medium text-slate-700 tabular-nums">
            <span className="truncate">{error ? t("snapshotLoadFailed") : selectedStart}</span>
            {!error && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
            {!error && <span className="truncate">{selectedEnd}</span>}
          </span>
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader className="border-b border-slate-100 px-6 py-4">
            <DialogTitle className="flex items-center gap-2 text-base text-slate-900">
              <CalendarClock className="h-5 w-5 text-teal-600" />
              {t("snapshotDialogTitle")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 px-6 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Filter className="h-4 w-4" />
                {t("snapshotFilters")}
              </div>
              <ToggleGroup
                type="single"
                value={sourceFilter}
                onValueChange={(nextValue) => nextValue && setSourceFilter(nextValue as SourceFilter)}
                className="rounded-lg bg-slate-100 p-1"
              >
                <ToggleGroupItem value="all" className="h-7 px-2.5 text-xs">
                  {t("snapshotSourceAll")}
                </ToggleGroupItem>
                <ToggleGroupItem value="manual" className="h-7 px-2.5 text-xs">
                  {t("snapshotSourceManual")}
                </ToggleGroupItem>
                <ToggleGroupItem value="scheduled" className="h-7 px-2.5 text-xs">
                  {t("snapshotSourceScheduled")}
                </ToggleGroupItem>
              </ToggleGroup>
              <ToggleGroup
                type="single"
                value={bucketFilter}
                onValueChange={(nextValue) => nextValue && setBucketFilter(nextValue as BucketFilter)}
                className="rounded-lg bg-slate-100 p-1"
              >
                {(["all", "fixed", "hour", "day"] as const).map((option) => (
                  <ToggleGroupItem key={option} value={option} className="h-7 px-2.5 text-xs uppercase">
                    {option === "all" ? t("snapshotBucketAll") : option}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <ScrollArea className="h-[420px] rounded-xl border border-slate-100">
              <div className="divide-y divide-slate-100">
                {loading ? (
                  <div className="flex h-40 items-center justify-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("snapshotLoading")}
                  </div>
                ) : error ? (
                  <div className="flex h-40 items-center justify-center text-sm text-red-500">
                    {t("snapshotLoadFailed")}
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                    {t("snapshotEmpty")}
                  </div>
                ) : (
                  filteredItems.map((snapshot) => {
                    const itemValue = snapshotValue(snapshot)
                    const selectedItem = itemValue === value
                    const source = sourceType(snapshot.bucket.trigger_source)
                    return (
                      <button
                        key={itemValue}
                        type="button"
                        className={cn(
                          "grid w-full grid-cols-[minmax(0,1fr)_auto] gap-4 px-4 py-3 text-left transition-colors hover:bg-slate-50",
                          selectedItem && "bg-teal-50/60",
                        )}
                        onClick={() => handleSelect(snapshot)}
                      >
                        <span className="min-w-0 space-y-2">
                          <span className="flex min-w-0 flex-wrap items-center gap-2">
                            <Badge variant="outline" className={SOURCE_BADGE_CLASS[source]}>
                              {source === "manual" ? t("snapshotSourceManual") : t("snapshotSourceScheduled")}
                            </Badge>
                            <Badge variant="outline" className={BUCKET_BADGE_CLASS[snapshot.bucket.bucket_type]}>
                              {snapshot.bucket.bucket_type.toUpperCase()}
                            </Badge>
                            {snapshot.bucket.snapshot_id && (
                              <span className="text-xs text-slate-400">#{snapshot.bucket.snapshot_id}</span>
                            )}
                          </span>
                          <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium tabular-nums text-slate-800">
                            <span className="truncate">{formatTime(snapshot.bucket.bucket_start)}</span>
                            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{formatTime(snapshot.bucket.bucket_end)}</span>
                          </span>
                        </span>

                        <span className="flex items-center gap-4">
                          <span className="grid grid-cols-4 gap-3 text-center">
                            <Metric label={t("snapshotRules")} value={snapshot.total_rules} />
                            <Metric label={t("snapshotInstances")} value={snapshot.total_instances} />
                            <Metric label={t("snapshotHosts")} value={snapshot.total_hosts} />
                            <Metric label={t("snapshotCases")} value={snapshot.total_cases} />
                          </span>
                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                              selectedItem
                                ? "border-teal-200 bg-teal-100 text-teal-700"
                                : "border-slate-200 text-slate-300",
                            )}
                          >
                            {selectedItem ? <Check className="h-4 w-4" /> : <MousePointerClick className="h-4 w-4" />}
                          </span>
                        </span>
                      </button>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <span className="min-w-14">
      <span className="block text-xs text-slate-400">{label}</span>
      <span className="mt-0.5 block text-sm font-semibold tabular-nums text-slate-800">{formatCount(value)}</span>
    </span>
  )
}
