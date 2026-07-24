import { beforeEach, describe, expect, it, vi } from "vitest"

import { http } from "@/shared/lib/http/client"

import {
  applyBaselineScanPolicy,
  createBaselineScanPolicy,
  getBaselineScanScheduleKey,
  isSameBaselineScanSchedule,
  listBaselineScanPolicies,
} from "./api"

vi.mock("@/shared/lib/http/client", () => ({
  http: {
    post: vi.fn(),
  },
}))

const postMock = vi.mocked(http.post)

beforeEach(() => {
  postMock.mockReset()
})

describe("baseline scan schedule identity", () => {
  it("matches schedules with the same normalized values", () => {
    const left = {
      mode: "interval" as const,
      interval_hours: 24,
      specific_time: " 12:00 ",
      random_delay_minutes: 5,
      retry_limit: 3,
      retry_interval_minutes: 5,
      scan_on_startup: false,
    }
    const right = {
      mode: "interval" as const,
      interval_hours: 24,
      specific_time: "12:00",
      random_delay_minutes: 5,
      retry_limit: 3,
      retry_interval_minutes: 5,
      scan_on_startup: false,
    }

    expect(getBaselineScanScheduleKey(left)).toBe(getBaselineScanScheduleKey(right))
    expect(isSameBaselineScanSchedule(left, right)).toBe(true)
  })

  it("does not match when an execution parameter changes", () => {
    const left = {
      mode: "interval" as const,
      interval_hours: 24,
      specific_time: "12:00",
      random_delay_minutes: 5,
      retry_limit: 3,
      retry_interval_minutes: 5,
      scan_on_startup: false,
    }

    expect(
      isSameBaselineScanSchedule(left, {
        ...left,
        scan_on_startup: true,
      }),
    ).toBe(false)
  })

  it("normalizes omitted optional values before comparison", () => {
    const withDefaults = {
      mode: "interval" as const,
      interval_hours: 24,
      specific_time: "12:00",
      random_delay_minutes: 5,
      retry_limit: 3,
      retry_interval_minutes: 5,
      scan_on_startup: false,
    }
    const omitted = {
      mode: "interval" as const,
      scan_on_startup: false,
    }

    expect(isSameBaselineScanSchedule(withDefaults, omitted)).toBe(true)
  })
})

describe("baseline scan policy API normalization", () => {
  it("reads object_id from the create response", async () => {
    postMock.mockResolvedValueOnce({
      code: 0,
      message: "success",
      requestId: "request-id",
      data: {
        object_id: "policy-object-id",
        name: "Windows baseline",
        version: "1.0.0",
      },
      raw: null,
    })

    await expect(
      createBaselineScanPolicy({
        name: "Windows baseline",
        version: "1.0.0",
        scanSchedule: {
          mode: "interval",
          scan_on_startup: false,
        },
      }),
    ).resolves.toEqual({
      id: "policy-object-id",
      name: "Windows baseline",
      version: "1.0.0",
    })
  })

  it("preserves the packaged 60-minute random delay in the create request", async () => {
    postMock.mockResolvedValueOnce({
      code: 0,
      message: "success",
      requestId: "request-id",
      data: {
        object_id: "policy-object-id",
        name: "默认基线扫描策略",
        version: "1.1.0",
      },
      raw: null,
    })

    await createBaselineScanPolicy({
      name: "默认基线扫描策略",
      version: "1.1.0",
      scanSchedule: {
        mode: "interval",
        interval_hours: 24,
        specific_time: "01:00",
        random_delay_minutes: 60,
        retry_limit: 3,
        retry_interval_minutes: 30,
        scan_on_startup: true,
      },
    })

    expect(postMock).toHaveBeenCalledWith("baselineScanPolicy", {
      request_id: expect.any(String),
      name: "默认基线扫描策略",
      version: "1.1.0",
      scan_schedule: {
        mode: "interval",
        interval_hours: 24,
        specific_time: "01:00",
        random_delay_minutes: 60,
        retry_limit: 3,
        retry_interval_minutes: 30,
        scan_on_startup: true,
      },
    })
  })

  it("keeps list items returned with object_id", async () => {
    postMock.mockResolvedValueOnce({
      code: 0,
      message: "success",
      requestId: "request-id",
      data: {
        pagination: {
          current_page: 1,
          page_size: 8,
          total_count: 1,
          total_pages: 1,
        },
        items: [
          {
            object_id: "policy-object-id",
            name: "Windows baseline",
            version: "1.0.0",
            scan_schedule: {
              mode: "interval",
              interval_hours: 24,
              specific_time: "12:00",
              random_delay_minutes: 5,
              retry_interval_minutes: 5,
              scan_on_startup: false,
            },
          },
        ],
      },
      raw: null,
    })

    const result = await listBaselineScanPolicies({
      limit: 8,
    })

    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({
      id: "policy-object-id",
      scanSchedule: {
        retry_limit: 0,
      },
    })
    expect(postMock).toHaveBeenCalledWith("listBaselineScanPolicies", {
      request_id: expect.any(String),
      limit: 8,
      offset: 0,
    })
  })

  it("dispatches a policy through OperatePMCObject with APPLY", async () => {
    postMock.mockResolvedValueOnce({
      code: 0,
      message: "success",
      requestId: "request-id",
      data: {
        operation: {
          operation_id: "operation-id",
          planning_status: "materialized",
          status: "pending",
          outcome: "",
          total_count: 2,
          materialized_count: 2,
          pending_count: 2,
        },
      },
      raw: null,
    })

    const operation = await applyBaselineScanPolicy({
      policyId: " policy-object-id ",
      version: " 1.0.0 ",
      agentIds: ["agent-1", " agent-2 ", "agent-1", ""],
    })

    expect(postMock).toHaveBeenCalledWith("operatePMCObject", {
      request_id: expect.any(String),
      object_type: 1,
      object_id: "policy-object-id",
      object_version: "1.0.0",
      operation: 1,
      agent_ids: ["agent-1", "agent-2"],
    })
    expect(operation).toMatchObject({
      operationId: "operation-id",
      planningStatus: "materialized",
      status: "pending",
      totalCount: 2,
      materializedCount: 2,
      pendingCount: 2,
    })
  })

  it("rejects an OperatePMCObject response without operation_id", async () => {
    postMock.mockResolvedValueOnce({
      code: 0,
      message: "success",
      requestId: "request-id",
      data: {
        operation: {},
      },
      raw: null,
    })

    await expect(
      applyBaselineScanPolicy({
        policyId: "policy-object-id",
        version: "1.0.0",
        agentIds: ["agent-1"],
      }),
    ).rejects.toThrow("missing PMC operation id in response")
  })
})
