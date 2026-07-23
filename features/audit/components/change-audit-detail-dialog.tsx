"use client"

import {
  Braces,
  CalendarClock,
  FileCheck2,
  FilePenLine,
  FilePlus2,
  FileOutput,
  Hash,
  RotateCcw,
  Settings2,
  Tag,
  TerminalSquare,
  Trash2,
  UserRound,
  type LucideIcon,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import type { ChangeAuditAction, ChangeAuditEvent, DispatchType } from "@/features/audit/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog"

interface ChangeAuditDetailDialogProps {
  event?: ChangeAuditEvent
  open: boolean
  onClose: () => void
}

const actionVisuals: Record<ChangeAuditAction, { icon: LucideIcon; iconClass: string }> = {
  created: { icon: FilePlus2, iconClass: "text-emerald-600" },
  updated: { icon: FilePenLine, iconClass: "text-blue-600" },
  ensured: { icon: FileCheck2, iconClass: "text-cyan-600" },
  deleted: { icon: Trash2, iconClass: "text-rose-600" },
  deleteAborted: { icon: RotateCcw, iconClass: "text-amber-600" },
}

const objectVisuals: Record<Exclude<DispatchType, "all">, { icon: LucideIcon; iconClass: string }> = {
  policy: { icon: FileOutput, iconClass: "text-blue-600" },
  command: { icon: TerminalSquare, iconClass: "text-cyan-600" },
  config: { icon: Settings2, iconClass: "text-indigo-600" },
}

const hiddenPayloadKeys = new Set([
  "request_fingerprint",
  "capability_profile",
  "content_hash",
  "request_id",
  "operation_id",
  "delete_cycle_id",
  "version",
  "previous_version",
])

function formatDate(value: string, locale: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(date)
}

function formatValue(value: unknown) {
  if (value === undefined || value === null || value === "") return "-"
  if (typeof value === "object") {
    try { return JSON.stringify(value, null, 2) } catch { return String(value) }
  }
  return String(value)
}

function actorTypeLabel(type: string, translate: (key: "actorTypes.operator" | "actorTypes.system" | "actorTypes.publisher" | "actorTypes.reconciler") => string) {
  const normalized = type.toLowerCase()
  if (normalized === "operator" || normalized === "system" || normalized === "publisher" || normalized === "reconciler") {
    return translate(`actorTypes.${normalized}` as "actorTypes.operator" | "actorTypes.system" | "actorTypes.publisher" | "actorTypes.reconciler")
  }
  return type || "-"
}

function InfoField({ label, value, icon: Icon, iconClass, mono = false }: { label: string; value: string; icon: LucideIcon; iconClass: string; mono?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2 border-b border-slate-200 px-3 py-2">
      <dt className="flex min-w-0 shrink-0 items-center gap-1.5 text-xs text-slate-400"><Icon className={`h-3.5 w-3.5 ${iconClass}`} aria-hidden="true" />{label}:</dt>
      <dd className={`min-w-0 truncate text-slate-700 ${mono ? "font-mono text-xs" : "text-sm"}`} title={value}>{value || "-"}</dd>
    </div>
  )
}

export function ChangeAuditDetailDialog({ event, open, onClose }: ChangeAuditDetailDialogProps) {
  const t = useTranslations("pages.audit.changeAudit")
  const locale = useLocale()
  if (!event) return null

  const actionVisual = actionVisuals[event.action]
  const ActionIcon = actionVisual.icon
  const objectVisual = objectVisuals[event.objectType]
  const ObjectIcon = objectVisual.icon
  const payloadRows = Object.entries(event.payload).filter(([key, value]) => !hiddenPayloadKeys.has(key) && value !== undefined && value !== "")

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="flex max-h-[calc(100vh-32px)] w-[calc(100vw-32px)] max-w-none flex-col gap-0 overflow-hidden border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[900px]">
        <DialogHeader className="shrink-0 px-6 py-5 pr-14 text-left">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600"><Braces className="h-5 w-5" aria-hidden="true" /></span>
            <DialogTitle className="truncate text-lg font-semibold text-slate-950">{t("detailTitle")}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto px-6 pb-6 pt-3">
          <dl className="grid min-w-0 grid-cols-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/40 text-sm sm:grid-cols-2">
            <InfoField label={t("columns.action")} value={t(`actions.${event.action}`)} icon={ActionIcon} iconClass={actionVisual.iconClass} />
            <InfoField label={t("columns.time")} value={formatDate(event.occurredAt, locale)} icon={CalendarClock} iconClass="text-blue-500" />
            <InfoField label={t("columns.objectType")} value={t(`objects.${event.objectType}`)} icon={ObjectIcon} iconClass={objectVisual.iconClass} />
            <InfoField label={t("columns.objectName")} value={event.objectName} icon={Tag} iconClass="text-cyan-500" />
            <InfoField label={t("columns.objectId")} value={event.objectId} icon={Hash} iconClass="text-slate-500" mono />
            <InfoField label={t("columns.version")} value={event.objectVersion || "-"} icon={Tag} iconClass="text-indigo-500" mono />
            <InfoField label={t("columns.actor")} value={event.actorId} icon={UserRound} iconClass="text-violet-500" mono />
            <InfoField label={t("columns.actorType")} value={actorTypeLabel(event.actorType, t)} icon={UserRound} iconClass="text-violet-500" />
            <InfoField label={t("eventType")} value={event.eventType} icon={Braces} iconClass="text-blue-600" mono />
            <InfoField label={t("operationId")} value={event.operationId || "-"} icon={Hash} iconClass="text-sky-500" mono />
            <InfoField label={t("requestId")} value={event.requestId || "-"} icon={Hash} iconClass="text-sky-500" mono />
          </dl>

          <section className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <header className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3"><Braces className="h-4 w-4 text-sky-600" aria-hidden="true" /><h3 className="text-sm font-semibold text-slate-900">{t("payloadTitle")}</h3></header>
            {payloadRows.length > 0 ? (
              <dl className="divide-y divide-slate-100">
                {payloadRows.map(([key, value]) => (
                  <div key={key} className="grid gap-2 px-4 py-3 sm:grid-cols-[180px_minmax(0,1fr)]">
                    <dt className="text-xs font-medium text-slate-500">{key.replaceAll("_", " ")}</dt>
                    <dd className="whitespace-pre-wrap break-words font-mono text-xs text-slate-700">{formatValue(value)}</dd>
                  </div>
                ))}
              </dl>
            ) : <p className="px-4 py-6 text-center text-sm text-slate-500">{t("noPayload")}</p>}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
