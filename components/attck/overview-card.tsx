"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Eye,
  Binoculars,
  Wrench,
  DoorOpen,
  Terminal,
  Anchor,
  ArrowUp,
  ShieldOff,
  Key,
  Search,
  ArrowRightLeft,
  Download,
  Cast,
  Upload,
  Zap,
} from "lucide-react"

import { getStageColor, slugify } from "@/lib/stageColor"

interface OverviewCardProps {
  title: string
  description: string
  icon?: string
  count: number
  onClick?: () => void
  selected?: boolean
}

const iconMap: Record<string, React.ElementType> = {
  Eye,
  Binoculars,
  Wrench,
  DoorOpen,
  Terminal,
  Anchor,
  ArrowUp,
  ShieldOff,
  Key,
  Search,
  ArrowRightLeft,
  Download,
  Cast,
  Upload,
  Zap,
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

  // 这里根据颜色生成 Tailwind 兼容的渐变class
  // 由于颜色是hex，需要手动写样式，这里用内联渐变背景
  // 你也可以扩展成动态class映射
  const iconBgStyle = {
    background: `linear-gradient(to bottom right, ${color}, ${color}cc)`, // 透明度渐变
  }

  const focusClasses = selected
    ? "focus:outline-none focus-visible:outline-none ring-2 ring-blue-500"
    : "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"

  const IconComponent = icon && iconMap[icon] ? iconMap[icon] : Eye

  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-lg w-full cursor-pointer ${focusClasses}`}
      aria-pressed={selected}
    >
      <Card
        className={`relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-300 ${
          selected ? "ring-2 ring-blue-500 shadow-lg" : ""
        }`}
      >
        {/* 渐变背景装饰 */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ background: `linear-gradient(to bottom right, ${color}, ${color}cc)` }}
        />

        <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-6 relative z-10">
          <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">{title}</CardTitle>
          <div
            className="p-2 rounded-lg flex items-center justify-center"
            style={iconBgStyle}
          >
            <IconComponent className="h-5 w-5 text-white" />
          </div>
        </CardHeader>

        <CardContent className="pt-1 px-6 pb-6 space-y-2 relative z-10">
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3">{description}</p>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{count}</div>
          </div>
        </CardContent>
      </Card>
    </button>
  )
}
