import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import ts from "typescript"

import enMessages from "@/messages/en.json"
import zhMessages from "@/messages/zh-CN.json"

const HARDWARE_UI_FILES = [
  "app/frame/assets/hardware/page.tsx",
  "features/assets/hardware/constants.ts",
  "features/assets/hardware/components/hardware-assets-page.tsx",
  "features/assets/hardware/components/hardware-summary-cards.tsx",
  "features/assets/hardware/components/hardware-asset-table.tsx",
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

describe("hardware assets page", () => {
  it("keeps the Chinese and English inventory message trees aligned", () => {
    expect(leafKeys(enMessages.pages.assets.hardware.inventory).sort()).toEqual(
      leafKeys(zhMessages.pages.assets.hardware.inventory).sort(),
    )
  })

  it("does not contain Chinese text in the English inventory messages", () => {
    expect(
      leafValues(enMessages.pages.assets.hardware.inventory).filter((value) => HAN_TEXT.test(value)),
    ).toEqual([])
  })

  it("keeps user-facing Chinese text out of the hardware inventory UI source files", () => {
    expect(HARDWARE_UI_FILES.flatMap(hardcodedHanText)).toEqual([])
  })

  it("uses the shared card, header, and control styling contract", () => {
    const summarySource = fs.readFileSync(
      path.resolve(process.cwd(), "features/assets/hardware/components/hardware-summary-cards.tsx"),
      "utf8",
    )
    const tableSource = fs.readFileSync(
      path.resolve(process.cwd(), "features/assets/hardware/components/hardware-asset-table.tsx"),
      "utf8",
    )

    expect(summarySource).toContain("rounded-[24px] border border-slate-200 bg-white")
    expect(summarySource).toContain("size-12 shrink-0 items-center justify-center rounded-2xl")
    expect(tableSource).toContain("rounded-[24px] border border-slate-200 bg-white")
    expect(tableSource).toContain('TableHeader className="sticky top-0 z-10 bg-muted"')
    expect(tableSource).toContain("text-base font-medium text-slate-950")
    expect(tableSource).toContain("text-xs leading-5 text-slate-500")
    expect(tableSource).toContain("rounded-2xl border-slate-200")
  })
})
