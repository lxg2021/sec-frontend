"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { HostDetailsTabs } from "@/components/assert/host-details-tabs"
import type { AgentInfo } from "@/lib/systemInfo"
import type { AgentHardwareInfo } from "@/lib/hardware"
import type { AgentSoftInfo } from "@/lib/software"
import { Monitor, Computer } from "lucide-react"

interface HostDetailsDrawerProps {
  isOpen: boolean
  onClose: () => void
  host: AgentInfo | null
  hardware: AgentHardwareInfo | null
  software: AgentSoftInfo | null
}

export function HostDetailsDrawer({
  isOpen,
  onClose,
  host,
  hardware,
  software,
}: HostDetailsDrawerProps) {
  if (!host) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="h-[45vh] overflow-hidden rounded-t-2xl shadow-2xl bg-white dark:bg-zinc-900"
      >
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <SheetTitle className="text-xl flex items-center gap-2">
            <Computer className="w-5 h-5 text-blue-500" />
            {host.hostname}
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-hidden">
          <HostDetailsTabs host={host} hardware={hardware} software={software} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
