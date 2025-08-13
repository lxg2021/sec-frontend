'use client'

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { type AttckStage, type Severity, badgeSeverityTextColor } from "@/lib/attck-utils"
import { getStageIconComponent, getStageIconBgStyle } from "@/lib/stageIcon"
import { getStageColor, slugify } from "@/lib/stageColor"
import { Inspect } from "lucide-react"
import { RuleInfoPopover } from "@/components/rules/RuleInfoPopover"

interface StageDetailsProps {
  stage?: AttckStage | null
}

const DISPLAY_COUNT = 3 // 前 N 个显示，其余 +N 弹出

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
  
  const handleHostClick = (host: string) => {
    router.push(`/hosts/${host}`)
  }

  if (!stage) {
    return (
      <Card className="shadow-md">
        <CardContent className="p-6 text-center text-muted-foreground">请选择一个阶段查看详情。</CardContent>
      </Card>
    )
  }

  const IconComponent = getStageIconComponent(stage?.icon)
  if (!IconComponent) console.warn("图标组件未找到", stage?.icon)

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
          {/* 查找区域 */}
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
                            <RuleInfoPopover id={d.ruleid || ""} side="right">
                              <span className="text-gray-800 underline hover:text-blue-600 cursor-pointer">
                                {id}
                              </span>
                            </RuleInfoPopover>
                          </TableCell>

                          <TableCell>
                            <div className="text-sm text-gray-800">{name}</div>
                          </TableCell>
                          <TableCell>
                            <ul className="list-disc list-inside space-y-1">
                              {d.indicators.map((ind, i) => (
                                <li key={i} className="text-sm">{ind}</li>
                              ))}
                            </ul>
                          </TableCell>
                          {/* 主机列改为 Popover 超过 DISPLAY_COUNT */}
                          <TableCell className="flex flex-wrap gap-2">
                            {/* 显示前 N 个主机 */}
                            {d.hosts.slice(0, DISPLAY_COUNT).map((host) => (
                              <span
                                key={host}
                                className="text-sm text-blue-600 underline cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation() // 阻止触发行点击
                                  handleHostClick(host)
                                }}
                                title={`查看主机 ${host}`}
                              >
                                {host}
                              </span>
                            ))}

                            {/* 超过 N 个主机显示 Popover */}
                            {d.hosts.length > DISPLAY_COUNT && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <span className="text-sm text-gray-500 cursor-pointer hover:text-blue-600">
                                    +{d.hosts.length - DISPLAY_COUNT} more
                                  </span>
                                </PopoverTrigger>
                                <PopoverContent className="max-h-60 w-48 overflow-auto rounded-lg shadow-lg p-2 bg-white">
                                  <div className="text-xs font-medium text-gray-500 mb-1">所有主机</div>
                                  {d.hosts.map((host) => (
                                    <div
                                      key={host}
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
    </>
  )
}

function extractTechniqueId(attck: string): string {
  const m = attck.match(/^([A-Z]\d+)/i)
  return m ? m[1].toUpperCase() : attck
}
