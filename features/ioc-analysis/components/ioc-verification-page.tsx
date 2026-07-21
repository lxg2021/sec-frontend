"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react"
import { useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"

import {
  buildAttackDetailHref,
  buildAttackWorkflowHref,
  buildTraceHref,
} from "@/features/attack/detail/utils/attack-case-format"
import {
  isAllowlisted,
  observationSources,
  summaryCounts,
} from "@/features/ioc-analysis/components/ioc-verification-display-utils"
import { IocVerificationDetailPanel } from "@/features/ioc-analysis/components/ioc-verification-detail-panel"
import { IocVerificationHeader } from "@/features/ioc-analysis/components/ioc-verification-header"
import { IocVerificationManualPanel } from "@/features/ioc-analysis/components/ioc-verification-manual-panel"
import { IocVerificationResultsPanel } from "@/features/ioc-analysis/components/ioc-verification-results-panel"
import { IocVerificationSourcePanel } from "@/features/ioc-analysis/components/ioc-verification-source-panel"
import {
  createAttackCaseIocVerifyTask,
  getAttackCaseIocVerification,
  getAttackCaseIocVerifyTask,
  getIocHitDetail,
  listAttackCaseIocCandidates,
} from "@/features/ioc-analysis/api"
import type {
  AttackCaseIOCVerificationDetail,
  AttackCaseIOCCandidateListData,
  IocCandidate,
  IocVerificationItem,
  IocVerificationStatus,
  IocVerificationType,
} from "@/features/ioc-analysis/types"
import { toast } from "@/shared/hooks/use-toast"

const DEFAULT_TENANT_ID = "public"
const POLL_INTERVAL_MS = 2000
const MAX_POLL_ATTEMPTS = 90
const DISABLED_IOC_TYPES = new Set<IocVerificationType>(["certificate"])

const TYPE_OPTIONS: IocVerificationType[] = [
  "auto",
  "md5",
  "sha1",
  "sha256",
  "url",
  "ip",
  "domain",
  "hostname",
]
const MANUAL_TYPE_PREFIXES = new Set<IocVerificationType>([
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
])

function getRouteParam(value: string | null) {
  return value?.trim() || ""
}

function getRoutePageParam(value: string | null) {
  const normalized = getRouteParam(value)
  if (!normalized) return undefined
  const parsed = Number.parseInt(normalized, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function getRouteListParam(value: string | null) {
  return Array.from(
    new Set(
      (value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  )
}

function normalizeTaskStatus(status?: string) {
  return status?.trim().toLowerCase() || "unknown"
}

function isActiveTaskStatus(status: string) {
  return status === "pending" || status === "running"
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function normalizeIocType(type: string, value: string): IocVerificationType | null {
  const normalizedType = type.trim().toLowerCase()
  if (
    normalizedType === "md5" ||
    normalizedType === "sha1" ||
    normalizedType === "sha256" ||
    normalizedType === "url" ||
    normalizedType === "domain" ||
    normalizedType === "hostname" ||
    normalizedType === "ip" ||
    normalizedType === "email" ||
    normalizedType === "certificate"
  ) {
    return normalizedType
  }

  if (normalizedType === "hash") {
    return detectIocType(value) ?? "hash"
  }

  return detectIocType(value)
}

function isValidIPv4(value: string) {
  const parts = value.split(".")
  return (
    parts.length === 4 &&
    parts.every((part) => {
      if (!/^\d{1,3}$/.test(part)) return false
      const numeric = Number(part)
      return numeric >= 0 && numeric <= 255
    })
  )
}

function detectIocType(value: string): IocVerificationType | null {
  const normalized = value.trim()
  if (!normalized) return null

  if (/^https?:\/\//i.test(normalized)) return "url"
  if (/^[a-f0-9]{32}$/i.test(normalized)) return "md5"
  if (/^[a-f0-9]{40}$/i.test(normalized)) return "sha1"
  if (/^[a-f0-9]{64}$/i.test(normalized)) return "sha256"
  if (isValidIPv4(normalized)) return "ip"
  if (
    /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalized) &&
    !normalized.includes("/") &&
    !normalized.includes("..")
  ) {
    return "domain"
  }

  return null
}

function normalizeIocValue(type: IocVerificationType, value: string) {
  const normalized = value.trim()
  if (type === "md5" || type === "sha1" || type === "sha256" || type === "hash") {
    return normalized.toLowerCase()
  }
  if (type === "domain" || type === "hostname") return normalized.toLowerCase()
  return normalized
}

function candidateKey(type: IocVerificationType, value: string) {
  return `${type}:${value.toLowerCase()}`
}

function isHashType(type: IocVerificationType) {
  return type === "md5" || type === "sha1" || type === "sha256" || type === "hash"
}

function fileNameFromPath(value: string) {
  const trimmed = value.trim().replace(/[\\/]+$/, "")
  return trimmed.split(/[\\/]/).pop() || value.trim()
}

function candidateFileKey(candidate: Pick<IocCandidate, "file_name" | "file_path">) {
  const fileName = candidate.file_name?.trim() || ""
  const filePath = candidate.file_path?.trim() || ""
  return (fileName || (filePath ? fileNameFromPath(filePath) : "")).toLowerCase()
}

function candidateDisplayKey(
  candidate: Pick<IocCandidate, "origin" | "type" | "value" | "file_name" | "file_path">,
) {
  const valueKey = candidateKey(candidate.type, candidate.value)
  if (!isHashType(candidate.type)) return `${candidate.origin}:${valueKey}`
  return `${candidate.origin}:${valueKey}:file:${candidateFileKey(candidate)}`
}

function candidateId(candidate: Pick<IocCandidate, "origin" | "type" | "value">) {
  return `${candidate.origin}:${candidateKey(candidate.type, candidate.value)}`
}

function parseManualLine(line: string, defaultType: IocVerificationType) {
  const trimmed = line.trim()
  if (!trimmed) return null

  const typedMatch = trimmed.match(/^([a-z0-9_-]+)\s*[:：]\s*(.+)$/i)
  const matchedType = typedMatch?.[1]?.trim().toLowerCase()
  const hasKnownTypePrefix =
    Boolean(matchedType) &&
    MANUAL_TYPE_PREFIXES.has(matchedType as IocVerificationType)
  const rawType: IocVerificationType = hasKnownTypePrefix
    ? (matchedType as IocVerificationType)
    : defaultType
  const rawValue = hasKnownTypePrefix && typedMatch ? typedMatch[2] ?? "" : trimmed
  const type = rawType === "auto" ? detectIocType(rawValue) ?? "auto" : normalizeIocType(rawType, rawValue)
  if (!type || DISABLED_IOC_TYPES.has(type)) return null

  const value = normalizeIocValue(type, rawValue)
  if (!value) return null

  return {
    id: candidateId({ origin: "manual", type, value }),
    type,
    value,
    source: "manual",
    evidence_refs: [],
    origin: "manual" as const,
  }
}

function parseManualCandidates(input: string, defaultType: IocVerificationType) {
  const seen = new Set<string>()
  const candidates: IocCandidate[] = []
  const lines = input
    .split(/\r?\n|,/)
    .map((line) => line.trim())
    .filter(Boolean)

  for (const line of lines) {
    const candidate = parseManualLine(line, defaultType)
    if (!candidate) continue
    const key = candidateKey(candidate.type, candidate.value)
    if (seen.has(key)) continue
    seen.add(key)
    candidates.push(candidate)
  }

  return candidates
}

function isVerificationItem(candidate: IocCandidate | IocVerificationItem): candidate is IocVerificationItem {
  return "status" in candidate && "result" in candidate && "error" in candidate
}

function toVerificationItem(candidate: IocCandidate | IocVerificationItem): IocVerificationItem {
  if (isVerificationItem(candidate)) return candidate

  return {
    ...candidate,
    status: "idle",
    result: null,
    error: "",
  }
}

function toIocCandidate(item: IocVerificationItem): IocCandidate {
  const candidate = { ...item }
  Reflect.deleteProperty(candidate, "status")
  Reflect.deleteProperty(candidate, "result")
  Reflect.deleteProperty(candidate, "error")
  return candidate
}

function mergeCandidateItem(
  existing: IocVerificationItem,
  next: IocVerificationItem,
): IocVerificationItem {
  const merged: IocVerificationItem = {
    ...existing,
    ...next,
    id: existing.id,
    candidate_id: existing.candidate_id || next.candidate_id,
    file_name: next.file_name || existing.file_name,
    file_path: next.file_path || existing.file_path,
    evidence_refs: Array.from(
      new Set([...existing.evidence_refs, ...next.evidence_refs].filter(Boolean)),
    ),
  }

  if (!next.verification && existing.verification) merged.verification = existing.verification
  if (!next.verification_detail && existing.verification_detail) {
    merged.verification_detail = existing.verification_detail
  }
  if (!next.result && existing.result) merged.result = existing.result
  if (next.status === "idle" && existing.status !== "idle") merged.status = existing.status
  if (!next.error && existing.error) merged.error = existing.error

  return merged
}

function mergeCandidates(
  current: IocVerificationItem[],
  candidates: Array<IocCandidate | IocVerificationItem>,
  options: { replaceCase?: boolean } = {},
) {
  const base = options.replaceCase
    ? current.filter((item) => item.origin !== "case")
    : [...current]
  const byDisplayKey = new Map(base.map((item) => [candidateDisplayKey(item), item]))

  for (const candidate of candidates) {
    const next = toVerificationItem(candidate)
    const key = candidateDisplayKey(next)
    const existing = byDisplayKey.get(key)

    if (existing) {
      byDisplayKey.set(key, mergeCandidateItem(existing, next))
      continue
    }

    byDisplayKey.set(key, next)
  }

  return Array.from(byDisplayKey.values())
}

function statusFromVerificationDetail(
  detail: AttackCaseIOCVerificationDetail,
): IocVerificationStatus {
  const verification = detail.item

  if (verification) {
    if (
      verification.hit_status_key === "remote_error_suppressed" ||
      verification.remote_status === "remote_error_suppressed"
    ) {
      return "suppressed"
    }

    if (
      verification.hit_status_key === "local_whitelist_hit" ||
      verification.hit_kind === "whitelist" ||
      verification.final_status === "allowlisted" ||
      verification.final_verdict === "allow" ||
      verification.hit_verdict === "allow"
    ) {
      return "allowlisted"
    }

    if (
      verification.hit_status_key === "error" ||
      verification.hit_verdict === "error" ||
      verification.final_status === "local_error" ||
      verification.final_status === "remote_error" ||
      verification.final_verdict === "error"
    ) {
      return "error"
    }

    if (
      verification.hit_status_key === "local_ioc_hit" ||
      verification.hit_status_key === "remote_ioc_hit" ||
      (verification.hit === true && verification.hit_kind === "ioc") ||
      verification.hit_verdict === "malicious" ||
      verification.final_status === "local_hit" ||
      verification.final_status === "remote_hit" ||
      verification.final_verdict === "malicious"
    ) {
      return "hit"
    }

    if (
      verification.hit_status_key === "no_hit" ||
      verification.final_status === "local_miss" ||
      verification.final_status === "remote_miss" ||
      verification.final_verdict === "unknown"
    ) {
      return "miss"
    }
  }

  const sourceDetail = detail.final_hit_detail ?? detail.hit_source_detail

  if (sourceDetail?.whitelist) return "allowlisted"
  if (
    sourceDetail?.ioc_entry ||
    sourceDetail?.blacklist_indicator ||
    detail.detail_view?.primary
  ) {
    return "hit"
  }

  return "miss"
}

export function IocVerificationPage() {
  const t = useTranslations("pages.iocAnalysis.verification")
  const router = useRouter()
  const searchParams = useSearchParams()
  const routeParams = useMemo(
    () => ({
      caseId:
        getRouteParam(searchParams.get("caseId")) ||
        getRouteParam(searchParams.get("case_id")),
      workflowId:
        getRouteParam(searchParams.get("workflowId")) ||
        getRouteParam(searchParams.get("workflow_id")),
      snapshotId:
        getRouteParam(searchParams.get("snapshotId")) ||
        getRouteParam(searchParams.get("snapshot_id")),
      returnTo:
        getRouteParam(searchParams.get("returnTo")) ||
        getRouteParam(searchParams.get("return_to")),
      tenantId:
        getRouteParam(searchParams.get("tenantId")) ||
        getRouteParam(searchParams.get("tenant_id")),
      queuePage:
        getRoutePageParam(searchParams.get("queuePage")) ||
        getRoutePageParam(searchParams.get("queue_page")),
      candidateIds: getRouteListParam(
        searchParams.get("candidateIds") || searchParams.get("candidate_ids"),
      ),
    }),
    [searchParams],
  )
  const [caseId, setCaseId] = useState(routeParams.caseId)
  const tenantId = routeParams.tenantId || DEFAULT_TENANT_ID
  const [manualType, setManualType] = useState<IocVerificationType>("auto")
  const [manualInput, setManualInput] = useState("")
  const [items, setItems] = useState<IocVerificationItem[]>([])
  const [casePreview, setCasePreview] =
    useState<AttackCaseIOCCandidateListData | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [taskStatus, setTaskStatus] = useState("")
  const [caseTaskId, setCaseTaskId] = useState("")
  const [selectedItemId, setSelectedItemId] = useState("")
  const [searchText, setSearchText] = useState("")
  const [typeFilter, setTypeFilter] = useState<IocVerificationType | "all">("all")
  const [statusFilter, setStatusFilter] = useState<IocVerificationStatus | "all">("all")
  const [actionOnly, setActionOnly] = useState(false)
  const [detailLoadingItemId, setDetailLoadingItemId] = useState("")
  const extractRunIdRef = useRef(0)
  const verifyRunIdRef = useRef(0)
  const detailRunIdRef = useRef(0)
  const autoLoadedCaseRef = useRef("")
  const autoVerifiedCandidateSelectionRef = useRef("")
  const mountedRef = useRef(false)
  const counts = useMemo(() => summaryCounts(items), [items])
  const requestedCandidateIdsKey = routeParams.candidateIds.join(",")
  const casePreviewMessage = useMemo(() => {
    if (!caseId.trim()) return ""
    if (!casePreview) return t("casePanel.previewNotLoaded")
    if (!casePreview.extract_task_exists) return t("casePanel.noExtractTask")

    const status = normalizeTaskStatus(casePreview.extract_task?.status)
    if (isActiveTaskStatus(status)) return t("casePanel.extractRunning", { status })
    if (status === "failed") {
      return casePreview.extract_task?.error_message || t("casePanel.extractFailed")
    }
    if (!casePreview.items.length) return t("casePanel.noPreviewItems")
    return t("casePanel.previewReady", { count: casePreview.items.length })
  }, [caseId, casePreview, t])

  const filteredItems = useMemo(() => {
    const keyword = searchText.trim().toLowerCase()
    return items.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false
      if (statusFilter !== "all") {
        if (statusFilter === "allowlisted") {
          if (!isAllowlisted(item)) return false
        } else if (item.status !== statusFilter) {
          return false
        }
      }
      if (actionOnly && item.status !== "hit" && item.status !== "error" && item.status !== "suppressed") {
        return false
      }
      if (!keyword) return true
      return (
        item.value.toLowerCase().includes(keyword) ||
        item.source.toLowerCase().includes(keyword) ||
        (item.file_name || "").toLowerCase().includes(keyword) ||
        (item.file_path || "").toLowerCase().includes(keyword) ||
        item.evidence_refs.some((ref) => ref.toLowerCase().includes(keyword)) ||
        observationSources(item).some((source) => source.toLowerCase().includes(keyword))
      )
    })
  }, [actionOnly, items, searchText, statusFilter, typeFilter])
  const selectedItem =
    filteredItems.find((item) => item.id === selectedItemId) ??
    filteredItems[0] ??
    items[0] ??
    null

  useEffect(() => {
    setCaseId(routeParams.caseId)
  }, [routeParams.caseId])

  useEffect(() => {
    if (!items.length) {
      setSelectedItemId("")
      return
    }
    if (!items.some((item) => item.id === selectedItemId)) {
      setSelectedItemId(items[0].id)
    }
  }, [items, selectedItemId])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    const candidateId = selectedItem?.candidate_id?.trim() || ""
    const normalizedCaseId =
      selectedItem?.case_id?.trim() || caseId.trim() || routeParams.caseId.trim()
    const hasVerificationDetail = Boolean(selectedItem?.verification_detail)

    if (
      !selectedItem ||
      selectedItem.origin !== "case" ||
      !candidateId ||
      !normalizedCaseId ||
      !selectedItem.verification ||
      hasVerificationDetail
    ) {
      return
    }

    const runId = detailRunIdRef.current + 1
    detailRunIdRef.current = runId
    setDetailLoadingItemId(selectedItem.id)

    void (async () => {
      try {
        const detail = await getAttackCaseIocVerification({
          caseId: normalizedCaseId,
          tenantId,
          candidateId,
        })

        if (!mountedRef.current || detailRunIdRef.current !== runId) return

        setItems((current) =>
          current.map((item) => {
            if ((item.candidate_id || item.id) !== candidateId) return item

            const baseVerification = item.verification || detail.item
            if (!baseVerification) return item

            return {
              ...item,
              verification_detail: detail,
              verification: {
                ...baseVerification,
                ...(detail.item || {}),
                local_eval_raw_json:
                  detail.local_eval_raw_json ||
                  detail.item?.local_eval_raw_json ||
                  baseVerification.local_eval_raw_json,
              },
            }
          }),
        )
      } catch {
        // Detail enrichment is best-effort; the list row remains usable.
      } finally {
        if (mountedRef.current && detailRunIdRef.current === runId) {
          setDetailLoadingItemId("")
        }
      }
    })()
  }, [
    caseId,
    routeParams.caseId,
    selectedItem,
    selectedItem?.candidate_id,
    selectedItem?.case_id,
    selectedItem?.origin,
    selectedItem?.verification,
    selectedItem?.verification_detail,
    selectedItem?.verification?.local_eval_raw_json,
    selectedItem?.verification?.verification_id,
    selectedItem?.verification?.whitelist_status,
    tenantId,
  ])

  useEffect(() => {
    const manualItemId = selectedItem?.id?.trim() || ""
    const value = selectedItem?.value?.trim() || ""
    const hasVerificationDetail = Boolean(selectedItem?.verification_detail)
    const shouldLoad =
      selectedItem?.origin === "manual" &&
      Boolean(manualItemId) &&
      Boolean(value) &&
      !hasVerificationDetail &&
      selectedItem.status !== "idle" &&
      selectedItem.status !== "checking" &&
      selectedItem.status !== "error"

    if (!selectedItem || !shouldLoad) return

    const runId = detailRunIdRef.current + 1
    detailRunIdRef.current = runId
    setDetailLoadingItemId(manualItemId)

    void (async () => {
      try {
        const detail = await getIocHitDetail({
          tenantId,
          type: selectedItem.type,
          value,
        })

        if (!mountedRef.current || detailRunIdRef.current !== runId) return

        setItems((current) =>
          current.map((item) => {
            if (item.id !== manualItemId) return item

            const baseVerification = item.verification || detail.item
            return {
              ...item,
              verification_detail: detail,
              verification: baseVerification
                ? {
                    ...baseVerification,
                    ...(detail.item || {}),
                    local_eval_raw_json:
                      detail.local_eval_raw_json ||
                      detail.item?.local_eval_raw_json ||
                      baseVerification.local_eval_raw_json,
                  }
                : item.verification,
            }
          }),
        )
      } catch {
        // Detail enrichment is best-effort; the list row remains usable.
      } finally {
        if (mountedRef.current && detailRunIdRef.current === runId) {
          setDetailLoadingItemId("")
        }
      }
    })()
  }, [
    selectedItem,
    selectedItem?.id,
    selectedItem?.origin,
    selectedItem?.status,
    selectedItem?.type,
    selectedItem?.value,
    selectedItem?.verification_detail,
    tenantId,
  ])

  const loadCaseIocs = useCallback(
    async () => {
      const normalizedCaseId = caseId.trim()
      if (!normalizedCaseId) {
        toast({
          title: t("toasts.caseRequired"),
          description: t("toasts.caseRequiredDescription"),
          variant: "warning",
        })
        return
      }

      const runId = extractRunIdRef.current + 1
      extractRunIdRef.current = runId
      setExtracting(true)
      setTaskStatus(t("casePanel.loadingPreview"))
      setCaseTaskId("")

      try {
        const preview = await listAttackCaseIocCandidates({
          caseId: normalizedCaseId,
          tenantId,
        })

        if (!mountedRef.current || extractRunIdRef.current !== runId) return

        setCasePreview(preview)
        setTaskStatus(
          preview.extract_task_exists
            ? normalizeTaskStatus(preview.extract_task?.status)
            : t("casePanel.noExtractTaskShort"),
        )
        setItems((current) =>
          mergeCandidates(current, preview.items, { replaceCase: true }),
        )

        if (preview.items.length) {
          toast({
            title: t("toasts.previewLoaded", { count: preview.items.length }),
            description: t("toasts.previewLoadedDescription", {
              count: preview.items.length,
            }),
            variant: "success",
          })
        } else if (preview.extract_task_exists) {
          toast({
            title: t("toasts.noIocs"),
            description: t("toasts.noIocsDescription"),
            variant: "info",
          })
        }
      } catch (error) {
        if (!mountedRef.current || extractRunIdRef.current !== runId) return

        toast({
          title: t("errors.extractFailed"),
          description:
            error instanceof Error && error.message
              ? error.message
              : t("errors.extractFailedDescription"),
          variant: "destructive",
        })
      } finally {
        if (mountedRef.current && extractRunIdRef.current === runId) {
          setExtracting(false)
        }
      }
    },
    [caseId, t, tenantId],
  )

  const verifyCandidates = useCallback(
    async (candidates: IocCandidate[]) => {
      const supportedCandidates = candidates.filter(
        (candidate) => !DISABLED_IOC_TYPES.has(candidate.type),
      )

      if (!supportedCandidates.length) {
        toast({
          title: t("toasts.noIocs"),
          description: t("toasts.noIocsDescription"),
          variant: "info",
        })
        return
      }

      const caseCandidates = supportedCandidates.filter(
        (candidate) =>
          candidate.origin === "case" &&
          candidate.candidate_id &&
          !DISABLED_IOC_TYPES.has(candidate.type),
      )
      const manualCandidates = supportedCandidates.filter(
        (candidate) =>
          (candidate.origin !== "case" || !candidate.candidate_id) &&
          !DISABLED_IOC_TYPES.has(candidate.type),
      )
      const normalizedCaseId =
        caseId.trim() || caseCandidates[0]?.case_id?.trim() || routeParams.caseId.trim()

      const runId = verifyRunIdRef.current + 1
      verifyRunIdRef.current = runId
      setVerifying(true)
      setItems((current) => mergeCandidates(current, manualCandidates))

      try {
        if (caseCandidates.length) {
          if (!normalizedCaseId) {
            throw new Error(t("toasts.caseRequired"))
          }

          const candidateIds = Array.from(
            new Set(
              caseCandidates
                .map((candidate) => candidate.candidate_id?.trim())
                .filter((candidateId): candidateId is string => Boolean(candidateId)),
            ),
          )

          setItems((current) =>
            current.map((item) =>
              candidateIds.includes(item.candidate_id || item.id)
                ? {
                    ...item,
                    status: "checking",
                    error: "",
                    result: null,
                    verification_detail: null,
                  }
                : item,
            ),
          )

          let task = (
            await createAttackCaseIocVerifyTask({
              caseId: normalizedCaseId,
              tenantId,
              candidateIds,
            })
          ).task

          if (!mountedRef.current || verifyRunIdRef.current !== runId) return

          setCaseTaskId(task.task_id ? String(task.task_id) : "")
          let status = normalizeTaskStatus(task.status)
          setTaskStatus(t("casePanel.verifyProgress", {
            done: task.done_count,
            total: task.total_count,
            status,
          }))

          for (let attempt = 0; isActiveTaskStatus(status); attempt += 1) {
            if (attempt >= MAX_POLL_ATTEMPTS) {
              throw new Error(t("errors.analysisTimeout"))
            }

            await delay(POLL_INTERVAL_MS)
            if (!mountedRef.current || verifyRunIdRef.current !== runId) return

            task = await getAttackCaseIocVerifyTask({
              caseId: normalizedCaseId,
              tenantId,
              taskId: task.task_id,
            })

            if (!mountedRef.current || verifyRunIdRef.current !== runId) return

            status = normalizeTaskStatus(task.status)
            setTaskStatus(t("casePanel.verifyProgress", {
              done: task.done_count,
              total: task.total_count,
              status,
            }))
          }

          if (status === "failed") {
            throw new Error(task.error_message || t("errors.verifyFailed"))
          }

          if (status !== "success" && status !== "partial_success") {
            throw new Error(t("errors.analysisUnknown", { status: task.status || "unknown" }))
          }

          const preview = await listAttackCaseIocCandidates({
            caseId: normalizedCaseId,
            tenantId,
          })

          if (!mountedRef.current || verifyRunIdRef.current !== runId) return

          setCasePreview(preview)
          setItems((current) =>
            mergeCandidates(current, preview.items, { replaceCase: true }),
          )
          setTaskStatus(status)
        }

        for (const candidate of manualCandidates) {
          if (!mountedRef.current || verifyRunIdRef.current !== runId) return

          setItems((current) =>
            current.map((item) =>
              item.id === candidate.id
                ? {
                    ...item,
                    status: "checking",
                    error: "",
                    result: null,
                    verification: null,
                    verification_detail: null,
                  }
                : item,
            ),
          )

          try {
            const detail = await getIocHitDetail({
              tenantId,
              type: candidate.type,
              value: candidate.value,
            })

            if (!mountedRef.current || verifyRunIdRef.current !== runId) return

            setItems((current) =>
              current.map((item) =>
                item.id === candidate.id
                  ? {
                      ...item,
                      status: statusFromVerificationDetail(detail),
                      result: null,
                      verification: detail.item,
                      verification_detail: detail,
                      error: "",
                    }
                  : item,
              ),
            )
          } catch (error) {
            if (!mountedRef.current || verifyRunIdRef.current !== runId) return

            setItems((current) =>
              current.map((item) =>
                item.id === candidate.id
                  ? {
                      ...item,
                      status: "error",
                      result: null,
                      verification: null,
                      verification_detail: null,
                      error:
                        error instanceof Error
                          ? error.message
                          : t("errors.verifyFailed"),
                    }
                  : item,
              ),
            )
          }
        }

        toast({
          title: t("toasts.verifyComplete"),
          description: t("toasts.verifyCompleteDescription", {
            count: supportedCandidates.length,
          }),
          variant: "success",
        })
      } catch (error) {
        if (!mountedRef.current || verifyRunIdRef.current !== runId) return

        const caseCandidateIds = new Set(
          caseCandidates.map((candidate) => candidate.candidate_id || candidate.id),
        )
        setItems((current) =>
          current.map((item) =>
            caseCandidateIds.has(item.candidate_id || item.id)
              ? {
                  ...item,
                  status: "error",
                  verification_detail: null,
                  error:
                    error instanceof Error && error.message
                      ? error.message
                      : t("errors.verifyFailed"),
                }
              : item,
          ),
        )
        toast({
          title: t("errors.verifyFailed"),
          description:
            error instanceof Error && error.message
              ? error.message
              : t("errors.verifyFailedDescription"),
          variant: "destructive",
        })
      } finally {
        if (mountedRef.current && verifyRunIdRef.current === runId) {
          setVerifying(false)
        }
      }
    },
    [caseId, routeParams.caseId, t, tenantId],
  )

  useEffect(() => {
    const normalizedCaseId = routeParams.caseId.trim()
    if (!normalizedCaseId || autoLoadedCaseRef.current === normalizedCaseId) return
    autoLoadedCaseRef.current = normalizedCaseId
    void loadCaseIocs()
  }, [loadCaseIocs, routeParams.caseId])

  useEffect(() => {
    const normalizedCaseId = routeParams.caseId.trim()
    if (!normalizedCaseId || !requestedCandidateIdsKey || !casePreview) return

    const requestKey = `${normalizedCaseId}:${requestedCandidateIdsKey}`
    if (autoVerifiedCandidateSelectionRef.current === requestKey) return
    autoVerifiedCandidateSelectionRef.current = requestKey

    const requestedIds = new Set(routeParams.candidateIds)
    const requestedCandidates = casePreview.items.filter((candidate) =>
      requestedIds.has(candidate.candidate_id || candidate.id),
    )
    if (requestedCandidates.length === 0) {
      toast({
        title: "未找到指定 IOC",
        description: "所选 IOC 可能已被删除或不属于当前案件。",
        variant: "warning",
      })
      return
    }

    void verifyCandidates(requestedCandidates)
  }, [
    casePreview,
    requestedCandidateIdsKey,
    routeParams.candidateIds,
    routeParams.caseId,
    verifyCandidates,
  ])

  function handleBack() {
    const normalizedCaseId = caseId.trim()

    if (routeParams.returnTo === "graph") {
      router.push(
        buildTraceHref(normalizedCaseId, routeParams.snapshotId, {
          queuePage: routeParams.queuePage,
          returnToWorkflow: Boolean(routeParams.workflowId),
          tenantId,
          workflowId: routeParams.workflowId,
        }),
      )
      return
    }

    if (routeParams.returnTo === "workflow" || routeParams.workflowId) {
      router.push(
        buildAttackWorkflowHref(
          normalizedCaseId,
          routeParams.snapshotId,
          routeParams.workflowId,
          { queuePage: routeParams.queuePage, tenantId },
        ),
      )
      return
    }

    if (normalizedCaseId) {
      router.push(buildAttackDetailHref(normalizedCaseId, routeParams.snapshotId))
      return
    }

    router.push("/frame/attack/workflow")
  }

  function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const candidates = parseManualCandidates(manualInput, manualType)

    if (!candidates.length) {
      toast({
        title: t("toasts.manualInvalid"),
        description: t("toasts.manualInvalidDescription"),
        variant: "warning",
      })
      return
    }

    setItems((current) => mergeCandidates(current, candidates))
    setManualInput("")
    void verifyCandidates(candidates)
  }

  function verifyAll() {
    const candidates = items.map(toIocCandidate)
    void verifyCandidates(candidates)
  }

  function copyIoc(value: string) {
    void navigator.clipboard.writeText(value)
    toast({
      title: t("toasts.copied"),
      description: t("toasts.copiedDescription"),
      variant: "success",
    })
  }

  return (
    <main className="flex min-h-[calc(100dvh-3rem)] w-full min-w-0 bg-gray-50 p-3 sm:p-4 xl:p-5 2xl:p-6">
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-4">
        <IocVerificationHeader counts={counts} onBack={handleBack} />

        <section className="grid w-full min-w-0 items-start gap-4 xl:grid-cols-[minmax(340px,400px)_minmax(0,1fr)] xl:grid-rows-[auto_auto] xl:items-stretch 2xl:grid-cols-[minmax(360px,420px)_minmax(0,1fr)]">
          <IocVerificationSourcePanel
            className="xl:col-start-1 xl:row-start-1"
            caseId={caseId}
            workflowId={routeParams.workflowId}
            tenantId={tenantId}
            taskStatus={taskStatus}
            caseTaskId={caseTaskId}
            extractedCount={items.filter((item) => item.origin === "case").length}
            previewMessage={casePreviewMessage}
            extracting={extracting}
            verifying={verifying}
            onCaseIdChange={setCaseId}
            onLoadPreview={() => void loadCaseIocs()}
          />

          <div className="min-w-0 xl:col-start-1 xl:row-start-2 xl:min-h-0">
            <IocVerificationManualPanel
              manualType={manualType}
              manualInput={manualInput}
              typeOptions={TYPE_OPTIONS}
              verifying={verifying}
              onManualTypeChange={setManualType}
              onManualInputChange={setManualInput}
              onSubmit={handleManualSubmit}
            />
          </div>

          <IocVerificationResultsPanel
            className="xl:col-start-2 xl:row-start-1"
            filteredItems={filteredItems}
            selectedId={selectedItem?.id ?? ""}
            verifying={verifying}
            searchText={searchText}
            typeFilter={typeFilter}
            statusFilter={statusFilter}
            actionOnly={actionOnly}
            typeOptions={TYPE_OPTIONS}
            hasItems={Boolean(items.length)}
            onSearchTextChange={setSearchText}
            onTypeFilterChange={setTypeFilter}
            onStatusFilterChange={setStatusFilter}
            onActionOnlyChange={setActionOnly}
            onVerifyAll={verifyAll}
            onCopy={copyIoc}
            onSelect={setSelectedItemId}
            onVerifyOne={(candidate) => void verifyCandidates([candidate])}
          />

          <IocVerificationDetailPanel
            className="xl:col-start-2 xl:row-start-2 xl:h-0 xl:min-h-full"
            item={selectedItem}
            loading={Boolean(selectedItem && detailLoadingItemId === selectedItem.id)}
            onCopy={copyIoc}
          />
        </section>
      </div>
    </main>
  )
}
