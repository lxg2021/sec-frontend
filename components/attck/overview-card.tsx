"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye } from "lucide-react"

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
  icon = "🧩",
  count,
  onClick,
  selected = false,
}: OverviewCardProps) {
  // Build focus classes to avoid double blue border when selected
  const focusClasses = selected
    ? "focus:outline-none focus-visible:outline-none"
    : "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"

  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-lg w-full ${focusClasses}`}
      aria-pressed={selected}
    >
      <Card
        className={`relative bg-white border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer h-full ${
          selected ? "ring-2 ring-blue-500 shadow-lg" : ""
        }`}
      >
        {/* Eye badge on the top-right of the blue bordered card when selected */}
        {selected && (
          <div
            className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg z-10"
            aria-label="正在查看"
          >
            <Eye className="h-4 w-4" />
          </div>
        )}

        <CardHeader className="pb-3 p-6">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-lg font-semibold leading-tight flex-1">{title}</CardTitle>
            <div className="text-3xl leading-none flex-shrink-0" aria-hidden="true">
              {icon}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{description}</p>
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-xs text-muted-foreground font-medium">计数</span>
            <span className="text-2xl font-bold tabular-nums text-blue-600">{count}</span>
          </div>
        </CardContent>
      </Card>
    </button>
  )
}
