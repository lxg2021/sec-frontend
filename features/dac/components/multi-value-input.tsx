"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Input } from "@/shared/ui/input"

interface MultiValueInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder: string
  className?: string
}

export function MultiValueInput({ value, onChange, placeholder, className }: MultiValueInputProps) {
  const [draft, setDraft] = useState("")

  const addValue = () => {
    const nextValues = draft
      .split(/[\n;]/)
      .map((item) => item.trim())
      .filter(Boolean)
    if (nextValues.length === 0) return
    onChange(Array.from(new Set([...value, ...nextValues])))
    setDraft("")
  }

  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100", className)}>
      {value.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {value.map((item) => (
            <span key={item} className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs text-slate-700">
              <span className="truncate font-mono" title={item}>{item}</span>
              <button
                type="button"
                aria-label={`Remove ${item}`}
                className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                onClick={() => onChange(value.filter((entry) => entry !== item))}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              addValue()
            }
          }}
          placeholder={placeholder}
          className="h-9 border-0 bg-transparent px-1 font-mono text-xs shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <button
          type="button"
          aria-label="Add value"
          onClick={addValue}
          disabled={!draft.trim()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-300"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

