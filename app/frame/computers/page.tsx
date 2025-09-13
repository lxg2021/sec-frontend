"use client"

import { useState } from "react"
import { HostPageLayout } from "@/components/assert/host-page-layout"
import { HostSummaryCard } from "@/components/assert/host-summary-card"
import { HostListToolbar } from "@/components/assert/host-list-toolbar"
import { HostListTable } from "@/components/assert/host-list-table"
import { HostDetailsDrawer } from "@/components/assert/host-details-drawer"
import { mockAgentInfos } from "@/data/mock-data-agent-info"
import { mockAgentHardwareInfos } from "@/data/mock-data-hardware-info"
import { mockAgentSoftInfos } from "@/data/mock-data-soft-info"
import type { AgentInfo } from "@/lib/systemInfo"
import { mockHostSummary } from "@/data/mock-data-host-summary"
import { Computer, List } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function HomePage() {
  const [selectedHostId, setSelectedHostId] = useState<string | null>(null)
  const [filteredHosts, setFilteredHosts] = useState<AgentInfo[]>(mockAgentInfos)

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
    <div className="p-6 space-y-6">
      {/* 页面头部统计区块 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Computer className="h-6 w-6 text-blue-300" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">主机管理</h1>
            <p className="text-sm text-gray-500 mt-1">Computers Management</p>
          </div>
        </div>
      </div>
      {/* 统计卡片 */}
      <HostSummaryCard summary={mockHostSummary} />

      <HostPageLayout>

        {/* 主机列表区块：100%自适应内容区宽度 */}
        <Card className="w-full border-0 shadow-lg bg-white dark:bg-gray-800 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-lg">
                <List className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
                  主机列表
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  所有已注册主机，可筛选、选择查看详情
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <HostListToolbar hosts={mockAgentInfos} onFilter={setFilteredHosts} />
            <HostListTable
              hosts={filteredHosts}
              selectedHostId={selectedHostId}
              onSelectHost={setSelectedHostId}
            />
          </CardContent>
        </Card>

        {/* 侧边抽屉 */}
        <HostDetailsDrawer
          isOpen={!!selectedHostId}
          onClose={() => setSelectedHostId(null)}
          host={selectedHost}
          hardware={selectedHardware}
          software={selectedSoftware}
        />
      </HostPageLayout>

    </div>
  )
}
