"use client"

import { Trash2 } from "lucide-react"

import type { AccessControlCopy } from "../access-control-copy"
import type { AccessSubjectDraft, AccessSubjectType } from "../access-control-types"
import { HashEditor } from "./hash-editor"
import { MultiValueInput } from "./multi-value-input"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

interface SubjectEditorProps {
  copy: AccessControlCopy
  subject: AccessSubjectDraft
  canRemove: boolean
  onChange: (subject: AccessSubjectDraft) => void
  onRemove: () => void
}

export function SubjectEditor({ copy, subject, canRemove, onChange, onRemove }: SubjectEditorProps) {
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
            <SelectTrigger className="h-10 rounded-lg bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(copy.subjectTypes) as AccessSubjectType[]).map((type) => (
                <SelectItem key={type} value={type}>
                  {copy.subjectTypes[type]}
                </SelectItem>
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
                onChange={(event) =>
                  onChange({
                    ...subject,
                    accounts: [
                      {
                        sid: account.sid,
                        ...(subject.type === "windowsuser"
                          ? { user_name: event.target.value }
                          : { group_name: event.target.value }),
                      },
                    ],
                  })
                }
                placeholder={subject.type === "windowsuser" ? copy.userName : copy.groupName}
                className="h-10 rounded-lg bg-white"
              />
              <Input
                value={account.sid}
                onChange={(event) =>
                  onChange({
                    ...subject,
                    accounts: [
                      {
                        sid: event.target.value,
                        ...(subject.type === "windowsuser"
                          ? { user_name: account.user_name }
                          : { group_name: account.group_name }),
                      },
                    ],
                  })
                }
                placeholder={copy.sidPlaceholder}
                className="h-10 rounded-lg bg-white font-mono text-xs"
              />
            </div>
          )}
        </div>
        {canRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 text-slate-400 hover:text-red-600"
            onClick={onRemove}
            aria-label={copy.remove}
          >
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
          <HashEditor
            copy={copy}
            hashes={subject.hashes}
            onChange={(hashes) => onChange({ ...subject, hashes })}
            className="mt-3"
          />
        </details>
      ) : null}
    </div>
  )
}
