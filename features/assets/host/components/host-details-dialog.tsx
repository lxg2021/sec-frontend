"use client"

import { useCallback, useEffect, useState } from "react"
import { Computer } from "lucide-react"

import { getHardwareInfo, getHostSoftwareInfoPagination } from "@/features/assets/host/api"
import type { HostPagination } from "@/features/assets/host/api"
import { HostDetailsTabs } from "@/features/assets/host/components/host-details-tabs"
import type { AgentHardwareInfo } from "@/features/assets/host/types/hardware"
import type { AgentSoftInfo } from "@/features/assets/host/types/software"
import type { AgentInfo } from "@/features/assets/host/types/system-info"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog"

interface HostDetailsDialogProps {
  isOpen: boolean
  onClose: () => void
  host: AgentInfo | null
}

const TENANT_ID = "public"
const DEFAULT_SOFTWARE_PAGE_SIZE = 10

export function HostDetailsDialog({
  isOpen,
  onClose,
  host,
}: HostDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState("basic")
  const [hardware, setHardware] = useState<AgentHardwareInfo | null>(null)
  const [hardwareLoading, setHardwareLoading] = useState(false)
  const [hardwareError, setHardwareError] = useState("")
  const [software, setSoftware] = useState<AgentSoftInfo | null>(null)
  const [softwareLoading, setSoftwareLoading] = useState(false)
  const [softwareError, setSoftwareError] = useState("")
  const [softwarePage, setSoftwarePage] = useState(1)
  const [softwarePageSize, setSoftwarePageSize] = useState(DEFAULT_SOFTWARE_PAGE_SIZE)
  const [softwarePagination, setSoftwarePagination] = useState<HostPagination | null>(null)

  const loadHardware = useCallback(async (force = false) => {
    if (!host || (!force && hardware)) return

    setHardwareLoading(true)
    setHardwareError("")

    try {
      setHardware(await getHardwareInfo({
        tenantId: TENANT_ID,
        agentId: host.hostId,
        host,
      }))
    } catch (error) {
      setHardware(null)
      setHardwareError(error instanceof Error ? error.message : "加载硬件信息失败")
    } finally {
      setHardwareLoading(false)
    }
  }, [hardware, host])

  const loadSoftware = useCallback(async () => {
    if (!host) return

    setSoftwareLoading(true)
    setSoftwareError("")

    try {
      const result = await getHostSoftwareInfoPagination({
        tenantId: TENANT_ID,
        agentId: host.hostId,
        hostname: host.hostname,
        page: softwarePage,
        pageSize: softwarePageSize,
      })

      setSoftware(result.software)
      setSoftwarePagination(result.pagination)
    } catch (error) {
      setSoftware(null)
      setSoftwarePagination(null)
      setSoftwareError(error instanceof Error ? error.message : "加载软件信息失败")
    } finally {
      setSoftwareLoading(false)
    }
  }, [host, softwarePage, softwarePageSize])

  useEffect(() => {
    if (!isOpen || !host?.hostId) return

    setActiveTab("basic")
    setHardware(null)
    setHardwareError("")
    setSoftware(null)
    setSoftwareError("")
    setSoftwarePage(1)
    setSoftwarePageSize(DEFAULT_SOFTWARE_PAGE_SIZE)
    setSoftwarePagination(null)
  }, [host?.hostId, isOpen])

  useEffect(() => {
    if (!isOpen || activeTab !== "hardware") return
    void loadHardware()
  }, [activeTab, isOpen, loadHardware])

  useEffect(() => {
    if (!isOpen || activeTab !== "software") return
    void loadSoftware()
  }, [activeTab, isOpen, loadSoftware])

  if (!host) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="w-[80vw] max-w-none overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>
            <Computer className="mr-2 inline-block h-5 w-5 text-blue-600" />
            {host.hostname}
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6">
          <HostDetailsTabs
            host={host}
            hardware={hardware}
            software={software}
            activeTab={activeTab}
            hardwareLoading={hardwareLoading}
            hardwareError={hardwareError}
            softwareLoading={softwareLoading}
            softwareError={softwareError}
            softwarePagination={softwarePagination}
            softwarePageSize={softwarePageSize}
            onTabChange={setActiveTab}
            onRetryHardware={() => void loadHardware(true)}
            onRetrySoftware={() => void loadSoftware()}
            onSoftwarePageChange={setSoftwarePage}
            onSoftwarePageSizeChange={(pageSize) => {
              setSoftwarePageSize(pageSize)
              setSoftwarePage(1)
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
