import { describe, expect, it } from "vitest"

import type { ControlObjectDetail } from "./api"
import {
  canEditControlObjectDefinition,
  controlObjectUpdateInput,
  createControlObjectEditorForm,
  hasControlObjectDefinitionChanges,
  validateControlObjectEditorForm,
} from "./control-object-editor-model"

function detail(objectType: "policy" | "config" = "policy"): ControlObjectDetail {
  return {
    definition: {
      objectId: "manual-object",
      objectType,
      objectTypeValue: objectType === "policy" ? 1 : 3,
      internalName: "Manual object",
      displayName: "Manual object",
      subType: 61,
      version: "1.0.0",
      source: "manual",
      state: "active",
      stateVersion: 1,
      capabilities: {
        profile: objectType === "policy" ? "policy_managed_v1" : "config_replaceable_v1",
        contractVersion: 1,
        allowedOperations: ["apply"],
        canUpdate: true,
        deleteMode: "forbidden",
      },
    },
    rawDefinition: {},
    displayJson: "{}",
    editableContent: {
      name: "Manual object",
      subType: 60,
      version: "1.0.0",
      context: "{\"enabled\":true}",
      url: objectType === "config" ? "https://example.test/config.json" : "",
      md5: objectType === "config" ? "0123456789abcdef0123456789abcdef" : "",
    },
  }
}

describe("control object editor model", () => {
  it("enables editing for backend-editable manual Policy and Config objects only", () => {
    const policy = detail("policy").definition
    const config = detail("config").definition

    expect(canEditControlObjectDefinition(policy)).toBe(true)
    expect(canEditControlObjectDefinition(config)).toBe(true)
    expect(canEditControlObjectDefinition({
      ...policy,
      capabilities: { ...policy.capabilities, canUpdate: false },
    })).toBe(false)
    expect(canEditControlObjectDefinition({
      ...policy,
      objectType: "command",
      objectTypeValue: 2,
    })).toBe(false)
  })

  it("suggests a new version without treating the untouched form as a definition change", () => {
    const current = detail()
    const form = createControlObjectEditorForm(current)

    expect(form.version).toBe("1.1.0")
    expect(hasControlObjectDefinitionChanges(form, current)).toBe(false)
    expect(validateControlObjectEditorForm(form, current)).toMatchObject({ field: "form" })
  })

  it("accepts a changed context only with a version above the current version", () => {
    const current = detail()
    const form = { ...createControlObjectEditorForm(current), context: "{\"enabled\":false}" }

    expect(validateControlObjectEditorForm(form, current)).toBeNull()
    expect(validateControlObjectEditorForm({ ...form, version: "1.0.0" }, current))
      .toMatchObject({ field: "version" })
  })

  it("validates Config MD5 and preserves Config-only fields in the update input", () => {
    const current = detail("config")
    const form = {
      ...createControlObjectEditorForm(current),
      name: "Updated config",
      md5: "invalid",
    }

    expect(validateControlObjectEditorForm(form, current)).toMatchObject({ field: "md5" })

    const valid = { ...form, md5: "ABCDEF0123456789ABCDEF0123456789" }
    expect(controlObjectUpdateInput(valid, current.definition)).toEqual({
      name: "Updated config",
      version: "1.1.0",
      context: "{\"enabled\":true}",
      url: "https://example.test/config.json",
      md5: "abcdef0123456789abcdef0123456789",
    })
  })

  it("never sends Config download fields for a Policy update", () => {
    const current = detail("policy")
    const form = {
      ...createControlObjectEditorForm(current),
      name: "Updated policy",
      url: "https://should-not-be-sent.test",
      md5: "0123456789abcdef0123456789abcdef",
    }

    expect(controlObjectUpdateInput(form, current.definition)).toEqual({
      name: "Updated policy",
      version: "1.1.0",
      context: "{\"enabled\":true}",
    })
  })
})
