"use client"

import { useState } from "react"
import { HostSummaryCard } from "@/features/assets/host/components/host-summary-card"
import { HostListToolbar } from "@/features/assets/host/components/host-list-toolbar"
import { HostListTable } from "@/features/assets/host/components/host-list-table"
import { HostDetailsDialog } from "@/features/assets/host/components/host-details-dialog"
import { mockAgentInfos } from "@/features/assets/host/mock/agent-info"
import { mockAgentHardwareInfos } from "@/features/assets/host/mock/hardware-info"
import { mockAgentSoftInfos } from "@/features/assets/host/mock/software-info"
import { mockHostSummary } from "@/features/assets/host/mock/host-summary"
import { Computer, List } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card"

export default function HardwareAssetsPage() {
  const [selectedHostId, setSelectedHostId] = useState<string | null>(null)
  const [filteredHosts, setFilteredHosts] = useState(mockAgentInfos)

  const selectedHost = selectedHostId
    ? mockAgentInfos.find((host) => host.hostId === selectedHostId)
    : null

  const selectedHardware = selectedHostId
    ? mockAgentHardwareInfos.find((hw) => hw.hostId === selectedHostId)
    : null

  const selectedSoftware = selectedHostId
    ? mockAgentSoftInfos.find((sw) => sw.hostId === selectedHostId)
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
              <h1 className="text-2xl font-semibold text-gray-900">主机信息</h1>
              <p className="text-sm text-gray-500 mt-1">Host Information</p>
            </div>
          </div>
        </div>

        <HostSummaryCard summary={mockHostSummary} />

        <Card className="border-0 shadow-lg bg-white dark:bg-gray-800 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <List className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
                  主机列表
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  注册主机，可筛选、点击查看硬件、软件信息
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
