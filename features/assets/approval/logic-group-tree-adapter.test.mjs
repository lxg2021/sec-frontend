import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadLogicGroupTreeAdapterModule() {
  const sourcePath = resolve(__dirname, "logic-group-tree-adapter.ts")
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

test("returns an empty user tree when backend logic groups are empty", () => {
  const { backendLogicGroupsToUserTree } = loadLogicGroupTreeAdapterModule()

  assert.deepEqual(backendLogicGroupsToUserTree([]), [])
})

test("builds a user logic group tree from flat backend groups", () => {
  const { backendLogicGroupsToUserTree } = loadLogicGroupTreeAdapterModule()

  assert.deepEqual(
    backendLogicGroupsToUserTree([
      {
        id: "group-1",
        parent_id: "dept-1",
        name: "Endpoint",
        full_path: "Acme/Security/Endpoint",
        full_path_ids: ["company-1", "dept-1", "group-1"],
        company_name: "Acme",
        created_by: "admin",
        created_at: "2024-03-09T16:00:00.000Z",
        updated_at: "2024-03-09T16:00:00.000Z",
      },
      {
        id: "company-1",
        parent_id: null,
        name: "Acme",
        full_path: "Acme",
        full_path_ids: ["company-1"],
        company_name: "Acme",
        created_by: "admin",
        created_at: "2024-03-09T16:00:00.000Z",
        updated_at: "2024-03-09T16:00:00.000Z",
      },
      {
        id: "dept-1",
        parent_id: "company-1",
        name: "Security",
        full_path: "Acme/Security",
        full_path_ids: ["company-1", "dept-1"],
        company_name: "Acme",
        department_name: "Security",
        created_by: "admin",
        created_at: "2024-03-09T16:00:00.000Z",
        updated_at: "2024-03-09T16:00:00.000Z",
      },
    ]),
    [
      {
        id: "company-1",
        name: "Acme",
        path: "Acme",
        type: "company",
        children: [
          {
            id: "dept-1",
            name: "Security",
            path: "Acme/Security",
            type: "department",
            parentId: "company-1",
            children: [
              {
                id: "group-1",
                name: "Endpoint",
                path: "Acme/Security/Endpoint",
                type: "group",
                parentId: "dept-1",
              },
            ],
          },
        ],
      },
    ],
  )
})

test("infers missing parent_id from full_path when possible", () => {
  const { backendLogicGroupsToUserTree } = loadLogicGroupTreeAdapterModule()

  const tree = backendLogicGroupsToUserTree([
    {
      id: "company-1",
      name: "Acme",
      full_path: "Acme",
      full_path_ids: ["company-1"],
      company_name: "Acme",
      created_by: "admin",
      created_at: "2024-03-09T16:00:00.000Z",
      updated_at: "2024-03-09T16:00:00.000Z",
    },
    {
      id: "dept-1",
      name: "Security",
      full_path: "Acme/Security",
      full_path_ids: ["company-1", "dept-1"],
      company_name: "Acme",
      department_name: "Security",
      created_by: "admin",
      created_at: "2024-03-09T16:00:00.000Z",
      updated_at: "2024-03-09T16:00:00.000Z",
    },
  ])

  assert.equal(tree[0].children?.[0].parentId, "company-1")
})
