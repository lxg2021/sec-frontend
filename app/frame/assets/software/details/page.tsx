"use client"

import { useCallback, useEffect, useState } from "react"
import type React from "react"
import { AppWindow, Building2, Link2Off, Monitor, Package, RefreshCcw, ServerCog } from "lucide-react"
import { useTranslations } from "next-intl"

import { getSoftwareDistributionPagination, getSoftwareSummary } from "@/features/assets/software/api"
import type { SoftwarePagination, SoftwareOverviewSummary, SoftwareSummary } from "@/features/assets/software/api"
import { SoftInventoryTable } from "@/features/assets/software/components/soft-inventory-table"
import type { SoftItem } from "@/features/assets/software/types/software-aggregate"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Skeleton } from "@/shared/ui/skeleton"

const TENANT_ID = "public"
const DEFAULT_PAGE_SIZE = 10

const EMPTY_PAGINATION: SoftwarePagination = {
  current_page: 1,
  page_size: DEFAULT_PAGE_SIZE,
  total_count: 0,
  total_pages: 0,
  has_previous: false,
  has_next: false,
}

const EMPTY_OVERVIEW: SoftwareOverviewSummary = {
  software_count: 0,
  installation_count: 0,
  host_count: 0,
  vendor_count: 0,
  missing_website_count: 0,
}

const EMPTY_SUMMARY: SoftwareSummary = {
  overview: EMPTY_OVERVIEW,
  vendors: [],
  top_software: [],
  multi_version_software: [],
}

function SummaryMetric({
  label,
  value,
  icon: Icon,
  isLoading,
  tone,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  isLoading: boolean
  tone: "blue" | "amber" | "emerald" | "rose" | "slate"
}) {
  const toneClassNames = {
    blue: {
      surface: "from-blue-500 to-blue-600",
      icon: "from-blue-500 to-blue-600",
      value: "text-blue-600",
    },
    amber: {
      surface: "from-amber-500 to-orange-600",
      icon: "from-amber-500 to-orange-600",
      value: "text-amber-600",
    },
    emerald: {
      surface: "from-emerald-500 to-emerald-600",
      icon: "from-emerald-500 to-emerald-600",
      value: "text-emerald-600",
    },
    rose: {
      surface: "from-rose-500 to-rose-600",
      icon: "from-rose-500 to-rose-600",
      value: "text-rose-600",
    },
    slate: {
      surface: "from-slate-500 to-slate-600",
      icon: "from-zinc-500 to-zinc-700",
      value: "text-slate-600",
    },
  }[tone]

  return (
    <Card className="group relative min-w-0 overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${toneClassNames.surface} opacity-10 transition-opacity group-hover:opacity-20`} />
      <CardHeader className="relative flex flex-row items-center justify-between pb-3">
        <span className="truncate text-sm font-medium text-slate-600 dark:text-slate-300">
          {label}
        </span>
        <div className={`rounded-lg bg-gradient-to-br ${toneClassNames.icon} p-2`}>
          <Icon className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent className="relative">
        {isLoading ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          <div className={`truncate text-3xl font-bold leading-none tabular-nums ${toneClassNames.value}`}>
            {value.toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function Home() {
  const t = useTranslations("pages.assets.softwareDetails")
  const [software, setSoftware] = useState<SoftItem[]>([])
  const [pagination, setPagination] = useState<SoftwarePagination>(EMPTY_PAGINATION)
  const [summary, setSummary] = useState<SoftwareSummary>(EMPTY_SUMMARY)
  const [loading, setLoading] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [error, setError] = useState("")
  const [summaryError, setSummaryError] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [searchTerm, setSearchTerm] = useState("")
  const [vendorFilter, setVendorFilter] = useState("all")

  const loadSoftware = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const result = await getSoftwareDistributionPagination({
        tenantId: TENANT_ID,
        page,
        pageSize,
        name: searchTerm,
        vendor: vendorFilter === "all" ? "" : vendorFilter,
      })

      setSoftware(result.software)
      setPagination(result.pagination)
    } catch (requestError) {
      setSoftware([])
      setPagination({
        ...EMPTY_PAGINATION,
        current_page: page,
        page_size: pageSize,
      })
      setError(requestError instanceof Error ? requestError.message : t("loadFailed"))
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, searchTerm, t, vendorFilter])

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true)
    setSummaryError("")

    try {
      setSummary(await getSoftwareSummary({ tenantId: TENANT_ID }))
    } catch (requestError) {
      setSummary(EMPTY_SUMMARY)
      setSummaryError(requestError instanceof Error ? requestError.message : t("summaryLoadFailed"))
    } finally {
      setSummaryLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadSoftware()
  }, [loadSoftware])

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  const refreshPage = () => {
    void loadSoftware()
    void loadSummary()
  }

  const overview = summary.overview || EMPTY_OVERVIEW

  return (
    <div className="h-full min-h-0 overflow-auto bg-slate-50">
      <div className="flex min-h-full flex-col gap-6 p-6">
        {summaryError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
            {t("summaryLoadFailed")}: {summaryError}
          </div>
        ) : null}

        <section className="grid shrink-0 gap-6 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryMetric
            label={t("summarySoftware")}
            value={Number(overview.software_count || 0)}
            icon={AppWindow}
            isLoading={summaryLoading}
            tone="blue"
          />
          <SummaryMetric
            label={t("summaryInstallations")}
            value={Number(overview.installation_count || 0)}
            icon={ServerCog}
            isLoading={summaryLoading}
            tone="amber"
          />
          <SummaryMetric
            label={t("summaryHosts")}
            value={Number(overview.host_count || 0)}
            icon={Monitor}
            isLoading={summaryLoading}
            tone="emerald"
          />
          <SummaryMetric
            label={t("summaryVendors")}
            value={Number(overview.vendor_count || 0)}
            icon={Building2}
            isLoading={summaryLoading}
            tone="rose"
          />
          <SummaryMetric
            label={t("summaryMissingWebsite")}
            value={Number(overview.missing_website_count || 0)}
            icon={Link2Off}
            isLoading={summaryLoading}
            tone="slate"
          />
        </section>

        <Card className="flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
          <CardHeader className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Package className="size-6" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base font-medium text-slate-950">
                  {t("softwareList")}
                </CardTitle>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {t("softwareListDescription")}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={refreshPage}
              disabled={loading || summaryLoading}
              className="h-10 rounded-2xl border-slate-200 bg-white px-4 shadow-none"
            >
              <RefreshCcw className={`mr-2 h-4 w-4 ${loading || summaryLoading ? "animate-spin" : ""}`} />
              {t("refresh")}
            </Button>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col p-0">
            <SoftInventoryTable
              data={software}
              isLoading={loading}
              error={error}
              pagination={pagination}
              searchTerm={searchTerm}
              vendorFilter={vendorFilter}
              itemsPerPage={pageSize}
              onSearchTermChange={setSearchTerm}
              onVendorFilterChange={setVendorFilter}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              onRetry={() => void loadSoftware()}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
