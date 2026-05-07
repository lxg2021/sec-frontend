import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, "../../..")

test("host approval save button is right aligned and local edits use toast feedback", () => {
  const source = readFileSync(resolve(__dirname, "components/host-approval.tsx"), "utf8")
  const pageSource = readFileSync(resolve(repoRoot, "app/frame/computers/approve/page.tsx"), "utf8")
  const collectionSource = readFileSync(resolve(__dirname, "components/collection-approval.tsx"), "utf8")
  const uiToastSource = readFileSync(resolve(repoRoot, "shared/ui/use-toast.ts"), "utf8")
  const zh = JSON.parse(readFileSync(resolve(repoRoot, "messages/zh-CN.json"), "utf8"))
  const en = JSON.parse(readFileSync(resolve(repoRoot, "messages/en.json"), "utf8"))

  assert.match(source, /findHostsNeedingApproval/)
  assert.match(source, /import \{ Save \} from "lucide-react"/)
  assert.match(source, /@\/shared\/hooks\/use-toast/)
  assert.doesNotMatch(source, /@\/shared\/ui\/use-toast/)
  assert.match(pageSource, /@\/shared\/hooks\/use-toast/)
  assert.doesNotMatch(pageSource, /@\/shared\/ui\/use-toast/)
  assert.match(collectionSource, /@\/shared\/hooks\/use-toast/)
  assert.doesNotMatch(collectionSource, /@\/shared\/ui\/use-toast/)
  assert.match(uiToastSource, /@\/shared\/hooks\/use-toast/)
  assert.doesNotMatch(uiToastSource, /const listeners/)
  assert.match(source, /pendingChangeCount/)
  assert.match(source, /pendingChangeCount === 0/)
  assert.match(source, /handleSaveHost = \(updatedHost: Host\) => \{/)
  assert.match(source, /toast\(\{/)
  assert.match(source, /<Save className="mr-2 h-4 w-4" \/>/)
  assert.match(source, /className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"/)
  assert.match(source, /className="flex justify-end gap-3/)

  assert.ok(!("hostSaveHint" in zh.pages.computers.approve))
  assert.ok(!("hostPendingChangesHint" in zh.pages.computers.approve))
  assert.ok(!("hostSaveHint" in en.pages.computers.approve))
  assert.ok(!("hostPendingChangesHint" in en.pages.computers.approve))
})
