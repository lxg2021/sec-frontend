import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

function readSource(file: string) {
  return fs.readFileSync(path.resolve(process.cwd(), file), "utf8")
}

const ROOT = "features/response/remediation-overview/components"

describe("remediation overview visual hierarchy", () => {
  it("keeps the established page header and refresh behavior intact", () => {
    const source = readSource(`${ROOT}/remediation-overview-page.tsx`)

    expect(source).toContain(
      "min-h-[92px] items-center rounded-[28px] border border-slate-200/80 bg-white",
    )
    expect(source).toContain("queryRemediationOverviewSummary")
    expect(source).toContain("queryRemediationOrderList")
    expect(source).toContain("queryRemediationHostList")
    expect(source).toContain("window.setInterval")
    expect(source).toContain("30_000")
    expect(source).toContain("refreshAll")
  })

  it("uses a responsive page shell without page-level horizontal overflow", () => {
    const source = readSource(`${ROOT}/remediation-overview-page.tsx`)

    expect(source).toContain(
      "min-h-dvh min-w-0 overflow-x-hidden bg-slate-50",
    )
    expect(source).toContain(
      "grid-rows-[auto_auto_auto_auto]",
    )
    expect(source).toContain(
      "2xl:grid-rows-[auto_auto_minmax(180px,0.8fr)_minmax(230px,1.2fr)]",
    )
    expect(source).toContain(
      "min-h-[280px] min-w-0 grid-cols-1",
    )
  })

  it("uses the shared metric Card, icon, and heading standard", () => {
    const source = readSource(`${ROOT}/overview-metric-cards.tsx`)

    expect(source).toContain(
      "rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]",
    )
    expect(source).toContain(
      "flex size-10 shrink-0 items-center justify-center rounded-xl",
    )
    expect(source).toContain('className="size-5 text-white"')
    expect(source).toContain(
      "text-base font-medium leading-6 text-slate-950",
    )
    expect(source).not.toContain("border-0 shadow-md")
    expect(source).not.toContain("hover:shadow-lg")
  })

  it("aligns both chart Cards with the same visual hierarchy", () => {
    const trend = readSource(`${ROOT}/remediation-trend-chart.tsx`)
    const actions = readSource(`${ROOT}/remediation-action-distribution.tsx`)

    for (const source of [trend, actions]) {
      expect(source).toContain(
        "rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]",
      )
      expect(source).toContain(
        "size-10 shrink-0 items-center justify-center rounded-xl",
      )
      expect(source).toContain(
        "text-base font-medium leading-6 text-slate-950",
      )
      expect(source).toContain("focus-visible:ring-red-500")
    }
  })

  it("uses pill filters, gray headers, internal table scrolling, and selected row markers", () => {
    const orderList = readSource(`${ROOT}/remediation-order-overview-list.tsx`)
    const hostList = readSource(`${ROOT}/remediation-host-overview-list.tsx`)
    const viewTabs = readSource(`${ROOT}/remediation-overview-view-tabs.tsx`)

    for (const source of [orderList, hostList]) {
      expect(source).toContain(
        "rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]",
      )
      expect(source).toContain("rounded-full border-slate-200 bg-white")
      expect(source).toContain("bg-slate-100 text-xs text-slate-500")
      expect(source).toContain("overflow-auto")
      expect(source).toContain("shadow-[inset_4px_0_0_#0284c7]")
    }

    expect(viewTabs).toContain(
      "inline-flex shrink-0 rounded-full bg-slate-100 p-1",
    )
    expect(viewTabs).toContain(
      "items-center justify-center gap-2 rounded-full px-3",
    )
    expect(hostList).toContain('className="overflow-x-auto"')
    expect(hostList).toContain('className="bg-slate-100 text-slate-500"')
  })

  it("preserves detail loading, polling, filtering, paging, and orchestration links", () => {
    const page = readSource(`${ROOT}/remediation-overview-page.tsx`)
    const orderList = readSource(`${ROOT}/remediation-order-overview-list.tsx`)
    const hostList = readSource(`${ROOT}/remediation-host-overview-list.tsx`)

    for (const token of [
      "setViewMode",
      "setOrderStatus",
      "setHostStatus",
      "setSource",
      "setOrderPage",
      "setHostPage",
      "setHostKeyword",
      "Promise.allSettled",
    ]) {
      expect(page).toContain(token)
    }

    expect(orderList).toContain("queryRemediationOrderById")
    expect(orderList).toContain("8_000")
    expect(orderList).toContain("RemediationExecutionItemsTable")
    expect(orderList).toContain("/frame/response/orchestration?order_id=")
    expect(hostList).toContain("queryRemediationItemsByAgentId")
    expect(hostList).toContain("8_000")
    expect(hostList).toContain("HostActionDetailTable")
    expect(hostList).toContain("/frame/response/orchestration?order_id=")
  })
})
