import type { ControlObjectDefinition } from "./api"

export const PATCH_COMMAND_SUBTYPE = 103
export const PATCH_COMMAND_CATEGORY = 3
export const PATCH_COMMAND_MODULE = "PatchManagement"
export const PATCH_INSTALL_TASK_NAME = "patch install task"
export const PATCH_ONE_CLICK_REPAIR_NAME = "patch one-click repair"

export type PatchCommandKind = "install_task" | "one_click_repair"
export type PatchExecutionMode = "immediate" | "scheduled"
export type PatchOperatingSystem = "" | "windows" | "linux" | "macOs"

export interface PatchInstallTaskTarget {
  agentId: string
  patchGuids: string[]
}

export interface PatchCommandParameters {
  taskName: string
  osPlatform: PatchOperatingSystem
  executionMode: PatchExecutionMode
  scheduledTime: string
  randomDelayMinutes: number
  rebootAfterInstall: boolean
  backupBeforeRepair: boolean
  rescanAfterRepair: boolean
}

export interface PatchCommandContent extends PatchCommandParameters {
  kind: PatchCommandKind
  category: number
  targets: PatchInstallTaskTarget[]
  uniquePatchCount: number
  rawContext: Record<string, unknown>
}

const PATCH_COMMAND_CONTEXT_INVALID = "PMC_PATCH_COMMAND_CONTEXT_INVALID"
const SCHEDULED_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/

function invalidContext(): never {
  throw new Error(PATCH_COMMAND_CONTEXT_INVALID)
}

function recordValue(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function requiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function requiredInteger(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) ? value : null
}

function requiredBoolean(record: Record<string, unknown>, key: string) {
  const value = record[key]
  if (typeof value !== "boolean") invalidContext()
  return value
}

function optionalString(record: Record<string, unknown>, key: string) {
  const value = record[key]
  if (value === undefined) return ""
  if (typeof value !== "string") invalidContext()
  return value.trim()
}

function operatingSystem(value: unknown): PatchOperatingSystem {
  if (value === undefined || value === "") return ""
  if (value === "windows" || value === "linux" || value === "macOs") return value
  invalidContext()
}

export function isValidPatchScheduledTime(value: string) {
  const match = SCHEDULED_TIME_PATTERN.exec(value)
  if (!match) return false

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] = match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const hour = Number(hourText)
  const minute = Number(minuteText)
  const second = Number(secondText)
  if (year < 1 || month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) {
    return false
  }

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return day >= 1 && day <= daysInMonth
}

export function patchScheduledTimeToInputValue(value: string) {
  return isValidPatchScheduledTime(value) ? value.replace(" ", "T") : ""
}

export function patchScheduledTimeFromInputValue(value: string) {
  const normalized = value.trim()
  if (!normalized) return ""
  const withSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)
    ? `${normalized}:00`
    : normalized
  return withSeconds.replace("T", " ")
}

export function patchCommandKind(
  definition: ControlObjectDefinition,
): PatchCommandKind | null {
  if (
    definition.objectType !== "command"
    || definition.objectTypeValue !== 2
    || definition.subType !== PATCH_COMMAND_SUBTYPE
  ) {
    return null
  }

  if (definition.internalName === PATCH_INSTALL_TASK_NAME) return "install_task"
  if (definition.internalName === PATCH_ONE_CLICK_REPAIR_NAME) return "one_click_repair"
  return null
}

export function isPatchCommandDefinition(definition: ControlObjectDefinition) {
  return patchCommandKind(definition) !== null
}

function readTargets(value: unknown): PatchInstallTaskTarget[] {
  if (!Array.isArray(value) || value.length === 0) invalidContext()

  const agentIds = new Set<string>()
  return value.map((candidate) => {
    const target = recordValue(candidate)
    if (!target) invalidContext()

    const agentId = requiredString(target.agent_id)
    if (!agentId || agentIds.has(agentId)) invalidContext()
    agentIds.add(agentId)

    if (!Array.isArray(target.patch_guids) || target.patch_guids.length === 0) invalidContext()
    const patchGuids = target.patch_guids.map(requiredString)
    if (patchGuids.some((patchGuid) => !patchGuid)) invalidContext()
    if (new Set(patchGuids).size !== patchGuids.length) invalidContext()

    return { agentId, patchGuids }
  })
}

export function readPatchCommandContext(
  definition: ControlObjectDefinition,
  context: string,
): PatchCommandContent {
  const kind = patchCommandKind(definition)
  if (!kind) invalidContext()

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
  const repairScope = recordValue(body?.repair_scope)
  const execution = recordValue(body?.execution)
  const install = recordValue(body?.install)
  if (!root || !command || !head || !body || !repairScope || !execution || !install) {
    invalidContext()
  }

  const expectedName = kind === "install_task"
    ? PATCH_INSTALL_TASK_NAME
    : PATCH_ONE_CLICK_REPAIR_NAME
  const expectedScopeMode = kind === "install_task"
    ? "selected_patches_by_agent"
    : "all_required_patches"
  const id = requiredString(head.id)
  const name = requiredString(head.name)
  const moduleName = requiredString(head.module)
  const category = requiredInteger(head.category)
  const type = requiredInteger(head.type)
  const subtype = requiredInteger(head.subtype)
  const scopeMode = requiredString(repairScope.mode)

  if (
    !id
    || id.toLowerCase() !== definition.objectId.toLowerCase()
    || name !== expectedName
    || definition.internalName !== expectedName
    || moduleName !== PATCH_COMMAND_MODULE
    || category !== PATCH_COMMAND_CATEGORY
    || type !== 2
    || subtype !== PATCH_COMMAND_SUBTYPE
    || scopeMode !== expectedScopeMode
  ) {
    invalidContext()
  }

  const osPlatform = operatingSystem(repairScope.os_platform)
  const executionMode = requiredString(execution.mode)
  if (executionMode !== "immediate" && executionMode !== "scheduled") invalidContext()

  const scheduledTime = optionalString(execution, "scheduled_time")
  if (executionMode === "immediate" && scheduledTime) invalidContext()
  if (executionMode === "scheduled" && !isValidPatchScheduledTime(scheduledTime)) invalidContext()

  const randomDelayMinutes = requiredInteger(execution.random_delay_minutes)
  if (randomDelayMinutes === null || randomDelayMinutes < 0 || randomDelayMinutes > 120) {
    invalidContext()
  }

  const taskName = kind === "install_task" ? requiredString(body.task_name) : ""
  if (kind === "install_task" && (!taskName || taskName.length > 128)) invalidContext()
  if (kind === "one_click_repair" && body.task_name !== undefined) invalidContext()

  const targets = kind === "install_task" ? readTargets(repairScope.targets) : []
  if (kind === "one_click_repair" && repairScope.targets !== undefined) invalidContext()

  return {
    kind,
    category,
    taskName,
    osPlatform,
    executionMode,
    scheduledTime,
    randomDelayMinutes,
    rebootAfterInstall: requiredBoolean(install, "reboot_after_install"),
    backupBeforeRepair: requiredBoolean(install, "backup_before_repair"),
    rescanAfterRepair: requiredBoolean(install, "rescan_after_repair"),
    targets,
    uniquePatchCount: new Set(targets.flatMap((target) => target.patchGuids)).size,
    rawContext: root,
  }
}

export function patchCommandParameters(
  content: PatchCommandContent,
): PatchCommandParameters {
  return {
    taskName: content.taskName,
    osPlatform: content.osPlatform,
    executionMode: content.executionMode,
    scheduledTime: content.scheduledTime,
    randomDelayMinutes: content.randomDelayMinutes,
    rebootAfterInstall: content.rebootAfterInstall,
    backupBeforeRepair: content.backupBeforeRepair,
    rescanAfterRepair: content.rescanAfterRepair,
  }
}

export function patchCommandParameterSignature(parameters: PatchCommandParameters) {
  return JSON.stringify({
    ...parameters,
    scheduledTime: parameters.executionMode === "scheduled"
      ? parameters.scheduledTime
      : "",
  })
}

export function validatePatchCommandParameters(
  kind: PatchCommandKind,
  parameters: PatchCommandParameters,
) {
  if (kind === "install_task") {
    const taskName = parameters.taskName.trim()
    if (!taskName) return "请输入任务名称"
    if (taskName.length > 128) return "任务名称不能超过 128 个字符"
  }

  if (!["", "windows", "linux", "macOs"].includes(parameters.osPlatform)) {
    return "操作系统无效"
  }
  if (parameters.executionMode !== "immediate" && parameters.executionMode !== "scheduled") {
    return "执行方式无效"
  }
  if (
    !Number.isSafeInteger(parameters.randomDelayMinutes)
    || parameters.randomDelayMinutes < 0
    || parameters.randomDelayMinutes > 120
  ) {
    return "随机延迟必须是 0–120 之间的整数"
  }
  if (
    parameters.executionMode === "scheduled"
    && !isValidPatchScheduledTime(parameters.scheduledTime)
  ) {
    return "请选择有效的计划执行时间"
  }
  if (
    typeof parameters.rebootAfterInstall !== "boolean"
    || typeof parameters.backupBeforeRepair !== "boolean"
    || typeof parameters.rescanAfterRepair !== "boolean"
  ) {
    return "安装选项无效"
  }
  return ""
}

export function writePatchCommandContext({
  content,
  newObjectId,
  parameters,
}: {
  content: PatchCommandContent
  newObjectId: string
  parameters: PatchCommandParameters
}) {
  const normalizedObjectId = newObjectId.trim()
  if (!normalizedObjectId || normalizedObjectId.length > 64) {
    throw new Error("PMC_CREATE_OBJECT_ID_INVALID")
  }
  if (validatePatchCommandParameters(content.kind, parameters)) invalidContext()

  const root = structuredClone(content.rawContext)
  const command = recordValue(root.command)
  const head = recordValue(command?.head)
  const body = recordValue(command?.body)
  const repairScope = recordValue(body?.repair_scope)
  const execution = recordValue(body?.execution)
  const install = recordValue(body?.install)
  if (!command || !head || !body || !repairScope || !execution || !install) invalidContext()

  head.id = normalizedObjectId
  if (content.kind === "install_task") {
    body.task_name = parameters.taskName.trim()
  }

  if (parameters.osPlatform) {
    repairScope.os_platform = parameters.osPlatform
  } else {
    delete repairScope.os_platform
  }

  execution.mode = parameters.executionMode
  execution.random_delay_minutes = parameters.randomDelayMinutes
  if (parameters.executionMode === "scheduled") {
    execution.scheduled_time = parameters.scheduledTime
  } else {
    delete execution.scheduled_time
  }

  install.reboot_after_install = parameters.rebootAfterInstall
  install.backup_before_repair = parameters.backupBeforeRepair
  install.rescan_after_repair = parameters.rescanAfterRepair

  return JSON.stringify(root)
}
