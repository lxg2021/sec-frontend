import { describe, expect, it } from "vitest"

import type { ControlObjectDefinition } from "./api"
import {
  baselineRepairCommandParameters,
  isBaselineRepairCommandDefinition,
  readBaselineRepairCommandContext,
  writeBaselineRepairCommandContext,
} from "./baseline-repair-command-editor"

const OBJECT_ID = "e53deee2-f70a-f69e-7995-82b7a26ffa92"
const NEW_OBJECT_ID = "5d4066df-1143-4b27-85f2-9f4ed9190ba2"

function definition(overrides: Partial<ControlObjectDefinition> = {}): ControlObjectDefinition {
  return {
    objectId: OBJECT_ID,
    objectType: "command",
    objectTypeValue: 2,
    internalName: "baseline one-click repair",
    displayName: "baseline one-click repair",
    subType: 102,
    version: "1.0.0",
    source: "manual",
    state: "active",
    stateVersion: 1,
    capabilities: {
      profile: "command_oneshot_v1",
      contractVersion: 1,
      allowedOperations: ["execute"],
      canUpdate: false,
      deleteMode: "metadata_only",
    },
    ...overrides,
  }
}

function context(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    command: {
      head: {
        id: OBJECT_ID,
        name: "baseline one-click repair",
        category: 1,
        type: 2,
        subtype: 102,
        module: "BaselineManagement",
      },
      body: {
        baseline_info: {
          uuid: "fd149dec-1608-5acb-89ec-76a4630bac6d",
          name: "custom_list_custom_windows_any_1.0.0_machine_23a7a552486a.csv",
        },
        repair: {
          mode: "HailMary",
          source: "GPO",
          backup_before_repair: true,
          rescan_after_repair: true,
        },
        future_field: { preserved: true },
      },
    },
    contract_extension: "preserve-me",
    ...overrides,
  })
}

describe("baseline one-click repair command editor", () => {
  it("recognizes only command subtype 102", () => {
    expect(isBaselineRepairCommandDefinition(definition())).toBe(true)
    expect(isBaselineRepairCommandDefinition(definition({ objectType: "policy", objectTypeValue: 1 }))).toBe(false)
    expect(isBaselineRepairCommandDefinition(definition({ subType: 101 }))).toBe(false)
  })

  it("reads the real stored command and treats omitted flags as false", () => {
    const result = readBaselineRepairCommandContext(definition(), context())

    expect(result).toMatchObject({
      baselineUuid: "fd149dec-1608-5acb-89ec-76a4630bac6d",
      baselineName: "custom_list_custom_windows_any_1.0.0_machine_23a7a552486a.csv",
      category: 1,
      source: "GPO",
      backupBeforeRepair: true,
      rescanAfterRepair: true,
      skipRestorePoint: false,
    })
  })

  it.each([
    ["identity", definition({ objectId: "different-id" }), context()],
    ["object type", definition({ objectType: "policy", objectTypeValue: 1 }), context()],
    ["subtype", definition({ subType: 101 }), context()],
    ["internal name", definition({ internalName: "another command" }), context()],
  ])("rejects a mismatched %s", (_label, candidate, storedContext) => {
    expect(() => readBaselineRepairCommandContext(candidate, storedContext))
      .toThrow("PMC_BASELINE_REPAIR_COMMAND_CONTEXT_INVALID")
  })

  it.each([
    ["head type", { command: { head: { type: 1 } } }],
    ["repair source", { command: { body: { repair: { source: "SCCM" } } } }],
  ])("rejects an invalid %s", (_label, replacement) => {
    const original = JSON.parse(context())
    const commandReplacement = replacement.command as Record<string, unknown>
    const headReplacement = commandReplacement.head as Record<string, unknown> | undefined
    const bodyReplacement = commandReplacement.body as Record<string, unknown> | undefined
    const repairReplacement = bodyReplacement?.repair as Record<string, unknown> | undefined
    if (headReplacement) Object.assign(original.command.head, headReplacement)
    if (repairReplacement) Object.assign(original.command.body.repair, repairReplacement)

    expect(() => readBaselineRepairCommandContext(definition(), JSON.stringify(original)))
      .toThrow("PMC_BASELINE_REPAIR_COMMAND_CONTEXT_INVALID")
  })

  it("rejects a non-boolean repair flag instead of coercing it", () => {
    const original = JSON.parse(context())
    original.command.body.repair.backup_before_repair = "true"

    expect(() => readBaselineRepairCommandContext(definition(), JSON.stringify(original)))
      .toThrow("PMC_BASELINE_REPAIR_COMMAND_CONTEXT_INVALID")
  })

  it("builds a new immutable command while preserving unknown content", () => {
    const content = readBaselineRepairCommandContext(definition(), context())
    const originalSnapshot = structuredClone(content.rawContext)
    const nextContext = writeBaselineRepairCommandContext({
      content,
      newObjectId: NEW_OBJECT_ID,
      parameters: {
        ...baselineRepairCommandParameters(content),
        source: "Intune",
        backupBeforeRepair: false,
        skipRestorePoint: true,
      },
    })
    const parsed = JSON.parse(nextContext)

    expect(content.rawContext).toEqual(originalSnapshot)
    expect(parsed.command.head.id).toBe(NEW_OBJECT_ID)
    expect(parsed.command.body.repair).toEqual({
      mode: "HailMary",
      source: "Intune",
      rescan_after_repair: true,
      skip_restore_point: true,
    })
    expect(parsed.command.body.future_field).toEqual({ preserved: true })
    expect(parsed.contract_extension).toBe("preserve-me")
  })
})
