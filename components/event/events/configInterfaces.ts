"use client"

import type { EventKey } from "@/components/event/events/types"
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
    default?: string   // 可选字段，没值时用这个
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

export type EventNodeType =
  | "ProcessNode"
  | "FileNode"
  | "NetNode"
  | "DnsNode"
  | "VolumeNode"
  | "FileStreamNode"
  | "BitsJobNode"
  | "TaskNode"
  | "DllImageNode"
  | "DriverImageNode"
  | "EnDecryptNode"
  | "EventNode"
  | "FileMappingNode"
  | "MailSlotNode"
  | "MbrNode"
  | "PipeNode"
  | "PowershellNode"
  | "RegKeyNode"
  | "RegValueNode"
  | "CredentialsNode"
  | "ImpersonationTokenNode"
  | "MessageNode"
  | "UrlNode"
  | "WmiClassNode"
  | "WmiQueryNode"
  | "WmiExecuteNode"
  | "WmiConsumerNode"
  | "WmiFilterNode"
  | "AgentNode"
  | "DeviceChangeNode"
  | "ServiceNode"
  | "AccountGroupNode"
  | "AccountNode"
  | "AttackNode"