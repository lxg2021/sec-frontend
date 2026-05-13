import type { ReactNode } from "react"

export interface BaselineSelectorItem {
  id: string
  title: string
  standardKey?: string
  standardLabel: string
  productLabel: string
  profileLabel: string
  osVersionLabel?: string
  lastCheckTime?: string
  hostCount?: number
  itemCount?: number
  highCount?: number
  mediumCount?: number
  lowCount?: number
}

export interface BaselineSelectorText {
  current: string
  emptyPlaceholder: string
  hosts: (count: number) => string
  checks: (count: number) => string
  lastChecked: string
  noCheck: string
  noMatches: string
  refresh: string
  searchPlaceholder: string
  selectPlaceholder: string
  unknown: string
}

export interface BaselineSelectorProps {
  actions?: ReactNode
  className?: string
  icon?: ReactNode
  isRefreshing?: boolean
  items: BaselineSelectorItem[]
  onRefresh?: () => void
  onValueChange?: (value: string) => void
  text: BaselineSelectorText
  value?: string
}
