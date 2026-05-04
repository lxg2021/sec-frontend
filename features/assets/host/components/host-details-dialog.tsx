import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { HostDetailsTabs } from "@/features/assets/host/components/host-details-tabs"

import type { AgentInfo } from "@/features/assets/host/types/system-info"
import type { AgentHardwareInfo } from "@/features/assets/host/types/hardware"
import type { AgentSoftInfo } from "@/features/assets/host/types/software"
import { Computer } from "lucide-react"

interface HostDetailsDialogProps {
  isOpen: boolean
  onClose: () => void
  host: AgentInfo | null
  hardware: AgentHardwareInfo | null
  software: AgentSoftInfo | null
}

export function HostDetailsDialog({
  isOpen,
  onClose,
  host,
  hardware,
  software,
}: HostDetailsDialogProps) {
  if (!host) return null

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent
        className="w-[80vw] max-w-none overflow-y-auto p-0"
      >
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>
            <Computer className="inline-block mr-2 h-5 w-5 text-blue-600" />
            {host.hostname}
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6">
          <HostDetailsTabs host={host} hardware={hardware} software={software} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
