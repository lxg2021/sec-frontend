import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

function readSource(file: string) {
  return fs.readFileSync(path.resolve(process.cwd(), file), "utf8")
}

describe("baseline dashboard visual hierarchy", () => {
  it("keeps the IOC-standard radius hierarchy", () => {
    const dashboardSource = readSource(
      "features/baseline/dashboard/components/baseline-dashboard-client.tsx",
    )
    const trendSource = readSource("features/baseline/dashboard/components/trend-chart.tsx")
    const riskSource = readSource("features/baseline/dashboard/components/risk-chart.tsx")
    const tableSource = readSource("features/baseline/dashboard/components/category-table.tsx")

    expect(dashboardSource).toContain("rounded-[24px] border border-slate-200 bg-white")
    expect(trendSource).toContain("rounded-[24px] border border-slate-200 bg-white")
    expect(riskSource).toContain("rounded-[24px] border border-slate-200 bg-white")
    expect(tableSource).toContain("overflow-hidden rounded-2xl border bg-card")
    expect(tableSource).toContain("rounded-2xl border-slate-200")
  })
})
