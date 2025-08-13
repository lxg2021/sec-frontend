"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { type AttckStage, type Severity, badgeSeverityTextColor } from "@/lib/attck-utils"
import { getStageIconComponent, getStageIconBgStyle } from "@/lib/stageIcon"
import { getStageColor, slugify } from "@/lib/stageColor"
import { SearchCode, Layers, Inspect } from "lucide-react"

interface StageDetailsProps {
  stage?: AttckStage | null
}

export default function StageDetails({ stage }: StageDetailsProps) {
  const router = useRouter()
  const [techOpen, setTechOpen] = useState(false)
  const [techId, setTechId] = useState<string | null>(null)
  const [hostOpen, setHostOpen] = useState(false)
  const [hostName, setHostName] = useState<string | null>(null)

  const [techQuery, setTechQuery] = useState("")
  const [hostQuery, setHostQuery] = useState("")

  const details = stage?.details ?? []

  const rows = useMemo(() => {
    const tq = techQuery.trim().toLowerCase()
    const hq = hostQuery.trim().toLowerCase()
    return details.filter((d) => {
      const techText = `${d.attck} ${d.name ?? ""}`.toLowerCase()
      const hostText = (d.hosts ?? []).join(" ").toLowerCase()
      const techOk = tq ? techText.includes(tq) : true
      const hostOk = hq ? hostText.includes(hq) : true
      return techOk && hostOk
    })
  }, [details, techQuery, hostQuery])

  const handleOpenTech = (attckStr: string) => {
    const id = extractTechniqueId(attckStr)
    setTechId(id)
    setTechOpen(true)
  }

  const handleOpenHost = (name: string) => {
    setHostName(name)
    setHostOpen(true)
  }


  if (!stage) {
    return (
      <Card className="shadow-md">
        <CardContent className="p-6 text-center text-muted-foreground">请选择一个阶段查看详情。</CardContent>
      </Card>
    )
  }

  const IconComponent = getStageIconComponent(stage?.icon)

  if (!IconComponent) {
    console.warn("图标组件未找到", stage?.icon)
  }

  const slug = slugify(stage.stage)
  const color = getStageColor(slug)

  return (
    <>
      <Card className="bg-white border-gray-200 shadow-sm border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div
                className="p-2 flex items-center justify-center rounded-lg"
                style={getStageIconBgStyle(color)}
              >
                <IconComponent className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-lg md:text-xl font-semibold">{stage.stage} 详情</CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          {/* 查找区域：按 技术 与 主机 过滤 */}
          <div className="mb-6 flex flex-col lg:flex-row gap-4">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="搜索 ATT&CK 技术"
                  className="pl-9 w-full"
                  value={techQuery}
                  onChange={(e) => setTechQuery(e.target.value)}
                />
              </div>
              <div className="relative">
                <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="搜索主机"
                  className="pl-9 w-full"
                  value={hostQuery}
                  onChange={(e) => setHostQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-center lg:justify-end text-sm text-muted-foreground min-w-[200px]">
              结果：{rows.length} / {details.length}
            </div>
          </div>

          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">没有匹配的记录。</p>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <div className="min-w-full px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">ATT&CK 技术</TableHead>
                      <TableHead className="min-w-[200px]">名称</TableHead>
                      <TableHead className="min-w-[250px]">指标</TableHead>
                      <TableHead className="min-w-[200px]">受影响主机</TableHead>
                      <TableHead className="min-w-[100px]">严重性</TableHead>
                      <TableHead className="min-w-[120px] text-right">数据钻探</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((d, idx) => {
                      const id = extractTechniqueId(d.attck)
                      const name = d.name || d.attck.replace(/^([A-Z]\d+)\s*-\s*/i, "")
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            <button
                              className="text-sm text-gray-800 hover:text-blue-600 underline-offset-4 hover:underline transition-colors"
                              onClick={() => handleOpenTech(d.attck)}
                              title={`查看 ${id} 详情`}
                            >
                              {id}
                            </button>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-800">{name}</div>
                          </TableCell>
                          <TableCell>
                            <ul className="list-disc list-inside space-y-1">
                              {d.indicators.map((ind, i) => (
                                <li key={i} className="text-sm">
                                  {ind}
                                </li>
                              ))}
                            </ul>
                          </TableCell>
                          <TableCell>
                            <ul className="list-disc list-inside space-y-1">
                              {d.hosts.map((h, i) => (
                                <li key={i}>
                                  <button
                                    className="text-sm text-gray-800 hover:text-blue-600 underline-offset-4 hover:underline transition-colors"
                                    onClick={() => handleOpenHost(h)}
                                    title={`查看主机 ${h}`}
                                  >
                                    {h}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${badgeSeverityTextColor(d.severity as Severity)} font-normal`}>
                              {d.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push("/drill")}
                              className="h-8 w-8 p-0 hover:bg-blue-100 transition-colors"
                            >
                              <Inspect className="h-4 w-4 text-blue-600 hover:text-blue-800" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={techOpen} onOpenChange={setTechOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>技术详情占位</DialogTitle>
            <DialogDescription>
              即将跳转到 {techId ? `${techId}` : "该技术"} 的技术详情页面。当前为占位提示。
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={hostOpen} onOpenChange={setHostOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>主机详情占位</DialogTitle>
            <DialogDescription>即将跳转到主机 {hostName ?? ""} 的详情页面。当前为占位提示。</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  )
}

function extractTechniqueId(attck: string): string {
  const m = attck.match(/^([A-Z]\d+)/i)
  return m ? m[1].toUpperCase() : attck
}
