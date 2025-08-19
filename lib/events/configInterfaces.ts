"use client"

import type { EventKey } from "@/lib/events/types"
import type React from "react"

export interface HeaderFieldConfig {
  key: EventKey
  label: string
  icon?: string
  color?: string
}

export interface HeaderBadgeConfig {
  key: EventKey
  label?: string
  variant?: "default" | "destructive" | "secondary"
  customRender?: (value: any) => React.ReactNode
}

export interface HeaderConfig {
  title: {
    key: EventKey
  }
  badges: HeaderBadgeConfig[]
  fields: HeaderFieldConfig[]
}

export interface FieldConfig {
  key: EventKey
  label: string
  icon?: string
  color?: string
  bold?: boolean
  highlight?: boolean
  monospace?: boolean
  truncate?: boolean
  maxLength?: number
  expandable?: boolean
  copyable?: boolean
  showInPopover?: boolean
  customRender?: (value: any) => React.ReactNode
}

export interface SectionConfig {
  title: string
  icon: string
  color: string
  fields: FieldConfig[]
}

export type EventType =
  | "processCreate"
  | "processExit"
  | "processAccess"
  | "remoteThread"
  | "crossMemoryExecute"
  | "dns"
  | "netCommunicate"
  | "serviceCreate"
  | "serviceDelete"
  | "serviceStart"
  | "serviceStop"
  | "serviceConfig"
  | "servicePause"
  | "deviceChange"
  | "driverImageLoad"
  | "dllImageLoad"
  | "taskCreate"
  | "taskImageLoad"
  | "taskTrigger"
  | "taskDelete"
  | "wmiQuery"
