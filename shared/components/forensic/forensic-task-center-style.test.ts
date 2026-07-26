import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

function readSource(file: string) {
  return fs.readFileSync(path.resolve(process.cwd(), file), "utf8")
}

const FORENSIC_ROOT = "shared/components/forensic"

describe("forensic task center visual hierarchy", () => {
  it("keeps the established page header structure and actions unchanged", () => {
    const source = readSource(`${FORENSIC_ROOT}/forensic-task-center-page.tsx`)

    expect(source).toContain(
      "w-full rounded-[28px] border border-slate-200/80 bg-white px-5 py-4",
    )
    expect(source).toContain(
      "flex flex-col gap-4 lg:flex-row lg:items-center",
    )
    expect(source).toContain("handleHeaderCaseSubmit")
    expect(source).toContain("handleHeaderRefreshClick")
    expect(source).toContain("/frame/investigation/artifacts")
    expect(source).toContain("handleBack")
  })

  it("prevents page-level horizontal overflow and uses the shared Card standard", () => {
    const source = readSource(`${FORENSIC_ROOT}/forensic-task-center-page.tsx`)

    expect(source).toContain(
      "min-h-dvh min-w-0 overflow-x-hidden bg-slate-50",
    )
    expect(source.match(/rounded-\[24px\] border border-slate-200 bg-white shadow-\[0_10px_28px_rgba\(15,23,42,0\.05\)\]/g)?.length).toBe(2)
    expect(source.match(/flex size-10 shrink-0 items-center justify-center rounded-xl/g)?.length).toBe(2)
    expect(source.match(/text-base font-medium leading-6 text-slate-950/g)?.length).toBe(2)
  })

  it("uses pill controls and a square gray table header inside the Card", () => {
    const source = readSource(`${FORENSIC_ROOT}/forensic-task-center-page.tsx`)

    expect(source).toContain(
      "min-w-0 flex-1 overflow-x-auto",
    )
    expect(source).toContain(
      "flex h-full min-w-[1680px] flex-col",
    )
    expect(source).toContain(
      "border-b border-slate-200 bg-slate-100 px-4 py-3",
    )
    expect(source).toContain(
      "h-9 rounded-full border-slate-200 bg-slate-50 pl-9",
    )
    expect(source).toContain("size-9 shrink-0 rounded-full")
    expect(source).toContain("size-8 rounded-full")
  })

  it("uses 16px internal panels and pill form controls in the create workspace", () => {
    const source = readSource(`${FORENSIC_ROOT}/forensic-create-task-dialog.tsx`)

    expect(source.match(/rounded-2xl border border-slate-200 bg-slate-50\/70 p-4/g)?.length).toBe(2)
    expect(source).toContain(
      "overflow-hidden rounded-2xl border border-slate-200 bg-white",
    )
    expect(source).toContain('className="h-9 rounded-full bg-white pl-9"')
    expect(source).toContain('className="h-9 rounded-full bg-white"')
    expect(source).toContain(
      'className="rounded-full bg-slate-950 text-white hover:bg-slate-800"',
    )
  })

  it("preserves task loading, creation, cancellation, deletion, download, filtering, and paging", () => {
    const pageSource = readSource(`${FORENSIC_ROOT}/forensic-task-center-page.tsx`)
    const createSource = readSource(`${FORENSIC_ROOT}/forensic-create-task-dialog.tsx`)

    for (const token of [
      "listForensicTasks",
      "cancelForensicTask",
      "deleteForensicTask",
      "downloadForensicTaskFlowZip",
      "handleHeaderCaseSubmit",
      "setKeyword",
      "setStatus",
      "setPage",
      "taskDetailHref",
      "window.confirm",
      "void refresh()",
    ]) {
      expect(pageSource).toContain(token)
    }

    expect(createSource).toContain("createForensicTask")
    expect(createSource).toContain("handleFormSubmit")
    expect(createSource).toContain("onCreated")
  })

  it("keeps every supported route query parameter and status filter", () => {
    const routeSource = readSource("app/frame/investigation/tasks/page.tsx")

    for (const token of [
      "case_id",
      "caseId",
      "caseid",
      "workflow_id",
      "workflow_action_id",
      "agent_id",
      "endpoint_id",
      "artifact_key",
      "velociraptor_client_id",
      "task_id",
      "action",
      "return_to",
      "returnTo",
      "snapshot_id",
      "snapshotId",
      "queue_page",
      "queuePage",
      "tenant_id",
      "tenantId",
    ]) {
      expect(routeSource).toContain(token)
    }

    for (const status of [
      "pending",
      "running",
      "success",
      "failed",
      "canceled",
      "timeout",
    ]) {
      expect(routeSource).toContain(`"${status}"`)
    }
  })
})
