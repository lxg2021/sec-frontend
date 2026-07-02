"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { getCategoryLabel } from "../mappers"
import type { ArtifactCategory, ForensicArtifactDefinitionItem } from "../types"
import { RiskBadge } from "./shared"

interface Props {
  artifacts: ForensicArtifactDefinitionItem[]
  selectedKey?: string
  onSelect: (artifact: ForensicArtifactDefinitionItem) => void
}

const preferredCategoryOrder = ["file", "registry", "eventlog", "forensic", "ntfs", "application", "other"]

export function ForensicArtifactPicker({
  artifacts,
  selectedKey,
  onSelect,
}: Props) {
  const [value, setValue] = useState(selectedKey ?? "")

  useEffect(() => {
    setValue(selectedKey ?? "")
  }, [selectedKey])

  const enabled = useMemo(
    () => artifacts.filter((a) => a.enabled),
    [artifacts],
  )

  const grouped = useMemo(() => {
    const map = new Map<ArtifactCategory, ForensicArtifactDefinitionItem[]>()
    for (const a of enabled) {
      const list = map.get(a.category) ?? []
      list.push(a)
      map.set(a.category, list)
    }
    return map
  }, [enabled])

  const orderedCategories = useMemo(() => {
    const keys = Array.from(grouped.keys())
    return keys.sort((a, b) => {
      const ai = preferredCategoryOrder.indexOf(a)
      const bi = preferredCategoryOrder.indexOf(b)
      if (ai !== -1 || bi !== -1) {
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
      }
      return a.localeCompare(b)
    })
  }, [grouped])

  const selected = enabled.find((a) => a.artifact_key === value)

  return (
    <div className="space-y-2">
      <Select
        value={value}
        onValueChange={(v) => {
          const next = v ?? ""
          setValue(next)
          const found = enabled.find((a) => a.artifact_key === next)
          if (found) onSelect(found)
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="选择取证工件" />
        </SelectTrigger>
        <SelectContent>
          {orderedCategories.map((cat) => (
              <SelectGroup key={cat}>
                <SelectLabel>{getCategoryLabel(cat)}</SelectLabel>
                {grouped.get(cat)!.map((a) => (
                  <SelectItem key={a.artifact_key} value={a.artifact_key}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
        </SelectContent>
      </Select>

      {selected ? (
        <div className="flex items-start justify-between gap-2 rounded-md border border-border px-3 py-2">
          <div className="min-w-0">
            <p className="truncate font-mono text-[11px] text-muted-foreground">
              {selected.artifact_key}
              {selected.version ? ` · v${selected.version}` : ""}
            </p>
            {selected.description ? (
              <p className="text-xs text-muted-foreground">
                {selected.description}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-[11px] uppercase text-muted-foreground">
              {selected.platform}
            </span>
            <RiskBadge level={selected.risk_level} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

