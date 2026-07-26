import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

function readSource(file: string) {
  return fs.readFileSync(path.resolve(process.cwd(), file), "utf8")
}

const FORENSIC_ROOT = "shared/components/forensic"

describe("forensic collection overview visual hierarchy", () => {
  it("uses the responsive page shell without allowing page-level horizontal overflow", () => {
    const pageSource = readSource(`${FORENSIC_ROOT}/forensic-overview-page.tsx`)

    expect(pageSource).toContain(
      "min-h-dvh min-w-0 overflow-x-hidden bg-slate-50",
    )
    expect(pageSource).toContain(
      "py-3 pl-[4.75rem] pr-3 sm:p-4 xl:gap-5 xl:p-6",
    )
    expect(pageSource).toContain(
      "grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4",
    )
  })

  it("keeps the established page header and all header actions intact", () => {
    const headerSource = readSource(`${FORENSIC_ROOT}/forensic-overview-header.tsx`)

    expect(headerSource).toContain(
      "w-full rounded-[28px] border border-slate-200/80 bg-white px-5 py-4",
    )
    expect(headerSource).toContain(
      "flex flex-col gap-4 lg:flex-row lg:items-center",
    )
    expect(headerSource).toContain(
      "h-12 w-full min-w-[320px] max-w-full items-center overflow-hidden rounded-full",
    )
    expect(headerSource).toContain("handleCaseSubmit")
    expect(headerSource).toContain("handleRefreshClick")
    expect(headerSource).toContain("/frame/investigation/artifacts")
    expect(headerSource).toContain("createTaskHref")
  })

  it("uses the shared 24px Card, 40px icon, and restrained heading standard", () => {
    const chromeSource = readSource(`${FORENSIC_ROOT}/forensic-panel-chrome.tsx`)

    expect(chromeSource).toContain(
      "rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]",
    )
    expect(chromeSource).toContain(
      "inline-flex size-10 shrink-0 items-center justify-center rounded-xl",
    )
    expect(chromeSource).toContain('className="size-5 text-white"')
    expect(chromeSource).toContain(
      "text-base font-medium leading-6 text-slate-950",
    )
    expect(chromeSource).toContain(
      "text-base font-medium leading-6 text-foreground",
    )
    expect(chromeSource).not.toContain(
      "rounded-lg border-0 bg-white shadow-lg",
    )
  })

  it("aligns backend status panels and recent tasks with the same hierarchy", () => {
    const backendSource = readSource(
      `${FORENSIC_ROOT}/forensic-backend-status-panel.tsx`,
    )
    const recentSource = readSource(
      `${FORENSIC_ROOT}/forensic-recent-task-summary.tsx`,
    )

    for (const source of [backendSource, recentSource]) {
      expect(source).toContain("rounded-[24px]")
      expect(source).toContain(
        "shadow-[0_10px_28px_rgba(15,23,42,0.05)]",
      )
    }

    expect(backendSource).toContain(
      "min-w-0 rounded-2xl bg-slate-50",
    )
    expect(backendSource).toContain(
      "text-base font-medium leading-6 text-foreground",
    )
    expect(recentSource).toContain(
      "rounded-full border border-blue-100 bg-blue-50",
    )
  })

  it("keeps the recent task table square, gray, and internally scrollable", () => {
    const recentSource = readSource(
      `${FORENSIC_ROOT}/forensic-recent-task-summary.tsx`,
    )

    expect(recentSource).toContain(
      'className="w-full min-w-0 overflow-x-auto"',
    )
    expect(recentSource).toContain(
      'className="w-full min-w-[1208px] table-fixed text-sm"',
    )
    expect(recentSource).toContain('<thead className="bg-slate-100">')
    expect(recentSource).toContain(
      "border-b border-slate-200 text-left text-xs text-slate-500",
    )
  })

  it("preserves overview loading, routing, status links, and backend requests", () => {
    const pageSource = readSource(`${FORENSIC_ROOT}/forensic-overview-page.tsx`)
    const taskSource = readSource(
      `${FORENSIC_ROOT}/forensic-task-status-summary.tsx`,
    )
    const artifactSource = readSource(
      `${FORENSIC_ROOT}/forensic-artifact-category-summary.tsx`,
    )

    for (const token of [
      "getForensicOverview",
      "getForensicBackendStatus",
      "Promise.allSettled",
      "handleCaseIdSubmit",
      "context.case_id",
      "router.push",
      "void refresh()",
    ]) {
      expect(pageSource).toContain(token)
    }

    for (const status of ["pending", "running", "success", "failed"]) {
      expect(taskSource).toContain(
        `/frame/investigation/tasks?status=${status}`,
      )
    }
    expect(artifactSource).toContain(
      "/frame/investigation/artifacts?category=",
    )
  })
})
