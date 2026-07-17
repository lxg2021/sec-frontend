"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  CheckCircle2,
  FileSliders,
  FileText,
  ListChecks,
  LoaderCircle,
  Network,
  PlaySquare,
  Plus,
  RefreshCw,
  Send,
  Server,
  ShieldCheck,
  Users,
} from "lucide-react"
import { useLocale } from "next-intl"
import { toast } from "sonner"

import {
  applyAccessControlPolicy,
  createAccessControlPolicy,
  getAccessControlDraftFingerprint,
  validateAccessControlDraft,
} from "../api"
import { getAccessControlCopy, type AccessControlCopy } from "../access-control-copy"
import { createEmptySubject, createInitialAccessControlDraft } from "../access-control-options"
import type {
  AccessControlOperation,
  AccessControlPolicyDraft,
  AccessPolicyType,
  CreatedAccessControlPolicy,
} from "../access-control-types"
import { HashEditor } from "./hash-editor"
import { MultiValueInput } from "./multi-value-input"
import { NetworkEditor } from "./network-editor"
import { RuleEditor } from "./rule-editor"
import { SubjectEditor } from "./subject-editor"
import HostSelector from "@/shared/components/host-selector"
import { getHostSelectorTree } from "@/shared/components/host-selector/api"
import type { HostSelectorHostNode, HostSelectorTreeNode } from "@/shared/components/host-selector/types"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

const POLICY_ICONS = {
  file: FileText,
  registry: ListChecks,
  process: PlaySquare,
  network: Network,
}

export function AccessControlWizard() {
  const locale = useLocale()
  const copy = useMemo(() => getAccessControlCopy(locale), [locale])
  const [draft, setDraft] = useState<AccessControlPolicyDraft>(() => createInitialAccessControlDraft())
  const [hostTree, setHostTree] = useState<HostSelectorTreeNode[]>([])
  const [hostsLoading, setHostsLoading] = useState(true)
  const [hostsError, setHostsError] = useState("")
  const [selectorKey, setSelectorKey] = useState(0)
  const [selectedHosts, setSelectedHosts] = useState<HostSelectorHostNode[]>([])
  const [createdPolicy, setCreatedPolicy] = useState<CreatedAccessControlPolicy | null>(null)
  const [createdDraftFingerprint, setCreatedDraftFingerprint] = useState("")
  const [operation, setOperation] = useState<AccessControlOperation | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const loadHosts = useCallback(async () => {
    setHostsLoading(true)
    setHostsError("")
    try {
      const result = await getHostSelectorTree()
      setHostTree(result as HostSelectorTreeNode[])
    } catch (error) {
      setHostTree([])
      setHostsError(error instanceof Error ? error.message : copy.loadHostsFailed)
    } finally {
      setHostsLoading(false)
    }
  }, [copy.loadHostsFailed])

  useEffect(() => {
    void loadHosts()
  }, [loadHosts])

  const updateDraft = useCallback((patch: Partial<AccessControlPolicyDraft>) => {
    setDraft((current) => ({ ...current, ...patch }))
    setOperation(null)
  }, [])

  const changePolicyType = useCallback((type: AccessPolicyType) => {
    setDraft((current) => ({
      ...current,
      type,
      objectPaths: [],
      objectHashes: [],
      rules: [],
    }))
    setCreatedPolicy(null)
    setCreatedDraftFingerprint("")
    setOperation(null)
  }, [])

  const handleHostSelection = useCallback((hosts: HostSelectorHostNode[]) => {
    const unique = Array.from(new Map(hosts.map((host) => [host.hostId || host.id, host])).values())
    setSelectedHosts(unique)
    setOperation(null)
  }, [])

  const validationErrors = useMemo(() => validateAccessControlDraft(draft), [draft])
  const draftValid = validationErrors.length === 0
  const currentFingerprint = useMemo(
    () => (draftValid ? getAccessControlDraftFingerprint(draft) : ""),
    [draft, draftValid],
  )
  const retryOnly = Boolean(
    createdPolicy && createdDraftFingerprint && createdDraftFingerprint === currentFingerprint && !operation,
  )
  const canSubmit = draftValid && selectedHosts.length > 0 && !submitting && !operation

  const offlineHostCount = useMemo(
    () => selectedHosts.filter((host) => host.status.trim().toLowerCase() === "offline").length,
    [selectedHosts],
  )

  const handleConfirm = useCallback(async () => {
    const errors = validateAccessControlDraft(draft)
    if (errors.length > 0 || selectedHosts.length === 0) {
      toast.error(copy.validationFailed, {
        description: errors.length > 0 ? validationDescription(copy, draft.type, errors) : copy.noHosts,
      })
      return
    }

    setSubmitting(true)
    const toastId = toast.loading(copy.submitting)

    try {
      const fingerprint = getAccessControlDraftFingerprint(draft)
      let policy = createdPolicy
      if (!policy || createdDraftFingerprint !== fingerprint) {
        policy = await createAccessControlPolicy(draft)
        setCreatedPolicy(policy)
        setCreatedDraftFingerprint(fingerprint)
      }

      const result = await applyAccessControlPolicy(
        policy,
        selectedHosts.map((host) => host.hostId || host.id),
      )
      setOperation(result)
      toast.success(copy.dispatchSuccess, { id: toastId })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      toast.error(message, { id: toastId })
    } finally {
      setSubmitting(false)
    }
  }, [copy, createdDraftFingerprint, createdPolicy, draft, selectedHosts])

  const reset = () => {
    const hasUnsavedContent = isAccessControlDraftDirty(draft) || selectedHosts.length > 0 || Boolean(createdPolicy)
    if (hasUnsavedContent && !window.confirm(copy.resetConfirm)) return

    setDraft(createInitialAccessControlDraft())
    setSelectedHosts([])
    setSelectorKey((value) => value + 1)
    setCreatedPolicy(null)
    setCreatedDraftFingerprint("")
    setOperation(null)
  }

  return (
    <div className="h-full min-h-0 overflow-hidden bg-slate-100 p-4">
      <div className="flex h-full min-h-0 flex-col gap-3">
        <header className="flex shrink-0 items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-slate-950">{copy.pageTitle}</h1>
              <p className="truncate text-xs text-slate-500">{copy.pageDescription}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 2xl:flex">
              <FlowBadge
                number={1}
                title={copy.createObject}
                description="PMC Catalog"
                done={Boolean(createdPolicy)}
              />
              <div className="mx-2 h-px w-7 bg-slate-300" />
              <FlowBadge
                number={2}
                title={`${copy.applyHosts} · ${selectedHosts.length}`}
                description="PMC Operation"
                done={Boolean(operation)}
              />
            </div>
            <Button variant="outline" onClick={reset} className="h-10 shrink-0 px-4">
              <Plus className="mr-2 h-4 w-4" />
              {copy.reset}
            </Button>
            <Button
              onClick={() => void handleConfirm()}
              disabled={!canSubmit}
              className="h-10 min-w-56 shrink-0 bg-blue-600 px-5 text-white hover:bg-blue-700"
            >
              {submitting ? (
                <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />{copy.submitting}</>
              ) : retryOnly ? (
                <><RefreshCw className="mr-2 h-4 w-4" />{copy.retryDispatch}</>
              ) : (
                <><Send className="mr-2 h-4 w-4" />{copy.confirmDispatch} · {selectedHosts.length}</>
              )}
            </Button>
          </div>
        </header>

        <PolicyDefinitionBar
          copy={copy}
          draft={draft}
          onChange={updateDraft}
          onTypeChange={changePolicyType}
        />

        <main className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1.62fr)_minmax(440px,1fr)]">
          <PolicyConfigurationPanel copy={copy} draft={draft} onChange={updateDraft} />

          <HostPanel
            copy={copy}
            data={hostTree}
            loading={hostsLoading}
            error={hostsError}
            selectorKey={selectorKey}
            selectedHosts={selectedHosts}
            offlineHostCount={offlineHostCount}
            onSelectionChange={handleHostSelection}
            onReload={() => void loadHosts()}
          />
        </main>
      </div>
    </div>
  )
}

function PolicyConfigurationPanel({
  copy,
  draft,
  onChange,
}: {
  copy: AccessControlCopy
  draft: AccessControlPolicyDraft
  onChange: (patch: Partial<AccessControlPolicyDraft>) => void
}) {
  const PolicyIcon = POLICY_ICONS[draft.type]

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-5 py-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600">
          <PolicyIcon className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-950">{copy.policyTypes[draft.type][0]}</h2>
          <p className="mt-0.5 truncate text-[11px] text-slate-500">{copy.policyTypes[draft.type][1]}</p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {draft.type === "network" ? (
          <div className="p-5">
            <NetworkEditor copy={copy} value={draft.network} onChange={(network) => onChange({ network })} />
          </div>
        ) : (
          <div className="flex min-h-full flex-col">
            <div className="grid lg:grid-cols-2 lg:divide-x lg:divide-slate-200">
              <SubjectPanel copy={copy} draft={draft} onChange={onChange} />
              <ObjectPanel copy={copy} draft={draft} onChange={onChange} />
            </div>
            <section className="flex min-h-[260px] flex-1 flex-col border-t border-slate-200 p-5">
              <ConfigurationSectionHeader
                icon={FileSliders}
                title={copy.rules}
                description={copy.rulesHint}
              />
              <RuleEditor
                copy={copy}
                type={draft.type}
                rules={draft.rules}
                onChange={(rules) => onChange({ rules })}
              />
            </section>
          </div>
        )}
      </div>
    </section>
  )
}

function PolicyDefinitionBar({
  copy,
  draft,
  onChange,
  onTypeChange,
}: {
  copy: AccessControlCopy
  draft: AccessControlPolicyDraft
  onChange: (patch: Partial<AccessControlPolicyDraft>) => void
  onTypeChange: (type: AccessPolicyType) => void
}) {
  return (
    <section className="shrink-0 rounded-xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm">
      <div className="grid items-center gap-4 xl:grid-cols-[180px_minmax(0,1fr)]">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-950">{copy.basicInfo}</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">{copy.policyTypeHint}</p>
        </div>
        <div className="grid min-w-0 grid-cols-4 rounded-lg border border-slate-200 bg-slate-50 p-1">
          {(Object.keys(copy.policyTypes) as AccessPolicyType[]).map((type) => {
            const Icon = POLICY_ICONS[type]
            const active = draft.type === type
            return (
              <button
                key={type}
                type="button"
                aria-pressed={active}
                title={copy.policyTypes[type][1]}
                onClick={() => onTypeChange(type)}
                className={`flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  active
                    ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-600 hover:bg-white hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate">{copy.policyTypes[type][0]}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 border-t border-slate-200 pt-3 xl:grid-cols-[minmax(320px,1.5fr)_180px_minmax(240px,0.75fr)]">
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor="access-policy-name" className="text-xs font-medium text-slate-700">
            {copy.policyName}
            <span className="ml-1 text-red-500">*</span>
          </Label>
          <Input
            id="access-policy-name"
            value={draft.name}
            onChange={(event) => onChange({ name: event.target.value })}
            placeholder={copy.policyNamePlaceholder}
            className="h-9 min-w-0"
            maxLength={128}
          />
        </div>
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor="access-policy-version" className="text-xs font-medium text-slate-700">
            {copy.version}
            <span className="ml-1 text-red-500">*</span>
          </Label>
          <Input
            id="access-policy-version"
            value={draft.version}
            onChange={(event) => onChange({ version: event.target.value })}
            placeholder="1.0.0"
            className="h-9 min-w-0 font-mono"
            maxLength={64}
          />
        </div>
        <div className="min-w-0 space-y-1.5">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <Label htmlFor="access-policy-priority" className="shrink-0 text-xs font-medium text-slate-700">
              {copy.priority}
              <span className="ml-1 text-red-500">*</span>
            </Label>
            <span className="truncate text-[10px] text-slate-400" title={copy.priorityHint}>
              {copy.priorityHint}
            </span>
          </div>
          <Input
            id="access-policy-priority"
            type="number"
            min={0}
            max={255}
            value={draft.priority}
            onChange={(event) => onChange({ priority: Number(event.target.value) })}
            className="h-9 min-w-0 font-mono"
          />
        </div>
      </div>
    </section>
  )
}

function SubjectPanel({
  copy,
  draft,
  onChange,
}: {
  copy: AccessControlCopy
  draft: AccessControlPolicyDraft
  onChange: (patch: Partial<AccessControlPolicyDraft>) => void
}) {
  return (
    <section className="min-w-0 p-5">
      <ConfigurationSectionHeader
        icon={Users}
        title={copy.subject}
        description={copy.subjectHint}
        action={
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 border-slate-200 bg-white text-xs text-blue-700 shadow-sm hover:border-blue-200 hover:bg-blue-50"
          onClick={() => onChange({ subjects: [...draft.subjects, createEmptySubject()] })}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          {copy.addSubject}
        </Button>
        }
      />
      <div className="space-y-2">
        {draft.subjects.map((subject, index) => (
          <SubjectEditor
            key={subject.id}
            copy={copy}
            subject={subject}
            canRemove={draft.subjects.length > 1}
            onChange={(next) => {
              const subjects = [...draft.subjects]
              subjects[index] = next
              onChange({ subjects })
            }}
            onRemove={() => onChange({ subjects: draft.subjects.filter((item) => item.id !== subject.id) })}
          />
        ))}
        <details className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2">
          <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-medium text-slate-600">
            <span>{copy.exceptions}</span>
            <span className="font-normal text-slate-400">{draft.exceptions.length || copy.exceptionsHint}</span>
          </summary>
          <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
            {draft.exceptions.length === 0 ? <p className="text-xs text-slate-400">{copy.noExceptions}</p> : null}
            {draft.exceptions.map((subject, index) => (
              <SubjectEditor
                key={subject.id}
                copy={copy}
                subject={subject}
                canRemove
                onChange={(next) => {
                  const exceptions = [...draft.exceptions]
                  exceptions[index] = next
                  onChange({ exceptions })
                }}
                onRemove={() => onChange({ exceptions: draft.exceptions.filter((item) => item.id !== subject.id) })}
              />
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => onChange({ exceptions: [...draft.exceptions, createEmptySubject()] })}>
              <Plus className="mr-1 h-3.5 w-3.5" />{copy.addException}
            </Button>
          </div>
        </details>
      </div>
    </section>
  )
}

function ObjectPanel({
  copy,
  draft,
  onChange,
}: {
  copy: AccessControlCopy
  draft: AccessControlPolicyDraft
  onChange: (patch: Partial<AccessControlPolicyDraft>) => void
}) {
  if (draft.type === "network") return null

  return (
    <section className="min-w-0 p-5">
      <ConfigurationSectionHeader
        icon={ShieldCheck}
        title={copy.object}
        description={copy.objectHints[draft.type]}
      />
      <Label className="mb-2 block text-xs font-medium text-slate-700">{copy.objectLabels[draft.type]}</Label>
      <MultiValueInput
        value={draft.objectPaths}
        onChange={(objectPaths) => onChange({ objectPaths })}
        placeholder={copy.objectPlaceholders[draft.type]}
      />
      {draft.type === "process" ? (
        <details className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2">
          <summary className="cursor-pointer list-none text-xs font-medium text-slate-600">
            {copy.hashes}
            <span className="ml-2 font-normal text-slate-400">{draft.objectHashes.length || ""}</span>
          </summary>
          <HashEditor
            copy={copy}
            hashes={draft.objectHashes}
            onChange={(objectHashes) => onChange({ objectHashes })}
            className="mt-3"
          />
        </details>
      ) : null}
    </section>
  )
}

function ConfigurationSectionHeader({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof Users
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <header className="mb-4 flex min-w-0 items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-blue-600">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="mt-0.5 truncate text-[11px] text-slate-500">{description}</p>
        </div>
      </div>
      {action}
    </header>
  )
}

function HostPanel({
  copy,
  data,
  loading,
  error,
  selectorKey,
  selectedHosts,
  offlineHostCount,
  onSelectionChange,
  onReload,
}: {
  copy: AccessControlCopy
  data: HostSelectorTreeNode[]
  loading: boolean
  error: string
  selectorKey: number
  selectedHosts: HostSelectorHostNode[]
  offlineHostCount: number
  onSelectionChange: (nodes: HostSelectorHostNode[]) => void
  onReload: () => void
}) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600">
            <Server className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-950">{copy.hostTitle}</h2>
            <p className="mt-0.5 truncate text-[11px] text-slate-500">{copy.hostHint}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
            {copy.selectedHosts(selectedHosts.length)}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onReload} disabled={loading} aria-label={copy.retry}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col bg-slate-50/50 p-3">
        {error ? (
          <Alert variant="destructive" className="mb-3 shrink-0 py-2">
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

      <div className="grid shrink-0 grid-cols-2 divide-x divide-slate-200 border-t border-slate-200 bg-white px-4 py-3">
        <Metric label={copy.targetHostCount} value={selectedHosts.length} tone="blue" />
        <Metric label={copy.offlineHostCount} value={offlineHostCount} tone="amber" />
      </div>
    </section>
  )
}

function FlowBadge({ number, title, description, done }: { number: number; title: string; description: string; done: boolean }) {
  return (
    <div className="flex w-44 shrink-0 items-center gap-2 px-1 py-0.5">
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${done ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : number}
      </span>
      <div className="min-w-0">
        <div className="truncate text-[11px] font-semibold text-slate-800">{title}</div>
        <div className="text-[9px] text-slate-400">{description}</div>
      </div>
    </div>
  )
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "blue" | "amber" }) {
  return (
    <div className="flex items-baseline justify-center gap-2 px-3">
      <span className={`text-lg font-bold tabular-nums ${tone === "blue" ? "text-blue-700" : "text-amber-700"}`}>{value}</span>
      <span className="truncate text-[11px] text-slate-500">{label}</span>
    </div>
  )
}

function validationDescription(copy: AccessControlCopy, type: AccessPolicyType, errors: string[]) {
  if (errors.some((error) => error.startsWith("POLICY_"))) return copy.basicValidation
  if (type === "network") return copy.networkValidation
  return copy.ruleValidation
}

function isAccessControlDraftDirty(draft: AccessControlPolicyDraft) {
  const network = draft.network
  return Boolean(
    draft.type !== "file" ||
    draft.name.trim() ||
    draft.version !== "1.0.0" ||
    draft.priority !== 150 ||
    draft.subjects.length !== 1 ||
    draft.subjects.some((subject) =>
      subject.paths.some((path) => path.trim()) ||
      subject.hashes.some((hash) => hash.value.trim()) ||
      subject.accounts.some((account) => account.sid.trim() || account.user_name?.trim() || account.group_name?.trim()),
    ) ||
    draft.exceptions.length > 0 ||
    draft.objectPaths.length > 0 ||
    draft.objectHashes.length > 0 ||
    draft.rules.length > 0 ||
    network.direction !== "in" ||
    network.action !== "block" ||
    network.profile !== "any" ||
    network.protocol !== "tcp" ||
    network.localPort !== "any" ||
    network.remotePort !== "any" ||
    network.localAddress !== "any" ||
    network.remoteAddress !== "any" ||
    network.programPath.trim() ||
    network.programMd5.trim()
  )
}
