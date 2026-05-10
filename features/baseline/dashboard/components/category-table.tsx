"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Eye, ListChecks, X } from "lucide-react"

import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Progress } from "@/shared/ui/progress"

import type { CategoryGroup } from "../api"
import CountUp from "./count-up"

interface CategoryTableProps {
  data: CategoryGroup[]
  baselineUUID: string
  loading?: boolean
}

function getCategoryLabel(category: CategoryGroup) {
  return category.category_zh || category.category || "未分类"
}

function getItemLabel(item: CategoryGroup["items"][number]) {
  return item.name_zh || item.name || item.item_id
}

function getAveragePassRate(category: CategoryGroup) {
  if (!category.items.length) return 0
  const total = category.items.reduce((sum, item) => sum + Number(item.passed_rate || 0), 0)
  return Math.round(total / category.items.length)
}

function severityClass(severity: string) {
  const normalized = severity.toLowerCase()
  if (normalized === "high") return "bg-red-50 text-red-700 border-red-200"
  if (normalized === "medium") return "bg-amber-50 text-amber-700 border-amber-200"
  return "bg-green-50 text-green-700 border-green-200"
}

export default function CategoryTable({ data, baselineUUID, loading = false }: CategoryTableProps) {
  const router = useRouter()
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedCategoryKey, setSelectedCategoryKey] = useState("")
  const itemsPerPage = 4

  const totalPages = Math.max(Math.ceil(data.length / itemsPerPage), 1)
  const currentPageData = data.slice(activeIndex * itemsPerPage, (activeIndex + 1) * itemsPerPage)
  const selectedCategory = useMemo(
    () => data.find((category) => category.category === selectedCategoryKey) ?? currentPageData[0] ?? null,
    [currentPageData, data, selectedCategoryKey],
  )

  useEffect(() => {
    setActiveIndex(0)
    setSelectedCategoryKey(data[0]?.category ?? "")
  }, [baselineUUID, data])

  const goToPrevious = () => {
    const newIndex = activeIndex === 0 ? totalPages - 1 : activeIndex - 1
    setActiveIndex(newIndex)
    setSelectedCategoryKey(data[newIndex * itemsPerPage]?.category ?? "")
  }

  const goToNext = () => {
    const newIndex = activeIndex === totalPages - 1 ? 0 : activeIndex + 1
    setActiveIndex(newIndex)
    setSelectedCategoryKey(data[newIndex * itemsPerPage]?.category ?? "")
  }

  const handleCategoryClick = (category: CategoryGroup) => {
    setSelectedCategoryKey(selectedCategoryKey === category.category ? "" : category.category)
  }

  const handleItemDetail = (category: CategoryGroup, item: CategoryGroup["items"][number]) => {
    const searchParams = new URLSearchParams({
      baseline_uuid: baselineUUID,
      category: category.category,
      item_id: item.item_id,
      item: getItemLabel(item),
    })
    router.push(`/frame/baseline/details?${searchParams.toString()}`)
  }

  if (loading) {
    return <div className="py-12 text-center text-sm text-gray-500">加载分类统计中...</div>
  }

  if (!data.length) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 py-12 text-center">
        <div className="text-lg font-medium text-gray-900">暂无分类统计</div>
        <div className="mt-2 text-sm text-gray-500">当前基线还没有可展示的分类检查项。</div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevious}
            className="h-8 w-8 rounded-full border-gray-300 bg-transparent hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center space-x-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setActiveIndex(index)
                  setSelectedCategoryKey(data[index * itemsPerPage]?.category ?? "")
                }}
                className={`h-2 rounded-full transition-all duration-200 ${
                  index === activeIndex ? "w-6 bg-blue-600" : "w-2 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNext}
            className="h-8 w-8 rounded-full border-gray-300 bg-transparent hover:bg-gray-50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-sm text-gray-500">
          {activeIndex + 1} / {totalPages} 页 · {data.length} 个分类
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {currentPageData.map((category, index) => {
          const passRate = getAveragePassRate(category)
          const isSelected = selectedCategory?.category === category.category

          return (
            <Card
              key={category.category}
              onClick={() => handleCategoryClick(category)}
              className={`relative cursor-pointer border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md ${
                isSelected ? "scale-[1.02] ring-2 ring-blue-500" : ""
              }`}
            >
              {isSelected && (
                <div className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
                  <Eye className="h-3 w-3 text-white" />
                </div>
              )}

              <CardContent className="p-4">
                <div className="flex flex-col items-center space-y-3">
                  <div className={`rounded-lg p-3 ${isSelected ? "bg-blue-100" : "bg-slate-50"}`}>
                    <ListChecks className={`h-6 w-6 ${isSelected ? "text-blue-600" : "text-slate-500"}`} />
                  </div>
                  <h3 className="line-clamp-2 min-h-10 text-center text-sm font-medium text-gray-900">
                    {getCategoryLabel(category)}
                  </h3>

                  <div className="text-center">
                    <div className="mb-1 text-2xl font-bold text-gray-900">
                      <CountUp end={passRate} duration={1200} delay={index * 80} suffix="%" />
                    </div>
                    <Badge variant="outline" className="border-blue-200 bg-blue-50 text-xs text-blue-700">
                      平均通过率
                    </Badge>
                  </div>

                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>检查项 {category.item_count}</span>
                      <span>{category.items.length} 项有结果</span>
                    </div>
                    <Progress value={passRate} className="h-2 w-full bg-gray-200" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selectedCategory && (
        <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
          <Card className="border-l-4 border-l-blue-500 border-gray-200 bg-white shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="rounded-lg bg-blue-50 p-3">
                    <ListChecks className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center space-x-2 text-lg font-medium text-gray-900">
                      <span>{getCategoryLabel(selectedCategory)}</span>
                      <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                        详情
                      </Badge>
                    </CardTitle>
                    <p className="mt-1 text-sm text-gray-500">
                      共 {selectedCategory.item_count} 个检查项，当前返回 {selectedCategory.items.length} 个统计结果
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="mb-1 text-2xl font-bold text-blue-900">
                      <CountUp end={getAveragePassRate(selectedCategory)} duration={1200} delay={100} suffix="%" />
                    </div>
                    <div className="text-sm text-gray-500">平均通过率</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedCategoryKey("")}
                    className="h-8 w-8 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="grid grid-cols-5 gap-4 rounded-lg border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs uppercase tracking-wide text-gray-500">
                  <div className="col-span-2">检查项名称</div>
                  <div>风险等级</div>
                  <div>通过率</div>
                  <div className="text-center">操作</div>
                </div>

                {selectedCategory.items.map((item, index) => (
                  <div
                    key={`${item.item_id}-${index}`}
                    className="grid grid-cols-5 items-center gap-4 rounded-lg border-b border-gray-100 px-4 py-4 transition-colors duration-200 last:border-b-0 hover:bg-blue-50"
                  >
                    <div className="col-span-2 text-sm font-medium text-gray-900">{getItemLabel(item)}</div>
                    <div>
                      <Badge variant="outline" className={`text-xs ${severityClass(item.severity)}`}>
                        {item.severity || "unknown"}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="h-2.5 flex-1 rounded-full bg-gray-200">
                        <div
                          className="h-2.5 rounded-full bg-blue-500 transition-all duration-1000"
                          style={{ width: `${Math.max(0, Math.min(100, item.passed_rate || 0))}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-xs text-gray-500">{(item.passed_rate || 0).toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleItemDetail(selectedCategory, item)}
                        className="h-7 border-blue-200 bg-blue-50 px-3 text-xs font-medium text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                      >
                        详情
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
