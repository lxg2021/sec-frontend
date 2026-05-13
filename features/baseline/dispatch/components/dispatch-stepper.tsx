"use client"

import { Check } from "lucide-react"

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
  currentStep,
  items,
  onStepChange,
}: DispatchStepperProps) {
  return (
    <div className="rounded-[28px] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] p-3 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.35)] backdrop-blur">
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4 xl:gap-0">
        {items.map((item, index) => (
          <div key={item.key} className="relative">
            {index < items.length - 1 ? (
              <div
                className={cn(
                  "hidden xl:block absolute left-[calc(50%+2.6rem)] right-[-18%] top-8 h-px rounded-full",
                  item.key < currentStep
                    ? "bg-gradient-to-r from-sky-500/75 via-sky-400/55 to-emerald-400/40"
                    : "bg-slate-200/90",
                )}
              />
            ) : null}

            <button
              type="button"
              disabled={item.disabled}
              onClick={() => onStepChange?.(item.key)}
              className={cn(
                "group relative flex w-full min-w-0 items-start gap-3 rounded-2xl px-4 py-4 text-left transition-all duration-200",
                item.disabled
                  ? "cursor-not-allowed opacity-65"
                  : "cursor-pointer hover:bg-white/90 hover:shadow-[0_14px_30px_-26px_rgba(15,23,42,0.65)]",
                item.status === "current" &&
                  "bg-white shadow-[0_18px_36px_-28px_rgba(14,165,233,0.45)] ring-1 ring-sky-100/90",
                item.status === "completed" && "bg-slate-50/85",
              )}
            >
              <div
                className={cn(
                  "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                  item.status === "current" &&
                    "border-sky-500 bg-sky-50 text-sky-700 shadow-[0_0_0_6px_rgba(14,165,233,0.10)]",
                  item.status === "completed" &&
                    "border-emerald-600 bg-emerald-50 text-emerald-700",
                  item.status === "upcoming" &&
                    "border-slate-200 bg-white text-slate-500",
                )}
              >
                {item.status === "completed" ? <Check className="h-5 w-5" /> : item.key}
                {item.status === "current" ? (
                  <span className="absolute -bottom-1 h-2 w-2 rounded-full border border-white bg-sky-500" />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <div
                  className={cn(
                    "text-base font-semibold tracking-tight xl:text-[1.05rem]",
                    item.status === "current" ? "text-slate-950" : "text-slate-700",
                  )}
                >
                  {item.title}
                </div>
                <div
                  className={cn(
                    "mt-1 max-w-[26ch] text-xs leading-5 xl:text-[13px]",
                    item.status === "current" ? "text-slate-600" : "text-slate-500",
                  )}
                >
                  {item.description}
                </div>
              </div>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
