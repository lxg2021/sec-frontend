"use client"

import { useMemo, useState, type FormEvent } from "react"
import { Plus, Search, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"

import type { IocVerificationType } from "@/features/ioc-analysis/types"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"

type ManualIocRow = {
  line: string
  type: IocVerificationType
  displayType: IocVerificationType
  value: string
  status: "ready" | "invalid"
}

const TYPE_PREFIX_PATTERN = /^([a-z0-9_-]+)\s*[:：]\s*(.+)$/i
const MANUAL_TYPE_SET = new Set<IocVerificationType>([
  "auto",
  "hash",
  "md5",
  "sha1",
  "sha256",
  "url",
  "domain",
  "hostname",
  "ip",
  "email",
  "certificate",
])
const HASH_PATTERN = /^[a-f0-9]{32}$|^[a-f0-9]{40}$|^[a-f0-9]{64}$/i
const MD5_PATTERN = /^[a-f0-9]{32}$/i
const SHA1_PATTERN = /^[a-f0-9]{40}$/i
const SHA256_PATTERN = /^[a-f0-9]{64}$/i
const DOMAIN_PATTERN = /^(?=.{1,253}$)(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i
const HOSTNAME_PATTERN = /^(?=.{1,253}$)(?!-)(?:[a-z0-9-]{1,63}\.)*[a-z0-9-]{1,63}$/i

function splitManualLines(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function formatManualLine(type: IocVerificationType, value: string) {
  const trimmed = value.trim()
  return type === "auto" ? trimmed : `${type}: ${trimmed}`
}

function getLineParts(line: string, fallbackType: IocVerificationType) {
  const match = line.match(TYPE_PREFIX_PATTERN)
  const matchedType = match?.[1]?.trim().toLowerCase() as IocVerificationType | undefined
  const hasKnownType = matchedType ? MANUAL_TYPE_SET.has(matchedType) : false
  const value = match && hasKnownType ? match[2]?.trim() ?? "" : line.trim()
  return {
    type: hasKnownType && matchedType ? matchedType : fallbackType,
    value,
  }
}

function isValidIp(value: string) {
  const parts = value.split(".")
  return parts.length === 4 && parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false
    const parsed = Number.parseInt(part, 10)
    return parsed >= 0 && parsed <= 255
  })
}

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

function inferAutoType(value: string): IocVerificationType | null {
  const normalized = value.trim()
  if (!normalized) return null
  if (isValidUrl(normalized)) return "url"
  if (MD5_PATTERN.test(normalized)) return "md5"
  if (SHA1_PATTERN.test(normalized)) return "sha1"
  if (SHA256_PATTERN.test(normalized)) return "sha256"
  if (isValidIp(normalized)) return "ip"
  if (DOMAIN_PATTERN.test(normalized)) return "domain"
  return null
}

function isRowReady(type: IocVerificationType, value: string) {
  if (!value.trim()) return false
  switch (type) {
    case "auto":
      return Boolean(inferAutoType(value))
    case "hash":
      return HASH_PATTERN.test(value)
    case "md5":
      return MD5_PATTERN.test(value)
    case "sha1":
      return SHA1_PATTERN.test(value)
    case "sha256":
      return SHA256_PATTERN.test(value)
    case "url":
      return isValidUrl(value)
    case "ip":
      return isValidIp(value)
    case "domain":
      return DOMAIN_PATTERN.test(value)
    case "hostname":
      return HOSTNAME_PATTERN.test(value)
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    case "certificate":
      return value.trim().length >= 8
    default:
      return true
  }
}

function typeClass(type: IocVerificationType) {
  if (type === "md5" || type === "sha1" || type === "sha256" || type === "hash") {
    return "border-violet-200 bg-violet-50 text-violet-700"
  }
  if (type === "url") return "border-blue-200 bg-blue-50 text-blue-700"
  if (type === "ip") return "border-cyan-200 bg-cyan-50 text-cyan-700"
  if (type === "domain" || type === "hostname") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }
  if (type === "certificate") return "border-amber-200 bg-amber-50 text-amber-700"
  return "border-slate-200 bg-slate-50 text-slate-600"
}

export function IocVerificationManualPanel({
  manualType,
  manualInput,
  typeOptions,
  verifying,
  onManualTypeChange,
  onManualInputChange,
  onSubmit,
}: {
  manualType: IocVerificationType
  manualInput: string
  typeOptions: IocVerificationType[]
  verifying: boolean
  onManualTypeChange: (value: IocVerificationType) => void
  onManualInputChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const t = useTranslations("pages.iocAnalysis.verification")
  const [draftType, setDraftType] = useState<IocVerificationType>(manualType)
  const [draftValue, setDraftValue] = useState("")
  const rows = useMemo<ManualIocRow[]>(
    () =>
      splitManualLines(manualInput).map((line) => {
        const { type, value } = getLineParts(line, manualType)
        const inferredType = type === "auto" ? inferAutoType(value) : type
        return {
          line,
          type,
          displayType: inferredType ?? type,
          value,
          status: inferredType && isRowReady(type, value) ? "ready" : "invalid",
        }
      }),
    [manualInput, manualType],
  )
  const validRowCount = rows.filter((row) => row.status === "ready").length

  function commitRows(nextRows: string[]) {
    onManualInputChange(nextRows.join("\n"))
  }

  function handleAddRow() {
    const trimmed = draftValue.trim()
    if (!trimmed) return

    const nextLine = formatManualLine(draftType, trimmed)
    const existingLines = splitManualLines(manualInput)
    commitRows([...existingLines, nextLine])
    setDraftValue("")
    onManualTypeChange(draftType)
  }

  function handleRemoveRow(index: number) {
    commitRows(splitManualLines(manualInput).filter((_, rowIndex) => rowIndex !== index))
  }

  return (
    <section className="flex flex-col rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)] 2xl:min-h-0 2xl:flex-1">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <Plus className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-950">
            {t("manual.title")}
          </h2>
          <p className="text-xs leading-5 text-slate-500">
            {t("manual.description")}
          </p>
        </div>
      </div>

      <form className="mt-4 flex flex-col gap-3 2xl:min-h-0 2xl:flex-1" onSubmit={onSubmit}>
        <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-3">
          <div className="grid grid-cols-[6.25rem_minmax(0,1fr)] gap-2">
            <select
              value={draftType}
              onChange={(event) =>
                setDraftType(event.target.value as IocVerificationType)
              }
              aria-label={t("fields.type")}
              disabled={verifying}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors focus:border-blue-300"
            >
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {t(`types.${type}`)}
                </option>
              ))}
            </select>
            <Input
              value={draftValue}
              onChange={(event) => setDraftValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  handleAddRow()
                }
              }}
              placeholder={t("manual.rowPlaceholder")}
              disabled={verifying}
              className="h-10 rounded-xl border-slate-200 bg-white font-mono text-sm shadow-none focus-visible:ring-blue-200"
            />
          </div>
          <Button
            type="button"
            className="mt-2 h-9 w-full rounded-xl bg-slate-950 px-4 text-white hover:bg-slate-800"
            disabled={verifying || !draftValue.trim()}
            onClick={handleAddRow}
          >
            <Plus className="size-4" />
            {t("manual.addRow")}
          </Button>
        </div>

        <div className="flex min-h-[260px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white 2xl:min-h-0 2xl:flex-1">
          <div className="grid grid-cols-[3.75rem_minmax(0,1fr)_4.75rem_2rem] items-center gap-2 bg-slate-50 px-2.5 py-2 text-[10px] font-semibold uppercase text-slate-400">
            <div>{t("fields.type")}</div>
            <div>{t("manual.table.indicator")}</div>
            <div>{t("manual.table.formatCheck")}</div>
            <div />
          </div>
          {rows.length ? (
            <div className="ioc-manual-table-scroll divide-y divide-slate-100">
              {rows.map((row, index) => (
                <div
                  key={`${row.line}-${index}`}
                  className="grid grid-cols-[3.75rem_minmax(0,1fr)_4.75rem_2rem] items-center gap-2 px-2.5 py-2"
                >
                  <span
                    className={cn(
                      "inline-flex w-fit rounded-full border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase",
                      typeClass(row.displayType),
                    )}
                  >
                    {t(`types.${row.displayType}`)}
                  </span>
                  <code
                    className="truncate font-mono text-xs text-slate-900"
                    title={row.value}
                  >
                    {row.value}
                  </code>
                  <span
                    className={cn(
                      "inline-flex w-fit items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold",
                      row.status === "ready"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-red-200 bg-red-50 text-red-700",
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        row.status === "ready" ? "bg-emerald-500" : "bg-red-500",
                      )}
                    />
                    {t(`manual.table.status.${row.status}`)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600"
                    disabled={verifying}
                    onClick={() => handleRemoveRow(index)}
                    aria-label={t("manual.removeRow")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-[280px] items-center justify-center px-3 py-4 text-center text-xs leading-5 text-slate-500">
              {t("manual.table.empty")}
            </div>
          )}
        </div>

        <details className="group rounded-2xl border border-slate-200 bg-slate-50">
          <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-medium text-slate-600 outline-none transition-colors hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-200">
            {t("manual.bulkPaste")}
          </summary>
          <div className="border-t border-slate-200 p-3">
            <Textarea
              value={manualInput}
              onChange={(event) => onManualInputChange(event.target.value)}
              placeholder={t("manual.placeholder")}
              disabled={verifying}
              className="min-h-[88px] resize-none rounded-xl border-slate-200 bg-white font-mono text-xs shadow-none focus-visible:ring-blue-200"
            />
          </div>
        </details>

        <div className="px-3 pt-3">
          <Button
            type="submit"
            className="h-9 w-full rounded-xl bg-slate-950 px-4 text-white hover:bg-slate-800"
            disabled={verifying || !validRowCount}
          >
            <Search className="size-4" />
            {t("actions.addVerify")}
          </Button>
        </div>
      </form>
    </section>
  )
}
