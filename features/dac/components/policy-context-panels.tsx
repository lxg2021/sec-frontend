"use client"

import { Activity, FileText, Globe2, ListChecks, Network, PlaySquare, ShieldCheck, Users, Waypoints } from "lucide-react"

import type { AccessControlCopy } from "../access-control-copy"
import type { AccessControlPolicyDraft, AccessPolicyType } from "../access-control-types"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"

const TYPE_ICONS = {
  file: FileText,
  registry: ListChecks,
  process: PlaySquare,
  network: Network,
}

interface PolicyTypePanelProps {
  copy: AccessControlCopy
  draft: AccessControlPolicyDraft
  onTypeChange: (type: AccessPolicyType) => void
}

export function PolicyTypePanel({ copy, draft, onTypeChange }: PolicyTypePanelProps) {
  return (
    <aside className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-950">{copy.policyType}</h2>
        <p className="mt-1 text-xs text-slate-500">{copy.policyTypeHint}</p>
      </div>

      <div className="space-y-2">
        {(Object.keys(copy.policyTypes) as AccessPolicyType[]).map((type) => {
          const Icon = TYPE_ICONS[type]
          const active = draft.type === type
          const [title, description] = copy.policyTypes[type]
          return (
            <button
              key={type}
              type="button"
              onClick={() => onTypeChange(type)}
              className={cn(
                "relative flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
                active
                  ? "border-blue-300 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              {active ? <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-blue-600" /> : null}
              <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", active ? "bg-blue-100" : "bg-slate-100")}>
                <Icon className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{title}</span>
                <span className="mt-0.5 block truncate text-[11px] text-slate-500">{description}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-5 border-t border-slate-200 pt-4">
        <h3 className="text-sm font-semibold text-slate-900">{copy.basicInfo}</h3>
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3 text-xs">
          <div className="col-span-2">
            <dt className="text-slate-400">{copy.policyName}</dt>
            <dd className="mt-1 truncate font-medium text-slate-900" title={draft.name || copy.notConfigured}>
              {draft.name || copy.notConfigured}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">{copy.version}</dt>
            <dd className="mt-1 font-mono font-medium text-slate-900">{draft.version || "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-400">{copy.priority}</dt>
            <dd className="mt-1 font-semibold text-slate-900">{draft.priority}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] text-slate-600">
        <div className="font-medium text-slate-800">{copy.priorityHint}</div>
      </div>
    </aside>
  )
}

interface PolicySummaryPanelProps {
  copy: AccessControlCopy
  draft: AccessControlPolicyDraft
  selectedHostCount: number
}

export function PolicySummaryPanel({ copy, draft, selectedHostCount }: PolicySummaryPanelProps) {
  const configuredSubjectCount = draft.subjects.filter((subject) => {
    if (subject.type === "process") {
      return subject.paths.some((path) => path.trim()) || subject.hashes.some((hash) => hash.value.trim())
    }
    return subject.accounts.some((account) => account.sid.trim())
  }).length
  const objectCount = draft.type === "network" ? (draft.network.programPath.trim() ? 1 : 0) : draft.objectPaths.length
  const ruleCount = draft.type === "network" ? 1 : draft.rules.length
  const typeLabel = copy.policyTypes[draft.type][0]

  return (
    <aside className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">{copy.summary}</h2>
          <p className="mt-1 text-xs text-slate-500">{copy.summaryHint}</p>
        </div>
        <Badge className="shrink-0 whitespace-nowrap border-0 bg-amber-50 text-amber-700 hover:bg-amber-50">
          <Activity className="mr-1 h-3 w-3" />
          {copy.configuring}
        </Badge>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 text-xs">
        <div className="col-span-2">
          <dt className="text-slate-400">{copy.policyName}</dt>
          <dd className="mt-1 truncate text-sm font-semibold text-slate-950">{draft.name || copy.notConfigured}</dd>
        </div>
        <div>
          <dt className="text-slate-400">{copy.policyType}</dt>
          <dd className="mt-1 font-medium text-blue-700">{typeLabel}</dd>
        </div>
        <div>
          <dt className="text-slate-400">{copy.version}</dt>
          <dd className="mt-1 font-mono text-slate-900">{draft.version || "-"}</dd>
        </div>
      </dl>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 text-xs font-semibold text-slate-700">{copy.ruleCount}</div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <SummaryMetric icon={Users} label={copy.subjectCount} value={draft.type === "network" ? 0 : configuredSubjectCount} />
          <SummaryMetric icon={ShieldCheck} label={copy.objectCount} value={objectCount} />
          <SummaryMetric icon={Waypoints} label={copy.ruleCount} value={ruleCount} />
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-slate-950">{copy.createAndDispatch}</h3>
        <ol className="mt-3 space-y-4">
          <FlowItem number={1} title={copy.createObject} description={copy.createObjectHint} active />
          <FlowItem number={2} title={copy.applyHosts} description={copy.applyHostsHint} active={selectedHostCount > 0} />
        </ol>
      </div>

      {selectedHostCount === 0 ? (
        <div className="mt-auto rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <div className="font-semibold">{copy.hostsNotSelected}</div>
          <div className="mt-1 leading-5 text-amber-700">{copy.hostsNotSelectedHint}</div>
        </div>
      ) : (
        <div className="mt-auto rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
          {copy.selectedHosts(selectedHostCount)}
        </div>
      )}
    </aside>
  )
}

function SummaryMetric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white px-2 py-2.5 shadow-sm">
      <Icon className="mx-auto h-4 w-4 text-blue-500" />
      <div className="mt-1 text-lg font-bold tabular-nums text-slate-950">{value}</div>
      <div className="truncate text-[10px] text-slate-500">{label}</div>
    </div>
  )
}

function FlowItem({ number, title, description, active }: { number: number; title: string; description: string; active: boolean }) {
  return (
    <li className="flex gap-3">
      <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold", active ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500")}>
        {number}
      </span>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-slate-900">{title}</div>
        <div className="mt-0.5 text-[11px] leading-4 text-slate-500">{description}</div>
      </div>
    </li>
  )
}
