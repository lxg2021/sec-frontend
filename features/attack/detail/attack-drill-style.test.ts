import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

function readSource(file: string) {
  return fs.readFileSync(path.resolve(process.cwd(), file), "utf8")
}

describe("attack drill visual hierarchy", () => {
  it("uses the established responsive page and search Card", () => {
    const pageSource = readSource("app/frame/attack/drill/page.tsx")

    expect(pageSource).toContain(
      "min-h-dvh min-w-0 overflow-x-hidden bg-slate-50",
    )
    expect(pageSource).toContain(
      "min-w-0 space-y-4 py-3 pl-[4.75rem] pr-3 sm:p-4 xl:space-y-5 xl:p-6",
    )
    expect(pageSource).toContain(
      "rounded-[24px] border border-slate-200/80 bg-white",
    )
    expect(pageSource).toContain(
      "shadow-[0_10px_28px_rgba(15,23,42,0.05)]",
    )
    expect(pageSource).toContain("rounded-full bg-blue-600")
  })

  it("keeps every attack story state on the shared Card hierarchy", () => {
    const renderSource = readSource(
      "features/attack/detail/components/attack-case-story-timeline-render.tsx",
    )
    const primaryCardClass =
      "rounded-[24px] border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]"

    expect(renderSource.split(primaryCardClass).length - 1).toBeGreaterThanOrEqual(5)
    expect(renderSource).toContain(
      "text-base font-medium leading-6 text-slate-950",
    )
    expect(renderSource).toContain("text-xs leading-5 text-slate-500")
    expect(renderSource).not.toContain(
      "rounded-lg border-slate-200 bg-white shadow-sm",
    )
  })

  it("uses restrained icons, internal panels, and a square gray timeline header", () => {
    const viewSource = readSource(
      "features/attack/detail/components/attack-case-story-timeline-view.tsx",
    )

    expect(viewSource).toContain(
      "flex size-10 shrink-0 items-center justify-center rounded-xl",
    )
    expect(viewSource).toContain('<Icon className="size-5" />')
    expect(viewSource).toContain(
      "min-w-0 rounded-2xl border bg-white px-4 py-3",
    )
    expect(viewSource).toContain(
      "overflow-hidden rounded-2xl border border-slate-200 bg-white",
    )
    expect(viewSource).toContain("rounded-none border-b border-slate-200 bg-slate-100")
    expect(viewSource).toContain('className="overflow-x-auto"')
    expect(viewSource).toContain("min-w-[900px]")
  })

  it("keeps the host detail Dialog inside narrow viewports", () => {
    const viewSource = readSource(
      "features/attack/detail/components/attack-case-story-timeline-view.tsx",
    )

    expect(viewSource).toContain("w-[calc(100vw-2rem)] max-w-[600px]")
    expect(viewSource).toContain("[&>button]:rounded-full")
    expect(viewSource).toContain("m-0 w-full max-w-none overflow-hidden rounded-[24px]")
    expect(viewSource).not.toContain("min-w-[420px]")
  })

  it("aligns the investigation assistant and attack graph with the same Card standard", () => {
    const assistantSource = readSource(
      "features/investigation-assistant/components/investigation-assistant.tsx",
    )
    const assistantPanelSource = readSource(
      "features/investigation-assistant/components/investigation-assistant-panel.tsx",
    )
    const graphCardSource = readSource(
      "features/attack/dgraph/components/attack-graph-case-card.tsx",
    )
    const graphFlowSource = readSource(
      "features/attack/dgraph/components/attack-graph-flow.tsx",
    )

    for (const source of [assistantSource, assistantPanelSource, graphCardSource]) {
      expect(source).toContain("rounded-[24px]")
      expect(source).toContain(
        "shadow-[0_10px_28px_rgba(15,23,42,0.05)]",
      )
    }

    for (const source of [assistantSource, assistantPanelSource, graphFlowSource]) {
      expect(source).toContain(
        "size-10 shrink-0 items-center justify-center rounded-xl",
      )
      expect(source).toContain("text-base font-medium leading-6 text-slate-950")
    }

    expect(assistantSource).toContain(
      "minmax(min(100%,320px),1fr)",
    )
    expect(graphCardSource).toContain("h-10 rounded-full bg-white")
    expect(graphFlowSource).toContain(
      "w-full min-w-0 sm:w-auto sm:max-w-full",
    )
  })

  it("preserves drill loading, navigation, graph, investigation, and remediation flows", () => {
    const pageSource = readSource("app/frame/attack/drill/page.tsx")
    const renderSource = readSource(
      "features/attack/detail/components/attack-case-story-timeline-render.tsx",
    )
    const viewSource = readSource(
      "features/attack/detail/components/attack-case-story-timeline-view.tsx",
    )

    for (const token of [
      "handleCaseSearch",
      "caseId",
      "snapshotId",
      "workflowId",
      "returnTo",
      "queuePage",
      "InvestigationAssistantPanel",
      "AttackGraphCaseCard",
      "AttackGraphControlPanel",
      "RemediationOrderTitleDialog",
      "handleGraphMenuAction",
      "handleOpenRemediationOrchestration",
    ]) {
      expect(pageSource).toContain(token)
    }

    for (const token of [
      "fetchAttackCaseTimeline",
      "batchDescribeEventSourcesByKeys",
      "buildAttackDetailHref",
    ]) {
      expect(renderSource).toContain(token)
    }

    for (const token of [
      "getSingleHostDetail",
      "getHardwareInfo",
      "RuleInfoPopover",
      "techniqueHref",
    ]) {
      expect(viewSource).toContain(token)
    }
  })
})
