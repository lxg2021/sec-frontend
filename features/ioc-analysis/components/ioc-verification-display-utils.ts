import type { useTranslations } from "next-intl"

import type {
  IocVerificationItem,
  IocVerificationType,
} from "@/features/ioc-analysis/types"

type IocVerificationTranslator = ReturnType<typeof useTranslations>

export type IocVerdict = "checking" | "malicious" | "allow" | "unknown" | "error" | "ready"

export function sourceLabelKey(source: string) {
  switch (source) {
    case "cache_hit":
      return "source.cacheHit"
    case "local_hit":
      return "source.localHit"
    case "remote_hit":
      return "source.remoteHit"
    case "remote_miss":
      return "source.remoteMiss"
    case "miss_cache_hit":
      return "source.missCacheHit"
    case "remote_error_suppressed":
      return "source.remoteErrorSuppressed"
    default:
      return "source.unknown"
  }
}

export function typeClass(type: IocVerificationType) {
  switch (type) {
    case "md5":
    case "sha1":
    case "sha256":
    case "hash":
      return "border-violet-200 bg-violet-50 text-violet-700"
    case "url":
      return "border-blue-200 bg-blue-50 text-blue-700"
    case "ip":
      return "border-cyan-200 bg-cyan-50 text-cyan-700"
    case "domain":
    case "hostname":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "certificate":
      return "border-amber-200 bg-amber-50 text-amber-700"
    default:
      return "border-slate-200 bg-slate-50 text-slate-600"
  }
}

export function isAllowlisted(item: IocVerificationItem) {
  const verification = item.verification
  return (
    item.status === "allowlisted" ||
    verification?.hit_status_key === "local_whitelist_hit" ||
    verification?.hit_kind === "whitelist" ||
    verification?.hit_verdict === "allow" ||
    verification?.final_status === "allowlisted" ||
    verification?.whitelist_status === "hit"
  )
}

export function isRemoteHit(item: IocVerificationItem) {
  const verification = item.verification
  return (
    item.result?.hit_source === "remote_hit" ||
    verification?.hit_status_key === "remote_ioc_hit" ||
    (verification?.hit_scope === "remote" && verification?.hit === true) ||
    verification?.final_status === "remote_hit" ||
    verification?.remote_status === "hit"
  )
}

export function summaryCounts(items: IocVerificationItem[]) {
  return {
    total: items.length,
    hit: items.filter((item) => item.status === "hit").length,
    miss: items.filter((item) => item.status === "miss").length,
    remote: items.filter(isRemoteHit).length,
    pending: items.filter((item) => item.status === "idle" || item.status === "checking").length,
    error: items.filter((item) => item.status === "error" || item.status === "suppressed").length,
    whitelist: items.filter(isAllowlisted).length,
  }
}

export function verdictFromItem(item: IocVerificationItem): IocVerdict {
  const verification = item.verification
  const finalStatus = verification?.final_status
  const finalVerdict = verification?.final_verdict
  const hitStatusKey = verification?.hit_status_key
  const hitKind = verification?.hit_kind
  const hitVerdict = verification?.hit_verdict

  if (item.status === "checking") return "checking"
  if (
    hitStatusKey === "local_whitelist_hit" ||
    hitKind === "whitelist" ||
    hitVerdict === "allow" ||
    finalStatus === "allowlisted" ||
    finalVerdict === "allow"
  ) {
    return "allow"
  }
  if (
    hitStatusKey === "local_ioc_hit" ||
    hitStatusKey === "remote_ioc_hit" ||
    (verification?.hit === true && hitKind === "ioc") ||
    hitVerdict === "malicious" ||
    finalStatus === "local_hit" ||
    finalStatus === "remote_hit" ||
    finalVerdict === "malicious" ||
    item.status === "hit"
  ) {
    return "malicious"
  }
  if (
    hitStatusKey === "error" ||
    hitVerdict === "error" ||
    finalStatus === "local_error" ||
    finalStatus === "remote_error" ||
    finalVerdict === "error" ||
    item.status === "error" ||
    item.status === "suppressed"
  ) {
    return "error"
  }
  if (
    hitStatusKey === "no_hit" ||
    finalStatus === "local_miss" ||
    finalStatus === "remote_miss" ||
    finalVerdict === "unknown"
  ) {
    return "unknown"
  }
  if (item.status === "idle") return "ready"
  return "unknown"
}

export function verdictClass(verdict: IocVerdict) {
  switch (verdict) {
    case "checking":
      return "border-transparent bg-blue-600 text-white"
    case "malicious":
      return "border-transparent bg-red-600 text-white"
    case "allow":
      return "border-transparent bg-emerald-600 text-white"
    case "error":
      return "border-transparent bg-rose-600 text-white"
    case "unknown":
      return "border-transparent bg-slate-500 text-white"
    default:
      return "border-transparent bg-slate-400 text-white"
  }
}

export function allowlistClass(item: IocVerificationItem) {
  if (item.status === "checking") return "border-transparent bg-blue-600 text-white"
  if (isAllowlisted(item)) return "border-transparent bg-emerald-600 text-white"
  if (item.status === "idle") return "border-transparent bg-slate-400 text-white"
  return "border-transparent bg-slate-500 text-white"
}

export function verificationSourceText(
  item: IocVerificationItem,
  t: IocVerificationTranslator,
) {
  if (item.status === "checking") return t("status.checking")
  if (item.error) return item.error
  if (item.result) return t(sourceLabelKey(item.result.hit_source))
  if (item.verification) {
    const verification = item.verification
    if (verification.hit_status_key === "local_whitelist_hit" || verification.hit_kind === "whitelist") {
      return t("allowlist.hit")
    }
    if (verification.hit_status_key === "local_ioc_hit" || (verification.hit && verification.hit_scope === "local")) {
      return t("source.localHit")
    }
    if (verification.hit_status_key === "remote_ioc_hit" || (verification.hit && verification.hit_scope === "remote")) {
      return t("source.remoteHit")
    }
    if (verification.hit_status_key === "no_hit") return t("source.localMiss")
    if (verification.hit_status_key === "error") return t("source.localError")

    switch (item.verification.final_status) {
      case "allowlisted":
        return t("allowlist.hit")
      case "local_hit":
        return t("source.localHit")
      case "local_miss":
        return t("source.localMiss")
      case "local_error":
        return t("source.localError")
      case "remote_hit":
        return t("source.remoteHit")
      case "remote_miss":
        return t("source.remoteMiss")
      case "remote_error":
        return t("source.remoteError")
      default:
        return t("status.idle")
    }
  }
  return t("status.idle")
}

export function observationSources(item: IocVerificationItem) {
  return Array.from(
    new Set(
      item.result?.observations
        .map((observation) => observation.source_name)
        .filter(Boolean) ?? [],
    ),
  )
}

export function riskText(item: IocVerificationItem) {
  if (verdictFromItem(item) === "allow") return "0"

  const score = item.verification?.risk_score || item.result?.entry?.risk_score
  if (typeof score === "number" && score > 0) return String(score)
  if (item.status === "hit") return "High"
  if (item.status === "miss") return "Low"
  if (item.status === "checking") return "-"
  return "-"
}

export function confidenceText(item: IocVerificationItem) {
  const confidence = item.verification?.confidence || item.result?.entry?.confidence
  if (typeof confidence === "number" && confidence > 0) return `${confidence}%`
  if (item.status === "hit") return "80%"
  if (item.status === "miss") return "60%"
  return "-"
}
