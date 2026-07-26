import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

function readSource(file: string) {
  return fs.readFileSync(path.resolve(process.cwd(), file), "utf8")
}

describe("baseline item details visual hierarchy", () => {
  it("uses the IOC-standard radius hierarchy without rounding the table header", () => {
    const pageSource = readSource("app/frame/baseline/details/page.tsx")
    const headerSource = readSource(
      "features/baseline/details/components/baseline-detail-header.tsx",
    )
    const detailSource = readSource(
      "features/baseline/details/components/baseline-detail-spec.tsx",
    )
    const hostListSource = readSource(
      "features/baseline/details/components/host-list.tsx",
    )

    expect(headerSource).toContain("rounded-[28px] border border-slate-200/80")
    expect(detailSource).toContain(
      "rounded-[24px] border border-slate-200 bg-white",
    )
    expect(hostListSource).toContain(
      "rounded-[24px] border border-slate-200 bg-white",
    )
    expect(pageSource).toContain("h-full overflow-hidden bg-slate-50")
    expect(pageSource).toContain("flex h-full min-h-0 flex-col gap-4")
    expect(hostListSource).toContain(
      "flex min-h-[22rem] flex-1 flex-col overflow-hidden",
    )
    expect(hostListSource).toContain(
      "mt-auto flex flex-col gap-3 border-t border-slate-200",
    )
    expect(detailSource).toContain(
      "flex min-h-0 shrink flex-col overflow-hidden",
    )
    expect(detailSource).toContain("min-h-0 flex-1 space-y-5 overflow-y-auto")
    expect(detailSource).toContain("rounded-2xl border border-slate-200")
    expect(hostListSource).toContain('<TableHeader className="bg-slate-100">')
    expect(hostListSource).not.toContain("<TableHeader className=\"rounded")
  })

  it("keeps controls pill-shaped and the title icon at the shared 48px size", () => {
    const detailSource = readSource(
      "features/baseline/details/components/baseline-detail-spec.tsx",
    )
    const hostListSource = readSource(
      "features/baseline/details/components/host-list.tsx",
    )

    expect(detailSource).toContain("flex size-12 shrink-0 items-center justify-center rounded-2xl")
    expect(hostListSource).toContain("flex size-12 items-center justify-center rounded-2xl")
    expect(hostListSource).toContain("h-10 rounded-full border-slate-200")
    expect(hostListSource).toContain("h-10 rounded-2xl border-slate-200")
  })
})
