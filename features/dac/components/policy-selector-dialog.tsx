"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Check,
  FileText,
  LibraryBig,
  ListChecks,
  LoaderCircle,
  Network,
  PlaySquare,
  RefreshCw,
  Search,
} from "lucide-react"

import { listExistingAccessControlPolicies } from "../api"
import type { AccessControlCopy } from "../access-control-copy"
import type { AccessPolicyType, ExistingAccessControlPolicy } from "../access-control-types"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"

const POLICY_ICONS = {
  file: FileText,
  registry: ListChecks,
  process: PlaySquare,
  network: Network,
}

interface PolicySelectorDialogProps {
  copy: AccessControlCopy
  open: boolean
  selectedPolicy: ExistingAccessControlPolicy | null
  onOpenChange: (open: boolean) => void
  onSelect: (policy: ExistingAccessControlPolicy) => boolean | void
}

export function PolicySelectorDialog({
  copy,
  open,
  selectedPolicy,
  onOpenChange,
  onSelect,
}: PolicySelectorDialogProps) {
  const [policies, setPolicies] = useState<ExistingAccessControlPolicy[]>([])
  const [candidate, setCandidate] = useState<ExistingAccessControlPolicy | null>(selectedPolicy)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const loadPolicies = async () => {
    setLoading(true)
    setError("")
    try {
      setPolicies(await listExistingAccessControlPolicies())
    } catch (loadError) {
      setPolicies([])
      setError(loadError instanceof Error ? loadError.message : copy.loadPoliciesFailed)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    setCandidate(selectedPolicy)
    setQuery("")
    void loadPolicies()
    // Loading is intentionally tied to opening the dialog.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedPolicy])

  const filteredPolicies = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    if (!normalizedQuery) return policies
    return policies.filter((policy) =>
      [policy.name, policy.objectId, policy.version, copy.policyTypes[policy.policyType][0]]
        .some((value) => value.toLocaleLowerCase().includes(normalizedQuery)),
    )
  }, [copy.policyTypes, policies, query])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[78vh] max-w-4xl gap-0 overflow-hidden border-slate-200 bg-white p-0 shadow-2xl">
        <DialogHeader className="border-b border-slate-200 px-6 py-5 pr-14">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <LibraryBig className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-base text-slate-950">{copy.selectPolicyTitle}</DialogTitle>
              <DialogDescription className="mt-1 text-xs leading-5 text-slate-500">
                {copy.selectPolicyDescription}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.searchPolicies}
              className="h-10 bg-white pl-9"
              aria-label={copy.searchPolicies}
            />
          </div>
        </div>

        <div className="min-h-[360px] overflow-y-auto px-6 py-4">
          {loading ? (
            <PolicyDialogState icon={LoaderCircle} iconClassName="animate-spin" text={copy.loadingPolicies} />
          ) : error ? (
            <PolicyDialogState icon={RefreshCw} text={copy.loadPoliciesFailed}>
              <p className="max-w-xl text-center text-xs text-red-600">{error}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void loadPolicies()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {copy.retry}
              </Button>
            </PolicyDialogState>
          ) : filteredPolicies.length === 0 ? (
            <PolicyDialogState icon={LibraryBig} text={copy.noPolicies} />
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="grid grid-cols-[minmax(220px,1.3fr)_170px_100px_minmax(220px,1fr)_36px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] font-semibold text-slate-500">
                <span>{copy.policyName}</span>
                <span>{copy.policyType}</span>
                <span>{copy.version}</span>
                <span>{copy.objectId}</span>
                <span />
              </div>
              <div className="divide-y divide-slate-100">
                {filteredPolicies.map((policy) => (
                  <PolicyOption
                    key={policy.objectId}
                    copy={copy}
                    policy={policy}
                    selected={candidate?.objectId === policy.objectId}
                    onSelect={() => setCandidate(policy)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-slate-200 bg-slate-50/70 px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {copy.cancel}
          </Button>
          <Button
            type="button"
            disabled={!candidate || loading}
            onClick={() => {
              if (!candidate) return
              if (onSelect(candidate) !== false) onOpenChange(false)
            }}
            className="bg-slate-950 text-white hover:bg-slate-800"
          >
            <Check className="mr-2 h-4 w-4" />
            {copy.choosePolicy}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PolicyOption({
  copy,
  policy,
  selected,
  onSelect,
}: {
  copy: AccessControlCopy
  policy: ExistingAccessControlPolicy
  selected: boolean
  onSelect: () => void
}) {
  const Icon = POLICY_ICONS[policy.policyType]

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`grid w-full cursor-pointer grid-cols-[minmax(220px,1.3fr)_170px_100px_minmax(220px,1fr)_36px] items-center gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
        selected ? "bg-blue-50" : "bg-white hover:bg-slate-50"
      }`}
    >
      <span className="min-w-0 truncate text-sm font-semibold text-slate-900" title={policy.name}>
        {policy.name}
      </span>
      <span className="flex min-w-0 items-center gap-2 text-xs text-slate-600">
        <Icon className="h-4 w-4 shrink-0 text-blue-600" />
        <span className="truncate">{copy.policyTypes[policy.policyType][0]}</span>
      </span>
      <span className="font-mono text-xs text-slate-600">{policy.version}</span>
      <span className="truncate font-mono text-xs text-slate-500" title={policy.objectId}>{policy.objectId}</span>
      <span className={`flex h-5 w-5 items-center justify-center rounded-full ${selected ? "bg-blue-600 text-white" : "border border-slate-300 text-transparent"}`}>
        <Check className="h-3 w-3" />
      </span>
    </button>
  )
}

function PolicyDialogState({
  icon: Icon,
  iconClassName = "",
  text,
  children,
}: {
  icon: typeof LibraryBig
  iconClassName?: string
  text: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-slate-500">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <Icon className={`h-5 w-5 ${iconClassName}`} />
      </span>
      <p className="text-sm font-medium text-slate-700">{text}</p>
      {children}
    </div>
  )
}
