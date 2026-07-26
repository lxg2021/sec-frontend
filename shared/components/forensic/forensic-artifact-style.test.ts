import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

function readSource(file: string) {
  return fs.readFileSync(path.resolve(process.cwd(), file), "utf8")
}

const CONFIG_PAGE = "shared/components/forensic/forensic-config-page.tsx"

describe("forensic artifact catalog visual hierarchy", () => {
  it("keeps the established page header and its actions intact", () => {
    const source = readSource(CONFIG_PAGE)

    expect(source).toContain(
      "w-full rounded-[28px] border border-slate-200/80 bg-white px-5 py-4",
    )
    expect(source).toContain(
      "flex flex-col gap-4 2xl:flex-row 2xl:items-center",
    )
    expect(source).toContain("setQuery")
    expect(source).toContain("setPlatform")
    expect(source).toContain("setEnabled")
    expect(source).toContain("void loadCatalog()")
    expect(source).toContain("void loadList()")
    expect(source).toContain("createTaskHref")
  })

  it("uses the shared Card, icon, and heading standard", () => {
    const source = readSource(CONFIG_PAGE)

    expect(source).toContain(
      "min-h-dvh min-w-0 overflow-x-hidden bg-slate-50",
    )
    expect(source.match(/rounded-\[24px\] border border-slate-200 bg-white shadow-\[0_10px_28px_rgba\(15,23,42,0\.05\)\]/g)?.length).toBeGreaterThanOrEqual(4)
    expect(source).toContain(
      "inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm",
    )
    expect(source).toContain('className="size-5" strokeWidth={2}')
    expect(source).toContain(
      "truncate text-base font-medium leading-6 text-slate-950",
    )
    expect(source).not.toContain("hover:-translate-y-0.5")
  })

  it("keeps compact panels usable below desktop widths", () => {
    const source = readSource(CONFIG_PAGE)

    expect(source).toContain(
      "min-h-[calc(100dvh-3rem)] min-w-0 flex-col gap-6 p-6 xl:h-[calc(100dvh-3rem)] xl:overflow-hidden",
    )
    expect(source).toContain("min-h-[420px]")
    expect(source).toContain("min-h-[520px]")
    expect(source).toContain("min-h-[560px]")
    expect(source).toContain(
      "grid grid-cols-2 gap-2 sm:grid-cols-4",
    )
  })

  it("uses pill tabs, restrained internal panels, and gray table headers", () => {
    const source = readSource(CONFIG_PAGE)

    expect(source).toContain(
      "grid h-10 w-full grid-cols-4 rounded-full bg-slate-100 p-1",
    )
    expect(source.match(/TabsTrigger value=.*className="rounded-full text-xs"/g)?.length).toBe(4)
    expect(source).toContain(
      "rounded-2xl bg-slate-50/70 p-4",
    )
    expect(source.match(/<tr className="bg-slate-100 dark:bg-slate-800">/g)?.length).toBe(2)
    expect(source).toContain('className="overflow-x-auto"')
    expect(source).toContain("min-w-[760px]")
    expect(source).toContain("min-w-[680px]")
  })

  it("preserves list, detail, filtering, pagination, and task routing behavior", () => {
    const source = readSource(CONFIG_PAGE)

    for (const token of [
      "listForensicArtifacts",
      "getForensicArtifactDefinition",
      "loadCatalog",
      "loadList",
      "filteredItems",
      "setCategory",
      "setArtifactPage",
      "setCategoryPage",
      "selectedKey",
      "parameterDocs",
      "outputDocs",
      "examples",
      "inputSchema",
      "defaultParams",
      "upstream",
      "/frame/investigation/tasks?",
    ]) {
      expect(source).toContain(token)
    }
  })

  it("keeps the route connected to the artifact catalog component", () => {
    const source = readSource("app/frame/investigation/artifacts/page.tsx")

    expect(source).toContain("ForensicConfigPage")
    expect(source).toContain("return <ForensicConfigPage />")
  })
})
