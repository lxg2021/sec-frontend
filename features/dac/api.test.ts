import { afterEach, describe, expect, it, vi } from "vitest"

import {
  applyAccessControlPolicy,
  buildAccessControlDraftFromExistingPolicy,
  buildCreateAccessControlPolicyRequest,
  createAccessControlPolicy,
  listExistingAccessControlPolicies,
  validateAccessControlDraft,
} from "./api"
import type { AccessControlPolicyDraft } from "./access-control-types"
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
    draft.objectHashes = [{ algo: "sha256", value: "abc123" }]
    draft.rules = [{ id: "rule-1", action: "protect", effect: "prompt", audit: false }]

    const request = buildCreateAccessControlPolicyRequest(draft, "request-3")
    expect("policy_info" in request && request.policy_info.object).toEqual({
      type: "process",
      path: ["C:\\Windows\\System32\\target.exe"],
      hash: [{ algo: "sha256", value: "abc123" }],
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
            policy: {
              name: "Confidential files",
              sub_type: 90,
              version: "1.2.0",
              context: "{\"policy\":{}}",
            },
          },
          {
            type: 1,
            object_id: "baseline-policy-1",
            object_version: "1.0.0",
            object_state: "active",
            policy: { name: "Baseline", sub_type: 60, version: "1.0.0", context: "{}" },
          },
          {
            type: 1,
            object_id: "network-policy-1",
            object_version: "2.0.0",
            object_state: "active",
            policy: { name: "Outbound control", sub_type: 20, version: "2.0.0", context: "{}" },
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
})
