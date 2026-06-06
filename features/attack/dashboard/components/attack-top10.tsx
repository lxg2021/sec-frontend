'use client'

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Trophy } from "lucide-react"
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

export default function AttackTop10({ top10 = [] as Top10Item[] }: { top10?: Top10Item[] }) {
  const router = useRouter()
  const DISPLAY_COUNT = 3 // 前 N 个主机

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
                <TableHead className="min-w-[100px]">技术</TableHead>
                <TableHead className="min-w-[200px]">名称</TableHead>
                <TableHead className="min-w-[120px]">阶段</TableHead>
                <TableHead className="min-w-[200px]">感染主机</TableHead>
                <TableHead className="min-w-[120px] text-right">感染主机数</TableHead>
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
                      <span className="text-gray-800 underline hover:text-blue-600 cursor-pointer">
                        {r.id}
                      </span>
                    </RuleInfoPopover>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-800">{r.name}</div>
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
                  <TableCell className="flex flex-wrap gap-2">
                    {/* 显示前 N 个主机 */}
                    {r.hosts.slice(0, DISPLAY_COUNT).map((host, index) => (
                      <span
                        key={`${r.rowKey}:host:${host}:${index}`}
                        className="text-sm text-blue-600 underline cursor-pointer"
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
                        <PopoverTrigger>
                          <span className="text-sm text-gray-500 cursor-pointer hover:text-blue-600">
                            +{r.hosts.length - DISPLAY_COUNT} more
                          </span>
                        </PopoverTrigger>
                        <PopoverContent className="max-h-64 w-56 overflow-auto rounded-lg shadow-lg p-2 bg-white">
                          <div className="text-xs font-medium text-gray-500 mb-1">更多主机</div>
                          {r.hosts.map((host, index) => (
                            <div
                              key={`${r.rowKey}:all-host:${host}:${index}`}
                              className="text-sm text-blue-600 underline cursor-pointer py-1 px-1 rounded hover:bg-blue-50"
                              onClick={() => handleHostClick(host)}
                            >
                              {host}
                            </div>
                          ))}
                        </PopoverContent>
                      </Popover>
                    )}
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
