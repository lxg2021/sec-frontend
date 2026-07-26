import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const PAGE_FILE = "app/frame/assets/software/details/page.tsx"
const TABLE_FILE = "features/assets/software/components/soft-inventory-table.tsx"

function readSource(file: string) {
  return fs.readFileSync(path.resolve(process.cwd(), file), "utf8")
}

describe("software assets details page", () => {
  it("uses the host-summary visual contract for all overview metrics", () => {
    const source = readSource(PAGE_FILE)

    expect(source.match(/<SummaryMetric/g)).toHaveLength(5)
    expect(source).toContain(
      "group relative min-w-0 overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl",
    )
    expect(source).toContain("opacity-10 transition-opacity group-hover:opacity-20")
    expect(source).toContain('className="h-5 w-5 text-white"')
  })

  it("uses the shared asset-list card and control styling contract", () => {
    const pageSource = readSource(PAGE_FILE)
    const tableSource = readSource(TABLE_FILE)

    expect(pageSource).toContain("rounded-[24px] border border-slate-200 bg-white")
    expect(pageSource).toContain("size-12 shrink-0 items-center justify-center rounded-2xl")
    expect(pageSource).toContain("text-base font-medium text-slate-950")
    expect(pageSource).toContain("text-xs leading-5 text-slate-500")
    expect(tableSource).toContain('TableHeader className="sticky top-0 z-10 bg-muted"')
    expect(tableSource).toContain("rounded-2xl border-slate-200")
  })
})
