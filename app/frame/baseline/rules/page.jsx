"use client"

import HostSelector from "@/components/hosts/HostSelector"
import { mockData } from "@/data/mockData"
import { strategyMockData } from "@/data/strategyMockData"
import StrategySelector from "@/components/strategy/StrategySelector"
import { useState, useCallback } from "react"
import StrategyGuide from "@/components/strategy/StrategyGuide"
import ReviewCard from "@/components/review/ReviewCard"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function Page() {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-6 space-y-6">
      {/* 顶部 Header 区域 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">基线检查策略下发</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              帮助
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>策略下发指引</DialogTitle>
            </DialogHeader>
            <StrategyGuide />
          </DialogContent>
        </Dialog>
      </div>

      {/* 中部区域：主机选择 + 策略选择（上下） */}
      <div className="space-y-6">
        {/* 主机选择 */}
        <div>
          <HostSelector data={mockData} onSelectionChange={handleHostsSelectionChange} />
        </div>

        {/* 策略选择 */}
        <div>
          <StrategySelector
            data={strategyMockData}
            onSelectionChange={handleStrategySelectionChange}
            multiSelect={true}
          />
        </div>
      </div>

      {/* 底部区域：预览和下发 */}
      <div>
        <ReviewCard
          strategies={selectedStrategies}
          hosts={selectedNodes}
          onPreview={handlePreview}
          onDeploy={handleDeploy}
        />
      </div>
    </div>
  )
}
