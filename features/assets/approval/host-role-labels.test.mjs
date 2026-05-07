import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, "../../..")

test("host owner role options use admin, auditor, and operator labels", () => {
  const modalSource = readFileSync(resolve(__dirname, "components/host-edit-modal.tsx"), "utf8")
  const zh = JSON.parse(readFileSync(resolve(repoRoot, "messages/zh-CN.json"), "utf8"))
  const en = JSON.parse(readFileSync(resolve(repoRoot, "messages/en.json"), "utf8"))

  const zhApprove = zh.pages.computers.approve
  const enApprove = en.pages.computers.approve

  assert.match(modalSource, /value="admin">\{t\("ownerAdmin"\)\}/)
  assert.match(modalSource, /value="auditor">\{t\("ownerAuditor"\)\}/)
  assert.match(modalSource, /value="operator">\{t\("ownerOperator"\)\}/)

  assert.equal(zhApprove.ownerAdmin, "管理员")
  assert.equal(zhApprove.ownerAuditor, "审计员")
  assert.equal(zhApprove.ownerOperator, "操作员")
  assert.equal(enApprove.ownerAdmin, "Admin")
  assert.equal(enApprove.ownerAuditor, "Auditor")
  assert.equal(enApprove.ownerOperator, "Operator")
})
