"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Progress } from "@/shared/ui/progress"
import { Button } from "@/shared/ui/button"
import { Shield, Server, Users, Settings, Lock, Database, ChevronLeft, ChevronRight, Eye, X } from "lucide-react"
import CountUp from "./count-up"

const categoryData = [
  {
    id: "account",
    name: "账号策略",
    icon: Users,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-300",
    total: 245,
    compliant: 210,
    nonCompliant: 35,
    items: [
      { id: "passwordComplexity", name: "密码复杂度策略", status: "合 规", score: 95 },
      { id: "accountLockout", name: "账号锁定策略", status: "合 规", score: 92 },
      { id: "passwordExpiration", name: "密码过期策略", status: "不合规", score: 68 },
      { id: "mfa", name: "多因素认证", status: "不合规", score: 45 },
      { id: "accountAudit", name: "账号权限审计", status: "合 规", score: 88 },
    ],
  },
  {
    id: "system",
    name: "系统设置",
    icon: Settings,
    iconBg: "bg-green-50",
    iconColor: "text-green-300",
    total: 189,
    compliant: 165,
    nonCompliant: 24,
    items: [
      { id: "systemLogging", name: "系统日志配置", status: "合 规", score: 90 },
      { id: "firewallRules", name: "防火墙规则", status: "合 规", score: 85 },
      { id: "systemUpdate", name: "系统更新策略", status: "不合规", score: 42 },
      { id: "timeSync", name: "时间同步配置", status: "合 规", score: 94 },
      { id: "systemMonitoring", name: "系统监控配置", status: "合 规", score: 91 },
    ],
  },
  {
    id: "permission",
    name: "权限控制",
    icon: Lock,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-300",
    total: 156,
    compliant: 134,
    nonCompliant: 22,
    items: [
      { id: "filePermissions", name: "文件权限设置", status: "合 规", score: 89 },
      { id: "directoryAccess", name: "目录访问控制", status: "合 规", score: 82 },
      { id: "privilegedAccounts", name: "特权账号管理", status: "不合规", score: 38 },
      { id: "sudoPermissions", name: "sudo权限配置", status: "合 规", score: 76 },
      { id: "sshAccess", name: "SSH访问控制", status: "不合规", score: 41 },
    ],
  },
  {
    id: "service",
    name: "服务配置",
    icon: Server,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-300",
    total: 298,
    compliant: 267,
    nonCompliant: 31,
    items: [
      { id: "webService", name: "Web服务配置", status: "合 规", score: 93 },
      { id: "databaseService", name: "数据库服务配置", status: "合 规", score: 87 },
      { id: "mailService", name: "邮件服务配置", status: "不合规", score: 64 },
      { id: "dnsService", name: "DNS服务配置", status: "合 规", score: 96 },
      { id: "ftpService", name: "FTP服务配置", status: "不合规", score: 35 },
    ],
  },
  {
    id: "network",
    name: "网络安全",
    icon: Shield,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-300",
    total: 167,
    compliant: 142,
    nonCompliant: 25,
    items: [
      { id: "networkSegmentation", name: "网络分段配置", status: "合 规", score: 91 },
      { id: "ids", name: "入侵检测系统", status: "合 规", score: 84 },
      { id: "trafficMonitoring", name: "网络流量监控", status: "不合规", score: 62 },
      { id: "vpnConfig", name: "VPN配置", status: "合 规", score: 88 },
      { id: "networkAccess", name: "网络访问控制", status: "不合规", score: 47 },
    ],
  },
  {
    id: "database",
    name: "数据库安全",
    icon: Database,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-300",
    total: 192,
    compliant: 173,
    nonCompliant: 19,
    items: [
      { id: "databaseAccess", name: "数据库访问控制", status: "合 规", score: 92 },
      { id: "dataEncryption", name: "数据加密配置", status: "合 规", score: 86 },
      { id: "databaseAudit", name: "数据库审计", status: "不合规", score: 71 },
      { id: "backupPolicy", name: "备份策略", status: "合 规", score: 95 },
      { id: "databaseVersion", name: "数据库版本管理", status: "合 规", score: 89 },
    ],
  },
]

export default function CategoryTable() {
  const t = useTranslations("pages.baseline.dashboard.categoryTable")
  const router = useRouter()
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState(categoryData[0]) // 改为默认选择第一个分类
  const [itemsPerPage] = useState(4) // 每页显示4个分类

  const getComplianceRate = (compliant, total) => {
    return Math.round((compliant / total) * 100)
  }

  const totalPages = Math.ceil(categoryData.length / itemsPerPage)
  const currentPageData = categoryData.slice(activeIndex * itemsPerPage, (activeIndex + 1) * itemsPerPage)

  const goToPrevious = () => {
    const newIndex = activeIndex === 0 ? totalPages - 1 : activeIndex - 1
    setActiveIndex(newIndex)
    // 获取新页面的第一个分类并设置为选中状态
    const newPageData = categoryData.slice(newIndex * itemsPerPage, (newIndex + 1) * itemsPerPage)
    setSelectedCategory(newPageData[0] || null)
  }

  const goToNext = () => {
    const newIndex = activeIndex === totalPages - 1 ? 0 : activeIndex + 1
    setActiveIndex(newIndex)
    // 获取新页面的第一个分类并设置为选中状态
    const newPageData = categoryData.slice(newIndex * itemsPerPage, (newIndex + 1) * itemsPerPage)
    setSelectedCategory(newPageData[0] || null)
  }

  const handleCategoryClick = (category) => {
    setSelectedCategory(selectedCategory?.id === category.id ? null : category)
  }

  const closeDetailView = () => {
    setSelectedCategory(null)
  }

  const handleItemDetail = (categoryId, itemName) => {
    // 跳转到详情页面，传递分类ID和项目名称作为URL参数
    const searchParams = new URLSearchParams({
      category: categoryId,
      item: itemName,
    })
    router.push(`/frame/baseline/details?${searchParams.toString()}`)
  }

  const getCategoryName = (category) => t(`categories.${category.id}`)
  const getItemName = (category, item) => t(`items.${category.id}.${item.id}`)
  const getStatusLabel = (status) => (status === "合 规" ? t("status.compliant") : t("status.nonCompliant"))
  const getRatingLabel = (rate) => {
    if (rate >= 90) return t("rating.excellent")
    if (rate >= 80) return t("rating.good")
    if (rate >= 70) return t("rating.average")
    if (rate >= 60) return t("rating.poor")
    return t("rating.needsImprovement")
  }

  return (
    <div className="w-full space-y-6">
      {/* 轮播图导航 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevious}
            className="h-8 w-8 rounded-full border-gray-300 hover:bg-gray-50 bg-transparent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center space-x-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${index === activeIndex ? "bg-blue-600 w-6" : "bg-gray-300 hover:bg-gray-400"
                  }`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNext}
            className="h-8 w-8 rounded-full border-gray-300 hover:bg-gray-50 bg-transparent"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          {selectedCategory && (
            <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              <Eye className="h-4 w-4" />
              <span>{t("viewing", { name: getCategoryName(selectedCategory) })}</span>
            </div>
          )}
          <div className="text-sm text-gray-500">
            {t("pageSummary", { current: activeIndex + 1, total: totalPages, count: categoryData.length })}
          </div>
        </div>
      </div>

      {/* 分类卡片轮播 */}
      <div className="grid grid-cols-4 gap-4">
        {currentPageData.map((category, index) => {
          const complianceRate = getComplianceRate(category.compliant, category.total)
          const IconComponent = category.icon
          const isSelected = selectedCategory?.id === category.id

          return (
            <Card
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className={`bg-white border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer group relative ${isSelected ? "ring-2 ring-blue-500 shadow-lg scale-105" : ""
                }`}
            >
              {/* 选中指示器 */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center z-10">
                  <Eye className="h-3 w-3 text-white" />
                </div>
              )}

              <CardContent className="p-4">
                <div className="flex flex-col items-center space-y-3">
                  {/* 图标和标题 */}
                  <div className="flex flex-col items-center space-y-2">
                    <div
                      className={`p-3 rounded-lg transition-colors ${isSelected ? "bg-blue-100" : `${category.iconBg} group-hover:bg-blue-50`
                        }`}
                    >
                      <IconComponent
                        className={`h-6 w-6 transition-colors ${isSelected ? "text-blue-600" : `${category.iconColor} group-hover:text-blue-600`
                          }`}
                      />
                    </div>
                    <h3
                      className={`text-sm font-medium text-center transition-colors ${isSelected ? "text-blue-900" : "text-gray-900"
                        }`}
                    >
                      {getCategoryName(category)}
                    </h3>
                  </div>

                  {/* 合规率 */}
                  <div className="text-center">
                    <div
                      className={`text-2xl font-bold mb-1 transition-colors ${isSelected ? "text-blue-900" : "text-gray-900"
                        }`}
                    >
                      <CountUp end={complianceRate} duration={1500} delay={index * 100} suffix="%" />
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs px-2 py-1 border transition-colors ${isSelected
                          ? "bg-blue-100 text-blue-700 border-blue-300"
                          : complianceRate >= 90
                            ? "bg-green-50 text-green-700 border-green-200"
                            : complianceRate >= 80
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-orange-50 text-orange-700 border-orange-200"
                        }`}
                    >
                      {t("complianceRate")}
                    </Badge>
                  </div>

                  {/* 统计信息 */}
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{t("total", { total: category.total })}</span>
                      <span>{t("compliant", { count: category.compliant })}</span>
                    </div>
                    <Progress value={complianceRate} className="w-full h-2 bg-gray-200">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${isSelected
                            ? "bg-blue-500"
                            : complianceRate >= 90
                              ? "bg-green-500"
                              : complianceRate >= 80
                                ? "bg-blue-500"
                                : "bg-orange-500"
                          }`}
                        style={{
                          width: `${complianceRate}%`,
                          transitionDelay: `${index * 100 + 300}ms`,
                        }}
                      />
                    </Progress>
                  </div>

                  {/* 状态评级 */}
                  <div className="text-xs text-gray-500 text-center">
                    {getRatingLabel(complianceRate)}
                  </div>

                  {/* 点击提示 */}
                  <div
                    className={`text-xs transition-opacity ${isSelected ? "text-blue-600 opacity-100" : "text-gray-400 opacity-0 group-hover:opacity-100"
                      }`}
                  >
                    {isSelected ? t("collapseDetails") : t("viewDetails")}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 详细检查项列表 - 只在选中分类时显示 */}
      {selectedCategory && (
        <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
          <Card className="bg-white border-gray-200 shadow-sm border-l-4 border-l-blue-500">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 ${selectedCategory.iconBg} rounded-lg`}>
                    {selectedCategory.icon && (
                      <selectedCategory.icon className={`h-6 w-6 ${selectedCategory.iconColor}`} />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-900 font-medium flex items-center space-x-2">
                      <span>{getCategoryName(selectedCategory)}</span>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {t("details")}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {t("detailSummary", { items: selectedCategory.items.length, compliant: selectedCategory.compliant })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-900 mb-1">
                      <CountUp
                        end={getComplianceRate(selectedCategory.compliant, selectedCategory.total)}
                        duration={1500}
                        delay={200}
                        suffix="%"
                        className="text-blue-900"
                      />
                    </div>
                    <div className="text-sm text-gray-500">{t("complianceRate")}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={closeDetailView}
                    className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {/* 表头 - 5列布局，详情按钮在独立的第5列 */}
                <div className="grid grid-cols-5 gap-4 text-xs text-gray-500 uppercase tracking-wide py-3 px-4 bg-gray-50 rounded-lg border-b border-gray-200">
                  <div className="col-span-1">{t("checkItemName")}</div>
                  <div className="col-span-1">{t("complianceStatus")}</div>
                  <div className="col-span-1">{t("securityScore")}</div>
                  <div className="col-span-1">{t("scoreProgress")}</div>
                  <div className="col-span-1 text-center">{t("detailAction")}</div>
                </div>

                {/* 数据行 - 5列布局，详情按钮在独立的第5列 */}
                {selectedCategory.items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-5 gap-4 items-center py-4 px-4 hover:bg-blue-50 rounded-lg transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* 第1列：检查项名称 */}
                    <div className="col-span-1 text-sm text-gray-900 font-medium">{getItemName(selectedCategory, item)}</div>

                    {/* 第2列：合规状态 */}
                    <div className="col-span-1 flex items-center">
                      <Badge
                        variant="outline"
                        className="text-xs border bg-gray-100 text-black border-gray-200 w-20 h-6 flex items-center justify-center whitespace-nowrap"
                        style={{
                          letterSpacing: item.status === "合 规" ? "0.2em" : "0.05em",
                          fontFamily: "monospace",
                          lineHeight: "1",
                        }}
                      >
                        {getStatusLabel(item.status)}
                      </Badge>
                    </div>

                    {/* 第3列：安全评分 */}
                    <div className="col-span-1 text-sm font-semibold text-gray-900">
                      <CountUp end={item.score} duration={1000} delay={index * 100 + 500} />
                    </div>

                    {/* 第4列：评分进度 */}
                    <div className="col-span-1 flex items-center space-x-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full transition-all duration-1000 bg-blue-500"
                          style={{
                            width: `${item.score}%`,
                            transitionDelay: `${index * 100 + 700}ms`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-10 text-right">{item.score}%</span>
                    </div>

                    {/* 第5列：详情按钮 - 独立的一列 */}
                    <div className="col-span-1 flex items-center justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleItemDetail(selectedCategory.id, item.name)}
                        className="h-7 px-3 text-xs bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700 transition-colors duration-200 font-medium"
                      >
                        {t("details")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 空状态提示 */}
      {!selectedCategory && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="flex flex-col items-center space-y-3">
            <div className="p-4 bg-gray-100 rounded-full">
              <Eye className="h-8 w-8 text-gray-400" />
            </div>
            <div className="text-lg font-medium text-gray-900">{t("emptyTitle")}</div>
            <div className="text-sm text-gray-500 max-w-md">
              {t("emptyDescription")}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
