"use client"

import { cn } from "@/shared/lib/utils"
import type { KillChainStageData } from "@/features/attack/utils/kill-chain"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip"

interface KillChainNodeProps {
  stage: KillChainStageData
  onClick: () => void
  isFirst?: boolean
  isLast?: boolean
}

/**
 * Kill Chain Node: 带Tooltip的阶段按钮组件，通常用于 Kill Chain 可视化界面，每个阶段显示图标、状态，并在悬停时显示更多信息
 * /param stage 当前阶段数据
 * /param onClick 点击事件处理函数
 * /param isFirst 是否为第一个节点
 * /param isLast 是否为最后一个节点
 */
export function KillChainNode({ stage, onClick, isFirst, isLast }: KillChainNodeProps) {

  /**
   * 根据阶段状态返回对应的 TailwindCSS 样式类，从而在 UI 上动态显示不同的颜色、边框和效果
   * /returns TailwindCSS 样式类
   */
  const getStatusStyles = () => {
    switch (stage.status) {
      case "completed":
        return "bg-green-500 border-green-600 text-white shadow-green-500/25"
      case "active":
        return "bg-blue-500 border-blue-600 text-white shadow-blue-500/25 animate-pulse"
      case "inactive":
      default:
        return "bg-muted border-border text-muted-foreground"
    }
  }

  /* 统计当前阶段（stage）下所有 ATT&CK Stage 中的 techniques 总数 */
  const getTechniqueCount = () => {
    if (!stage.attckStages) return 0
    return stage.attckStages.reduce((count, attckStage) => count + (attckStage.techniques?.length || 0), 0)
  }

  const IconComponent = stage.icon

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        {/* TooltipTrigger 用来触发 tooltip，这里使用 asChild 表示把 tooltip 绑定到子元素上 */}
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              "relative w-16 h-16 rounded-full border-2 flex items-center justify-center shadow-lg",
              "transition-colors duration-200 ease-out",
              "hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              /* 根据阶段状态动态添加背景、文字颜色和动画 */
              getStatusStyles(),
              /* 增加按钮呼吸 */
              (stage.status === "active" || stage.status === "completed") ? "animate-pulse" : ""
            )}
          >
            {/* 渲染阶段图标 */}
            <IconComponent className="w-6 h-6" />

          </button>
        </TooltipTrigger>

        {/* Tooltip 内容 */}
        <TooltipContent side="top" className="max-w-xs" sideOffset={8}>
          <div className="text-center">
            {/* 阶段名称 */}
            <p className="font-medium">{stage.name}</p>

            {/* 显示阶段开始时间，如果有的话 */}
            {stage.startTime && (
              <p className="text-xs text-muted-foreground mt-1">Started: {stage.startTime}</p>
            )}

            {/* 显示 techniques 数量，如果大于 0 */}
            {getTechniqueCount() > 0 && (
              <p className="text-xs text-muted-foreground">
                {getTechniqueCount()} technique{getTechniqueCount() !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
