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
        <div className="w-full">
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
