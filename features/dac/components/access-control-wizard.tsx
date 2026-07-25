"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  CheckCircle2,
  FilePlus2,
  FileSliders,
  FileText,
  LibraryBig,
  ListChecks,
  LoaderCircle,
  LockKeyhole,
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
  buildAccessControlDraftFromExistingPolicy,
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
  ExistingAccessControlPolicy,
} from "../access-control-types"
import { HashEditor } from "./hash-editor"
import { MultiValueInput } from "./multi-value-input"
import { NetworkEditor } from "./network-editor"
import { PolicySelectorDialog } from "./policy-selector-dialog"
import { RuleEditor } from "./rule-editor"
import { SubjectEditor } from "./subject-editor"
import HostSelector from "@/shared/components/host-selector"
import { getHostSelectorTree } from "@/shared/components/host-selector/api"
import type { HostSelectorHostNode, HostSelectorTreeNode } from "@/shared/components/host-selector/types"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Slider } from "@/shared/ui/slider"

const POLICY_ICONS = {
  file: FileText,
  registry: ListChecks,
  process: PlaySquare,
  network: Network,
}

const POLICY_ICON_COLORS: Record<AccessPolicyType, string> = {
  file: "text-emerald-600",
  registry: "text-violet-600",
  process: "text-amber-600",
  network: "text-teal-600",
}

const POLICY_ACTIVE_COLOR = "bg-slate-950 text-white ring-slate-950"

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
  const [creating, setCreating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState<ExistingAccessControlPolicy | null>(null)
  const [policySelectorOpen, setPolicySelectorOpen] = useState(false)

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
    setCreatedPolicy(null)
    setCreatedDraftFingerprint("")
    setOperation(null)
  }, [])

  const changePolicyType = useCallback((type: AccessPolicyType) => {
    setDraft({ ...createInitialAccessControlDraft(), type })
    setCreatedPolicy(null)
    setSelectedPolicy(null)
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
  const policyCreatedFromCurrentDraft = Boolean(
    createdPolicy && createdDraftFingerprint && createdDraftFingerprint === currentFingerprint,
  )
  const canSubmit = Boolean(selectedPolicy || createdPolicy) && selectedHosts.length > 0 && !submitting && !operation

  const offlineHostCount = useMemo(
    () => selectedHosts.filter((host) => host.status.trim().toLowerCase() === "offline").length,
    [selectedHosts],
  )
  const onlineHostCount = useMemo(
    () => selectedHosts.filter((host) => host.status.trim().toLowerCase() === "online").length,
    [selectedHosts],
  )
  const invalidHostCount = useMemo(
    () => selectedHosts.filter((host) => !(host.hostId || "").trim()).length,
    [selectedHosts],
  )

  const handleCreatePolicy = useCallback(async () => {
    if (selectedPolicy) {
      setDraft(createInitialAccessControlDraft())
      setSelectedPolicy(null)
      setCreatedPolicy(null)
      setCreatedDraftFingerprint("")
      setSelectedHosts([])
      setSelectorKey((value) => value + 1)
      setOperation(null)
      return
    }

    const errors = validateAccessControlDraft(draft)
    if (errors.length > 0) {
      toast.error(copy.validationFailed, {
        description: validationDescription(copy, draft.type, errors),
      })
      return
    }

    setCreating(true)
    const toastId = toast.loading(copy.submitting)
    try {
      const policy = await createAccessControlPolicy(draft)
      setCreatedPolicy(policy)
      setCreatedDraftFingerprint(getAccessControlDraftFingerprint(draft))
      setOperation(null)
      toast.success(copy.createSuccess, { id: toastId })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      toast.error(message, { id: toastId })
    } finally {
      setCreating(false)
    }
  }, [copy, draft, selectedPolicy])

  const handleConfirm = useCallback(async () => {
    const policy: CreatedAccessControlPolicy | null = selectedPolicy ?? createdPolicy
    if (!policy || selectedHosts.length === 0) {
      toast.error(copy.validationFailed, {
        description: !policy ? copy.createObjectHint : copy.noHosts,
      })
      return
    }

    setSubmitting(true)
    const toastId = toast.loading(copy.dispatching)

    try {
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
  }, [copy, createdPolicy, selectedHosts, selectedPolicy])

  const selectExistingPolicy = useCallback((policy: ExistingAccessControlPolicy) => {
    const hasUnsavedContent = !selectedPolicy && (isAccessControlDraftDirty(draft) || Boolean(createdPolicy))
    if (hasUnsavedContent && !window.confirm(copy.resetConfirm)) return false

    setSelectedPolicy(policy)
    setDraft(buildAccessControlDraftFromExistingPolicy(policy))
    setCreatedPolicy(null)
    setCreatedDraftFingerprint("")
    setOperation(null)
    return true
  }, [copy.resetConfirm, createdPolicy, draft, selectedPolicy])

  return (
    <div className="h-full min-h-0 overflow-hidden bg-slate-100 p-4">
      <div className="flex h-full min-h-0 flex-col gap-3">
        <header className="w-full shrink-0 rounded-[28px] border border-slate-200/80 bg-white px-5 py-[13px] shadow-[0_12px_34px_rgba(15,23,42,0.08)]">
          <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center">
            <div className="flex min-w-0 items-center gap-4 xl:w-[460px] xl:flex-none 2xl:w-[520px]">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 text-teal-600">
              <LockKeyhole className="h-5 w-5" />
            </span>
            <div className="min-w-0 space-y-1.5">
              <h1 className="line-clamp-2 break-words text-lg font-semibold leading-tight text-slate-950">{copy.pageTitle}</h1>
              <p className="min-w-0 truncate text-sm text-slate-500">{copy.pageDescription}</p>
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 xl:flex-nowrap xl:justify-end">
            <div className="hidden h-12 w-[440px] shrink-0 grid-cols-[auto_128px_auto] items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 shadow-inner shadow-slate-200/20 2xl:grid">
              <FlowBadge
                number={1}
                title={selectedPolicy?.name ?? createdPolicy?.name ?? copy.createObject}
                done={Boolean(selectedPolicy || createdPolicy)}
              />
              <div className="mx-4 h-px bg-slate-300" />
              <FlowBadge
                number={2}
                title={`${copy.applyHosts} · ${selectedHosts.length}`}
                done={Boolean(operation)}
              />
            </div>
            <span className="hidden h-6 w-px shrink-0 bg-slate-200 2xl:block" aria-hidden="true" />
            <Button variant="ghost" onClick={() => setPolicySelectorOpen(true)} className="h-10 shrink-0 gap-2 rounded-full px-3 text-cyan-600 hover:bg-cyan-50 hover:text-cyan-700">
              <LibraryBig className="h-4 w-4" />
              <span className="font-medium">{copy.selectPolicy}</span>
            </Button>
            <span className="h-6 w-px shrink-0 bg-slate-200" aria-hidden="true" />
            <Button
              variant="ghost"
              onClick={() => void handleCreatePolicy()}
              disabled={creating || (!selectedPolicy && policyCreatedFromCurrentDraft)}
              className="h-10 shrink-0 gap-2 rounded-full px-3 text-teal-600 hover:bg-teal-50 hover:text-teal-700"
            >
              {creating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FilePlus2 className="h-4 w-4" />}
              <span className="font-medium">{creating ? copy.submitting : copy.reset}</span>
            </Button>
            <span className="h-6 w-px shrink-0 bg-slate-200" aria-hidden="true" />
            <Button
              onClick={() => void handleConfirm()}
              disabled={!canSubmit}
              className="h-10 min-w-56 shrink-0 rounded-full bg-teal-600 px-5 text-white shadow-sm hover:bg-teal-700"
            >
              {submitting ? (
                <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />{copy.dispatching}</>
              ) : (
                <><Send className="mr-2 h-4 w-4" />{copy.selectHostDispatch} · {selectedHosts.length}</>
              )}
            </Button>
          </div>
          </div>
        </header>

        <PolicyDefinitionBar
          copy={copy}
          draft={draft}
          readOnly={Boolean(selectedPolicy)}
          onChange={updateDraft}
          onTypeChange={changePolicyType}
        />

        <main className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1.62fr)_minmax(440px,1fr)]">
          <PolicyConfigurationPanel copy={copy} draft={draft} readOnly={Boolean(selectedPolicy)} onChange={updateDraft} />

          <HostPanel
            copy={copy}
            data={hostTree}
            loading={hostsLoading}
            error={hostsError}
            selectorKey={selectorKey}
            selectedHosts={selectedHosts}
            onlineHostCount={onlineHostCount}
            offlineHostCount={offlineHostCount}
            invalidHostCount={invalidHostCount}
            onSelectionChange={handleHostSelection}
            onReload={() => void loadHosts()}
          />
        </main>
      </div>
      <PolicySelectorDialog
        copy={copy}
        open={policySelectorOpen}
        selectedPolicy={selectedPolicy}
        onOpenChange={setPolicySelectorOpen}
        onSelect={selectExistingPolicy}
      />
    </div>
  )
}

export function PolicyConfigurationPanel({
  copy,
  draft,
  readOnly,
  onChange,
}: {
  copy: AccessControlCopy
  draft: AccessControlPolicyDraft
  readOnly: boolean
  onChange: (patch: Partial<AccessControlPolicyDraft>) => void
}) {
  const PolicyIcon = POLICY_ICONS[draft.type]

  return (
    <fieldset disabled={readOnly} className="flex min-h-0 flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
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
    </fieldset>
  )
}

export function PolicyDefinitionBar({
  copy,
  draft,
  readOnly,
  typeLocked = false,
  idPrefix = "access-policy",
  onChange,
  onTypeChange,
}: {
  copy: AccessControlCopy
  draft: AccessControlPolicyDraft
  readOnly: boolean
  typeLocked?: boolean
  idPrefix?: string
  onChange: (patch: Partial<AccessControlPolicyDraft>) => void
  onTypeChange: (type: AccessPolicyType) => void
}) {
  const priorityPosition = Math.min(100, Math.max(0, (draft.priority / 255) * 100))

  return (
    <div className="shrink-0 rounded-[24px] border border-slate-200 bg-white px-5 py-3.5 shadow-sm">
      {readOnly ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
          <span className="font-semibold">{copy.existingPolicy}</span>
          <span className="truncate text-blue-700">{copy.selectedPolicyHint}</span>
        </div>
      ) : null}
      <div className="grid items-center gap-4 xl:grid-cols-[180px_minmax(0,1fr)]">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-950">{copy.basicInfo}</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">{copy.policyTypeHint}</p>
        </div>
        <div className="grid h-11 min-w-0 grid-cols-4 gap-1 rounded-2xl bg-slate-100/80 p-1">
          {(Object.keys(copy.policyTypes) as AccessPolicyType[]).map((type) => {
            const Icon = POLICY_ICONS[type]
            const active = draft.type === type
            return (
              <button
                key={type}
                type="button"
                aria-pressed={active}
                disabled={typeLocked}
                title={copy.policyTypes[type][1]}
                onClick={() => {
                  if (!active && !typeLocked) onTypeChange(type)
                }}
                className={`flex h-9 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-xs font-medium transition-[background-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 disabled:cursor-default ${
                  active
                    ? `${POLICY_ACTIVE_COLOR} shadow-sm ring-1 ring-inset`
                    : "text-slate-500 hover:bg-white/70 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : POLICY_ICON_COLORS[type]}`} />
                <span className="truncate">{copy.policyTypes[type][0]}</span>
              </button>
            )
          })}
        </div>
      </div>

      <fieldset disabled={readOnly} className="mt-3 grid grid-cols-1 gap-4 border-t border-slate-200 pt-3 xl:grid-cols-[minmax(320px,1.5fr)_180px_minmax(240px,0.75fr)]">
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor={`${idPrefix}-name`} className="flex h-4 items-center text-xs font-medium leading-none text-slate-700">
            {copy.policyName}
            <span className="ml-1 text-red-500">*</span>
          </Label>
          <Input
            id={`${idPrefix}-name`}
            value={draft.name}
            onChange={(event) => onChange({ name: event.target.value })}
            placeholder={copy.policyNamePlaceholder}
            className="h-9 min-w-0"
            maxLength={128}
          />
        </div>
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor={`${idPrefix}-version`} className="flex h-4 items-center text-xs font-medium leading-none text-slate-700">
            {copy.version}
            <span className="ml-1 text-red-500">*</span>
          </Label>
          <Input
            id={`${idPrefix}-version`}
            value={draft.version}
            onChange={(event) => onChange({ version: event.target.value })}
            placeholder="1.0.0"
            className="h-9 min-w-0 font-mono"
            maxLength={64}
          />
        </div>
        <div className="min-w-0 space-y-1.5">
          <div className="flex h-4 min-w-0 items-center justify-between gap-3">
            <Label className="flex h-4 shrink-0 items-center text-xs font-medium leading-none text-slate-700">
              {copy.priority}
              <span className="ml-1 text-red-500">*</span>
            </Label>
            <span className="truncate text-[10px] text-slate-400" title={copy.priorityHint}>
              {copy.priorityHint}
            </span>
          </div>
          <div className="relative h-9 min-w-0 pt-5">
            <span
              className="pointer-events-none absolute -top-2 z-10 min-w-8 rounded-md bg-slate-950 px-2 py-0.5 text-center font-mono text-[10px] font-semibold leading-4 tabular-nums text-white shadow-sm"
              style={{
                left: `${priorityPosition}%`,
                transform: `translateX(-${priorityPosition}%)`,
              }}
              aria-hidden="true"
            >
              {draft.priority}
            </span>
            <Slider
              value={[draft.priority]}
              min={0}
              max={255}
              step={1}
              onValueChange={([priority]) => onChange({ priority })}
              aria-label={copy.priority}
              className="min-w-0 translate-y-0.5 [&>span:first-child]:bg-slate-200 [&>span:first-child>span]:bg-blue-600 [&_[role=slider]]:border-blue-600 [&_[role=slider]]:focus-visible:ring-blue-200"
            />
          </div>
        </div>
      </fieldset>
    </div>
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
      />
      <div className="min-h-[142px] rounded-xl border border-slate-200 bg-slate-50/60 p-3">
        <div className="space-y-1.5">
          <Label className="block text-xs text-slate-600">{copy.objectLabels[draft.type]}</Label>
          <MultiValueInput
            value={draft.objectPaths}
            onChange={(objectPaths) => onChange({ objectPaths })}
            placeholder={copy.objectPlaceholders[draft.type]}
          />
        </div>
        {draft.type === "process" ? (
          <details className="mt-3 rounded-lg border border-dashed border-slate-200 bg-white/70 px-3 py-2">
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
      </div>
    </section>
  )
}

function ConfigurationSectionHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: typeof Users
  title: string
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
  onlineHostCount,
  offlineHostCount,
  invalidHostCount,
  onSelectionChange,
  onReload,
}: {
  copy: AccessControlCopy
  data: HostSelectorTreeNode[]
  loading: boolean
  error: string
  selectorKey: number
  selectedHosts: HostSelectorHostNode[]
  onlineHostCount: number
  offlineHostCount: number
  invalidHostCount: number
  onSelectionChange: (nodes: HostSelectorHostNode[]) => void
  onReload: () => void
}) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
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
          compactHostRows
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

      <div className="grid shrink-0 grid-cols-4 divide-x divide-slate-200 border-t border-slate-200 bg-white px-4 py-3">
        <Metric label={copy.targetHostCount} value={selectedHosts.length} tone="slate" />
        <Metric label={copy.onlineHostCount} value={onlineHostCount} tone="emerald" />
        <Metric label={copy.offlineHostCount} value={offlineHostCount} tone="amber" />
        <Metric label={copy.invalidHostCount} value={invalidHostCount} tone={invalidHostCount > 0 ? "rose" : "slate"} />
      </div>
    </section>
  )
}

function FlowBadge({ number, title, done }: { number: number; title: string; done: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-2 px-1 py-0.5">
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${done ? "bg-emerald-100 text-emerald-700" : "bg-slate-950 text-white"}`}>
        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : number}
      </span>
      <div className="min-w-0 truncate text-[11px] font-semibold text-slate-800">{title}</div>
    </div>
  )
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "slate" | "emerald" | "amber" | "rose"
}) {
  const valueClassName = {
    slate: "text-slate-950",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
  }[tone]

  return (
    <div className="min-w-0 px-3 text-center">
      <p className="truncate text-[10px] text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold leading-none tabular-nums ${valueClassName}`}>{value}</p>
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
