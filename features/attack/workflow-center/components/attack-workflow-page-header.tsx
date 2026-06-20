"use client"

import Link from "next/link"
import { Loader2, RefreshCw, Workflow } from "lucide-react"

import type {
  AttackWorkflowItem,
  AttackWorkflowStatus,
} from "@/features/attack/workflow/types"
import { normalizeWorkflowStatus } from "@/features/attack/workflow/utils"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"

interface AttackWorkflowPageHeaderHrefs {
  attackDetailHref: string
  traceHref: string
  aiHref: string
}

interface AttackWorkflowPageHeaderProps {
  activeCaseId: string
  activeWorkflowId: string
  canOpenDetails: boolean
  currentStatus: string
  error: string
  hrefs: AttackWorkflowPageHeaderHrefs
  loading: boolean
  onRefresh: () => void | Promise<void>
  updating: boolean
  workflow: AttackWorkflowItem | null
}

const STATUS_LABELS: Record<AttackWorkflowStatus, string> = {
  detected: "Detected",
  investigating: "Investigating",
  confirmed: "Confirmed",
  forensics: "Forensics",
  responding: "Responding",
  contained: "Contained",
  remediated: "Remediated",
  closed: "Closed",
}

function statusLabel(status: string) {
  const normalized = normalizeWorkflowStatus(status)
  return normalized ? STATUS_LABELS[normalized] : status || "Unknown"
}

function displayValue(value?: string) {
  return value?.trim() || "-"
}

function statusTone(status: string) {
  switch (normalizeWorkflowStatus(status)) {
    case "closed":
      return "border-slate-300 bg-slate-100 text-slate-700"
    case "remediated":
    case "contained":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "responding":
    case "forensics":
      return "border-blue-200 bg-blue-50 text-blue-700"
    case "confirmed":
      return "border-amber-200 bg-amber-50 text-amber-700"
    case "investigating":
      return "border-cyan-200 bg-cyan-50 text-cyan-700"
    case "detected":
      return "border-rose-200 bg-rose-50 text-rose-700"
    default:
      return "border-slate-200 bg-slate-50 text-slate-600"
  }
}

export function AttackWorkflowPageHeader({
  activeCaseId,
  activeWorkflowId,
  canOpenDetails,
  currentStatus,
  error,
  hrefs,
  loading,
  onRefresh,
  updating,
  workflow,
}: AttackWorkflowPageHeaderProps) {
  return (
    <Card className="w-full overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <div className="flex w-full min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <Workflow className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <CardTitle className="text-xl font-semibold leading-7 text-slate-950">
                  AttackWorkflow Control Center
                </CardTitle>
                {workflow ? (
                  <Badge
                    variant="outline"
                    className={cn("rounded-full px-2.5", statusTone(currentStatus))}
                  >
                    {statusLabel(currentStatus)}
                  </Badge>
                ) : null}
                {workflow?.severity ? (
                  <Badge
                    variant="outline"
                    className="rounded-full border-rose-200 bg-rose-50 text-rose-700"
                  >
                    {workflow.severity}
                  </Badge>
                ) : null}
              </div>
              <CardDescription className="mt-1 flex min-w-0 flex-wrap gap-x-3 gap-y-1">
                <span className="flex min-w-0 max-w-full items-center gap-2">
                  <span className="shrink-0 font-medium text-slate-500">Case</span>
                  <span className="min-w-0 break-all font-mono text-slate-600">
                    {displayValue(activeCaseId)}
                  </span>
                </span>
                {activeWorkflowId ? (
                  <span className="flex min-w-0 max-w-full items-center gap-2">
                    <span className="shrink-0 font-medium text-slate-500">
                      Workflow
                    </span>
                    <span className="min-w-0 break-all font-mono text-slate-600">
                      {activeWorkflowId}
                    </span>
                  </span>
                ) : null}
              </CardDescription>
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap xl:max-w-[44rem] xl:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => void onRefresh()}
              disabled={loading || updating}
              className="justify-center whitespace-nowrap"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Refresh
            </Button>
            <Button asChild variant="outline" className="justify-center whitespace-nowrap">
              <Link href={hrefs.attackDetailHref}>Attack Cases</Link>
            </Button>
            {canOpenDetails ? (
              <Button asChild variant="outline" className="justify-center whitespace-nowrap">
                <Link href={hrefs.traceHref}>Trace Details</Link>
              </Button>
            ) : (
              <Button variant="outline" disabled className="justify-center whitespace-nowrap">
                Trace Details
              </Button>
            )}
            {canOpenDetails ? (
              <Button asChild className="justify-center whitespace-nowrap">
                <Link href={hrefs.aiHref}>Threat Analysis</Link>
              </Button>
            ) : (
              <Button disabled className="justify-center whitespace-nowrap">
                Threat Analysis
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {error ? (
        <CardContent className="px-5 py-4">
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        </CardContent>
      ) : null}
    </Card>
  )
}
