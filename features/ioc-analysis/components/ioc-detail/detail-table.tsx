import { Clipboard } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

import type {
  DetailField,
  DetailFieldSection,
  IocDetailLocale,
} from "./detail-fields"
import {
  compactFields,
  detailFieldKey,
  detailFieldLabel,
  detailFieldValue,
  detailSectionSubtitle,
  detailSectionTitle,
  shouldCopyDetailField,
} from "./detail-fields"
import { compactSections } from "./detail-sections"

function CopyValueButton({
  value,
  onCopy,
  label,
}: {
  value: string
  onCopy: (value: string) => void
  label: string
}) {
  if (!value || value === "-") return null
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0 rounded-full text-slate-400 hover:bg-sky-50 hover:text-sky-700"
      onClick={() => onCopy(value)}
      aria-label={label}
    >
      <Clipboard className="size-3.5" aria-hidden="true" />
    </Button>
  )
}

const MONOSPACE_VALUE_FIELD_KEYS = new Set([
  "authentihash",
  "batch_id",
  "certificate_thumbprint",
  "cert_thumbprint",
  "display_value",
  "entry_id",
  "hash_value",
  "indicator_key",
  "ip",
  "ip_value",
  "last_batch_id",
  "last_seen",
  "last_seen_utc",
  "md5",
  "md5_hash",
  "normalized_value",
  "peer_entry_id",
  "peer_value",
  "reference",
  "response_md5",
  "response_sha256",
  "serial_number",
  "sha1",
  "sha1_hash",
  "sha256",
  "sha256_hash",
  "source_url",
  "source_urls",
  "url",
  "urlhaus_download",
  "urlhaus_reference",
])

const SOFT_TEXT_FIELD_KEYS = new Set([
  "comment",
  "description",
  "event_info",
  "info",
  "object_comment",
  "object_description",
  "reason",
  "reasons",
  "summary",
])

function isTechnicalValue(field: DetailField, value: string) {
  const key = detailFieldKey(field.column)
  if (MONOSPACE_VALUE_FIELD_KEYS.has(key)) return true
  if (key.endsWith("_id") || key.endsWith("_url") || key.endsWith("_hash")) {
    return true
  }
  if (/^https?:\/\//i.test(value)) return true
  if (/^[a-f0-9]{24,}$/i.test(value)) return true
  if (/^\d{1,3}(?:\.\d{1,3}){3}(?:\/\d{1,2})?$/.test(value)) return true
  if (/^\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2}:\d{2})?/.test(value)) return true
  return false
}

function isSoftTextValue(field: DetailField, value: string) {
  const key = detailFieldKey(field.column)
  return SOFT_TEXT_FIELD_KEYS.has(key) || value.length > 48
}

function DetailValueText({
  field,
  value,
}: {
  field: DetailField
  value: string
}) {
  const technical = isTechnicalValue(field, value)
  const softText = isSoftTextValue(field, value)
  const Component = technical ? "code" : "span"

  return (
    <Component
      className={cn(
        "min-w-0 flex-1 leading-5 text-slate-800",
        technical
          ? "break-all font-mono text-[11px] font-medium"
          : "break-words text-xs",
        !technical && softText ? "font-normal text-slate-700" : "",
        !technical && !softText ? "font-medium" : "",
      )}
      title={value}
    >
      {value}
    </Component>
  )
}

function DetailValueCell({
  field,
  value,
  copyable,
  copyLabel,
  onCopy,
}: {
  field: DetailField
  value: string
  copyable: boolean
  copyLabel: string
  onCopy: (value: string) => void
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 border-l border-slate-100 px-4 py-2">
      <DetailValueText field={field} value={value} />
      {copyable ? (
        <CopyValueButton value={value} label={copyLabel} onCopy={onCopy} />
      ) : null}
    </div>
  )
}

export function DetailFieldTable({
  fields,
  columnLabel,
  valueLabel,
  locale,
  copyLabel,
  onCopy,
}: {
  fields: DetailField[]
  columnLabel: string
  valueLabel: string
  locale: IocDetailLocale
  copyLabel: string
  onCopy: (value: string) => void
}) {
  const visibleFields = compactFields(fields)

  if (!visibleFields.length) {
    return (
      <div className="border-t border-slate-100 px-4 py-5 text-sm text-slate-500">
        -
      </div>
    )
  }

  return (
    <div>
      <div className="sticky top-0 z-10 grid grid-cols-[128px_minmax(0,1fr)] bg-white text-xs font-medium text-slate-400 md:grid-cols-[128px_minmax(0,1fr)_128px_minmax(0,1fr)]">
        <div className="px-4 py-2">{columnLabel}</div>
        <div className="border-l border-slate-100 px-4 py-2">{valueLabel}</div>
        <div className="hidden border-l border-slate-100 px-4 py-2 md:block">
          {columnLabel}
        </div>
        <div className="hidden border-l border-slate-100 px-4 py-2 md:block">
          {valueLabel}
        </div>
      </div>
      <PairedFieldRows
        fields={visibleFields}
        locale={locale}
        copyLabel={copyLabel}
        onCopy={onCopy}
      />
    </div>
  )
}

export function DetailFieldSections({
  sections,
  columnLabel,
  valueLabel,
  locale,
  copyLabel,
  onCopy,
}: {
  sections: DetailFieldSection[]
  columnLabel: string
  valueLabel: string
  locale: IocDetailLocale
  copyLabel: string
  onCopy: (value: string) => void
}) {
  const visibleSections = compactSections(sections)

  if (!visibleSections.length) {
    return (
      <div className="border-t border-slate-100 px-4 py-5 text-sm text-slate-500">
        -
      </div>
    )
  }

  return (
    <div>
      <div className="sticky top-0 z-10 grid grid-cols-[128px_minmax(0,1fr)] bg-white text-xs font-medium text-slate-400 md:grid-cols-[128px_minmax(0,1fr)_128px_minmax(0,1fr)]">
        <div className="px-4 py-2">{columnLabel}</div>
        <div className="border-l border-slate-100 px-4 py-2">{valueLabel}</div>
        <div className="hidden border-l border-slate-100 px-4 py-2 md:block">
          {columnLabel}
        </div>
        <div className="hidden border-l border-slate-100 px-4 py-2 md:block">
          {valueLabel}
        </div>
      </div>
      {visibleSections.map((section) => {
        const title = detailSectionTitle(section.title, locale)
        const subtitle = section.subtitle
          ? detailSectionSubtitle(section.subtitle, locale)
          : ""

        return (
          <div key={section.id} className="border-t border-slate-100">
            <div className="bg-slate-50 px-4 py-2">
              <div
                className="truncate text-xs font-medium text-slate-700"
                title={title}
              >
                {title}
              </div>
              {subtitle ? (
                <div
                  className="mt-0.5 truncate text-[11px] text-slate-400"
                  title={subtitle}
                >
                  {subtitle}
                </div>
              ) : null}
            </div>
            <PairedFieldRows
              fields={section.fields}
              locale={locale}
              copyLabel={copyLabel}
              onCopy={onCopy}
            />
          </div>
        )
      })}
    </div>
  )
}

function FieldRow({
  field,
  locale,
  copyLabel,
  onCopy,
}: {
  field: DetailField
  locale: IocDetailLocale
  copyLabel: string
  onCopy: (value: string) => void
}) {
  const label = detailFieldLabel(field.column, locale)
  const value = detailFieldValue(field, locale)
  const copyable = shouldCopyDetailField(field, value)

  return (
    <div
      className={cn(
        "grid min-h-10 items-center border-t border-slate-100",
        field.wide
          ? "grid-cols-[128px_minmax(0,1fr)]"
          : "grid-cols-[128px_minmax(0,1fr)] md:grid-cols-[128px_minmax(0,1fr)_128px_minmax(0,1fr)]",
      )}
    >
      <div className="flex items-center px-4 py-2 text-xs font-medium text-slate-500">
        {label}
      </div>
      <DetailValueCell
        field={field}
        value={value}
        copyable={copyable}
        copyLabel={copyLabel}
        onCopy={onCopy}
      />
    </div>
  )
}

function PairedFieldRows({
  fields,
  locale,
  copyLabel,
  onCopy,
}: {
  fields: DetailField[]
  locale: IocDetailLocale
  copyLabel: string
  onCopy: (value: string) => void
}) {
  const rows: Array<
    | { type: "pair"; left: DetailField; right: DetailField | null }
    | { type: "wide"; field: DetailField }
  > = []
  let pendingField: DetailField | null = null

  fields.forEach((field) => {
    if (field.wide) {
      if (pendingField) {
        rows.push({ type: "pair", left: pendingField, right: null })
        pendingField = null
      }
      rows.push({ type: "wide", field })
      return
    }

    if (pendingField) {
      rows.push({ type: "pair", left: pendingField, right: field })
      pendingField = null
      return
    }

    pendingField = field
  })

  if (pendingField) {
    rows.push({ type: "pair", left: pendingField, right: null })
  }

  return (
    <>
      {rows.map((row, rowIndex) => {
        if (row.type === "wide") {
          return (
            <FieldRow
              key={`wide-${rowIndex}-${row.field.column}`}
              field={row.field}
              locale={locale}
              copyLabel={copyLabel}
              onCopy={onCopy}
            />
          )
        }

        const { left, right } = row
        const leftLabel = detailFieldLabel(left.column, locale)
        const leftValue = detailFieldValue(left, locale)
        const leftCopyable = shouldCopyDetailField(left, leftValue)
        const rightLabel = right ? detailFieldLabel(right.column, locale) : ""
        const rightValue = right ? detailFieldValue(right, locale) : ""
        const rightCopyable = right
          ? shouldCopyDetailField(right, rightValue)
          : false

        return (
          <div
            key={`pair-${rowIndex}-${left.column}-${right?.column || "empty"}`}
            className="grid min-h-10 grid-cols-[128px_minmax(0,1fr)] border-t border-slate-100 md:grid-cols-[128px_minmax(0,1fr)_128px_minmax(0,1fr)]"
          >
            <div className="flex items-center px-4 py-2 text-xs font-medium text-slate-500">
              {leftLabel}
            </div>
            <DetailValueCell
              field={left}
              value={leftValue}
              copyable={leftCopyable}
              copyLabel={copyLabel}
              onCopy={onCopy}
            />
            {right ? (
              <>
                <div className="flex items-center border-l border-slate-100 px-4 py-2 text-xs font-medium text-slate-500">
                  {rightLabel}
                </div>
                <DetailValueCell
                  field={right}
                  value={rightValue}
                  copyable={rightCopyable}
                  copyLabel={copyLabel}
                  onCopy={onCopy}
                />
              </>
            ) : (
              <>
                <div className="hidden border-l border-slate-100 px-4 py-2 md:block" />
                <div className="hidden border-l border-slate-100 px-4 py-2 md:block" />
              </>
            )}
          </div>
        )
      })}
    </>
  )
}
