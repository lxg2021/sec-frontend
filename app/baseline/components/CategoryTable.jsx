"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Shield,
  Server,
  Users,
  Settings,
  Lock,
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import CountUp from "./CountUp"

const categoryData = [
  {
    id: "account",
    name: "账号策略",
    icon: Users,
    total: 245,
    compliant: 210,
    nonCompliant: 35,
    highRisk: 8,
    trend: "improving",
    lastUpdate: "2024-12-24 14:30:25",
    color: "from-slate-600 to-slate-700",
    darkColor: "from-slate-400 to-slate-500",
    items: [
      { name: "密码复杂度策略", status: "compliant", risk: "low", lastCheckTime: "2024-12-24 14:30:25", score: 95 },
      { name: "账号锁定策略", status: "compliant", risk: "low", lastCheckTime: "2024-12-24 14:28:15", score: 92 },
      {
        name: "密码过期策略",
        status: "non-compliant",
        risk: "medium",
        lastCheckTime: "2024-12-24 14:25:42",
        score: 68,
      },
      { name: "多因素认证", status: "non-compliant", risk: "high", lastCheckTime: "2024-12-24 14:22:18", score: 45 },
      { name: "账号权限审计", status: "compliant", risk: "low", lastCheckTime: "2024-12-24 14:20:33", score: 88 },
    ],
  },
  {
    id: "system",
    name: "系统设置",
    icon: Settings,
    total: 189,
    compliant: 165,
    nonCompliant: 24,
    highRisk: 3,
    trend: "stable",
    lastUpdate: "2024-12-24 14:18:45",
    color: "from-gray-600 to-gray-700",
    darkColor: "from-gray-400 to-gray-500",
    items: [
      { name: "系统日志配置", status: "compliant", risk: "low", lastCheckTime: "2024-12-24 14:18:45", score: 90 },
      { name: "防火墙规则", status: "compliant", risk: "medium", lastCheckTime: "2024-12-24 14:16:22", score: 85 },
      { name: "系统更新策略", status: "non-compliant", risk: "high", lastCheckTime: "2024-12-24 14:14:38", score: 42 },
      { name: "时间同步配置", status: "compliant", risk: "low", lastCheckTime: "2024-12-24 14:12:55", score: 94 },
      { name: "系统监控配置", status: "compliant", risk: "low", lastCheckTime: "2024-12-24 14:10:12", score: 91 },
    ],
  },
  {
    id: "permission",
    name: "权限控制",
    icon: Lock,
    total: 156,
    compliant: 134,
    nonCompliant: 22,
    highRisk: 5,
    trend: "improving",
    lastUpdate: "2024-12-24 14:08:27",
    color: "from-slate-700 to-gray-800",
    darkColor: "from-slate-300 to-gray-400",
    items: [
      { name: "文件权限设置", status: "compliant", risk: "low", lastCheckTime: "2024-12-24 14:08:27", score: 89 },
      { name: "目录访问控制", status: "compliant", risk: "medium", lastCheckTime: "2024-12-24 14:06:44", score: 82 },
      { name: "特权账号管理", status: "non-compliant", risk: "high", lastCheckTime: "2024-12-24 14:04:51", score: 38 },
      { name: "sudo权限配置", status: "compliant", risk: "medium", lastCheckTime: "2024-12-24 14:02:18", score: 76 },
      { name: "SSH访问控制", status: "non-compliant", risk: "high", lastCheckTime: "2024-12-24 14:00:35", score: 41 },
    ],
  },
  {
    id: "service",
    name: "服务配置",
    icon: Server,
    total: 298,
    compliant: 267,
    nonCompliant: 31,
    highRisk: 4,
    trend: "stable",
    lastUpdate: "2024-12-24 13:58:42",
    color: "from-gray-700 to-slate-800",
    darkColor: "from-gray-300 to-slate-400",
    items: [
      { name: "Web服务配置", status: "compliant", risk: "low", lastCheckTime: "2024-12-24 13:58:42", score: 93 },
      { name: "数据库服务配置", status: "compliant", risk: "medium", lastCheckTime: "2024-12-24 13:56:29", score: 87 },
      {
        name: "邮件服务配置",
        status: "non-compliant",
        risk: "medium",
        lastCheckTime: "2024-12-24 13:54:16",
        score: 64,
      },
      { name: "DNS服务配置", status: "compliant", risk: "low", lastCheckTime: "2024-12-24 13:52:33", score: 96 },
      { name: "FTP服务配置", status: "non-compliant", risk: "high", lastCheckTime: "2024-12-24 13:50:48", score: 35 },
    ],
  },
  {
    id: "network",
    name: "网络安全",
    icon: Shield,
    total: 167,
    compliant: 142,
    nonCompliant: 25,
    highRisk: 2,
    trend: "improving",
    lastUpdate: "2024-12-24 13:48:55",
    color: "from-slate-600 to-gray-700",
    darkColor: "from-slate-400 to-gray-500",
    items: [
      { name: "网络分段配置", status: "compliant", risk: "low", lastCheckTime: "2024-12-24 13:48:55", score: 91 },
      { name: "入侵检测系统", status: "compliant", risk: "medium", lastCheckTime: "2024-12-24 13:46:12", score: 84 },
      {
        name: "网络流量监控",
        status: "non-compliant",
        risk: "medium",
        lastCheckTime: "2024-12-24 13:44:28",
        score: 62,
      },
      { name: "VPN配置", status: "compliant", risk: "low", lastCheckTime: "2024-12-24 13:42:45", score: 88 },
      { name: "网络访问控制", status: "non-compliant", risk: "high", lastCheckTime: "2024-12-24 13:40:52", score: 47 },
    ],
  },
  {
    id: "database",
    name: "数据库安全",
    icon: Database,
    total: 192,
    compliant: 173,
    nonCompliant: 19,
    highRisk: 1,
    trend: "stable",
    lastUpdate: "2024-12-24 13:38:19",
    color: "from-gray-600 to-slate-700",
    darkColor: "from-gray-400 to-slate-500",
    items: [
      { name: "数据库访问控制", status: "compliant", risk: "low", lastCheckTime: "2024-12-24 13:38:19", score: 92 },
      { name: "数据加密配置", status: "compliant", risk: "medium", lastCheckTime: "2024-12-24 13:36:36", score: 86 },
      { name: "数据库审计", status: "non-compliant", risk: "medium", lastCheckTime: "2024-12-24 13:34:43", score: 71 },
      { name: "备份策略", status: "compliant", risk: "low", lastCheckTime: "2024-12-24 13:32:58", score: 95 },
      { name: "数据库版本管理", status: "compliant", risk: "low", lastCheckTime: "2024-12-24 13:30:15", score: 89 },
    ],
  },
]

export default function CategoryTable() {
  const [openCategories, setOpenCategories] = useState([])

  const toggleCategory = (categoryId) => {
    setOpenCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  const getComplianceRate = (compliant, total) => {
    return Math.round((compliant / total) * 100)
  }

  const getRiskBadgeColor = (risk) => {
    switch (risk) {
      case "high":
        return "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50"
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50"
      case "low":
        return "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50"
      default:
        return "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-600/50"
    }
  }

  const getStatusBadgeColor = (status) => {
    return status === "compliant"
      ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50"
      : "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50"
  }

  const getStatusIcon = (status) => {
    return status === "compliant" ? CheckCircle : XCircle
  }

  const getRiskIcon = (risk) => {
    switch (risk) {
      case "high":
        return AlertTriangle
      case "medium":
        return Shield
      case "low":
        return CheckCircle
      default:
        return Shield
    }
  }

  const getTrendIcon = (trend) => {
    return trend === "improving" ? TrendingUp : TrendingDown
  }

  const getScoreColor = (score) => {
    if (score >= 90) return "text-green-600 dark:text-green-400"
    if (score >= 70) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  const getScoreBarColor = (score) => {
    if (score >= 90) return "bg-green-500 dark:bg-green-400"
    if (score >= 70) return "bg-yellow-500 dark:bg-yellow-400"
    return "bg-red-500 dark:bg-red-400"
  }

  return (
    <div className="space-y-6">
      {categoryData.map((category, categoryIndex) => {
        const isOpen = openCategories.includes(category.id)
        const complianceRate = getComplianceRate(category.compliant, category.total)
        const TrendIcon = getTrendIcon(category.trend)

        return (
          <Collapsible key={category.id} open={isOpen} onOpenChange={() => toggleCategory(category.id)}>
            <Card
              className="border-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.005] rounded-xl overflow-hidden"
              style={{
                animationDelay: `${categoryIndex * 80}ms`,
              }}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 dark:hover:from-slate-700/50 dark:hover:to-gray-700/50 transition-all duration-300 border-b border-slate-200 dark:border-slate-600 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={`p-2 bg-gradient-to-br ${category.color} dark:bg-gradient-to-br dark:${category.darkColor} rounded-lg shadow-lg border border-slate-800/20 dark:border-slate-200/20 flex items-center justify-center relative overflow-hidden`}
                        >
                          {/* 增强对比度的背景层 */}
                          <div className="absolute inset-0 bg-black/10 dark:bg-black/30 rounded-lg" />
                          <category.icon className="h-4 w-4 text-white dark:text-slate-900 drop-shadow-sm relative z-10" />
                          {/* 内部高光效果 */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent dark:from-white/10 rounded-lg" />
                        </div>
                        <div className="flex flex-col justify-center">
                          <CardTitle className="text-base text-slate-700 dark:text-slate-200 font-bold leading-tight">
                            {category.name}
                          </CardTitle>
                          <div className="flex items-center space-x-4 mt-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              {category.items.length} 个检查项目
                            </p>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                              <span className="text-xs text-slate-500 dark:text-slate-400">{category.lastUpdate}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <TrendIcon
                                className={`h-3 w-3 ${category.trend === "improving" ? "text-green-600 dark:text-green-400" : "text-slate-600 dark:text-slate-400"}`}
                              />
                              <span
                                className={`text-xs font-medium ${category.trend === "improving" ? "text-green-600 dark:text-green-400" : "text-slate-600 dark:text-slate-400"}`}
                              >
                                {category.trend === "improving" ? "持续改善" : "保持稳定"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 uppercase tracking-wide">
                          总数
                        </div>
                        <CountUp
                          end={category.total}
                          duration={1200}
                          delay={categoryIndex * 100}
                          className="text-lg font-black text-slate-700 dark:text-slate-200"
                        />
                      </div>

                      <div className="text-center">
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 uppercase tracking-wide">
                          合规
                        </div>
                        <CountUp
                          end={category.compliant}
                          duration={1200}
                          delay={categoryIndex * 100 + 200}
                          className="text-lg font-black text-green-600 dark:text-green-400"
                        />
                      </div>

                      <div className="text-center">
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 uppercase tracking-wide">
                          不合规
                        </div>
                        <CountUp
                          end={category.nonCompliant}
                          duration={1200}
                          delay={categoryIndex * 100 + 400}
                          className="text-lg font-black text-yellow-600 dark:text-yellow-400"
                        />
                      </div>

                      <div className="text-center">
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 uppercase tracking-wide">
                          高风险
                        </div>
                        <CountUp
                          end={category.highRisk}
                          duration={1200}
                          delay={categoryIndex * 100 + 600}
                          className="text-lg font-black text-red-600 dark:text-red-400"
                        />
                      </div>

                      <div className="text-center min-w-[120px]">
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 uppercase tracking-wide">
                          合规率
                        </div>
                        <div className="mb-2">
                          <CountUp
                            end={complianceRate}
                            duration={1500}
                            delay={categoryIndex * 100 + 800}
                            suffix="%"
                            className={`text-lg font-black ${complianceRate >= 90 ? "text-green-600 dark:text-green-400" : complianceRate >= 70 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`}
                          />
                        </div>
                        <Progress
                          value={complianceRate}
                          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"
                          style={{
                            "--progress-background":
                              complianceRate >= 90 ? "#16a34a" : complianceRate >= 70 ? "#eab308" : "#dc2626",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="p-4">
                  <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-200/50 dark:border-slate-600/50 overflow-hidden shadow-md">
                    <Table className="border-separate border-spacing-0">
                      <TableHeader>
                        <TableRow className="border-b border-slate-200 dark:border-slate-600">
                          <TableHead className="font-bold text-slate-600 dark:text-slate-300 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 py-4 text-sm">
                            检查项名称
                          </TableHead>
                          <TableHead className="font-bold text-slate-600 dark:text-slate-300 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 py-4 text-sm">
                            合规状态
                          </TableHead>
                          <TableHead className="font-bold text-slate-600 dark:text-slate-300 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 py-4 text-sm">
                            风险等级
                          </TableHead>
                          <TableHead className="font-bold text-slate-600 dark:text-slate-300 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 py-4 text-sm">
                            安全评分
                          </TableHead>
                          <TableHead className="font-bold text-slate-600 dark:text-slate-300 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 py-4 text-sm">
                            最后检查时间
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {category.items.map((item, index) => {
                          const StatusIcon = getStatusIcon(item.status)
                          const RiskIcon = getRiskIcon(item.risk)

                          return (
                            <TableRow
                              key={index}
                              className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 dark:hover:from-slate-700/50 dark:hover:to-gray-700/50 transition-all duration-300 border-b border-slate-100 dark:border-slate-700"
                            >
                              <TableCell className="font-medium text-slate-700 dark:text-slate-200 py-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-2 h-2 bg-slate-500 dark:bg-slate-400 rounded-full animate-pulse" />
                                  <span className="text-sm">{item.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                <Badge
                                  className={`${getStatusBadgeColor(item.status)} font-medium border px-3 py-1 flex items-center space-x-1 w-fit text-xs rounded-lg shadow-sm`}
                                >
                                  <StatusIcon className="h-3 w-3" />
                                  <span>{item.status === "compliant" ? "合规" : "不合规"}</span>
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4">
                                <Badge
                                  className={`font-medium border px-3 py-1 flex items-center space-x-1 w-fit text-xs rounded-lg shadow-sm ${getRiskBadgeColor(item.risk)}`}
                                >
                                  <RiskIcon className="h-3 w-3" />
                                  <span>
                                    {item.risk === "high" ? "高风险" : item.risk === "medium" ? "中风险" : "低风险"}
                                  </span>
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="flex items-center space-x-2">
                                  <CountUp
                                    end={item.score}
                                    duration={1000}
                                    delay={categoryIndex * 100 + index * 50}
                                    className={`text-lg font-black ${getScoreColor(item.score)}`}
                                  />
                                  <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full transition-all duration-1000 ${getScoreBarColor(item.score)}`}
                                      style={{
                                        width: `${item.score}%`,
                                        transitionDelay: `${categoryIndex * 100 + index * 50 + 500}ms`,
                                      }}
                                    />
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                                  <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                                    {item.lastCheckTime}
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )
      })}
    </div>
  )
}
