"use client"

import { useState } from "react"
import { Asterisk, Plus, X } from "lucide-react"

import type { AccessControlCopy } from "../access-control-copy"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"

export function RegistryValueNameInput({
  copy,
  value,
  disabled,
  onChange,
}: {
  copy: AccessControlCopy
  value: string[]
  disabled?: boolean
  onChange: (value: string[]) => void
}) {
  const [draft, setDraft] = useState("")

  const append = (entry: string) => {
    if (value.includes(entry)) return
    onChange([...value, entry])
    setDraft("")
  }

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-violet-200 bg-white/80 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-slate-700">{copy.registry.valueNames}</p>
          <p className="mt-0.5 text-[11px] leading-5 text-slate-500">
            {disabled ? copy.registry.enumValueHint : copy.registry.valueNameHint}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || value.includes("")}
          onClick={() => append("")}
          className="h-8 border-violet-200 text-xs text-violet-700 hover:bg-violet-50"
        >
          <Asterisk className="mr-1.5 h-3.5 w-3.5" />
          {copy.registry.defaultValue}
        </Button>
      </div>

      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs text-violet-800"
            >
              <span className="max-w-72 whitespace-pre font-mono" title={item || copy.registry.defaultValue}>
                {item === "" ? copy.registry.defaultValue : item}
              </span>
              <button
                type="button"
                aria-label={`${copy.remove} ${item || copy.registry.defaultValue}`}
                disabled={disabled}
                className="rounded p-0.5 text-violet-400 hover:bg-violet-100 hover:text-violet-700 disabled:cursor-not-allowed"
                onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="rounded-md bg-slate-50 px-2.5 py-2 text-[11px] text-slate-500">
          {copy.registry.allValues}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Input
          value={draft}
          disabled={disabled}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && draft.length > 0) {
              event.preventDefault()
              append(draft)
            }
          }}
          placeholder={copy.registry.valueNamePlaceholder}
          className="h-9 font-mono text-xs"
          maxLength={16383}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled || draft.length === 0}
          onClick={() => append(draft)}
          className="h-9 w-9 shrink-0"
          aria-label={copy.registry.addValueName}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
