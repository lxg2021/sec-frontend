"use client"

import { useState, useCallback } from "react"
import { HelpCircle, Shield, ShieldCheck  } from "lucide-react"

import HostSelector from "@/features/baseline/dispatch/components/host-selector"
import StrategySelector from "@/features/baseline/dispatch/components/strategy-selector"
import StrategyGuide from "@/features/baseline/dispatch/components/strategy-guide"
import ReviewCard from "@/features/baseline/dispatch/components/review-card"

import { mockData } from "@/features/baseline/dispatch/mock/host-tree"
import { strategyMockData } from "@/features/baseline/dispatch/mock/strategy"

import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog"
import { useTranslations } from "next-intl"

export default function Page() {
  const t = useTranslations("pages.baseline.rules")
  const [selectedNodes, setSelectedNodes] = useState([])
  const [selectedStrategies, setSelectedStrategies] = useState([])

  const handleHostsSelectionChange = useCallback((nodes, selectedIds) => {
    const newNodes = nodes.filter((node) => node.type === "host")
    setSelectedNodes(newNodes)
    console.log("选中的节点:", newNodes)
    console.log("选中的ID集合:", Array.from(selectedIds))
  }, [])

  const handleStrategySelectionChange = (strategies) => {
    setSelectedStrategies(strategies)
    console.log("选中的策略:", strategies)
  }

  const handlePreview = () => {
    console.log("预览确认")
    console.log("当前选中的主机:", selectedNodes)
    console.log("当前选中的策略:", selectedStrategies)
  }

  const handleDeploy = async (strategies, hosts) => {
    console.log("开始下发策略...")
    console.log("策略列表:", strategies)
    console.log("目标主机:", hosts)

    await new Promise((resolve) => setTimeout(resolve, 2000))
    const success = Math.random() > 0.2

    console.log("下发结果:", success ? "成功" : "失败")
    return success
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        {/* 顶部：标题与帮助 */}
        <div className="flex justify-between items-start">
          {/* 左侧标题 */}
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg mt-1">
              <ShieldCheck className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{t("title")}</h1>
              <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
            </div>
          </div>

          {/* 右侧帮助按钮 */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                {t("help")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{t("guideTitle")}</DialogTitle>
              </DialogHeader>
              <StrategyGuide />
            </DialogContent>
          </Dialog>
        </div>

        {/* 中部：主机选择和策略选择 */}
        <div className="space-y-6">
          <div>
            <HostSelector
              data={mockData}
              onSelectionChange={handleHostsSelectionChange}
            />
          </div>
          <div>
            <StrategySelector
              data={strategyMockData}
              onSelectionChange={handleStrategySelectionChange}
              multiSelect={true}
            />
          </div>
        </div>

        {/* 底部：预览与下发卡片 */}
        <div>
          <ReviewCard
            strategies={selectedStrategies}
            hosts={selectedNodes}
            onPreview={handlePreview}
            onDeploy={handleDeploy}
          />
        </div>
      </div>
    </div>
  )
}
