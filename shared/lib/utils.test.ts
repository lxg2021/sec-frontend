import { describe, expect, it } from "vitest"

import {
  createNumericRequestId,
  createRequestId,
  createUuidRequestId,
} from "./utils"

describe("createRequestId", () => {
  it("returns numeric identifiers accepted by legacy API contracts", () => {
    const values = new Set(Array.from({ length: 100 }, createRequestId))

    expect(values.size).toBe(100)
    for (const value of values) {
      expect(value).toMatch(/^\d+$/)
      expect(Number(value)).toBeGreaterThan(0)
    }
  })

  it("keeps the explicit numeric request ID helper equivalent", () => {
    expect(createNumericRequestId()).toMatch(/^\d+$/)
  })

  it("returns UUID v4 identifiers for remediation requests", () => {
    const values = new Set(Array.from({ length: 100 }, createUuidRequestId))
    const uuidV4 =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    expect(values.size).toBe(100)
    for (const value of values) {
      expect(value).toMatch(uuidV4)
      expect(value.length).toBeLessThanOrEqual(64)
    }
  })
})
