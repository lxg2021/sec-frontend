"use client"

import { Waypoints } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { AttackWorkflowSpine } from "./attack-workflow-spine"
import type {
  AttackWorkflowDisplayStage,
  AttackWorkflowItem,
  AttackWorkflowStatus,
} from "@/features/attack/workflow/types"
import {
  normalizeWorkflowStatus,
  workflowDisplayStageForStatus,
} from "@/features/attack/workflow/utils"
import { cn } from "@/shared/lib/utils"
import { Card } from "@/shared/ui/card"

interface AttackWorkflowProcessCardProps {
  loading?: boolean
  onStatusSelect?: (status: AttackWorkflowStatus) => void
  recommendedStatus: AttackWorkflowStatus | null
  selectedStatus?: AttackWorkflowStatus | null
  workflow: AttackWorkflowItem | null
}

const STATUS_LABELS: Record<AttackWorkflowStatus, string> = {
  detected: "statuses.detected",
  investigating: "statuses.investigating",
  confirmed: "statuses.confirmed",
  forensics: "statuses.forensics",
  responding: "statuses.responding",
  contained: "statuses.contained",
  remediated: "statuses.remediated",
  closed: "statuses.closed",
}

const DISPLAY_STAGE_LABELS: Record<AttackWorkflowDisplayStage, string> = {
  discovery: "displayStages.discovery",
  investigation: "displayStages.investigation",
  forensics: "displayStages.forensics",
  response: "displayStages.response",
  closed: "displayStages.closed",
}

function displayHeaderValue(value?: string) {
  return value?.trim() || "-"
}

function displayWorkflowTitle(value?: string) {
  const normalized = value
    ?.trim()
    .replace(/^\u653b\u51fb\u94fe[:\uff1a]\s*/i, "")
  return normalized || "-"
}

type WorkflowCenterT = ReturnType<typeof useTranslations>

function isChineseLocale(locale: string) {
  return locale.toLowerCase().startsWith("zh")
}

function statusLabel(t: WorkflowCenterT, status: string) {
  const normalized = normalizeWorkflowStatus(status)
  return normalized ? t(STATUS_LABELS[normalized]) : status || t("unknown")
}

function displayStageLabel(t: WorkflowCenterT, status: string) {
  const stage = workflowDisplayStageForStatus(status)
  return stage ? t(DISPLAY_STAGE_LABELS[stage]) : t("unknown")
}

function processNotice(
  t: WorkflowCenterT,
  workflow: AttackWorkflowItem | null,
) {
  if (!workflow) return ""

  const normalized = normalizeWorkflowStatus(workflow.status)
  const closeReason = workflow.close_reason.trim()
  if (normalized === "closed") {
    return closeReason
      ? t("process.currentStageStatusWithReason", {
          reason: closeReason,
          stage: displayStageLabel(t, normalized),
          status: statusLabel(t, normalized),
        })
      : t("process.currentStageStatus", {
          stage: displayStageLabel(t, normalized),
          status: statusLabel(t, normalized),
        })
  }
  if (normalized) {
    return t("process.currentStageStatus", {
      stage: displayStageLabel(t, normalized),
      status: statusLabel(t, normalized),
    })
  }
  return t("process.unknownStatus")
}

function processNoticeTone(workflow: AttackWorkflowItem | null) {
  const normalized = normalizeWorkflowStatus(workflow?.status ?? "")
  switch (normalized) {
    case "closed":
      return "border-green-100 bg-green-50/70 text-green-700"
    case "remediated":
      return "border-green-100 bg-green-50/70 text-green-700"
    case "contained":
      return "border-emerald-100 bg-emerald-50/70 text-emerald-700"
    case "responding":
      return "border-teal-100 bg-teal-50/70 text-teal-700"
    case "forensics":
      return "border-violet-100 bg-violet-50/70 text-violet-700"
    case "confirmed":
      return "border-blue-100 bg-blue-50/70 text-blue-700"
    case "investigating":
      return "border-cyan-100 bg-cyan-50/70 text-cyan-700"
    case "detected":
      return "border-amber-100 bg-amber-50/70 text-amber-700"
    default:
      return "border-slate-200 bg-slate-50 text-slate-600"
  }
}

function WorkflowHeader({
  isChinese,
  loading,
  t,
  workflow,
}: {
  isChinese: boolean
  loading: boolean
  t: WorkflowCenterT
  workflow: AttackWorkflowItem | null
}) {
  const title =
    loading && !workflow
      ? t("process.titleLoading")
      : displayWorkflowTitle(workflow?.title)
  const caseId =
    loading && !workflow ? t("loading") : displayHeaderValue(workflow?.case_id)

  return (
    <header className="flex min-w-0 items-center gap-3 px-5 py-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Waypoints className="size-5" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <h2
          className={cn(
            "line-clamp-2 break-words text-base font-medium leading-6 text-slate-950",
            isChinese && "font-medium",
            loading && !workflow && "text-slate-400",
          )}
          title={title}
        >
          {title}
        </h2>

        <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-2 text-xs leading-5 text-slate-500">
          <span
            className={cn(
              "min-w-0 max-w-full font-mono text-xs font-semibold leading-5 text-slate-500",
              loading && !workflow && "text-slate-400",
            )}
            title={caseId}
          >
            <span className="line-clamp-2 break-all">{caseId}</span>
          </span>
        </div>
      </div>
    </header>
  )
}

export function AttackWorkflowProcessCard({
  loading = false,
  onStatusSelect,
  recommendedStatus,
  selectedStatus = null,
  workflow,
}: AttackWorkflowProcessCardProps) {
  const t = useTranslations("pages.attack.workflowCenter")
  const locale = useLocale()
  const isChinese = isChineseLocale(locale)
  const notice = processNotice(t, workflow)

  return (
    <Card className="min-h-0 min-w-0 w-full overflow-hidden rounded-[24px] border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      <WorkflowHeader
        isChinese={isChinese}
        loading={loading}
        t={t}
        workflow={workflow}
      />

      <div className="border-t border-slate-100">
        <AttackWorkflowSpine
          workflow={workflow}
          loading={loading}
          recommendedStatus={recommendedStatus}
          selectedStatus={selectedStatus}
          density="dense"
          layout="auto"
          variant="embedded"
          onStatusSelect={onStatusSelect}
          showFootnotes={false}
        />
      </div>

      {notice ? (
        <div className="border-t border-slate-100 px-4 py-3">
          <div
            className={cn(
              "rounded-2xl border px-4 py-3 text-sm font-medium",
              processNoticeTone(workflow),
            )}
          >
            {notice}
          </div>
        </div>
      ) : null}
    </Card>
  )
}
