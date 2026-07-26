import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import ts from "typescript"

import enMessages from "@/messages/en.json"
import zhMessages from "@/messages/zh-CN.json"

const HOST_INFO_UI_FILES = [
  "app/frame/assets/host-info/page.tsx",
  "features/assets/host/components/host-asset-page.tsx",
  "features/assets/host/components/host-summary-card.tsx",
  "features/assets/host/components/host-list-table.tsx",
  "features/assets/host/components/host-details-dialog.tsx",
  "features/assets/host/components/host-details-tabs.tsx",
  "features/assets/host/components/host-base-info-card.tsx",
  "features/assets/host/components/host-hardware-accordion.tsx",
  "features/assets/host/components/host-software-table.tsx",
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

describe("host information internationalization", () => {
  it("keeps the Chinese and English host-information message trees aligned", () => {
    expect(leafKeys(enMessages.pages.assets.hardware).sort()).toEqual(
      leafKeys(zhMessages.pages.assets.hardware).sort(),
    )
  })

  it("does not contain Chinese text in the English host-information messages", () => {
    expect(
      leafValues(enMessages.pages.assets.hardware).filter((value) => HAN_TEXT.test(value)),
    ).toEqual([])
  })

  it("keeps user-facing Chinese text out of the host-information UI source files", () => {
    expect(HOST_INFO_UI_FILES.flatMap(hardcodedHanText)).toEqual([])
  })
})
