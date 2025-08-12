"use client"

import { useMemo, useState } from "react"
import AttckHeader from "@/components/attck/header"
import StageDetails from "@/components/attck/stage-details"
import OverviewCarousel from "@/components/attck/overview-carousel"
import StageHostDistributionChart from "@/components/charts/stage-host-distribution-chart"
import AttackTop10 from "@/components/charts/attack-top10"
import { attckData } from "@/data/attmock-data"
import { Shield, TrendingUp, BarChart3, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { slugify } from "@/lib/stageColor"


export default function AttckDashboardPage() {
  const data = attckData
  const [selectedStageSlug, setSelectedStageSlug] = useState(null)    /** 柱状图选择的标签 */

  const stages = data?.stages ?? []

  /**
   * 通过 selectedStageSlug 从 stages 中查找对应的阶段对象。
   * 当 selectedStageSlug 或 stages 发生变化时重新计算。
   * 若没有选中阶段，则返回 null
   * selectedStage: 返回null 或 选中的stage对象
   */
  const selectedStage = useMemo(() => {
    if (!selectedStageSlug) return null
    return stages.find((s) => slugify(s.stage) === selectedStageSlug) ?? null
  }, [selectedStageSlug, stages])

  /**
   * 阶段主机分布图的回调函数
   * 1. 用于触发setSelectedStageSlug(slug)，useMemo
   * 2. 返回selectedStage对象,用于更新StageDetails组件
   */
  function onSelectStage(stage) {
    const slug = slugify(stage.stage)
    setSelectedStageSlug(slug)
    const el = document.getElementById("stage-details")
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        {/* 页面头部 - 添加最后检查时间 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Shield className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">攻击溯源概览</h1>
              <p className="text-sm text-gray-500 mt-1">Attack Traceability Dashboard</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4 text-blue-300" />
            <span>最后检查时间: 2025/7/24 18:10:08</span>
          </div>
        </div>

        {/* 概览轮播组件 */}
        <AttckHeader data={data} />
      
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 攻击阶段主机分布图 */}
          <StageHostDistributionChart
            stages={stages}
            selectedStageSlug={selectedStageSlug}
            onSelectStage={onSelectStage}
          />

          {/* Attck TOP10 */}
          <AttackTop10 top10={data?.top10 ?? []} />
        </div>

        {/* Stage统计、详情 */}
        <div className="grid grid-cols-12 gap-6 border-0 shadow-lg">
          <div className="col-span-12">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-purple-300" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-medium text-gray-900">Attck Stage分类统计</CardTitle>
                    <CardDescription className="text-sm text-gray-500">按Stage分类查看详细情况</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* 轮播 */}
                <div>
                  <OverviewCarousel
                    stages={stages}
                    selectedStageSlug={selectedStageSlug}
                    onSelectStage={onSelectStage}
                  />
                </div>

                {/* 详情 */}
                <div className="mt-6" id="stage-details">
                  <StageDetails stage={selectedStage} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  )
}
