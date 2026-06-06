"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/shared/ui/button"
import OverviewCard from "./overview-card"
import type { AttckStage } from "@/features/attack/utils/attck-utils"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { slugify } from "@/features/attack/utils/stage-color"
import { useTranslations } from "next-intl"
import { getAttckStageDefinition } from "@/features/attack/constants/attck-stages"

function stageIdentity(stage: AttckStage) {
  return stage.stageKey || slugify(stage.stage)
}

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
  const t = useTranslations("pages.attack.dashboard")
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
    const index = stages.findIndex((s) => stageIdentity(s) === selectedStageSlug)
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

  if (stages.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 px-6 py-10 text-center text-sm text-muted-foreground">
        {t("carousel.noData")}
      </div>
    )
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
            aria-label={t("carousel.previousPage")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                aria-label={t("carousel.pageAria", { page: index + 1 })}
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
            aria-label={t("carousel.nextPage")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-sm text-gray-500">
          {t("carousel.summary", { current: activeIndex + 1, total: totalPages, count: stages.length })}
        </div>
      </div>

      {/* 阶段卡片轮播 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {currentPageData.map((stage, idx) => {
          const slug = stageIdentity(stage)
          const isSelected = selectedStageSlug === slug
          const title = stage.stageKey && getAttckStageDefinition(stage.stageKey) ? t(`stages.${stage.stageKey}.label`) : stage.stage
          const description =
            stage.stageKey && getAttckStageDefinition(stage.stageKey)
              ? t(`stages.${stage.stageKey}.description`)
              : stage.description
          return (
            <OverviewCard
              key={slug || stage.stage || idx}
              stageKey={stage.stageKey}
              title={title}
              description={description}
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
