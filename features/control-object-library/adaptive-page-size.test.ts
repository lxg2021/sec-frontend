import { describe, expect, it } from "vitest"

import {
  calculateAdaptivePageSize,
  pageForPreservedOffset,
} from "./adaptive-page-size"

describe("adaptive control-object pagination", () => {
  it("fits fifteen desktop rows when the component has enough height", () => {
    expect(calculateAdaptivePageSize({
      viewportHeight: 900,
      headerHeight: 40,
      measuredItemHeights: [56, 56, 56],
      fallbackItemHeight: 56,
    })).toBe(15)
  })

  it("automatically reduces the row count for a shorter component", () => {
    expect(calculateAdaptivePageSize({
      viewportHeight: 650,
      headerHeight: 40,
      measuredItemHeights: [56, 56],
      fallbackItemHeight: 56,
    })).toBe(10)
  })

  it("uses the tallest rendered item so the last row cannot create vertical overflow", () => {
    expect(calculateAdaptivePageSize({
      viewportHeight: 620,
      headerHeight: 40,
      measuredItemHeights: [52, 58, 54],
      fallbackItemHeight: 52,
    })).toBe(10)
  })

  it("accounts for mobile padding and card gaps", () => {
    expect(calculateAdaptivePageSize({
      viewportHeight: 650,
      verticalPadding: 24,
      gap: 12,
      measuredItemHeights: [260],
      fallbackItemHeight: 260,
    })).toBe(2)
  })

  it("preserves the first visible object when the component capacity changes", () => {
    expect(pageForPreservedOffset(3, 10, 15)).toBe(2)
    expect(pageForPreservedOffset(2, 15, 8)).toBe(2)
  })
})
