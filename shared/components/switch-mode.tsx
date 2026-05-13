"use client"

import * as React from "react"
import { RefreshCw, Sparkles } from "lucide-react"

import { cn } from "@/shared/lib/utils"

export type SwitchModeValue = "reuse" | "generate"

interface SwitchModeProps {
  value?: SwitchModeValue
  defaultValue?: SwitchModeValue
  onValueChange?: (value: SwitchModeValue) => void
  className?: string
  reuseLabel?: string
  generateLabel?: string
}

export function SwitchMode({
  value,
  defaultValue = "reuse",
  onValueChange,
  className,
  reuseLabel = "复用已有任务",
  generateLabel = "生成新任务",
}: SwitchModeProps) {
  const [internalValue, setInternalValue] = React.useState<SwitchModeValue>(defaultValue)

  const currentValue = value !== undefined ? value : internalValue

  const handleChange = (nextValue: SwitchModeValue) => {
    if (value === undefined) {
      setInternalValue(nextValue)
    }

    onValueChange?.(nextValue)
  }

  return (
    <div
      className={cn(
        "relative inline-flex items-center rounded-full border border-slate-200/60 bg-slate-100/80 p-1",
        className,
      )}
    >
      <div
        className={cn(
          "absolute bottom-1 top-1 rounded-full bg-white shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          currentValue === "reuse"
            ? "left-1 w-[calc(50%-4px)]"
            : "left-[calc(50%+2px)] w-[calc(50%-4px)]",
        )}
      />

      <button
        type="button"
        onClick={() => handleChange("reuse")}
        className={cn(
          "relative z-10 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none",
          currentValue === "reuse"
            ? "text-slate-800"
            : "text-slate-400 hover:text-slate-600",
        )}
      >
        <RefreshCw
          className={cn(
            "size-4 transition-transform duration-500",
            currentValue === "reuse" ? "text-sky-500" : "text-slate-400",
          )}
        />
        <span>{reuseLabel}</span>
      </button>

      <button
        type="button"
        onClick={() => handleChange("generate")}
        className={cn(
          "relative z-10 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none",
          currentValue === "generate"
            ? "text-slate-800"
            : "text-slate-400 hover:text-slate-600",
        )}
      >
        <Sparkles
          className={cn(
            "size-4",
            currentValue === "generate" ? "text-amber-500" : "text-slate-400",
          )}
        />
        <span>{generateLabel}</span>
      </button>
    </div>
  )
}
