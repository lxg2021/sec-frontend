'use client'

import React from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/popover'
import { RuleInfoCard } from './rule-info-card'

interface RuleInfoPopoverProps {
  id: string
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
}

export function RuleInfoPopover({ id, children, side = 'left' }: RuleInfoPopoverProps) {
  if (!id) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side={side}  // 使用传入的 side，默认左侧
        className="p-0 w-auto max-w-[400px] shadow-xl border-none"
      >
        <RuleInfoCard id={id} />
      </PopoverContent>
    </Popover>
  )
}
