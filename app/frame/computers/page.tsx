"use client"

import { useState } from "react"
import { HostSummaryCard } from "@/components/assert/host-summary-card"
import { HostListToolbar } from "@/components/assert/host-list-toolbar"
import { HostListTable } from "@/components/assert/host-list-table"
import { HostDetailsDialog } from "@/components/assert/host-details-dialog"

import { mockAgentInfos } from "@/data/mock-data-agent-info"
import { mockAgentHardwareInfos } from "@/data/mock-data-hardware-info"
import { mockAgentSoftInfos } from "@/data/mock-data-soft-info"

import type { AgentInfo } from "@/lib/systemInfo"
import { mockHostSummary } from "@/data/mock-data-host-summary"
import { Computer, List } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function HomePage() {

  const [selectedHostId, setSelectedHostId] = useState(null)
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
              <h1 className="text-2xl font-semibold text-gray-900">主机管理</h1>
              <p className="text-sm text-gray-500 mt-1">Computer Management</p>
            </div>
          </div>
        </div>
        <HostSummaryCard summary={mockHostSummary} />

        {/* 主机列表区块 */}
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
            {/* 如果需要右上角加操作按钮，可以在这里加入 */}
          </CardHeader>
          <CardContent className="pb-6">

            {/** search */}
            <HostListToolbar hosts={mockAgentInfos} onFilter={setFilteredHosts} />

            {/** list */}
            <HostListTable
              hosts={filteredHosts}
              selectedHostId={selectedHostId}
              onSelectHost={setSelectedHostId}
            />
          </CardContent>
        </Card>

        {/* 详情弹窗 */}
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
