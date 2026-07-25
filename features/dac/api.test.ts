import { afterEach, describe, expect, it, vi } from "vitest"

import {
  applyAccessControlPolicy,
  buildAccessControlDraftFromExistingPolicy,
  buildEditableAccessControlDraft,
  buildCreateAccessControlPolicyRequest,
  buildUpdatedAccessControlPolicyContext,
  createAccessControlPolicy,
  getAccessControlContentFingerprint,
  getAccessPolicyTypeBySubType,
  listExistingAccessControlPolicies,
  validateAccessControlDraft,
} from "./api"
import type {
  AccessControlPolicyDraft,
  AccessPolicyType,
  ExistingAccessControlPolicy,
} from "./access-control-types"
import { http } from "@/shared/lib/http/client"

afterEach(() => {
  vi.restoreAllMocks()
})

function baseDraft(type: AccessControlPolicyDraft["type"]): AccessControlPolicyDraft {
  return {
    type,
    name: "Access policy",
    version: "1.0.0",
    priority: 150,
    subjects: [
      {
        id: "subject-1",
        type: "process",
        paths: [" C:\\Program Files\\Office\\*.exe ", "C:\\Program Files\\Office\\*.exe"],
        hashes: [],
        accounts: [],
      },
    ],
    exceptions: [
      {
        id: "except-1",
        type: "windowsuser",
        paths: [],
        hashes: [],
        accounts: [{ user_name: "Administrator", sid: "S-1-5-21-1000" }],
      },
    ],
    objectPaths: [" C:\\Confidential\\*.docx "],
    objectHashes: [],
    rules: [{ id: "rule-1", action: "write", effect: "block", audit: true }],
    network: {
      direction: "out",
      action: "block",
      profile: "any",
      protocol: "tcp",
      localPort: "any",
      remotePort: "80,443",
      localAddress: "any",
      remoteAddress: "192.168.0.0/16",
      programPath: "C:\\Program Files\\App\\app.exe",
      programMd5: "0123456789abcdef0123456789abcdef",
    },
  }
}

const ACCESS_POLICY_SUB_TYPES: Record<AccessPolicyType, number> = {
  network: 20,
  file: 90,
  process: 91,
  registry: 92,
}

function editableDraft(type: AccessPolicyType) {
  const draft = baseDraft(type)
  if (type === "registry") {
    draft.objectPaths = ["HKEY_LOCAL_MACHINE\\Software\\WatchPoint"]
    draft.rules = [{ id: "rule-registry", action: "query", effect: "allow", audit: true }]
  } else if (type === "process") {
    draft.objectPaths = ["C:\\Windows\\System32\\target.exe"]
    draft.objectHashes = [{ algo: "sha256", value: "a".repeat(64) }]
    draft.rules = [{ id: "rule-process", action: "protect", effect: "prompt", audit: false }]
  }
  return draft
}

function existingPolicy(draft: AccessControlPolicyDraft): ExistingAccessControlPolicy {
  const request = buildCreateAccessControlPolicyRequest(draft, "request-existing")
  const subType = ACCESS_POLICY_SUB_TYPES[draft.type]
  const objectId = `${draft.type}-policy-id`
  const body = "network_info" in request ? request.network_info : request.policy_info
  return {
    objectId,
    objectType: 1,
    name: draft.name,
    version: draft.version,
    policyType: draft.type,
    subType,
    objectState: "active",
    context: JSON.stringify({
      schema_marker: "preserve-me",
      policy: {
        head: {
          id: objectId,
          type: 1,
          subtype: subType,
          module: draft.type === "network" ? "NetworkFirewall" : "DacAccessModule",
          name: draft.name,
          version: draft.version,
          future_head_field: true,
        },
        body: { ...body, future_body_field: "preserve-me" },
      },
    }),
  }
}

describe("access control request mapping", () => {
  it("maps a file policy to CreateFileAccessPolicyRequest", () => {
    const request = buildCreateAccessControlPolicyRequest(baseDraft("file"), "request-1")

    expect(request).toEqual({
      request_id: "request-1",
      name: "Access policy",
      version: "1.0.0",
      policy_info: {
        except: [
          {
            type: "windowsuser",
            accounts: [{ user_name: "Administrator", sid: "S-1-5-21-1000" }],
          },
        ],
        subject: [
          {
            type: "process",
            path: ["C:\\Program Files\\Office\\*.exe"],
            hash: [],
          },
        ],
        object: { type: "file", path: ["C:\\Confidential\\*.docx"] },
        rules: [{ action: "write", effect: "block", audit: true }],
        priority: 150,
      },
    })
  })

  it("maps registry actions and object type without legacy action codes", () => {
    const draft = baseDraft("registry")
    draft.objectPaths = ["HKEY_LOCAL_MACHINE\\Software\\WatchPoint"]
    draft.rules = [{ id: "rule-1", action: "query", effect: "allow", audit: true }]

    const request = buildCreateAccessControlPolicyRequest(draft, "request-2")
    expect("policy_info" in request && request.policy_info.object).toEqual({
      type: "registry",
      path: ["HKEY_LOCAL_MACHINE\\Software\\WatchPoint"],
    })
    expect("policy_info" in request && request.policy_info.rules[0].action).toBe("query")
  })

  it("maps process object hashes and the protect action", () => {
    const draft = baseDraft("process")
    draft.objectPaths = ["C:\\Windows\\System32\\target.exe"]
    draft.objectHashes = [{ algo: "sha256", value: "a".repeat(64) }]
    draft.rules = [{ id: "rule-1", action: "protect", effect: "prompt", audit: false }]

    const request = buildCreateAccessControlPolicyRequest(draft, "request-3")
    expect("policy_info" in request && request.policy_info.object).toEqual({
      type: "process",
      path: ["C:\\Windows\\System32\\target.exe"],
      hash: [{ algo: "sha256", value: "a".repeat(64) }],
    })
    expect("policy_info" in request && request.policy_info.rules).toEqual([
      { action: "protect", effect: "prompt", audit: false },
    ])
  })

  it("maps a network policy to network_info", () => {
    const request = buildCreateAccessControlPolicyRequest(baseDraft("network"), "request-4")

    expect(request).toEqual({
      request_id: "request-4",
      name: "Access policy",
      version: "1.0.0",
      network_info: {
        rule: { direction: "out", action: "block", profile: "any" },
        protocol: { type: "tcp", localport: "any", remoteport: "80,443" },
        address: { local: "any", remote: "192.168.0.0/16" },
        program: {
          path: "C:\\Program Files\\App\\app.exe",
          md5: "0123456789abcdef0123456789abcdef",
        },
        priority: 150,
      },
    })
  })

  it("rejects duplicate actions and invalid network ports before calling the API", () => {
    const fileDraft = baseDraft("file")
    fileDraft.rules.push({ id: "rule-2", action: "write", effect: "allow", audit: false })
    expect(validateAccessControlDraft(fileDraft)).toContain("RULE_ACTION_DUPLICATED")

    const networkDraft = baseDraft("network")
    networkDraft.network.remotePort = "70000"
    expect(validateAccessControlDraft(networkDraft)).toContain("NETWORK_PORT_INVALID")

    networkDraft.network.remotePort = "0"
    expect(validateAccessControlDraft(networkDraft)).toContain("NETWORK_PORT_INVALID")
  })

  it("rejects malformed paths, addresses, hashes, SIDs, and versions before calling the API", () => {
    const fileDraft = baseDraft("file")
    fileDraft.version = "1.0"
    fileDraft.objectPaths = ["relative\\file.txt"]
    fileDraft.subjects[0].hashes = [{ algo: "sha256", value: "abc123" }]
    expect(validateAccessControlDraft(fileDraft)).toEqual(expect.arrayContaining([
      "POLICY_VERSION_INVALID",
      "SUBJECT_INVALID",
      "OBJECT_PATH_INVALID",
    ]))

    const registryDraft = baseDraft("registry")
    registryDraft.objectPaths = ["Software\\WatchPoint"]
    registryDraft.exceptions[0].accounts = [{ sid: "Administrator" }]
    expect(validateAccessControlDraft(registryDraft)).toEqual(expect.arrayContaining([
      "EXCEPTION_INVALID",
      "OBJECT_PATH_INVALID",
    ]))

    const processDraft = baseDraft("process")
    processDraft.objectHashes = [{ algo: "md5", value: "not-a-hash" }]
    expect(validateAccessControlDraft(processDraft)).toContain("OBJECT_HASH_INVALID")

    const networkDraft = baseDraft("network")
    networkDraft.network.remoteAddress = "999.1.1.1/33"
    networkDraft.network.programPath = "app.exe"
    expect(validateAccessControlDraft(networkDraft)).toEqual(expect.arrayContaining([
      "NETWORK_ADDRESS_INVALID",
      "NETWORK_PROGRAM_INVALID",
    ]))
  })

  it("uses the exact v1 endpoint key and normalizes the created Policy Object", async () => {
    const post = vi.spyOn(http, "post").mockResolvedValue({
      code: 0,
      message: "success",
      requestId: "request-1",
      data: {
        object_id: "policy-object-1",
        type: 1,
        name: "Access policy",
        version: "1.0.0",
      },
      raw: null,
    })

    const policy = await createAccessControlPolicy(baseDraft("file"))

    expect(post).toHaveBeenCalledTimes(1)
    expect(post.mock.calls[0][0]).toBe("createFileAccessPolicy")
    expect(post.mock.calls[0][1]).toMatchObject({
      request_id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      name: "Access policy",
      version: "1.0.0",
    })
    expect(policy).toEqual({
      objectId: "policy-object-1",
      objectType: 1,
      name: "Access policy",
      version: "1.0.0",
    })
  })

  it("deduplicates Agent IDs and creates an APPLY operation", async () => {
    const post = vi.spyOn(http, "post").mockResolvedValue({
      code: 0,
      message: "success",
      requestId: "request-2",
      data: {
        operation: {
          operation_id: "operation-1",
          planning_status: "planned",
          status: "pending",
          total_count: 2,
          pending_count: 2,
        },
      },
      raw: null,
    })

    const operation = await applyAccessControlPolicy(
      { objectId: "policy-object-1", objectType: 1, name: "Access policy", version: "1.0.0" },
      ["agent-1", " agent-1 ", "agent-2"],
    )

    expect(post).toHaveBeenCalledWith("operatePMCObject", {
      request_id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      object_type: 1,
      object_id: "policy-object-1",
      object_version: "1.0.0",
      operation: 1,
      agent_ids: ["agent-1", "agent-2"],
    })
    expect(operation).toMatchObject({
      operationId: "operation-1",
      planningStatus: "planned",
      status: "pending",
      totalCount: 2,
      pendingCount: 2,
    })
  })

  it("lists only active access-control Policy definitions", async () => {
    const post = vi.spyOn(http, "post").mockResolvedValue({
      code: 0,
      message: "success",
      requestId: "request-3",
      data: {
        definitions: [
          {
            type: 1,
            object_id: "file-policy-1",
            object_version: "1.2.0",
            object_state: "active",
            Content: {
              policy: {
                name: "Confidential files",
                sub_type: 90,
                version: "1.2.0",
                context: "{\"policy\":{}}",
              },
            },
          },
          {
            type: 1,
            object_id: "baseline-policy-1",
            object_version: "1.0.0",
            object_state: "active",
            Content: {
              policy: { name: "Baseline", sub_type: 60, version: "1.0.0", context: "{}" },
            },
          },
          {
            type: 1,
            object_id: "network-policy-1",
            object_version: "2.0.0",
            object_state: "active",
            Content: {
              policy: { name: "Outbound control", sub_type: 20, version: "2.0.0", context: "{}" },
            },
          },
        ],
        total: 3,
        page: 1,
        page_size: 100,
      },
      raw: null,
    })

    const policies = await listExistingAccessControlPolicies()

    expect(post).toHaveBeenCalledWith("listPMCObjectDefinitions", {
      request_id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      object_type: 1,
      lifecycle_state: "active",
      page: 1,
      page_size: 100,
    })
    expect(policies).toEqual([
      {
        objectId: "file-policy-1",
        objectType: 1,
        name: "Confidential files",
        version: "1.2.0",
        policyType: "file",
        subType: 90,
        context: "{\"policy\":{}}",
        objectState: "active",
      },
      {
        objectId: "network-policy-1",
        objectType: 1,
        name: "Outbound control",
        version: "2.0.0",
        policyType: "network",
        subType: 20,
        context: "{}",
        objectState: "active",
      },
    ])
  })

  it("restores an existing file policy context for read-only display", () => {
    const draft = buildAccessControlDraftFromExistingPolicy({
      objectId: "file-policy-1",
      objectType: 1,
      name: "Confidential files",
      version: "1.2.0",
      policyType: "file",
      subType: 90,
      objectState: "active",
      context: JSON.stringify({
        policy: {
          body: {
            subject: [{ type: "process", path: ["C:\\Office\\*.exe"], hash: [], accounts: [] }],
            except: [],
            object: { type: "file", path: ["C:\\Confidential\\*.docx"] },
            rules: [{ action: "write", effect: "block", audit: true }],
            priority: 180,
          },
        },
      }),
    })

    expect(draft).toMatchObject({
      type: "file",
      name: "Confidential files",
      version: "1.2.0",
      priority: 180,
      subjects: [{ type: "process", paths: ["C:\\Office\\*.exe"] }],
      objectPaths: ["C:\\Confidential\\*.docx"],
      rules: [{ action: "write", effect: "block", audit: true }],
    })
  })

  it.each(["file", "registry", "process", "network"] as const)(
    "strictly restores and updates a %s policy without changing its identity contract",
    (type) => {
      const currentDraft = editableDraft(type)
      const policy = existingPolicy(currentDraft)
      const restored = buildEditableAccessControlDraft(policy)

      expect(getAccessControlContentFingerprint(restored)).toBe(
        getAccessControlContentFingerprint(currentDraft),
      )

      const updatedDraft = {
        ...restored,
        name: `${currentDraft.name} updated`,
        version: "1.1.0",
        priority: 200,
      }
      const updatedContext = JSON.parse(
        buildUpdatedAccessControlPolicyContext(policy, updatedDraft),
      )

      expect(updatedContext).toMatchObject({
        schema_marker: "preserve-me",
        policy: {
          head: {
            id: policy.objectId,
            type: 1,
            subtype: policy.subType,
            module: type === "network" ? "NetworkFirewall" : "DacAccessModule",
            name: "Access policy updated",
            version: "1.1.0",
            future_head_field: true,
          },
          body: {
            priority: 200,
            future_body_field: "preserve-me",
          },
        },
      })
      expect(getAccessPolicyTypeBySubType(policy.subType)).toBe(type)
    },
  )

  it("blocks structured editing when the embedded identity does not match the Catalog object", () => {
    const policy = existingPolicy(editableDraft("file"))
    const context = JSON.parse(policy.context)
    context.policy.head.id = "another-object"

    expect(() => buildEditableAccessControlDraft({
      ...policy,
      context: JSON.stringify(context),
    })).toThrow("ACCESS_POLICY_CONTEXT_IDENTITY_MISMATCH")
  })

  it("ignores version-only changes when deciding whether policy content changed", () => {
    const draft = editableDraft("network")
    expect(getAccessControlContentFingerprint({ ...draft, version: "9.9.9" })).toBe(
      getAccessControlContentFingerprint(draft),
    )
    expect(getAccessControlContentFingerprint({ ...draft, name: "Renamed" })).not.toBe(
      getAccessControlContentFingerprint(draft),
    )
  })

  it("does not classify scan or remediation effect subtypes as standard access-control policies", () => {
    expect(getAccessPolicyTypeBySubType(60)).toBeNull()
    expect(getAccessPolicyTypeBySubType(1013)).toBeNull()
  })
})
