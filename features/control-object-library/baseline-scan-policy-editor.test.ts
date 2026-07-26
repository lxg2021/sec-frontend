import { describe, expect, it } from "vitest"

import type { ControlObjectDetail } from "./api"
import {
  readBaselineScanPolicySchedule,
  writeBaselineScanPolicyContext,
} from "./baseline-scan-policy-editor"
import {
  controlObjectUpdateInput,
  createControlObjectEditorForm,
  validateControlObjectEditorForm,
} from "./control-object-editor-model"

const LEGACY_BASELINE_CONTEXT = JSON.stringify({
  policy: {
    head: {
      id: "baseline-policy-1",
      type: 1,
      subtype: 60,
      module: "BaselineManagement",
      name: "Standard Windows scan",
      version: "1.0.0",
    },
    body: {
      baseline_info: {
        uuid: "baseline-template-1",
        name: "standard-windows.csv",
        download_url: "http://127.0.0.1:8082/standard-windows.csv",
        md5: "0123456789abcdef0123456789abcdef",
      },
      schedule: {
        mode: "interval",
        interval_hours: 24,
        specific_time: "12:00",
        random_delay_minutes: 5,
        retry_limit: 3,
        retry_interval_minutes: 5,
        scan_on_startup: false,
      },
      future_field: { preserved: true },
    },
  },
  contract_extension: "preserve-me",
})

function baselineDetail(context = LEGACY_BASELINE_CONTEXT): ControlObjectDetail {
  return {
    definition: {
      objectId: "baseline-policy-1",
      objectType: "policy",
      objectTypeValue: 1,
      internalName: "Standard Windows scan",
      displayName: "Standard Windows scan",
      subType: 60,
      version: "1.0.0",
      source: "manual",
      state: "active",
      stateVersion: 1,
      capabilities: {
        profile: "policy_managed_v1",
        contractVersion: 1,
        allowedOperations: ["apply", "stop", "remove"],
        canUpdate: true,
        deleteMode: "remove_effects",
      },
    },
    rawDefinition: {},
    displayJson: "{}",
    editableContent: {
      name: "Standard Windows scan",
      subType: 60,
      version: "1.0.0",
      context,
      url: "",
      md5: "",
    },
  }
}

describe("baseline scan policy editor", () => {
  it("reads every schedule field from the stored PMC policy context", () => {
    expect(readBaselineScanPolicySchedule(LEGACY_BASELINE_CONTEXT)).toEqual({
      mode: "interval",
      interval_hours: 24,
      specific_time: "12:00",
      random_delay_minutes: 5,
      retry_limit: 3,
      retry_interval_minutes: 5,
      scan_on_startup: false,
    })
  })

  it("updates the schedule and header while preserving legacy and unknown fields", () => {
    const current = baselineDetail()
    const form = createControlObjectEditorForm(current)
    const schedule = readBaselineScanPolicySchedule(form.context)
    const context = writeBaselineScanPolicyContext({
      context: form.context,
      definition: current.definition,
      name: "Updated baseline schedule",
      version: "1.1.0",
      schedule: {
        ...schedule,
        interval_hours: 12,
        random_delay_minutes: 30,
        retry_limit: 10,
        scan_on_startup: true,
      },
    })

    const nextForm = {
      ...form,
      name: "Updated baseline schedule",
      version: "1.1.0",
      context,
    }
    expect(validateControlObjectEditorForm(nextForm, current)).toBeNull()

    const input = controlObjectUpdateInput(nextForm, current.definition)
    const parsed = JSON.parse(input.context)
    expect(parsed.policy.head).toMatchObject({
      id: "baseline-policy-1",
      type: 1,
      subtype: 60,
      module: "BaselineManagement",
      name: "Updated baseline schedule",
      version: "1.1.0",
    })
    expect(parsed.policy.body.schedule).toEqual({
      mode: "interval",
      interval_hours: 12,
      specific_time: "12:00",
      random_delay_minutes: 30,
      retry_limit: 10,
      retry_interval_minutes: 5,
      scan_on_startup: true,
    })
    expect(parsed.policy.body.baseline_info).toEqual({
      uuid: "baseline-template-1",
      name: "standard-windows.csv",
      download_url: "http://127.0.0.1:8082/standard-windows.csv",
      md5: "0123456789abcdef0123456789abcdef",
    })
    expect(parsed.policy.body.future_field).toEqual({ preserved: true })
    expect(parsed.contract_extension).toBe("preserve-me")
  })

  it("rejects malformed or incomplete schedule content instead of inventing defaults", () => {
    const incomplete = baselineDetail(JSON.stringify({
      policy: {
        head: { name: "Broken" },
        body: { schedule: { mode: "interval", interval_hours: 24 } },
      },
    }))

    expect(() => createControlObjectEditorForm(incomplete))
      .toThrow("PMC_BASELINE_SCAN_POLICY_CONTEXT_INVALID")
  })
})
