import { beforeEach, describe, expect, it, vi } from "vitest"

const { post } = vi.hoisted(() => ({ post: vi.fn() }))

vi.mock("@/shared/lib/http/client", () => ({
  http: { post },
}))

import {
  BUILTIN_CONTROL_OBJECT_IDS,
  compareControlObjectVersions,
  createControlObjectCommand,
  deleteControlObjectDefinition,
  getControlObjectDefinition,
  listControlObjectOperations,
  listControlObjectDefinitions,
  operateControlObject,
  queryControlObjectAgentOverview,
  queryControlObjectAgents,
  suggestNextControlObjectVersion,
  updateControlObjectDefinition,
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
    stateVersion: 7,
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
            state_version: 9,
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
      stateVersion: 9,
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
    expect(result.editableContent).toEqual({
      name: "Custom config",
      subType: 88,
      version: "3.1.4",
      context: "{\"enabled\":true,\"nested\":{\"count\":2}}",
      url: "",
      md5: "",
    })
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

  it("creates an immutable manual Command and validates the authoritative response", async () => {
    const objectId = "5d4066df-1143-4b27-85f2-9f4ed9190ba2"
    const context = JSON.stringify({
      command: {
        head: { id: objectId, type: 2, subtype: 102 },
        body: { repair: { mode: "HailMary", source: "Intune" } },
      },
    })
    post.mockResolvedValue({
      data: {
        definition: {
          type: 2,
          object_id: objectId,
          object_version: "1.0.0",
          creation_source: 2,
          command: {
            name: "baseline one-click repair",
            category: 1,
            sub_type: 102,
            context,
          },
          capabilities: {
            allowed_agent_operations: [4],
            can_update: false,
            catalog_delete_mode: 2,
          },
          object_state: "active",
          state_version: 1,
        },
      },
    })

    const result = await createControlObjectCommand({
      objectId,
      name: " baseline one-click repair ",
      category: 1,
      subType: 102,
      context,
    })

    expect(post).toHaveBeenCalledWith("createPMCObjectDefinition", {
      request_id: expect.stringMatching(/^\d+$/),
      definition: {
        type: 2,
        object_id: objectId,
        command: {
          name: "baseline one-click repair",
          category: 1,
          sub_type: 102,
          context,
        },
      },
    })
    expect(result).toMatchObject({
      objectId,
      objectType: "command",
      internalName: "baseline one-click repair",
      subType: 102,
      version: "1.0.0",
      source: "manual",
    })
  })

  it("rejects an incomplete or mismatched Command create response", async () => {
    const input = {
      objectId: "5d4066df-1143-4b27-85f2-9f4ed9190ba2",
      name: "baseline one-click repair",
      category: 1,
      subType: 102,
      context: "{}",
    }
    post.mockResolvedValueOnce({ data: null })
    await expect(createControlObjectCommand(input)).rejects.toThrow("PMC_CREATE_RESPONSE_INVALID")

    post.mockResolvedValueOnce({
      data: {
        definition: {
          type: 2,
          object_id: "another-id",
          object_version: "1.0.0",
          creation_source: 2,
          command: {
            name: input.name,
            category: input.category,
            sub_type: input.subType,
            context: input.context,
          },
        },
      },
    })
    await expect(createControlObjectCommand(input)).rejects.toThrow("PMC_CREATE_RESPONSE_MISMATCH")
  })

  it("updates an editable Config using only caller-controlled definition fields", async () => {
    post.mockResolvedValue({
      data: {
        definition: {
          type: 3,
          object_id: "custom-config",
          object_version: "3.2.0",
          creation_source: 2,
          config: {
            name: "Updated config",
            sub_type: 88,
            version: "3.2.0",
            context: "{\"enabled\":false}",
            url: "https://example.test/config.json",
            md5: "0123456789abcdef0123456789abcdef",
          },
          capabilities: {
            allowed_agent_operations: [1],
            can_update: true,
            catalog_delete_mode: 1,
          },
          object_state: "active",
        },
      },
    })

    const result = await updateControlObjectDefinition(configDefinition(), {
      name: " Updated config ",
      version: " 3.2.0 ",
      context: "{\"enabled\":false}",
      url: " https://example.test/config.json ",
      md5: " 0123456789ABCDEF0123456789ABCDEF ",
    })

    expect(post).toHaveBeenCalledWith("updatePMCObjectDefinition", {
      request_id: expect.stringMatching(/^\d+$/),
      definition: {
        type: 3,
        object_id: "custom-config",
        config: {
          name: "Updated config",
          sub_type: 88,
          version: "3.2.0",
          context: "{\"enabled\":false}",
          url: "https://example.test/config.json",
          md5: "0123456789abcdef0123456789abcdef",
        },
      },
    })
    expect(result).toMatchObject({
      objectId: "custom-config",
      objectType: "config",
      internalName: "Updated config",
      subType: 88,
      version: "3.2.0",
      source: "manual",
    })
  })

  it("rejects unsafe generic updates before calling the backend", async () => {
    const command = configDefinition({
      objectType: "command",
      objectTypeValue: 2,
    })

    await expect(updateControlObjectDefinition(command, {
      name: "command",
      version: "3.2.0",
      context: "{}",
    })).rejects.toThrow("PMC_UPDATE_TYPE_UNSUPPORTED")
    await expect(updateControlObjectDefinition(configDefinition(), {
      name: "config",
      version: "3.0.0",
      context: "{}",
    })).rejects.toThrow("PMC_UPDATE_VERSION_INVALID")
    await expect(updateControlObjectDefinition(configDefinition(), {
      name: "config",
      version: "3.2.0",
      context: "{}",
      md5: "not-an-md5",
    })).rejects.toThrow("PMC_UPDATE_MD5_INVALID")
    expect(post).not.toHaveBeenCalled()
  })

  it("compares and suggests strict semantic object versions", () => {
    expect(compareControlObjectVersions("3.2.0", "3.1.4")).toBe(1)
    expect(compareControlObjectVersions("3.1.4", "3.1.4")).toBe(0)
    expect(compareControlObjectVersions("3.1", "3.1.4")).toBeNull()
    expect(suggestNextControlObjectVersion("3.1.4")).toBe("3.2.0")
    expect(suggestNextControlObjectVersion("invalid")).toBe("")
  })

  it("creates an allowed Agent operation with a normalized target set", async () => {
    post.mockResolvedValue({
      data: {
        operation: {
          operation_id: "pmcop-1",
          planning_status: "materializing",
          status: "created",
          total_count: 2,
          pending_count: 2,
        },
      },
    })

    const definition = configDefinition({
      capabilities: {
        profile: "config_replaceable_v1",
        contractVersion: 1,
        allowedOperations: ["apply", "remove"],
        canUpdate: true,
        deleteMode: "remove_effects",
      },
    })
    const result = await operateControlObject(definition, "apply", [
      " agent-2 ",
      "agent-1",
      "agent-2",
    ])

    expect(post).toHaveBeenCalledWith("operatePMCObject", {
      request_id: expect.stringMatching(/^\d+$/),
      object_type: 3,
      object_id: "custom-config",
      object_version: "3.1.4",
      operation: 1,
      agent_ids: ["agent-2", "agent-1"],
    })
    expect(result).toMatchObject({
      operationId: "pmcop-1",
      planningStatus: "materializing",
      status: "created",
      totalCount: 2,
      pendingCount: 2,
    })
  })

  it("rejects unsupported Agent operations and empty target sets before calling the backend", async () => {
    const definition = configDefinition()

    await expect(operateControlObject(definition, "execute", ["agent-1"]))
      .rejects.toThrow("PMC_OPERATION_NOT_ALLOWED")
    await expect(operateControlObject(definition, "apply", [" "]))
      .rejects.toThrow("PMC_AGENT_TARGETS_INVALID")
    expect(post).not.toHaveBeenCalled()
  })

  it("loads all object-associated Agents across versions for safe STOP/REMOVE targeting", async () => {
    post
      .mockResolvedValueOnce({
        data: {
          total: 2,
          page: 1,
          page_size: 100,
          agents: [{
            agent_id: "agent-old-version",
            object_type: 3,
            object_id: "custom-config",
            object_version: "1.0.0",
            current_effect: {
              object_version: "1.0.0",
              current_state: "started",
              apply_state: "success",
            },
          }],
        },
      })
      .mockResolvedValueOnce({
        data: {
          total: 2,
          page: 2,
          page_size: 100,
          agents: [{
            agentId: "agent-current-version",
            objectType: "CONFIG_TYPE",
            objectId: "custom-config",
            objectVersion: "3.1.4",
            currentEffect: {
              objectVersion: "3.1.4",
              currentState: "stopped",
              applyState: "success",
            },
            activeChange: {
              operationId: "operation-in-flight",
            },
          }],
        },
      })

    const result = await queryControlObjectAgents(configDefinition())

    expect(post).toHaveBeenCalledTimes(2)
    expect(post.mock.calls.map((call) => call[1])).toEqual([
      {
        request_id: expect.stringMatching(/^\d+$/),
        object_type: 3,
        object_id: "custom-config",
        page: 1,
        page_size: 100,
      },
      {
        request_id: expect.stringMatching(/^\d+$/),
        object_type: 3,
        object_id: "custom-config",
        page: 2,
        page_size: 100,
      },
    ])
    expect(result).toEqual([
      {
        agentId: "agent-old-version",
        objectVersion: "1.0.0",
        currentEffect: {
          objectVersion: "1.0.0",
          currentState: "started",
          applyState: "success",
        },
        hasActiveChange: false,
      },
      {
        agentId: "agent-current-version",
        objectVersion: "3.1.4",
        currentEffect: {
          objectVersion: "3.1.4",
          currentState: "stopped",
          applyState: "success",
        },
        hasActiveChange: true,
      },
    ])
  })

  it("accepts an empty associated-Agent result and rejects mismatched object identities", async () => {
    post.mockResolvedValueOnce({ data: { total: 0, agents: null } })
    await expect(queryControlObjectAgents(configDefinition())).resolves.toEqual([])

    post.mockResolvedValueOnce({
      data: {
        total: 1,
        agents: [{
          agent_id: "agent-1",
          object_type: 3,
          object_id: "another-config",
        }],
      },
    })
    await expect(queryControlObjectAgents(configDefinition()))
      .rejects.toThrow("PMC_OBJECT_AGENT_INVALID")
  })

  it("loads a paged Policy/Config overview with authoritative effects, active changes, and statistics", async () => {
    post.mockResolvedValue({
      data: {
        total: 1,
        page: 2,
        page_size: 20,
        statistics: {
          total_agents: 1,
          effective_count: 1,
          started_count: 1,
          pending_count: 1,
          uncertain_count: 0,
        },
        agents: [{
          agent_id: "agent-1",
          object_type: 3,
          object_id: "custom-config",
          object_name: "Custom config",
          object_sub_type: 88,
          object_version: "3.1.4",
          status_model: "current_effect",
          current_effect: {
            object_version: "3.1.0",
            current_state: "started",
            apply_state: "success",
            evidence_dispatch_id: "dispatch-old",
            evidence_result_version: 4,
            state_version: 9,
            last_report_at_unix_ms: 1_750_000_000_000,
          },
          active_change: {
            operation_id: "pmcop-new",
            dispatch_id: "dispatch-new",
            target_object_version: "3.1.4",
            operation: 1,
            publish_status: "published",
            execution_status: 2,
            failure_certainty: 0,
            result_version: 2,
            last_report_at_unix_ms: 1_750_000_001_000,
            task_visibility: "fresh",
          },
          execution_count: 5,
        }],
      },
    })

    const result = await queryControlObjectAgentOverview(configDefinition(), 2, 20)

    expect(post).toHaveBeenCalledWith("queryPMCAgentsByObjectID", {
      request_id: expect.stringMatching(/^\d+$/),
      object_type: 3,
      object_id: "custom-config",
      page: 2,
      page_size: 20,
    })
    expect(result).toMatchObject({
      total: 1,
      page: 2,
      pageSize: 20,
      statistics: {
        totalAgents: 1,
        effectiveCount: 1,
        startedCount: 1,
        pendingCount: 1,
      },
      items: [{
        agentId: "agent-1",
        objectTypeValue: 3,
        objectId: "custom-config",
        objectName: "Custom config",
        objectSubType: 88,
        objectVersion: "3.1.4",
        statusModel: "current_effect",
        currentEffect: {
          objectVersion: "3.1.0",
          currentState: "started",
          applyState: "success",
          evidenceDispatchId: "dispatch-old",
          stateVersion: 9,
        },
        activeChange: {
          operationId: "pmcop-new",
          targetObjectVersion: "3.1.4",
          operation: "apply",
          executionStatus: "running",
          taskVisibility: "fresh",
        },
        latestExecution: null,
        executionCount: 5,
      }],
    })
  })

  it("loads the latest execution model for Command Agents", async () => {
    const definition = configDefinition({
      objectId: "command-1",
      objectType: "command",
      objectTypeValue: 2,
      internalName: "command",
      displayName: "Command",
      subType: 7,
      version: "1.0.0",
      capabilities: {
        profile: "command_v1",
        contractVersion: 1,
        allowedOperations: ["execute"],
        canUpdate: false,
        deleteMode: "metadata_only",
      },
    })
    post.mockResolvedValue({
      data: {
        total: 1,
        statistics: { total_agents: 1, failed_count: 1, uncertain_count: 1 },
        agents: [{
          agent_id: "agent-command",
          object_type: "COMMAND_TYPE",
          object_id: "command-1",
          object_version: "1.0.0",
          status_model: "execution_only",
          latest_execution: {
            operation_id: "pmcop-command",
            dispatch_id: "dispatch-command",
            agent_id: "agent-command",
            object_type: 2,
            object_id: "command-1",
            object_version: "1.0.0",
            operation: 4,
            publish_status: "published",
            execution_status: 4,
            failure_certainty: 2,
            error_code: "AGENT_TIMEOUT",
            error_message: "report deadline exceeded",
            last_report_at_unix_ms: 1_750_000_002_000,
            task_visibility: "unknown",
          },
          execution_count: 3,
        }],
      },
    })

    const result = await queryControlObjectAgentOverview(definition)

    expect(result.items[0]).toMatchObject({
      statusModel: "execution_only",
      currentEffect: null,
      activeChange: null,
      executionCount: 3,
      latestExecution: {
        operationId: "pmcop-command",
        agentId: "agent-command",
        operation: "execute",
        executionStatus: "failed",
        failureCertainty: "uncertain",
        errorCode: "AGENT_TIMEOUT",
        taskVisibility: "unknown",
      },
    })
    expect(result.statistics).toMatchObject({ totalAgents: 1, failedCount: 1, uncertainCount: 1 })
  })

  it("lists only the selected object's operation history with backend pagination", async () => {
    post.mockResolvedValue({
      data: {
        total: 11,
        page: 2,
        page_size: 10,
        operations: [{
          operation_id: "pmcop-history",
          source_type: "manual",
          source_ref_id: "manual:user-1:request-1",
          object_type: 3,
          object_id: "custom-config",
          object_version: "3.1.4",
          operation: 1,
          planning_status: "complete",
          status: "completed",
          outcome: "partial",
          revision: 4,
          total_count: 5,
          materialized_count: 5,
          success_count: 3,
          failed_count: 1,
          uncertain_count: 1,
          created_at_unix_ms: 1_750_000_003_000,
          completed_at_unix_ms: 1_750_000_004_000,
        }],
      },
    })

    const result = await listControlObjectOperations(configDefinition(), 2, 10)

    expect(post).toHaveBeenCalledWith("listPMCOperations", {
      request_id: expect.stringMatching(/^\d+$/),
      object_type: 3,
      object_id: "custom-config",
      page: 2,
      page_size: 10,
    })
    expect(result).toMatchObject({
      total: 11,
      page: 2,
      pageSize: 10,
      items: [{
        operationId: "pmcop-history",
        objectTypeValue: 3,
        objectId: "custom-config",
        operation: "apply",
        status: "completed",
        outcome: "partial",
        totalCount: 5,
        materializedCount: 5,
        successCount: 3,
        failedCount: 1,
        uncertainCount: 1,
      }],
    })
  })

  it("accepts nil empty overview/history lists and rejects mismatched operation identities", async () => {
    post.mockResolvedValueOnce({ data: { total: 0, agents: null, statistics: null } })
    await expect(queryControlObjectAgentOverview(configDefinition())).resolves.toMatchObject({
      items: [],
      total: 0,
      statistics: { totalAgents: 0 },
    })

    post.mockResolvedValueOnce({ data: { total: 0, operations: null } })
    await expect(listControlObjectOperations(configDefinition())).resolves.toMatchObject({ items: [], total: 0 })

    post.mockResolvedValueOnce({
      data: {
        total: 1,
        operations: [{
          operation_id: "pmcop-wrong-object",
          object_type: 1,
          object_id: "another-object",
        }],
      },
    })
    await expect(listControlObjectOperations(configDefinition()))
      .rejects.toThrow("PMC_OBJECT_OPERATION_INVALID")
  })

  it("deletes a Catalog object with its current state version", async () => {
    post.mockResolvedValue({
      data: {
        object: {
          object_type: 3,
          object_id: "custom-config",
          object_state: "deleting",
          state_version: 8,
        },
        operation_id: "pmcop-delete-1",
      },
    })

    const definition = configDefinition({
      stateVersion: 7,
      capabilities: {
        profile: "config_replaceable_v1",
        contractVersion: 1,
        allowedOperations: ["apply", "remove"],
        canUpdate: true,
        deleteMode: "remove_effects",
      },
    })
    const result = await deleteControlObjectDefinition(definition)

    expect(post).toHaveBeenCalledWith("deletePMCObjectDefinition", {
      request_id: expect.stringMatching(/^\d+$/),
      object_type: 3,
      object_id: "custom-config",
      expected_state_version: 7,
    })
    expect(result).toEqual({
      objectId: "custom-config",
      state: "deleting",
      stateVersion: 8,
      operationId: "pmcop-delete-1",
    })
  })

  it("rejects forbidden deletion and missing state versions before calling the backend", async () => {
    await expect(deleteControlObjectDefinition(configDefinition()))
      .rejects.toThrow("PMC_DELETE_NOT_ALLOWED")
    await expect(deleteControlObjectDefinition(configDefinition({
      stateVersion: 0,
      capabilities: {
        profile: "config_replaceable_v1",
        contractVersion: 1,
        allowedOperations: ["apply", "remove"],
        canUpdate: true,
        deleteMode: "remove_effects",
      },
    }))).rejects.toThrow("PMC_STATE_VERSION_INVALID")
    expect(post).not.toHaveBeenCalled()
  })
})
