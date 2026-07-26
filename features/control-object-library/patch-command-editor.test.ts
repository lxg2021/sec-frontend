import { describe, expect, it } from "vitest"

import type { ControlObjectDefinition } from "./api"
import {
  isPatchCommandDefinition,
  patchCommandKind,
  patchCommandParameterSignature,
  patchCommandParameters,
  patchScheduledTimeFromInputValue,
  patchScheduledTimeToInputValue,
  readPatchCommandContext,
  validatePatchCommandParameters,
  writePatchCommandContext,
} from "./patch-command-editor"

const INSTALL_ID = "f2f3477d-f891-a43d-ba51-8abd035a635b"
const REPAIR_ID = "de35a0c1-50a2-4463-cdc6-84c29c50a35b"
const NEW_ID = "97ff93ef-c027-45e9-a8ac-edfd50354641"

function definition(
  kind: "install_task" | "one_click_repair" = "install_task",
  overrides: Partial<ControlObjectDefinition> = {},
): ControlObjectDefinition {
  const install = kind === "install_task"
  const name = install ? "patch install task" : "patch one-click repair"
  return {
    objectId: install ? INSTALL_ID : REPAIR_ID,
    objectType: "command",
    objectTypeValue: 2,
    internalName: name,
    displayName: name,
    subType: 103,
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

function installContext() {
  return JSON.stringify({
    command: {
      head: {
        id: INSTALL_ID,
        name: "patch install task",
        category: 3,
        type: 2,
        subtype: 103,
        module: "PatchManagement",
      },
      body: {
        task_name: "Windows 安装任务 20260716-1441",
        repair_scope: {
          mode: "selected_patches_by_agent",
          os_platform: "windows",
          targets: [
            {
              agent_id: "550e8400-e29b-41d4-a716-446655440012",
              patch_guids: [
                "d3333333-3333-4333-8333-333333333333",
                "e4444444-4444-4444-8444-444444444444",
              ],
            },
            {
              agent_id: "550e8400-e29b-41d4-a716-446655440013",
              patch_guids: ["d3333333-3333-4333-8333-333333333333"],
            },
          ],
        },
        execution: {
          mode: "immediate",
          random_delay_minutes: 10,
        },
        install: {
          reboot_after_install: true,
          backup_before_repair: true,
          rescan_after_repair: true,
        },
        future_field: { preserved: true },
      },
    },
    contract_extension: "preserve-me",
  })
}

function repairContext() {
  return JSON.stringify({
    command: {
      head: {
        id: REPAIR_ID,
        name: "patch one-click repair",
        category: 3,
        type: 2,
        subtype: 103,
        module: "PatchManagement",
      },
      body: {
        repair_scope: {
          mode: "all_required_patches",
          os_platform: "windows",
        },
        execution: {
          mode: "scheduled",
          scheduled_time: "2026-08-01 02:30:00",
          random_delay_minutes: 20,
        },
        install: {
          reboot_after_install: false,
          backup_before_repair: true,
          rescan_after_repair: true,
        },
      },
    },
  })
}

describe("patch command editor", () => {
  it("distinguishes both subtype 103 commands by their exact name", () => {
    expect(patchCommandKind(definition("install_task"))).toBe("install_task")
    expect(patchCommandKind(definition("one_click_repair"))).toBe("one_click_repair")
    expect(isPatchCommandDefinition(definition("install_task"))).toBe(true)
    expect(patchCommandKind(definition("install_task", { internalName: "other command" }))).toBeNull()
    expect(patchCommandKind(definition("install_task", { subType: 102 }))).toBeNull()
  })

  it("reads the real patch install task structure and summarizes targets", () => {
    const result = readPatchCommandContext(definition("install_task"), installContext())

    expect(result).toMatchObject({
      kind: "install_task",
      category: 3,
      taskName: "Windows 安装任务 20260716-1441",
      osPlatform: "windows",
      executionMode: "immediate",
      scheduledTime: "",
      randomDelayMinutes: 10,
      rebootAfterInstall: true,
      backupBeforeRepair: true,
      rescanAfterRepair: true,
      uniquePatchCount: 2,
    })
    expect(result.targets).toHaveLength(2)
  })

  it("reads the real patch one-click repair structure", () => {
    const result = readPatchCommandContext(definition("one_click_repair"), repairContext())

    expect(result).toMatchObject({
      kind: "one_click_repair",
      osPlatform: "windows",
      executionMode: "scheduled",
      scheduledTime: "2026-08-01 02:30:00",
      randomDelayMinutes: 20,
      rebootAfterInstall: false,
      backupBeforeRepair: true,
      rescanAfterRepair: true,
      targets: [],
    })
  })

  it.each([
    ["object identity", definition("install_task", { objectId: "different-id" }), installContext()],
    ["definition name", definition("install_task", { internalName: "patch one-click repair" }), installContext()],
    ["body kind", definition("one_click_repair"), installContext()],
  ])("fails closed for a mismatched %s", (_label, candidate, context) => {
    expect(() => readPatchCommandContext(candidate, context))
      .toThrow("PMC_PATCH_COMMAND_CONTEXT_INVALID")
  })

  it.each([
    ["module", ["command", "head", "module"], "OtherModule"],
    ["type", ["command", "head", "type"], 1],
    ["category", ["command", "head", "category"], 1],
    ["scope", ["command", "body", "repair_scope", "mode"], "all_required_patches"],
    ["boolean", ["command", "body", "install", "backup_before_repair"], "true"],
    ["delay", ["command", "body", "execution", "random_delay_minutes"], 121],
    ["scheduled time type", ["command", "body", "execution", "scheduled_time"], 123],
  ])("rejects an invalid %s", (_label, path, value) => {
    const candidate = JSON.parse(installContext()) as Record<string, unknown>
    let target = candidate
    for (const key of path.slice(0, -1)) target = target[key] as Record<string, unknown>
    target[path.at(-1)!] = value

    expect(() => readPatchCommandContext(definition("install_task"), JSON.stringify(candidate)))
      .toThrow("PMC_PATCH_COMMAND_CONTEXT_INVALID")
  })

  it("writes a new install command without changing its targets or original context", () => {
    const content = readPatchCommandContext(definition("install_task"), installContext())
    const originalSnapshot = structuredClone(content.rawContext)
    const nextContext = writePatchCommandContext({
      content,
      newObjectId: NEW_ID,
      parameters: {
        ...patchCommandParameters(content),
        taskName: "Windows 分批安装任务",
        executionMode: "scheduled",
        scheduledTime: "2026-08-02 03:45:00",
        randomDelayMinutes: 30,
        rebootAfterInstall: false,
      },
    })
    const parsed = JSON.parse(nextContext)
    const original = JSON.parse(installContext())

    expect(content.rawContext).toEqual(originalSnapshot)
    expect(parsed.command.head.id).toBe(NEW_ID)
    expect(parsed.command.body.task_name).toBe("Windows 分批安装任务")
    expect(parsed.command.body.repair_scope.targets)
      .toEqual(original.command.body.repair_scope.targets)
    expect(parsed.command.body.execution).toEqual({
      mode: "scheduled",
      scheduled_time: "2026-08-02 03:45:00",
      random_delay_minutes: 30,
    })
    expect(parsed.command.body.install.reboot_after_install).toBe(false)
    expect(parsed.command.body.future_field).toEqual({ preserved: true })
    expect(parsed.contract_extension).toBe("preserve-me")
  })

  it("writes a one-click repair command and removes scheduled time for immediate execution", () => {
    const content = readPatchCommandContext(definition("one_click_repair"), repairContext())
    const nextContext = writePatchCommandContext({
      content,
      newObjectId: NEW_ID,
      parameters: {
        ...patchCommandParameters(content),
        osPlatform: "linux",
        executionMode: "immediate",
        scheduledTime: "",
        backupBeforeRepair: false,
      },
    })
    const parsed = JSON.parse(nextContext)

    expect(parsed.command.head.id).toBe(NEW_ID)
    expect(parsed.command.body.repair_scope).toEqual({
      mode: "all_required_patches",
      os_platform: "linux",
    })
    expect(parsed.command.body.execution.scheduled_time).toBeUndefined()
    expect(parsed.command.body.install.backup_before_repair).toBe(false)
  })

  it("uses the backend scheduled-time contract and validates all editable fields", () => {
    expect(patchScheduledTimeToInputValue("2026-08-01 02:30:00"))
      .toBe("2026-08-01T02:30:00")
    expect(patchScheduledTimeFromInputValue("2026-08-01T02:30"))
      .toBe("2026-08-01 02:30:00")
    expect(patchScheduledTimeToInputValue("2026-02-30 02:30:00")).toBe("")

    const content = readPatchCommandContext(definition("install_task"), installContext())
    expect(validatePatchCommandParameters("install_task", {
      ...patchCommandParameters(content),
      randomDelayMinutes: 121,
    })).toBe("randomDelayInvalid")
    expect(validatePatchCommandParameters("install_task", {
      ...patchCommandParameters(content),
      executionMode: "scheduled",
      scheduledTime: "",
    })).toBe("scheduledTimeInvalid")

    const immediate = patchCommandParameters(content)
    expect(patchCommandParameterSignature({
      ...immediate,
      scheduledTime: "2026-08-01 02:30:00",
    })).toBe(patchCommandParameterSignature(immediate))
    expect(validatePatchCommandParameters("install_task", {
      ...immediate,
      backupBeforeRepair: "true" as unknown as boolean,
    })).toBe("installOptionsInvalid")
  })
})
