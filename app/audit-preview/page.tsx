"use client"

import { useState } from "react"
import { UserActivityAudit } from "@/features/audit/components/user-activity-audit"
import type { UserActionType, UserActivityAudit as UserActivityAuditData, UserAuditDateRange } from "@/features/audit/types"

const actions: UserActionType[] = ["ADD_USER", "UPDATE_USER", "PASSWORD_CHANGE", "STATUS_CHANGE", "ROLE_CHANGE", "DELETE_USER"]
const previewEvents: UserActivityAuditData[] = Array.from({ length: 18 }, (_, index) => ({
  eventId: `preview-event-${index + 1}`,
  userId: index % 3 === 0 ? "admin-001" : `auditor-${(index % 4) + 1}`,
  username: index % 3 === 0 ? "admin" : `auditor_${(index % 4) + 1}`,
  timestamp: new Date(Date.UTC(2026, 6, 23, 10 - Math.floor(index / 3), 45 - index, 12)).toISOString(),
  actionType: actions[index % actions.length],
  result: index === 11 ? "FAILED" : "SUCCESS",
  targetId: `user-${String(index + 21).padStart(3, "0")}`,
  targetName: ["security_operator", "ops_manager", "audit_viewer", "endpoint_admin"][index % 4],
  targetType: "USER",
  details: {
    eventType: `user.${actions[index % actions.length].toLowerCase()}`,
    requestId: `request-${20260723001 + index}`,
    actorType: "user",
    oldRole: index % 2 === 0 ? "operator" : "auditor",
    newRole: index % 2 === 0 ? "auditor" : "operator",
    changed_fields: ["role", "status"],
  },
}))

export default function AuditPreviewPage() {
  const [dateRange, setDateRange] = useState<UserAuditDateRange>("7d")
  const [customDateFrom, setCustomDateFrom] = useState<Date>()
  const [customDateTo, setCustomDateTo] = useState<Date>()

  return (
    <main className="flex h-dvh min-h-0 flex-col bg-slate-100 p-4">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <UserActivityAudit
          data={previewEvents}
          dateRange={dateRange}
          setDateRange={setDateRange}
          customDateFrom={customDateFrom}
          setCustomDateFrom={setCustomDateFrom}
          customDateTo={customDateTo}
          setCustomDateTo={setCustomDateTo}
          onRetry={() => undefined}
        />
      </div>
    </main>
  )
}
