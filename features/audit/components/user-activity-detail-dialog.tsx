"use client"

import { CalendarClock, CircleCheck, CircleX, Network, UserCog } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import type { UserActivityAudit } from "@/features/audit/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { userActionLabelKey, userAuditDetailValue, userTargetTypeLabelKey } from "./user-activity-presentation"

interface UserActivityDetailDialogProps {
  audit?: UserActivityAudit
  open: boolean
  onClose: () => void
}

interface DetailFieldProps {
  label: string
  value: string
  mono?: boolean
}

function DetailField({ label, value, mono = false }: DetailFieldProps) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-slate-400">{label}</dt>
      <dd className={`mt-1 whitespace-pre-wrap break-all text-sm leading-5 text-slate-800 ${mono ? "font-mono text-xs" : ""}`}>
        {value || "-"}
      </dd>
    </div>
  )
}

export function UserActivityDetailDialog({ audit, open, onClose }: UserActivityDetailDialogProps) {
  const t = useTranslations("pages.audit.userActivity")
  const locale = useLocale()

  if (!audit) return null

  const formattedTime = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(audit.timestamp))
  const resultLabel = audit.result === "SUCCESS" ? t("success") : t("failed")
  const ResultIcon = audit.result === "SUCCESS" ? CircleCheck : CircleX
  const detailLabels: Record<string, string> = {
    eventType: t("details.eventType"),
    requestId: t("details.requestId"),
    actorType: t("details.actorType"),
    targetUsername: t("details.targetUsername"),
    oldRole: t("details.oldRole"),
    newRole: t("details.newRole"),
    oldStatus: t("details.oldStatus"),
    newStatus: t("details.newStatus"),
    changed_fields: t("details.changedFields"),
  }
  const detailEntries = Object.entries(audit.details ?? {})

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="flex max-h-[calc(100vh-32px)] w-[calc(100vw-32px)] max-w-none flex-col gap-0 overflow-hidden border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[920px]">
        <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-5 pr-14 text-left">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <UserCog className="h-5 w-5" aria-hidden="true" />
            </span>
            <DialogTitle className="truncate text-lg font-semibold text-slate-950">{t("detailTitle")}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <dl className="grid gap-x-8 gap-y-4 rounded-xl border border-slate-200 bg-slate-50/40 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label={t("columns.action")} value={t(userActionLabelKey(audit.actionType))} />
            <div className="min-w-0">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <CalendarClock className="h-3.5 w-3.5 text-sky-500" aria-hidden="true" />
                {t("columns.time")}
              </dt>
              <dd className="mt-1 whitespace-nowrap text-sm tabular-nums text-slate-800">{formattedTime}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs font-medium text-slate-400">{t("columns.result")}</dt>
              <dd className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-slate-800">
                <ResultIcon className={`h-4 w-4 ${audit.result === "SUCCESS" ? "text-emerald-600" : "text-rose-600"}`} aria-hidden="true" />
                {resultLabel}
              </dd>
            </div>
            <DetailField label={t("actor")} value={audit.username || t("unknownActor")} />
            <DetailField label={t("details.actorId")} value={userAuditDetailValue(audit.userId)} mono />
            <DetailField label={t("details.eventId")} value={userAuditDetailValue(audit.eventId)} mono />
            <DetailField label={t("targetName")} value={userAuditDetailValue(audit.targetName)} />
            <DetailField label={t("targetId")} value={userAuditDetailValue(audit.targetId)} mono />
            <DetailField label={t("targetType")} value={t(userTargetTypeLabelKey(audit.targetType))} />
            <div className="min-w-0">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <Network className="h-3.5 w-3.5 text-cyan-500" aria-hidden="true" />
                {t("sourceIp")}
              </dt>
              <dd className="mt-1 break-all font-mono text-xs leading-5 text-slate-800">{audit.sourceIp || "-"}</dd>
            </div>
          </dl>

          <section className="mt-5" aria-labelledby="user-audit-detail-fields-title">
            <h3 id="user-audit-detail-fields-title" className="text-sm font-semibold text-slate-900">{t("detailFields")}</h3>
            {detailEntries.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">{t("noDetailFields")}</p>
            ) : (
              <dl className="mt-3 grid gap-x-8 gap-y-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                {detailEntries.map(([key, value]) => (
                  <DetailField
                    key={key}
                    label={detailLabels[key] ?? key.replaceAll("_", " ")}
                    value={userAuditDetailValue(value)}
                    mono
                  />
                ))}
              </dl>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
