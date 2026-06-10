import type { AttackCaseTimelineSummary } from "@/features/attack/dashboard/types"

export function getAttackCaseItemKey(item: AttackCaseTimelineSummary) {
  return item.case_id.trim().toLowerCase()
}

export function dedupeAttackCaseItems(items: AttackCaseTimelineSummary[]) {
  const seen = new Set<string>()
  const result: AttackCaseTimelineSummary[] = []

  for (const item of items) {
    const key = getAttackCaseItemKey(item)
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(item)
  }

  return result
}

export function mergeAttackCaseItems(
  current: AttackCaseTimelineSummary[],
  incoming: AttackCaseTimelineSummary[],
) {
  const merged = dedupeAttackCaseItems(current)
  const positions = new Map<string, number>()

  merged.forEach((item, index) => {
    positions.set(getAttackCaseItemKey(item), index)
  })

  for (const item of incoming) {
    const key = getAttackCaseItemKey(item)
    if (!key) continue

    const existingIndex = positions.get(key)
    if (existingIndex === undefined) {
      positions.set(key, merged.length)
      merged.push(item)
      continue
    }

    merged[existingIndex] = item
  }

  return merged
}
