"use client"

import type { LucideIcon } from "lucide-react"
import { FileSliders, Shield } from "lucide-react"

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

  return (
    <div className="space-y-6">
      <EditorSection number={1} icon={FileSliders} title={copy.object} description={copy.objectHints.network}>
        <div className="grid gap-4 md:grid-cols-3">
          <SelectField
            label={copy.network.direction}
            value={value.direction}
            onChange={(direction) => update({ direction: direction as NetworkPolicyDraft["direction"] })}
            options={[
              ["in", copy.network.inbound],
              ["out", copy.network.outbound],
            ]}
          />
          <SelectField
            label={copy.network.action}
            value={value.action}
            onChange={(action) => update({ action: action as NetworkPolicyDraft["action"] })}
            options={[
              ["allow", copy.network.allow],
              ["block", copy.network.block],
              ["bypass", copy.network.bypass],
            ]}
          />
          <SelectField
            label={copy.network.profile}
            value={value.profile}
            onChange={(profile) => update({ profile: profile as NetworkPolicyDraft["profile"] })}
            options={[
              ["any", copy.network.any],
              ["domain", copy.network.domain],
              ["private", copy.network.private],
              ["public", copy.network.public],
            ]}
          />
        </div>
      </EditorSection>
      <EditorSection
        number={2}
        icon={FileSliders}
        title={copy.network.protocol}
        description={copy.network.portHint}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <SelectField
            label={copy.network.protocol}
            value={value.protocol}
            onChange={(protocol) => update({ protocol: protocol as NetworkPolicyDraft["protocol"] })}
            options={[
              ["tcp", "TCP"],
              ["udp", "UDP"],
              ["icmp", "ICMP"],
              ["any", copy.network.any],
            ]}
          />
          <InputField
            label={copy.network.localPort}
            value={value.localPort}
            onChange={(localPort) => update({ localPort })}
            hint={copy.network.portHint}
          />
          <InputField
            label={copy.network.remotePort}
            value={value.remotePort}
            onChange={(remotePort) => update({ remotePort })}
            hint={copy.network.portHint}
          />
        </div>
      </EditorSection>
      <EditorSection
        number={3}
        icon={Shield}
        title={copy.network.localAddress}
        description={copy.network.addressHint}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            label={copy.network.localAddress}
            value={value.localAddress}
            onChange={(localAddress) => update({ localAddress })}
            hint={copy.network.addressHint}
          />
          <InputField
            label={copy.network.remoteAddress}
            value={value.remoteAddress}
            onChange={(remoteAddress) => update({ remoteAddress })}
            hint={copy.network.addressHint}
          />
          <InputField
            label={copy.network.programPath}
            value={value.programPath}
            onChange={(programPath) => update({ programPath })}
          />
          <InputField
            label={copy.network.programMd5}
            value={value.programMd5}
            onChange={(programMd5) => update({ programMd5 })}
          />
        </div>
      </EditorSection>
    </div>
  )
}

interface EditorSectionProps {
  number: number
  icon: LucideIcon
  title: string
  description: string
  children: React.ReactNode
}

function EditorSection({ number, icon: Icon, title, description, children }: EditorSectionProps) {
  return (
    <section>
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
          {number}
        </span>
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <Icon className="h-4 w-4 text-blue-500" />
            {title}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <div className="ml-10">{children}</div>
    </section>
  )
}

interface SelectFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<[string, string]>
}

function SelectField({ label, value, onChange, options }: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-slate-600">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 rounded-lg">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([option, text]) => (
            <SelectItem key={option} value={option}>
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

interface InputFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
}

function InputField({ label, value, onChange, hint }: InputFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-slate-600">{label}</Label>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-lg font-mono text-xs"
      />
      {hint ? <p className="text-[11px] text-slate-400">{hint}</p> : null}
    </div>
  )
}
