"use client"

import { useState, useEffect } from "react"
import { KillChainNode } from "./kill-chain-node"
import { KillChainDetails } from "./kill-chain-details"
import type { KillChainStageData, DynamicKillChainData } from "@/features/attack/utils/kill-chain"
import { initKillChainStages, calculateTimeFromTechniques, mergeAttckStages } from "@/features/attack/utils/kill-chain"

interface KillChainTimelineProps {
  dynamicData?: DynamicKillChainData[]
}

export function KillChainTimeline({ dynamicData = [] }: KillChainTimelineProps) {
  const [selectedStage, setSelectedStage] = useState<KillChainStageData | null>(null)
  const [stages, setStages] = useState<KillChainStageData[]>(initKillChainStages)

  /** 更新 Kill Chain 阶段信息 */
  useEffect(() => {
    if (dynamicData.length === 0) return

    setStages((prevStages) =>
      prevStages.map((stage) => {
        const update = dynamicData.find((d) => d.id === stage.id)
        if (!update) return stage

        const mergedAttckStages = mergeAttckStages(stage.attckStages, update.attckStages)
        const calculatedTimes = calculateTimeFromTechniques(mergedAttckStages)

        return {
          ...stage,
          status: update.status,
          startTime: update.startTime || calculatedTimes.startTime || stage.startTime,
          endTime: update.endTime || calculatedTimes.endTime || stage.endTime,
          attckStages: mergedAttckStages,
        }
      }),
    )
  }, [dynamicData])

  /** 根据 stage.status 获取颜色 */
  const getColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#1D4ED8" // 蓝色
      case "active":
        return "rgba(29,78,216,0.6)" // 半透明蓝
      default:
        return "#E5E7EB" // 灰色
    }
  }

  return (
    <div className="w-full">
      <div className="relative">
        {/* Timeline container */}
        <div className="relative px-2 sm:px-4">
          <div className="flex items-start gap-6 relative">
            {/* Stage nodes with arrows */}
            {stages.map((stage, index) => (
              <div key={stage.id} className="relative z-20 flex flex-col items-center flex-1 min-w-[100px]">
                {/* Node */}
                <div className="flex-shrink-0 mb-2">
                  <KillChainNode
                    stage={stage}
                    onClick={() => setSelectedStage(stage)}
                    isFirst={index === 0}
                    isLast={index === stages.length - 1}
                  />
                </div>

                {/* Stage name + time */}
                <div className="flex flex-col items-center text-center w-full">
                  <h3 className="text-[10px] sm:text-xs font-medium text-foreground mb-1 leading-tight break-words px-1">
                    {stage.name}
                  </h3>
                  {stage.startTime && (
                    <span className="text-[8px] sm:text-[10px] text-muted-foreground whitespace-nowrap">
                      {stage.startTime}
                    </span>
                  )}
                </div>

                {/* Directional arrow */}
                {index < stages.length - 1 && (
                  <div
                    className="absolute top-6 left-full flex items-center justify-center z-10"
                    style={{ width: "calc(100% - 24px)", transform: "translateX(-50%)" }}
                  >
                    {/* Arrow line */}
                    <div
                      style={{
                        width: "40px",
                        height: "2px",
                        backgroundColor: getColor(stage.status),
                        transition: "background-color 0.5s",
                      }}
                    />
                    {/* Arrow head */}
                    <div
                      style={{
                        width: 0,
                        height: 0,
                        borderTop: "4px solid transparent",
                        borderBottom: "4px solid transparent",
                        borderLeft: `8px solid ${getColor(stage.status)}`,
                        transition: "border-color 0.5s",
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Details panel */}
      <KillChainDetails
        stage={selectedStage}
        isOpen={!!selectedStage}
        onClose={() => setSelectedStage(null)}
      />
    </div>
  )
}
