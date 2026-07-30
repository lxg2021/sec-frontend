"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { HostBaseInfoCard } from "@/features/assets/host/components/host-base-info-card"
import { HostHardwareAccordion } from "@/features/assets/host/components/host-hardware-accordion"
import { HostSoftwareTable } from "@/features/assets/host/components/host-software-table"
import type { HostPagination } from "@/features/assets/host/api"
import type { AgentInfo } from "@/features/assets/host/types/system-info"
import type { AgentHardwareInfo } from "@/features/assets/host/types/hardware"
import type { AgentSoftInfo } from "@/features/assets/host/types/software"
import { Info, Loader2, Package, Monitor, RefreshCcw } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

interface HostDetailsTabsProps {
  host: AgentInfo
  hardware: AgentHardwareInfo | null
  software: AgentSoftInfo | null
  activeTab: string
  hardwareLoading?: boolean
  hardwareError?: string
  softwareLoading?: boolean
  softwareError?: string
  softwarePagination?: HostPagination | null
  softwarePageSize?: number
  onTabChange: (value: string) => void
  onRetryHardware?: () => void
  onRetrySoftware?: () => void
  onSoftwarePageChange?: (page: number) => void
  onSoftwarePageSizeChange?: (pageSize: number) => void
}

export function HostDetailsTabs({
  host,
  hardware,
  software,
  activeTab,
  hardwareLoading = false,
  hardwareError = "",
  softwareLoading = false,
  softwareError = "",
  softwarePagination = null,
  softwarePageSize = 10,
  onTabChange,
  onRetryHardware,
  onRetrySoftware,
  onSoftwarePageChange,
  onSoftwarePageSizeChange,
}: HostDetailsTabsProps) {
  const tabsT = useTranslations("pages.assets.hardware.host.tabs")
  const detailsT = useTranslations("pages.assets.hardware.host.details")

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="flex h-full min-h-0 flex-col">
      <TabsList className="grid w-full shrink-0 grid-cols-3">
        <TabsTrigger value="basic" className="flex items-center gap-2">
          <Info className="w-4 h-4 text-gray-500" />
          {tabsT("basic")}
        </TabsTrigger>
        <TabsTrigger value="hardware" className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-gray-500" />
          {tabsT("hardware")}
        </TabsTrigger>
        <TabsTrigger value="software" className="flex items-center gap-2">
          <Package className="w-4 h-4 text-gray-500" />
          {tabsT("software")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="mt-4 min-h-0 flex-1 overflow-auto">
        <HostBaseInfoCard host={host} />
      </TabsContent>

      <TabsContent value="hardware" className="mt-4 min-h-0 flex-1 overflow-auto">
        {hardwareLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {detailsT("loadingHardware")}
            </CardContent>
          </Card>
        ) : hardwareError ? (
          <Card>
            <CardContent className="flex flex-col gap-3 py-8 text-sm text-rose-700 md:flex-row md:items-center md:justify-between">
              <span>{hardwareError}</span>
              {onRetryHardware ? (
                <Button variant="outline" size="sm" onClick={onRetryHardware}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  {detailsT("retry")}
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <HostHardwareAccordion hardware={hardware} />
        )}
      </TabsContent>

      <TabsContent value="software" className="mt-4 min-h-0 flex-1 overflow-hidden">
        <HostSoftwareTable
          software={software}
          loading={softwareLoading}
          error={softwareError}
          pagination={softwarePagination || undefined}
          pageSize={softwarePageSize}
          onRetry={onRetrySoftware}
          onPageChange={onSoftwarePageChange}
          onPageSizeChange={onSoftwarePageSizeChange}
        />
      </TabsContent>
    </Tabs>
  )
}
