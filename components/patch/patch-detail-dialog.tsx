"use client"

import { useState } from "react"
import {
  CheckSquare,
  Square,
  ExternalLink,
  Calendar,
  Shield,
  Monitor,
  AlertTriangle,
  Download,
  Info,
  FileText,
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { PatchCoverageForInstall } from "@/lib/patchInstall"
import type { SelectedPatchPool, SelectedPatchItem } from "@/lib/patchSelection"
import type { PatchSeverity } from "@/lib/patch"
import Image from "next/image"
import { SystemType } from "@/lib/patch"

const systemIcons = {
  [SystemType.WINDOWS]: "/icons/system/windows.svg",
  [SystemType.MACOS]: "/icons/system/macos.svg",
  [SystemType.LINUX]: "/icons/system/linux.svg",
} as const

interface PatchDetailDialogProps {
  patch: PatchCoverageForInstall
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectionChange: (selection: SelectedPatchPool) => void
}

export function PatchDetailDialog({ patch, open, onOpenChange, onSelectionChange }: PatchDetailDialogProps) {
  const [selectedHosts, setSelectedHosts] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState("pending")
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

  const pendingHosts = patch.pendingHostList || []
  const installedHosts = patch.installedHostList || []
  const failedHosts = patch.failedHostList || []

  const getSeverityColor = (severity: PatchSeverity) => {
    switch (severity) {
      case "Critical":
        return "bg-red-500 text-white"
      case "Important":
        return "bg-orange-500 text-white"
      case "Moderate":
        return "bg-yellow-500 text-black"
      case "Low":
        return "bg-blue-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "INSTALLED":
        return <Shield className="h-4 w-4 text-green-600" />
      case "FAILED":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "RUNNING":
        return <Monitor className="h-4 w-4 text-blue-600" />
      default:
        return <Monitor className="h-4 w-4 text-orange-600" />
    }
  }

  const handleSelectAllPending = () => {
    const pendingHostIds = pendingHosts.map((host) => host.hostId)
    if (pendingHostIds.every((id) => selectedHosts.has(id))) {
      const newSelected = new Set(selectedHosts)
      pendingHostIds.forEach((id) => newSelected.delete(id))
      setSelectedHosts(newSelected)
    } else {
      const newSelected = new Set(selectedHosts)
      pendingHostIds.forEach((id) => newSelected.add(id))
      setSelectedHosts(newSelected)
    }
  }

  const handleRowClick = (hostId: string) => {
    setSelectedHosts((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(hostId)) {
        newSet.delete(hostId)
      } else {
        newSet.add(hostId)
      }
      return newSet
    })
  }

  const handleHostSelection = (hostId: string, checked: boolean) => {
    setSelectedHosts((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(hostId)
      } else {
        newSet.delete(hostId)
      }
      return newSet
    })
  }

  const handleAddToSelection = () => {
    const selectedHostList = pendingHosts.filter((host) => selectedHosts.has(host.hostId))
    if (selectedHostList.length === 0) return

    const selectedItem: SelectedPatchItem = {
      patch: {
        patchGuid: patch.item.patchGuid,
        title: patch.item.title,
        kbArticleIds: patch.item.kbArticleIds,
        securityLevel: patch.item.securityLevel,
        osPlatform: patch.item.osPlatform,
      },
      selectedHosts: selectedHostList,
    }

    const newSelection: SelectedPatchPool = {
      totalPatches: 1,
      totalHosts: selectedHostList.length,
      items: [selectedItem],
    }

    onSelectionChange(newSelection)
    setSelectedHosts(new Set())
    onOpenChange(false)
  }

  const selectedPendingCount = pendingHosts.filter((host) => selectedHosts.has(host.hostId)).length

  const getTruncatedDescription = (description: string, maxLength = 140) => {
    if (description.length <= maxLength) return description
    return description.substring(0, maxLength) + "..."
  }

  const shouldShowExpandButton = (description: string, maxLength = 140) => {
    return description.length > maxLength
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-[1100px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold line-clamp-2 text-balance">{patch.item.title}</h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4 text-blue-300 flex-shrink-0" />
                  <span>{patch.item.kbArticleIds.join(", ")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-blue-300 flex-shrink-0" />
                  <span>{new Date(patch.item.publishDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge
                    className={`${getSeverityColor(patch.item.securityLevel)} text-sm px-2 py-1`}
                    variant="secondary"
                  >
                    {patch.item.securityLevel}
                  </Badge>
                </div>
              </div>
            </div>
          </DialogTitle>

          {/* 紧跟标题/描述后插入 Badge 行 */}
          <div className="flex items-center gap-2 flex-wrap mt-0 mb-1">
            <Badge variant="outline" className="flex items-center gap-1 text-base px-2 py-0.5">
              <Image src="/icons/system/patchcategory.svg" alt="Patch Category" width={16} height={16} />
              {patch.item.patchCategory}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 text-base px-2 py-0.5">
              <Image
                src={systemIcons[patch.item.osPlatform as SystemType] || "/placeholder.svg"}
                alt={patch.item.osPlatform}
                width={16}
                height={16}
              />
              <span className="capitalize">{patch.item.osPlatform}</span>
            </Badge>
            {patch.item.isUninstallable && (
              <Badge variant="outline" className="flex items-center gap-1 text-base px-2 py-0.5">
                <Image src="/icons/system/uninstall.svg" alt="patch uninstall" width={16} height={16} />
                Uninstallable
              </Badge>
            )}
          </div>

          <DialogDescription>详细的补丁信息和主机部署状态</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6">
          <Card>
            <CardContent className="pt-1 pb-3 space-y-1">
              <div className="space-y-3">
                <div>
                  <p className="text-base leading-relaxed">
                    {isDescriptionExpanded ? patch.item.description : getTruncatedDescription(patch.item.description)}
                  </p>
                  {shouldShowExpandButton(patch.item.description) && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 mt-1"
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    >
                      {isDescriptionExpanded ? "Show less" : "Show more"}
                    </Button>
                  )}
                </div>

                <Separator></Separator>

                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Download className="h-4 w-4 text-blue-300 flex-shrink-0" />
                      <span className="font-medium">下载链接:</span>
                      <span className="text-blue-600 font-mono text-xs break-all">{patch.item.downloadURL}</span>
                    </div>
                    {patch.item.releaseNotes && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-green-300 flex-shrink-0" />
                        <span className="font-medium">发布公告:</span>
                        <span className="text-blue-600 font-mono text-xs break-all">{patch.item.releaseNotes}</span>
                      </div>
                    )}
                    {patch.item.moreInfoURL && (
                      <div className="flex items-center gap-2 text-sm">
                        <Info className="h-4 w-4 text-teal-300 flex-shrink-0" />
                        <span className="font-medium">更多URL:</span>
                        <span className="text-blue-600 font-mono text-xs break-all">{patch.item.moreInfoURL}</span>
                      </div>
                    )}
                    {patch.item.imageURL && (
                      <div className="flex items-center gap-2 text-sm">
                        <ExternalLink className="h-4 w-4 text-purple-300 flex-shrink-0" />
                        <span className="font-medium">镜像链接:</span>
                        <span className="text-blue-600 font-mono text-xs break-all">{patch.item.imageURL}</span>
                      </div>
                    )}
                    {patch.item.supportURL && (
                      <div className="flex items-center gap-2 text-sm">
                        <ExternalLink className="h-4 w-4 text-indigo-300 flex-shrink-0" />
                        <span className="font-medium">支持链接:</span>
                        <span className="text-blue-600 font-mono text-xs break-all">{patch.item.supportURL}</span>
                      </div>
                    )}
                  </div>
                </div>
                {patch.item.securityBulletinIds && patch.item.securityBulletinIds.length > 0 && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4 text-blue-400" />
                      <span className="font-medium">安全公告:</span>
                      <div className="flex gap-1 flex-wrap">
                        {patch.item.securityBulletinIds.slice(0, 3).map((bulletin) => (
                          <Badge key={bulletin} variant="secondary" className="text-xs">
                            {bulletin}
                          </Badge>
                        ))}
                        {patch.item.securityBulletinIds.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{patch.item.securityBulletinIds.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>主机安装状态</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pending" className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-orange-600" />
                    未安装 ({patch.pendingHosts})
                  </TabsTrigger>
                  <TabsTrigger value="installed" className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    已安装 ({patch.installedHosts})
                  </TabsTrigger>
                  <TabsTrigger value="failed" className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    安装失败 ({patch.failedHosts})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Button variant="outline" onClick={handleSelectAllPending} size="sm">
                      {pendingHosts.every((host) => selectedHosts.has(host.hostId)) ? (
                        <>
                          <CheckSquare className="h-4 w-4 text-blue-600" />
                          取消全选
                        </>
                      ) : (
                        <>
                          <Square className="h-4 w-4 mr-2" />
                          全部选中
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-18">选择</TableHead>
                          <TableHead>主机名</TableHead>
                          <TableHead>系统</TableHead>
                          <TableHead>状态</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingHosts.map((host) => {
                          const checked = selectedHosts.has(host.hostId)
                          return (
                            <TableRow
                              key={host.hostId}
                              className={`cursor-pointer ${checked ? "bg-muted/40" : ""}`}
                              onClick={() => handleRowClick(host.hostId)}
                              aria-selected={checked}
                            >
                              <TableCell
                                onClick={(e) => {
                                  e.stopPropagation()
                                }}
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(checked) => handleHostSelection(host.hostId, checked as boolean)}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{host.hostName}</TableCell>
                              <TableCell className="capitalize">{host.system}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(host.status)}
                                  <span className="capitalize">{host.status.toLowerCase()}</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-4">
                    <Button
                      onClick={handleAddToSelection}
                      disabled={selectedPendingCount === 0}
                      className="w-full h-11 bg-black text-white hover:bg-black/90 disabled:opacity-50 disabled:hover:bg-black disabled:cursor-not-allowed"
                    >
                      添加 {selectedPendingCount} 台主机到池中
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="installed" className="space-y-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>主机名</TableHead>
                          <TableHead>系统</TableHead>
                          <TableHead>状态</TableHead>
                          <TableHead>安装时间</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {installedHosts.map((host) => (
                          <TableRow key={host.hostId}>
                            <TableCell className="font-medium">{host.hostName}</TableCell>
                            <TableCell className="capitalize">{host.system}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(host.status)}
                                <span className="capitalize">{host.status.toLowerCase()}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {host.installedAt ? new Date(host.installedAt).toLocaleString() : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="failed" className="space-y-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>主机名</TableHead>
                          <TableHead>系统</TableHead>
                          <TableHead>状态</TableHead>
                          <TableHead>错误信息</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {failedHosts.map((host) => (
                          <TableRow key={host.hostId}>
                            <TableCell className="font-medium">{host.hostName}</TableCell>
                            <TableCell className="capitalize">{host.system}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(host.status)}
                                <span className="capitalize">{host.status.toLowerCase()}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-red-600">{host.errorMessage || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
