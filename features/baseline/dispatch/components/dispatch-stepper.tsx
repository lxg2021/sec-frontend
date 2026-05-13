"use client"

import type { ReactNode } from "react"

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

const stepCopyOverrides: Partial<Record<number, { title?: string; description?: string }>> = {
  1: {
    description: "阅览选择目标基线详细信息",
  },
  2: {
    description: "配置扫描周期并创建任务",
  },
  3: {
    description: "选择基线下发的目标主机",
  },
  4: {
    title: "下发预览",
    description: "预览确认任务并下发执行",
  },
}

function BaselineIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19.5h16" />
      <path d="M6 16V8.5" />
      <path d="M12 16V5.5" />
      <path d="M18 16V11.5" />
      <circle cx="6" cy="6.5" r="1.8" />
      <circle cx="12" cy="3.5" r="1.8" />
      <circle cx="18" cy="9.5" r="1.8" />
    </svg>
  )
}

function TaskPlanIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="5" width="16" height="15" rx="2.5" />
      <path d="M8 3.5v3" />
      <path d="M16 3.5v3" />
      <path d="M4 10h16" />
      <path d="M8 13.5h3" />
      <path d="M8 17h5" />
      <path d="m15 15 1.5 1.5 3-3" />
    </svg>
  )
}

function HostSelectIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="5.5" rx="1.5" />
      <rect x="3" y="13.5" width="18" height="5.5" rx="1.5" />
      <path d="M7 8h.01" />
      <path d="M7 16.5h.01" />
      <path d="M10 8h7" />
      <path d="M10 16.5h5" />
      <path d="m17 15 2 1.5-2 1.5" />
    </svg>
  )
}

function PreviewIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3.5 12s3.2-5.5 8.5-5.5 8.5 5.5 8.5 5.5-3.2 5.5-8.5 5.5S3.5 12 3.5 12Z" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="m15.5 18.5 2.5 2.5" />
    </svg>
  )
}

function getStepIcon(stepKey: number): ReactNode {
  switch (stepKey) {
    case 1:
      return <BaselineIcon className="h-5 w-5" />
    case 2:
      return <TaskPlanIcon className="h-5 w-5" />
    case 3:
      return <HostSelectIcon className="h-5 w-5" />
    case 4:
      return <PreviewIcon className="h-5 w-5" />
    default:
      return null
  }
}

function StepNode({
  disabled,
  icon,
  isClickable,
  status,
}: {
  disabled?: boolean
  icon: ReactNode
  isClickable: boolean
  status: DispatchStepItem["status"]
}) {
  const isCompleted = status === "completed"
  const isCurrent = status === "current"
  const isActive = isCompleted || isCurrent

  return (
    <div
      className={cn(
        "relative flex items-center justify-center transition-all duration-500",
        isCurrent && "scale-[1.06]",
        disabled && "opacity-70",
      )}
    >
      {isCurrent ? (
        <div className="absolute inset-[-5px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.24)_0%,rgba(59,130,246,0.10)_42%,rgba(255,255,255,0)_74%)] blur-sm" />
      ) : null}

      <div
        className={cn(
          "relative rounded-full p-[3px] transition-all duration-500",
          isActive
            ? "bg-[linear-gradient(135deg,#38bdf8_0%,#3b82f6_48%,#2563eb_100%)]"
            : "bg-slate-200/95",
          isCurrent && "shadow-[0_10px_28px_-14px_rgba(37,99,235,0.75)]",
          isClickable && "group-hover:shadow-[0_10px_28px_-16px_rgba(37,99,235,0.55)]",
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-white transition-all duration-500",
            isCurrent ? "h-14 w-14" : "h-12 w-12",
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center rounded-full transition-all duration-500",
              isActive
                ? "bg-[linear-gradient(135deg,#38bdf8_0%,#3b82f6_52%,#2563eb_100%)] text-white"
                : "bg-slate-100 text-slate-400",
              isCurrent ? "h-10 w-10" : "h-9 w-9",
            )}
          >
            {icon}
          </div>
        </div>
      </div>
    </div>
  )
}

export function DispatchStepper({
  currentStep,
  items,
  onStepChange,
}: DispatchStepperProps) {
  return (
    <div className="rounded-[30px] px-5 py-6">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4 xl:gap-0">
        {items.map((item, index) => {
          const isCompleted = item.key < currentStep
          const isCurrent = item.key === currentStep
          const isActive = isCompleted || isCurrent
          const isClickable = Boolean(onStepChange) && !item.disabled && item.key <= currentStep
          const displayTitle = stepCopyOverrides[item.key]?.title ?? item.title
          const displayDescription = stepCopyOverrides[item.key]?.description ?? item.description

          return (
            <div key={item.key} className="flex items-start xl:flex-1">
              <div className="flex min-w-0 flex-1 flex-col items-center">
                <button
                  type="button"
                  onClick={() => isClickable && onStepChange?.(item.key)}
                  disabled={!isClickable}
                  className={cn(
                    "group flex flex-col items-center text-center transition-all duration-300",
                    isClickable ? "cursor-pointer" : "cursor-default",
                  )}
                >
                  <StepNode
                    disabled={item.disabled}
                    icon={getStepIcon(item.key)}
                    isClickable={isClickable}
                    status={item.status}
                  />

                  <div className="mt-4 min-h-[48px] max-w-[150px]">
                    <div
                      className={cn(
                        "text-[15px] font-semibold tracking-tight transition-colors duration-300",
                        isActive ? "text-slate-900" : "text-slate-500",
                      )}
                    >
                      {`第 ${item.key} 步：${displayTitle}`}
                    </div>
                    <div
                      className={cn(
                        "mt-1 text-[12px] leading-5 transition-colors duration-300",
                        isCurrent ? "text-slate-600" : "text-slate-400",
                      )}
                    >
                      {displayDescription}
                    </div>
                  </div>
                </button>
              </div>

              {index < items.length - 1 ? (
                <div className="hidden xl:flex xl:flex-1 xl:px-3 xl:pt-7">
                  <div className="relative h-[3px] w-full overflow-hidden rounded-full bg-slate-200/90">
                    <div
                      className={cn(
                        "absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out",
                        isCompleted ? "w-full" : isCurrent ? "w-1/2" : "w-0",
                      )}
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(56,189,248,0.95) 0%, rgba(59,130,246,0.92) 55%, rgba(37,99,235,0.92) 100%)",
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
