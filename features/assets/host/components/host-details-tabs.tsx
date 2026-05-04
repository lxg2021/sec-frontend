"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { HostBaseInfoCard } from "@/features/assets/host/components/host-base-info-card"
import { HostHardwareAccordion } from "@/features/assets/host/components/host-hardware-accordion"
import { HostSoftwareTable } from "@/features/assets/host/components/host-software-table"
import type { AgentInfo } from "@/features/assets/host/types/system-info"
import type { AgentHardwareInfo } from "@/features/assets/host/types/hardware"
import type { AgentSoftInfo } from "@/features/assets/host/types/software"
import { Info, Cpu, Package, Monitor, Computer } from "lucide-react"

interface HostDetailsTabsProps {
  host: AgentInfo
  hardware: AgentHardwareInfo | null
  software: AgentSoftInfo | null
}

export function HostDetailsTabs({ host, hardware, software }: HostDetailsTabsProps) {
  return (
    <Tabs defaultValue="basic" className="h-full flex flex-col">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="basic" className="flex items-center gap-2">
          <Info className="w-4 h-4 text-gray-500" />
          基础信息
        </TabsTrigger>
        <TabsTrigger value="hardware" className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-gray-500" />
          硬件信息
        </TabsTrigger>
        <TabsTrigger value="software" className="flex items-center gap-2">
          <Package className="w-4 h-4 text-gray-500" />
          软件信息
        </TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="flex-1 overflow-auto mt-4">
        <HostBaseInfoCard host={host} />
      </TabsContent>

      <TabsContent value="hardware" className="flex-1 overflow-auto mt-4">
        <HostHardwareAccordion hardware={hardware} />
      </TabsContent>

      <TabsContent value="software" className="flex-1 overflow-auto mt-4">
        <HostSoftwareTable software={software} />
      </TabsContent>
    </Tabs>
  )
}
