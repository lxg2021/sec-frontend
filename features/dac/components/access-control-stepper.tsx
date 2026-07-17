"use client"

import { Check, FileSliders, MonitorCheck, Send, Settings2 } from "lucide-react"

import type { AccessControlCopy } from "../access-control-copy"
import type { AccessControlWizardStep } from "../access-control-types"
import { cn } from "@/shared/lib/utils"

const ICONS = [Settings2, FileSliders, MonitorCheck, Send]

interface AccessControlStepperProps {
  copy: AccessControlCopy
  currentStep: AccessControlWizardStep
  maxStep: AccessControlWizardStep
  onStepChange: (step: AccessControlWizardStep) => void
}

export function AccessControlStepper({
  copy,
  currentStep,
  maxStep,
  onStepChange,
}: AccessControlStepperProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
      <div className="grid grid-cols-4">
        {copy.steps.map((step, index) => {
          const stepNumber = (index + 1) as AccessControlWizardStep
          const completed = stepNumber < currentStep
          const active = stepNumber === currentStep
          const enabled = stepNumber <= maxStep
          const Icon = ICONS[index]

          return (
            <div key={step.title} className="relative flex min-w-0 items-start">
              {index > 0 ? (
                <div
                  className={cn(
                    "absolute right-1/2 top-5 h-0.5 w-full -translate-y-1/2",
                    stepNumber <= currentStep ? "bg-blue-500" : "bg-slate-200",
                  )}
                />
              ) : null}

              <button
                type="button"
                disabled={!enabled}
                onClick={() => enabled && onStepChange(stepNumber)}
                className={cn(
                  "group relative z-10 flex min-w-0 flex-1 flex-col items-center text-center outline-none",
                  enabled ? "cursor-pointer" : "cursor-default",
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white transition-colors",
                    completed && "border-blue-600 bg-blue-600 text-white",
                    active && "border-blue-600 text-blue-600 ring-4 ring-blue-50",
                    !completed && !active && "border-slate-300 text-slate-400",
                    enabled && !active && "group-hover:border-blue-400 group-hover:text-blue-500",
                  )}
                >
                  {completed ? <Check className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                </span>
                <span className={cn("mt-2 truncate text-sm font-semibold", active || completed ? "text-slate-900" : "text-slate-500")}> 
                  {step.title}
                </span>
                <span className="mt-0.5 hidden truncate text-xs text-slate-400 lg:block">
                  {step.description}
                </span>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

