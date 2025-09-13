import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { HostDetailsTabs } from "@/components/assert/host-details-tabs"

import type { AgentInfo } from "@/lib/systemInfo"
import type { AgentHardwareInfo } from "@/lib/hardware"
import type { AgentSoftInfo } from "@/lib/software"

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
          <DialogTitle>{host.hostname}</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6">
          <HostDetailsTabs host={host} hardware={hardware} software={software} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
