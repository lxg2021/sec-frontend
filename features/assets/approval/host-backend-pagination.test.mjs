import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, "../../..")

test("host approval uses backend pagination instead of loading every page", () => {
  const pageSource = readFileSync(resolve(repoRoot, "app/frame/computers/approve/page.tsx"), "utf8")
  const hostApprovalSource = readFileSync(resolve(repoRoot, "features/assets/approval/components/host-approval.tsx"), "utf8")

  assert.match(pageSource, /getApprovalHosts\(\{[\s\S]*page,\s*pageSize,[\s\S]*\}\)/)
  assert.doesNotMatch(pageSource, /for \(let page = 2; page <= totalPages; page \+= 1\)/)
  assert.doesNotMatch(pageSource, /totalPages = Math\.max\(1, firstPage\.pagination\.total_pages \|\| 1\)/)
  assert.match(hostApprovalSource, /pagination\.current_page/)
  assert.match(hostApprovalSource, /pagination\.total_pages/)
})
