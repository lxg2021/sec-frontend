"use client"

import { useCallback, useEffect, useState } from "react"
import type React from "react"
import { AppWindow, BarChart3, Building2, Link2Off, Monitor, Package, RefreshCcw, ServerCog } from "lucide-react"
import { useTranslations } from "next-intl"

import { getSoftwareDistributionPagination, getSoftwareSummary } from "@/features/assets/software/api"
import type { SoftwarePagination, SoftwareOverviewSummary, SoftwareSummary } from "@/features/assets/software/api"
import { SoftInventoryTable } from "@/features/assets/software/components/soft-inventory-table"
import type { SoftItem } from "@/features/assets/software/types/software-aggregate"
import { Button } from "@/shared/ui/button"
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
      border: "border-t-blue-500",
      iconBg: "bg-blue-50",
      text: "text-blue-600",
      value: "text-blue-600",
    },
    amber: {
      border: "border-t-amber-500",
      iconBg: "bg-amber-50",
      text: "text-amber-600",
      value: "text-amber-600",
    },
    emerald: {
      border: "border-t-emerald-500",
      iconBg: "bg-emerald-50",
      text: "text-emerald-600",
      value: "text-emerald-600",
    },
    rose: {
      border: "border-t-rose-500",
      iconBg: "bg-rose-50",
      text: "text-rose-600",
      value: "text-rose-600",
    },
    slate: {
      border: "border-t-slate-400",
      iconBg: "bg-slate-100",
      text: "text-slate-600",
      value: "text-slate-600",
    },
  }[tone]

  return (
    <div className={`flex min-w-0 items-center gap-3 rounded-lg border border-t-2 border-slate-200 ${toneClassNames.border} bg-white px-4 py-3`}>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneClassNames.iconBg} ${toneClassNames.text}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-xs font-medium text-slate-500">{label}</div>
        {isLoading ? (
          <Skeleton className="mt-2 h-7 w-14" />
        ) : (
          <div className={`mt-1 truncate text-2xl font-semibold leading-7 tabular-nums ${toneClassNames.value}`}>
            {value.toLocaleString()}
          </div>
        )}
      </div>
    </div>
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
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-950">{t("softwareList")}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t("softwareListDescription")}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={refreshPage} disabled={loading || summaryLoading}>
              <RefreshCcw className={`mr-2 h-4 w-4 ${loading || summaryLoading ? "animate-spin" : ""}`} />
              {t("refresh")}
            </Button>
          </div>

          <div className="space-y-6 p-6">
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-2">
                  <BarChart3 className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">{t("summaryTitle")}</h3>
                  </div>
                </div>
                {summaryError ? (
                  <div className="text-sm text-rose-600" role="alert">
                    {t("summaryLoadFailed")}: {summaryError}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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
              </div>
            </div>

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
          </div>
        </section>

      </div>
    </div>
  )
}
