import type { ControlObjectDefinition } from "./api"

export const BASELINE_ONE_CLICK_REPAIR_SUBTYPE = 102
export const BASELINE_ONE_CLICK_REPAIR_NAME = "baseline one-click repair"
export const BASELINE_ONE_CLICK_REPAIR_MODULE = "BaselineManagement"
export const BASELINE_ONE_CLICK_REPAIR_MODE = "HailMary"
export const BASELINE_ONE_CLICK_REPAIR_CATEGORY = 1

export type BaselineRepairSource = "GPO" | "Intune"

export interface BaselineRepairCommandContent {
  baselineUuid: string
  baselineName: string
  category: number
  source: BaselineRepairSource
  backupBeforeRepair: boolean
  rescanAfterRepair: boolean
  skipRestorePoint: boolean
  rawContext: Record<string, unknown>
}

export interface BaselineRepairCommandParameters {
  source: BaselineRepairSource
  backupBeforeRepair: boolean
  rescanAfterRepair: boolean
  skipRestorePoint: boolean
}

function recordValue(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function requiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function requiredNumber(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) ? value : null
}

function optionalBoolean(record: Record<string, unknown>, key: string) {
  const value = record[key]
  if (value === undefined) return false
  if (typeof value !== "boolean") throw new Error("PMC_BASELINE_REPAIR_COMMAND_CONTEXT_INVALID")
  return value
}

function setOptionalBoolean(
  record: Record<string, unknown>,
  key: string,
  value: boolean,
) {
  if (value) {
    record[key] = true
  } else {
    delete record[key]
  }
}

function invalidContext(): never {
  throw new Error("PMC_BASELINE_REPAIR_COMMAND_CONTEXT_INVALID")
}

export function isBaselineRepairCommandDefinition(definition: ControlObjectDefinition) {
  return definition.objectType === "command"
    && definition.objectTypeValue === 2
    && definition.subType === BASELINE_ONE_CLICK_REPAIR_SUBTYPE
}

export function readBaselineRepairCommandContext(
  definition: ControlObjectDefinition,
  context: string,
): BaselineRepairCommandContent {
  if (!isBaselineRepairCommandDefinition(definition)) invalidContext()

  let rawContext: unknown
  try {
    rawContext = JSON.parse(context) as unknown
  } catch {
    invalidContext()
  }

  const root = recordValue(rawContext)
  const command = recordValue(root?.command)
  const head = recordValue(command?.head)
  const body = recordValue(command?.body)
  const baselineInfo = recordValue(body?.baseline_info)
  const repair = recordValue(body?.repair)
  if (!root || !command || !head || !body || !baselineInfo || !repair) invalidContext()

  const id = requiredString(head.id)
  const name = requiredString(head.name)
  const moduleName = requiredString(head.module)
  const type = requiredNumber(head.type)
  const subtype = requiredNumber(head.subtype)
  const category = requiredNumber(head.category)
  const baselineUuid = requiredString(baselineInfo.uuid)
  const baselineName = requiredString(baselineInfo.name)
  const mode = requiredString(repair.mode)
  const source = requiredString(repair.source)

  if (
    !id
    || id.toLowerCase() !== definition.objectId.toLowerCase()
    || name !== BASELINE_ONE_CLICK_REPAIR_NAME
    || definition.internalName !== BASELINE_ONE_CLICK_REPAIR_NAME
    || moduleName !== BASELINE_ONE_CLICK_REPAIR_MODULE
    || type !== 2
    || subtype !== BASELINE_ONE_CLICK_REPAIR_SUBTYPE
    || category !== BASELINE_ONE_CLICK_REPAIR_CATEGORY
    || !baselineUuid
    || !baselineName
    || mode !== BASELINE_ONE_CLICK_REPAIR_MODE
    || (source !== "GPO" && source !== "Intune")
  ) {
    invalidContext()
  }

  return {
    baselineUuid,
    baselineName,
    category,
    source,
    backupBeforeRepair: optionalBoolean(repair, "backup_before_repair"),
    rescanAfterRepair: optionalBoolean(repair, "rescan_after_repair"),
    skipRestorePoint: optionalBoolean(repair, "skip_restore_point"),
    rawContext: root,
  }
}

export function baselineRepairCommandParameters(
  content: BaselineRepairCommandContent,
): BaselineRepairCommandParameters {
  return {
    source: content.source,
    backupBeforeRepair: content.backupBeforeRepair,
    rescanAfterRepair: content.rescanAfterRepair,
    skipRestorePoint: content.skipRestorePoint,
  }
}

export function baselineRepairCommandParameterSignature(
  parameters: BaselineRepairCommandParameters,
) {
  return JSON.stringify(parameters)
}

export function writeBaselineRepairCommandContext({
  content,
  newObjectId,
  parameters,
}: {
  content: BaselineRepairCommandContent
  newObjectId: string
  parameters: BaselineRepairCommandParameters
}) {
  const normalizedObjectId = newObjectId.trim()
  if (!normalizedObjectId || normalizedObjectId.length > 64) {
    throw new Error("PMC_CREATE_OBJECT_ID_INVALID")
  }
  if (parameters.source !== "GPO" && parameters.source !== "Intune") invalidContext()

  const root = structuredClone(content.rawContext)
  const command = recordValue(root.command)
  const head = recordValue(command?.head)
  const body = recordValue(command?.body)
  const repair = recordValue(body?.repair)
  if (!command || !head || !body || !repair) invalidContext()

  head.id = normalizedObjectId
  repair.source = parameters.source
  setOptionalBoolean(repair, "backup_before_repair", parameters.backupBeforeRepair)
  setOptionalBoolean(repair, "rescan_after_repair", parameters.rescanAfterRepair)
  setOptionalBoolean(repair, "skip_restore_point", parameters.skipRestorePoint)

  return JSON.stringify(root)
}
