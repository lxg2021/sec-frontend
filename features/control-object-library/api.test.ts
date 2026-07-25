import { beforeEach, describe, expect, it, vi } from "vitest"

const { post } = vi.hoisted(() => ({ post: vi.fn() }))

vi.mock("@/shared/lib/http/client", () => ({
  http: { post },
}))

import {
  BUILTIN_CONTROL_OBJECT_IDS,
  listControlObjectDefinitions,
} from "./api"

describe("control object library API", () => {
  beforeEach(() => {
    post.mockReset()
  })

  it("loads all active object types and normalizes the frozen capability contract", async () => {
    post.mockResolvedValue({
      data: {
        total: 3,
        page: 1,
        page_size: 100,
        definitions: [
          {
            type: 1,
            object_id: BUILTIN_CONTROL_OBJECT_IDS.baselineScanPolicy,
            object_version: "1.2.0",
            policy: { name: "default baseline scan policy", sub_type: 210, version: "1.2.0" },
            capabilities: {
              capability_profile: "policy_protected_v1",
              capability_contract_version: 1,
              allowed_agent_operations: [1, 2],
              can_update: true,
              catalog_delete_mode: 1,
            },
            object_state: "active",
          },
          {
            type: 2,
            object_id: BUILTIN_CONTROL_OBJECT_IDS.patchImmediateScan,
            object_version: "1.0.0",
            command: { name: "patch immediate scan", sub_type: 1, category: 1 },
            capabilities: {
              allowed_agent_operations: [4],
              can_update: false,
              catalog_delete_mode: 2,
            },
          },
          {
            type: 3,
            object_id: BUILTIN_CONTROL_OBJECT_IDS.generalConfig,
            object_version: "2.0.0",
            config: { name: "generalconfig", subtype: 10, version: "2.0.0" },
            capabilities: {
              allowed_agent_operations: [1],
              can_update: true,
              catalog_delete_mode: 1,
            },
          },
        ],
      },
    })

    const result = await listControlObjectDefinitions()

    expect(post).toHaveBeenCalledWith("listPMCObjectDefinitions", {
      request_id: expect.stringMatching(/^\d+$/),
      object_type: 0,
      lifecycle_state: "active",
      page: 1,
      page_size: 100,
    })
    expect(result.map((item) => item.objectType)).toEqual(["config", "policy", "command"])
    expect(result[0]).toMatchObject({
      displayName: "通用配置",
      internalName: "generalconfig",
      source: "builtin",
      subType: 10,
      version: "2.0.0",
      capabilities: {
        allowedOperations: ["apply"],
        canUpdate: true,
        deleteMode: "forbidden",
      },
    })
    expect(result[1]).toMatchObject({
      displayName: "基线扫描策略",
      capabilities: { allowedOperations: ["apply", "stop"] },
    })
    expect(result[2]).toMatchObject({
      displayName: "漏洞立即扫描",
      capabilities: { allowedOperations: ["execute"], canUpdate: false },
    })
  })

  it("accepts enum strings, camel-case fields, and wrapped content", async () => {
    post.mockResolvedValue({
      data: {
        total: 1,
        definitions: [{
          type: "CONFIG_TYPE",
          objectId: "custom-config",
          objectVersion: "3.1.4",
          content: {
            config: { Name: "Custom config", SubType: 88 },
          },
          Capabilities: {
            capabilityProfile: "config_replaceable_v1",
            capabilityContractVersion: 1,
            allowedAgentOperations: ["PMC_OPERATION_TYPE_APPLY", "PMC_OPERATION_TYPE_REMOVE"],
            canUpdate: true,
            catalogDeleteMode: "PMC_CATALOG_DELETE_MODE_REMOVE_EFFECTS",
          },
          objectState: "active",
        }],
      },
    })

    await expect(listControlObjectDefinitions()).resolves.toEqual([
      expect.objectContaining({
        objectId: "custom-config",
        objectType: "config",
        displayName: "Custom config",
        source: "unknown",
        subType: 88,
        capabilities: expect.objectContaining({
          allowedOperations: ["apply", "remove"],
          deleteMode: "remove_effects",
        }),
      }),
    ])
  })

  it("continues paging until the backend total is reached", async () => {
    post
      .mockResolvedValueOnce({
        data: {
          total: 2,
          definitions: [{
            type: 3,
            object_id: "config-a",
            object_version: "1.0.0",
            config: { name: "Config A", sub_type: 1 },
            capabilities: {},
          }],
        },
      })
      .mockResolvedValueOnce({
        data: {
          total: 2,
          definitions: [{
            type: 1,
            object_id: "policy-b",
            object_version: "1.0.0",
            policy: { name: "Policy B", sub_type: 2 },
            capabilities: {},
          }],
        },
      })

    const result = await listControlObjectDefinitions()

    expect(post).toHaveBeenCalledTimes(2)
    expect(post.mock.calls.map((call) => call[1].page)).toEqual([1, 2])
    expect(result.map((item) => item.objectId)).toEqual(["config-a", "policy-b"])
  })

  it("rejects malformed definitions instead of inventing missing business fields", async () => {
    post.mockResolvedValue({
      data: {
        total: 1,
        definitions: [{ type: 3, object_id: "broken", config: { name: "Broken" } }],
      },
    })

    await expect(listControlObjectDefinitions()).rejects.toThrow("PMC_OBJECT_DEFINITION_INVALID")
  })

  it("treats a nil repeated field as an empty successful list when total is zero", async () => {
    post.mockResolvedValue({ data: { total: 0, definitions: null } })

    await expect(listControlObjectDefinitions()).resolves.toEqual([])
  })
})
