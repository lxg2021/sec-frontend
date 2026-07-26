import fs from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

const root = process.cwd()
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8")

describe("IOC search visual contract", () => {
  it("uses the established Header and compact pill search controls", () => {
    const source = read("features/ioc-analysis/components/ioc-search-header.tsx")

    expect(source).toContain(
      "min-h-[92px] w-full shrink-0 items-center rounded-[28px] border border-slate-200/80 bg-white",
    )
    expect(source).toContain("h-12 w-12 shrink-0 items-center justify-center rounded-2xl")
    expect(source).toContain("Globe2 className=\"h-5 w-5\"")
    expect(source).toContain(
      "xl:grid-cols-[minmax(220px,1fr)_minmax(560px,760px)_minmax(220px,1fr)]",
    )
    expect(source).toContain("xl:justify-self-center")
    expect(source).toContain('className="hidden xl:block" aria-hidden="true"')
    expect(source).toContain("flex h-11 w-full min-w-0 items-center overflow-hidden rounded-full")
    expect(source).toContain("h-9 w-[108px] shrink-0 rounded-full")
    expect(source).toContain("h-9 shrink-0 cursor-pointer rounded-full bg-blue-600")
  })

  it("uses standard Cards, pill tabs, and centered empty content", () => {
    const page = read("features/ioc-analysis/components/ioc-search-page.tsx")
    const summary = read("features/ioc-analysis/components/ioc-search-result-summary.tsx")

    expect(page).toContain("min-w-0 overflow-hidden bg-slate-50")
    expect(page).toContain(
      "rounded-[24px] border border-slate-200 bg-white px-6 py-10 text-center shadow-[0_10px_28px_rgba(15,23,42,0.05)]",
    )
    expect(page).toContain(
      "rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]",
    )
    expect(page).toContain("TabsList className=\"h-10 rounded-full bg-slate-100 p-1\"")
    expect(page).toContain("cursor-pointer rounded-full px-4")
    expect(summary).toContain(
      "rounded-[24px] border border-slate-200 bg-white text-slate-950 shadow-[0_10px_28px_rgba(15,23,42,0.05)]",
    )
  })

  it("keeps status labels while using a circular copy action and one status accent", () => {
    const source = read("features/ioc-analysis/components/ioc-search-result-summary.tsx")

    expect(source).toContain("absolute inset-y-4 left-0 z-10 w-1 rounded-full")
    expect(source).not.toContain("absolute inset-y-4 right-0")
    expect(source).toContain("h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full")
    expect(source).toContain("inline-flex items-center rounded-full")
    expect(source).toContain("inline-flex items-center gap-1 rounded-full")
    expect(source).toContain("focus-visible:ring-2 focus-visible:ring-blue-500")
  })

  it("uses a gray event header, selected-row marker, and pill graph reset", () => {
    const events = read("features/ioc-analysis/components/ioc-local-events-panel.tsx")
    const graph = read("features/ioc-analysis/components/ioc-positioning-graph-panel.tsx")

    expect(events).toContain("sticky top-0 z-10 bg-slate-100")
    expect(events).toContain("shadow-[inset_4px_0_0_#0284c7]")
    expect(graph).toContain("h-8 rounded-full border-slate-200 bg-white text-xs")
  })

  it("preserves IOC lookup, local positioning, graph locate, and drill logic", () => {
    const source = read("features/ioc-analysis/components/ioc-search-page.tsx")

    expect(source).toContain("getIocHitDetail")
    expect(source).toContain("batchDescribeEventSourcesByKeys")
    expect(source).toContain('http.post("/sensor/analysis/characteristicposition/page"')
    expect(source).toContain("fetchGraphLocateResult")
    expect(source).toContain("fetchGraphDrill")
    expect(source).toContain("localLocateRequestRef.current === requestId")
    expect(source).toContain("buildAttackGraphModel")
    expect(source).toContain("mergeGraphCaseDrillResult")
    expect(source).toContain("onMenuAction={item ? handleGraphMenuAction : undefined}")
  })
})
