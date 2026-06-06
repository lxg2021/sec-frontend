'use client'

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Binary, Hash, Layers3, Monitor, Server, Trophy } from "lucide-react"
import { RuleInfoPopover } from "@/features/baseline/rules/components/rule-info-popover"
import type { Top10Item } from "@/features/attack/utils/attck-utils"
import { useRouter } from "next/navigation"
import { Popover, PopoverTrigger, PopoverContent } from "@/shared/ui/popover"

type Row = {
  rowKey: string
  id: string
  name: string
  ruleid: string
  hostCount: number
  stages: string[]
  hosts: string[]
}

function HeaderLabel({
  icon: Icon,
  label,
  color,
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

export default function AttackTop10({ top10 = [] as Top10Item[] }: { top10?: Top10Item[] }) {
  const router = useRouter()
  const DISPLAY_COUNT = 1 // 前 N 个主机

  const rows = useMemo<Row[]>(() => {
    const normalized = (top10 ?? []).map((t, index) => {
      const id = (t.attck || "").toUpperCase()
      const ruleid = t.ruleid || ""
      const name = t.name || ""
      const stages = Array.isArray(t.stages) && t.stages.length > 0 ? t.stages : t.stage ? [t.stage] : []

      return {
        rowKey: [ruleid, id, name, stages.join(","), index].filter(Boolean).join("::"),
        id,
        name,
        ruleid,
        hostCount: t["affected-hosts"] ?? 0,
        stages,
        hosts: t.hosts || [],
      }
    })
    normalized.sort((a, b) => b.hostCount - a.hostCount)
    return normalized.slice(0, 10)
  }, [top10])

  const handleHostClick = (host: string) => {
    router.push(`/hosts/${host}`)
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
            <Trophy className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
              ATT&amp;CK TOP10
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
                  <HeaderLabel icon={Binary} label="技术" />
                </TableHead>
                <TableHead className="w-[220px] min-w-[220px] max-w-[220px]">
                  <HeaderLabel icon={Hash} label="名称" />
                </TableHead>
                <TableHead className="min-w-[160px]">
                  <HeaderLabel icon={Layers3} label="阶段" />
                </TableHead>
                <TableHead className="min-w-[200px]">
                  <HeaderLabel icon={Monitor} label="感染主机" />
                </TableHead>
                <TableHead className="min-w-[120px] text-right">
                  <HeaderLabel icon={Server} label="主机数" align="right" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow
                  key={r.rowKey}
                  className="hover:bg-blue-50 cursor-pointer"
                  title={`查看 ${r.id} 详情`}
                >
                  <TableCell className="font-medium">
                    <RuleInfoPopover id={r.ruleid}>
                      <span
                        className="inline-flex cursor-pointer items-center font-mono text-sm font-semibold text-blue-600 transition-all duration-150 hover:-translate-y-0.5 hover:text-blue-800 hover:underline hover:decoration-blue-400 hover:underline-offset-4"
                        title="查看规则详情"
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
                        {r.stages.map((stage, index) => (
                          <span
                            key={`${r.rowKey}:stage:${stage}:${index}`}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                          >
                            {stage}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-800">—</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {/* 显示前 N 个主机 */}
                    <div className="flex min-w-0 items-center gap-2">
                      {r.hosts.slice(0, DISPLAY_COUNT).map((host, index) => (
                        <span
                          key={`${r.rowKey}:host:${host}:${index}`}
                          className="block max-w-[132px] cursor-pointer truncate text-sm text-slate-700 transition-colors hover:text-blue-700"
                          title={host}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleHostClick(host)
                          }}
                        >
                          {host}
                        </span>
                      ))}

                      {/* 超过 N 个的主机显示 Popover */}
                      {r.hosts.length > DISPLAY_COUNT && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex h-6 items-center rounded-full bg-blue-50 px-2 text-[11px] font-semibold leading-none text-blue-700 ring-1 ring-inset ring-blue-200 transition-colors hover:bg-blue-100 hover:text-blue-800"
                              onClick={(e) => e.stopPropagation()}
                              title={`查看全部 ${r.hosts.length} 台主机`}
                            >
                              +{r.hosts.length - DISPLAY_COUNT}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="max-h-64 w-64 overflow-auto rounded-lg bg-white p-2 shadow-lg">
                            <div className="mb-2 px-1 text-xs font-medium text-gray-500">全部感染主机</div>
                            <div className="space-y-1">
                              {r.hosts.map((host, index) => (
                                <button
                                  key={`${r.rowKey}:all-host:${host}:${index}`}
                                  type="button"
                                  className="flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-blue-700 transition-colors hover:bg-blue-50 hover:text-blue-900"
                                  title={host}
                                  onClick={() => handleHostClick(host)}
                                >
                                  <Monitor className="h-3.5 w-3.5 shrink-0 text-blue-500" aria-hidden="true" />
                                  <span className="block truncate">{host}</span>
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.hostCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {rows.length === 0 && <div className="text-sm text-muted-foreground py-6">暂无数据</div>}
      </CardContent>
    </Card>
  )
}
