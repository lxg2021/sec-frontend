import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import ts from "typescript"

import enMessages from "@/messages/en.json"
import zhMessages from "@/messages/zh-CN.json"

const ACTIVE_AUDIT_UI_FILES = [
  "features/audit/components/audit-center.tsx",
  "features/audit/components/audit-category-tabs.tsx",
  "features/audit/components/dispatch-audit-filters.tsx",
  "features/audit/components/dispatch-audit-table.tsx",
  "features/audit/components/audit-summary.tsx",
  "features/audit/components/audit-event-detail.tsx",
  "features/audit/components/user-activity-audit.tsx",
  "features/audit/components/user-activity-filters.tsx",
  "features/audit/components/user-activity-list.tsx",
  "features/audit/components/user-activity-list-item.tsx",
  "features/audit/components/user-activity-detail-dialog.tsx",
  "features/audit/components/change-audit.tsx",
  "features/audit/components/change-audit-filters.tsx",
  "features/audit/components/change-audit-list.tsx",
  "features/audit/components/change-audit-detail-dialog.tsx",
]

const HAN_TEXT = /[\u3400-\u9fff]/

function leafKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [prefix]

  return Object.entries(value).flatMap(([key, child]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key
    return child && typeof child === "object" && !Array.isArray(child)
      ? leafKeys(child, nextPrefix)
      : [nextPrefix]
  })
}

function leafValues(value: unknown): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return typeof value === "string" ? [value] : []
  }
  return Object.values(value).flatMap(leafValues)
}

function hardcodedHanText(file: string) {
  const absolutePath = path.resolve(process.cwd(), file)
  const source = fs.readFileSync(absolutePath, "utf8")
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const matches: string[] = []

  function visit(node: ts.Node) {
    let text = ""
    if (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      text = node.text
    } else if (ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      text = node.text
    } else if (ts.isJsxText(node)) {
      text = node.text.trim().replace(/\s+/g, " ")
    }

    if (text && HAN_TEXT.test(text)) {
      const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1
      matches.push(`${file}:${line}: ${text}`)
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return matches
}

describe("audit center internationalization", () => {
  it("keeps the Chinese and English report message trees aligned", () => {
    expect(leafKeys(enMessages.pages.reports).sort()).toEqual(leafKeys(zhMessages.pages.reports).sort())
  })

  it("does not contain Chinese text in the English report messages", () => {
    expect(leafValues(enMessages.pages.reports).filter((value) => HAN_TEXT.test(value))).toEqual([])
  })

  it("keeps user-facing Chinese text out of active audit UI source files", () => {
    expect(ACTIVE_AUDIT_UI_FILES.flatMap(hardcodedHanText)).toEqual([])
  })
})
