"use client"

import { useState } from "react"
import Image from "next/image"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PatchList } from "./patch-list"
import { SelectedPatchPanel } from "./selected-patch-panel"
import { InstallTaskList } from "./install-task-list"
import type { SelectedPatchPool } from "@/lib/patchSelection"
import type { InstallTask } from "@/lib/taskInstall"
import { SystemType } from "@/lib/patch"
import { coverageInstallMockData } from "@/data/coverage-install-mock-data"

const systemIcons = {
  [SystemType.WINDOWS]: "/icons/system/windows.svg",
  [SystemType.MACOS]: "/icons/system/macos.svg",
  [SystemType.LINUX]: "/icons/system/linux.svg",
} as const

export function PatchManagementSystem() {
  const [selectedPatches, setSelectedPatches] = useState<SelectedPatchPool>({
    totalPatches: 0,
    totalHosts: 0,
    items: [],
  })
  const [installTasks, setInstallTasks] = useState<InstallTask[]>([])
  const [activeSystem, setActiveSystem] = useState<SystemType>(SystemType.WINDOWS)

  // patchGuid 唯一追加，自动用新项覆盖老项
  const handleAppendToSelection = (appendSelection: SelectedPatchPool) => {
    setSelectedPatches((prev) => {
      if (!appendSelection.items || !Array.isArray(appendSelection.items)) return prev

      // 用 Map 以 patchGuid 唯一化，后加的覆盖先加的
      const patchMap = new Map<string, typeof appendSelection.items[0]>(
        prev.items.map(item => [item.patch.patchGuid, item])
      )
      for (const item of appendSelection.items) {
        patchMap.set(item.patch.patchGuid, item)
      }
      const items = Array.from(patchMap.values())
      const totalPatches = items.length
      const totalHosts = items.reduce((sum, item) => sum + item.selectedHosts.length, 0)
      return { totalPatches, totalHosts, items }
    })
  }

  // PatchList 的批量选择只调用此事件，不允许在 useEffect/useMemo/render 触发
  const handleAddToSelection = (newSelection: SelectedPatchPool) => {
    handleAppendToSelection(newSelection)
  }

  // 事件（操作按钮）驱动的移除，事件里回调（非自动）
  const handleRemoveFromSelection = (patchGuid: string) => {
    setSelectedPatches((prev) => {
      const filteredItems = prev.items.filter(item => item.patch.patchGuid !== patchGuid)
      const totalPatches = filteredItems.length
      const totalHosts = filteredItems.reduce((sum, item) => sum + item.selectedHosts.length, 0)
      return { totalPatches, totalHosts, items: filteredItems }
    })
  }

  // 事件按钮驱动清空
  const handleClearSelection = () => {
    setSelectedPatches({ totalPatches: 0, totalHosts: 0, items: [] })
  }

  // 新任务创建
  const handleCreateTask = (task: InstallTask) => {
    setInstallTasks((prev) => [...prev, task])
    setSelectedPatches({ totalPatches: 0, totalHosts: 0, items: [] })
  }

  // 删除任务
  const handleDeleteTask = (taskId: string) => {
    setInstallTasks((prev) => prev.filter((task) => task.taskId !== taskId))
  }

  // 选中唯一的 patchGuid 列表（补丁列表多选同步）
  const selectedPatchGuids = new Set(selectedPatches.items.map(item => item.patch.patchGuid))

  return (
    <div className="space-y-6">
      {/* OS Tabs */}
      <div className="flex justify-center mb-6">
        <Tabs value={activeSystem} onValueChange={v => setActiveSystem(v as SystemType)} className="w-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value={SystemType.WINDOWS} className="flex items-center gap-2">
              <div className="w-5 h-5 relative">
                <Image
                  src={systemIcons[SystemType.WINDOWS] || "/placeholder.svg"}
                  alt="Windows 系统"
                  width={20}
                  height={20}
                  loading="lazy"
                  unoptimized
                />
              </div>
              <span>Windows</span>
            </TabsTrigger>
            <TabsTrigger value={SystemType.LINUX} className="flex items-center gap-2">
              <div className="w-5 h-5 relative">
                <Image
                  src={systemIcons[SystemType.LINUX] || "/placeholder.svg"}
                  alt="Linux 系统"
                  width={20}
                  height={20}
                  loading="lazy"
                  unoptimized
                />
              </div>
              <span>Linux</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Patch Management Section */}
      <div>
        <PatchList
          onSelectionChange={handleAddToSelection} // 只事件触发，不自动调用
          onRemoveSelection={handleRemoveFromSelection}
          onClearSelection={handleClearSelection}
          activeSystem={activeSystem}
          patchData={coverageInstallMockData.patches}
          selectedPatchGuids={selectedPatchGuids}
        />
      </div>

      {/* Selected Patches Section */}
      <div>
        <SelectedPatchPanel
          selectedPatches={selectedPatches}
          onCreateTask={handleCreateTask}
          onClearSelection={handleClearSelection}
          onAppendSelection={handleAppendToSelection}
          activeSystem={activeSystem}
        />
      </div>

      {/* Installation Tasks Section */}
      <div>
        <InstallTaskList tasks={installTasks} onDeleteTask={handleDeleteTask} />
      </div>
    </div>
  )
}
