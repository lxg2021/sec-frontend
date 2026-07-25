export interface AdaptivePageSizeInput {
  viewportHeight: number
  headerHeight?: number
  verticalPadding?: number
  gap?: number
  measuredItemHeights: number[]
  fallbackItemHeight: number
  min?: number
  max?: number
}

function finiteNonNegative(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0
}

export function calculateAdaptivePageSize({
  viewportHeight,
  headerHeight = 0,
  verticalPadding = 0,
  gap = 0,
  measuredItemHeights,
  fallbackItemHeight,
  min = 1,
  max = 50,
}: AdaptivePageSizeInput) {
  const minimum = Math.max(1, Math.floor(min))
  const maximum = Math.max(minimum, Math.floor(max))
  const normalizedGap = finiteNonNegative(gap)
  const itemHeight = Math.max(
    finiteNonNegative(fallbackItemHeight),
    ...measuredItemHeights.map(finiteNonNegative),
  )
  if (itemHeight <= 0) return minimum

  const availableHeight = finiteNonNegative(viewportHeight)
    - finiteNonNegative(headerHeight)
    - finiteNonNegative(verticalPadding)
  if (availableHeight <= 0) return minimum

  const capacity = Math.floor((availableHeight + normalizedGap) / (itemHeight + normalizedGap))
  return Math.min(maximum, Math.max(minimum, capacity))
}

export function pageForPreservedOffset(
  page: number,
  previousPageSize: number,
  nextPageSize: number,
) {
  const normalizedPage = Math.max(1, Math.floor(page))
  const previousSize = Math.max(1, Math.floor(previousPageSize))
  const nextSize = Math.max(1, Math.floor(nextPageSize))
  const firstVisibleIndex = (normalizedPage - 1) * previousSize
  return Math.floor(firstVisibleIndex / nextSize) + 1
}
