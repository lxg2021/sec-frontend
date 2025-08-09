"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Top10Item } from "@/lib/attck-utils"

type Row = {
  id: string
  name: string
  hostCount: number
  stage: string
  hosts: string[]
}

export default function AttackTop10({ top10 = [] as Top10Item[] }: { top10?: Top10Item[] }) {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<Row | null>(null)

  const rows = useMemo<Row[]>(() => {
    const normalized = (top10 ?? []).map((t) => ({
      id: (t.attck || "").toUpperCase(),
      name: t.name || "",
      hostCount: t["affected-hosts"] ?? 0,
      stage: t.stage || "",
      hosts: t.hosts || [],
    }))
    normalized.sort((a, b) => b.hostCount - a.hostCount)
    return normalized.slice(0, 10)
  }, [top10])

  function onRowClick(r: Row) {
    setCurrent(r)
    setOpen(true)
  }

  return (
    <>
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base md:text-lg">ATT&amp;CK TOP10</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">技术</TableHead>
                  <TableHead className="min-w-[200px]">名称</TableHead>
                  <TableHead className="min-w-[120px]">阶段</TableHead>
                  <TableHead className="min-w-[120px] text-right">感染主机数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow
                    key={r.id}
                    className="hover:bg-blue-50 cursor-pointer"
                    onClick={() => onRowClick(r)}
                    title={`查看 ${r.id} 详情`}
                  >
                    <TableCell className="font-medium">
                      <span className="text-gray-800">{r.id}</span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-800">{r.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-800">{r.stage || "—"}</div>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>技术详情占位</DialogTitle>
            <DialogDescription>
              即将跳转到 {current?.id ?? ""} 的技术详情页面（{current?.name ?? ""}）。当前为占位提示。
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  )
}
