"use client"

import { useState } from "react"
import { SoftUninstallProgressHeader } from "@/features/assets/software/components/soft-uninstall-progress-header"
import { SoftHostUninstallDetail } from "@/features/assets/software/components/soft-host-uninstall-detail"
import { mockUninstallProgressList } from "@/features/assets/software/mock/soft-uninstall-progress"
import { PackageMinus } from "lucide-react"
import { useTranslations } from "next-intl"

export default function Home() {
  const t = useTranslations("pages.assets.softwareUninstall")
  const [selectedTaskId, setSelectedTaskId] = useState<string>("")
  const selectedTask = selectedTaskId
    ? mockUninstallProgressList.find((task) => task.taskId === selectedTaskId)
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <PackageMinus className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{t("title")}</h1>
              <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
            </div>
          </div>
        </div>

        <SoftUninstallProgressHeader
          data={mockUninstallProgressList}
          selectedTaskId={selectedTaskId}
          onTaskSelect={setSelectedTaskId}
        />

        {selectedTask && (
          <div className="mt-6">
            <SoftHostUninstallDetail uninstallProgress={selectedTask} initialTab="all" />
          </div>
        )}
      </div>
    </div>
  )
}
