"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getStageIconComponent, getStageIconBgStyle } from "@/lib/stageIcon"
import { getStageColor, slugify } from "@/lib/stageColor"
import { Eye } from "lucide-react"
import CountUp from "@/components/dash/CountUp"

interface OverviewCardProps {
  title: string
  description: string
  icon?: string
  count: number
  onClick?: () => void
  selected?: boolean
}

export default function OverviewCard({
  title,
  description,
  icon,
  count,
  onClick,
  selected = false,
}: OverviewCardProps) {
  const slug = slugify(title)
  const color = getStageColor(slug)
  const IconComponent = getStageIconComponent(icon)

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative text-left w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      aria-pressed={selected}
    >
      {/* 选中指示器 */}
      {selected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center z-10">
          <Eye className="h-3 w-3 text-white" />
        </div>
      )}

      <Card
        className={`relative overflow-hidden rounded-lg border-0 shadow-md hover:shadow-lg transition-shadow transition-transform duration-300
    hover:scale-105 hover:-translate-y-1
    ${selected ? "ring-2 ring-blue-500 shadow-lg" : ""}`}
      >
        {/* 渐变背景装饰 */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom right, ${color}, ${color}cc)`,
          }}
        />

        <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-6 relative z-10">
          <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {title}
          </CardTitle>
          <div
            className="p-2 flex items-center justify-center rounded-lg"
            style={getStageIconBgStyle(color)}
          >
            <IconComponent className="h-5 w-5 text-white" />
          </div>
        </CardHeader>

        <CardContent className="pt-1 px-6 pb-6 space-y-2 relative z-10">
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3">
            {description}
          </p>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              <span style={{ color }}>
                <CountUp
                  end={count}
                  duration={1500}
                  start={0}
                  className="text-2xl font-bold tabular-nums"
                />
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

    </button>
  )
}
