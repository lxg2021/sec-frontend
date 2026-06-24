import type {
  AttackCaseIOCBlacklistIndicatorHitDetail,
  AttackCaseIOCIocEntryHitDetail,
  AttackCaseIOCJSONEvidence,
} from "@/features/ioc-analysis/types"

import type { DetailField } from "./detail-fields"
import { displayValue, formatList } from "./detail-fields"

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
  if (evidence.raw_json_preview) return evidence.raw_json_preview
  if (evidence.raw_json_keys.length) return formatList(evidence.raw_json_keys)
  return displayValue(evidence.raw_json_length)
}

export { blacklistFields, evidenceValue, iocEntryFields }
