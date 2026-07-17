"use client"

import { ArrowRight, ChevronLeft, RefreshCw, Server } from "lucide-react"

import type { AccessControlCopy } from "../access-control-copy"
import type { HostSelectorHostNode, HostSelectorTreeNode } from "@/shared/components/host-selector/types"
import HostSelector from "@/shared/components/host-selector"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"

interface AccessHostStepProps {
  copy: AccessControlCopy
  data: HostSelectorTreeNode[]
  loading: boolean
  error: string
  selectorKey: number
  selectedHostCount: number
  onSelectionChange: (nodes: HostSelectorHostNode[]) => void
  onReload: () => void
  onBack: () => void
  onNext: () => void
}

export function AccessHostStep({
  copy,
  data,
  loading,
  error,
  selectorKey,
  selectedHostCount,
  onSelectionChange,
  onReload,
  onBack,
  onNext,
}: AccessHostStepProps) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Server className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{copy.hostTitle}</h2>
            <p className="mt-0.5 text-sm text-slate-500">{copy.hostHint}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            {copy.selectedHosts(selectedHostCount)}
          </span>
          <Button variant="outline" size="sm" onClick={onReload} disabled={loading}>
            <RefreshCw className={loading ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
            {copy.retry}
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col p-5">
        {error ? (
          <Alert variant="destructive" className="mb-4 shrink-0">
            <AlertTitle>{copy.loadHostsFailed}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <HostSelector
          key={selectorKey}
          data={data}
          loading={loading}
          fillAvailableHeight
          showHeader={false}
          emptyText={loading ? copy.loadingHosts : copy.noHosts}
          onSelectionChange={(nodes) => {
            const hosts = nodes.filter((node): node is HostSelectorHostNode => node.type === "host")
            onSelectionChange(hosts)
          }}
          text={{
            title: copy.hostTitle,
            searchPlaceholder: copy.searchHosts,
            selectAll: copy.selectAll,
            clear: copy.clearSelection,
            searchResults: copy.searchResults,
            clearSearch: copy.clearSearch,
            selectedSummary: (_total, hostCount) => copy.selectedHosts(hostCount),
          }}
        />
      </div>

      <footer className="flex shrink-0 items-center justify-between border-t border-slate-200 px-6 py-4">
        <Button variant="outline" onClick={onBack} className="h-11 px-5">
          <ChevronLeft className="mr-2 h-4 w-4" />
          {copy.previous}
        </Button>
        <div className="flex items-center gap-3">
          {selectedHostCount === 0 ? <span className="text-xs text-amber-700">{copy.noHosts}</span> : null}
          <Button onClick={onNext} disabled={selectedHostCount === 0} className="h-11 bg-blue-600 px-6 text-white hover:bg-blue-700">
            {copy.nextReview}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </footer>
    </section>
  )
}
