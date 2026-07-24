import { describe, expect, it } from "vitest"

import {
  countModifiedBaselineScanPolicyFields,
  createBaselineScanPolicySignature,
  createDefaultBaselineScanPolicyForm,
  DEFAULT_BASELINE_SCAN_SCHEDULE,
  validateBaselineScanPolicyForm,
} from "./baseline-scan-policy-model"

describe("baseline scan policy model", () => {
  it("matches every packaged backend schedule default", () => {
    expect(createDefaultBaselineScanPolicyForm().scanSchedule).toEqual({
      mode: "interval",
      interval_hours: 24,
      specific_time: "01:00",
      random_delay_minutes: 60,
      retry_limit: 3,
      retry_interval_minutes: 30,
      scan_on_startup: true,
    })
    expect(DEFAULT_BASELINE_SCAN_SCHEDULE.random_delay_minutes).toBe(60)
  })

  it("accepts a complete universal scan policy", () => {
    expect(validateBaselineScanPolicyForm(createDefaultBaselineScanPolicyForm())).toBeNull()
  })

  it("rejects missing names and malformed versions", () => {
    const form = createDefaultBaselineScanPolicyForm()

    expect(validateBaselineScanPolicyForm({ ...form, name: " " })?.field).toBe("name")
    expect(validateBaselineScanPolicyForm({ ...form, version: "v1.1" })?.field).toBe(
      "version",
    )
  })

  it("enforces backend schedule bounds without rejecting the built-in 60-minute delay", () => {
    const form = createDefaultBaselineScanPolicyForm()

    expect(validateBaselineScanPolicyForm(form)).toBeNull()
    expect(
      validateBaselineScanPolicyForm({
        ...form,
        scanSchedule: { ...form.scanSchedule, random_delay_minutes: 121 },
      })?.field,
    ).toBe("random_delay_minutes")
    expect(
      validateBaselineScanPolicyForm({
        ...form,
        scanSchedule: { ...form.scanSchedule, retry_limit: 11 },
      })?.field,
    ).toBe("retry_limit")
  })

  it("builds stable signatures and counts changed fields", () => {
    const form = createDefaultBaselineScanPolicyForm()
    const signature = createBaselineScanPolicySignature(form)

    expect(createBaselineScanPolicySignature({ ...form, name: ` ${form.name} ` })).toBe(signature)
    expect(countModifiedBaselineScanPolicyFields(form)).toBe(0)
    expect(
      countModifiedBaselineScanPolicyFields({
        ...form,
        name: "自定义基线策略",
        scanSchedule: { ...form.scanSchedule, scan_on_startup: false },
      }),
    ).toBe(2)
  })
})
