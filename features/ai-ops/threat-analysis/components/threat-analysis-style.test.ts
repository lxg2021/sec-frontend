import fs from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

const root = process.cwd()
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8")

describe("AI threat analysis visual contract", () => {
  it("uses the established page Header and pill search controls", () => {
    const source = read("app/frame/ai-ops/threat-analysis/page.tsx")

    expect(source).toContain(
      "min-h-[92px] min-w-0 items-center rounded-[28px] border border-slate-200/80 bg-white",
    )
    expect(source).toContain("pageT(\"title\")")
    expect(source).toContain("pageT(\"subtitle\")")
    expect(source).toContain("size-12 shrink-0 items-center justify-center rounded-2xl")
    expect(source).toContain("ChartNoAxesCombined className=\"size-5\"")
    expect(source).toContain("rounded-full border border-slate-200 bg-white")
    expect(source).toContain("rounded-full border border-slate-200 bg-slate-50/80")
  })

  it("centers both empty states in the remaining content area", () => {
    const page = read("app/frame/ai-ops/threat-analysis/page.tsx")
    const report = read("features/ai-ops/threat-analysis/components/attack-report.tsx")

    expect(page).toContain("flex min-h-0 flex-1 items-center justify-center px-6 text-center")
    expect(report).toContain(
      "flex min-h-0 w-full flex-1 items-center justify-center px-6 py-8 text-center",
    )
    expect(report).toContain("localizedEmptyMessageKey(task)")
    expect(report).toContain("empty.noReport")
  })

  it("keeps the original populated report presentation unchanged", () => {
    const report = read("features/ai-ops/threat-analysis/components/attack-report.tsx")
    const header = read("features/ai-ops/threat-analysis/components/report-overview-header.tsx")
    const body = read("features/ai-ops/threat-analysis/components/report/report-body.tsx")
    const section = read("features/ai-ops/threat-analysis/components/report/section.tsx")

    expect(report).toContain('<article className="w-full">')
    expect(report).toContain(
      "grid gap-8 py-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12",
    )
    expect(header).toContain("relative overflow-hidden border-b border-border")
    expect(body).toContain("min-w-0 space-y-10")
    expect(section).toContain(
      "h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-primary",
    )
  })

  it("preserves task creation, polling, localization, and return navigation", () => {
    const source = read("app/frame/ai-ops/threat-analysis/page.tsx")

    expect(source).toContain("createAttackAIReportTask")
    expect(source).toContain("getAttackAIReportTask")
    expect(source).toContain("const POLL_INTERVAL_MS = 2000")
    expect(source).toContain("const MAX_POLL_ATTEMPTS = 90")
    expect(source).toContain("runIdRef.current !== runId")
    expect(source).toContain("buildAttackWorkflowHref")
    expect(source).toContain("buildAttackDetailHref")
    expect(source).toContain("reportLocaleFromAppLocale")
  })
})
