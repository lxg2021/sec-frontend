"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { MoreHorizontal } from "lucide-react"
import { getStageColor } from "@/features/attack/utils/stage-color"
import { useTranslations } from "next-intl"
import { getAttckStageDefinition } from "@/features/attack/constants/attck-stages"
import { fetchAttackStageHostDistribution } from "@/features/attack/dashboard/api"
import type { AttackStageHostDistributionItem } from "@/features/attack/dashboard/types"

interface Props {
  snapshotId?: string
}

type TooltipState =
  | { visible: boolean; x: number; y: number; label: string; value: number }
  | null

function isValidBackendStageKey(stageKey: string) {
  return Boolean(stageKey) && !stageKey.includes(".")
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
}

function buildYAxisTicks(maxValue: number) {
  if (maxValue <= 10) {
    return Array.from({ length: maxValue + 1 }, (_, index) => index)
  }

  const targetTickCount = 5
  const rawStep = maxValue / (targetTickCount - 1)
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const normalized = rawStep / magnitude
  const niceStep =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  const step = niceStep * magnitude
  const topValue = Math.ceil(maxValue / step) * step

  return Array.from(
    { length: Math.floor(topValue / step) + 1 },
    (_, index) => index * step,
  )
}

export default function StageHostDistributionChart({
  snapshotId,
}: Props) {
  const t = useTranslations("pages.attack.dashboard")
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState>(null)
  const [items, setItems] = useState<AttackStageHostDistributionItem[]>([])
  const [selectedStageSlug, setSelectedStageSlug] = useState<string | null>(null)

  const chartHeight = 354

  useEffect(() => {
    let cancelled = false

    async function loadDistribution() {
      setItems([])
      setSelectedStageSlug(null)

      if (!snapshotId) {
        return
      }

      try {
        const result = await fetchAttackStageHostDistribution(snapshotId)
        if (cancelled) return
        setItems(result)
        setSelectedStageSlug((current) => {
          const normalizedItems = result
            .map((item) => item.stage_key || slugify(item.stage))
            .filter(isValidBackendStageKey)
          if (current && normalizedItems.includes(current)) {
            return current
          }
          return normalizedItems[0] || null
        })
      } catch (error) {
        console.error("load attack stage host distribution failed", error)
        if (!cancelled) {
          setItems([])
          setSelectedStageSlug(null)
        }
      }
    }

    void loadDistribution()

    return () => {
      cancelled = true
    }
  }, [snapshotId])

  const data = useMemo(() => {
    return items.map((item) => {
      const slug = item.stage_key || slugify(item.stage)
      if (!isValidBackendStageKey(slug)) return null
      const definition = getAttckStageDefinition(slug)
      const label = definition ? t(`stages.${definition.key}.label`) : item.stage
      return { label, value: item.host_count, slug }
    }).filter((item): item is { label: string; value: number; slug: string } => Boolean(item))
  }, [items, t])

  const maxVal = Math.max(...data.map((d) => d.value), 1)
  const yAxisTicks = buildYAxisTicks(maxVal)
  const yAxisMax = yAxisTicks[yAxisTicks.length - 1] || maxVal
  const n = data.length || 1

  const width = 800
  const margin = { top: 18, right: 12, bottom: 32, left: 34 }
  const innerW = width - margin.left - margin.right
  const innerH = chartHeight - margin.top - margin.bottom

  const slotW = innerW / n
  const barW = Math.max(8, Math.min(40, slotW * 0.55))

  function handleMouseMove(e: React.MouseEvent, label: string, value: number) {
    const rect = wrapperRef.current?.getBoundingClientRect()
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

  const truncate = (text: string, max = 6) =>
    text.length > max ? text.slice(0, max) + "…" : text

  return (
    <Card className="h-full min-w-0 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      <CardHeader className="flex flex-row items-center justify-between gap-4 px-5 pb-4 pt-5">
        <div className="flex items-center space-x-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-600">
            <MoreHorizontal className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <CardTitle className="text-base font-medium text-slate-950">
            {t("stageChart.title")}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0">
        {data.length === 0 ? (
          <div className="flex h-[354px] items-center justify-center rounded-2xl bg-slate-50/80 text-sm text-muted-foreground">
            {t("stageChart.noData")}
          </div>
        ) : (
        <div
          ref={wrapperRef}
          className="relative w-full"
          style={{ height: chartHeight }}
        >
          <svg
            viewBox={`0 0 ${width} ${chartHeight}`}
            role="img"
            aria-label={t("stageChart.ariaLabel")}
            className="w-full h-full select-none"
          >
            <defs>
              <filter id="selected-stage-bar-shadow" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.18" />
              </filter>
            </defs>
            <g transform={`translate(${margin.left},${margin.top})`}>
              {yAxisTicks.map((yVal) => {
                const y = innerH - (yVal / yAxisMax) * innerH
                return (
                  <g key={yVal} transform={`translate(0,${y})`}>
                    <line x1={0} x2={innerW} stroke="#e5e7eb" />
                    <text
                      x={-8}
                      y={4}
                      textAnchor="end"
                      fontSize="10"
                      fill="#6b7280"
                    >
                      {yVal}
                    </text>
                  </g>
                )
              })}

              {data.map((d, i) => {
                const x = i * slotW + (slotW - barW) / 2
                const h = (d.value / yAxisMax) * innerH
                const y = innerH - h
                const selected = selectedStageSlug === d.slug
                return (
                  <g key={d.slug} transform={`translate(${x},0)`}>
                    <rect
                      x={0}
                      y={y}
                      width={barW}
                      height={h}
                      fill={getStageColor(d.slug)}
                      opacity={selectedStageSlug && !selected ? 0.58 : 1}
                      filter={selected ? "url(#selected-stage-bar-shadow)" : undefined}
                      rx={4}
                      className="cursor-pointer transition-all duration-200"
                      onMouseMove={(e) => handleMouseMove(e, d.label, d.value)}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => setSelectedStageSlug(d.slug)}
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
              {t("stageChart.affectedHosts")}
            </text>
          </svg>

          {tooltip?.visible && (
            <div
              className="absolute bg-white border border-gray-200 rounded-md shadow-md px-2 py-1 text-xs text-gray-700 pointer-events-none"
              style={{ left: tooltip.x, top: tooltip.y }}
            >
              <div className="font-medium">{tooltip.label}</div>
              <div>{t("stageChart.hostTooltip", { count: tooltip.value })}</div>
            </div>
          )}
        </div>
        )}
      </CardContent>
    </Card>
  )
}
