"use client"

import type { FC } from "react"

import type { AttackWorkflowItem } from "@/features/attack/workflow/types"

interface AttackWorkflowImpactSurfaceProps {
  workflow: AttackWorkflowItem | null
  loading?: boolean
  className?: string
}

export const AttackWorkflowImpactSurface: FC<AttackWorkflowImpactSurfaceProps> =
  () => null
