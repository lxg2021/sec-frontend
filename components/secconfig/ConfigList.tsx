"use client"
import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  RotateCcw,
  Plus,
  Search,
  Filter,
  Zap,
  Gauge,
  FolderOpen,
  Settings,
  ChevronDown,
  ChevronRight,
  Check,
  SquareCheckBig,
  SquareCheck,
  Square,
  Globe,
  CloudRain,
  HardDrive,
  Activity,
  Calendar,
  Monitor,
  Download,
  MessageCircle,
  Lock,
  Key,
  Shield,
  Terminal,
  Database,
  Bell,
  PlayCircle,
  Power,
  Cpu,
  Users,
  Cog,
  Radar,
  SlidersHorizontal,
} from "lucide-react"
import type { ConfigCategory } from "@/components/secconfig/types/configItem"

interface ConfigListProps {
  categories: ConfigCategory[]
  onConfigChange: (updatedCategories: ConfigCategory[]) => void
  onCreateConfig: () => void
  onResetToDefault: () => void
}

const getCategoryIcon = (categoryLabel: string) => {
  switch (categoryLabel) {
    case "事件过滤器":
      return <Zap className="w-4 h-4 text-yellow-500" />
    case "性能监视组":
      return <Gauge className="w-4 h-4 text-indigo-500" />
    case "文件组":
      return <FolderOpen className="w-4 h-4 text-green-600" />
    case "进程组":
      return <Cog className="w-4 h-4 text-purple-500" />
    case "网络组":
      return <Globe className="w-4 h-4 text-cyan-600" />
    case "服务组":
      return <CloudRain className="w-4 h-4 text-orange-500" />
    case "设备变更组":
      return <HardDrive className="w-4 h-4 text-rose-500" />
    case "镜像组":
      return <Activity className="w-4 h-4 text-blue-500" />
    case "Task计划任务组":
      return <Calendar className="w-4 h-4 text-emerald-500" />
    case "WMI组":
      return <Monitor className="w-4 h-4 text-teal-500" />
    case "Bits组":
      return <Download className="w-4 h-4 text-sky-500" />
    case "WindowsMessage组":
      return <MessageCircle className="w-4 h-4 text-pink-500" />
    case "EncryptDecrypt组":
      return <Lock className="w-4 h-4 text-red-500" />
    case "TokenPrivilege组":
      return <Key className="w-4 h-4 text-lime-600" />
    case "凭据组":
      return <Shield className="w-4 h-4 text-violet-500" />
    case "Powershell组":
      return <Terminal className="w-4 h-4 text-fuchsia-500" />
    case "注册表组":
      return <Database className="w-4 h-4 text-amber-600" />
    case "命名对象组":
      return <Bell className="w-4 h-4 text-red-400" />
    case "引导组":
      return <PlayCircle className="w-4 h-4 text-green-500" />
    case "账户组":
      return <Users className="w-4 h-4 text-cyan-700" />
    default:
      return <Settings className="w-4 h-4 text-gray-500" />
  }
}

export function ConfigList({ categories, onConfigChange, onCreateConfig, onResetToDefault }: ConfigListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  // 获取当前选中分类的图标
  const getSelectedCategoryIcon = () => {
    if (selectedCategory === "all") {
      return <Filter className="w-4 h-4 text-muted-foreground" />
    }
    
    const category = categories.find(cat => cat.label === selectedCategory)
    if (category) {
      return getCategoryIcon(category.label)
    }
    
    return <Filter className="w-4 h-4 text-muted-foreground" />
  }

  // 获取当前选中分类的显示名称
  const getSelectedCategoryName = () => {
    if (selectedCategory === "all") {
      return "所有分类"
    }
    
    const category = categories.find(cat => cat.label === selectedCategory)
    return category ? category.label : "所有分类"
  }

  /** 默认进程组展开，别的都收缩 */
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    categories.reduce(
      (acc, category) => ({ ...acc, [category.label]: category.label === "进程组" }),
      {},
    ),
  )

  const handleItemToggle = (categoryIndex: number, itemIndex: number) => {
    const updatedCategories = [...categories]
    updatedCategories[categoryIndex].items[itemIndex].enabled =
      !updatedCategories[categoryIndex].items[itemIndex].enabled
    onConfigChange(updatedCategories)
  }

  const handleSelectAll = (categoryIndex: number) => {
    const updatedCategories = [...categories]
    const category = updatedCategories[categoryIndex]
    const allEnabled = category.items.every((item) => item.enabled)

    // If all items are enabled, disable all; otherwise enable all
    category.items.forEach((item) => {
      item.enabled = !allEnabled
    })

    onConfigChange(updatedCategories)
  }

  const toggleCategoryExpansion = (categoryLabel: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryLabel]: !prev[categoryLabel],
    }))
  }

  const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0)
  const enabledItems = categories.reduce((sum, cat) => sum + cat.items.filter((item) => item.enabled).length, 0)

  const filteredCategories = categories
    .map((category) => ({
      ...category,
      items: category.items.filter(
        (item) =>
          item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    }))
    .filter(
      (category) => (selectedCategory === "all" || category.label === selectedCategory) && category.items.length > 0,
    )

  return (
    <Card className="border-0 shadow-lg">

      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* 图标块 */}
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg">
            <SlidersHorizontal className="h-5 w-5 text-white" />
          </div>

          {/* 标题 */}
          <div>
            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
              Sensor传感器配置
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              切换各个传感器监控组件的开启或关闭状态
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 头部区域 */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="pt-2">
              <span className="text-sm font-medium">
                <span className="text-red-500">{enabledItems}</span> / {totalItems} 已启用
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button variant="outline" size="sm" onClick={onResetToDefault} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              重置为默认
            </Button>
            <Button size="sm" onClick={onCreateConfig} className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4" />
              创建配置
            </Button>
          </div>
        </div>

        {/* 搜索和筛选区域 */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索配置项..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <div className="flex-1">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full [&_[data-role=select-value]]:hidden">
                <div className="flex items-center gap-2">
                  {getSelectedCategoryIcon()}
                  <span className="text-sm">
                    {getSelectedCategoryName()}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <span>所有分类</span>
                  </div>
                </SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.label} value={category.label}>
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(category.label)}
                      <span>{category.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 配置列表区域 */}
        <div className="space-y-4">
          {filteredCategories.map((category, categoryIndex) => {
            /* 找到当前分类在原始 categories 数据中的索引，方便操作原始数据 */
            const originalCategoryIndex = categories.findIndex((cat) => cat.label === category.label)

            /* 统计该分类中启用的条目数量 */
            const categoryEnabledCount = category.items.filter((item) => item.enabled).length

            /* 当前分类是否展开，用来控制显示/隐藏条目 */
            const isExpanded = expandedCategories[category.label]

            /* 判断该分类下的所有条目是否都启用，用于控制「全选/取消全选」按钮显示  */
            const allItemsEnabled = category.items.every((item) => item.enabled)

            return (
              <div key={category.label} className="border rounded-lg overflow-hidden">
                {/* 分类标题区域 */}
                <div
                  className="flex items-center justify-between p-4 bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer"
                  onClick={() => toggleCategoryExpansion(category.label)}
                >
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(category.label)}
                    <h3 className="font-medium text-foreground">{category.label}</h3>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                      {category.items.length} 种事件
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {categoryEnabledCount} 种启用
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* 分类内容区域 */}
                {isExpanded && (
                  <div className="p-4 space-y-3">
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAll(originalCategoryIndex);
                        }}
                        className="gap-2 h-8"
                      >
                        {allItemsEnabled ? (
                          <>
                            <SquareCheck className="w-4 h-4" />
                            取消全选
                          </>
                        ) : (
                          <>
                            <Square className="w-4 h-4" />
                            全选所有
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {category.items.map((item, itemIndex) => {
                        const originalItemIndex = categories[originalCategoryIndex].items.findIndex(
                          (origItem) => origItem.key === item.key,
                        )

                        return (
                          <div
                            key={item.key}
                            className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-accent/30 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <Switch
                                checked={item.enabled}
                                onCheckedChange={() => handleItemToggle(originalCategoryIndex, originalItemIndex)}
                                className="mt-0.5 data-[state=checked]:bg-primary"
                              />
                              <div className="space-y-1">
                                <span className="font-medium text-sm">
                                  {item.label}
                                </span>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {item.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span
                                className={`text-xs font-medium px-2 py-1 rounded-full min-w-[40px] text-center ${item.enabled
                                  ? "bg-primary/10 text-primary border border-primary/20"
                                  : "bg-muted text-muted-foreground"
                                  }`}
                              >
                                {item.enabled ? "已启用" : "已禁用"}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">未找到匹配的配置项目</p>
            <p className="text-sm mt-1">尝试调整搜索关键词或筛选条件</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}