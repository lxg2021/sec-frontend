"use client"

import {
  Activity,
  AppWindow,
  ArrowRight,
  Ban,
  Building2,
  Cable,
  CheckCircle2,
  Globe2,
  Layers3,
  Laptop,
  LockKeyhole,
  LogIn,
  LogOut,
  Route,
  Send,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"

import type { AccessControlCopy } from "../access-control-copy"
import type { NetworkPolicyDraft } from "../access-control-types"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

interface NetworkEditorProps {
  copy: AccessControlCopy
  value: NetworkPolicyDraft
  onChange: (value: NetworkPolicyDraft) => void
}

export function NetworkEditor({ copy, value, onChange }: NetworkEditorProps) {
  const update = (patch: Partial<NetworkPolicyDraft>) => onChange({ ...value, ...patch })
  const usesPorts = value.protocol === "tcp" || value.protocol === "udp"
  const allPrograms = value.programPath.trim() === "*"
  const source = value.direction === "in" ? copy.network.remoteEndpoint : copy.network.localEndpoint
  const destination = value.direction === "in" ? copy.network.localEndpoint : copy.network.remoteEndpoint
  const programScopes: Array<[boolean, string]> = [[true, copy.network.allPrograms], [false, copy.network.specifiedProgram]]

  return (
    <div className="space-y-4">
      <FirewallCard icon={ShieldCheck} title={copy.network.firewallRule}>
        <div className="grid gap-4 md:grid-cols-3">
          <SelectField label={copy.network.direction} value={value.direction} onChange={(direction) => update({ direction: direction as NetworkPolicyDraft["direction"] })} options={[["in", copy.network.inbound, LogIn, "text-emerald-600"], ["out", copy.network.outbound, LogOut, "text-amber-600"]]} />
          <SelectField label={copy.network.action} value={value.action} onChange={(action) => update({ action: action as NetworkPolicyDraft["action"] })} options={[["allow", copy.network.allow, CheckCircle2, "text-emerald-600"], ["block", copy.network.block, Ban, "text-rose-600"], ["bypass", copy.network.bypass, Route, "text-amber-600"]]} />
          <SelectField label={copy.network.profile} value={value.profile} onChange={(profile) => update({ profile: profile as NetworkPolicyDraft["profile"] })} options={[["any", copy.network.any, Layers3, "text-slate-500"], ["domain", copy.network.domain, Building2, "text-violet-600"], ["private", copy.network.private, LockKeyhole, "text-amber-600"], ["public", copy.network.public, Globe2, "text-teal-600"]]} />
        </div>
      </FirewallCard>

      <FirewallCard icon={Globe2} title={copy.network.communicationEndpoints}>
        <div className="mb-4 flex items-center justify-center gap-3 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
          <span>{source}</span><ArrowRight className="h-4 w-4 text-slate-400"/><span>{destination}</span>
        </div>
        <div className="mb-4 max-w-sm">
          <SelectField label={copy.network.protocol} value={value.protocol} onChange={(protocol) => update({ protocol: protocol as NetworkPolicyDraft["protocol"], ...(["icmp", "any"].includes(protocol) ? { localPort: "any", remotePort: "any" } : {}) })} options={[["tcp", "TCP", Cable, "text-blue-600"], ["udp", "UDP", Send, "text-violet-600"], ["icmp", "ICMP", Activity, "text-amber-600"], ["any", copy.network.any, Layers3, "text-slate-500"]]} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <EndpointCard icon={Laptop} title={copy.network.localEndpoint}>
            <InputField label={copy.network.localAddress} value={value.localAddress} onChange={(localAddress) => update({ localAddress })} hint={copy.network.addressHint} />
            <InputField label={copy.network.localPort} value={value.localPort} onChange={(localPort) => update({ localPort })} hint={copy.network.portHint} disabled={!usesPorts} />
          </EndpointCard>
          <EndpointCard icon={Globe2} title={copy.network.remoteEndpoint}>
            <InputField label={copy.network.remoteAddress} value={value.remoteAddress} onChange={(remoteAddress) => update({ remoteAddress })} hint={copy.network.addressHint} />
            <InputField label={copy.network.remotePort} value={value.remotePort} onChange={(remotePort) => update({ remotePort })} hint={copy.network.portHint} disabled={!usesPorts} />
          </EndpointCard>
        </div>
      </FirewallCard>

      <FirewallCard icon={AppWindow} title={copy.network.programScope}>
        <div className="mb-4 inline-flex rounded-xl bg-slate-100 p-1">
          {programScopes.map(([all, label]) => (
            <button key={String(all)} type="button" aria-pressed={allPrograms === all} onClick={() => update(all ? { programPath: "*", programMd5: "" } : { programPath: "", programMd5: "" })} className={`h-9 rounded-lg px-4 text-xs font-medium transition-colors ${allPrograms === all ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}>{label}</button>
          ))}
        </div>
        {!allPrograms ? (
          <div className="grid gap-4 md:grid-cols-2">
            <InputField label={copy.network.programPath} value={value.programPath} onChange={(programPath) => update({ programPath })} />
            <InputField label={copy.network.programMd5} value={value.programMd5} onChange={(programMd5) => update({ programMd5 })} />
          </div>
        ) : null}
      </FirewallCard>
    </div>
  )
}

function FirewallCard({ icon: Icon, title, children }: { icon: typeof ShieldCheck; title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"><h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-950"><Icon className="h-4 w-4 text-blue-600"/>{title}</h3>{children}</section>
}

function EndpointCard({ icon: Icon, title, children }: { icon: typeof Laptop; title: string; children: React.ReactNode }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4"><h4 className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-700"><Icon className="h-4 w-4 text-slate-500"/>{title}</h4><div className="grid gap-4 sm:grid-cols-2">{children}</div></div>
}

type SelectOption = [value: string, label: string, icon: LucideIcon, iconClassName: string]

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: SelectOption[] }) {
  const selected = options.find(([option]) => option === value) ?? options[0]
  const SelectedIcon = selected[2]

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-slate-600">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 rounded-lg bg-white">
          <div className="flex min-w-0 items-center gap-2 whitespace-nowrap">
            <SelectedIcon className={`h-4 w-4 shrink-0 ${selected[3]}`} />
            <SelectValue>{selected[1]}</SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-xl border-slate-200 p-1 shadow-lg">
          {options.map(([option, text, Icon, iconClassName]) => (
            <SelectItem key={option} value={option} className="h-9 cursor-pointer rounded-lg">
              <span className="flex items-center gap-2">
                <Icon className={`h-4 w-4 shrink-0 ${iconClassName}`} />
                <span>{text}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function InputField({ label, value, onChange, hint, disabled = false }: { label: string; value: string; onChange: (value: string) => void; hint?: string; disabled?: boolean }) {
  return <div className="space-y-1.5"><Label className="text-xs text-slate-600">{label}</Label><Input value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-lg bg-white font-mono text-xs"/>{hint ? <p className="text-[11px] text-slate-400">{hint}</p> : null}</div>
}
