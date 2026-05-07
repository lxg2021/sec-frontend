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
  assert.match(pageSource, /rounded-2xl border border-slate-200 bg-white shadow-sm/)
  assert.match(pageSource, /grid-cols-\[minmax\(0,1fr\)_440px\]/)
  assert.match(pageSource, /min-h-\[480px\]/)
  assert.match(pageSource, /保存结构/)
  assert.match(pageSource, /添加公司/)
  assert.match(pageSource, /下载模板/)
  assert.match(pageSource, /来源：后端组织结构/)
  assert.match(pageSource, /导入配置/)
  assert.match(pageSource, /上传组织结构文件，校验后同步到左侧树/)
  assert.match(pageSource, /hideAddCompanyButton/)
  assert.match(pageSource, /hideDownloadButton/)
  assert.match(pageSource, /showFrame=\{false\}/)
  assert.doesNotMatch(pageSource, /TabsList/)
  assert.doesNotMatch(pageSource, /sticky top-6/)

  assert.match(treeSource, /showFrame\?: boolean/)
  assert.match(treeSource, /hideAddCompanyButton\?: boolean/)
  assert.match(treeSource, /if \(!showFrame\)/)
  assert.match(treeSource, /saveRequestVersion/)
  assert.match(treeSource, /hideSaveButton/)
  assert.match(treeSource, /onDoubleClick/)
  assert.match(treeSource, /startEdit\(node\.id, node\.name\)/)
  assert.match(treeSource, /h-10 w-28/)
  assert.match(treeSource, /bg-slate-900 text-white hover:bg-slate-800/)

  assert.match(uploaderSource, /downloadTemplateText/)
  assert.match(uploaderSource, /hideDownloadButton/)
  assert.match(uploaderSource, /justify-end/)
  assert.match(uploaderSource, /bg-slate-900 text-white hover:bg-slate-800/)
})

test("logic tree exposes efficient tree editing interactions", () => {
  const treeSource = readFileSync(resolve(repoRoot, "features/collection/components/tree-logic-group.tsx"), "utf8")

  assert.match(treeSource, /searchExpandedIds/)
  assert.match(treeSource, /visibleNodeIds/)
  assert.match(treeSource, /handleTreeKeyDown/)
  assert.match(treeSource, /onKeyDown=\{handleTreeKeyDown\}/)
  assert.match(treeSource, /当前路径/)
  assert.match(treeSource, /全部展开/)
  assert.match(treeSource, /全部收起/)
  assert.match(treeSource, /group\/tree-node/)
  assert.match(treeSource, /group-hover\/tree-node:opacity-100/)
  assert.match(treeSource, /inputRef\.current\.select\(\)/)
  assert.match(treeSource, /onBlur=\{\(\) => saveEdit\(\)\}/)
})
