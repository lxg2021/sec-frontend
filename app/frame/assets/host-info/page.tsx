"use client"

import { useCallback, useEffect, useState } from "react"
import { HostSummaryCard } from "@/features/assets/host/components/host-summary-card"
import { HostListToolbar } from "@/features/assets/host/components/host-list-toolbar"
import { HostListTable } from "@/features/assets/host/components/host-list-table"
import { HostDetailsDialog } from "@/features/assets/host/components/host-details-dialog"
import { getHostSummary } from "@/features/assets/host/api"
import { mockAgentInfos } from "@/features/assets/host/mock/agent-info"
import { mockAgentHardwareInfos } from "@/features/assets/host/mock/hardware-info"
import { mockAgentSoftInfos } from "@/features/assets/host/mock/software-info"
import type { HostSummary } from "@/features/assets/host/types/host-summary"
import { AlertCircle, Computer, List, Loader2, RefreshCcw } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { useTranslations } from "next-intl"

const TENANT_ID = "public"

export default function HostInfoPage() {
  const t = useTranslations("pages.assets.hardware")
  const [selectedHostId, setSelectedHostId] = useState<string | null>(null)
  const [filteredHosts, setFilteredHosts] = useState(mockAgentInfos)
  const [summary, setSummary] = useState<HostSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [summaryError, setSummaryError] = useState("")

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true)
    setSummaryError("")

    try {
      setSummary(await getHostSummary(TENANT_ID))
    } catch (error) {
      setSummary(null)
      setSummaryError(error instanceof Error ? error.message : "加载主机统计失败")
    } finally {
      setSummaryLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  const selectedHost = selectedHostId
    ? mockAgentInfos.find((host) => host.hostId === selectedHostId) ?? null
    : null

  const selectedHardware = selectedHostId
    ? mockAgentHardwareInfos.find((hw) => hw.hostId === selectedHostId) ?? null
    : null

  const selectedSoftware = selectedHostId
    ? mockAgentSoftInfos.find((sw) => sw.hostId === selectedHostId) ?? null
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Computer className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{t("title")}</h1>
              <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
            </div>
          </div>
        </div>

        {summaryLoading ? (
          <div className="flex min-h-32 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            正在加载主机统计...
          </div>
        ) : summaryError ? (
          <div className="flex min-h-32 flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{summaryError}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => void loadSummary()} className="bg-white">
              <RefreshCcw className="mr-2 h-4 w-4" />
              重试
            </Button>
          </div>
        ) : summary ? (
          <HostSummaryCard summary={summary} />
        ) : null}

        <Card className="border-0 shadow-lg bg-white dark:bg-gray-800 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <List className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
                  {t("hostList")}
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {t("hostListDescription")}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            <HostListToolbar hosts={mockAgentInfos} onFilter={setFilteredHosts} />
            <HostListTable
              hosts={filteredHosts}
              selectedHostId={selectedHostId}
              onSelectHost={setSelectedHostId}
            />
          </CardContent>
        </Card>

        <HostDetailsDialog
          isOpen={!!selectedHostId}
          onClose={() => setSelectedHostId(null)}
          host={selectedHost}
          hardware={selectedHardware}
          software={selectedSoftware}
        />
      </div>
    </div>
  )
}
