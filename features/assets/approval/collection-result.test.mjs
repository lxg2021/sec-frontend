import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadCollectionResultModule() {
  const sourcePath = resolve(__dirname, "collection-result.ts")
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

test("recognizes pending and failed collection submissions as approvable", () => {
  const { canApproveCollectionSubmission } = loadCollectionResultModule()

  assert.equal(canApproveCollectionSubmission(1), true)
  assert.equal(canApproveCollectionSubmission("COLLECTION_SUBMISSION_PENDING"), true)
  assert.equal(canApproveCollectionSubmission(5), true)
  assert.equal(canApproveCollectionSubmission("COLLECTION_SUBMISSION_FAILED"), true)
  assert.equal(canApproveCollectionSubmission(2), false)
  assert.equal(canApproveCollectionSubmission(3), false)
  assert.equal(canApproveCollectionSubmission("COLLECTION_SUBMISSION_REJECTED"), false)
})

test("recognizes only pending and failed collection submissions as rejectable", () => {
  const { canRejectCollectionSubmission } = loadCollectionResultModule()

  assert.equal(canRejectCollectionSubmission(1), true)
  assert.equal(canRejectCollectionSubmission("COLLECTION_SUBMISSION_PENDING"), true)
  assert.equal(canRejectCollectionSubmission(5), true)
  assert.equal(canRejectCollectionSubmission("COLLECTION_SUBMISSION_FAILED"), true)
  assert.equal(canRejectCollectionSubmission(2), false)
  assert.equal(canRejectCollectionSubmission(3), false)
  assert.equal(canRejectCollectionSubmission(4), false)
  assert.equal(canRejectCollectionSubmission("COLLECTION_SUBMISSION_APPROVING"), false)
  assert.equal(canRejectCollectionSubmission("COLLECTION_SUBMISSION_APPROVED"), false)
  assert.equal(canRejectCollectionSubmission("COLLECTION_SUBMISSION_REJECTED"), false)
})

test("summarizes approval result counts and failed host rows", () => {
  const { summarizeApprovalResult } = loadCollectionResultModule()

  const summary = summarizeApprovalResult({
    submission_id: "sub-001",
    status: 5,
    host_total: 3,
    host_success_count: 2,
    host_failure_count: 1,
    host_results: [
      { agent_id: "agent-ok-1", success: true, msg: "ok" },
      { agent_id: "agent-ok-2", success: true, msg: "ok" },
      { agent_id: "agent-failed", success: false, msg: "duplicate host" },
    ],
  })

  assert.equal(summary.submissionId, "sub-001")
  assert.equal(summary.total, 3)
  assert.equal(summary.successCount, 2)
  assert.equal(summary.failureCount, 1)
  assert.deepEqual(summary.failedResults, [
    { agent_id: "agent-failed", success: false, msg: "duplicate host" },
  ])
})

test("parses stored import result JSON and keeps invalid text as raw output", () => {
  const { parseImportResultJson } = loadCollectionResultModule()

  assert.deepEqual(parseImportResultJson('{"host_total":2,"host_failure_count":0}'), {
    parsed: { host_total: 2, host_failure_count: 0 },
    formatted: "{\n  \"host_total\": 2,\n  \"host_failure_count\": 0\n}",
  })

  assert.deepEqual(parseImportResultJson("database unavailable"), {
    parsed: null,
    formatted: "database unavailable",
  })

  assert.deepEqual(parseImportResultJson(undefined), {
    parsed: null,
    formatted: "-",
  })
})
