import { http } from "@/shared/lib/http/client"
import { createUuidRequestId } from "@/shared/lib/utils"

export const REPORT_CONFIG_OBJECT_ID = "32cbdb22-52e0-43f7-a663-ce6335c28850"
export const REPORT_CONFIG_OBJECT_TYPE = 3
export const REPORT_CONFIG_SUB_TYPE = 50
export const REPORT_CONFIG_INTERNAL_NAME = "reportconfig"
export const REPORT_CONFIG_DEFAULTS = {
  intervalTime: 2000,
  reportThread: 4,
  reportUnit: 10,
  tryCount: 3,
  compressType: 3,
} as const

export type ReportCompressType = 2 | 3

export const REPORT_COMPRESS_OPTIONS = [
  { value: 3, labelKey: "reportConfig.compressOptions.none" },
  { value: 2, labelKey: "reportConfig.compressOptions.lz4" },
] as const satisfies ReadonlyArray<{ value: ReportCompressType; labelKey: string }>

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

interface ReportConfigContext {
  config: {
    head: {
      id: string
      type: number
      subtype: number
      name: string
      version: string
    }
    body: {
      "interval-time": number
      "report-thread": number
      "report-unit": number
      "try-count": number
      "compress-type": ReportCompressType
    }
  }
}

export interface ReportConfigDefinition {
  baseVersion: string
  intervalTime: number
  reportThread: number
  reportUnit: number
  tryCount: number
  compressType: ReportCompressType
  canUpdate: boolean
}

export interface UpdateReportConfigInput {
  version: string
  intervalTime: number
  reportThread: number
  reportUnit: number
  tryCount: number
  compressType: ReportCompressType
}

function recordValue(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function positiveIntegerValue(value: unknown, fieldName: string) {
  if (!Number.isSafeInteger(value) || Number(value) <= 0) {
    throw new Error(`上报配置中的 ${fieldName} 必须是大于 0 的安全整数`)
  }
  return Number(value)
}

function compressTypeValue(value: unknown): ReportCompressType {
  if (value !== 2 && value !== 3) {
    throw new Error("上报配置中的 compress-type 只允许使用 2（LZ4）或 3（不压缩）")
  }
  return value
}

function validVersion(value: unknown, fieldName: string) {
  const version = stringValue(value)
  if (!VERSION_PATTERN.test(version)) {
    throw new Error(`${fieldName} 必须使用 x.y.z 格式`)
  }
  const parts = version.split(".").map(Number)
  if (parts.some((part) => !Number.isSafeInteger(part))) {
    throw new Error(`${fieldName} 包含超出安全整数范围的版本号`)
  }
  return version
}

function readConfigObject(definition: RawPMCObjectDefinition) {
  return definition.config ?? definition.content?.config ?? definition.Content?.config ?? null
}

function parseContext(context: string): ReportConfigContext {
  let parsed: unknown
  try {
    parsed = JSON.parse(context)
  } catch {
    throw new Error("上报配置内容不是有效的 JSON")
  }

  const root = recordValue(parsed)
  const config = recordValue(root?.config)
  const head = recordValue(config?.head)
  const body = recordValue(config?.body)
  if (!root || !config || !head || !body) {
    throw new Error("上报配置缺少 config.head 或 config.body")
  }

  const version = validVersion(head.version, "上报配置内容版本")
  if (
    stringValue(head.id) !== REPORT_CONFIG_OBJECT_ID ||
    head.type !== REPORT_CONFIG_OBJECT_TYPE ||
    head.subtype !== REPORT_CONFIG_SUB_TYPE ||
    stringValue(head.name) !== REPORT_CONFIG_INTERNAL_NAME
  ) {
    throw new Error("上报配置的对象标识不正确")
  }

  return {
    config: {
      head: {
        id: REPORT_CONFIG_OBJECT_ID,
        type: REPORT_CONFIG_OBJECT_TYPE,
        subtype: REPORT_CONFIG_SUB_TYPE,
        name: REPORT_CONFIG_INTERNAL_NAME,
        version,
      },
      body: {
        "interval-time": positiveIntegerValue(body["interval-time"], "interval-time"),
        "report-thread": positiveIntegerValue(body["report-thread"], "report-thread"),
        "report-unit": positiveIntegerValue(body["report-unit"], "report-unit"),
        "try-count": positiveIntegerValue(body["try-count"], "try-count"),
        "compress-type": compressTypeValue(body["compress-type"]),
      },
    },
  }
}

export function parseReportConfigDefinition(
  definition: RawPMCObjectDefinition | null | undefined,
): ReportConfigDefinition {
  if (!definition) throw new Error("服务端未返回上报配置定义")
  if (
    definition.type !== REPORT_CONFIG_OBJECT_TYPE ||
    stringValue(definition.object_id) !== REPORT_CONFIG_OBJECT_ID
  ) {
    throw new Error("服务端返回的上报配置对象标识不匹配")
  }

  const configObject = readConfigObject(definition)
  if (!configObject) throw new Error("服务端返回的上报配置缺少 config 内容")
  if (
    stringValue(configObject.name) !== REPORT_CONFIG_INTERNAL_NAME ||
    configObject.sub_type !== REPORT_CONFIG_SUB_TYPE
  ) {
    throw new Error("服务端返回的上报配置元数据不正确")
  }

  const configVersion = validVersion(configObject.version, "上报配置对象版本")
  const definitionVersion = stringValue(definition.object_version)
  if (definitionVersion && validVersion(definitionVersion, "上报配置定义版本") !== configVersion) {
    throw new Error("上报配置定义版本与对象版本不一致")
  }

  const context = stringValue(configObject.context)
  if (!context) throw new Error("服务端返回的上报配置内容为空")
  const parsed = parseContext(context)
  if (parsed.config.head.version !== configVersion) {
    throw new Error("上报配置内容版本与对象版本不一致")
  }

  return {
    baseVersion: configVersion,
    intervalTime: parsed.config.body["interval-time"],
    reportThread: parsed.config.body["report-thread"],
    reportUnit: parsed.config.body["report-unit"],
    tryCount: parsed.config.body["try-count"],
    compressType: parsed.config.body["compress-type"],
    canUpdate: definition.capabilities?.can_update === true,
  }
}

export function buildReportConfigContext(input: UpdateReportConfigInput) {
  const version = validVersion(input.version, "上报配置新版本")
  const intervalTime = positiveIntegerValue(input.intervalTime, "interval-time")
  const reportThread = positiveIntegerValue(input.reportThread, "report-thread")
  const reportUnit = positiveIntegerValue(input.reportUnit, "report-unit")
  const tryCount = positiveIntegerValue(input.tryCount, "try-count")
  const compressType = compressTypeValue(input.compressType)

  return JSON.stringify({
    config: {
      head: {
        id: REPORT_CONFIG_OBJECT_ID,
        type: REPORT_CONFIG_OBJECT_TYPE,
        subtype: REPORT_CONFIG_SUB_TYPE,
        name: REPORT_CONFIG_INTERNAL_NAME,
        version,
      },
      body: {
        "interval-time": intervalTime,
        "report-thread": reportThread,
        "report-unit": reportUnit,
        "try-count": tryCount,
        "compress-type": compressType,
      },
    },
  } satisfies ReportConfigContext)
}

export async function getReportConfig(): Promise<ReportConfigDefinition> {
  const result = (await http.post("getPMCObjectDefinition", {
    request_id: createUuidRequestId(),
    object_type: REPORT_CONFIG_OBJECT_TYPE,
    object_id: REPORT_CONFIG_OBJECT_ID,
  })) as ApiResult<PMCObjectDefinitionResponseData | null>

  return parseReportConfigDefinition(result.data?.definition)
}

export async function updateReportConfig(
  input: UpdateReportConfigInput,
): Promise<ReportConfigDefinition> {
  const context = buildReportConfigContext(input)
  const version = input.version.trim()
  const result = (await http.post("updatePMCObjectDefinition", {
    request_id: createUuidRequestId(),
    definition: {
      type: REPORT_CONFIG_OBJECT_TYPE,
      object_id: REPORT_CONFIG_OBJECT_ID,
      config: {
        name: REPORT_CONFIG_INTERNAL_NAME,
        sub_type: REPORT_CONFIG_SUB_TYPE,
        version,
        context,
      },
    },
  })) as ApiResult<PMCObjectDefinitionResponseData | null>

  return parseReportConfigDefinition(result.data?.definition)
}

export function compareReportConfigVersions(left: string, right: string) {
  const leftParts = parseVersion(left)
  const rightParts = parseVersion(right)
  if (!leftParts || !rightParts) return null

  for (let index = 0; index < leftParts.length; index += 1) {
    if (leftParts[index] > rightParts[index]) return 1
    if (leftParts[index] < rightParts[index]) return -1
  }
  return 0
}

export function suggestNextReportConfigVersion(version: string) {
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
