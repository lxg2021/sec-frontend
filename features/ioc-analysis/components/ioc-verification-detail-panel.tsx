"use client"

import { Clipboard, Database, Loader2, Table2 } from "lucide-react"
import { useTranslations } from "next-intl"

import type {
  AttackCaseIOCBlacklistIndicatorHitDetail,
  AttackCaseIOCHitSourceRef,
  AttackCaseIOCIocEntryHitDetail,
  AttackCaseIOCIocObservation,
  AttackCaseIOCIocRelation,
  AttackCaseIOCJSONEvidence,
  IocVerificationItem,
} from "@/features/ioc-analysis/types"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

type DetailField = {
  column: string
  value: string
  wide?: boolean
}

function formatList(values: string[]) {
  if (!values.length) return "-"
  return `[${values.map((value) => `'${value}'`).join(", ")}]`
}

function displayValue(value: string | number | undefined | null) {
  if (typeof value === "number") return String(value)
  const normalized = value?.trim() || ""
  return normalized || "-"
}

function tableName(source: AttackCaseIOCHitSourceRef | null) {
  if (!source) return ""
  return [source.database, source.table].filter(Boolean).join(".")
}

function hitSourceFromItem(item: IocVerificationItem) {
  const verification = item.verification
  if (!verification) return null
  if (
    !verification.hit_source_database &&
    !verification.hit_source_table &&
    !verification.hit_source_record_id
  ) {
    return null
  }

  return {
    database: verification.hit_source_database,
    table: verification.hit_source_table,
    record_id: verification.hit_source_record_id,
  }
}

function blacklistFields(
  detail: AttackCaseIOCBlacklistIndicatorHitDetail,
): DetailField[] {
  return [
    { column: "indicator_key", value: displayValue(detail.indicator_key) },
    { column: "ioc_type", value: displayValue(detail.ioc_type) },
    { column: "value_subtype", value: displayValue(detail.value_subtype) },
    { column: "normalized_value", value: displayValue(detail.normalized_value) },
    { column: "display_value", value: displayValue(detail.display_value) },
    { column: "status", value: displayValue(detail.status) },
    { column: "categories", value: formatList(detail.categories) },
    { column: "confidence", value: displayValue(detail.confidence) },
    { column: "source_count", value: displayValue(detail.source_count) },
    { column: "feed_count", value: displayValue(detail.feed_count) },
    { column: "source_names", value: formatList(detail.source_names) },
    { column: "feed_names", value: formatList(detail.feed_names) },
    { column: "first_seen_utc", value: displayValue(detail.first_seen) },
    { column: "last_seen_utc", value: displayValue(detail.last_seen) },
    { column: "last_batch_id", value: displayValue(detail.last_batch_id) },
    { column: "extra_json_keys", value: formatList(detail.extra_json_keys) },
    { column: "source_urls", value: formatList(detail.source_urls), wide: true },
    { column: "extra_json", value: displayValue(detail.extra_json), wide: true },
  ]
}

function iocEntryFields(detail: AttackCaseIOCIocEntryHitDetail): DetailField[] {
  const entry = detail.entry
  if (!entry) return []

  return [
    { column: "entry_id", value: displayValue(entry.id) },
    { column: "ioc_type", value: displayValue(entry.ioc_type) },
    { column: "observable_type", value: displayValue(entry.observable_type) },
    { column: "status", value: displayValue(entry.status) },
    { column: "risk_score", value: displayValue(entry.risk_score) },
    { column: "confidence", value: displayValue(entry.confidence) },
    { column: "first_seen_utc", value: displayValue(entry.first_seen) },
    { column: "last_seen_utc", value: displayValue(entry.last_seen) },
    { column: "tags", value: formatList(entry.tags) },
    { column: "extra_json_keys", value: formatList(entry.extra_json_keys) },
    {
      column: "normalized_value",
      value: displayValue(entry.normalized_value),
      wide: true,
    },
    { column: "display_value", value: displayValue(entry.display_value), wide: true },
    { column: "extra_json", value: displayValue(entry.extra_json), wide: true },
  ]
}

function evidenceValue(evidence: AttackCaseIOCJSONEvidence | null) {
  if (!evidence) return "-"
  return (
    evidence.raw_json_preview ||
    formatList(evidence.raw_json_keys) ||
    displayValue(evidence.raw_json_length)
  )
}

function CopyValueButton({
  value,
  onCopy,
}: {
  value: string
  onCopy: (value: string) => void
}) {
  if (!value || value === "-") return null
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0 rounded-full text-slate-400 hover:bg-sky-50 hover:text-sky-700"
      onClick={() => onCopy(value)}
      aria-label="Copy field value"
    >
      <Clipboard className="size-3.5" aria-hidden="true" />
    </Button>
  )
}

function DetailFieldTable({
  fields,
  columnLabel,
  valueLabel,
  onCopy,
}: {
  fields: DetailField[]
  columnLabel: string
  valueLabel: string
  onCopy: (value: string) => void
}) {
  if (!fields.length) {
    return (
      <div className="border-t border-slate-100 px-4 py-5 text-sm text-slate-500">
        -
      </div>
    )
  }

  return (
    <div>
      <div className="sticky top-0 z-10 grid grid-cols-[160px_minmax(0,1fr)] bg-white text-xs font-semibold text-slate-400 md:grid-cols-[160px_minmax(0,1fr)_160px_minmax(0,1fr)]">
        <div className="px-4 py-2">{columnLabel}</div>
        <div className="border-l border-slate-100 px-4 py-2">{valueLabel}</div>
        <div className="hidden border-l border-slate-100 px-4 py-2 md:block">
          {columnLabel}
        </div>
        <div className="hidden border-l border-slate-100 px-4 py-2 md:block">
          {valueLabel}
        </div>
      </div>
      <PairedFieldRows fields={fields} onCopy={onCopy} />
    </div>
  )
}

function IocEntryObservationRows({
  observations,
  onCopy,
}: {
  observations: AttackCaseIOCIocObservation[]
  onCopy: (value: string) => void
}) {
  if (!observations.length) return null

  return (
    <div className="border-t border-slate-100">
      <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
        observations
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[1fr_1.2fr_80px_128px_128px_1.4fr] border-t border-slate-100 bg-white px-4 py-2 text-xs font-semibold text-slate-400">
            <span>source_name</span>
            <span>source_record_id</span>
            <span>confidence</span>
            <span>first_seen</span>
            <span>last_seen</span>
            <span>evidence</span>
          </div>
          <div className="divide-y divide-slate-100">
            {observations.map((observation, index) => {
              const evidence = evidenceValue(observation.evidence)
              const rowKey = `${observation.source_name}-${observation.source_record_id}-${index}`
              return (
                <div
                  key={rowKey}
                  className="grid grid-cols-[1fr_1.2fr_80px_128px_128px_1.4fr] items-center px-4 py-2 text-xs text-slate-700"
                >
                  <span className="truncate font-medium" title={observation.source_name}>
                    {displayValue(observation.source_name)}
                  </span>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <code
                      className="truncate font-mono font-semibold text-slate-800"
                      title={observation.source_record_id}
                    >
                      {displayValue(observation.source_record_id)}
                    </code>
                    <CopyValueButton
                      value={observation.source_record_id}
                      onCopy={onCopy}
                    />
                  </span>
                  <span>{displayValue(observation.confidence)}</span>
                  <span className="truncate" title={observation.first_seen}>
                    {displayValue(observation.first_seen)}
                  </span>
                  <span className="truncate" title={observation.last_seen}>
                    {displayValue(observation.last_seen)}
                  </span>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <code className="truncate font-mono" title={evidence}>
                      {evidence}
                    </code>
                    <CopyValueButton value={evidence} onCopy={onCopy} />
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function IocEntryRelationRows({
  relations,
  onCopy,
}: {
  relations: AttackCaseIOCIocRelation[]
  onCopy: (value: string) => void
}) {
  if (!relations.length) return null

  return (
    <div className="border-t border-slate-100">
      <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
        relations
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[72px_1fr_1fr_1.2fr_1.4fr_128px] border-t border-slate-100 bg-white px-4 py-2 text-xs font-semibold text-slate-400">
            <span>direction</span>
            <span>relation_type</span>
            <span>source_name</span>
            <span>source_record_id</span>
            <span>peer_entry_id</span>
            <span>last_seen</span>
          </div>
          <div className="divide-y divide-slate-100">
            {relations.map((relation, index) => {
              const peerEntryId = relation.peer_entry?.id || ""
              const rowKey = `${relation.direction}-${relation.relation_type}-${peerEntryId}-${index}`
              return (
                <div
                  key={rowKey}
                  className="grid grid-cols-[72px_1fr_1fr_1.2fr_1.4fr_128px] items-center px-4 py-2 text-xs text-slate-700"
                >
                  <span>{displayValue(relation.direction)}</span>
                  <span className="truncate font-medium" title={relation.relation_type}>
                    {displayValue(relation.relation_type)}
                  </span>
                  <span className="truncate" title={relation.source_name}>
                    {displayValue(relation.source_name)}
                  </span>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <code
                      className="truncate font-mono font-semibold text-slate-800"
                      title={relation.source_record_id}
                    >
                      {displayValue(relation.source_record_id)}
                    </code>
                    <CopyValueButton
                      value={relation.source_record_id}
                      onCopy={onCopy}
                    />
                  </span>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <code
                      className="truncate font-mono font-semibold text-slate-800"
                      title={peerEntryId}
                    >
                      {displayValue(peerEntryId)}
                    </code>
                    <CopyValueButton value={peerEntryId} onCopy={onCopy} />
                  </span>
                  <span className="truncate" title={relation.last_seen}>
                    {displayValue(relation.last_seen)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function IocEntryDetailView({
  detail,
  columnLabel,
  valueLabel,
  onCopy,
}: {
  detail: AttackCaseIOCIocEntryHitDetail
  columnLabel: string
  valueLabel: string
  onCopy: (value: string) => void
}) {
  return (
    <div>
      <DetailFieldTable
        fields={iocEntryFields(detail)}
        columnLabel={columnLabel}
        valueLabel={valueLabel}
        onCopy={onCopy}
      />
      <IocEntryObservationRows observations={detail.observations} onCopy={onCopy} />
      <IocEntryRelationRows relations={detail.relations} onCopy={onCopy} />
    </div>
  )
}

function FieldRow({
  field,
  onCopy,
}: {
  field: DetailField
  onCopy: (value: string) => void
}) {
  return (
    <div
      className={cn(
        "grid min-h-10 items-center border-t border-slate-100",
        field.wide
          ? "grid-cols-[160px_minmax(0,1fr)]"
          : "grid-cols-[160px_minmax(0,1fr)] md:grid-cols-[160px_minmax(0,1fr)_160px_minmax(0,1fr)]",
      )}
    >
      <div className="px-4 py-2 text-xs font-semibold text-slate-500">
        {field.column}
      </div>
      <div
        className="flex min-w-0 items-center gap-2 border-l border-slate-100 px-4 py-2"
      >
        <code
          className="min-w-0 flex-1 break-all font-mono text-xs font-semibold leading-5 text-slate-800"
          title={field.value}
        >
          {field.value}
        </code>
        <CopyValueButton value={field.value} onCopy={onCopy} />
      </div>
    </div>
  )
}

function PairedFieldRows({
  fields,
  onCopy,
}: {
  fields: DetailField[]
  onCopy: (value: string) => void
}) {
  const rows: Array<[DetailField, DetailField | null]> = []
  const wideRows: DetailField[] = []
  const compact = fields.filter((field) => {
    if (field.wide) {
      wideRows.push(field)
      return false
    }
    return true
  })

  for (let index = 0; index < compact.length; index += 2) {
    rows.push([compact[index], compact[index + 1] ?? null])
  }

  return (
    <>
      {rows.map(([left, right]) => (
        <div
          key={`${left.column}-${right?.column || "empty"}`}
          className="grid min-h-10 grid-cols-[160px_minmax(0,1fr)] border-t border-slate-100 md:grid-cols-[160px_minmax(0,1fr)_160px_minmax(0,1fr)]"
        >
          <div className="px-4 py-2 text-xs font-semibold text-slate-500">
            {left.column}
          </div>
          <div className="flex min-w-0 items-center gap-2 border-l border-slate-100 px-4 py-2">
            <code
              className="min-w-0 flex-1 break-all font-mono text-xs font-semibold leading-5 text-slate-800"
              title={left.value}
            >
              {left.value}
            </code>
            <CopyValueButton value={left.value} onCopy={onCopy} />
          </div>
          {right ? (
            <>
              <div className="border-l border-slate-100 px-4 py-2 text-xs font-semibold text-slate-500">
                {right.column}
              </div>
              <div className="flex min-w-0 items-center gap-2 border-l border-slate-100 px-4 py-2">
                <code
                  className="min-w-0 flex-1 break-all font-mono text-xs font-semibold leading-5 text-slate-800"
                  title={right.value}
                >
                  {right.value}
                </code>
                <CopyValueButton value={right.value} onCopy={onCopy} />
              </div>
            </>
          ) : (
            <>
              <div className="hidden border-l border-slate-100 px-4 py-2 md:block" />
              <div className="hidden border-l border-slate-100 px-4 py-2 md:block" />
            </>
          )}
        </div>
      ))}
      {wideRows.map((field) => (
        <FieldRow key={field.column} field={field} onCopy={onCopy} />
      ))}
    </>
  )
}

export function IocVerificationDetailPanel({
  className,
  item,
  onCopy,
}: {
  className?: string
  item: IocVerificationItem | null
  onCopy: (value: string) => void
}) {
  const t = useTranslations("pages.iocAnalysis.verification")

  const detail = item?.verification_detail ?? null
  const iocEntry = detail?.hit_source_detail?.ioc_entry ?? null
  const blacklist = detail?.hit_source_detail?.blacklist_indicator ?? null
  const source =
    iocEntry?.source ??
    blacklist?.source ??
    detail?.hit_source ??
    (item ? hitSourceFromItem(item) : null)
  const sourceTable = tableName(source)
  const recordId = source?.record_id || item?.verification?.hit_source_record_id || ""

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-white",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <Table2 className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-950">
              {t("detail.title")}
            </h3>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {t("detail.description")}
            </p>
          </div>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {sourceTable ? (
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
              <Database className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{sourceTable}</span>
            </span>
          ) : null}
          {recordId ? (
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <span className="truncate font-mono">{recordId}</span>
              <button
                type="button"
                className="text-blue-500 hover:text-blue-700"
                onClick={() => onCopy(recordId)}
                aria-label="Copy record id"
              >
                <Clipboard className="size-3.5" aria-hidden="true" />
              </button>
            </span>
          ) : null}
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {!item ? (
          <div className="flex min-h-[156px] items-center justify-center px-4 py-8 text-sm text-slate-500">
            {t("detail.noSelection")}
          </div>
        ) : iocEntry ? (
          <IocEntryDetailView
            detail={iocEntry}
            columnLabel={t("detail.column")}
            valueLabel={t("detail.value")}
            onCopy={onCopy}
          />
        ) : blacklist ? (
          <DetailFieldTable
            fields={blacklistFields(blacklist)}
            columnLabel={t("detail.column")}
            valueLabel={t("detail.value")}
            onCopy={onCopy}
          />
        ) : item.verification && !detail ? (
          <div className="flex min-h-[156px] items-center justify-center gap-2 px-4 py-8 text-sm text-slate-500">
            <Loader2 className="size-4 animate-spin text-sky-600" aria-hidden="true" />
            {t("detail.loading")}
          </div>
        ) : (
          <div className="min-h-[156px] px-4 py-5">
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
              {t("detail.unavailable")}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
