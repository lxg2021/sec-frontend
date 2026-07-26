import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

function readSource(file: string) {
  return fs.readFileSync(path.resolve(process.cwd(), file), "utf8")
}

describe("attack dashboard visual hierarchy", () => {
  it("uses the established responsive page and dashboard Card hierarchy", () => {
    const pageSource = readSource("app/frame/attack/dashboard/page.tsx")
    const stageSource = readSource(
      "features/attack/dashboard/components/stage-host-distribution-chart.tsx",
    )
    const trendSource = readSource(
      "features/attack/dashboard/components/attack-stats-trend-chart.tsx",
    )
    const top10Source = readSource(
      "features/attack/dashboard/components/attack-top10.tsx",
    )
    const riskSource = readSource(
      "features/attack/dashboard/components/top-risk-hosts.tsx",
    )

    expect(pageSource).toContain(
      "min-h-full min-w-0 bg-slate-50 p-3 sm:p-4 xl:p-5 2xl:p-6",
    )
    expect(pageSource).toContain(
      "grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-2",
    )

    for (const source of [stageSource, trendSource, top10Source, riskSource]) {
      expect(source).toContain(
        "rounded-[24px] border border-slate-200 bg-white",
      )
      expect(source).toContain(
        "flex size-10 shrink-0 items-center justify-center rounded-xl",
      )
      expect(source).toContain("text-base font-medium text-slate-950")
    }
  })

  it("keeps KPI cards restrained and table headers square and gray", () => {
    const headerSource = readSource(
      "features/attack/dashboard/components/header.tsx",
    )
    const top10Source = readSource(
      "features/attack/dashboard/components/attack-top10.tsx",
    )
    const riskSource = readSource(
      "features/attack/dashboard/components/top-risk-hosts.tsx",
    )

    expect(headerSource).toContain(
      "min-h-[132px] overflow-hidden rounded-[20px] border border-slate-200 bg-white",
    )
    expect(headerSource).toContain('<Icon className="h-4 w-4 text-white"')
    expect(top10Source).toContain(
      'TableHeader className="bg-slate-100"',
    )
    expect(riskSource).toContain(
      'TableHeader className="bg-slate-100"',
    )
    expect(top10Source).toContain('Table className="min-w-[800px]"')
    expect(riskSource).toContain('Table className="min-w-[640px] table-fixed"')
  })

  it("preserves dashboard loading, polling, snapshot, refresh, and drill-down flows", () => {
    const pageSource = readSource("app/frame/attack/dashboard/page.tsx")
    const stageSource = readSource(
      "features/attack/dashboard/components/stage-host-distribution-chart.tsx",
    )
    const trendSource = readSource(
      "features/attack/dashboard/components/attack-stats-trend-chart.tsx",
    )
    const top10Source = readSource(
      "features/attack/dashboard/components/attack-top10.tsx",
    )
    const riskSource = readSource(
      "features/attack/dashboard/components/top-risk-hosts.tsx",
    )

    expect(pageSource).toContain("fetchAttackDashboardData")
    expect(pageSource).toContain("getTaskStatus")
    expect(pageSource).toContain("TASK_POLL_INTERVAL_MS")
    expect(pageSource).toContain("handleSnapshotChange")
    expect(pageSource).toContain("handleRefresh")
    expect(pageSource).toContain("handleCheckSubmitted")
    expect(stageSource).toContain("fetchAttackStageHostDistribution")
    expect(trendSource).toContain("fetchAttackStatsTrend")
    expect(top10Source).toContain("handleHostClick")
    expect(riskSource).toContain("fetchTopAttackHosts")
    expect(riskSource).toContain("handleHostClick")
  })
})
