"use client"

import { useState } from "react"
import { ConfigList } from "@/components/secconfig/ConfigList"
import { ConfigCreateDialog } from "@/components/secconfig/ConfigCreateDialog"
import { ConfigTable } from "@/components/secconfig/ConfigTable"
import { defaultConfigCategory } from "@/components/secconfig/data/defaultConfigCategory"
import type { ConfigCategory } from "@/components/secconfig/types/configItem"
import { Toaster } from "@/components/ui/toaster"
import { SlidersHorizontal } from "lucide-react"

export default function ConfigManagementPage() {
  const [categories, setCategories] = useState<ConfigCategory[]>(defaultConfigCategory)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const handleConfigChange = (updatedCategories: ConfigCategory[]) => {
    setCategories(updatedCategories)
  }

  const handleConfigSaved = () => {
    setRefreshTrigger((prev) => prev + 1)
    setShowCreateDialog(false)
  }

  const handleResetToDefault = () => {
    setCategories(
      defaultConfigCategory.map((category) => ({
        ...category,
        items: category.items.map((item) => ({ ...item, enabled: false })),
      })),
    )
  }

  const handleCreateConfig = () => {
    setShowCreateDialog(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <SlidersHorizontal className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">传感器配置</h1>
              <p className="text-sm text-gray-500 mt-1">Sensor Configuration</p>
            </div>
          </div>
        </div>

        {/* 配置项列表 */}
        <div className="w-full">
          <ConfigList
            categories={categories}
            onConfigChange={handleConfigChange}
            onCreateConfig={handleCreateConfig}         // 创建配置接口
            onResetToDefault={handleResetToDefault}     // 重置配置接口
          />
        </div>

        {/* 已保存的配置 */}
        <div className="mt-8 sm:mt-10 lg:mt-12 w-full">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">
            已保存的配置
          </h2>
          <ConfigTable refreshTrigger={refreshTrigger} />
        </div>
      </div>

      {/* 创建配置弹窗 */}
      <ConfigCreateDialog
        categories={categories}
        onConfigSaved={handleConfigSaved}
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <Toaster />
    </div>
  )
}
