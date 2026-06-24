import type {
  AttackCaseIOCIocEntryHitDetail,
  AttackCaseIOCIocObservation,
  AttackCaseIOCIocRelation,
} from "@/features/ioc-analysis/types"

import { DetailFieldTable } from "./detail-table"
import {
  detailFieldValue,
  type IocDetailLocale,
  displayValue,
  scoreDisplayValue,
} from "./detail-fields"
import { evidenceValue, iocEntryFields } from "./detail-legacy-fields"

type IocEntryDetailLabels = {
  observations: string
  sourceName: string
  confidence: string
  lastSeen: string
  evidence: string
  relations: string
  direction: string
  relationType: string
  peerEntryId: string
}

function IocEntryObservationRows({
  observations,
  labels,
}: {
  observations: AttackCaseIOCIocObservation[]
  labels: IocEntryDetailLabels
}) {
  if (!observations.length) return null

  return (
    <div className="border-t border-slate-100">
      <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
        {labels.observations}
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[1fr_80px_128px_1.4fr] border-t border-slate-100 bg-white px-4 py-2 text-xs font-semibold text-slate-400">
            <span>{labels.sourceName}</span>
            <span>{labels.confidence}</span>
            <span>{labels.lastSeen}</span>
            <span>{labels.evidence}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {observations.map((observation, index) => {
              const evidence = evidenceValue(observation.evidence)
              const confidence = scoreDisplayValue(
                displayValue(observation.confidence),
                "confidence",
              )
              const rowKey = `${observation.source_name}-${observation.source_record_id}-${index}`
              return (
                <div
                  key={rowKey}
                  className="grid grid-cols-[1fr_80px_128px_1.4fr] items-center px-4 py-2 text-xs text-slate-700"
                >
                  <span className="truncate font-medium" title={observation.source_name}>
                    {displayValue(observation.source_name)}
                  </span>
                  <span>{confidence}</span>
                  <span className="truncate" title={observation.last_seen}>
                    {displayValue(observation.last_seen)}
                  </span>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <code className="truncate font-mono" title={evidence}>
                      {evidence}
                    </code>
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
  locale,
  labels,
}: {
  relations: AttackCaseIOCIocRelation[]
  locale: IocDetailLocale
  labels: IocEntryDetailLabels
}) {
  if (!relations.length) return null

  return (
    <div className="border-t border-slate-100">
      <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
        {labels.relations}
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[72px_1fr_1fr_1.4fr_128px] border-t border-slate-100 bg-white px-4 py-2 text-xs font-semibold text-slate-400">
            <span>{labels.direction}</span>
            <span>{labels.relationType}</span>
            <span>{labels.sourceName}</span>
            <span>{labels.peerEntryId}</span>
            <span>{labels.lastSeen}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {relations.map((relation, index) => {
              const peerEntryId = relation.peer_entry?.id || ""
              const rowKey = `${relation.direction}-${relation.relation_type}-${peerEntryId}-${index}`
              return (
                <div
                  key={rowKey}
                  className="grid grid-cols-[72px_1fr_1fr_1.4fr_128px] items-center px-4 py-2 text-xs text-slate-700"
                >
                  <span>
                    {detailFieldValue(
                      { column: "direction", value: displayValue(relation.direction) },
                      locale,
                    )}
                  </span>
                  <span className="truncate font-medium" title={relation.relation_type}>
                    {displayValue(relation.relation_type)}
                  </span>
                  <span className="truncate" title={relation.source_name}>
                    {displayValue(relation.source_name)}
                  </span>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <code
                      className="truncate font-mono font-semibold text-slate-800"
                      title={peerEntryId}
                    >
                      {displayValue(peerEntryId)}
                    </code>
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

export function IocEntryDetailView({
  detail,
  columnLabel,
  valueLabel,
  locale,
  copyLabel,
  labels,
  onCopy,
}: {
  detail: AttackCaseIOCIocEntryHitDetail
  columnLabel: string
  valueLabel: string
  locale: IocDetailLocale
  copyLabel: string
  labels: IocEntryDetailLabels
  onCopy: (value: string) => void
}) {
  return (
    <div>
      <DetailFieldTable
        fields={iocEntryFields(detail)}
        columnLabel={columnLabel}
        valueLabel={valueLabel}
        locale={locale}
        copyLabel={copyLabel}
        onCopy={onCopy}
      />
      <IocEntryObservationRows
        observations={detail.observations}
        labels={labels}
      />
      <IocEntryRelationRows
        relations={detail.relations}
        locale={locale}
        labels={labels}
      />
    </div>
  )
}

