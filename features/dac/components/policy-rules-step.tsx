"use client"

import { ArrowRight, ChevronLeft, FileSliders, Hash, Plus, Shield, Trash2, Users } from "lucide-react"

import type { AccessControlCopy } from "../access-control-copy"
import { ACCESS_ACTIONS, createEmptySubject } from "../access-control-options"
import type {
  AccessControlPolicyDraft,
  AccessHash,
  AccessPolicyType,
  AccessRuleDraft,
  AccessSubjectDraft,
  AccessSubjectType,
  NetworkPolicyDraft,
} from "../access-control-types"
import { MultiValueInput } from "./multi-value-input"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Switch } from "@/shared/ui/switch"

interface PolicyRulesStepProps {
  copy: AccessControlCopy
  draft: AccessControlPolicyDraft
  onChange: (patch: Partial<AccessControlPolicyDraft>) => void
  onBack: () => void
  onNext: () => void
}

export function PolicyRulesStep({ copy, draft, onChange, onBack, onNext }: PolicyRulesStepProps) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-6 py-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <FileSliders className="h-5 w-5" />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-950">{copy.policyTypes[draft.type][0]}</h2>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">Policy</span>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">{copy.policyTypes[draft.type][1]}</p>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
        {draft.type === "network" ? (
          <NetworkEditor copy={copy} value={draft.network} onChange={(network) => onChange({ network })} />
        ) : (
          <>
            <EditorSection number={1} icon={Users} title={copy.subject} description={copy.subjectHint}>
              <div className="space-y-3">
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
                <Button type="button" variant="outline" size="sm" onClick={() => onChange({ subjects: [...draft.subjects, createEmptySubject()] })}>
                  <Plus className="mr-2 h-4 w-4" />
                  {copy.addSubject}
                </Button>
              </div>
            </EditorSection>

            <EditorSection number={2} icon={Shield} title={copy.object} description={copy.objectHints[draft.type]}>
              <Label className="mb-2 block text-sm font-medium text-slate-800">{copy.objectLabels[draft.type]}</Label>
              <MultiValueInput
                value={draft.objectPaths}
                onChange={(objectPaths) => onChange({ objectPaths })}
                placeholder={copy.objectPlaceholders[draft.type]}
              />
              {draft.type === "process" ? (
                <HashEditor
                  copy={copy}
                  hashes={draft.objectHashes}
                  onChange={(objectHashes) => onChange({ objectHashes })}
                  className="mt-4"
                />
              ) : null}
            </EditorSection>

            <EditorSection number={3} icon={FileSliders} title={copy.rules} description={copy.rulesHint}>
              <RuleEditor copy={copy} type={draft.type} rules={draft.rules} onChange={(rules) => onChange({ rules })} />
            </EditorSection>

            <details className="group rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-slate-700">
                <span>{copy.exceptions}</span>
                <span className="text-xs font-normal text-slate-400">{copy.exceptionsHint}</span>
              </summary>
              <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
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
                  <Plus className="mr-2 h-4 w-4" />
                  {copy.addException}
                </Button>
              </div>
            </details>
          </>
        )}
      </div>

      <footer className="flex shrink-0 items-center justify-between border-t border-slate-200 px-6 py-4">
        <Button variant="outline" onClick={onBack} className="h-11 px-5">
          <ChevronLeft className="mr-2 h-4 w-4" />
          {copy.previous}
        </Button>
        <Button onClick={onNext} className="h-11 bg-blue-600 px-6 text-white hover:bg-blue-700">
          {copy.nextHosts}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </footer>
    </section>
  )
}

function EditorSection({
  number,
  icon: Icon,
  title,
  description,
  children,
}: {
  number: number
  icon: typeof Users
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">{number}</span>
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-950"><Icon className="h-4 w-4 text-blue-500" />{title}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <div className="ml-10">{children}</div>
    </section>
  )
}

export function SubjectEditor({
  copy,
  subject,
  canRemove,
  onChange,
  onRemove,
}: {
  copy: AccessControlCopy
  subject: AccessSubjectDraft
  canRemove: boolean
  onChange: (subject: AccessSubjectDraft) => void
  onRemove: () => void
}) {
  const account = subject.accounts[0] || { sid: "" }
  const changeType = (type: AccessSubjectType) => {
    onChange({ ...subject, type, paths: [], hashes: [], accounts: type === "process" ? [] : [{ sid: "" }] })
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-36 shrink-0 space-y-1.5">
          <Label className="text-xs text-slate-600">{copy.subjectType}</Label>
          <Select value={subject.type} onValueChange={(value) => changeType(value as AccessSubjectType)}>
            <SelectTrigger className="h-10 rounded-lg bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(copy.subjectTypes) as AccessSubjectType[]).map((type) => (
                <SelectItem key={type} value={type}>{copy.subjectTypes[type]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-52 flex-1">
          {subject.type === "process" ? (
            <MultiValueInput
              value={subject.paths}
              onChange={(paths) => onChange({ ...subject, paths })}
              placeholder={copy.processPathsPlaceholder}
            />
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              <Input
                value={subject.type === "windowsuser" ? account.user_name || "" : account.group_name || ""}
                onChange={(event) => onChange({
                  ...subject,
                  accounts: [{
                    sid: account.sid,
                    ...(subject.type === "windowsuser" ? { user_name: event.target.value } : { group_name: event.target.value }),
                  }],
                })}
                placeholder={subject.type === "windowsuser" ? copy.userName : copy.groupName}
                className="h-10 rounded-lg bg-white"
              />
              <Input
                value={account.sid}
                onChange={(event) => onChange({
                  ...subject,
                  accounts: [{
                    sid: event.target.value,
                    ...(subject.type === "windowsuser" ? { user_name: account.user_name } : { group_name: account.group_name }),
                  }],
                })}
                placeholder={copy.sidPlaceholder}
                className="h-10 rounded-lg bg-white font-mono text-xs"
              />
            </div>
          )}
        </div>
        {canRemove ? (
          <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-slate-400 hover:text-red-600" onClick={onRemove} aria-label={copy.remove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      {subject.type === "process" ? (
        <details className="mt-3 rounded-lg border border-dashed border-slate-200 bg-white/70 px-3 py-2">
          <summary className="cursor-pointer list-none text-xs font-medium text-slate-600">
            {copy.hashes}
            <span className="ml-2 font-normal text-slate-400">{subject.hashes.length || ""}</span>
          </summary>
          <HashEditor copy={copy} hashes={subject.hashes} onChange={(hashes) => onChange({ ...subject, hashes })} className="mt-3" />
        </details>
      ) : null}
    </div>
  )
}

export function HashEditor({ copy, hashes, onChange, className = "" }: { copy: AccessControlCopy; hashes: AccessHash[]; onChange: (hashes: AccessHash[]) => void; className?: string }) {
  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between">
        <Label className="flex items-center gap-1.5 text-xs text-slate-600"><Hash className="h-3.5 w-3.5" />{copy.hashes}</Label>
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-blue-600" onClick={() => onChange([...hashes, { algo: "sha256", value: "" }])}>
          <Plus className="mr-1 h-3.5 w-3.5" />{copy.addHash}
        </Button>
      </div>
      {hashes.length > 0 ? (
        <div className="space-y-2">
          {hashes.map((hash, index) => (
            <div key={`${index}-${hash.algo}`} className="flex gap-2">
              <Select value={hash.algo} onValueChange={(algo) => {
                const next = [...hashes]
                next[index] = { ...hash, algo: algo as AccessHash["algo"] }
                onChange(next)
              }}>
                <SelectTrigger className="h-9 w-28 bg-white font-mono text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="md5">MD5</SelectItem>
                  <SelectItem value="sha1">SHA1</SelectItem>
                  <SelectItem value="sha256">SHA256</SelectItem>
                </SelectContent>
              </Select>
              <Input value={hash.value} onChange={(event) => {
                const next = [...hashes]
                next[index] = { ...hash, value: event.target.value }
                onChange(next)
              }} placeholder={copy.hashValue} className="h-9 bg-white font-mono text-xs" />
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-slate-400 hover:text-red-600" onClick={() => onChange(hashes.filter((_, hashIndex) => hashIndex !== index))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function RuleEditor({ copy, type, rules, onChange }: { copy: AccessControlCopy; type: Exclude<AccessPolicyType, "network">; rules: AccessRuleDraft[]; onChange: (rules: AccessRuleDraft[]) => void }) {
  const actions = ACCESS_ACTIONS[type]
  const usedActions = new Set(rules.map((rule) => rule.action))
  const nextAction = actions.find((action) => !usedActions.has(action))

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(140px,0.8fr)_110px_48px] items-center gap-3 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-500">
        <span>{copy.action}</span><span>{copy.effect}</span><span className="text-center">{copy.audit}</span><span />
      </div>
      {rules.length === 0 ? <div className="px-4 py-8 text-center text-sm text-slate-400">{copy.noRules}</div> : null}
      {rules.map((rule, index) => (
        <div key={rule.id} className="grid grid-cols-[minmax(0,1.2fr)_minmax(140px,0.8fr)_110px_48px] items-center gap-3 border-t border-slate-100 px-4 py-2.5">
          <Select value={rule.action} onValueChange={(action) => {
            const next = [...rules]
            next[index] = { ...rule, action: action as AccessRuleDraft["action"] }
            onChange(next)
          }}>
            <SelectTrigger className="h-9 border-0 bg-transparent px-0 font-medium shadow-none focus:ring-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              {actions.map((action) => (
                <SelectItem key={action} value={action} disabled={usedActions.has(action) && action !== rule.action}>
                  {copy.actions[action]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={rule.effect} onValueChange={(effect) => {
            const next = [...rules]
            next[index] = { ...rule, effect: effect as AccessRuleDraft["effect"] }
            onChange(next)
          }}>
            <SelectTrigger className="h-9 rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="allow">{copy.effects.allow}</SelectItem>
              <SelectItem value="block">{copy.effects.block}</SelectItem>
              <SelectItem value="prompt">{copy.effects.prompt}</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex justify-center"><Switch checked={rule.audit} onCheckedChange={(audit) => {
            const next = [...rules]
            next[index] = { ...rule, audit }
            onChange(next)
          }} /></div>
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-red-600" onClick={() => onChange(rules.filter((item) => item.id !== rule.id))}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <div className="border-t border-slate-100 p-3">
        <Button type="button" variant="outline" size="sm" disabled={!nextAction} onClick={() => nextAction && onChange([...rules, { id: crypto.randomUUID(), action: nextAction, effect: "block", audit: true }])}>
          <Plus className="mr-2 h-4 w-4" />{copy.addRule}
        </Button>
      </div>
    </div>
  )
}

export function NetworkEditor({ copy, value, onChange }: { copy: AccessControlCopy; value: NetworkPolicyDraft; onChange: (value: NetworkPolicyDraft) => void }) {
  const update = (patch: Partial<NetworkPolicyDraft>) => onChange({ ...value, ...patch })
  return (
    <div className="space-y-6">
      <EditorSection number={1} icon={FileSliders} title={copy.object} description={copy.objectHints.network}>
        <div className="grid gap-4 md:grid-cols-3">
          <SelectField label={copy.network.direction} value={value.direction} onChange={(direction) => update({ direction: direction as NetworkPolicyDraft["direction"] })} options={[["in", copy.network.inbound], ["out", copy.network.outbound]]} />
          <SelectField label={copy.network.action} value={value.action} onChange={(action) => update({ action: action as NetworkPolicyDraft["action"] })} options={[["allow", copy.network.allow], ["block", copy.network.block], ["bypass", copy.network.bypass]]} />
          <SelectField label={copy.network.profile} value={value.profile} onChange={(profile) => update({ profile: profile as NetworkPolicyDraft["profile"] })} options={[["any", copy.network.any], ["domain", copy.network.domain], ["private", copy.network.private], ["public", copy.network.public]]} />
        </div>
      </EditorSection>
      <EditorSection number={2} icon={FileSliders} title={copy.network.protocol} description={copy.network.portHint}>
        <div className="grid gap-4 md:grid-cols-3">
          <SelectField label={copy.network.protocol} value={value.protocol} onChange={(protocol) => update({ protocol: protocol as NetworkPolicyDraft["protocol"] })} options={[["tcp", "TCP"], ["udp", "UDP"], ["icmp", "ICMP"], ["any", copy.network.any]]} />
          <InputField label={copy.network.localPort} value={value.localPort} onChange={(localPort) => update({ localPort })} hint={copy.network.portHint} />
          <InputField label={copy.network.remotePort} value={value.remotePort} onChange={(remotePort) => update({ remotePort })} hint={copy.network.portHint} />
        </div>
      </EditorSection>
      <EditorSection number={3} icon={Shield} title={copy.network.localAddress} description={copy.network.addressHint}>
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label={copy.network.localAddress} value={value.localAddress} onChange={(localAddress) => update({ localAddress })} hint={copy.network.addressHint} />
          <InputField label={copy.network.remoteAddress} value={value.remoteAddress} onChange={(remoteAddress) => update({ remoteAddress })} hint={copy.network.addressHint} />
          <InputField label={copy.network.programPath} value={value.programPath} onChange={(programPath) => update({ programPath })} />
          <InputField label={copy.network.programMd5} value={value.programMd5} onChange={(programMd5) => update({ programMd5 })} />
        </div>
      </EditorSection>
    </div>
  )
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return <div className="space-y-2"><Label className="text-xs text-slate-600">{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger><SelectContent>{options.map(([option, text]) => <SelectItem key={option} value={option}>{text}</SelectItem>)}</SelectContent></Select></div>
}

function InputField({ label, value, onChange, hint }: { label: string; value: string; onChange: (value: string) => void; hint?: string }) {
  return <div className="space-y-2"><Label className="text-xs text-slate-600">{label}</Label><Input value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-lg font-mono text-xs" />{hint ? <p className="text-[11px] text-slate-400">{hint}</p> : null}</div>
}
