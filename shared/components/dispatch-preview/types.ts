"use client"

import type { ReactNode } from "react"

export interface DispatchHost {
  agentId: string
  hostname: string
  ip?: string
  status?: string
  valid?: boolean
  invalidReason?: string
}

export interface DispatchGroup {
  id: string
  name: string
  hostCount: number
  hosts?: DispatchHost[]
}

export interface DispatchObject {
  type: string
  name: string
  description?: string
  id?: string
  version?: string
  sourceType?: string
  mode?: string
}

export interface DispatchTarget {
  selectionMode: "group" | "host" | "mixed" | "all"
  groupCount: number
  hostCount: number
  deduplicatedHostCount: number
  ungroupedHostCount?: number
  offlineHostCount?: number
  invalidHostCount?: number
  boundHostCount?: number
  groups?: DispatchGroup[]
}

export interface DispatchSchedule {
  mode: "immediate" | "scheduled"
  summary: string
  executeAt?: string
  timezone?: string
  cronText?: string
}

export interface DispatchValidation {
  level: "error" | "warning" | "info"
  code: string
  message: string
  suggestion?: string
}

export interface DispatchPermissions {
  canSubmit: boolean
  reason?: string
}

export interface DispatchPreviewData {
  object: DispatchObject
  target: DispatchTarget
  schedule?: DispatchSchedule
  validations?: DispatchValidation[]
  permissions?: DispatchPermissions
}

export type DispatchPreviewStatus =
  | "loading"
  | "ready"
  | "empty"
  | "partial"
  | "error"
  | "submitting"

export interface DispatchPreviewProps {
  open: boolean
  title?: string
  subtitle?: string
  data?: DispatchPreviewData
  submitting?: boolean
  loading?: boolean
  error?: string
  onClose: () => void
  onBack?: () => void
  onConfirm: () => void
  confirmText?: string
  readonly?: boolean
  showPermissionInfo?: boolean
  renderExtraSection?: () => ReactNode
  dangerConfirmRequired?: boolean
}
