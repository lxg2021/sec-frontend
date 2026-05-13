"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertCircle, FileText, Hash, Plus, RefreshCw } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  applyBaselineScanPolicy,
  listBaselineScanPolicies,
  createBaselineScanPolicy,
  type BaselineScanPolicyListResult,
  type ReusableBaselineScanPolicy,
} from "@/features/baseline/dispatch/api"
import { getAllBaselines, type BaselineTemplate } from "@/features/baseline/custom/api"
import {
  type DispatchGroup,
  type DispatchHost,
  type DispatchPreviewData,
  type DispatchValidation,
} from "@/shared/components/dispatch-preview"
import {
  DEFAULT_SCAN_SCHEDULE,
  ScanScheduleForm,
  type ScanSchedule,
  type ScanScheduleFormField,
  type ScanScheduleFormText,
} from "@/shared/components/scan-schedule"
import { getHostSelectorTree } from "@/shared/components/host-selector/api"
import { getAccessToken } from "@/shared/lib/http/auth"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"

import { BaselineDispatchSelector, type BaselineDispatchSelectorItem } from "./baseline-dispatch-selector"
import { BaselineSelectionStep } from "./baseline-selection-step"
import { BaselineTableList } from "./baseline-table-list"
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
}

function mapReusablePolicyToCreatedPolicy(
  policy: ReusableBaselineScanPolicy,
  baselineName: string,
): CreatedPolicy {
  return {
    id: policy.id,
    name: policy.name,
    version: policy.version,
    baselineUuid: policy.baselineUuid,
    baselineName,
    schedule: policy.scanSchedule,
  }
}

function getReusablePolicyKey(policy: Pick<ReusableBaselineScanPolicy, "id" | "version">) {
  return `${policy.id}::${policy.version}`
}

function buildAutoPolicyName(template: BaselineTemplate) {
  const baseName = (template.display_name || template.baseline_uuid || template.uuid).trim()
  return `${baseName}-scan-task`
}

function buildAutoPolicyVersion() {
  const timestamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14)
  return `1.0.${timestamp}`
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

  return parts.join(", ")
}

function getSelectionMode(groupCount: number, hostCount: number) {
  if (groupCount > 0 && hostCount > 0) return "mixed" as const
  if (groupCount > 0) return "group" as const
  return "host" as const
}

const REUSABLE_POLICY_PAGE_SIZE = 8

export function BaselineDispatchClient() {
  const t = useTranslations("pages.baseline.dispatch")
  const locale = useLocale()
  const isZh = locale.toLowerCase().startsWith("zh")
  const [currentStep, setCurrentStep] = useState(1)

  const [templates, setTemplates] = useState<BaselineTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [templatesError, setTemplatesError] = useState("")
  const [selectedTemplateUuid, setSelectedTemplateUuid] = useState("")

  const [schedule, setSchedule] = useState<ScanSchedule>(DEFAULT_SCAN_SCHEDULE)
  const [policyName, setPolicyName] = useState("")
  const [policyVersion, setPolicyVersion] = useState("")
  const [createdPolicy, setCreatedPolicy] = useState<CreatedPolicy | null>(null)
  const [appliedPolicy, setAppliedPolicy] = useState<CreatedPolicy | null>(null)
  const [creatingPolicy, setCreatingPolicy] = useState(false)
  const [reusablePolicies, setReusablePolicies] = useState<BaselineScanPolicyListResult | null>(null)
  const [reusablePoliciesLoading, setReusablePoliciesLoading] = useState(false)
  const [reusablePoliciesError, setReusablePoliciesError] = useState("")
  const [reusablePoliciesPage, setReusablePoliciesPage] = useState(1)
  const [selectedReusablePolicyKey, setSelectedReusablePolicyKey] = useState<string | null>(null)

  const [hostTree, setHostTree] = useState<HostTreeNode[]>([])
  const [hostsLoading, setHostsLoading] = useState(true)
  const [hostsError, setHostsError] = useState("")
  const selectorVersion = 0
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

  const loadReusablePolicies = useCallback(async (page: number, preferredSelectedKey?: string | null) => {
    if (!selectedTemplateUuid.trim()) {
      setReusablePolicies(null)
      setReusablePoliciesError("")
      setReusablePoliciesLoading(false)
      return
    }

    setReusablePoliciesLoading(true)
    setReusablePoliciesError("")

    if (!getAccessToken()) {
      setReusablePolicies(null)
      setReusablePoliciesError(t("schedule.reuse.errors.noAuth"))
      setReusablePoliciesLoading(false)
      return
    }

    try {
      const result = await listBaselineScanPolicies({
        baselineUUID: selectedTemplateUuid,
        limit: REUSABLE_POLICY_PAGE_SIZE,
        offset: (page - 1) * REUSABLE_POLICY_PAGE_SIZE,
      })

      setReusablePolicies(result)
      setSelectedReusablePolicyKey((current) => {
        if (preferredSelectedKey && result.items.some((item) => getReusablePolicyKey(item) === preferredSelectedKey)) {
          return preferredSelectedKey
        }

        if (current && result.items.some((item) => getReusablePolicyKey(item) === current)) {
          return current
        }

        return result.items[0] ? getReusablePolicyKey(result.items[0]) : null
      })
    } catch (error) {
      setReusablePolicies(null)
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
    void loadReusablePolicies(reusablePoliciesPage)
  }, [loadReusablePolicies, reusablePoliciesPage])

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

  const selectedReusablePolicy = useMemo(() => {
    return reusablePolicies?.items.find((item) => getReusablePolicyKey(item) === selectedReusablePolicyKey) ?? null
  }, [reusablePolicies, selectedReusablePolicyKey])

  useEffect(() => {
    if (!selectedTemplate) {
      setPolicyName("")
      setPolicyVersion("")
      return
    }

    setPolicyName(buildAutoPolicyName(selectedTemplate))
    setPolicyVersion(buildAutoPolicyVersion())
  }, [selectedTemplate])

  const scanScheduleFormText = useMemo<ScanScheduleFormText>(() => {
    if (isZh) {
      return {
        modeLabel: "\u8c03\u5ea6\u6a21\u5f0f",
        modePlaceholder: "\u9009\u62e9\u8c03\u5ea6\u6a21\u5f0f",
        modeInterval: "\u56fa\u5b9a\u95f4\u9694",
        intervalLabel: "\u95f4\u9694",
        intervalValue: (hours: number) => `${hours} \u5c0f\u65f6`,
        fixedTimeLabel: "\u56fa\u5b9a\u6267\u884c\u65f6\u95f4",
        randomDelayLabel: "\u968f\u673a\u5ef6\u8fdf",
        randomDelayValue: (minutes: number) => `${minutes} \u5206\u949f`,
        retryCountLabel: "\u91cd\u8bd5\u6b21\u6570",
        retryIntervalLabel: "\u91cd\u8bd5\u95f4\u9694",
        retryNone: "\u4e0d\u91cd\u8bd5",
        retryTimes: (count: number) => `${count} \u6b21`,
        minutesUnit: "\u5206\u949f",
        startupTitle: "Agent \u542f\u52a8\u65f6\u6267\u884c\u626b\u63cf",
        startupDescription: "\u542f\u52a8\u540e\u7acb\u5373\u8865\u8dd1\u4e00\u6b21\u626b\u63cf\u4efb\u52a1",
        startupInlineLabel: "\u542f\u52a8\u65f6\u626b\u63cf",
      }
    }

    return {
      modeLabel: "Schedule Mode",
      modePlaceholder: "Select schedule mode",
      modeInterval: "Fixed Interval",
      intervalLabel: "Interval",
      intervalValue: (hours: number) => `${hours}h`,
      fixedTimeLabel: "Fixed Execution Time",
      randomDelayLabel: "Random Delay",
      randomDelayValue: (minutes: number) => `${minutes} min`,
      retryCountLabel: "Retry Count",
      retryIntervalLabel: "Retry Interval",
      retryNone: "No Retry",
      retryTimes: (count: number) => `${count} times`,
      minutesUnit: "min",
      startupTitle: "Run scan when Agent starts",
      startupDescription: "Run one catch-up scan immediately after startup",
      startupInlineLabel: "Scan on startup",
    }
  }, [isZh])

  const scanScheduleFields = useMemo<ScanScheduleFormField[]>(() => {
    return [
        {
          id: "policy-name",
          icon: <FileText className="size-3.5 text-primary" />,
          label: isZh ? "\u7b56\u7565\u540d\u79f0" : "Policy Name",
          value: policyName,
          inputClassName: "bg-slate-50",
        onChange: (value) => {
          setPolicyName(value)
          setAppliedPolicy(null)
          setCreatedPolicy(null)
        },
      },
        {
          id: "policy-version",
          icon: <Hash className="size-3.5 text-primary" />,
          label: isZh ? "\u7248\u672c\u53f7" : "Version",
          value: policyVersion,
          inputClassName: "bg-slate-50",
        onChange: (value) => {
          setPolicyVersion(value)
          setAppliedPolicy(null)
          setCreatedPolicy(null)
        },
      },
    ]
  }, [isZh, policyName, policyVersion])

  const candidatePolicy = useMemo(() => {
    if (selectedReusablePolicy && selectedTemplate) {
      return mapReusablePolicyToCreatedPolicy(
        selectedReusablePolicy,
        selectedTemplate.display_name || selectedTemplate.baseline_uuid,
      )
    }

    return createdPolicy
  }, [createdPolicy, selectedReusablePolicy, selectedTemplate])

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
  const canCreatePolicy = Boolean(selectedTemplate && policyName.trim() && policyVersion.trim())
  const canApplyPolicy = Boolean(candidatePolicy)
  const canEnterStep3 = canEnterStep2 && Boolean(appliedPolicy)
  const canEnterStep4 = canEnterStep3 && deduplicatedHosts.length > 0
  const effectiveSchedule = appliedPolicy?.schedule ?? schedule

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

    if (!appliedPolicy) {
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
  }, [appliedPolicy, deduplicatedHosts.length, invalidHostCount, offlineHostCount, t])

  const previewData = useMemo<DispatchPreviewData | undefined>(() => {
    if (!selectedTemplate) return undefined

    return {
      object: {
        type: "baseline",
        id: appliedPolicy?.id,
        name: appliedPolicy?.name || policyName.trim() || t("object.unnamed"),
        version: appliedPolicy?.version || policyVersion.trim() || undefined,
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
          Boolean(appliedPolicy) &&
          deduplicatedHosts.length > 0 &&
          invalidHostCount === 0,
        reason:
          invalidHostCount > 0
            ? t("permissions.invalidHosts")
            : !appliedPolicy
              ? t("permissions.createPolicyFirst")
              : deduplicatedHosts.length === 0
                ? t("permissions.selectHostsFirst")
                : undefined,
      },
    }
  }, [
    appliedPolicy,
    deduplicatedHosts,
    hostBuckets,
    invalidHostCount,
    offlineHostCount,
    previewValidations,
    effectiveSchedule,
    policyName,
    policyVersion,
    selectedGroups.length,
    selectedHosts.length,
    selectedTemplate,
    t,
    ungroupedHostCount,
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
    setAppliedPolicy(null)
    setCreatedPolicy(null)
    setReusablePoliciesPage(1)
    setSelectedReusablePolicyKey(null)
    setCurrentStep(1)
  }, [])

  const handleSelectionChange = useCallback((nodes: HostTreeNode[], ids: Set<string>) => {
    setSelectedNodes(nodes)
    setSelectedIds(new Set(ids))
  }, [])

  const handleScheduleChange = useCallback((value: ScanSchedule) => {
    setSchedule(value)
    setAppliedPolicy(null)
    setCreatedPolicy(null)
  }, [])

  const handleReusablePolicySelectionChange = useCallback((selectedKey: string | null) => {
    setAppliedPolicy(null)
    setSelectedReusablePolicyKey(selectedKey)
  }, [])

  const handleReusablePolicyRowClick = useCallback((item: ReusableBaselineScanPolicy) => {
    setSelectedReusablePolicyKey(getReusablePolicyKey(item))
  }, [])

  const handleApplyTask = useCallback(() => {
    if (!candidatePolicy) {
      toast.error(t("validation.policyNotCreated.suggestion"))
      return
    }

    setAppliedPolicy(candidatePolicy)
    setCurrentStep(3)
  }, [candidatePolicy, t])

  const handleCreatePolicy = useCallback(async () => {
    if (!selectedTemplate) return
    if (!getAccessToken()) {
      toast.error(t("errors.templates.noAuth"))
      return
    }
    if (!policyName.trim() || !policyVersion.trim()) {
      toast.error(isZh ? "\u8bf7\u5148\u586b\u5199\u7b56\u7565\u540d\u79f0\u548c\u7248\u672c\u53f7" : "Please enter the policy name and version first")
      return
    }

    setCreatingPolicy(true)

    try {
      const baselineDisplayName = selectedTemplate.display_name || selectedTemplate.baseline_uuid
      const baselineFileName =
        selectedTemplate.original_filename || selectedTemplate.display_name || selectedTemplate.baseline_uuid
      const created = await createBaselineScanPolicy({
        name: policyName.trim(),
        version: policyVersion.trim(),
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
      })

      setAppliedPolicy(null)
      setReusablePoliciesPage(1)
      setSelectedReusablePolicyKey(getReusablePolicyKey(created))
      await loadReusablePolicies(1, getReusablePolicyKey(created))
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
  }, [isZh, loadReusablePolicies, policyName, policyVersion, schedule, selectedTemplate, t])

  const handleConfirmDispatch = useCallback(async () => {
    if (!previewData?.permissions?.canSubmit) {
      toast.error(previewData?.permissions?.reason || t("toast.dispatchNotReady"))
      return
    }

    if (!appliedPolicy) {
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
        policyId: appliedPolicy.id,
        version: appliedPolicy.version,
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
    appliedPolicy,
    deduplicatedHosts,
    previewData?.permissions?.canSubmit,
    previewData?.permissions?.reason,
    t,
  ])

  const scheduleContent = (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <BaselineTableList
          data={reusablePolicies}
          error={reusablePoliciesError}
          loading={reusablePoliciesLoading}
          onPageChange={setReusablePoliciesPage}
          onRefresh={() => void loadReusablePolicies(reusablePoliciesPage)}
          onRowClick={handleReusablePolicyRowClick}
          onSelectionChange={handleReusablePolicySelectionChange}
          selectedKey={selectedReusablePolicyKey}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="space-y-5">
          <div className="flex items-center gap-4 pb-1">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Plus className="size-4 text-sky-600" />
              {isZh ? "\u521b\u5efa\u4efb\u52a1" : "Create Task"}
            </h3>
          </div>

          <ScanScheduleForm
            fields={scanScheduleFields}
            value={schedule}
            onChange={handleScheduleChange}
            title={null}
            description={null}
            action={
              <Button
                type="button"
                onClick={() => void handleCreatePolicy()}
                disabled={!canCreatePolicy || creatingPolicy}
                className="h-10 w-full text-base font-medium"
              >
                <Plus className="h-4 w-4" />
                {creatingPolicy
                  ? (isZh ? "\u521b\u5efa\u4e2d..." : "Creating...")
                  : (isZh ? "\u65b0\u5efa\u4efb\u52a1" : "New Task")}
              </Button>
            }
            text={scanScheduleFormText}
            className="max-w-none border-0 bg-transparent shadow-none"
          />
        </div>
      </section>

    </div>
  )

  const scheduleHeaderAction = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => void loadReusablePolicies(reusablePoliciesPage)}
      disabled={reusablePoliciesLoading}
      className="h-11 rounded-2xl px-5"
    >
      <RefreshCw className={reusablePoliciesLoading ? "mr-2 size-4 animate-spin" : "mr-2 size-4"} />
      {isZh ? "\u5237\u65b0" : "Refresh"}
    </Button>
  )

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
          creating={creatingPolicy}
          canProceed={canApplyPolicy}
          content={scheduleContent}
          headerAction={scheduleHeaderAction}
          onBack={() => setCurrentStep(1)}
          onPrimaryAction={handleApplyTask}
          primaryLabel={isZh ? "\u5e94\u7528\u4efb\u52a1" : "Apply Task"}
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
