"use client"

import { Check, ChevronRight } from "lucide-react"

import { cn } from "@/shared/lib/utils"

export interface DispatchStepItem {
  description: string
  disabled?: boolean
  key: number
  status: "current" | "completed" | "upcoming"
  title: string
}

interface DispatchStepperProps {
  currentStep: number
  items: DispatchStepItem[]
  onStepChange?: (step: number) => void
}

export function DispatchStepper({
  items,
  onStepChange,
}: DispatchStepperProps) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        {items.map((item, index) => (
          <div key={item.key} className="flex items-center gap-4 xl:flex-1">
            <button
              type="button"
              disabled={item.disabled}
              onClick={() => onStepChange?.(item.key)}
              className={cn(
                "flex min-w-0 items-center gap-4 text-left transition-opacity",
                item.disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer",
              )}
            >
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-base font-semibold transition-colors",
                  item.status === "current" && "border-slate-950 bg-white text-slate-950",
                  item.status === "completed" &&
                    "border-emerald-600 bg-emerald-50 text-emerald-700",
                  item.status === "upcoming" &&
                    "border-slate-300 bg-white text-slate-400",
                )}
              >
                {item.status === "completed" ? <Check className="h-5 w-5" /> : item.key}
              </div>
              <div className="min-w-0">
                <div
                  className={cn(
                    "text-xl font-medium tracking-tight xl:text-2xl",
                    item.status === "current" ? "text-slate-950" : "text-slate-500",
                  )}
                >
                  {item.title}
                </div>
                <div className="mt-1 text-sm text-slate-500">{item.description}</div>
              </div>
            </button>

            {index < items.length - 1 ? (
              <div className="hidden xl:flex xl:flex-1 xl:justify-center">
                <ChevronRight className="h-5 w-5 text-slate-300" />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
