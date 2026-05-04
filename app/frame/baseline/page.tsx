import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import OverviewCards from "@/features/baseline/dashboard/components/overview-cards"
import TrendChart from "@/features/baseline/dashboard/components/trend-chart"
import RiskChart from "@/features/baseline/dashboard/components/risk-chart"
import CategoryTable from "@/features/baseline/dashboard/components/category-table"
import { Shield, TrendingUp, BarChart3, Clock } from "lucide-react"
import { getTranslations } from "next-intl/server"

export default async function BaselineDashboardPage() {
  const t = await getTranslations("pages.baseline.dashboard")
  const lastCheckedTime = "2025/7/24 18:10:08"

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
              <h1 className="text-2xl font-semibold text-gray-900">{t("title")}</h1>
              <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4 text-blue-300" />
            <span>{t("lastChecked", { time: lastCheckedTime })}</span>
          </div>
        </div>

        {/* 总览指标卡片 - 参考原图的Today's Sales区域 */}
        <OverviewCards />

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 基线检查趋势图 */}
          <TrendChart />

          {/* 风险等级分布图 */}
          <RiskChart />
        </div>

        {/* 分类合规统计 - 参考原图的下半部分布局 */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-purple-300" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-medium text-gray-900">{t("categoryStats")}</CardTitle>
                    <CardDescription className="text-sm text-gray-500">{t("categoryStatsDescription")}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CategoryTable />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
