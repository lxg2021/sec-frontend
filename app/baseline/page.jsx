import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import OverviewCards from "./components/OverviewCards"
import TrendChart from "./components/TrendChart"
import RiskChart from "./components/RiskChart"
import CategoryTable from "./components/CategoryTable"
import { Shield, Activity, BarChart3, Database, Sparkles } from "lucide-react"

export default function BaselineDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-500/3 via-gray-500/3 to-slate-600/3" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-slate-400/8 to-gray-400/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-gray-400/8 to-slate-500/8 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-slate-400/6 to-gray-400/6 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="relative z-10 p-4 md:p-6 space-y-6">
        {/* 页面头部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="p-2 bg-gradient-to-br from-slate-600 to-gray-700 rounded-xl shadow-lg shadow-slate-500/25">
                  <Shield className="h-6 w-6 text-slate-200" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 p-0.5 bg-gradient-to-r from-slate-500 to-gray-600 rounded-full">
                  <Sparkles className="h-2 w-2 text-slate-200" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-700 via-gray-700 to-slate-800 bg-clip-text text-transparent leading-tight">
                  安全基线概览
                </h1>
                <p className="text-sm font-medium text-slate-500 mt-1">Security Baseline Dashboard</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="px-4 py-2 bg-white/40 backdrop-blur-xl rounded-lg border border-slate-200/50 shadow-md">
              <span className="text-slate-600 font-medium text-xs">最后更新: {new Date().toLocaleString("zh-CN")}</span>
            </div>
          </div>
        </div>

        {/* 1. 总览指标卡片 */}
        <section className="space-y-4">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-slate-600 to-gray-700 rounded-lg shadow-md">
              <BarChart3 className="h-4 w-4 text-slate-200" />
            </div>
            <h2 className="text-xl font-bold text-slate-700">核心指标概览</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-slate-300 to-transparent" />
          </div>
          <OverviewCards />
        </section>

        {/* 2. 图表区域 */}
        <section className="grid gap-6 lg:grid-cols-5">
          {/* 趋势图表 */}
          <div className="lg:col-span-3">
            <Card className="border-0 bg-white/50 backdrop-blur-xl shadow-xl shadow-slate-500/10 rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-gray-50 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-slate-600 to-gray-700 rounded-lg shadow-md">
                      <Activity className="h-4 w-4 text-slate-200" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-slate-700 font-bold">基线检查趋势</CardTitle>
                      <CardDescription className="text-slate-500 text-sm mt-1">
                        最近7天合规率变化趋势分析
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="px-3 py-1 bg-slate-100 rounded-lg border border-slate-200">
                      <span className="text-slate-600 font-medium text-sm">↗ +2.1%</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <TrendChart />
              </CardContent>
            </Card>
          </div>

          {/* 风险分布图 */}
          <div className="lg:col-span-2">
            <Card className="border-0 bg-white/50 backdrop-blur-xl shadow-xl shadow-slate-500/10 rounded-2xl overflow-hidden h-full">
              <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-gray-50 to-slate-50 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-gray-600 to-slate-700 rounded-lg shadow-md">
                    <Database className="h-4 w-4 text-slate-200" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-slate-700 font-bold">风险等级分布</CardTitle>
                    <CardDescription className="text-slate-500 text-sm mt-1">当前检查项风险统计</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <RiskChart />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 3. 分类合规统计 */}
        <section className="space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-slate-600 to-gray-700 rounded-lg shadow-md">
              <Database className="h-4 w-4 text-slate-200" />
            </div>
            <h2 className="text-xl font-bold text-slate-700">分类合规统计</h2>
            <div className="px-4 py-2 bg-white/40 backdrop-blur-xl rounded-lg border border-slate-200/50">
              <span className="text-slate-500 font-medium text-sm">按检查分类查看详细合规情况</span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-slate-300 to-transparent" />
          </div>
          <CategoryTable />
        </section>
      </div>
    </div>
  )
}
