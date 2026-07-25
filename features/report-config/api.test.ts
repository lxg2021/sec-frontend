import { beforeEach, describe, expect, it, vi } from "vitest"

const { post } = vi.hoisted(() => ({ post: vi.fn() }))

vi.mock("@/shared/lib/http/client", () => ({
  http: { post },
}))

import {
  buildReportConfigContext,
  getReportConfig,
  REPORT_CONFIG_OBJECT_ID,
  updateReportConfig,
} from "@/features/report-config/api"

function context(
  body: Record<string, unknown> = {
    "interval-time": 2000,
    "report-thread": 4,
    "report-unit": 10,
    "try-count": 3,
    "compress-type": 3,
  },
  version = "1.0.0",
) {
  return JSON.stringify({
    config: {
      head: {
        id: REPORT_CONFIG_OBJECT_ID,
        type: 3,
        subtype: 50,
        name: "reportconfig",
        version,
      },
      body,
    },
  })
}

function definition(configContext = context(), version = "1.0.0") {
  return {
    type: 3,
    object_id: REPORT_CONFIG_OBJECT_ID,
    object_version: version,
    config: {
      name: "reportconfig",
      sub_type: 50,
      version,
      context: configContext,
    },
    capabilities: { can_update: true },
  }
}

describe("report config API", () => {
  beforeEach(() => {
    post.mockReset()
  })

  it("gets the fixed built-in config and strictly parses the Agent fields", async () => {
    post.mockResolvedValueOnce({ data: { definition: definition() } })

    await expect(getReportConfig()).resolves.toEqual({
      baseVersion: "1.0.0",
      intervalTime: 2000,
      reportThread: 4,
      reportUnit: 10,
      tryCount: 3,
      compressType: 3,
      canUpdate: true,
    })
    expect(post).toHaveBeenCalledWith("getPMCObjectDefinition", {
      request_id: expect.any(String),
      object_type: 3,
      object_id: REPORT_CONFIG_OBJECT_ID,
    })
  })

  it("rejects damaged content instead of silently replacing it with defaults", async () => {
    post.mockResolvedValueOnce({ data: { definition: definition("not-json") } })
    await expect(getReportConfig()).rejects.toThrow("不是有效的 JSON")

    post.mockResolvedValueOnce({
      data: {
        definition: definition(
          context({
            "interval-time": 0,
            "report-thread": 4,
            "report-unit": 10,
            "try-count": 3,
            "compress-type": 3,
          }),
        ),
      },
    })
    await expect(getReportConfig()).rejects.toThrow("interval-time 必须是大于 0")
  })

  it.each([0, 1, 4])("rejects unsupported compress-type %s", async (compressType) => {
    post.mockResolvedValueOnce({
      data: {
        definition: definition(
          context({
            "interval-time": 2000,
            "report-thread": 4,
            "report-unit": 10,
            "try-count": 3,
            "compress-type": compressType,
          }),
        ),
      },
    })

    await expect(getReportConfig()).rejects.toThrow("只允许使用 2（LZ4）或 3（不压缩）")
  })

  it("rejects a mismatch between definition, object, and content versions", async () => {
    post.mockResolvedValueOnce({
      data: { definition: { ...definition(), object_version: "1.1.0" } },
    })
    await expect(getReportConfig()).rejects.toThrow("定义版本与对象版本不一致")

    post.mockResolvedValueOnce({
      data: { definition: definition(context(undefined, "1.1.0")) },
    })
    await expect(getReportConfig()).rejects.toThrow("内容版本与对象版本不一致")
  })

  it("builds the exact hyphenated Agent context without inventing a module field", () => {
    const built = buildReportConfigContext({
      version: "1.1.0",
      intervalTime: 2500,
      reportThread: 6,
      reportUnit: 20,
      tryCount: 5,
      compressType: 2,
    })

    expect(JSON.parse(built)).toEqual({
      config: {
        head: {
          id: REPORT_CONFIG_OBJECT_ID,
          type: 3,
          subtype: 50,
          name: "reportconfig",
          version: "1.1.0",
        },
        body: {
          "interval-time": 2500,
          "report-thread": 6,
          "report-unit": 20,
          "try-count": 5,
          "compress-type": 2,
        },
      },
    })
    expect(JSON.parse(built).config.head).not.toHaveProperty("module")
  })

  it("rejects invalid update values before sending a request", async () => {
    await expect(
      updateReportConfig({
        version: "1.1.0",
        intervalTime: 2000,
        reportThread: 4,
        reportUnit: 10,
        tryCount: 0,
        compressType: 3,
      }),
    ).rejects.toThrow("try-count 必须是大于 0")
    expect(post).not.toHaveBeenCalled()
  })

  it("creates only a new definition version and does not apply it to agents", async () => {
    const updatedContext = context(
      {
        "interval-time": 2500,
        "report-thread": 6,
        "report-unit": 20,
        "try-count": 5,
        "compress-type": 2,
      },
      "1.1.0",
    )
    post.mockResolvedValueOnce({
      data: { definition: definition(updatedContext, "1.1.0") },
    })

    await updateReportConfig({
      version: "1.1.0",
      intervalTime: 2500,
      reportThread: 6,
      reportUnit: 20,
      tryCount: 5,
      compressType: 2,
    })

    expect(post).toHaveBeenCalledWith("updatePMCObjectDefinition", {
      request_id: expect.any(String),
      definition: {
        type: 3,
        object_id: REPORT_CONFIG_OBJECT_ID,
        config: {
          name: "reportconfig",
          sub_type: 50,
          version: "1.1.0",
          context: updatedContext,
        },
      },
    })
    expect(post.mock.calls[0][1]).not.toHaveProperty("agent_ids")
    expect(post.mock.calls[0][1]).not.toHaveProperty("operation")
  })
})
