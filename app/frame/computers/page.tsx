"use client"

import { useState } from "react"
import { HostPageLayout } from "@/components/assert/host-page-layout"
import { HostSummaryCard } from "@/components/assert/host-summary-card"
import { HostList } from "@/components/assert/host-list"
import { HostListToolbar } from "@/components/assert/host-list-toolbar"
import { HostListTable } from "@/components/assert/host-list-table"
import { HostDetailsDrawer } from "@/components/assert/host-details-drawer"
import { mockAgentInfos } from "@/data/mock-data-agent-info"
import { mockAgentHardwareInfos } from "@/data/mock-data-hardware-info"
import { mockAgentSoftInfos } from "@/data/mock-data-soft-info"
import type { AgentInfo } from "@/lib/systemInfo"
import { mockHostSummary } from "@/data/mock-data-host-summary"

export default function HomePage() {
  const [selectedHostId, setSelectedHostId] = useState<string | null>(null)
  const [filteredHosts, setFilteredHosts] = useState<AgentInfo[]>(mockAgentInfos)

  const selectedHost = selectedHostId ? mockAgentInfos.find((host) => host.hostId === selectedHostId) : null
  const selectedHardware = selectedHostId ? mockAgentHardwareInfos.find((hw) => hw.hostId === selectedHostId) : null
  const selectedSoftware = selectedHostId ? mockAgentSoftInfos.find((sw) => sw.hostId === selectedHostId) : null

  return (
    <HostPageLayout>
      <div className="flex flex-col w-full h-full p-6 space-y-6">
        <HostSummaryCard summary={mockHostSummary} />

        <HostList>
          <HostListToolbar hosts={mockAgentInfos} onFilter={setFilteredHosts} />
          <HostListTable hosts={filteredHosts} selectedHostId={selectedHostId} onSelectHost={setSelectedHostId} />
        </HostList>

        <HostDetailsDrawer
          isOpen={!!selectedHostId}
          onClose={() => setSelectedHostId(null)}
          host={selectedHost}
          hardware={selectedHardware}
          software={selectedSoftware}
        />
      </div>
    </HostPageLayout >
  )
}
