"use client"

import {
  Ban,
  Boxes,
  CircleCheck,
  CirclePlus,
  CircleStop,
  Eye,
  FilePenLine,
  FilePlus2,
  FolderOpen,
  List,
  MessageSquareWarning,
  MoveRight,
  Pencil,
  Play,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  type LucideIcon,
} from "lucide-react"

import type { AccessControlCopy } from "../access-control-copy"
import { ACCESS_ACTIONS } from "../access-control-options"
import type { AccessAction, AccessPolicyType, AccessRuleDraft } from "../access-control-types"
import { Button } from "@/shared/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Switch } from "@/shared/ui/switch"

interface RuleEditorProps {
  copy: AccessControlCopy
  type: Exclude<AccessPolicyType, "network">
  rules: AccessRuleDraft[]
  onChange: (rules: AccessRuleDraft[]) => void
}

const EFFECTS = ["allow", "block", "prompt"] as const

const EFFECT_ICONS = {
  allow: CircleCheck,
  block: Ban,
  prompt: MessageSquareWarning,
}

const EFFECT_ICON_COLORS = {
  allow: "text-emerald-600",
  block: "text-red-600",
  prompt: "text-amber-600",
}

const ACTION_ICONS: Record<AccessAction, LucideIcon> = {
  new: FilePlus2,
  delete: Trash2,
  rename: Pencil,
  move: MoveRight,
  write: FilePenLine,
  set: Settings2,
  open: FolderOpen,
  read: Eye,
  execute: Play,
  query: Search,
  enum: List,
  create: CirclePlus,
  terminate: CircleStop,
  allocate: Boxes,
  protect: ShieldCheck,
}

const ACTION_ICON_COLORS: Partial<Record<AccessAction, string>> = {
  new: "text-emerald-600",
  create: "text-emerald-600",
  delete: "text-red-600",
  terminate: "text-red-600",
  write: "text-amber-600",
  set: "text-amber-600",
  execute: "text-violet-600",
  protect: "text-teal-600",
  query: "text-cyan-700",
  read: "text-cyan-700",
}

export function RuleEditor({ copy, type, rules, onChange }: RuleEditorProps) {
  const actions = ACCESS_ACTIONS[type]
  const usedActions = new Set(rules.map((rule) => rule.action))
  const nextAction = actions.find((action) => !usedActions.has(action))

  return (
    <div className="flex min-h-[210px] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200">
      <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(140px,0.8fr)_110px_48px] items-center gap-3 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-500">
        <span>{copy.action}</span>
        <span>{copy.effect}</span>
        <span className="text-center">{copy.audit}</span>
        <span />
      </div>
      {rules.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-4 py-8 text-center text-sm text-slate-400">
          {copy.noRules}
        </div>
      ) : null}
      {rules.map((rule, index) => (
        <div
          key={rule.id}
          className="grid grid-cols-[minmax(0,1.2fr)_minmax(140px,0.8fr)_110px_48px] items-center gap-3 border-t border-slate-100 px-4 py-2.5"
        >
          <Select
            value={rule.action}
            onValueChange={(action) => {
              const next = [...rules]
              next[index] = { ...rule, action: action as AccessRuleDraft["action"] }
              onChange(next)
            }}
          >
            <SelectTrigger className="h-9 border-0 bg-transparent px-0 font-medium shadow-none focus:ring-0">
              <ActionLabel action={rule.action} label={copy.actions[rule.action]} trigger>
                <SelectValue>{copy.actions[rule.action]}</SelectValue>
              </ActionLabel>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 p-1 shadow-lg">
              {actions.map((action) => (
                <SelectItem
                  key={action}
                  value={action}
                  disabled={usedActions.has(action) && action !== rule.action}
                  className="h-9 cursor-pointer rounded-lg"
                >
                  <ActionLabel action={action} label={copy.actions[action]} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={rule.effect}
            onValueChange={(effect) => {
              const next = [...rules]
              next[index] = { ...rule, effect: effect as AccessRuleDraft["effect"] }
              onChange(next)
            }}
          >
            <SelectTrigger className="h-9 rounded-lg">
              <EffectLabel effect={rule.effect} label={copy.effects[rule.effect]} trigger>
                <SelectValue>{copy.effects[rule.effect]}</SelectValue>
              </EffectLabel>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 p-1 shadow-lg">
              {EFFECTS.map((effect) => (
                <SelectItem key={effect} value={effect} className="h-9 cursor-pointer rounded-lg">
                  <EffectLabel effect={effect} label={copy.effects[effect]} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-center">
            <Switch
              checked={rule.audit}
              onCheckedChange={(audit) => {
                const next = [...rules]
                next[index] = { ...rule, audit }
                onChange(next)
              }}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-slate-400 hover:text-red-600"
            onClick={() => onChange(rules.filter((item) => item.id !== rule.id))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <div className="mt-auto border-t border-slate-100 p-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!nextAction}
          onClick={() =>
            nextAction &&
            onChange([
              ...rules,
              { id: crypto.randomUUID(), action: nextAction, effect: "block", audit: true },
            ])
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          {copy.addRule}
        </Button>
      </div>
    </div>
  )
}

function ActionLabel({
  action,
  label,
  children,
  trigger = false,
}: {
  action: AccessAction
  label: string
  children?: React.ReactNode
  trigger?: boolean
}) {
  const Icon = ACTION_ICONS[action]
  const content = (
    <>
      <Icon className={`h-4 w-4 shrink-0 ${ACTION_ICON_COLORS[action] ?? "text-slate-500"}`} />
      {children ?? <span>{label}</span>}
    </>
  )
  return trigger
    ? <div className="flex min-w-0 items-center gap-2">{content}</div>
    : <span className="flex min-w-0 items-center gap-2">{content}</span>
}

function EffectLabel({
  effect,
  label,
  children,
  trigger = false,
}: {
  effect: AccessRuleDraft["effect"]
  label: string
  children?: React.ReactNode
  trigger?: boolean
}) {
  const Icon = EFFECT_ICONS[effect]
  const content = (
    <>
      <Icon className={`h-4 w-4 shrink-0 ${EFFECT_ICON_COLORS[effect]}`} />
      {children ?? <span>{label}</span>}
    </>
  )
  return trigger
    ? <div className="flex min-w-0 items-center gap-2">{content}</div>
    : <span className="flex min-w-0 items-center gap-2">{content}</span>
}
