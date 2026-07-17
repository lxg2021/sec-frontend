"use client"

import { ArrowRight, BadgeCheck, Settings2 } from "lucide-react"

import type { AccessControlCopy } from "../access-control-copy"
import type { AccessControlPolicyDraft } from "../access-control-types"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Slider } from "@/shared/ui/slider"

interface PolicyBasicsStepProps {
  copy: AccessControlCopy
  draft: AccessControlPolicyDraft
  onChange: (patch: Partial<AccessControlPolicyDraft>) => void
  onNext: () => void
}

export function PolicyBasicsStep({ copy, draft, onChange, onNext }: PolicyBasicsStepProps) {
  const complete = Boolean(
    draft.name.trim() &&
      /^\d+\.\d+\.\d+$/.test(draft.version.trim()) &&
      Number.isInteger(draft.priority) &&
      draft.priority >= 0 &&
      draft.priority <= 255,
  )

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-6 py-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Settings2 className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{copy.basicInfo}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{copy.steps[0].description}</p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="space-y-2">
            <Label htmlFor="access-policy-name" className="text-sm font-medium text-slate-800">
              {copy.policyName}<span className="ml-1 text-red-500">*</span>
            </Label>
            <Input
              id="access-policy-name"
              value={draft.name}
              onChange={(event) => onChange({ name: event.target.value })}
              placeholder={copy.policyNamePlaceholder}
              className="h-11 rounded-xl border-slate-200"
              maxLength={128}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="access-policy-version" className="text-sm font-medium text-slate-800">
                {copy.version}<span className="ml-1 text-red-500">*</span>
              </Label>
              <Input
                id="access-policy-version"
                value={draft.version}
                onChange={(event) => onChange({ version: event.target.value })}
                placeholder="1.0.0"
                className="h-11 rounded-xl border-slate-200 font-mono"
                maxLength={32}
              />
              <p className="text-xs text-slate-400">{copy.versionHint}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="access-policy-priority" className="text-sm font-medium text-slate-800">
                {copy.priority}<span className="ml-1 text-red-500">*</span>
              </Label>
              <Input
                id="access-policy-priority"
                type="number"
                min={0}
                max={255}
                value={draft.priority}
                onChange={(event) => onChange({ priority: Number(event.target.value) })}
                className="h-11 rounded-xl border-slate-200 font-mono"
              />
              <p className="text-xs text-slate-400">{copy.priorityHint}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-800">{copy.priority}</span>
              <span className="rounded-lg bg-white px-2.5 py-1 font-mono font-semibold text-blue-700 shadow-sm">{draft.priority}</span>
            </div>
            <Slider
              value={[Math.min(255, Math.max(0, Number.isFinite(draft.priority) ? draft.priority : 0))]}
              min={0}
              max={255}
              step={1}
              onValueChange={([value]) => onChange({ priority: value })}
              className="mt-5"
            />
            <div className="mt-2 flex justify-between text-[11px] text-slate-400">
              <span>0</span>
              <span>128</span>
              <span>255</span>
            </div>
          </div>

          {complete ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <BadgeCheck className="h-4 w-4" />
              {copy.policyReady}
            </div>
          ) : null}
        </div>
      </div>

      <footer className="flex shrink-0 justify-end border-t border-slate-200 px-6 py-4">
        <Button onClick={onNext} className="h-11 bg-blue-600 px-6 text-white hover:bg-blue-700">
          {copy.nextRules}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </footer>
    </section>
  )
}
