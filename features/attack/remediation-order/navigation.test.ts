import { describe, expect, it } from "vitest"

import { buildRemediationOrchestrationHref } from "./navigation"

describe("buildRemediationOrchestrationHref", () => {
  it("hands the saved Order and graph context to orchestration", () => {
    const href = buildRemediationOrchestrationHref(
      {
        order_id: "order-1",
        tenant_id: "tenant-1",
        source: {
          source_type: 1,
          source_ref_id: "case-1",
          case_id: "case-1",
          workflow_id: "workflow-1",
        },
      },
      { queuePage: 2, snapshotId: "snapshot-1" },
    )
    const url = new URL(href, "http://localhost")

    expect(url.pathname).toBe("/frame/response/orchestration")
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      order_id: "order-1",
      case_id: "case-1",
      workflow_id: "workflow-1",
      tenant_id: "tenant-1",
      source_type: "case_graph",
      scope_type: "case",
      scope_id: "case-1",
      returnTo: "attack-drill",
      snapshotId: "snapshot-1",
      queuePage: "2",
    })
  })

  it("rejects navigation before a draft has an Order ID", () => {
    expect(() =>
      buildRemediationOrchestrationHref({
        order_id: "",
        tenant_id: "",
        source: {
          source_type: 1,
          source_ref_id: "case-1",
          case_id: "case-1",
          workflow_id: "workflow-1",
        },
      }),
    ).toThrow("Order ID")
  })
})
