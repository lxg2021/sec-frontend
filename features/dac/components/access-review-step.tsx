"use client"

import { CheckCircle2, ChevronLeft, CircleAlert, FileCheck2, LoaderCircle, Monitor, RotateCw, Send, Waypoints } from "lucide-react"

import type { AccessControlCopy } from "../access-control-copy"
import type { AccessControlOperation, AccessControlPolicyDraft, CreatedAccessControlPolicy } from "../access-control-types"
import { getCreatePolicyPath } from "../api"
import type { HostSelectorHostNode } from "@/shared/components/host-selector/types"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"

interface AccessReviewStepProps {
  copy: AccessControlCopy
  draft: AccessControlPolicyDraft
  selectedHosts: HostSelectorHostNode[]
  createdPolicy: CreatedAccessControlPolicy | null
  operation: AccessControlOperation | null
  error: string
  submitting: boolean
  onBack: () => void
  onConfirm: () => void
}

export function AccessReviewStep({
  copy,
  draft,
  selectedHosts,
  createdPolicy,
  operation,
  error,
  submitting,
  onBack,
  onConfirm,
}: AccessReviewStepProps) {
  const offlineCount = selectedHosts.filter((host) => host.status?.trim().toLowerCase() === "offline").length
  const objectCount = draft.type === "network" ? 1 : draft.objectPaths.length
  const ruleCount = draft.type === "network" ? 1 : draft.rules.length
  const completed = Boolean(operation)
  const retryOnly = Boolean(createdPolicy && !operation)

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-6 py-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <FileCheck2 className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{copy.reviewTitle}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{copy.reviewHint}</p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <div className="grid gap-5 xl:grid-cols-2">
          <ReviewCard icon={FileCheck2} title={copy.policyObject}>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <ReviewField label={copy.policyName} value={draft.name} />
              <ReviewField label={copy.policyType} value={copy.policyTypes[draft.type][0]} />
              <ReviewField label={copy.version} value={draft.version} mono />
              <ReviewField label={copy.priority} value={String(draft.priority)} />
              <ReviewField label={copy.subjectCount} value={String(draft.type === "network" ? 0 : draft.subjects.length)} />
              <ReviewField label={copy.objectCount} value={String(objectCount)} />
              <ReviewField label={copy.ruleCount} value={String(ruleCount)} />
            </dl>
          </ReviewCard>

          <ReviewCard icon={Monitor} title={copy.targetScope}>
            <div className="grid grid-cols-2 gap-3">
              <Metric label={copy.targetHostCount} value={selectedHosts.length} tone="blue" />
              <Metric label={copy.offlineHostCount} value={offlineCount} tone={offlineCount > 0 ? "amber" : "slate"} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedHosts.slice(0, 5).map((host) => (
                <Badge key={host.hostId || host.id} variant="secondary" className="max-w-48 font-normal">
                  <span className="truncate">{host.hostname || host.name || host.hostId}</span>
                </Badge>
              ))}
              {selectedHosts.length > 5 ? <Badge variant="outline">+{selectedHosts.length - 5}</Badge> : null}
            </div>
            {offlineCount > 0 ? (
              <div className="mt-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                {copy.offlineHint}
              </div>
            ) : null}
          </ReviewCard>
        </div>

        <ReviewCard icon={Waypoints} title={copy.dispatchFlow} className="mt-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
            <FlowStage
              number={1}
              title={copy.createObject}
              description={copy.createObjectHint}
              endpoint={`POST ${getCreatePolicyPath(draft.type)}`}
              done={Boolean(createdPolicy)}
            />
            <div className="hidden h-px w-12 bg-slate-300 lg:block" />
            <FlowStage
              number={2}
              title={copy.applyHosts}
              description={copy.applyHostsHint}
              endpoint="POST /api/v1/sensor/control/pmc/objects/operate"
              done={Boolean(operation)}
            />
          </div>
        </ReviewCard>

        {error ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div className="flex items-center gap-2 font-semibold"><CircleAlert className="h-4 w-4" />{retryOnly ? copy.dispatchFailed : copy.validationFailed}</div>
            <p className="mt-2 break-words text-xs leading-5 text-red-700">{error}</p>
          </div>
        ) : null}

        {completed && createdPolicy && operation ? (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
              <CheckCircle2 className="h-5 w-5" />
              {copy.dispatchSuccess}
            </div>
            <dl className="mt-4 grid gap-4 text-xs md:grid-cols-3">
              <ReviewField label={copy.objectId} value={createdPolicy.objectId} mono />
              <ReviewField label={copy.operationId} value={operation.operationId} mono />
              <ReviewField label={copy.status} value={operation.status || operation.planningStatus || "pending"} mono />
            </dl>
            <p className="mt-4 text-xs leading-5 text-emerald-800">{copy.resultHint}</p>
          </div>
        ) : null}
      </div>

      <footer className="flex shrink-0 items-center justify-between border-t border-slate-200 px-6 py-4">
        <Button variant="outline" onClick={onBack} disabled={submitting} className="h-11 px-5">
          <ChevronLeft className="mr-2 h-4 w-4" />
          {copy.previous}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={submitting || completed || selectedHosts.length === 0}
          className="h-11 bg-slate-950 px-6 text-white hover:bg-slate-800"
        >
          {submitting ? (
            <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />{copy.submitting}</>
          ) : retryOnly ? (
            <><RotateCw className="mr-2 h-4 w-4" />{copy.retryDispatch}</>
          ) : (
            <><Send className="mr-2 h-4 w-4" />{copy.confirmDispatch}</>
          )}
        </Button>
      </footer>
    </section>
  )
}

function ReviewCard({ icon: Icon, title, children, className = "" }: { icon: typeof FileCheck2; title: string; children: React.ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-slate-200 bg-slate-50/60 p-5 ${className}`}><h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-950"><Icon className="h-4 w-4 text-blue-600" />{title}</h3>{children}</section>
}

function ReviewField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="min-w-0"><dt className="text-xs text-slate-400">{label}</dt><dd className={`mt-1 truncate font-medium text-slate-900 ${mono ? "font-mono" : ""}`} title={value}>{value || "-"}</dd></div>
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "blue" | "amber" | "slate" }) {
  const colors = tone === "blue" ? "bg-blue-50 text-blue-800" : tone === "amber" ? "bg-amber-50 text-amber-800" : "bg-white text-slate-800"
  return <div className={`rounded-xl px-4 py-3 ${colors}`}><div className="text-2xl font-bold tabular-nums">{value}</div><div className="mt-1 text-xs opacity-75">{label}</div></div>
}

function FlowStage({ number, title, description, endpoint, done }: { number: number; title: string; description: string; endpoint: string; done: boolean }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex gap-3"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${done ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>{done ? <CheckCircle2 className="h-4 w-4" /> : number}</span><div className="min-w-0"><div className="text-sm font-semibold text-slate-900">{title}</div><div className="mt-0.5 text-xs text-slate-500">{description}</div><div className="mt-3 overflow-hidden text-ellipsis rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-[10px] text-slate-600" title={endpoint}>{endpoint}</div></div></div></div>
}
