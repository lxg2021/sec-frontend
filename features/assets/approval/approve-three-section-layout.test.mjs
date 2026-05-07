import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, "../../..")

test("approve page renders logic host and collection as three vertical sections", () => {
  const source = readFileSync(resolve(repoRoot, "app/frame/computers/approve/page.tsx"), "utf8")

  const logicIndex = source.indexOf('data-approve-section="logic"')
  const hostIndex = source.indexOf('data-approve-section="host"')
  const collectionIndex = source.indexOf('data-approve-section="collection"')

  assert.ok(logicIndex >= 0, "logic section should exist")
  assert.ok(hostIndex > logicIndex, "host section should be second")
  assert.ok(collectionIndex > hostIndex, "collection section should be third")
  assert.match(source, /<CollectionApproval \/>/)
  assert.doesNotMatch(source, /<Tabs defaultValue="host"/)
})
