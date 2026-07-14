import { describe, expect, it } from "vitest"

import { buildRemediationOrchestrationHref } from "./navigation"

describe("buildRemediationOrchestrationHref", () => {
  it("hands only the saved Order ID to orchestration", () => {
    const href = buildRemediationOrchestrationHref({ order_id: "order-1" })
    const url = new URL(href, "http://localhost")

    expect(url.pathname).toBe("/frame/response/orchestration")
    expect(Object.fromEntries(url.searchParams)).toEqual({ order_id: "order-1" })
  })

  it("rejects navigation before a draft has an Order ID", () => {
    expect(() =>
      buildRemediationOrchestrationHref({
        order_id: "",
      }),
    ).toThrow("Order ID")
  })
})
