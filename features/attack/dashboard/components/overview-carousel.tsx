"use client"

import type { AttckStage } from "@/features/attack/utils/attck-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Eye } from "lucide-react"
import { useTranslations } from "next-intl"
import { getAttckStageDefinition } from "@/features/attack/constants/attck-stages"
import { getStageColor, slugify } from "@/features/attack/utils/stage-color"
import { getStageIconBgStyle, getStageIconComponent } from "@/features/attack/utils/stage-icon"

function stageIdentity(stage: AttckStage) {
  return stage.stageKey || slugify(stage.stage)
}

interface StageCardProps {
  stageKey?: string
  title: string
  description: string
  icon?: string
  count: number
  onClick?: () => void
  selected?: boolean
}

function StageCard({
  stageKey,
  title,
  description,
  icon,
  count,
  onClick,
  selected = false,
}: StageCardProps) {
  const slug = stageKey || slugify(title)
  const color = getStageColor(slug)
  const IconComponent = getStageIconComponent(icon)

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      aria-pressed={selected}
      title={description}
    >
      {selected && (
        <div className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
          <Eye className="h-3 w-3 text-white" />
        </div>
      )}

      <Card
        className={`relative overflow-hidden rounded-lg border-0 bg-transparent shadow-none transition-shadow transition-transform duration-300 hover:-translate-y-1 hover:scale-105 ${
          selected ? "ring-2 ring-blue-500 shadow-lg" : ""
        }`}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-5"
          style={{
            background: `linear-gradient(to bottom right, ${color}, ${color}cc)`,
          }}
        />

        <CardHeader className="relative z-10 flex flex-row items-center justify-between px-6 pt-6 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {title}
          </CardTitle>
          <div
            className="flex items-center justify-center rounded-lg p-2"
            style={getStageIconBgStyle(color)}
          >
            <IconComponent className="h-5 w-5 text-white" />
          </div>
        </CardHeader>

        <CardContent className="relative z-10 space-y-2 px-6 pb-6 pt-1">
          <p className="line-clamp-3 text-xs text-slate-600 dark:text-slate-400">
            {description}
          </p>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              <span style={{ color }}>{count}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  )
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

  if (stages.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 px-6 py-10 text-center text-sm text-muted-foreground">
        {t("carousel.noData")}
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1">
        {stages.map((stage, idx) => {
          const slug = stageIdentity(stage)
          const isSelected = selectedStageSlug === slug
          const title =
            stage.stageKey && getAttckStageDefinition(stage.stageKey)
              ? t(`stages.${stage.stageKey}.label`)
              : stage.stage
          const description =
            stage.stageKey && getAttckStageDefinition(stage.stageKey)
              ? t(`stages.${stage.stageKey}.description`)
              : stage.description

          return (
            <div key={slug || stage.stage || idx} className="min-w-0">
              <StageCard
                stageKey={stage.stageKey}
                title={title}
                description={description}
                icon={stage.icon}
                count={stage.count}
                onClick={() => onSelectStage(stage)}
                selected={isSelected}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
