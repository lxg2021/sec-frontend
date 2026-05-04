'use client'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/popover'
import { HostInfoCard } from './host-info-card'
import React from 'react'

export function HostInfoPopover({
  node,
  children,
}: {
  node: any
  children: React.ReactNode
}) {
  if (!node || node.type !== 'host') return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        {/* 由调用者传入按钮，例如图标按钮 */}
        {children}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="top"
        className="p-0 w-auto max-w-[600px] shadow-xl border-none"
      >
        <HostInfoCard node={node} />
      </PopoverContent>
    </Popover>
  )
}
