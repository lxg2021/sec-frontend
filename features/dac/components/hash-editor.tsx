"use client"

import { Hash, Plus, Trash2 } from "lucide-react"

import type { AccessControlCopy } from "../access-control-copy"
import type { AccessHash } from "../access-control-types"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

interface HashEditorProps {
  copy: AccessControlCopy
  hashes: AccessHash[]
  onChange: (hashes: AccessHash[]) => void
  className?: string
}

export function HashEditor({ copy, hashes, onChange, className = "" }: HashEditorProps) {
  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between">
        <Label className="flex items-center gap-1.5 text-xs text-slate-600">
          <Hash className="h-3.5 w-3.5" />
          {copy.hashes}
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-blue-600"
          onClick={() => onChange([...hashes, { algo: "sha256", value: "" }])}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          {copy.addHash}
        </Button>
      </div>
      {hashes.length > 0 ? (
        <div className="space-y-2">
          {hashes.map((hash, index) => (
            <div key={`${index}-${hash.algo}`} className="flex gap-2">
              <Select
                value={hash.algo}
                onValueChange={(algo) => {
                  const next = [...hashes]
                  next[index] = { ...hash, algo: algo as AccessHash["algo"] }
                  onChange(next)
                }}
              >
                <SelectTrigger className="h-9 w-28 bg-white font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="md5">MD5</SelectItem>
                  <SelectItem value="sha1">SHA1</SelectItem>
                  <SelectItem value="sha256">SHA256</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={hash.value}
                onChange={(event) => {
                  const next = [...hashes]
                  next[index] = { ...hash, value: event.target.value }
                  onChange(next)
                }}
                placeholder={copy.hashValue}
                className="h-9 bg-white font-mono text-xs"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-slate-400 hover:text-red-600"
                onClick={() => onChange(hashes.filter((_, hashIndex) => hashIndex !== index))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
