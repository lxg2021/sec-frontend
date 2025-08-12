"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import OverviewCard from "./overview-card"
import type { AttckStage } from "@/lib/attck-utils"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { slugify } from "@/lib/stageColor"

function useResponsivePerPage() {
  const [perPage, setPerPage] = useState(4)
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth
      let newPerPage = 4
      if (w < 640) newPerPage = 1
      else if (w < 1024) newPerPage = 2
      else if (w < 1280) newPerPage = 3
      setPerPage((prev) => (prev !== newPerPage ? newPerPage : prev))
    }
    compute()
    window.addEventListener("resize", compute)
    return () => window.removeEventListener("resize", compute)
  }, [])
  return perPage
}

interface OverviewCarouselProps {
  stages: AttckStage[]
  selectedStageSlug: string | null
  onSelectStage: (stage: AttckStage) => void
}

export default function OverviewCarousel({
  stages,
  selectedStageSlug,
  onSelectStage,
}: OverviewCarouselProps) {
  const perPage = useResponsivePerPage()
  const totalPages = Math.max(1, Math.ceil(stages.length / perPage))
  const [activeIndex, setActiveIndex] = useState(0)

  // 保证 activeIndex 不超过最大页数
  useEffect(() => {
    const maxIndex = totalPages - 1
    setActiveIndex((idx) => Math.min(idx, maxIndex))
  }, [totalPages])

  // 外部选中时自动定位页
  useEffect(() => {
    if (!selectedStageSlug || !stages.length) return
    const index = stages.findIndex((s) => slugify(s.stage) === selectedStageSlug)
    if (index >= 0) {
      setActiveIndex(Math.floor(index / perPage))
    }
  }, [selectedStageSlug, stages, perPage])

  const currentPageData = useMemo(() => {
    const start = activeIndex * perPage
    return stages.slice(start, start + perPage)
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
          const slug = slugify(stage.stage)
          const isSelected = selectedStageSlug === slug
          return (
            <OverviewCard
              key={slug || stage.stage || idx}
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
