"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  FilePlus2,
  FileText,
  Hash,
  LibraryBig,
  ListChecks,
  LoaderCircle,
  Send,
  Server,
  ShieldCheck,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  applyBaselineScanPolicy,
  listBaselineScanPolicies,
  createBaselineScanPolicy,
  isSameBaselineScanSchedule,
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
  sanitizeScanSchedule,
  type ScanSchedule,
  type ScanScheduleFormText,
} from "@/shared/components/scan-schedule"
import HostSelector from "@/shared/components/host-selector"
import { getHostSelectorTree } from "@/shared/components/host-selector/api"
import type {
  HostSelectorHostNode,
  HostSelectorTreeNode,
} from "@/shared/components/host-selector/types"
import { getAccessToken } from "@/shared/lib/http/auth"
import { cn } from "@/shared/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

import { BaselineDispatchConfirmDialog } from "./baseline-dispatch-confirm-dialog"
import { BaselineDispatchSelector, type BaselineDispatchSelectorItem } from "./baseline-dispatch-selector"
import { BaselinePolicySelectorDialog } from "./baseline-policy-selector-dialog"
import {
  getDispatchProfileLabel,
  getDispatchStandardKey,
  getDispatchStandardLabel,
} from "./value-mapping"

type DispatchHostTreeNode = HostSelectorTreeNode & {
  valid?: boolean
  invalidReason?: string
}

type DispatchHostNode = HostSelectorHostNode & {
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

function isPolicyConflict(error: unknown) {
  if (!(error instanceof Error)) return false
  return /already exists|duplicate|conflict|\u5df2\u5b58\u5728|\u91cd\u590d/i.test(error.message)
}

function buildAutoPolicyName(template: BaselineTemplate) {
  const baseName = (template.display_name || template.baseline_uuid || template.uuid).trim()
  return `${baseName}-scan-task`
}

function buildAutoPolicyVersion() {
  return "1.0.0"
}

const POLICY_VERSION_PATTERN = /^\d+\.\d+\.\d+$/

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
  const workspace = useTranslations("pages.baseline.dispatch.workspace")
  const locale = useLocale()
  const isZh = locale.toLowerCase().startsWith("zh")
  const [policySelectorOpen, setPolicySelectorOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const [templates, setTemplates] = useState<BaselineTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [templatesError, setTemplatesError] = useState("")
  const [selectedTemplateUuid, setSelectedTemplateUuid] = useState("")

  const [schedule, setSchedule] = useState<ScanSchedule>(DEFAULT_SCAN_SCHEDULE)
  const [policyName, setPolicyName] = useState("")
  const [policyVersion, setPolicyVersion] = useState("")
  const [appliedPolicy, setAppliedPolicy] = useState<CreatedPolicy | null>(null)
  const [creatingPolicy, setCreatingPolicy] = useState(false)
  const [reusablePolicies, setReusablePolicies] = useState<BaselineScanPolicyListResult | null>(null)
  const [reusablePoliciesLoading, setReusablePoliciesLoading] = useState(false)
  const [reusablePoliciesError, setReusablePoliciesError] = useState("")
  const [reusablePoliciesPage, setReusablePoliciesPage] = useState(1)
  const [selectedReusablePolicyKey, setSelectedReusablePolicyKey] = useState<string | null>(null)

  const [hostTree, setHostTree] = useState<DispatchHostTreeNode[]>([])
  const [hostsLoading, setHostsLoading] = useState(true)
  const [hostsError, setHostsError] = useState("")
  const selectorVersion = 0
  const [selectedNodes, setSelectedNodes] = useState<DispatchHostTreeNode[]>([])

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
      setHostTree(data)
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

  const policyVersionError =
    policyVersion.trim() && !POLICY_VERSION_PATTERN.test(policyVersion.trim())
      ? (isZh ? "\u7248\u672c\u53f7\u683c\u5f0f\u9700\u4e3a 0.0.0" : "Version must use the 0.0.0 format")
      : undefined

  const selectedHosts = useMemo(() => {
    return selectedNodes.filter((node): node is DispatchHostNode => node.type === "host")
  }, [selectedNodes])

  const selectedGroups = useMemo(() => {
    return selectedNodes.filter((node) => node?.type !== "host")
  }, [selectedNodes])

  const selectedNodeLookup = useMemo(() => {
    return new Map(selectedNodes.map((node) => [node.id, node]))
  }, [selectedNodes])

  const deduplicatedHosts = useMemo(() => {
    const map = new Map<string, DispatchHostNode>()

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

  const onlineHostCount = Math.max(0, deduplicatedHosts.length - offlineHostCount)

  const ungroupedHostCount = useMemo(() => {
    return deduplicatedHosts.filter(
      (host) => !host.parentId || host.parentId === "__ungrouped__",
    ).length
  }, [deduplicatedHosts])

  const isPolicyVersionValid = POLICY_VERSION_PATTERN.test(policyVersion.trim())
  const canCreatePolicy = Boolean(selectedTemplate && policyName.trim() && isPolicyVersionValid)
  const canOpenConfirm = Boolean(appliedPolicy && deduplicatedHosts.length > 0 && invalidHostCount === 0)
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

  const handleTemplateChange = useCallback((value: string) => {
    setSelectedTemplateUuid(value)
    setAppliedPolicy(null)
    setReusablePoliciesPage(1)
    setSelectedReusablePolicyKey(null)
  }, [])

  const handleSelectionChange = useCallback((nodes: DispatchHostTreeNode[]) => {
    setSelectedNodes(nodes)
  }, [])

  const handleScheduleChange = useCallback((value: ScanSchedule) => {
    setSchedule(sanitizeScanSchedule(value))
    setAppliedPolicy(null)
    setSelectedReusablePolicyKey(null)
  }, [])

  const handleReusablePolicySelectionChange = useCallback((selectedKey: string | null) => {
    setSelectedReusablePolicyKey(selectedKey)
  }, [])

  const handleReusablePolicyRowClick = useCallback((item: ReusableBaselineScanPolicy) => {
    setSelectedReusablePolicyKey(getReusablePolicyKey(item))
  }, [])

  const handleUseSelectedPolicy = useCallback(() => {
    if (!selectedReusablePolicy || !selectedTemplate) return

    const nextPolicy = mapReusablePolicyToCreatedPolicy(
      selectedReusablePolicy,
      selectedTemplate.display_name || selectedTemplate.baseline_uuid,
    )

    setSchedule(nextPolicy.schedule)
    setPolicyName(nextPolicy.name)
    setPolicyVersion(nextPolicy.version)
    setAppliedPolicy(nextPolicy)
    setPolicySelectorOpen(false)
    toast.success(t("toast.policyReused"))
  }, [selectedReusablePolicy, selectedTemplate, t])

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
    if (!POLICY_VERSION_PATTERN.test(policyVersion.trim())) {
      toast.error(isZh ? "\u7248\u672c\u53f7\u683c\u5f0f\u9700\u4e3a 0.0.0" : "Version must use the 0.0.0 format")
      return
    }

    const nextSchedule = sanitizeScanSchedule(schedule)
    const baselineDisplayName = selectedTemplate.display_name || selectedTemplate.baseline_uuid
    const baselineFileName =
      selectedTemplate.original_filename || selectedTemplate.display_name || selectedTemplate.baseline_uuid
    const reusePolicy = (policy: ReusableBaselineScanPolicy) => {
      const nextPolicy = mapReusablePolicyToCreatedPolicy(policy, baselineDisplayName)
      setSchedule(nextPolicy.schedule)
      setAppliedPolicy(nextPolicy)
      setSelectedReusablePolicyKey(getReusablePolicyKey(policy))
      toast.success(t("toast.policyReused"))
    }

    setCreatingPolicy(true)

    try {
      const created = await createBaselineScanPolicy({
        name: policyName.trim(),
        version: policyVersion.trim(),
        baselineUUID: selectedTemplate.uuid,
        baselineFileName,
        scanSchedule: nextSchedule,
      })

      const nextCreatedPolicy = {
        id: created.id,
        name: created.name,
        version: created.version,
        baselineUuid: selectedTemplate.uuid,
        baselineName: baselineDisplayName,
        schedule: nextSchedule,
      }
      setSchedule(nextSchedule)

      setAppliedPolicy(nextCreatedPolicy)
      setReusablePoliciesPage(1)
      setSelectedReusablePolicyKey(getReusablePolicyKey(created))
      await loadReusablePolicies(1, getReusablePolicyKey(created))
      toast.success(t("toast.policyCreated"))
    } catch (error) {
      if (isPolicyConflict(error)) {
        try {
          const latestPolicies = await listBaselineScanPolicies({
            baselineUUID: selectedTemplate.uuid,
            limit: 100,
            offset: 0,
          })
          const existingMatch = latestPolicies.items.find((policy) =>
            isSameBaselineScanSchedule(policy.scanSchedule, nextSchedule),
          )

          if (existingMatch) {
            setReusablePolicies(latestPolicies)
            setReusablePoliciesPage(1)
            reusePolicy(existingMatch)
            return
          }
        } catch {
          // Preserve the original creation error if conflict recovery cannot load the existing task.
        }
      }

      toast.error(
        error instanceof Error
          ? t("toast.policyCreateFailedWithReason", { reason: error.message })
          : t("toast.policyCreateFailed"),
      )
    } finally {
      setCreatingPolicy(false)
    }
  }, [
    isZh,
    loadReusablePolicies,
    policyName,
    policyVersion,
    schedule,
    selectedTemplate,
    t,
  ])

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
      setConfirmOpen(false)
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

  const handleOpenConfirm = useCallback(() => {
    if (!appliedPolicy) {
      toast.error(t("permissions.createPolicyFirst"))
      return
    }

    if (deduplicatedHosts.length === 0) {
      toast.error(t("permissions.selectHostsFirst"))
      return
    }

    if (invalidHostCount > 0) {
      toast.error(t("permissions.invalidHosts"))
      return
    }

    setConfirmOpen(true)
  }, [appliedPolicy, deduplicatedHosts.length, invalidHostCount, t])

  return (
    <div className="h-full min-h-0 overflow-hidden bg-slate-100 p-4">
      <div className="flex h-full min-h-0 flex-col gap-3">
        <header className="w-full shrink-0 rounded-[28px] border border-slate-200/80 bg-white px-5 py-[13px] shadow-[0_12px_34px_rgba(15,23,42,0.08)]">
          <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center">
            <div className="flex min-w-0 items-center gap-4 xl:w-[430px] xl:flex-none 2xl:w-[500px]">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 text-teal-700">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0 space-y-1.5">
                <h1 className="truncate text-lg font-semibold leading-tight text-slate-950">{workspace("pageTitle")}</h1>
                <p className="truncate text-sm text-slate-500">{workspace("pageDescription")}</p>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 xl:flex-nowrap xl:justify-end">
              <div className="hidden h-12 w-[410px] shrink-0 grid-cols-[auto_116px_auto] items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 shadow-inner shadow-slate-200/20 2xl:grid">
                <FlowBadge number={1} title={workspace("flowTask")} done={Boolean(appliedPolicy)} />
                <div className="mx-4 h-px bg-slate-300" />
                <FlowBadge number={2} title={workspace("flowHosts")} done={deduplicatedHosts.length > 0} />
              </div>
              <span className="hidden h-6 w-px shrink-0 bg-slate-200 2xl:block" aria-hidden="true" />
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPolicySelectorOpen(true)}
                disabled={!selectedTemplate}
                className="h-10 shrink-0 gap-2 rounded-full px-3 text-cyan-600 hover:bg-cyan-50 hover:text-cyan-700"
              >
                <LibraryBig className="h-4 w-4" />
                <span className="font-medium">{workspace("selectExisting")}</span>
              </Button>
              <span className="h-6 w-px shrink-0 bg-slate-200" aria-hidden="true" />
              <Button
                type="button"
                variant="ghost"
                onClick={() => void handleCreatePolicy()}
                disabled={!canCreatePolicy || creatingPolicy}
                className="h-10 shrink-0 gap-2 rounded-full px-3 text-teal-600 hover:bg-teal-50 hover:text-teal-700"
              >
                {creatingPolicy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FilePlus2 className="h-4 w-4" />}
                <span className="font-medium">{creatingPolicy ? workspace("creatingTask") : workspace("createTask")}</span>
              </Button>
              <span className="h-6 w-px shrink-0 bg-slate-200" aria-hidden="true" />
              <Button
                type="button"
                onClick={handleOpenConfirm}
                disabled={!canOpenConfirm || submitting}
                className="h-10 min-w-56 shrink-0 rounded-full bg-teal-600 px-5 text-white shadow-sm hover:bg-teal-700"
              >
                {submitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {submitting ? workspace("dispatching") : workspace("dispatchToHosts", { count: deduplicatedHosts.length })}
              </Button>
            </div>
          </div>
        </header>

        {templatesError && (
          <Alert variant="destructive" className="shrink-0">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("errors.loadDataTitle")}</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{templatesError}</span>
              {!getAccessToken() ? (
                <Button asChild size="sm" variant="outline" className="shrink-0">
                  <Link href="/login">{t("errors.goLogin")}</Link>
                </Button>
              ) : null}
            </AlertDescription>
          </Alert>
        )}

        <section className="shrink-0 rounded-[24px] border border-slate-200 bg-white px-5 py-3.5 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <ListChecks className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-950">{workspace("definitionTitle")}</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">{workspace("definitionDescription")}</p>
            </div>
          </div>

          <div className="mt-3 grid items-end gap-4 xl:grid-cols-[minmax(360px,1.45fr)_minmax(260px,0.9fr)_150px_minmax(260px,0.8fr)]">
            <div className="min-w-0 space-y-1.5">
              <Label className="flex h-4 items-center text-xs font-medium leading-none text-slate-700">
                {workspace("targetBaseline")}<span className="ml-1 text-red-500">*</span>
              </Label>
              <BaselineDispatchSelector
                items={baselineItems}
                value={selectedTemplateUuid}
                onValueChange={handleTemplateChange}
                loading={templatesLoading}
                className="h-[62px] w-full border border-slate-200 bg-slate-50 py-1.5 pl-2 shadow-none"
                text={baselineSelectorText}
              />
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="baseline-policy-name" className="flex h-4 items-center text-xs font-medium leading-none text-slate-700">
                <FileText className="mr-1.5 h-3.5 w-3.5 text-sky-600" />
                {workspace("taskName")}<span className="ml-1 text-red-500">*</span>
              </Label>
              <Input
                id="baseline-policy-name"
                value={policyName}
                onChange={(event) => {
                  setPolicyName(event.target.value)
                  setAppliedPolicy(null)
                  setSelectedReusablePolicyKey(null)
                }}
                className="h-[62px] bg-white"
                maxLength={128}
              />
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="baseline-policy-version" className="flex h-4 items-center text-xs font-medium leading-none text-slate-700">
                <Hash className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
                {workspace("version")}<span className="ml-1 text-red-500">*</span>
              </Label>
              <div>
                <Input
                  id="baseline-policy-version"
                  value={policyVersion}
                  onChange={(event) => {
                    setPolicyVersion(event.target.value)
                    setAppliedPolicy(null)
                    setSelectedReusablePolicyKey(null)
                  }}
                  aria-invalid={Boolean(policyVersionError)}
                  className={cn("h-[62px] font-mono", policyVersionError && "border-rose-400")}
                  maxLength={64}
                />
                {policyVersionError ? <p className="mt-1 text-[10px] text-rose-500">{policyVersionError}</p> : null}
              </div>
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label className="flex h-4 items-center text-xs font-medium leading-none text-slate-700">{workspace("status")}</Label>
              <div className="flex h-[62px] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4">
                <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", appliedPolicy || canCreatePolicy ? "bg-emerald-500" : "bg-amber-500")} />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-800">
                    {appliedPolicy
                      ? workspace("statusReady")
                      : !selectedTemplate
                        ? workspace("statusNeedBaseline")
                        : canCreatePolicy
                          ? workspace("statusDraftReady")
                          : workspace("statusNeedTask")}
                  </p>
                  <p className="mt-1 truncate text-[10px] text-slate-500">
                    {appliedPolicy ? `${appliedPolicy.name} · ${appliedPolicy.version}` : buildScheduleSummary(schedule, t)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <main className="grid min-h-0 flex-1 gap-3 overflow-y-auto xl:grid-cols-[minmax(0,1.62fr)_minmax(440px,1fr)] xl:overflow-hidden">
          <div className="min-h-0 space-y-3 xl:overflow-y-auto xl:pr-1">
            <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-slate-950">{workspace("scanPlanTitle")}</h2>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">{workspace("scanPlanDescription")}</p>
                </div>
              </div>

              <div className="p-5">
                <ScanScheduleForm
                  value={schedule}
                  onChange={handleScheduleChange}
                  title={null}
                  description={null}
                  text={scanScheduleFormText}
                  className="max-w-none border-0 bg-transparent shadow-none [&>div]:px-0"
                />
              </div>
            </section>

            <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-slate-950">{workspace("baselineOverview")}</h2>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">{workspace("baselineOverviewDescription")}</p>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <RiskMetric label={workspace("totalChecks")} value={selectedTemplate?.item_count ?? 0} tone="slate" />
                  <RiskMetric label={workspace("highRisk")} value={selectedTemplate?.high_count ?? 0} tone="rose" />
                  <RiskMetric label={workspace("mediumRisk")} value={selectedTemplate?.medium_count ?? 0} tone="amber" />
                  <RiskMetric label={workspace("lowRisk")} value={selectedTemplate?.low_count ?? 0} tone="emerald" />
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] text-slate-500">{workspace("summary")}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
                    <span className="font-semibold text-slate-900">{selectedTemplate?.display_name || selectedTemplate?.baseline_uuid || "-"}</span>
                    <span>· {buildScheduleSummary(effectiveSchedule, t)}</span>
                    <span>· {workspace("selectedHosts", { count: deduplicatedHosts.length })}</span>
                    <span>· {workspace("previewHint")}</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <section className="flex min-h-[520px] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm xl:min-h-0">
            <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-5 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Server className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-slate-950">{workspace("targetTitle")}</h2>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">{workspace("targetDescription")}</p>
              </div>
              <span className="ml-auto shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                {workspace("selectedHosts", { count: deduplicatedHosts.length })}
              </span>
            </div>

            <div className="flex min-h-0 flex-1 flex-col bg-slate-50/50 p-3">
              {hostsError ? (
                <Alert variant="destructive" className="mb-3 shrink-0">
                  <AlertTitle>{t("hostSelection.loadFailed")}</AlertTitle>
                  <AlertDescription>{hostsError}</AlertDescription>
                </Alert>
              ) : null}
              <HostSelector
                key={selectorVersion}
                data={hostTree}
                loading={hostsLoading}
                fillAvailableHeight
                showHeader={false}
                compactHostRows
                emptyText={t("hostSelection.empty")}
                text={{
                  title: t("hostSelection.selector.title"),
                  searchPlaceholder: t("hostSelection.selector.searchPlaceholder"),
                  selectAll: t("hostSelection.selector.selectAll"),
                  clear: t("hostSelection.selector.clear"),
                  searchResults: (term, count) => t("hostSelection.selector.searchResults", { term, count }),
                  clearSearch: t("hostSelection.selector.clearSearch"),
                  selectedSummary: (total, hostCount, groupCount, deptCount, companyCount) =>
                    t("hostSelection.selector.selectedSummary", { total, hostCount, groupCount, deptCount, companyCount }),
                }}
                onSelectionChange={handleSelectionChange}
              />
            </div>

            <div className="grid shrink-0 grid-cols-4 divide-x divide-slate-200 border-t border-slate-200 bg-white px-4 py-3">
              <TargetMetric label={workspace("targetTitle")} value={deduplicatedHosts.length} />
              <TargetMetric label={workspace("onlineHosts")} value={onlineHostCount} tone="emerald" />
              <TargetMetric label={workspace("offlineHosts")} value={offlineHostCount} tone="amber" />
              <TargetMetric label={workspace("invalidHosts")} value={invalidHostCount} tone={invalidHostCount > 0 ? "rose" : "slate"} />
            </div>
          </section>
        </main>

        <BaselinePolicySelectorDialog
          data={reusablePolicies}
          error={reusablePoliciesError}
          loading={reusablePoliciesLoading}
          open={policySelectorOpen}
          selectedKey={selectedReusablePolicyKey}
          onOpenChange={setPolicySelectorOpen}
          onPageChange={setReusablePoliciesPage}
          onRefresh={() => void loadReusablePolicies(reusablePoliciesPage)}
          onRowClick={handleReusablePolicyRowClick}
          onSelectionChange={handleReusablePolicySelectionChange}
          onSelect={handleUseSelectedPolicy}
        />

        <BaselineDispatchConfirmDialog
          data={previewData}
          open={confirmOpen}
          submitting={submitting}
          onOpenChange={setConfirmOpen}
          onConfirm={() => void handleConfirmDispatch()}
        />
      </div>
    </div>
  )
}

function FlowBadge({ number, title, done }: { number: number; title: string; done: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold", done ? "bg-slate-950 text-white" : "bg-slate-200 text-slate-500")}>
        {number}
      </span>
      <span className={cn("truncate text-[11px] font-semibold", done ? "text-slate-900" : "text-slate-500")}>{title}</span>
    </div>
  )
}

function RiskMetric({ label, value, tone }: { label: string; value: number; tone: "slate" | "rose" | "amber" | "emerald" }) {
  const styles = {
    slate: "border-slate-200 bg-slate-50 text-slate-950",
    rose: "border-rose-200 bg-rose-50 text-rose-600",
    amber: "border-amber-200 bg-amber-50 text-amber-600",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-600",
  }

  return (
    <div className={cn("rounded-xl border px-4 py-3", styles[tone])}>
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function TargetMetric({ label, value, tone = "slate" }: { label: string; value: number; tone?: "slate" | "rose" | "amber" | "emerald" }) {
  const valueClassName = {
    slate: "text-slate-950",
    rose: "text-rose-600",
    amber: "text-amber-600",
    emerald: "text-emerald-600",
  }[tone]

  return (
    <div className="text-center">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className={cn("mt-1 text-lg font-semibold tabular-nums", valueClassName)}>{value}</p>
    </div>
  )
}
