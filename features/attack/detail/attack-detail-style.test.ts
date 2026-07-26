import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

function readSource(file: string) {
  return fs.readFileSync(path.resolve(process.cwd(), file), "utf8")
}

describe("attack detail visual hierarchy", () => {
  it("keeps the existing overview header and stage carousel in place", () => {
    const pageSource = readSource("app/frame/attack/detail/page.tsx")

    expect(pageSource).toContain("<AttackDetailHeader")
    expect(pageSource).toContain("<OverviewCarousel")
    expect(pageSource.indexOf("<AttackDetailHeader")).toBeLessThan(
      pageSource.indexOf("<OverviewCarousel"),
    )
    expect(pageSource.indexOf("<OverviewCarousel")).toBeLessThan(
      pageSource.indexOf("<AttackCaseList"),
    )
  })

  it("uses the established Card and heading hierarchy below the overview", () => {
    const listSource = readSource(
      "features/attack/detail/components/attack-case-list.tsx",
    )

    expect(listSource).toContain(
      "rounded-[24px] border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]",
    )
    expect(listSource).toContain(
      "flex size-10 shrink-0 items-center justify-center rounded-xl",
    )
    expect(listSource).toContain("text-base font-medium leading-6")
    expect(listSource).toContain("text-xs leading-5 text-slate-500")
  })

  it("keeps the locator, rows, and pagination responsive", () => {
    const listSource = readSource(
      "features/attack/detail/components/attack-case-list.tsx",
    )
    const rowSource = readSource(
      "features/attack/detail/components/attack-case-row.tsx",
    )

    expect(listSource).toContain(
      "h-10 w-full min-w-0 items-center gap-2 rounded-full",
    )
    expect(listSource).not.toContain("min-w-[320px]")
    expect(listSource).toContain("rounded-full px-4")
    expect(rowSource).toContain(
      "group/case-row relative min-w-0 overflow-hidden rounded-2xl",
    )
    expect(rowSource).toContain(
      "xl:grid-cols-[minmax(294px,1fr)_352px_max-content_max-content]",
    )
    expect(rowSource).toContain(
      "rounded-2xl bg-slate-50/70",
    )
    expect(rowSource).toContain("selected && severity.selectedMarker")
  })

  it("keeps edit dialogs consistent without changing mutation flows", () => {
    const listSource = readSource(
      "features/attack/detail/components/attack-case-list.tsx",
    )
    const rowSource = readSource(
      "features/attack/detail/components/attack-case-row.tsx",
    )

    expect(rowSource).toContain(
      "rounded-[24px] border-slate-200 p-0 shadow-[0_18px_48px_rgba(15,23,42,0.16)]",
    )
    expect(rowSource).toContain("rounded-full bg-blue-600 px-5")
    expect(rowSource).toContain("updateAttackCaseFriendlyName")
    expect(rowSource).toContain("fetchAttackRuleDetail")
    expect(listSource).toContain("buildAttackWorkflowHref")
    expect(rowSource).toContain("onWorkflow?.(item.case_id)")
  })

  it("preserves detail loading, paging, refresh, and stage selection", () => {
    const pageSource = readSource("app/frame/attack/detail/page.tsx")
    const listSource = readSource(
      "features/attack/detail/components/attack-case-list.tsx",
    )

    for (const token of [
      "fetchAttackTimelineCases",
      "fetchAttackOverview",
      "fetchAttackStageInstanceDistribution",
      "handleRefresh",
      "handleSnapshotChange",
      "onSelectStage",
    ]) {
      expect(pageSource).toContain(token)
    }

    for (const token of [
      "handleLocateCase",
      "handlePageSizeChange",
      "handleNextPage",
      "handlePreviousPage",
      "handleWorkflow",
    ]) {
      expect(listSource).toContain(token)
    }
  })
})
