"use client"

import { useState, type FormEvent } from "react"
import { Search } from "lucide-react"
import { useTranslations } from "next-intl"

import AttackReport from "@/features/ai-ops/threat-analysis/components/attack-report"
import { sampleAttackAIReportTask } from "@/features/ai-ops/threat-analysis/fixtures"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"

function CaseIdSearchToolbar() {
  const t = useTranslations("pages.aiops.threatAnalysis.search")
  const [caseId, setCaseId] = useState("")

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  return (
    <section className="mx-auto w-full max-w-[120rem] rounded-[24px] border border-slate-200/80 bg-white px-4 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.07)]">
      <form
        className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center"
        onSubmit={handleSubmit}
      >
        <div className="flex h-11 min-w-0 w-full flex-1 items-center rounded-full border border-slate-200 bg-slate-50/80 pl-3 pr-1 shadow-inner shadow-slate-100/70">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <Input
            value={caseId}
            onChange={(event) => setCaseId(event.target.value)}
            placeholder={t("caseIdPlaceholder")}
            aria-label="CaseID"
            spellCheck={false}
            className="h-9 min-w-0 flex-1 border-0 bg-transparent px-2 font-mono text-sm font-semibold text-slate-900 shadow-none placeholder:font-sans placeholder:font-medium placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button
            type="submit"
            className="h-9 shrink-0 rounded-full bg-blue-600 px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Search className="size-4" />
            {t("submit")}
          </Button>
        </div>
      </form>
    </section>
  )
}

export default function ThreatAnalysisPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="space-y-6 px-6 pb-6 pt-2">
        <CaseIdSearchToolbar />
        <AttackReport task={sampleAttackAIReportTask} />
      </div>
    </main>
  )
}
