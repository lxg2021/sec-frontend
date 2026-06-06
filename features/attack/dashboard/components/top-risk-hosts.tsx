"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Layers3, Loader2, Monitor, ShieldAlert, Target } from "lucide-react"
import { useTranslations } from "next-intl"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

import { fetchTopAttackHosts } from "@/features/attack/dashboard/api"
import type { AttackTopHostItem } from "@/features/attack/dashboard/types"
import { getHardwareInfo, getSingleHostDetail } from "@/features/assets/host/api"
import { HostInfoCard } from "@/features/assets/host/components/host-info-card"
import type { AgentHardwareInfo } from "@/features/assets/host/types/hardware"
import type { AgentInfo } from "@/features/assets/host/types/system-info"
import type { HostSelectorHostNode } from "@/shared/components/host-selector/types"
import { useToast } from "@/shared/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { cn } from "@/shared/lib/utils"

interface TopRiskHostsProps {
  snapshotId?: string
  limit?: number
}

function HeaderLabel({
  icon: Icon,
  label,
  align = "left",
}: {
  icon: typeof ShieldAlert
  label: string
  align?: "left" | "center" | "right"
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5",
        align === "center" && "justify-center",
        align === "right" && "justify-end",
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

function displayHost(host: AttackTopHostItem) {
  return host.hostname || host.agent_id || "-"
}

function joinDisplay(values?: string[] | null) {
  return Array.isArray(values) && values.length > 0 ? values.join(", ") : "-"
}

function uniqueDisplay(values: string[]) {
  const normalized = Array.from(new Set(values.map((value) => value.trim()).filter((value) => value && value !== "-")))
  return normalized.length > 0 ? normalized.join(", ") : "-"
}

function formatMemory(hardware?: AgentHardwareInfo | null) {
  const totalMiB = hardware?.rams.reduce((sum, ram) => sum + (Number(ram.sizeMiB) || 0), 0) || 0
  if (totalMiB <= 0) return "-"
  if (totalMiB >= 1024) return `${Math.round((totalMiB / 1024) * 10) / 10} GB`
  return `${totalMiB} MB`
}

function toHostInfoNode(host: AgentInfo, hardware?: AgentHardwareInfo | null): HostSelectorHostNode {
  const cpuNames = uniqueDisplay(hardware?.cpu.sockets.map((cpu) => cpu.model) || [])
  const diskNames = uniqueDisplay(hardware?.disks.disks.map((disk) => disk.model) || [])

  return {
    id: `host:${host.hostId}`,
    type: "host",
    name: host.hostname || host.hostId,
    hostname: host.hostname || host.hostId,
    hostId: host.hostId,
    status: host.status,
    os: [host.osName, host.osVersion].filter(Boolean).join(" ") || host.osType || "-",
    ip: joinDisplay(host.ip),
    mac: joinDisplay(host.macs),
    cpu: cpuNames !== "-" ? cpuNames : host.cpuId || "-",
    memory: formatMemory(hardware),
    disk: diskNames !== "-" ? diskNames : joinDisplay(host.harddiskIds),
  }
}

function rankClassName(rank: number) {
  if (rank === 1) return "bg-red-50 text-red-600 ring-red-100"
  if (rank === 2) return "bg-orange-50 text-orange-600 ring-orange-100"
  if (rank === 3) return "bg-amber-50 text-amber-600 ring-amber-100"
  return "bg-slate-50 text-slate-500 ring-slate-100"
}

function riskClassName(score: number) {
  if (score >= 80) return "text-red-600"
  if (score >= 50) return "text-orange-600"
  return "text-slate-700"
}

export default function TopRiskHosts({ snapshotId, limit = 10 }: TopRiskHostsProps) {
  const t = useTranslations("pages.attack.dashboard")
  const { toast } = useToast()
  const [items, setItems] = useState<AttackTopHostItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedHost, setSelectedHost] = useState<HostSelectorHostNode | null>(null)
  const [loadingHostId, setLoadingHostId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadHosts() {
      setItems([])
      if (!snapshotId) return

      setLoading(true)
      try {
        const result = await fetchTopAttackHosts(snapshotId, limit)
        if (!cancelled) setItems(result)
      } catch (error) {
        console.error("load top attack hosts failed", error)
        if (!cancelled) {
          setItems([])
          toast({
            title: t("topRiskHosts.loadFailed"),
            description: error instanceof Error ? error.message : undefined,
            variant: "destructive",
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadHosts()

    return () => {
      cancelled = true
    }
  }, [limit, snapshotId, t, toast])

  const rows = useMemo(() => {
    return [...items].sort((a, b) => b.risk_score - a.risk_score).slice(0, limit)
  }, [items, limit])

  async function handleHostClick(host: AttackTopHostItem) {
    const agentId = host.agent_id.trim()
    if (!agentId) {
      toast({
        title: t("topRiskHosts.openFailed"),
        description: t("topRiskHosts.missingAgentId"),
        variant: "destructive",
      })
      return
    }

    setLoadingHostId(agentId)
    try {
      const detail = await getSingleHostDetail({ agentId })
      if (!detail) {
        toast({
          title: t("topRiskHosts.openFailed"),
          description: t("topRiskHosts.hostNotFound", { host: displayHost(host) }),
          variant: "destructive",
        })
        return
      }

      let hardware: AgentHardwareInfo | null = null
      try {
        hardware = await getHardwareInfo({ agentId, host: detail })
      } catch {
        hardware = null
      }

      setSelectedHost(toHostInfoNode(detail, hardware))
    } catch (error) {
      toast({
        title: t("topRiskHosts.openFailed"),
        description: error instanceof Error ? error.message : t("topRiskHosts.loadHostFailed"),
        variant: "destructive",
      })
    } finally {
      setLoadingHostId(null)
    }
  }

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-gradient-to-br from-rose-500 to-red-600 p-2">
              <ShieldAlert className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
                {t("topRiskHosts.title")}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 whitespace-nowrap text-center">
                    <span className="text-sm font-medium">#</span>
                  </TableHead>
                  <TableHead className="w-[30%] whitespace-nowrap">
                    <HeaderLabel icon={Monitor} label={t("topRiskHosts.host")} />
                  </TableHead>
                  <TableHead className="w-[76px] whitespace-nowrap text-right">
                    <HeaderLabel icon={ShieldAlert} label={t("topRiskHosts.riskScore")} align="right" />
                  </TableHead>
                  <TableHead className="w-[90px] whitespace-nowrap text-center">
                    <HeaderLabel icon={Target} label={t("topRiskHosts.rules")} align="center" />
                  </TableHead>
                  <TableHead className="w-[90px] whitespace-nowrap text-center">
                    <HeaderLabel icon={AlertTriangle} label={t("topRiskHosts.instances")} align="center" />
                  </TableHead>
                  <TableHead className="w-[90px] whitespace-nowrap text-center">
                    <HeaderLabel icon={Layers3} label={t("topRiskHosts.cases")} align="center" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => {
                  const rank = index + 1
                  const hostName = displayHost(row)
                  const loadingHost = loadingHostId === row.agent_id
                  return (
                    <TableRow key={`${row.agent_id || hostName}:${index}`} className="hover:bg-rose-50/50">
                      <TableCell className="text-center">
                        <span
                          className={cn(
                            "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-semibold ring-1 ring-inset",
                            rankClassName(rank),
                          )}
                        >
                          {rank}
                        </span>
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          className="flex w-full min-w-0 items-center gap-1.5 text-left text-sm text-slate-700 transition-colors hover:text-blue-700 disabled:cursor-wait disabled:opacity-70"
                          title={hostName}
                          disabled={loadingHost}
                          onClick={() => void handleHostClick(row)}
                        >
                          {loadingHost ? (
                            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-blue-500" aria-hidden="true" />
                          ) : (
                            <Monitor className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
                          )}
                          <span className="block truncate">{hostName}</span>
                        </button>
                      </TableCell>
                      <TableCell className={cn("text-right font-semibold tabular-nums", riskClassName(row.risk_score))}>
                        {row.risk_score}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">{row.total_rules}</TableCell>
                      <TableCell className="text-center tabular-nums">{row.total_instances}</TableCell>
                      <TableCell className="text-center tabular-nums">{row.total_cases}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          {loading && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t("topRiskHosts.loading")}
            </div>
          )}
          {!loading && rows.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">{t("topRiskHosts.noData")}</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedHost)} onOpenChange={(open) => { if (!open) setSelectedHost(null) }}>
        <DialogContent className="w-auto max-w-[600px] border-none p-0 shadow-xl">
          <DialogTitle className="m-0 h-0 overflow-hidden p-0">
            <VisuallyHidden>{selectedHost?.hostname || selectedHost?.hostId || "Host info"}</VisuallyHidden>
          </DialogTitle>
          {selectedHost && (
            <HostInfoCard
              node={selectedHost}
              className="m-0 border-none p-0 shadow-none"
              reserveCloseSpace
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
