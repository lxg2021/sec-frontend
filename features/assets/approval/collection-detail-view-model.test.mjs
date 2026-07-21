import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadCollectionDetailViewModelModule() {
  const sourcePath = resolve(__dirname, "collection-detail-view-model.ts")
  const source = readFileSync(sourcePath, "utf8")
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  })

  const commonJsModule = { exports: {} }
  const fn = new Function("exports", "module", outputText)
  fn(commonJsModule.exports, commonJsModule)
  return commonJsModule.exports
}

test("builds owner rows from hosts with owner contact details", () => {
  const { buildCollectionOwnerRows } = loadCollectionDetailViewModelModule()

  assert.deepEqual(
    buildCollectionOwnerRows([
      {
        agent_id: "agent-001",
        hostname: "host-a",
        department_path: "company/dev",
        owner: {
          username: "Alice",
          role: "admin",
          phone: "13800138000",
          email: "alice@example.com",
        },
      },
      {
        agent_id: "agent-002",
        hostname: "host-b",
        group_id: "group-2",
        owner: {
          username: "Bob",
          role: "operator",
        },
      },
      {
        agent_id: "agent-003",
        hostname: "host-c",
      },
    ]),
    [
      {
        key: "agent-001:Alice",
        username: "Alice",
        role: "admin",
        phone: "13800138000",
        email: "alice@example.com",
        hostname: "host-a",
        agentId: "agent-001",
        department: "company/dev",
      },
      {
        key: "agent-002:Bob",
        username: "Bob",
        role: "operator",
        phone: "-",
        email: "-",
        hostname: "host-b",
        agentId: "agent-002",
        department: "group-2",
      },
    ],
  )
})

test("returns an empty owner row list when hosts have no owners", () => {
  const { buildCollectionOwnerRows } = loadCollectionDetailViewModelModule()

  assert.deepEqual(
    buildCollectionOwnerRows([
      { agent_id: "agent-001", hostname: "host-a" },
      { agent_id: "agent-002", hostname: "host-b", owner: null },
    ]),
    [],
  )
})
