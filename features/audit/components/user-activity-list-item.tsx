"use client"

import { useState } from "react"
import {
  BadgeCheck,
  ChevronDown,
  CircleCheck,
  CircleEllipsis,
  CircleX,
  KeyRound,
  ShieldCheck,
  UserCog,
  UserMinus,
  UserPlus,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import type { UserActionType, UserActivityAudit } from "@/features/audit/types"

interface UserActivityListItemProps {
  audit: UserActivityAudit
}

function actionVisual(actionType: UserActionType) {
  switch (actionType) {
    case "ADD_USER":
      return { icon: UserPlus, iconClass: "text-emerald-700", surfaceClass: "bg-emerald-50", badgeClass: "bg-emerald-50 text-emerald-800" }
    case "UPDATE_USER":
      return { icon: UserCog, iconClass: "text-blue-700", surfaceClass: "bg-blue-50", badgeClass: "bg-blue-50 text-blue-800" }
    case "PASSWORD_CHANGE":
      return { icon: KeyRound, iconClass: "text-violet-700", surfaceClass: "bg-violet-50", badgeClass: "bg-violet-50 text-violet-800" }
    case "STATUS_CHANGE":
      return { icon: ShieldCheck, iconClass: "text-cyan-700", surfaceClass: "bg-cyan-50", badgeClass: "bg-cyan-50 text-cyan-800" }
    case "ROLE_CHANGE":
      return { icon: BadgeCheck, iconClass: "text-indigo-700", surfaceClass: "bg-indigo-50", badgeClass: "bg-indigo-50 text-indigo-800" }
    case "DELETE_USER":
      return { icon: UserMinus, iconClass: "text-rose-700", surfaceClass: "bg-rose-50", badgeClass: "bg-rose-50 text-rose-800" }
    default:
      return { icon: CircleEllipsis, iconClass: "text-slate-600", surfaceClass: "bg-slate-100", badgeClass: "bg-slate-100 text-slate-700" }
  }
}

function actionLabelKey(actionType: UserActionType) {
  switch (actionType) {
    case "ADD_USER": return "addUser"
    case "UPDATE_USER": return "updateUser"
    case "PASSWORD_CHANGE": return "passwordChange"
    case "STATUS_CHANGE": return "statusChange"
    case "ROLE_CHANGE": return "roleChange"
    case "DELETE_USER": return "deleteUser"
    default: return "other"
  }
}

function detailValue(value: unknown) {
  if (value === null) return "null"
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

export function UserActivityListItem({ audit }: UserActivityListItemProps) {
  const [expanded, setExpanded] = useState(false)
  const t = useTranslations("pages.audit.userActivity")
  const locale = useLocale()
  const visual = actionVisual(audit.actionType)
  const ActionIcon = visual.icon
  const ResultIcon = audit.result === "SUCCESS" ? CircleCheck : CircleX
  const targetLabel = audit.targetName || audit.targetId || t("unknownTarget")
  const detailId = `user-audit-detail-${audit.eventId.replace(/[^a-zA-Z0-9_-]/g, "-")}`
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
  const detailEntries = [
    [t("details.eventId"), audit.eventId] as const,
    [t("details.actorId"), audit.userId] as const,
    ...Object.entries(audit.details ?? {}).map(([key, value]) => [detailLabels[key] ?? key.replaceAll("_", " "), detailValue(value)] as const),
  ]
  const formattedTime = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(audit.timestamp))

  return (
    <li className="group bg-white transition-colors hover:bg-slate-50/80 focus-within:bg-sky-50/40">
      <div className="grid min-w-0 gap-3 px-4 py-3.5 sm:grid-cols-2 xl:grid-cols-[minmax(180px,1.1fr)_150px_minmax(220px,1.25fr)_180px_100px_44px] xl:items-center">
        <div className="flex min-w-0 items-center gap-3 sm:col-span-2 xl:col-span-1">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${visual.surfaceClass}`}>
            <ActionIcon className={`h-4 w-4 ${visual.iconClass}`} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900" title={audit.username}>{audit.username || t("unknownActor")}</p>
            <p className="mt-0.5 truncate font-mono text-xs text-slate-500" title={audit.userId}>{audit.userId}</p>
          </div>
        </div>

        <div className="min-w-0">
          <span className="mb-1 block text-xs font-medium text-slate-400 xl:hidden">{t("columns.action")}</span>
          <span className={`inline-flex max-w-full items-center rounded-md px-2.5 py-1 text-xs font-semibold ${visual.badgeClass}`}>
            <span className="truncate">{t(actionLabelKey(audit.actionType))}</span>
          </span>
        </div>

        <div className="min-w-0">
          <span className="mb-1 block text-xs font-medium text-slate-400 xl:hidden">{t("columns.target")}</span>
          <p className="truncate text-sm font-medium text-slate-800" title={targetLabel}>{targetLabel}</p>
          <p className="mt-0.5 truncate font-mono text-xs text-slate-500" title={audit.targetId}>{audit.targetId || "-"}</p>
        </div>

        <div className="min-w-0">
          <span className="mb-1 block text-xs font-medium text-slate-400 xl:hidden">{t("columns.time")}</span>
          <time className="whitespace-nowrap text-xs tabular-nums text-slate-600" dateTime={audit.timestamp}>{formattedTime}</time>
        </div>

        <div className="min-w-0">
          <span className="mb-1 block text-xs font-medium text-slate-400 xl:hidden">{t("columns.result")}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
            <ResultIcon className={`h-3.5 w-3.5 ${audit.result === "SUCCESS" ? "text-emerald-600" : "text-rose-600"}`} aria-hidden="true" />
            {audit.result === "SUCCESS" ? t("success") : t("failed")}
          </span>
        </div>

        <div className="flex items-end justify-end sm:items-center">
          <button
            type="button"
            aria-label={expanded ? t("hideDetails") : t("showDetails")}
            aria-expanded={expanded}
            aria-controls={detailId}
            onClick={() => setExpanded((value) => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-sky-50 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
          >
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      {expanded && (
        <div id={detailId} className="border-t border-slate-100 bg-slate-50/60 px-4 py-4">
          <div className="mb-3 text-xs font-semibold text-slate-700">{t("eventDetails")}</div>
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
            {detailEntries.map(([label, value], index) => (
              <div key={`${label}-${index}`} className="min-w-0">
                <dt className="text-xs font-medium text-slate-500">{label}</dt>
                <dd className="mt-1 break-all font-mono text-xs leading-5 text-slate-800">{value || "-"}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </li>
  )
}
