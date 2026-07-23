"use client"

import {
  Braces,
  CalendarClock,
  CircleCheck,
  CircleX,
  Hash,
  ListChecks,
  Network,
  Tag,
  Target,
  UserCog,
  UserRound,
  type LucideIcon,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import type { UserActivityAudit } from "@/features/audit/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { userActionLabelKey, userActionPresentation, userAuditDetailValue, userTargetTypeLabelKey } from "./user-activity-presentation"

interface UserActivityDetailDialogProps {
  audit?: UserActivityAudit
  open: boolean
  onClose: () => void
}

interface InfoFieldProps {
  label: string
  value: string
  icon: LucideIcon
  iconClass: string
  mono?: boolean
  className?: string
}

interface AuditDetailRow {
  key: string
  label: string
  value: string
}

const HANDLED_DETAIL_KEYS = new Set([
  "changed_fields",
  "oldRole",
  "newRole",
  "oldStatus",
  "newStatus",
  "eventType",
  "requestId",
  "actorType",
  "actorUsername",
  "targetUsername",
  "actorId",
  "userId",
  "username",
  "targetId",
  "targetName",
  "targetType",
  "sourceIp",
  "actionType",
  "result",
  "timestamp",
  "eventId",
].map(normalizeDetailKey))

function normalizeDetailKey(key: string) {
  return key.replaceAll("_", "").replaceAll("-", "").toLowerCase()
}

function hasDetailValue(value: unknown) {
  return value !== undefined && value !== ""
}

function changedFieldsValue(
  value: unknown,
  locale: string,
  handledFields: Set<string>,
  fieldLabels: Record<string, string>,
) {
  if (!Array.isArray(value)) {
    return hasDetailValue(value) ? userAuditDetailValue(value) : ""
  }

  const fields = value
    .filter(
      (item): item is string =>
        typeof item === "string" &&
        item.trim().length > 0 &&
        !handledFields.has(normalizeDetailKey(item.trim())),
    )
    .map((item) => {
      const field = item.trim()
      return fieldLabels[normalizeDetailKey(field)] ?? field
    })
  return fields.join(locale.toLowerCase().startsWith("zh") ? "、" : ", ")
}

function transitionValue(previousValue: unknown, nextValue: unknown) {
  if (!hasDetailValue(previousValue) && !hasDetailValue(nextValue)) return ""

  const previous = userAuditDetailValue(previousValue)
  const next = userAuditDetailValue(nextValue)
  return previous === next ? "" : `${previous} -> ${next}`
}

function InfoField({ label, value, icon: Icon, iconClass, mono = false, className = "" }: InfoFieldProps) {
  const displayValue = value || "-"

  return (
    <div className={`flex min-w-0 items-center gap-2 px-3 py-2 ${className}`}>
      <dt className="flex min-w-0 shrink-0 items-center gap-1.5 truncate text-xs text-slate-400">
        <Icon className={`h-3.5 w-3.5 ${iconClass}`} aria-hidden="true" />
        {label}:
      </dt>
      <dd
        className={`min-w-0 truncate font-medium text-slate-700 ${mono ? "font-mono text-xs" : "text-sm"}`}
        title={displayValue}
      >
        {displayValue}
      </dd>
    </div>
  )
}

function formatDateTime(value: string, locale: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date)
}

export function UserActivityDetailDialog({ audit, open, onClose }: UserActivityDetailDialogProps) {
  const t = useTranslations("pages.audit.userActivity")
  const locale = useLocale()

  if (!audit) return null

  const actionVisual = userActionPresentation(audit.actionType)
  const ActionIcon = actionVisual.icon
  const resultSucceeded = audit.result === "SUCCESS"
  const ResultIcon = resultSucceeded ? CircleCheck : CircleX
  const resultLabel = resultSucceeded ? t("success") : t("failed")
  const resultIconClass = resultSucceeded ? "text-emerald-600" : "text-rose-600"
  const details = audit.details ?? {}
  const detailRows: AuditDetailRow[] = []
  const roleTransition = transitionValue(details.oldRole, details.newRole)
  const statusTransition = transitionValue(details.oldStatus, details.newStatus)
  const representedFields = new Set<string>()
  if (hasDetailValue(details.oldRole) || hasDetailValue(details.newRole)) representedFields.add("role")
  if (hasDetailValue(details.oldStatus) || hasDetailValue(details.newStatus)) representedFields.add("status")
  const changedFieldLabels = {
    username: t("details.fields.username"),
    email: t("details.fields.email"),
    phone: t("details.fields.phone"),
    avatar: t("details.fields.avatar"),
    role: t("details.fields.role"),
    status: t("details.fields.status"),
    password: t("details.fields.password"),
  }
  const changedFields = changedFieldsValue(details.changed_fields, locale, representedFields, changedFieldLabels)

  if (roleTransition) detailRows.push({ key: "role", label: t("roleChange"), value: roleTransition })
  if (statusTransition) detailRows.push({ key: "status", label: t("statusChange"), value: statusTransition })
  if (changedFields) detailRows.push({ key: "changed_fields", label: t("details.changedFields"), value: changedFields })

  Object.entries(details)
    .filter(([key]) => !HANDLED_DETAIL_KEYS.has(normalizeDetailKey(key)))
    .sort(([leftKey], [rightKey]) => leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0)
    .forEach(([key, value]) => {
      detailRows.push({ key, label: key.replaceAll("_", " "), value: userAuditDetailValue(value) })
    })

  const contextRows: AuditDetailRow[] = []
  const contextFields = [
    ["eventType", t("details.eventType")],
    ["requestId", t("details.requestId")],
    ["actorType", t("details.actorType")],
  ] as const
  contextFields.forEach(([key, label]) => {
    if (hasDetailValue(details[key])) {
      const rawValue = userAuditDetailValue(details[key])
      const value = key === "actorType" && ["user", "system"].includes(rawValue.toLowerCase())
        ? t(rawValue.toLowerCase() === "user" ? "user" : "system")
        : rawValue
      contextRows.push({ key, label, value })
    }
  })
  const formattedTime = formatDateTime(audit.timestamp, locale)

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="flex max-h-[calc(100vh-32px)] w-[calc(100vw-32px)] max-w-none flex-col gap-0 overflow-hidden border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[1120px]">
        <DialogHeader className="shrink-0 px-6 py-5 pr-14 text-left">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <UserCog className="h-5 w-5" aria-hidden="true" />
            </span>
            <DialogTitle className="truncate text-lg font-semibold text-slate-950">{t("detailTitle")}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto px-6 pb-6 pt-3">
          <dl className="grid min-w-0 grid-cols-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/40 text-sm sm:grid-cols-2">
              <InfoField
                label={t("columns.action")}
                value={t(userActionLabelKey(audit.actionType))}
                icon={ActionIcon}
                iconClass={actionVisual.iconClass}
                className="border-b border-slate-200 sm:border-r"
              />
              <InfoField
                label={t("columns.time")}
                value={formattedTime}
                icon={CalendarClock}
                iconClass="text-blue-500"
                className="border-b border-slate-200"
              />
              <InfoField
                label={t("columns.result")}
                value={resultLabel}
                icon={ResultIcon}
                iconClass={resultIconClass}
                className="border-b border-slate-200 sm:border-r"
              />
              <InfoField
                label={t("actor")}
                value={audit.username || t("unknownActor")}
                icon={UserRound}
                iconClass="text-violet-500"
                className="border-b border-slate-200"
              />
              <InfoField
                label={t("details.actorId")}
                value={audit.userId}
                icon={Hash}
                iconClass="text-indigo-500"
                mono
                className="border-b border-slate-200 sm:border-r"
              />
              <InfoField
                label={t("details.eventId")}
                value={audit.eventId}
                icon={Hash}
                iconClass="text-sky-500"
                mono
                className="border-b border-slate-200"
              />
              <InfoField
                label={t("targetName")}
                value={audit.targetName || audit.targetId || t("unknownTarget")}
                icon={Target}
                iconClass="text-cyan-500"
                className="border-b border-slate-200 sm:border-r"
              />
              <InfoField
                label={t("targetId")}
                value={audit.targetId || "-"}
                icon={Hash}
                iconClass="text-slate-500"
                mono
                className="border-b border-slate-200"
              />
              <InfoField
                label={t("targetType")}
                value={t(userTargetTypeLabelKey(audit.targetType))}
                icon={Tag}
                iconClass="text-indigo-500"
                className="border-b border-slate-200 sm:border-r"
              />
              <InfoField
                label={t("sourceIp")}
                value={audit.sourceIp || "-"}
                icon={Network}
                iconClass="text-cyan-500"
                mono
                className="border-b border-slate-200"
              />
              {detailRows.map(({ key, label, value }) => (
                <InfoField
                  key={key}
                  label={label}
                  value={value}
                  icon={ListChecks}
                  iconClass="text-amber-600"
                  mono
                  className="border-b border-slate-200 sm:odd:border-r"
                />
              ))}
              {contextRows.map(({ key, label, value }) => (
                <InfoField
                  key={key}
                  label={label}
                  value={value}
                  icon={key === "requestId" ? Hash : Braces}
                  iconClass={key === "requestId" ? "text-slate-500" : "text-blue-600"}
                  mono={key !== "actorType"}
                  className="border-b border-slate-200 sm:odd:border-r"
                />
              ))}
          </dl>
        </div>
      </DialogContent>
    </Dialog>
  )
}
