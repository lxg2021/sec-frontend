"use client"

import type React from "react"
import { useMemo, useRef, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AttckStage } from "@/lib/attck-utils"
import { MoreHorizontal } from "lucide-react";
import { getStageColor } from "@/lib/stageColor"

interface Props {
  stages: AttckStage[]
  selectedStageSlug: string | null            // 短标签名称
  onSelectStage: (stage: AttckStage) => void
}

/* 定义提示框的状态类型，包括是否可见、位置和显示内容 */
type TooltipState = { visible: boolean; x: number; y: number; label: string; value: number } | null


function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
}

export default function StageHostDistributionChart({
  stages,
  selectedStageSlug,
  onSelectStage,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState>(null)
  const [chartHeight, setChartHeight] = useState(260) // 默认高度

  // 监听父容器高度
  useEffect(() => {
    if (!wrapperRef.current?.parentElement) return
    const parent = wrapperRef.current.parentElement
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = entry.contentRect.height
        setChartHeight(h - 80) // 留出标题和 padding
      }
    })
    observer.observe(parent)
    return () => observer.disconnect()
  }, [])

  const data = useMemo(() => {
    return stages.map((s) => {
      const set = new Set<string>()
        ; (s.details ?? []).forEach((d) => (d.hosts ?? []).forEach((h) => set.add(h)))
      return { stage: s, label: s.stage, value: set.size, slug: slugify(s.stage) }
    })
  }, [stages])

  const maxVal = Math.max(...data.map((d) => d.value), 1)
  const n = data.length || 1

  const width = 800
  const margin = { top: 20, right: 20, bottom: 60, left: 50 }
  const innerW = width - margin.left - margin.right
  const innerH = chartHeight - margin.top - margin.bottom

  const gap = 12
  const barW = Math.max(8, Math.min(40, (innerW - gap * (n - 1)) / n))

  function handleMouseMove(e: React.MouseEvent, label: string, value: number) {
    const rect = (wrapperRef.current as HTMLDivElement)?.getBoundingClientRect()
    setTooltip({
      visible: true,
      x: e.clientX - (rect?.left ?? 0) + 8,
      y: e.clientY - (rect?.top ?? 0) + 8,
      label,
      value,
    })
  }

  function handleMouseLeave() {
    setTooltip((t) => (t ? { ...t, visible: false } : null))
  }

  const truncate = (text: string, max = 6) => (text.length > max ? text.slice(0, max) + "…" : text)

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-sky-500 to-sky-600 rounded-lg">
            <MoreHorizontal className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base md:text-lg font-semibold text-slate-800 dark:text-white">
              Stage主机分布图
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-full">
        <div ref={wrapperRef} className="relative w-full h-full">
          <svg
            viewBox={`0 0 ${width} ${chartHeight}`}
            role="img"
            aria-label="各阶段受影响主机数量柱状图"
            className="w-full h-full select-none"
          >
            <g transform={`translate(${margin.left},${margin.top})`}>
              {Array.from({ length: 5 }).map((_, i) => {
                const yVal = Math.round((maxVal * i) / 4)
                const y = innerH - (yVal / maxVal) * innerH
                return (
                  <g key={i} transform={`translate(0,${y})`}>
                    <line x1={0} x2={innerW} stroke="#e5e7eb" />
                    <text x={-8} y={4} textAnchor="end" fontSize="10" fill="#6b7280">
                      {yVal}
                    </text>
                  </g>
                )
              })}

              {data.map((d, i) => {
                const x = i * (barW + gap)
                const h = (d.value / maxVal) * innerH
                const y = innerH - h
                const selected = selectedStageSlug === d.slug
                return (
                  <g key={d.label} transform={`translate(${x},0)`}>
                    <rect
                      x={0}
                      y={y}
                      width={barW}
                      height={h}
                      fill={getStageColor(d.slug)}
                      stroke={selected ? "#2563eb" : "transparent"}
                      strokeWidth={selected ? 2 : 0}
                      rx={4}
                      className="cursor-pointer"
                      onMouseMove={(e) => handleMouseMove(e, d.label, d.value)}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => onSelectStage(d.stage)}
                    />
                    <text
                      x={barW / 2}
                      y={innerH + 20}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#6b7280"
                      className="pointer-events-none"
                    >
                      {truncate(d.label, 6)}
                    </text>
                  </g>
                )
              })}
            </g>

            <text x={12} y={14} fontSize="11" fill="#6b7280">
              受影响主机
            </text>
          </svg>

          {tooltip?.visible && (
            <div
              className="absolute bg-white border border-gray-200 rounded-md shadow-md px-2 py-1 text-xs text-gray-700 pointer-events-none"
              style={{ left: tooltip.x, top: tooltip.y }}
            >
              <div className="font-medium">{tooltip.label}</div>
              <div>主机：{tooltip.value}</div>
            </div>
          )}
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          提示：点击条形将选中并定位到对应阶段卡片。
        </div>
      </CardContent>
    </Card>
  )
}
