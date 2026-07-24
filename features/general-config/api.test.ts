import { beforeEach, describe, expect, it, vi } from "vitest"

const { post } = vi.hoisted(() => ({ post: vi.fn() }))

vi.mock("@/shared/lib/http/client", () => ({
  http: { post },
}))

import {
  GENERAL_CONFIG_OBJECT_ID,
  getGeneralConfig,
  updateGeneralConfig,
} from "@/features/general-config/api"

function definition(
  context = JSON.stringify({
    config: {
      head: {
        id: GENERAL_CONFIG_OBJECT_ID,
        type: 3,
        subtype: 10,
        module: "HeartBeat",
        name: "generalconfig",
        version: "1.0.0",
      },
      body: { heart_interval: 10, log_level: 1 },
    },
  }),
) {
  return {
    type: 3,
    object_id: GENERAL_CONFIG_OBJECT_ID,
    object_version: "1.0.0",
    config: {
      name: "generalconfig",
      sub_type: 10,
      version: "1.0.0",
      context,
    },
    capabilities: { can_update: true },
  }
}

describe("general config API", () => {
  beforeEach(() => {
    post.mockReset()
  })

  it("gets the fixed built-in config and parses its values", async () => {
    post.mockResolvedValueOnce({ data: { definition: definition() } })

    await expect(getGeneralConfig()).resolves.toEqual({
      baseVersion: "1.0.0",
      heartInterval: 10,
      logLevel: 1,
      canUpdate: true,
    })
    expect(post).toHaveBeenCalledWith("getPMCObjectDefinition", {
      request_id: expect.any(String),
      object_type: 3,
      object_id: GENERAL_CONFIG_OBJECT_ID,
    })
  })

  it("rejects a damaged context instead of replacing it with defaults", async () => {
    post.mockResolvedValueOnce({ data: { definition: definition("not-json") } })

    await expect(getGeneralConfig()).rejects.toThrow("不是有效的 JSON")
  })

  it("rejects a log level outside the Agent enum", async () => {
    const invalidContext = JSON.stringify({
      config: {
        head: {
          id: GENERAL_CONFIG_OBJECT_ID,
          type: 3,
          subtype: 10,
          module: "HeartBeat",
          name: "generalconfig",
          version: "1.0.0",
        },
        body: { heart_interval: 10, log_level: 7 },
      },
    })
    post.mockResolvedValueOnce({ data: { definition: definition(invalidContext) } })

    await expect(getGeneralConfig()).rejects.toThrow("log_level 必须是 0 至 6")
  })

  it("updates only the fixed config definition and creates the requested version", async () => {
    const updatedDefinition = definition().config
    const updatedContext = JSON.stringify({
      config: {
        head: {
          id: GENERAL_CONFIG_OBJECT_ID,
          type: 3,
          subtype: 10,
          module: "HeartBeat",
          name: "generalconfig",
          version: "1.1.0",
        },
        body: { heart_interval: 30, log_level: 2 },
      },
    })
    post.mockResolvedValueOnce({
      data: {
        definition: {
          ...definition(updatedContext),
          object_version: "1.1.0",
          config: { ...updatedDefinition, version: "1.1.0", context: updatedContext },
        },
      },
    })

    await updateGeneralConfig({ version: "1.1.0", heartInterval: 30, logLevel: 2 })

    expect(post).toHaveBeenCalledWith("updatePMCObjectDefinition", {
      request_id: expect.any(String),
      definition: {
        type: 3,
        object_id: GENERAL_CONFIG_OBJECT_ID,
        config: {
          name: "generalconfig",
          sub_type: 10,
          version: "1.1.0",
          context: updatedContext,
        },
      },
    })
    expect(post.mock.calls[0][1]).not.toHaveProperty("agent_ids")
    expect(post.mock.calls[0][1]).not.toHaveProperty("operation")
  })
})
