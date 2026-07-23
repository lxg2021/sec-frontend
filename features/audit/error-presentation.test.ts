import { describe, expect, it } from "vitest"

import { dispatchExecutionErrorPresentation } from "./error-presentation"

describe("dispatchExecutionErrorPresentation", () => {
  it("maps report deadline expiry to the remediation report-timeout meaning in Chinese", () => {
    expect(dispatchExecutionErrorPresentation(
      "REPORT_DEADLINE_EXPIRED_AFTER_ACCEPTANCE",
      "REPORT_DEADLINE_EXPIRED_AFTER_ACCEPTANCE",
      "zh-CN",
    )).toMatchObject({
      code: "回报超时",
      description: "下发请求已被接收，但在回报截止时间前未收到 Agent 的最终执行结果。",
    })
  })

  it("maps report timeout to the remediation report-timeout meaning in English", () => {
    expect(dispatchExecutionErrorPresentation("REPORT_TIMEOUT", "", "en")).toMatchObject({
      code: "Report Timed Out",
      description: "The dispatch request was accepted, but no final Agent result was received before the reporting deadline.",
    })
  })

  it("preserves unknown backend errors", () => {
    expect(dispatchExecutionErrorPresentation("AGENT_CUSTOM_ERROR", "custom failure", "zh-CN")).toMatchObject({
      code: "AGENT_CUSTOM_ERROR",
      description: "custom failure",
    })
  })
})
