import { getAttckStageDefinition } from "@/features/attack/constants/attck-stages"

export const PALETTE = [
  "#3b82f6",
  "#06b6d4",
  "#22c55e",
  "#84cc16",
  "#eab308",
  "#f59e0b",
  "#f97316",
  "#ef4444",
  "#ec4899",
  "#a855f7",
  "#6366f1",
  "#14b8a6",
  "#10b981",
  "#fb7185",
]

const assignedColors = new Map<string, string>()
const usedColors = new Set<string>()
let nextColorIndex = 0

export function getStageColor(stageSlug: string): string {
  const stage = getAttckStageDefinition(stageSlug)
  if (stage) return stage.color

  // 如果已经分配过，直接返回
  if (assignedColors.has(stageSlug)) {
    return assignedColors.get(stageSlug)!
  }

  // 从颜色池取颜色，不重复
  while (usedColors.has(PALETTE[nextColorIndex])) {
    nextColorIndex = (nextColorIndex + 1) % PALETTE.length
  }
  const color = PALETTE[nextColorIndex]
  nextColorIndex = (nextColorIndex + 1) % PALETTE.length

  assignedColors.set(stageSlug, color)
  usedColors.add(color)
  return color
}

export function slugify(text: string) {
  return String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
}
