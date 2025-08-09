"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import OverviewCard from "./overview-card"
import type { AttckStage } from "@/lib/attck-utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

function useResponsivePerPage() {
  const [perPage, setPerPage] = useState(4)
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth
      if (w < 640) setPerPage(1)
      else if (w < 1024) setPerPage(2)
      else if (w < 1280) setPerPage(3)
      else setPerPage(4)
    }
    compute()
    window.addEventListener("resize", compute)
    return () => window.removeEventListener("resize", compute)
  }, [])
  return perPage
}

export default function OverviewCarousel({
  stages,
  selectedStageSlug,
  onSelectStage,
}: {
  stages: AttckStage[]
  selectedStageSlug: string | null
  onSelectStage: (stage: AttckStage) => void
}) {
  const perPage = useResponsivePerPage()
  const totalPages = Math.max(1, Math.ceil((stages?.length || 0) / perPage))
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const maxIndex = Math.max(0, totalPages - 1)
    setActiveIndex((idx) => Math.min(idx, maxIndex))
  }, [perPage, stages, totalPages])

  // 新增：当外部选中 stage 时，自动定位到包含该卡片的页
  useEffect(() => {
    if (!selectedStageSlug || stages.length === 0) return
    const index = stages.findIndex(
      (s) =>
        s.stage
          .toLowerCase()
          .replace(/[^\p{L}\p{N}]+/gu, "-")
          .replace(/^-+|-+$/g, "") === selectedStageSlug,
    )
    if (index >= 0) {
      const targetPage = Math.floor(index / perPage)
      setActiveIndex(targetPage)
    }
  }, [selectedStageSlug, stages, perPage])

  const currentPageData = useMemo(() => {
    const start = activeIndex * perPage
    const end = start + perPage
    return stages.slice(start, end)
  }, [stages, activeIndex, perPage])

  function goToPrevious() {
    setActiveIndex((i) => (i - 1 + totalPages) % totalPages)
  }
  function goToNext() {
    setActiveIndex((i) => (i + 1) % totalPages)
  }

  return (
    <div className="w-full space-y-6">
      {/* 轮播图导航 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevious}
            className="h-8 w-8 rounded-full border-gray-300 hover:bg-gray-50 bg-transparent"
            aria-label="上一页"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                aria-label={`第 ${index + 1} 页`}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === activeIndex ? "bg-blue-600 w-6" : "bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNext}
            className="h-8 w-8 rounded-full border-gray-300 hover:bg-gray-50 bg-transparent"
            aria-label="下一页"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-sm text-gray-500">
          {activeIndex + 1} / {totalPages} 页 · 共 {stages.length} 个阶段
        </div>
      </div>

      {/* 阶段卡片轮播 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {currentPageData.map((stage, idx) => {
          const slug = stage.stage
            .toLowerCase()
            .replace(/[^\p{L}\p{N}]+/gu, "-")
            .replace(/^-+|-+$/g, "")
          const isSelected = selectedStageSlug === slug
          return (
            <OverviewCard
              key={slug || idx}
              title={stage.stage}
              description={stage.description}
              icon={stage.icon}
              count={stage.count}
              onClick={() => onSelectStage(stage)}
              selected={isSelected}
            />
          )
        })}
      </div>
    </div>
  )
}
