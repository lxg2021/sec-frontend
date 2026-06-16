"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "@/shared/lib/utils"

export function CopyButton({
  value,
  className,
  label,
}: {
  value: string
  className?: string
  label: string
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`${label}: ${value}`}
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        className,
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-chart-3" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}
