import { beforeEach, describe, expect, it, vi } from "vitest"

const { post } = vi.hoisted(() => ({ post: vi.fn() }))

vi.mock("@/shared/lib/http/client", () => ({
  http: { post },
}))

import {
  BUILTIN_CONTROL_OBJECT_IDS,
  getControlObjectDefinition,
  listControlObjectDefinitions,
  type ControlObjectDefinition,
} from "./api"

function configDefinition(overrides: Partial<ControlObjectDefinition> = {}): ControlObjectDefinition {
  return {
    objectId: "custom-config",
    objectType: "config",
    objectTypeValue: 3,
    internalName: "Custom config",
    displayName: "Custom config",
    subType: 88,
    version: "3.1.4",
    source: "manual",
    state: "active",
    capabilities: {
      profile: "config_replaceable_v1",
      contractVersion: 1,
      allowedOperations: ["apply"],
      canUpdate: true,
      deleteMode: "forbidden",
    },
    ...overrides,
  }
}

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
            creation_source: 1,
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
            creation_source: 1,
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
            creation_source: 1,
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
          creationSource: "PMC_CREATION_SOURCE_MANUAL",
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
        source: "manual",
        subType: 88,
        capabilities: expect.objectContaining({
          allowedOperations: ["apply", "remove"],
          deleteMode: "remove_effects",
        }),
      }),
    ])
  })

  it("keeps managed creation sources authoritative and filters runtime objects from the library", async () => {
    post.mockResolvedValue({
      data: {
        total: 5,
        definitions: [
          {
            type: 3,
            object_id: BUILTIN_CONTROL_OBJECT_IDS.generalConfig,
            object_version: "1.0.0",
            creation_source: 2,
            config: { name: "built-in-id-created-manually", sub_type: 1 },
          },
          ...([1, 2, 3, 4] as const).map((creationSource) => ({
            type: 3,
            object_id: `source-${creationSource}`,
            object_version: "1.0.0",
            creation_source: creationSource,
            config: { name: `Source ${creationSource}`, sub_type: creationSource },
          })),
        ],
      },
    })

    const result = await listControlObjectDefinitions()
    const sources = new Map(result.map((definition) => [definition.objectId, definition.source]))

    expect(sources.get(BUILTIN_CONTROL_OBJECT_IDS.generalConfig)).toBe("manual")
    expect(sources.get("source-1")).toBe("builtin")
    expect(sources.get("source-2")).toBe("manual")
    expect(sources.has("source-3")).toBe(false)
    expect(sources.has("source-4")).toBe(false)
  })

  it("normalizes creation-source enum names and falls back safely for missing or unknown values", async () => {
    post.mockResolvedValue({
      data: {
        total: 6,
        definitions: [
          ["builtin", "PMC_CREATION_SOURCE_BUILTIN"],
          ["manual", "PMC_CREATION_SOURCE_MANUAL"],
          ["remediation", "PMC_CREATION_SOURCE_REMEDIATION"],
          ["mitigation", "PMC_CREATION_SOURCE_MITIGATION"],
          ["unknown-enum", "PMC_CREATION_SOURCE_UNSPECIFIED"],
          ["missing", undefined],
        ].map(([objectId, creationSource]) => ({
          type: 3,
          object_id: objectId,
          object_version: "1.0.0",
          CreationSource: creationSource,
          config: { name: objectId, sub_type: 1 },
        })),
      },
    })

    const result = await listControlObjectDefinitions()
    const sources = new Map(result.map((definition) => [definition.objectId, definition.source]))

    expect(Object.fromEntries(sources)).toEqual({
      builtin: "builtin",
      manual: "manual",
      "unknown-enum": "unknown",
      missing: "unknown",
    })
  })

  it("finishes backend paging before filtering runtime objects", async () => {
    post
      .mockResolvedValueOnce({
        data: {
          total: 2,
          definitions: [{
            type: 2,
            object_id: "runtime-remediation-command",
            object_version: "1.0.0",
            creation_source: 3,
            command: { name: "Runtime remediation command", sub_type: 1 },
            capabilities: {},
          }],
        },
      })
      .mockResolvedValueOnce({
        data: {
          total: 2,
          definitions: [{
            type: 2,
            object_id: "manual-command",
            object_version: "1.0.0",
            creation_source: 2,
            command: { name: "Manual command", sub_type: 1 },
            capabilities: {},
          }],
        },
      })

    const result = await listControlObjectDefinitions()

    expect(post).toHaveBeenCalledTimes(2)
    expect(post.mock.calls.map((call) => call[1].page)).toEqual([1, 2])
    expect(result.map((item) => item.objectId)).toEqual(["manual-command"])
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

  it("loads one exact object version and formats a JSON context without mutating the response", async () => {
    const rawDefinition = {
      type: 3,
      object_id: "custom-config",
      object_version: "3.1.4",
      creation_source: 2,
      config: {
        name: "Custom config",
        sub_type: 88,
        context: "{\"enabled\":true,\"nested\":{\"count\":2}}",
      },
      capabilities: {
        allowed_agent_operations: [1],
        can_update: true,
        catalog_delete_mode: 1,
      },
      object_state: "active",
    }
    post.mockResolvedValue({ data: { definition: rawDefinition } })

    const result = await getControlObjectDefinition(configDefinition())

    expect(post).toHaveBeenCalledWith("getPMCObjectDefinition", {
      request_id: expect.stringMatching(/^\d+$/),
      object_type: 3,
      object_id: "custom-config",
      version: "3.1.4",
    })
    expect(result.definition.source).toBe("manual")
    expect(result.rawDefinition).toBe(rawDefinition)
    expect(rawDefinition.config.context).toBe("{\"enabled\":true,\"nested\":{\"count\":2}}")
    expect(JSON.parse(result.displayJson)).toMatchObject({
      config: { context: { enabled: true, nested: { count: 2 } } },
    })
  })

  it("preserves an opaque non-JSON context in the complete object JSON", async () => {
    post.mockResolvedValue({
      data: {
        Definition: {
          Type: "CONFIG_TYPE",
          ObjectID: "custom-config",
          ObjectVersion: "3.1.4",
          CreationSource: "PMC_CREATION_SOURCE_MITIGATION",
          Content: {
            Config: { Name: "Custom config", SubType: 88, Context: "plain-text-context" },
          },
        },
      },
    })

    const result = await getControlObjectDefinition(configDefinition())

    expect(result.definition.source).toBe("mitigation")
    expect(JSON.parse(result.displayJson)).toMatchObject({
      Content: { Config: { Context: "plain-text-context" } },
    })
  })

  it("rejects a missing or mismatched single-object response", async () => {
    post.mockResolvedValueOnce({ data: null })
    await expect(getControlObjectDefinition(configDefinition())).rejects.toThrow("PMC_OBJECT_DETAIL_INVALID")

    post.mockResolvedValueOnce({
      data: {
        definition: {
          type: 3,
          object_id: "another-config",
          object_version: "3.1.4",
          creation_source: 2,
          config: { name: "Another config", sub_type: 88 },
        },
      },
    })
    await expect(getControlObjectDefinition(configDefinition())).rejects.toThrow("PMC_OBJECT_DETAIL_MISMATCH")
  })
})
