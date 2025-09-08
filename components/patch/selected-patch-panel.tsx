"use client"

import { useState } from "react"
import { Trash2, Plus, Package, Server } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { InstallTaskDialog } from "./install-task-dialog"
import type { SelectedPatchPool } from "@/types/patchSelection"
import type { InstallTask } from "@/types/taskInstall"
import type { PatchSeverity } from "@/types/patch"
import Image from "next/image"
import { SystemType } from "@/types/patch"

const systemIcons = {
  [SystemType.WINDOWS]: "/icons/system/windows.svg",
  [SystemType.MACOS]: "/icons/system/macos.svg",
  [SystemType.LINUX]: "/icons/system/linux.svg",
} as const

interface SelectedPatchPanelProps {
  selectedPatches: SelectedPatchPool
  onCreateTask: (task: InstallTask) => void
  onClearSelection: () => void
  onAppendSelection?: (selection: SelectedPatchPool) => void
  activeSystem: SystemType
}

export function SelectedPatchPanel({
  selectedPatches,
  onCreateTask,
  onClearSelection,
  onAppendSelection,
  activeSystem,
}: SelectedPatchPanelProps) {
  const [showTaskDialog, setShowTaskDialog] = useState(false)
  const [taskOperation, setTaskOperation] = useState<"INSTALL">("INSTALL")

  const filteredSelectedPatches = {
    ...selectedPatches,
    items: selectedPatches.items.filter((item) => item.patch.osPlatform === activeSystem),
    totalPatches: selectedPatches.items.filter((item) => item.patch.osPlatform === activeSystem).length,
    totalHosts: selectedPatches.items
      .filter((item) => item.patch.osPlatform === activeSystem)
      .reduce((total, item) => total + item.selectedHosts.length, 0),
  }

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

  const handleCreateInstallTask = () => {
    setTaskOperation("INSTALL")
    setShowTaskDialog(true)
  }

  const handleTaskCreated = (task: InstallTask) => {
    onCreateTask(task)
    setShowTaskDialog(false)
  }

  const isEmpty = filteredSelectedPatches.totalPatches === 0

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <span>选中的补丁与主机</span>
            </div>
            {!isEmpty && (
              <Button variant="ghost" size="sm" onClick={onClearSelection}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {isEmpty ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <div className="flex flex-col space-y-2">
                <p className="text-sm">没有补丁选择</p>
                <p className="text-xs">请从列表中选择补丁，创建安装任务</p>
              </div>
            </div>
          ) : (
            <>
              {/* Summary Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{filteredSelectedPatches.totalPatches}</div>
                  <div className="text-xs text-muted-foreground">补丁</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{filteredSelectedPatches.totalHosts}</div>
                  <div className="text-xs text-muted-foreground">主机</div>
                </div>
              </div>

              <Separator />

              {/* Selected Patches List */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Selected Items</h4>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {filteredSelectedPatches.items.map((item) => (
                      <div key={item.patch.patchGuid} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-medium leading-tight line-clamp-2">{item.patch.title}</h5>

                            {/** kbArticleIds, securityLevel */}
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {item.patch.kbArticleIds.join(", ")}
                              </Badge>
                              <Badge className={`text-xs ${getSeverityColor(item.patch.securityLevel)}`}>
                                {item.patch.securityLevel}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/** X台主机, osPlatform */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Server className="h-3 w-3 text-blue-600" />
                          <span>{item.selectedHosts.length} 台主机</span>
                          <span>•</span>
                          <div className="h-3 w-3 relative">
                            <Image
                              src={systemIcons[item.patch.osPlatform as SystemType] || "/placeholder.svg"}
                              alt={item.patch.osPlatform}
                              fill
                              className="object-contain"
                            />
                          </div>
                          <span className="capitalize">{item.patch.osPlatform}</span>
                        </div>

                        {/* Host List */}
                        {item.selectedHosts.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground">目标主机:</div>
                            <div className="flex flex-wrap gap-1">
                              {item.selectedHosts.slice(0, 3).map((host) => (
                                <Badge key={host.hostId} variant="secondary" className="text-xs">
                                  {host.hostName}
                                </Badge>
                              ))}
                              {item.selectedHosts.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{item.selectedHosts.length - 3} 更多
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button onClick={handleCreateInstallTask} className="w-full" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  创建安装任务
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {showTaskDialog && (
        <InstallTaskDialog
          selectedPatches={filteredSelectedPatches}
          operation={taskOperation}
          open={showTaskDialog}
          onOpenChange={setShowTaskDialog}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </>
  )
}
