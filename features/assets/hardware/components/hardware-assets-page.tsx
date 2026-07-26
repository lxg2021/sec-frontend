"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { getHardwareAssetPagination, getHardwareSummary } from "@/features/assets/hardware/api"
import { HardwareAssetTable } from "@/features/assets/hardware/components/hardware-asset-table"
import { HardwareSummaryCards } from "@/features/assets/hardware/components/hardware-summary-cards"
import type {
  HardwareAssetItem,
  HardwareCategory,
  HardwarePagination,
  HardwareSummary,
} from "@/features/assets/hardware/types"

const TENANT_ID = "public"
const DEFAULT_PAGE_SIZE = 10

const EMPTY_PAGINATION: HardwarePagination = {
  current_page: 1,
  page_size: DEFAULT_PAGE_SIZE,
  total_count: 0,
  total_pages: 0,
  has_previous: false,
  has_next: false,
}

const EMPTY_SUMMARY: HardwareSummary = {
  model_count: 0,
  device_count: 0,
  record_count: 0,
  covered_host_count: 0,
  latest_collected_at: 0,
  categories: [],
}

export function HardwareAssetsPage() {
  const t = useTranslations("pages.assets.hardware.inventory")
  const [summary, setSummary] = useState<HardwareSummary>(EMPTY_SUMMARY)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [summaryError, setSummaryError] = useState("")
  const [assets, setAssets] = useState<HardwareAssetItem[]>([])
  const [assetsLoading, setAssetsLoading] = useState(true)
  const [assetsError, setAssetsError] = useState("")
  const [category, setCategory] = useState<HardwareCategory>("cpu")
  const [keyword, setKeyword] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [pagination, setPagination] = useState<HardwarePagination>(EMPTY_PAGINATION)

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true)
    setSummaryError("")

    try {
      setSummary(await getHardwareSummary({ tenantId: TENANT_ID }))
    } catch (error) {
      console.error("[HardwareAssets] loadSummary:error", error)
      setSummary(EMPTY_SUMMARY)
      setSummaryError(t("errors.summaryLoadFailed"))
    } finally {
      setSummaryLoading(false)
    }
  }, [t])

  const loadAssets = useCallback(async () => {
    setAssetsLoading(true)
    setAssetsError("")

    try {
      const result = await getHardwareAssetPagination({
        tenantId: TENANT_ID,
        category,
        keyword,
        page,
        pageSize,
        translate: (key, values) => t(key, values),
      })

      setAssets(result.assets)
      setPagination(result.pagination)
    } catch (error) {
      console.error("[HardwareAssets] loadAssets:error", error)
      setAssets([])
      setPagination({ ...EMPTY_PAGINATION, current_page: page, page_size: pageSize })
      setAssetsError(t("errors.listLoadFailed"))
    } finally {
      setAssetsLoading(false)
    }
  }, [category, keyword, page, pageSize, t])

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  useEffect(() => {
    void loadAssets()
  }, [loadAssets])

  return (
    <div className="h-full min-h-0 overflow-auto bg-slate-50">
      <div className="flex min-h-full flex-col gap-6 p-6">
        {summaryError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {summaryError}
          </div>
        ) : null}

        <HardwareSummaryCards summary={summary} isLoading={summaryLoading} />

        <HardwareAssetTable
          data={assets}
          pagination={pagination}
          category={category}
          keyword={keyword}
          pageSize={pageSize}
          isLoading={assetsLoading}
          error={assetsError}
          onCategoryChange={setCategory}
          onKeywordChange={setKeyword}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onRetry={() => {
            void loadAssets()
            void loadSummary()
          }}
        />
      </div>
    </div>
  )
}
