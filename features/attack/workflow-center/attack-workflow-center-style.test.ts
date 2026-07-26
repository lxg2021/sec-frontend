import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

function readSource(file: string) {
  return fs.readFileSync(path.resolve(process.cwd(), file), "utf8")
}

const COMPONENT_ROOT = "features/attack/workflow-center/components"

describe("attack workflow center visual hierarchy", () => {
  it("uses the established responsive page and primary Card hierarchy", () => {
    const centerSource = readSource(
      `${COMPONENT_ROOT}/attack-workflow-control-center.tsx`,
    )
    const queueSource = readSource(
      `${COMPONENT_ROOT}/attack-workflow-queue.tsx`,
    )
    const processSource = readSource(
      `${COMPONENT_ROOT}/attack-workflow-process-card.tsx`,
    )
    const workbenchSource = readSource(
      `${COMPONENT_ROOT}/attack-workflow-stage-workbench.tsx`,
    )
    const activitySource = readSource(
      `${COMPONENT_ROOT}/attack-workflow-activity-panel.tsx`,
    )
    const sharedHeaderSource = readSource(
      "features/attack/dashboard/components/attack-dashboard-header.tsx",
    )

    expect(centerSource).toContain(
      "min-h-[calc(100dvh-3rem)] min-w-0 w-full overflow-x-hidden bg-slate-50",
    )
    expect(centerSource).toContain(
      "grid min-h-0 min-w-0 w-full flex-1 grid-cols-[minmax(0,1fr)]",
    )

    for (const source of [
      queueSource,
      processSource,
      workbenchSource,
      activitySource,
    ]) {
      expect(source).toContain("rounded-[24px]")
      expect(source).toContain(
        "shadow-[0_10px_28px_rgba(15,23,42,0.05)]",
      )
    }

    expect(sharedHeaderSource).toContain(
      "flex flex-col gap-4 xl:flex-row xl:items-center",
    )
    expect(sharedHeaderSource).not.toContain(
      "flex flex-col gap-4 lg:flex-row lg:items-center",
    )
  })

  it("keeps Card headings restrained and controls consistently shaped", () => {
    const queueSource = readSource(
      `${COMPONENT_ROOT}/attack-workflow-queue.tsx`,
    )
    const processSource = readSource(
      `${COMPONENT_ROOT}/attack-workflow-process-card.tsx`,
    )
    const workbenchSource = readSource(
      `${COMPONENT_ROOT}/attack-workflow-stage-workbench.tsx`,
    )
    const activitySource = readSource(
      `${COMPONENT_ROOT}/attack-workflow-activity-panel.tsx`,
    )

    for (const source of [queueSource, processSource, workbenchSource]) {
      expect(source).toContain(
        "flex size-10 shrink-0 items-center justify-center rounded-xl",
      )
      expect(source).toContain("text-base font-medium")
    }

    expect(queueSource).toContain(
      "size-9 shrink-0 items-center justify-center rounded-full",
    )
    expect(queueSource).toContain(
      "h-9 w-full rounded-2xl border border-slate-200",
    )
    expect(queueSource).toContain(
      "grid grid-cols-3 gap-1 rounded-full bg-slate-100 p-1",
    )
    expect(activitySource).toContain(
      "grid h-auto w-full grid-cols-1 gap-1 rounded-full bg-slate-100 p-1",
    )
  })

  it("keeps activity tables square, gray, and internally scrollable", () => {
    const actionsSource = readSource(
      `${COMPONENT_ROOT}/attack-workflow-actions-table.tsx`,
    )
    const eventsSource = readSource(
      `${COMPONENT_ROOT}/attack-workflow-events-table.tsx`,
    )

    expect(actionsSource).toContain('Table className="min-w-[1120px]"')
    expect(eventsSource).toContain('Table className="min-w-[960px]"')
    expect(actionsSource).toContain(
      'TableHeader className="sticky top-0 z-10 bg-slate-100"',
    )
    expect(eventsSource).toContain(
      'TableHeader className="sticky top-0 z-10 bg-slate-100"',
    )
    expect(actionsSource).not.toContain(
      'hidden min-w-0 rounded-xl border border-slate-200 md:block',
    )
    expect(eventsSource).not.toContain(
      'hidden min-w-0 rounded-xl border border-slate-200 md:block',
    )
  })

  it("preserves workflow loading, navigation, filtering, and mutation flows", () => {
    const centerSource = readSource(
      `${COMPONENT_ROOT}/attack-workflow-control-center.tsx`,
    )
    const queueSource = readSource(
      `${COMPONENT_ROOT}/attack-workflow-queue.tsx`,
    )

    for (const token of [
      "listAttackWorkflows",
      "getAttackWorkflow",
      "getAttackWorkflowByCaseId",
      "createAttackWorkflowAction",
      "updateAttackWorkflowStatus",
      "selectQueueWorkflow",
      "updateQueueFilters",
      "changeQueuePage",
      "openStatusDialog",
    ]) {
      expect(centerSource).toContain(token)
    }

    for (const token of [
      "handleScope",
      "handleStatus",
      "handleSeverity",
      "handlePageChange",
      "onSelectWorkflow",
    ]) {
      expect(queueSource).toContain(token)
    }
  })
})
