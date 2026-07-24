import { http } from "@/shared/lib/http/client"
import { createUuidRequestId } from "@/shared/lib/utils"

import {
  isGeneralConfigLogLevel,
  type GeneralConfigLogLevel,
} from "@/features/general-config/log-levels"

export const GENERAL_CONFIG_OBJECT_ID = "9a182447-b61d-48f6-b99c-264c128aeebb"
export const GENERAL_CONFIG_OBJECT_TYPE = 3
export const GENERAL_CONFIG_SUB_TYPE = 10
export const GENERAL_CONFIG_INTERNAL_NAME = "generalconfig"
export const GENERAL_CONFIG_MODULE = "HeartBeat"
export const GENERAL_CONFIG_DEFAULTS = {
  heartInterval: 10,
  logLevel: 1,
} as const

const VERSION_PATTERN = /^\d+\.\d+\.\d+$/

interface ApiResult<T> {
  data: T
}

interface RawConfigObject {
  name?: unknown
  sub_type?: unknown
  version?: unknown
  context?: unknown
}

interface RawPMCObjectDefinition {
  type?: unknown
  object_id?: unknown
  object_version?: unknown
  config?: RawConfigObject | null
  content?: { config?: RawConfigObject | null } | null
  Content?: { config?: RawConfigObject | null } | null
  capabilities?: { can_update?: unknown } | null
}

interface PMCObjectDefinitionResponseData {
  definition?: RawPMCObjectDefinition | null
}

interface GeneralConfigContext {
  config: {
    head: {
      id: string
      type: number
      subtype: number
      module: string
      name: string
      version: string
    }
    body: {
      heart_interval: number
      log_level: GeneralConfigLogLevel
    }
  }
}

export interface GeneralConfigDefinition {
  baseVersion: string
  heartInterval: number
  logLevel: GeneralConfigLogLevel
  canUpdate: boolean
}

export interface UpdateGeneralConfigInput {
  version: string
  heartInterval: number
  logLevel: GeneralConfigLogLevel
}

function recordValue(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function integerValue(value: unknown, fieldName: string, minimum: number) {
  if (!Number.isSafeInteger(value) || Number(value) < minimum) {
    throw new Error(`通用配置中的 ${fieldName} 不是有效整数`)
  }
  return Number(value)
}

function logLevelValue(value: unknown) {
  const level = integerValue(value, "log_level", 0)
  if (!isGeneralConfigLogLevel(level)) {
    throw new Error("通用配置中的 log_level 必须是 0 至 6 之间的日志级别")
  }
  return level
}

function readConfigObject(definition: RawPMCObjectDefinition) {
  return definition.config ?? definition.content?.config ?? definition.Content?.config ?? null
}

function parseContext(context: string): GeneralConfigContext {
  let parsed: unknown
  try {
    parsed = JSON.parse(context)
  } catch {
    throw new Error("通用配置内容不是有效的 JSON")
  }

  const root = recordValue(parsed)
  const config = recordValue(root?.config)
  const head = recordValue(config?.head)
  const body = recordValue(config?.body)
  if (!root || !config || !head || !body) {
    throw new Error("通用配置缺少 config.head 或 config.body")
  }

  const version = stringValue(head.version)
  if (
    stringValue(head.id) !== GENERAL_CONFIG_OBJECT_ID ||
    head.type !== GENERAL_CONFIG_OBJECT_TYPE ||
    head.subtype !== GENERAL_CONFIG_SUB_TYPE ||
    stringValue(head.module) !== GENERAL_CONFIG_MODULE ||
    stringValue(head.name) !== GENERAL_CONFIG_INTERNAL_NAME ||
    !VERSION_PATTERN.test(version)
  ) {
    throw new Error("通用配置的对象标识或版本信息不正确")
  }

  return {
    config: {
      head: {
        id: GENERAL_CONFIG_OBJECT_ID,
        type: GENERAL_CONFIG_OBJECT_TYPE,
        subtype: GENERAL_CONFIG_SUB_TYPE,
        module: GENERAL_CONFIG_MODULE,
        name: GENERAL_CONFIG_INTERNAL_NAME,
        version,
      },
      body: {
        heart_interval: integerValue(body.heart_interval, "heart_interval", 1),
        log_level: logLevelValue(body.log_level),
      },
    },
  }
}

export function parseGeneralConfigDefinition(
  definition: RawPMCObjectDefinition | null | undefined,
): GeneralConfigDefinition {
  if (!definition) throw new Error("服务端未返回通用配置定义")
  if (
    definition.type !== GENERAL_CONFIG_OBJECT_TYPE ||
    stringValue(definition.object_id) !== GENERAL_CONFIG_OBJECT_ID
  ) {
    throw new Error("服务端返回的通用配置对象标识不匹配")
  }

  const configObject = readConfigObject(definition)
  if (!configObject) throw new Error("服务端返回的通用配置缺少 config 内容")

  const baseVersion =
    stringValue(definition.object_version) || stringValue(configObject.version)
  if (
    stringValue(configObject.name) !== GENERAL_CONFIG_INTERNAL_NAME ||
    configObject.sub_type !== GENERAL_CONFIG_SUB_TYPE ||
    !VERSION_PATTERN.test(baseVersion)
  ) {
    throw new Error("服务端返回的通用配置元数据不正确")
  }

  const context = stringValue(configObject.context)
  if (!context) throw new Error("服务端返回的通用配置内容为空")
  const parsed = parseContext(context)
  if (parsed.config.head.version !== baseVersion) {
    throw new Error("通用配置内容版本与对象版本不一致")
  }

  return {
    baseVersion,
    heartInterval: parsed.config.body.heart_interval,
    logLevel: parsed.config.body.log_level,
    canUpdate: definition.capabilities?.can_update === true,
  }
}

export function buildGeneralConfigContext(input: UpdateGeneralConfigInput) {
  if (!isGeneralConfigLogLevel(input.logLevel)) {
    throw new Error("通用配置中的 log_level 必须是 0 至 6 之间的日志级别")
  }

  return JSON.stringify({
    config: {
      head: {
        id: GENERAL_CONFIG_OBJECT_ID,
        type: GENERAL_CONFIG_OBJECT_TYPE,
        subtype: GENERAL_CONFIG_SUB_TYPE,
        module: GENERAL_CONFIG_MODULE,
        name: GENERAL_CONFIG_INTERNAL_NAME,
        version: input.version.trim(),
      },
      body: {
        heart_interval: input.heartInterval,
        log_level: input.logLevel,
      },
    },
  } satisfies GeneralConfigContext)
}

export async function getGeneralConfig(): Promise<GeneralConfigDefinition> {
  const result = (await http.post("getPMCObjectDefinition", {
    request_id: createUuidRequestId(),
    object_type: GENERAL_CONFIG_OBJECT_TYPE,
    object_id: GENERAL_CONFIG_OBJECT_ID,
  })) as ApiResult<PMCObjectDefinitionResponseData | null>

  return parseGeneralConfigDefinition(result.data?.definition)
}

export async function updateGeneralConfig(
  input: UpdateGeneralConfigInput,
): Promise<GeneralConfigDefinition> {
  const result = (await http.post("updatePMCObjectDefinition", {
    request_id: createUuidRequestId(),
    definition: {
      type: GENERAL_CONFIG_OBJECT_TYPE,
      object_id: GENERAL_CONFIG_OBJECT_ID,
      config: {
        name: GENERAL_CONFIG_INTERNAL_NAME,
        sub_type: GENERAL_CONFIG_SUB_TYPE,
        version: input.version.trim(),
        context: buildGeneralConfigContext(input),
      },
    },
  })) as ApiResult<PMCObjectDefinitionResponseData | null>

  return parseGeneralConfigDefinition(result.data?.definition)
}

export function compareGeneralConfigVersions(left: string, right: string) {
  const leftParts = parseVersion(left)
  const rightParts = parseVersion(right)
  if (!leftParts || !rightParts) return null

  for (let index = 0; index < leftParts.length; index += 1) {
    if (leftParts[index] > rightParts[index]) return 1
    if (leftParts[index] < rightParts[index]) return -1
  }
  return 0
}

export function suggestNextGeneralConfigVersion(version: string) {
  const parts = parseVersion(version)
  if (!parts || parts[1] >= Number.MAX_SAFE_INTEGER) return ""
  return `${parts[0]}.${parts[1] + 1}.0`
}

function parseVersion(version: string) {
  const normalized = version.trim()
  if (!VERSION_PATTERN.test(normalized)) return null
  const parts = normalized.split(".").map(Number)
  if (parts.some((part) => !Number.isSafeInteger(part))) return null
  return parts
}
