import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadHostAdaptersModule() {
  const sourcePath = resolve(__dirname, "host-adapters.ts")
  const source = readFileSync(sourcePath, "utf8")
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  })

  const module = { exports: {} }
  const fn = new Function("exports", "module", outputText)
  fn(module.exports, module)
  return module.exports
}

test("adapts backend logic group timestamps and optional parent fields to UI shape", () => {
  const { adaptBackendLogicGroup } = loadHostAdaptersModule()

  assert.deepEqual(
    adaptBackendLogicGroup({
      id: "group-1",
      parent_id: "",
      tenant_id: "public",
      name: "Security",
      full_path: "Acme/Security",
      full_path_ids: ["root", "group-1"],
      company_name: "Acme",
      department_name: "Security",
      created_by: "admin",
      created_at: 1710000000,
      updated_at: 1710000300,
    }),
    {
      id: "group-1",
      parent_id: null,
      tenant_id: "public",
      name: "Security",
      full_path: "Acme/Security",
      full_path_ids: ["root", "group-1"],
      company_name: "Acme",
      department_name: "Security",
      description: null,
      created_by: "admin",
      created_at: "2024-03-09T16:00:00.000Z",
      updated_at: "2024-03-09T16:05:00.000Z",
    },
  )
})

test("adapts backend host detail to current host approval UI shape", () => {
  const { adaptBackendHost } = loadHostAdaptersModule()

  const host = adaptBackendHost({
    agent_id: "agent-1",
    hostname: "WEB-01",
    ip: ["10.0.0.1"],
    os_type: "linux",
    os_name: "Ubuntu",
    os_version: "22.04",
    product_id: "product-1",
    cpu_id: "cpu-1",
    harddisk_id: ["disk-1"],
    board_serial: "board-1",
    macs: ["00:11:22:33:44:55"],
    status: "inactive",
    heartbeat_time: 1710000000000,
    group: {
      id: "group-1",
      name: "Security",
      full_path: "Acme/Security",
      full_path_ids: ["group-1"],
      company_name: "Acme",
      created_by: "admin",
      created_at: 1710000000,
      updated_at: 1710000000,
    },
    owners: [
      {
        agent_id: "agent-1",
        user_id: "user-1",
        username: "Alice",
        phone: "13800138000",
        email: "alice@example.com",
        role: "auditor",
        assigned_at: 1710000000,
      },
    ],
  })

  assert.equal(host.host_id, "agent-1")
  assert.equal(host.status, "offline")
  assert.equal(host.heartbeat_time, "2024-03-09T16:00:00.000Z")
  assert.equal(host.group?.id, "group-1")
  assert.deepEqual(host.owner, {
    host_id: "agent-1",
    user_id: "user-1",
    owner_name: "Alice",
    phone: "13800138000",
    email: "alice@example.com",
    owner_role: "auditor",
    assigned_at: "2024-03-09T16:00:00.000Z",
    expired_at: null,
  })
})

test("builds ApproveHost request body with backend owner role values", () => {
  const { buildApproveHostRequest } = loadHostAdaptersModule()

  assert.deepEqual(
    buildApproveHostRequest("public", {
      host_id: "agent-1",
      hostname: "WEB-01",
      ip: ["10.0.0.1"],
      os_name: "Ubuntu",
      os_version: "22.04",
      product_id: "product-1",
      cpu_id: "cpu-1",
      harddisk_id: ["disk-1"],
      board_serial: "board-1",
      macs: ["00:11:22:33:44:55"],
      heartbeat_time: "2024-03-09T16:00:00.000Z",
      status: "online",
      group: {
        id: "group-1",
        name: "Security",
        full_path: "Acme/Security",
        full_path_ids: ["group-1"],
        company_name: "Acme",
        created_by: "admin",
        created_at: "2024-03-09T16:00:00.000Z",
        updated_at: "2024-03-09T16:00:00.000Z",
      },
      owner: {
        host_id: "agent-1",
        user_id: "user-1",
        owner_name: "Alice",
        phone: "13800138000",
        email: "alice@example.com",
        owner_role: "auditor",
        assigned_at: "2024-03-09T16:00:00.000Z",
      },
    }),
    {
      tenant_id: "public",
      agent_id: "agent-1",
      group_id: "group-1",
      owner: {
        agent_id: "agent-1",
        username: "Alice",
        phone: "13800138000",
        email: "alice@example.com",
        role: "auditor",
      },
    },
  )
})

test("finds only hosts whose group or owner changed", () => {
  const { findHostsNeedingApproval } = loadHostAdaptersModule()
  const baseHost = {
    host_id: "agent-1",
    hostname: "WEB-01",
    ip: ["10.0.0.1"],
    os_name: "Ubuntu",
    os_version: "22.04",
    product_id: "product-1",
    cpu_id: "cpu-1",
    harddisk_id: ["disk-1"],
    board_serial: "board-1",
    macs: ["00:11:22:33:44:55"],
    heartbeat_time: "2024-03-09T16:00:00.000Z",
    status: "online",
    group: {
      id: "group-1",
      name: "Security",
      full_path: "Acme/Security",
      full_path_ids: ["group-1"],
      company_name: "Acme",
      created_by: "admin",
      created_at: "2024-03-09T16:00:00.000Z",
      updated_at: "2024-03-09T16:00:00.000Z",
    },
    owner: {
      host_id: "agent-1",
      user_id: "user-1",
      owner_name: "Alice",
      phone: "13800138000",
      email: "alice@example.com",
      owner_role: "operator",
      assigned_at: "2024-03-09T16:00:00.000Z",
    },
  }
  const changedHost = {
    ...baseHost,
    host_id: "agent-2",
    group: {
      ...baseHost.group,
      id: "group-2",
      full_path: "Acme/Operations",
    },
  }

  assert.deepEqual(
    findHostsNeedingApproval(
      [baseHost, { ...baseHost, host_id: "agent-2" }],
      [baseHost, changedHost],
    ).map((host) => host.host_id),
    ["agent-2"],
  )
})
