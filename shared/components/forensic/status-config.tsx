import type { ForensicAvailabilityLevel, ForensicTaskStatus } from "@/shared/lib/forensic/types"

export const AVAILABILITY_LEVEL_CONFIG: Record<
  ForensicAvailabilityLevel,
  { ring: string }
> = {
  available: {
    ring: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  },
  partial: {
    ring: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  },
  unavailable: {
    ring: "bg-red-50 text-red-700 ring-1 ring-red-200",
  },
}

export const TASK_STATUS_CONFIG: Record<
  ForensicTaskStatus,
  { label: string; className: string; dot: string }
> = {
  pending: {
    label: "等待中",
    className: "bg-muted text-muted-foreground ring-1 ring-border",
    dot: "bg-muted-foreground",
  },
  running: {
    label: "运行中",
    className: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    dot: "bg-blue-600",
  },
  success: {
    label: "成功",
    className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    dot: "bg-emerald-600",
  },
  failed: {
    label: "失败",
    className: "bg-red-50 text-red-700 ring-1 ring-red-200",
    dot: "bg-red-600",
  },
  timeout: {
    label: "超时",
    className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    dot: "bg-amber-500",
  },
  canceled: {
    label: "已取消",
    className: "bg-muted text-muted-foreground ring-1 ring-border",
    dot: "bg-muted-foreground",
  },
}
