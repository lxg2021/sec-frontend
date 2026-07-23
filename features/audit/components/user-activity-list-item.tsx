"use client"

import { ChevronRight, CircleCheck, CircleX } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import type { UserActivityAudit } from "@/features/audit/types"
import { userActionLabelKey, userActionPresentation, userTargetTypeLabelKey } from "./user-activity-presentation"

interface UserActivityListItemProps {
  audit: UserActivityAudit
  onView: (audit: UserActivityAudit) => void
}

export function UserActivityListItem({ audit, onView }: UserActivityListItemProps) {
  const t = useTranslations("pages.audit.userActivity")
  const locale = useLocale()
  const visual = userActionPresentation(audit.actionType)
  const ActionIcon = visual.icon
  const ResultIcon = audit.result === "SUCCESS" ? CircleCheck : CircleX
  const actorName = audit.username || t("unknownActor")
  const targetLabel = audit.targetName || audit.targetId || t("unknownTarget")
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
    <tr className="bg-white transition-colors hover:bg-slate-50/80 focus-within:bg-sky-50/50">
      <td className="min-w-0 px-4 py-3">
        <div className="truncate font-medium text-slate-800" title={actorName}>{actorName}</div>
      </td>
      <td className="min-w-0 px-3 py-3">
        <div className="truncate font-mono text-xs text-slate-500" title={audit.userId}>{audit.userId || "-"}</div>
      </td>
      <td className="px-3 py-3">
        <span className={`inline-flex max-w-full items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${visual.badgeClass}`}>
          <ActionIcon className={`h-3.5 w-3.5 shrink-0 ${visual.iconClass}`} aria-hidden="true" />
          <span className="truncate">{t(userActionLabelKey(audit.actionType))}</span>
        </span>
      </td>
      <td className="min-w-0 px-3 py-3">
        <div className="truncate font-medium text-slate-800" title={targetLabel}>{targetLabel}</div>
      </td>
      <td className="min-w-0 px-3 py-3">
        <div className="truncate font-mono text-xs text-slate-500" title={audit.targetId}>{audit.targetId || "-"}</div>
      </td>
      <td className="px-3 py-3 text-slate-600">
        {t(userTargetTypeLabelKey(audit.targetType))}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-xs tabular-nums text-slate-500">
        <time dateTime={audit.timestamp}>{formattedTime}</time>
      </td>
      <td className="px-3 py-3 font-mono text-xs text-slate-500">
        <span className="block truncate" title={audit.sourceIp}>{audit.sourceIp || "-"}</span>
      </td>
      <td className="px-3 py-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
          <ResultIcon className={`h-3.5 w-3.5 shrink-0 ${audit.result === "SUCCESS" ? "text-emerald-600" : "text-rose-600"}`} aria-hidden="true" />
          {audit.result === "SUCCESS" ? t("success") : t("failed")}
        </span>
      </td>
      <td className="px-3 py-3 text-center">
        <button
          type="button"
          onClick={() => onView(audit)}
          aria-label={t("viewAria", { target: targetLabel })}
          className="inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-medium text-cyan-600 transition-colors hover:bg-cyan-50 hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
        >
          {t("view")}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </td>
    </tr>
  )
}
