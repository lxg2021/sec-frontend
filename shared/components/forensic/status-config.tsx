import type { ForensicTaskStatus } from "@/shared/lib/forensic/types"

export const TASK_STATUS_CONFIG: Record<
  ForensicTaskStatus,
  { className: string; dot: string }
> = {
  pending: {
    className: "bg-muted text-muted-foreground ring-1 ring-border",
    dot: "bg-muted-foreground",
  },
  running: {
    className: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    dot: "bg-blue-600",
  },
  success: {
    className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    dot: "bg-emerald-600",
  },
  failed: {
    className: "bg-red-50 text-red-700 ring-1 ring-red-200",
    dot: "bg-red-600",
  },
  timeout: {
    className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    dot: "bg-amber-500",
  },
  canceled: {
    className: "bg-muted text-muted-foreground ring-1 ring-border",
    dot: "bg-muted-foreground",
  },
}
