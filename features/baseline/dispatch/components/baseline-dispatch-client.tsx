"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertCircle, CalendarRange, Clock3, History, Repeat2, ShieldCheck } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  applyBaselineScanPolicy,
  createBaselineScanPolicy,
  listBaselineScanPolicies,
  type ReusableBaselineScanPolicy,
} from "@/features/baseline/dispatch/api"
import { getAllBaselines, type BaselineTemplate } from "@/features/baseline/custom/api"
import {
  BaselinePolicyDetail,
  type BaselinePolicyDetailData,
} from "@/shared/components/baseline-policy-detail"
import {
  type DispatchGroup,
  type DispatchHost,
  type DispatchPreviewData,
  type DispatchValidation,
} from "@/shared/components/dispatch-preview"
import { DEFAULT_SCAN_SCHEDULE, type ScanSchedule } from "@/shared/components/scan-schedule"
import { type SwitchModeValue } from "@/shared/components/switch-mode"
import { getHostSelectorTree } from "@/shared/components/host-selector/api"
import { getAccessToken } from "@/shared/lib/http/auth"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"

import { BaselinePolicyList } from "./baseline-policy-list"
import { BaselineDispatchSelector, type BaselineDispatchSelectorItem } from "./baseline-dispatch-selector"
import { BaselineSelectionStep } from "./baseline-selection-step"
import { DispatchStepper, type DispatchStepItem } from "./dispatch-stepper"
import { DispatchSubmitStep } from "./dispatch-submit-step"
import { HostSelectionStep } from "./host-selection-step"
import { ScanScheduleStep } from "./scan-schedule-step"
import {
  getDispatchProfileLabel,
  getDispatchStandardKey,
  getDispatchStandardLabel,
} from "./value-mapping"

interface HostTreeNode {
  id: string
  name?: string
  type?: string
  parentId?: string
  hostId?: string
  hostname?: string
  ip?: string
  status?: string
  valid?: boolean
  invalidReason?: string
}

interface CreatedPolicy {
  id: string
  name: string
  version: string
  baselineUuid: string
  baselineName: string
  schedule: ScanSchedule
  source: "created" | "reused"
}

function buildScheduleSummary(schedule: ScanSchedule, t: ReturnType<typeof useTranslations>) {
  const parts = [t("summary.intervalHours", { hours: schedule.interval_hours ?? 24 })]

  if (schedule.specific_time) {
    parts.push(t("summary.specificTime", { time: schedule.specific_time }))
  }

  const randomDelayMinutes = schedule.random_delay_minutes ?? 0
  if (randomDelayMinutes > 0) {
    parts.push(t("summary.randomDelay", { minutes: randomDelayMinutes }))
  }

  const retryLimit = schedule.retry_limit ?? 0
  const retryIntervalMinutes = schedule.retry_interval_minutes ?? 5
  if (retryLimit > 0) {
    parts.push(
      t("summary.retry", {
        count: retryLimit,
        minutes: retryIntervalMinutes,
      }),
    )
  } else {
    parts.push(t("summary.noRetry"))
  }

  if (schedule.scan_on_startup) {
    parts.push(t("summary.scanOnStartup"))
  }

  return parts.join("，")
}

function getSelectionMode(groupCount: number, hostCount: number) {
  if (groupCount > 0 && hostCount > 0) return "mixed" as const
  if (groupCount > 0) return "group" as const
  return "host" as const
}

function formatDateTime(value: string, locale: string) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function sortReusablePolicies(items: ReusableBaselineScanPolicy[], sortValue: string) {
  const sorted = [...items]

  sorted.sort((left, right) => {
    if (sortValue === "name") {
      return left.name.localeCompare(right.name, undefined, { sensitivity: "base" })
    }

    const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime()
    const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime()
    const leftValue = Number.isFinite(leftTime) ? leftTime : 0
    const rightValue = Number.isFinite(rightTime) ? rightTime : 0

    if (sortValue === "oldest") {
      return leftValue - rightValue
    }

    return rightValue - leftValue
  })

  return sorted
}

function buildReusablePolicyDetailData(
  policy: ReusableBaselineScanPolicy | null,
  baselineName: string,
  locale: string,
  t: ReturnType<typeof useTranslations>,
): BaselinePolicyDetailData | null {
  if (!policy) {
    return null
  }

  const retryLimit = policy.scanSchedule.retry_limit ?? 0
  const retryInterval = policy.scanSchedule.retry_interval_minutes ?? 5

  return {
    name: policy.name,
    id: policy.id,
    version: policy.version,
    sections: [
      {
        key: "overview",
        title: t("schedule.reuse.detail.sections.overview"),
        icon: <ShieldCheck className="size-4" />,
        items: [
          {
            label: t("schedule.reuse.detail.fields.baseline"),
            value: baselineName,
          },
          {
            label: t("schedule.reuse.detail.fields.version"),
            value: policy.version,
          },
        ],
      },
      {
        key: "schedule",
        title: t("schedule.reuse.detail.sections.schedule"),
        icon: <CalendarRange className="size-4" />,
        items: [
          {
            label: t("schedule.reuse.detail.fields.mode"),
            value: t("schedule.reuse.detail.values.intervalMode"),
          },
          {
            label: t("schedule.reuse.detail.fields.interval"),
            value: t("schedule.form.intervalValue", { hours: policy.scanSchedule.interval_hours ?? 24 }),
          },
          {
            label: t("schedule.reuse.detail.fields.fixedTime"),
            value: policy.scanSchedule.specific_time || t("schedule.reuse.detail.values.notSet"),
          },
          {
            label: t("schedule.reuse.detail.fields.randomDelay"),
            value: t("schedule.form.randomDelayValue", { minutes: policy.scanSchedule.random_delay_minutes ?? 0 }),
          },
          {
            label: t("schedule.reuse.detail.fields.startup"),
            value: policy.scanSchedule.scan_on_startup
              ? t("schedule.reuse.detail.values.enabled")
              : t("schedule.reuse.detail.values.disabled"),
          },
        ],
      },
      {
        key: "retry",
        title: t("schedule.reuse.detail.sections.retry"),
        icon: <Repeat2 className="size-4" />,
        items: [
          {
            label: t("schedule.reuse.detail.fields.retryCount"),
            value:
              retryLimit > 0
                ? t("schedule.form.retryTimes", { count: retryLimit })
                : t("schedule.reuse.detail.values.noRetry"),
          },
          {
            label: t("schedule.reuse.detail.fields.retryInterval"),
            value:
              retryLimit > 0
                ? `${retryInterval} ${t("schedule.form.minutesUnit")}`
                : t("schedule.reuse.detail.values.notApplicable"),
          },
        ],
      },
      {
        key: "lifecycle",
        title: t("schedule.reuse.detail.sections.lifecycle"),
        icon: <History className="size-4" />,
        items: [
          {
            label: t("schedule.reuse.detail.fields.createdAt"),
            value: formatDateTime(policy.createdAt, locale),
          },
          {
            label: t("schedule.reuse.detail.fields.updatedAt"),
            value: formatDateTime(policy.updatedAt, locale),
          },
        ],
      },
    ],
  }
}

export function BaselineDispatchClient() {
  const t = useTranslations("pages.baseline.dispatch")
  const locale = useLocale()
  const [currentStep, setCurrentStep] = useState(1)

  const [templates, setTemplates] = useState<BaselineTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [templatesError, setTemplatesError] = useState("")
  const [selectedTemplateUuid, setSelectedTemplateUuid] = useState("")

  const [policyName, setPolicyName] = useState("")
  const [version, setVersion] = useState("1.0.0")
  const [schedule, setSchedule] = useState<ScanSchedule>(DEFAULT_SCAN_SCHEDULE)
  const [taskMode, setTaskMode] = useState<SwitchModeValue>("reuse")
  const [createdPolicy, setCreatedPolicy] = useState<CreatedPolicy | null>(null)
  const [creatingPolicy, setCreatingPolicy] = useState(false)
  const [reusablePolicies, setReusablePolicies] = useState<ReusableBaselineScanPolicy[]>([])
  const [reusablePoliciesLoading, setReusablePoliciesLoading] = useState(false)
  const [reusablePoliciesError, setReusablePoliciesError] = useState("")
  const [reusablePolicySearch, setReusablePolicySearch] = useState("")
  const [reusablePolicySort, setReusablePolicySort] = useState("updated")
  const [selectedReusablePolicyId, setSelectedReusablePolicyId] = useState("")

  const [hostTree, setHostTree] = useState<HostTreeNode[]>([])
  const [hostsLoading, setHostsLoading] = useState(true)
  const [hostsError, setHostsError] = useState("")
  const [selectorVersion, setSelectorVersion] = useState(0)
  const [selectedNodes, setSelectedNodes] = useState<HostTreeNode[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [submitting, setSubmitting] = useState(false)

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true)
    setTemplatesError("")

    if (!getAccessToken()) {
      setTemplates([])
      setTemplatesError(t("errors.templates.noAuth"))
      setTemplatesLoading(false)
      return
    }

    try {
      const data = await getAllBaselines()
      setTemplates(data)
    } catch (error) {
      setTemplates([])
      setTemplatesError(error instanceof Error ? error.message : t("errors.templates.loadFailed"))
    } finally {
      setTemplatesLoading(false)
    }
  }, [t])

  const loadHosts = useCallback(async () => {
    setHostsLoading(true)
    setHostsError("")

    if (!getAccessToken()) {
      setHostTree([])
      setHostsError(t("errors.hosts.noAuth"))
      setHostsLoading(false)
      return
    }

    try {
      const data = await getHostSelectorTree()
      setHostTree(data as HostTreeNode[])
    } catch (error) {
      setHostTree([])
      setHostsError(error instanceof Error ? error.message : t("errors.hosts.loadFailed"))
    } finally {
      setHostsLoading(false)
    }
  }, [t])

  const loadReusablePolicies = useCallback(async () => {
    if (!selectedTemplateUuid.trim()) {
      setReusablePolicies([])
      setReusablePoliciesError("")
      setReusablePoliciesLoading(false)
      return
    }

    setReusablePoliciesLoading(true)
    setReusablePoliciesError("")

    if (!getAccessToken()) {
      setReusablePolicies([])
      setReusablePoliciesError(t("schedule.reuse.errors.noAuth"))
      setReusablePoliciesLoading(false)
      return
    }

    try {
      const result = await listBaselineScanPolicies({
        baselineUUID: selectedTemplateUuid,
        limit: 100,
        offset: 0,
      })
      setReusablePolicies(result.items)
    } catch (error) {
      setReusablePolicies([])
      setReusablePoliciesError(
        error instanceof Error ? error.message : t("schedule.reuse.errors.loadFailed"),
      )
    } finally {
      setReusablePoliciesLoading(false)
    }
  }, [selectedTemplateUuid, t])

  useEffect(() => {
    void loadTemplates()
    void loadHosts()
  }, [loadHosts, loadTemplates])

  useEffect(() => {
    void loadReusablePolicies()
  }, [loadReusablePolicies])

  useEffect(() => {
    if (!selectedTemplateUuid && templates.length > 0) {
      setSelectedTemplateUuid(templates[0].uuid)
      return
    }

    if (
      selectedTemplateUuid &&
      !templates.some((item) => item.uuid === selectedTemplateUuid)
    ) {
      setSelectedTemplateUuid(templates[0]?.uuid ?? "")
    }
  }, [selectedTemplateUuid, templates])

  const baselineSelectorText = useMemo(
    () => ({
      current: t("selector.current"),
      emptyPlaceholder: t("selector.emptyPlaceholder"),
      checks: (count: number) => t("selector.checks", { count }),
      loading: t("selector.loading"),
      noMatches: t("selector.noMatches"),
      searchPlaceholder: t("selector.searchPlaceholder"),
      selectPlaceholder: t("selector.selectPlaceholder"),
      unknown: t("selector.unknown"),
    }),
    [t],
  )

  const baselineItems = useMemo<BaselineDispatchSelectorItem[]>(() => {
    return templates.map((template) => {
      return {
        id: template.uuid,
        title: template.display_name || template.baseline_uuid,
        standardKey: getDispatchStandardKey(template.standard),
        standardLabel: getDispatchStandardLabel(template.standard, t, t("selector.unknownUpper")),
        productLabel: template.product || t("selector.unknownProduct"),
        profileLabel: getDispatchProfileLabel(template.profile, t, t("selector.unknownProfile")),
        osVersionLabel: template.os_version || template.baseline_version || undefined,
        itemCount: template.item_count,
        highCount: template.high_count,
        mediumCount: template.medium_count,
        lowCount: template.low_count,
      }
    })
  }, [t, templates])

  const selectedTemplate = useMemo(() => {
    return templates.find((item) => item.uuid === selectedTemplateUuid) ?? null
  }, [selectedTemplateUuid, templates])

  const filteredReusablePolicies = useMemo(() => {
    const keyword = reusablePolicySearch.trim().toLowerCase()
    const filtered = keyword
      ? reusablePolicies.filter((item) => {
          return (
            item.name.toLowerCase().includes(keyword) ||
            item.version.toLowerCase().includes(keyword) ||
            item.id.toLowerCase().includes(keyword)
          )
        })
      : reusablePolicies

    return sortReusablePolicies(filtered, reusablePolicySort)
  }, [reusablePolicies, reusablePolicySearch, reusablePolicySort])

  useEffect(() => {
    if (filteredReusablePolicies.length === 0) {
      setSelectedReusablePolicyId("")
      return
    }

    if (!filteredReusablePolicies.some((item) => item.id === selectedReusablePolicyId)) {
      setSelectedReusablePolicyId(filteredReusablePolicies[0].id)
    }
  }, [filteredReusablePolicies, selectedReusablePolicyId])

  const selectedReusablePolicy = useMemo(() => {
    return (
      filteredReusablePolicies.find((item) => item.id === selectedReusablePolicyId) ??
      filteredReusablePolicies[0] ??
      null
    )
  }, [filteredReusablePolicies, selectedReusablePolicyId])

  useEffect(() => {
    if (
      taskMode === "reuse" &&
      createdPolicy?.source === "reused" &&
      createdPolicy.id !== (selectedReusablePolicy?.id || "")
    ) {
      setCreatedPolicy(null)
    }
  }, [createdPolicy, selectedReusablePolicy?.id, taskMode])

  const selectedHosts = useMemo(() => {
    return selectedNodes.filter((node) => node?.type === "host")
  }, [selectedNodes])

  const selectedGroups = useMemo(() => {
    return selectedNodes.filter((node) => node?.type !== "host")
  }, [selectedNodes])

  const selectedNodeLookup = useMemo(() => {
    return new Map(selectedNodes.map((node) => [node.id, node]))
  }, [selectedNodes])

  const deduplicatedHosts = useMemo(() => {
    const map = new Map<string, HostTreeNode>()

    for (const host of selectedHosts) {
      const agentId = host.hostId || host.id
      if (!map.has(agentId)) {
        map.set(agentId, host)
      }
    }

    return Array.from(map.values())
  }, [selectedHosts])

  const hostBuckets = useMemo<DispatchGroup[]>(() => {
    const buckets = new Map<string, DispatchGroup>()

    for (const host of deduplicatedHosts) {
      const groupId = host.parentId || "__ungrouped__"
      const groupName =
        selectedNodeLookup.get(groupId)?.name ||
        (groupId === "__ungrouped__" ? t("target.ungrouped") : t("target.group"))

      const current =
        buckets.get(groupId) || {
          id: groupId,
          name: groupName,
          hostCount: 0,
          hosts: [] as DispatchHost[],
        }

      current.hostCount += 1
      current.hosts?.push({
        agentId: host.hostId || host.id,
        hostname: host.hostname || host.name || host.hostId || host.id,
        ip: host.ip || undefined,
        status: host.status,
        valid: host.valid,
        invalidReason: host.invalidReason,
      })

      buckets.set(groupId, current)
    }

    return Array.from(buckets.values())
  }, [deduplicatedHosts, selectedNodeLookup, t])

  const offlineHostCount = useMemo(() => {
    return deduplicatedHosts.filter((host) =>
      String(host.status || "").toLowerCase().includes("offline"),
    ).length
  }, [deduplicatedHosts])

  const invalidHostCount = useMemo(() => {
    return deduplicatedHosts.filter((host) => host.valid === false).length
  }, [deduplicatedHosts])

  const ungroupedHostCount = useMemo(() => {
    return deduplicatedHosts.filter(
      (host) => !host.parentId || host.parentId === "__ungrouped__",
    ).length
  }, [deduplicatedHosts])

  const canEnterStep2 = Boolean(selectedTemplateUuid)
  const canCreatePolicy = Boolean(policyName.trim() && version.trim() && selectedTemplateUuid)
  const canReusePolicy = Boolean(selectedTemplateUuid && selectedReusablePolicy)
  const canProceedScheduleStep = taskMode === "reuse" ? canReusePolicy : canCreatePolicy
  const canEnterStep3 = canEnterStep2 && Boolean(createdPolicy)
  const canEnterStep4 = canEnterStep3 && deduplicatedHosts.length > 0
  const effectiveSchedule = createdPolicy?.schedule ?? schedule

  const previewValidations = useMemo<DispatchValidation[]>(() => {
    const validations: DispatchValidation[] = []

    if (offlineHostCount > 0) {
      validations.push({
        level: "warning",
        code: "OFFLINE_HOSTS",
        message: t("validation.offlineHosts.message", { count: offlineHostCount }),
        suggestion: t("validation.offlineHosts.suggestion"),
      })
    }

    if (invalidHostCount > 0) {
      validations.push({
        level: "error",
        code: "INVALID_HOSTS",
        message: t("validation.invalidHosts.message", { count: invalidHostCount }),
        suggestion: t("validation.invalidHosts.suggestion"),
      })
    }

    if (!createdPolicy) {
      validations.push({
        level: "error",
        code: "POLICY_NOT_CREATED",
        message: t("validation.policyNotCreated.message"),
        suggestion: t("validation.policyNotCreated.suggestion"),
      })
    }

    if (deduplicatedHosts.length === 0) {
      validations.push({
        level: "error",
        code: "EMPTY_TARGETS",
        message: t("validation.emptyTargets.message"),
        suggestion: t("validation.emptyTargets.suggestion"),
      })
    }

    return validations
  }, [createdPolicy, deduplicatedHosts.length, invalidHostCount, offlineHostCount, t])

  const previewData = useMemo<DispatchPreviewData | undefined>(() => {
    if (!selectedTemplate) return undefined

    return {
      object: {
        type: "baseline",
        id: createdPolicy?.id,
        name: createdPolicy?.name || policyName || t("object.unnamed"),
        version: createdPolicy?.version || version || undefined,
        sourceType:
          selectedTemplate.baseline_type?.toLowerCase() === "custom" ? "custom" : "template",
        mode: "create",
        description: `${t("object.targetBaselinePrefix")}${selectedTemplate.display_name || selectedTemplate.baseline_uuid}`,
      },
      target: {
        selectionMode: getSelectionMode(selectedGroups.length, deduplicatedHosts.length),
        groupCount: hostBuckets.length,
        hostCount: selectedHosts.length,
        deduplicatedHostCount: deduplicatedHosts.length,
        ungroupedHostCount,
        offlineHostCount,
        invalidHostCount,
        boundHostCount: deduplicatedHosts.length - invalidHostCount,
        groups: hostBuckets,
      },
      schedule: {
        mode: "scheduled",
        summary: buildScheduleSummary(effectiveSchedule, t),
        executeAt: effectiveSchedule.specific_time
          ? t("summary.dailyTime", { time: effectiveSchedule.specific_time })
          : undefined,
        timezone: "Asia/Shanghai",
      },
      validations: previewValidations,
      permissions: {
        canSubmit:
          Boolean(createdPolicy) &&
          deduplicatedHosts.length > 0 &&
          invalidHostCount === 0,
        reason:
          invalidHostCount > 0
            ? t("permissions.invalidHosts")
            : !createdPolicy
              ? t("permissions.createPolicyFirst")
              : deduplicatedHosts.length === 0
                ? t("permissions.selectHostsFirst")
                : undefined,
      },
    }
  }, [
    createdPolicy,
    deduplicatedHosts,
    hostBuckets,
    invalidHostCount,
    offlineHostCount,
    policyName,
    previewValidations,
    effectiveSchedule,
    selectedGroups.length,
    selectedHosts.length,
    selectedTemplate,
    t,
    ungroupedHostCount,
    version,
  ])

  const stepItems = useMemo<DispatchStepItem[]>(() => {
    const statuses = [1, 2, 3, 4].map((step) => {
      if (step < currentStep) return "completed" as const
      if (step === currentStep) return "current" as const
      return "upcoming" as const
    })

    return [
      {
        key: 1,
        title: t("steps.baselineSelection.title"),
        description: t("steps.baselineSelection.description"),
        status: statuses[0],
      },
      {
        key: 2,
        title: t("steps.schedule.title"),
        description: t("steps.schedule.description"),
        status: statuses[1],
        disabled: !canEnterStep2,
      },
      {
        key: 3,
        title: t("steps.hostSelection.title"),
        description: t("steps.hostSelection.description"),
        status: statuses[2],
        disabled: !canEnterStep3,
      },
      {
        key: 4,
        title: t("steps.dispatchSubmit.title"),
        description: t("steps.dispatchSubmit.description"),
        status: statuses[3],
        disabled: !canEnterStep4,
      },
    ]
  }, [canEnterStep2, canEnterStep3, canEnterStep4, currentStep, t])

  const handleStepChange = useCallback(
    (step: number) => {
      if (step === 1) {
        setCurrentStep(1)
        return
      }

      if (step === 2 && canEnterStep2) {
        setCurrentStep(2)
        return
      }

      if (step === 3 && canEnterStep3) {
        setCurrentStep(3)
        return
      }

      if (step === 4 && canEnterStep4) {
        setCurrentStep(4)
      }
    },
    [canEnterStep2, canEnterStep3, canEnterStep4],
  )

  const handleTemplateChange = useCallback((value: string) => {
    setSelectedTemplateUuid(value)
    setCreatedPolicy(null)
    setReusablePolicySearch("")
    setSelectedReusablePolicyId("")
    setCurrentStep(1)
  }, [])

  const handlePolicyNameChange = useCallback((value: string) => {
    setPolicyName(value)
    setCreatedPolicy(null)
  }, [])

  const handleTaskModeChange = useCallback((value: SwitchModeValue) => {
    setTaskMode(value)
    setCreatedPolicy(null)
  }, [])

  const handleVersionChange = useCallback((value: string) => {
    setVersion(value)
    setCreatedPolicy(null)
  }, [])

  const handleScheduleChange = useCallback((value: ScanSchedule) => {
    setSchedule(value)
    setCreatedPolicy(null)
  }, [])

  const handleSelectionChange = useCallback((nodes: HostTreeNode[], ids: Set<string>) => {
    setSelectedNodes(nodes)
    setSelectedIds(new Set(ids))
  }, [])

  const handleReusablePolicySelect = useCallback((id: string) => {
    setSelectedReusablePolicyId(id)
    setCreatedPolicy(null)
  }, [])

  const handleCreatePolicy = useCallback(async () => {
    if (!selectedTemplate || !canCreatePolicy) return
    if (!getAccessToken()) {
      toast.error(t("errors.templates.noAuth"))
      return
    }

    setCreatingPolicy(true)

    try {
      const baselineDisplayName = selectedTemplate.display_name || selectedTemplate.baseline_uuid
      const baselineFileName =
        selectedTemplate.original_filename || selectedTemplate.display_name || selectedTemplate.baseline_uuid
      const created = await createBaselineScanPolicy({
        name: policyName.trim(),
        version: version.trim(),
        baselineUUID: selectedTemplate.uuid,
        baselineFileName,
        scanSchedule: schedule,
      })

      setCreatedPolicy({
        id: created.id,
        name: created.name,
        version: created.version,
        baselineUuid: selectedTemplate.uuid,
        baselineName: baselineDisplayName,
        schedule,
        source: "created",
      })

      setCurrentStep(3)
      toast.success(t("toast.policyCreated"))
    } catch (error) {
      toast.error(
        error instanceof Error
          ? t("toast.policyCreateFailedWithReason", { reason: error.message })
          : t("toast.policyCreateFailed"),
      )
    } finally {
      setCreatingPolicy(false)
    }
  }, [canCreatePolicy, policyName, schedule, selectedTemplate, t, version])

  const handleReusePolicy = useCallback(() => {
    if (!selectedTemplate || !selectedReusablePolicy) {
      return
    }

    const baselineDisplayName = selectedTemplate.display_name || selectedTemplate.baseline_uuid

    setPolicyName(selectedReusablePolicy.name)
    setVersion(selectedReusablePolicy.version)
    setSchedule(selectedReusablePolicy.scanSchedule)
    setCreatedPolicy({
      id: selectedReusablePolicy.id,
      name: selectedReusablePolicy.name,
      version: selectedReusablePolicy.version,
      baselineUuid: selectedTemplate.uuid,
      baselineName: baselineDisplayName,
      schedule: selectedReusablePolicy.scanSchedule,
      source: "reused",
    })
    setCurrentStep(3)
    toast.success(t("toast.policyReused"))
  }, [selectedReusablePolicy, selectedTemplate, t])

  const handleSchedulePrimaryAction = useCallback(async () => {
    if (taskMode === "reuse") {
      handleReusePolicy()
      return
    }

    await handleCreatePolicy()
  }, [handleCreatePolicy, handleReusePolicy, taskMode])

  const handleConfirmDispatch = useCallback(async () => {
    if (!previewData?.permissions?.canSubmit) {
      toast.error(previewData?.permissions?.reason || t("toast.dispatchNotReady"))
      return
    }

    if (!createdPolicy) {
      toast.error(t("permissions.createPolicyFirst"))
      return
    }

    const agentIds = deduplicatedHosts
      .map((host) => (host.hostId || host.id || "").trim())
      .filter(Boolean)

    if (agentIds.length === 0) {
      toast.error(t("permissions.selectHostsFirst"))
      return
    }

    setSubmitting(true)
    const toastId = toast.loading(t("toast.dispatchLoading"))

    try {
      await applyBaselineScanPolicy({
        policyId: createdPolicy.id,
        version: createdPolicy.version,
        agentIds,
      })
      toast.success(t("toast.dispatchSuccess"), { id: toastId })
    } catch (error) {
      toast.error(
        error instanceof Error ? t("toast.dispatchFailedWithReason", { reason: error.message }) : t("toast.dispatchFailed"),
        { id: toastId },
      )
    } finally {
      setSubmitting(false)
    }
  }, [
    createdPolicy,
    deduplicatedHosts,
    previewData?.permissions?.canSubmit,
    previewData?.permissions?.reason,
    t,
  ])

  const reusablePolicySortOptions = useMemo(
    () => [
      { value: "updated", label: t("schedule.reuse.sort.updated") },
      { value: "oldest", label: t("schedule.reuse.sort.oldest") },
      { value: "name", label: t("schedule.reuse.sort.name") },
    ],
    [t],
  )

  const reusablePolicyDetail = useMemo(() => {
    const baselineName = selectedTemplate?.display_name || selectedTemplate?.baseline_uuid || "-"

    return buildReusablePolicyDetailData(selectedReusablePolicy, baselineName, locale, t)
  }, [locale, selectedReusablePolicy, selectedTemplate, t])

  const reuseContent = useMemo(() => {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.92fr)_minmax(0,1.08fr)]">
        <div className="min-w-0">
          <BaselinePolicyList
            title={t("schedule.reuse.listTitle")}
            searchPlaceholder={t("schedule.reuse.searchPlaceholder")}
            searchValue={reusablePolicySearch}
            sortValue={reusablePolicySort}
            sortOptions={reusablePolicySortOptions}
            items={filteredReusablePolicies.map((item) => ({
              id: item.id,
              name: item.name,
              version: item.version,
              updatedText: t("schedule.reuse.updatedAt", {
                time: formatDateTime(item.updatedAt || item.createdAt, locale),
              }),
            }))}
            selectedId={selectedReusablePolicy?.id}
            loading={reusablePoliciesLoading}
            error={reusablePoliciesError}
            emptyTitle={t("schedule.reuse.emptyTitle")}
            emptyDescription={t("schedule.reuse.emptyDescription")}
            retryLabel={t("schedule.reuse.retry")}
            onRetry={() => void loadReusablePolicies()}
            onSearchChange={setReusablePolicySearch}
            onSortChange={setReusablePolicySort}
            onSelect={handleReusablePolicySelect}
          />
        </div>

        <div className="min-w-0">
          <BaselinePolicyDetail
            title={t("schedule.reuse.detailTitle")}
            policy={reusablePolicyDetail}
            loading={reusablePoliciesLoading}
            idLabel={t("schedule.reuse.detail.idLabel")}
            emptyTitle={t("schedule.reuse.detail.emptyTitle")}
            emptyDescription={t("schedule.reuse.detail.emptyDescription")}
          />
        </div>
      </div>
    )
  }, [
    filteredReusablePolicies,
    handleReusablePolicySelect,
    loadReusablePolicies,
    locale,
    reusablePoliciesError,
    reusablePoliciesLoading,
    reusablePolicyDetail,
    reusablePolicySearch,
    reusablePolicySort,
    reusablePolicySortOptions,
    selectedReusablePolicy?.id,
    t,
  ])

  const renderCurrentStep = () => {
    const selector = (
      <BaselineDispatchSelector
        items={baselineItems}
        value={selectedTemplateUuid}
        onValueChange={handleTemplateChange}
        loading={templatesLoading}
        className="w-full"
        text={baselineSelectorText}
      />
    )

    if (currentStep === 1) {
      return (
        <BaselineSelectionStep
          selector={selector}
          selectedTemplate={selectedTemplate}
          canNext={canEnterStep2}
          onNext={() => setCurrentStep(2)}
        />
      )
    }

    if (currentStep === 2) {
      return (
        <ScanScheduleStep
          schedule={schedule}
          creating={creatingPolicy}
          canProceed={canProceedScheduleStep}
          mode={taskMode}
          onNameChange={handlePolicyNameChange}
          onModeChange={handleTaskModeChange}
          onScheduleChange={handleScheduleChange}
          onVersionChange={handleVersionChange}
          policyName={policyName}
          reuseContent={reuseContent}
          version={version}
          onBack={() => setCurrentStep(1)}
          onPrimaryAction={() => void handleSchedulePrimaryAction()}
        />
      )
    }

    if (currentStep === 3) {
      return (
        <HostSelectionStep
          selectorKey={selectorVersion}
          data={hostTree}
          loading={hostsLoading}
          error={hostsError}
          selectedHostCount={deduplicatedHosts.length}
          selectedNodeCount={selectedIds.size}
          canNext={canEnterStep4}
          onSelectionChange={handleSelectionChange}
          onBack={() => setCurrentStep(2)}
          onNext={() => setCurrentStep(4)}
        />
      )
    }

    return (
      <DispatchSubmitStep
        data={previewData}
        submitting={submitting}
        dangerConfirmRequired={offlineHostCount > 0}
        onBack={() => setCurrentStep(3)}
        onConfirm={() => void handleConfirmDispatch()}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_24%),linear-gradient(180deg,#f8fbff_0%,#eef3f8_100%)]">
      <div className="space-y-6 p-6">
        {(templatesError || hostsError) && (
            <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("errors.loadDataTitle")}</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{templatesError || hostsError}</span>
              {!getAccessToken() ? (
                <Button asChild size="sm" variant="outline" className="shrink-0">
                  <Link href="/login">{t("errors.goLogin")}</Link>
                </Button>
              ) : null}
            </AlertDescription>
          </Alert>
        )}

        <DispatchStepper
          currentStep={currentStep}
          items={stepItems}
          onStepChange={handleStepChange}
        />

        <div className="space-y-6">
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  )
}
