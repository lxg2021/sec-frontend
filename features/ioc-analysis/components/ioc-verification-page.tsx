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
  listAttackCaseIocCandidates,
  queryIoc,
} from "@/features/ioc-analysis/api"
import type {
  AttackCaseIOCCandidateListData,
  IocCandidate,
  IocQueryResult,
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

function mergeCandidates(
  current: IocVerificationItem[],
  candidates: Array<IocCandidate | IocVerificationItem>,
  options: { replaceCase?: boolean } = {},
) {
  const base = options.replaceCase
    ? current.filter((item) => item.origin !== "case")
    : [...current]
  const byId = new Map(base.map((item) => [item.id, item]))

  for (const candidate of candidates) {
    const next = toVerificationItem(candidate)
    const existing = byId.get(candidate.id)
    byId.set(candidate.id, existing ? { ...existing, ...next } : next)
  }

  return Array.from(byId.values())
}

function statusFromResult(result: IocQueryResult): IocVerificationStatus {
  if (result.hit) return "hit"
  if (result.hit_source === "remote_error_suppressed" || result.hit_source_code === 6) {
    return "suppressed"
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
  const extractRunIdRef = useRef(0)
  const verifyRunIdRef = useRef(0)
  const detailRunIdRef = useRef(0)
  const autoLoadedCaseRef = useRef("")
  const mountedRef = useRef(false)
  const counts = useMemo(() => summaryCounts(items), [items])
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
        item.evidence_refs.some((ref) => ref.toLowerCase().includes(keyword)) ||
        observationSources(item).some((source) => source.toLowerCase().includes(keyword))
      )
    })
  }, [actionOnly, items, searchText, statusFilter, typeFilter])
  const selectedItem =
    items.find((item) => item.id === selectedItemId) ??
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

    if (
      !selectedItem ||
      selectedItem.origin !== "case" ||
      !candidateId ||
      !normalizedCaseId ||
      !selectedItem.verification ||
      selectedItem.verification.local_eval_raw_json
    ) {
      return
    }

    const runId = detailRunIdRef.current + 1
    detailRunIdRef.current = runId

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
    selectedItem?.verification?.local_eval_raw_json,
    selectedItem?.verification?.verification_id,
    selectedItem?.verification?.whitelist_status,
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
                ? { ...item, status: "checking", error: "", result: null }
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
                ? { ...item, status: "checking", error: "", result: null }
                : item,
            ),
          )

          try {
            const result = await queryIoc({
              type: candidate.type,
              value: candidate.value,
            })

            if (!mountedRef.current || verifyRunIdRef.current !== runId) return

            setItems((current) =>
              current.map((item) =>
                item.id === candidate.id
                  ? {
                      ...item,
                      status: statusFromResult(result),
                      result,
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

  function handleBack() {
    const normalizedCaseId = caseId.trim()

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
    const candidates = items.map(
      ({ status: _status, result: _result, error: _error, ...candidate }) =>
        candidate,
    )
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

        <section className="grid w-full min-w-0 gap-4 xl:grid-cols-[minmax(340px,400px)_minmax(0,1fr)] 2xl:min-h-0 2xl:flex-1 2xl:grid-cols-[minmax(360px,420px)_minmax(520px,1fr)_minmax(320px,400px)] 2xl:items-stretch">
          <div className="flex flex-col gap-4 2xl:min-h-0">
            <IocVerificationSourcePanel
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

          <div className="min-w-0 xl:col-span-2 2xl:col-span-1 2xl:flex 2xl:min-h-0">
            <IocVerificationDetailPanel
              item={selectedItem}
              verifying={verifying}
              onCopy={copyIoc}
              onVerify={(candidate) => void verifyCandidates([candidate])}
            />
          </div>
        </section>
      </div>
    </main>
  )
}
