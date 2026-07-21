import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadCollectionAdaptersModule() {
  const sourcePath = resolve(__dirname, "collection-adapters.ts")
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

test("adapts collection submission list data from backend response", () => {
  const { adaptCollectionSubmissionListData } = loadCollectionAdaptersModule()

  assert.deepEqual(
    adaptCollectionSubmissionListData(
      {
        items: [
          {
            submission_id: "sub-1",
            tenant_id: "public",
            status: 1,
            host_count: 2,
            logic_group_count: 3,
            submitter: { name: "Alice" },
            created_at: 1710000000,
            updated_at: 1710000100,
          },
        ],
        page: "2",
        page_size: "10",
        total: "21",
      },
      { page: 1, pageSize: 20 },
    ),
    {
      items: [
        {
          submission_id: "sub-1",
          tenant_id: "public",
          status: 1,
          host_count: 2,
          logic_group_count: 3,
          submitter: { name: "Alice" },
          source_ip: undefined,
          created_at: 1710000000,
          updated_at: 1710000100,
          reviewed_by: undefined,
          reviewed_at: undefined,
        },
      ],
      page: 2,
      page_size: 10,
      total: 21,
    },
  )
})

test("adapts collection submission detail with safe array defaults", () => {
  const { adaptCollectionSubmissionDetail } = loadCollectionAdaptersModule()

  assert.deepEqual(
    adaptCollectionSubmissionDetail({
      submission_id: "sub-1",
      tenant_id: "public",
      status: "COLLECTION_SUBMISSION_FAILED",
      host_count: 0,
      logic_group_count: 0,
      created_at: 1710000000,
      updated_at: 1710000100,
      error_msg: "import failed",
    }),
    {
      submission_id: "sub-1",
      tenant_id: "public",
      status: "COLLECTION_SUBMISSION_FAILED",
      host_count: 0,
      logic_group_count: 0,
      submitter: undefined,
      source_ip: undefined,
      created_at: 1710000000,
      updated_at: 1710000100,
      reviewed_by: undefined,
      reviewed_at: undefined,
      logic_groups: [],
      hosts: [],
      review_note: undefined,
      import_result_json: undefined,
      error_msg: "import failed",
    },
  )
})

