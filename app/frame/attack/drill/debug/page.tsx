"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useTranslations } from "next-intl"
import { Search, Workflow } from "lucide-react"

import { AttackWorkflowControlCenter } from "@/features/attack/workflow-center/components/attack-workflow-control-center"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"

function readInitialParam(...keys: string[]) {
  if (typeof window === "undefined") return ""
  const params = new URLSearchParams(window.location.search)

  for (const key of keys) {
    const value = params.get(key)?.trim()
    if (value) return value
  }

  return ""
}

export default function AttackWorkflowDebugPage() {
  const t = useTranslations("pages.attack.dashboard.workflow.debug")
  const [caseId, setCaseId] = useState("")
  const [workflowId, setWorkflowId] = useState("")
  const [caseIdInput, setCaseIdInput] = useState("")
  const [workflowIdInput, setWorkflowIdInput] = useState("")

  useEffect(() => {
    const initialCaseId = readInitialParam("caseId", "case_id")
    const initialWorkflowId = readInitialParam("workflowId", "workflow_id")
    setCaseId(initialCaseId)
    setWorkflowId(initialWorkflowId)
    setCaseIdInput(initialCaseId)
    setWorkflowIdInput(initialWorkflowId)
  }, [])

  function applyQuery(nextCaseId: string, nextWorkflowId: string) {
    const normalizedCaseId = nextCaseId.trim()
    const normalizedWorkflowId = nextWorkflowId.trim()
    const params = new URLSearchParams(window.location.search)

    if (normalizedCaseId) {
      params.set("caseId", normalizedCaseId)
      params.delete("case_id")
    } else {
      params.delete("caseId")
      params.delete("case_id")
    }

    if (normalizedWorkflowId) {
      params.set("workflowId", normalizedWorkflowId)
      params.delete("workflow_id")
    } else {
      params.delete("workflowId")
      params.delete("workflow_id")
    }

    const query = params.toString()
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}`,
    )
    setCaseId(normalizedCaseId)
    setWorkflowId(normalizedWorkflowId)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    applyQuery(caseIdInput, workflowIdInput)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6">
        <section className="rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="mb-4 flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <Workflow className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold leading-6 text-slate-950">
                {t("title")}
              </h1>
              <p className="mt-1 text-sm leading-5 text-slate-500">
                {t("description")}
              </p>
            </div>
          </div>

          <form
            className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_max-content]"
            onSubmit={handleSubmit}
          >
            <Input
              value={caseIdInput}
              onChange={(event) => setCaseIdInput(event.target.value)}
              placeholder={t("caseIdPlaceholder")}
              spellCheck={false}
              className="h-10 rounded-lg border-slate-200 font-mono text-sm"
            />
            <Input
              value={workflowIdInput}
              onChange={(event) => setWorkflowIdInput(event.target.value)}
              placeholder={t("workflowIdPlaceholder")}
              spellCheck={false}
              className="h-10 rounded-lg border-slate-200 font-mono text-sm"
            />
            <Button
              type="submit"
              className="h-10 rounded-full bg-blue-600 px-4 text-white hover:bg-blue-700"
            >
              <Search className="size-4" />
              {t("load")}
            </Button>
          </form>
        </section>

        <AttackWorkflowControlCenter
          caseId={caseId}
          workflowId={workflowId}
        />
      </div>
    </div>
  )
}
