import type { ScanSchedule } from "@/shared/components/scan-schedule"

import type { ControlObjectDefinition } from "./api"

export const BASELINE_SCAN_POLICY_SUB_TYPE = 60

const BASELINE_SCAN_POLICY_MODULE = "BaselineManagement"
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/

type JsonRecord = Record<string, unknown>

interface BaselinePolicyContext {
  root: JsonRecord
  policy: JsonRecord
  head: JsonRecord
  body: JsonRecord
}

function recordValue(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : null
}

function invalidContext(): never {
  throw new Error("PMC_BASELINE_SCAN_POLICY_CONTEXT_INVALID")
}

function parseContext(context: string): BaselinePolicyContext {
  let parsed: unknown
  try {
    parsed = JSON.parse(context)
  } catch {
    invalidContext()
  }

  const root = recordValue(parsed)
  const policy = recordValue(root?.policy)
  const head = recordValue(policy?.head)
  const body = recordValue(policy?.body)
  if (!root || !policy || !head || !body) invalidContext()

  return { root, policy, head, body }
}

function integerField(
  schedule: JsonRecord,
  field: string,
  minimum: number,
  maximum?: number,
) {
  const value = schedule[field]
  if (
    !Number.isSafeInteger(value)
    || (value as number) < minimum
    || (maximum !== undefined && (value as number) > maximum)
  ) {
    invalidContext()
  }
  return value as number
}

export function isBaselineScanPolicyDefinition(
  definition: Pick<ControlObjectDefinition, "objectType" | "subType">,
) {
  return definition.objectType === "policy"
    && definition.subType === BASELINE_SCAN_POLICY_SUB_TYPE
}

export function readBaselineScanPolicySchedule(context: string): ScanSchedule {
  const { body } = parseContext(context)
  const schedule = recordValue(body.schedule)
  if (!schedule || schedule.mode !== "interval" || typeof schedule.scan_on_startup !== "boolean") {
    invalidContext()
  }

  const specificTime = schedule.specific_time
  if (
    specificTime !== undefined
    && (typeof specificTime !== "string" || (specificTime.trim() !== "" && !TIME_PATTERN.test(specificTime.trim())))
  ) {
    invalidContext()
  }

  return {
    mode: "interval",
    interval_hours: integerField(schedule, "interval_hours", 1, 24),
    specific_time: typeof specificTime === "string" && specificTime.trim()
      ? specificTime.trim()
      : undefined,
    random_delay_minutes: integerField(schedule, "random_delay_minutes", 0, 120),
    retry_limit: integerField(schedule, "retry_limit", 0, 10),
    retry_interval_minutes: integerField(schedule, "retry_interval_minutes", 1),
    scan_on_startup: schedule.scan_on_startup,
  }
}

function normalizedSchedule(schedule: ScanSchedule) {
  if (schedule.mode !== "interval" || typeof schedule.scan_on_startup !== "boolean") {
    invalidContext()
  }

  const specificTime = schedule.specific_time?.trim() || ""
  if (specificTime && !TIME_PATTERN.test(specificTime)) invalidContext()

  const scheduleRecord: JsonRecord = {
    mode: "interval",
    interval_hours: schedule.interval_hours,
    specific_time: specificTime,
    random_delay_minutes: schedule.random_delay_minutes,
    retry_limit: schedule.retry_limit,
    retry_interval_minutes: schedule.retry_interval_minutes,
    scan_on_startup: schedule.scan_on_startup,
  }

  // Reuse the same strict ranges used when reading existing backend content.
  integerField(scheduleRecord, "interval_hours", 1, 24)
  integerField(scheduleRecord, "random_delay_minutes", 0, 120)
  integerField(scheduleRecord, "retry_limit", 0, 10)
  integerField(scheduleRecord, "retry_interval_minutes", 1)

  return scheduleRecord
}

export function writeBaselineScanPolicyContext({
  context,
  definition,
  name,
  version,
  schedule,
}: {
  context: string
  definition: Pick<ControlObjectDefinition, "objectId" | "objectType" | "subType">
  name: string
  version: string
  schedule: ScanSchedule
}) {
  if (!isBaselineScanPolicyDefinition(definition)) invalidContext()

  const { root, policy, head, body } = parseContext(context)
  const nextContext = {
    ...root,
    policy: {
      ...policy,
      head: {
        ...head,
        id: definition.objectId,
        type: 1,
        subtype: BASELINE_SCAN_POLICY_SUB_TYPE,
        module: typeof head.module === "string" && head.module.trim()
          ? head.module
          : BASELINE_SCAN_POLICY_MODULE,
        name: name.trim(),
        version: version.trim(),
      },
      body: {
        ...body,
        schedule: normalizedSchedule(schedule),
      },
    },
  }

  return JSON.stringify(nextContext)
}
