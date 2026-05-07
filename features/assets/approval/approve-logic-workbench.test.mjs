import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, "../../..")

test("approve logic workbench is a polished dark split panel without nested tree card chrome", () => {
  const pageSource = readFileSync(resolve(repoRoot, "app/frame/computers/approve/page.tsx"), "utf8")
  const treeSource = readFileSync(resolve(repoRoot, "features/collection/components/tree-logic-group.tsx"), "utf8")

  assert.match(pageSource, /data-approve-section="logic"/)
  assert.match(pageSource, /bg-slate-950/)
  assert.match(pageSource, /grid-cols-\[minmax\(0,1fr\)_420px\]/)
  assert.match(pageSource, /showFrame=\{false\}/)
  assert.match(pageSource, /保存结构/)
  assert.match(pageSource, /导入配置/)
  assert.match(pageSource, /来源：后端组织结构/)
  assert.doesNotMatch(pageSource, /TabsList/)
  assert.doesNotMatch(pageSource, /TabsTrigger/)
  assert.doesNotMatch(pageSource, /sticky top-6/)
  assert.doesNotMatch(pageSource, /编辑组织结构\(支持添加、编辑、删除节点\)/)

  assert.match(treeSource, /showFrame\?: boolean/)
  assert.match(treeSource, /if \(!showFrame\)/)
  assert.match(treeSource, /saveRequestVersion/)
  assert.match(treeSource, /hideSaveButton/)
})
