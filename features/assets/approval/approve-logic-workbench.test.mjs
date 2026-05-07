import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, "../../..")

test("approve logic workbench uses a light split panel and supports double-click rename", () => {
  const pageSource = readFileSync(resolve(repoRoot, "app/frame/computers/approve/page.tsx"), "utf8")
  const treeSource = readFileSync(resolve(repoRoot, "features/collection/components/tree-logic-group.tsx"), "utf8")
  const uploaderSource = readFileSync(resolve(repoRoot, "features/collection/components/logic-group-uploader.tsx"), "utf8")

  assert.match(pageSource, /data-approve-section="logic"/)
  assert.doesNotMatch(pageSource, /className="dark space-y-4"/)
  assert.doesNotMatch(pageSource, /bg-slate-950/)
  assert.match(pageSource, /border-slate-200/)
  assert.match(pageSource, /bg-white/)
  assert.match(pageSource, /grid-cols-\[minmax\(0,1fr\)_420px\]/)
  assert.match(pageSource, /min-h-\[480px\]/)
  assert.match(pageSource, /showFrame=\{false\}/)
  assert.match(pageSource, /保存结构/)
  assert.match(pageSource, /h-10 w-28 justify-center bg-slate-900 text-white hover:bg-slate-800/)
  assert.match(pageSource, /导入配置/)
  assert.match(pageSource, /flex h-full flex-col rounded-lg border border-slate-200 bg-white shadow-sm/)
  assert.match(pageSource, /text-base font-semibold text-slate-900">导入配置/)
  assert.match(pageSource, /text-sm text-slate-500">上传组织结构文件/)
  assert.match(pageSource, /来源：后端组织结构/)
  assert.doesNotMatch(pageSource, /TabsList/)
  assert.doesNotMatch(pageSource, /TabsTrigger/)
  assert.doesNotMatch(pageSource, /sticky top-6/)
  assert.doesNotMatch(pageSource, /编辑组织结构\(支持添加、编辑、删除节点\)/)

  assert.match(treeSource, /showFrame\?: boolean/)
  assert.match(treeSource, /if \(!showFrame\)/)
  assert.match(treeSource, /saveRequestVersion/)
  assert.match(treeSource, /hideSaveButton/)
  assert.match(treeSource, /onDoubleClick/)
  assert.match(treeSource, /startEdit\(node\.id, node\.name\)/)
  assert.match(treeSource, /h-10 w-28/)
  assert.match(treeSource, /bg-slate-900 text-white hover:bg-slate-800/)
  assert.match(uploaderSource, /downloadTemplateText/)
  assert.match(uploaderSource, /bg-slate-900 text-white hover:bg-slate-800/)
})
