import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, "../../..")

test("approve page renders logic host and collection as three vertical sections", () => {
  const source = readFileSync(resolve(repoRoot, "app/frame/computers/approve/page.tsx"), "utf8")

  const logicIndex = source.indexOf('{t("editStructure")}')
  const hostIndex = source.indexOf("<HostApproval")
  const collectionIndex = source.indexOf("<CollectionApproval")

  assert.ok(logicIndex >= 0, "logic section should exist")
  assert.ok(hostIndex > logicIndex, "host section should be second")
  assert.ok(collectionIndex > hostIndex, "collection section should be third")
  assert.match(source, /<CollectionApproval[\s\S]*refreshRequestVersion=\{collectionRefreshRequestVersion\}/)
  assert.doesNotMatch(source, /<Tabs defaultValue="host"/)
  assert.doesNotMatch(source, /max-w-\[1520px\]/)
  assert.match(source, /<FolderTree className="h-5 w-5" \/>/)
  assert.match(source, /<Computer className="h-5 w-5" \/>/)
  assert.match(source, /<FileUp className="h-5 w-5" \/>/)
  assert.doesNotMatch(source, /待处理主机[\s\S]*rounded-xl border border-slate-200 bg-slate-50 px-4 py-3/)
})
