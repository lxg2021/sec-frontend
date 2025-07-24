"use client"

import { useState } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { Button } from "@/components/ui/button"
import { RotateCcw, Shield, AlertTriangle, CheckCircle, Activity } from "lucide-react"

const riskData = [
  {
    name: "低风险",
    value: 1068,
    color: "#16a34a", // 绿色
    percentage: 85.7,
    icon: CheckCircle,
    description: "系统运行正常",
    trend: "stable",
  },
  {
    name: "中风险",
    value: 156,
    color: "#eab308", // 黄色
    percentage: 12.5,
    icon: Shield,
    description: "需要关注监控",
    trend: "decreasing",
  },
  {
    name: "高风险",
    value: 23,
    color: "#dc2626", // 红色
    percentage: 1.8,
    icon: AlertTriangle,
    description: "立即处理修复",
    trend: "decreasing",
  },
]

export default function RiskChart() {
  const [activeIndex, setActiveIndex] = useState(null)
  const [animationKey, setAnimationKey] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleMouseEnter = (index) => {
    setActiveIndex(index)
  }

  const handleMouseLeave = () => {
    setActiveIndex(null)
  }

  const handleRefresh = () => {
    setIsAnimating(true)
    setAnimationKey((prev) => prev + 1)
    setTimeout(() => setIsAnimating(false), 1500)
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length && payload[0]?.payload) {
      const data = payload[0].payload
      const IconComponent = data.icon
      return (
        <div className="rounded-xl border border-slate-200 bg-white/95 backdrop-blur-xl p-4 shadow-xl animate-in fade-in-0 zoom-in-95 duration-200">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${data.color}20` }}>
                <IconComponent className="h-4 w-4" style={{ color: data.color }} />
              </div>
              <div>
                <span className="font-bold text-slate-700 text-sm">{data.name}</span>
                <p className="text-xs text-slate-400 mt-0.5">{data.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wide">检查项数量</span>
                <div className="font-bold text-lg text-slate-700 mt-0.5">{data.value?.toLocaleString() || 0}</div>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wide">占比</span>
                <div className="font-bold text-lg mt-0.5" style={{ color: data.color }}>
                  {data.percentage || 0}%
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-400 uppercase tracking-wide">趋势</span>
              <div className="flex items-center space-x-1">
                <Activity className="h-3 w-3 text-slate-500" />
                <span className="text-xs font-medium text-slate-500">
                  {data.trend === "decreasing" ? "持续下降" : "保持稳定"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  const CustomCell = ({ index, ...props }) => {
    const isActive = activeIndex === index
    const scale = isActive ? 1.05 : 1
    const opacity = activeIndex !== null && !isActive ? 0.7 : 1

    return (
      <Cell
        {...props}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center",
          transition: "all 0.3s ease",
          opacity: opacity,
          filter: isActive ? "drop-shadow(0 4px 8px rgba(0,0,0,0.15))" : "none",
        }}
      />
    )
  }

  const total = riskData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="space-y-4">
      {/* 控制面板 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isAnimating}
            className="h-8 px-3 bg-gradient-to-r from-slate-500 to-slate-600 border-slate-300 text-white hover:from-slate-600 hover:to-slate-700 shadow-md font-medium rounded-lg text-xs"
          >
            <RotateCcw className={`h-3 w-3 mr-1 ${isAnimating ? "animate-spin" : ""}`} />
            刷新数据
          </Button>
        </div>

        <div className="px-3 py-1 bg-white/40 backdrop-blur-xl rounded-lg border border-slate-200/50 shadow-md">
          <span className="text-slate-600 font-medium text-sm">总计: {total.toLocaleString()}</span>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="relative bg-white/30 backdrop-blur-xl rounded-xl p-4 border border-slate-200/50 shadow-lg">
        <ResponsiveContainer width="100%" height={250} key={animationKey}>
          <PieChart>
            <Pie
              data={riskData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={90}
              innerRadius={40}
              paddingAngle={0}
              dataKey="value"
              animationBegin={0}
              animationDuration={1200}
              onMouseEnter={(_, index) => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
            >
              {riskData.map((entry, index) => (
                <CustomCell key={`cell-${index}`} index={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* 中心统计 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50 shadow-md">
            <div className="text-2xl font-black text-slate-700 mb-1">{total.toLocaleString()}</div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">检查项总数</div>
          </div>
        </div>
      </div>
    </div>
  )
}
