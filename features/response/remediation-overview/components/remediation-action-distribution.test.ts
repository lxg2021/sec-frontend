import { describe, expect, it } from "vitest"

import { summarizeRemediationActionsByType } from "./remediation-action-distribution"

describe("remediation action distribution", () => {
  it("always returns all 13 remediation types and aggregates action variants", () => {
    const summaries = summarizeRemediationActionsByType([
      { action_code: "file.quarantine", item_count: "2" },
      { action_code: "file.restore", item_count: "1" },
      { action_code: "network.block", item_count: "4" },
    ])

    expect(summaries).toHaveLength(13)
    expect(summaries.find((item) => item.type === "file")).toEqual({
      type: "file",
      total: 3,
      details: [
        { actionCode: "file.quarantine", count: 2 },
        { actionCode: "file.restore", count: 1 },
      ],
    })
    expect(summaries.find((item) => item.type === "net-quarantine")?.total).toBe(4)
    expect(summaries.find((item) => item.type === "service")?.total).toBe(0)
  })

  it("combines duplicate normalized action codes", () => {
    const file = summarizeRemediationActionsByType([
      { action_code: " FILE.QUARANTINE ", item_count: "2" },
      { action_code: "file.quarantine", item_count: "3" },
    ]).find((item) => item.type === "file")

    expect(file?.total).toBe(5)
    expect(file?.details).toEqual([{ actionCode: "file.quarantine", count: 5 }])
  })
})
