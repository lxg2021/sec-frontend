'use client'

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Binary, Hash, Layers3, Loader2, Monitor, Server, Trophy } from "lucide-react"
import { RuleInfoPopover } from "@/features/baseline/rules/components/rule-info-popover"
import type { AttackHostRef, Top10Item } from "@/features/attack/utils/attck-utils"
import { Popover, PopoverTrigger, PopoverContent } from "@/shared/ui/popover"
import { useTranslations } from "next-intl"
import { getAttckStageDefinition, resolveAttckStage } from "@/features/attack/constants/attck-stages"
import { getHardwareInfo, getSingleHostDetail } from "@/features/assets/host/api"
import { HostInfoCard } from "@/features/assets/host/components/host-info-card"
import type { AgentHardwareInfo } from "@/features/assets/host/types/hardware"
import type { AgentInfo } from "@/features/assets/host/types/system-info"
import type { HostSelectorHostNode } from "@/shared/components/host-selector/types"
import { useToast } from "@/shared/hooks/use-toast"
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

type Row = {
  rowKey: string
  id: string
  name: string
  ruleid: string
  hostCount: number
  stages: string[]
  stageKeys: string[]
  hosts: AttackHostRef[]
  ruleMeta?: Top10Item["ruleMeta"]
}

function HeaderLabel({
  icon: Icon,
  label,
  align = "left",
}: {
  icon: typeof Trophy
  label: string
  align?: "left" | "right"
}) {
  return (
    <div className={`flex items-center gap-1.5 ${align === "right" ? "justify-end" : ""}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

function hostDisplayName(host: AttackHostRef) {
  return host.hostname || host.agentId
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

export default function AttackTop10({ top10 = [] as Top10Item[] }: { top10?: Top10Item[] }) {
  const t = useTranslations("pages.attack.dashboard")
  const { toast } = useToast()
  const [selectedHost, setSelectedHost] = useState<HostSelectorHostNode | null>(null)
  const [loadingHostId, setLoadingHostId] = useState<string | null>(null)
  const DISPLAY_COUNT = 1 // 前 N 个主机

  const rows = useMemo<Row[]>(() => {
    const normalized = (top10 ?? []).map((item, index) => {
      const id = (item.attck || "").toUpperCase()
      const ruleid = item.ruleid || ""
      const name = item.name || ""
      const stageKeys = Array.isArray(item.stageKeys) && item.stageKeys.length > 0 ? item.stageKeys : []
      const stages = Array.isArray(item.stages) && item.stages.length > 0 ? item.stages : item.stage ? [item.stage] : []
      const hosts = Array.isArray(item.hostItems) && item.hostItems.length > 0
        ? item.hostItems
        : (item.hosts || []).map((host) => ({ agentId: host, hostname: host }))

      return {
        rowKey: [ruleid, id, name, (stageKeys.length > 0 ? stageKeys : stages).join(","), index].filter(Boolean).join("::"),
        id,
        name,
        ruleid,
        hostCount: item["affected-hosts"] ?? 0,
        stages,
        stageKeys,
        hosts,
        ruleMeta: item.ruleMeta,
      }
    })
    normalized.sort((a, b) => b.hostCount - a.hostCount)
    return normalized.slice(0, 10)
  }, [top10])

  function stageLabel(stage: string) {
    if (!stage) return stage
    const definition = resolveAttckStage(stage) ?? getAttckStageDefinition(stage)
    return definition ? t(`stages.${definition.key}.label`) : stage
  }

  const handleHostClick = async (host: AttackHostRef) => {
    const agentId = host.agentId.trim()
    if (!agentId) {
      toast({
        title: "无法打开主机详情",
        description: "缺少主机 ID",
        variant: "destructive",
      })
      return
    }

    setLoadingHostId(agentId)
    try {
      const detail = await getSingleHostDetail({ agentId })
      if (!detail) {
        toast({
          title: "无法打开主机详情",
          description: `未查询到主机 ${hostDisplayName(host)} 的信息`,
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
        title: "主机详情加载失败",
        description: error instanceof Error ? error.message : `无法加载 ${hostDisplayName(host)}`,
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
            <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
              <Trophy className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
                {t("top10.title")}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">
                    <HeaderLabel icon={Binary} label={t("top10.technique")} />
                  </TableHead>
                  <TableHead className="w-[220px] min-w-[220px] max-w-[220px]">
                    <HeaderLabel icon={Hash} label={t("top10.name")} />
                  </TableHead>
                  <TableHead className="min-w-[160px]">
                    <HeaderLabel icon={Layers3} label={t("top10.stage")} />
                  </TableHead>
                  <TableHead className="min-w-[200px]">
                    <HeaderLabel icon={Monitor} label={t("top10.infectedHost")} />
                  </TableHead>
                  <TableHead className="w-[108px] min-w-[108px] px-0 text-center">
                    <div className="flex justify-center whitespace-nowrap">
                      <HeaderLabel icon={Server} label={t("top10.hostCount")} />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow
                    key={r.rowKey}
                    className="hover:bg-blue-50 cursor-pointer"
                    title={t("top10.viewDetail", { id: r.id })}
                  >
                    <TableCell className="font-medium">
                      <RuleInfoPopover id={r.ruleid} ruleMeta={r.ruleMeta}>
                        <span
                          className="inline-flex cursor-pointer items-center font-mono text-sm font-semibold text-blue-600 transition-all duration-150 hover:-translate-y-0.5 hover:text-blue-800 hover:underline hover:decoration-blue-400 hover:underline-offset-4"
                          title={t("top10.viewRuleDetail")}
                        >
                          {r.id}
                        </span>
                      </RuleInfoPopover>
                    </TableCell>
                    <TableCell>
                      <div className="w-[220px] truncate text-sm text-gray-800" title={r.name}>
                        {r.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {r.stages.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {(r.stageKeys.length > 0 ? r.stageKeys : r.stages).map((stage, index) => (
                            <span
                              key={`${r.rowKey}:stage:${stage}:${index}`}
                              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                            >
                              {stageLabel(stage)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-800">—</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-2">
                        {r.hosts.slice(0, DISPLAY_COUNT).map((host, index) => {
                          const displayName = hostDisplayName(host)
                          const loading = loadingHostId === host.agentId
                          return (
                            <button
                              key={`${r.rowKey}:host:${host.agentId || displayName}:${index}`}
                              type="button"
                              className="flex max-w-[132px] min-w-0 items-center gap-1 truncate text-sm text-slate-700 transition-colors hover:text-blue-700 disabled:cursor-wait disabled:opacity-70"
                              title={displayName}
                              disabled={loading}
                              onClick={(e) => {
                                e.stopPropagation()
                                void handleHostClick(host)
                              }}
                            >
                              {loading && <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden="true" />}
                              <span className="block truncate">{displayName}</span>
                            </button>
                          )
                        })}

                        {r.hosts.length > DISPLAY_COUNT && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex h-6 items-center rounded-full bg-blue-50 px-2 text-[11px] font-semibold leading-none text-blue-700 ring-1 ring-inset ring-blue-200 transition-colors hover:bg-blue-100 hover:text-blue-800"
                                onClick={(e) => e.stopPropagation()}
                                title={t("top10.viewAllHosts", { count: r.hosts.length })}
                              >
                                +{r.hosts.length - DISPLAY_COUNT}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="max-h-64 w-64 overflow-auto rounded-lg bg-white p-2 shadow-lg">
                              <div className="mb-2 px-1 text-xs font-medium text-gray-500">{t("top10.allInfectedHosts")}</div>
                              <div className="space-y-1">
                                {r.hosts.map((host, index) => {
                                  const displayName = hostDisplayName(host)
                                  const loading = loadingHostId === host.agentId
                                  return (
                                    <button
                                      key={`${r.rowKey}:all-host:${host.agentId || displayName}:${index}`}
                                      type="button"
                                      className="flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-blue-700 transition-colors hover:bg-blue-50 hover:text-blue-900 disabled:cursor-wait disabled:opacity-70"
                                      title={displayName}
                                      disabled={loading}
                                      onClick={() => void handleHostClick(host)}
                                    >
                                      {loading ? (
                                        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-blue-500" aria-hidden="true" />
                                      ) : (
                                        <Monitor className="h-3.5 w-3.5 shrink-0 text-blue-500" aria-hidden="true" />
                                      )}
                                      <span className="block truncate">{displayName}</span>
                                    </button>
                                  )
                                })}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-0 text-center tabular-nums">{r.hostCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {rows.length === 0 && <div className="text-sm text-muted-foreground py-6">{t("top10.noData")}</div>}
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
