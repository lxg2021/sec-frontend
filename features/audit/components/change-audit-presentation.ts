import type { ChangeAuditEvent } from "@/features/audit/types"

export type ChangeAuditActionLabelKey =
  | "created"
  | "reused"
  | "updated"
  | "deleteAccepted"
  | "deleteCompleted"
  | "deleteAborted"
  | "legacyCommand"

export type ChangeAuditOutcomeLabelKey =
  | "success"
  | "created"
  | "reused"
  | "advanced"
  | "metadataUpdated"
  | "unchanged"
  | "accepted"
  | "retryAccepted"
  | "aborted"
  | "completed"

export function changeAuditActionLabelKey(event: ChangeAuditEvent): ChangeAuditActionLabelKey {
  return event.action
}

export function changeAuditOutcomeLabelKey(event: ChangeAuditEvent): ChangeAuditOutcomeLabelKey {
  switch (event.outcome) {
    case "created": return "created"
    case "reused": return "reused"
    case "advanced": return "advanced"
    case "metadata_updated": return "metadataUpdated"
    case "unchanged": return "unchanged"
    case "accepted": return "accepted"
    case "retry_accepted": return "retryAccepted"
    case "aborted": return "aborted"
    case "completed": return "completed"
    default: return "success"
  }
}
