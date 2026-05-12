"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertCircle, LayoutGrid, Server, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { getAllBaselineTemplates, type BaselineTemplate } from "@/features/baseline/custom/api"
import SharedBaselineSelector, {
  type BaselineSelectorItem,
} from "@/shared/components/baseline-selector"
import DispatchPreview, {
  type DispatchGroup,
  type DispatchHost,
  type DispatchPreviewData,
  type DispatchValidation,
} from "@/shared/components/dispatch-preview"
import { DEFAULT_SCAN_SCHEDULE, type ScanSchedule } from "@/shared/components/scan-schedule"
import { getHostSelectorTree } from "@/shared/components/host-selector/api"
import { getAccessToken } from "@/shared/lib/http/auth"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"

import { BaselineSelectionStep } from "./baseline-selection-step"
import { DispatchStepper, type DispatchStepItem } from "./dispatch-stepper"
import { DispatchSubmitStep } from "./dispatch-submit-step"
import { DispatchSummaryCard } from "./dispatch-summary-card"
import { HostSelectionStep } from "./host-selection-step"
import { ScanScheduleStep } from "./scan-schedule-step"

const knownStandards = new Set(["cis", "dod", "msft", "tls", "intune", "custom"])
const knownProfiles = new Set(["machine", "user", "both"])

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
}

const BASELINE_SELECTOR_TEXT = {
  current: "当前",
  emptyPlaceholder: "暂无可选基线",
  hosts: (count: number) => `主机 ${count}`,
  checks: (count: number) => `检查项 ${count}`,
  lastChecked: "最近检查",
  noCheck: "暂无检查",
  noMatches: "没有匹配的基线",
  refresh: "刷新",
  searchPlaceholder: "搜索基线名称、标准、产品或配置画像",
  selectPlaceholder: "请选择基线",
  unknown: "未知",
}

function buildScheduleSummary(schedule: ScanSchedule) {
  const parts = [`每 ${schedule.interval_hours ?? 24} 小时执行一次`]

  if (schedule.specific_time) {
    parts.push(`固定时间 ${schedule.specific_time}`)
  }

  if ((schedule.random_delay_minutes ?? 0) > 0) {
    parts.push(`随机延迟 ${schedule.random_delay_minutes} 分钟`)
  }

  if ((schedule.retry_limit ?? 0) > 0) {
    parts.push(
      `失败重试 ${schedule.retry_limit} 次，间隔 ${schedule.retry_interval_minutes ?? 5} 分钟`,
    )
  } else {
    parts.push("失败不重试")
  }

  if (schedule.scan_on_startup) {
    parts.push("Agent 启动时执行一次")
  }

  return parts.join("，")
}

function createPolicyId() {
  return `baseline-policy-${Date.now()}`
}

function getSelectionMode(groupCount: number, hostCount: number) {
  if (groupCount > 0 && hostCount > 0) return "mixed" as const
  if (groupCount > 0) return "group" as const
  return "host" as const
}

export function BaselineDispatchClient() {
  const [currentStep, setCurrentStep] = useState(1)

  const [templates, setTemplates] = useState<BaselineTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [templatesError, setTemplatesError] = useState("")
  const [selectedTemplateUuid, setSelectedTemplateUuid] = useState("")

  const [policyName, setPolicyName] = useState("")
  const [version, setVersion] = useState("1.0.0")
  const [schedule, setSchedule] = useState<ScanSchedule>(DEFAULT_SCAN_SCHEDULE)
  const [createdPolicy, setCreatedPolicy] = useState<CreatedPolicy | null>(null)
  const [creatingPolicy, setCreatingPolicy] = useState(false)

  const [hostTree, setHostTree] = useState<HostTreeNode[]>([])
  const [hostsLoading, setHostsLoading] = useState(true)
  const [hostsError, setHostsError] = useState("")
  const [selectorVersion, setSelectorVersion] = useState(0)
  const [selectedNodes, setSelectedNodes] = useState<HostTreeNode[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [previewOpen, setPreviewOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true)
    setTemplatesError("")

    if (!getAccessToken()) {
      setTemplates([])
      setTemplatesError("缺少登录态，无法加载基线列表。")
      setTemplatesLoading(false)
      return
    }

    try {
      const data = await getAllBaselineTemplates()
      setTemplates(data)
    } catch (error) {
      setTemplates([])
      setTemplatesError(error instanceof Error ? error.message : "加载基线列表失败。")
    } finally {
      setTemplatesLoading(false)
    }
  }, [])

  const loadHosts = useCallback(async () => {
    setHostsLoading(true)
    setHostsError("")

    if (!getAccessToken()) {
      setHostTree([])
      setHostsError("缺少登录态，无法加载主机树。")
      setHostsLoading(false)
      return
    }

    try {
      const data = await getHostSelectorTree()
      setHostTree(data as HostTreeNode[])
    } catch (error) {
      setHostTree([])
      setHostsError(error instanceof Error ? error.message : "加载主机树失败。")
    } finally {
      setHostsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTemplates()
    void loadHosts()
  }, [loadHosts, loadTemplates])

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

  const baselineItems = useMemo<BaselineSelectorItem[]>(() => {
    return templates.map((template) => {
      const standardKey = template.standard.toLowerCase()
      const profileKey = template.profile.toLowerCase()

      return {
        id: template.uuid,
        title: template.display_name || template.baseline_uuid,
        standardKey: knownStandards.has(standardKey) ? standardKey : "other",
        standardLabel: template.standard ? template.standard.toUpperCase() : "UNKNOWN",
        productLabel: template.product || "未知产品",
        profileLabel:
          knownProfiles.has(profileKey) ? template.profile : template.profile || "未知画像",
        osVersionLabel: template.os_version || template.baseline_version || undefined,
        lastCheckTime: template.latest_check_time || undefined,
        hostCount: template.host_count,
        itemCount: template.item_count,
        highCount: template.high_count,
        mediumCount: template.medium_count,
        lowCount: template.low_count,
      }
    })
  }, [templates])

  const selectedTemplate = useMemo(() => {
    return templates.find((item) => item.uuid === selectedTemplateUuid) ?? null
  }, [selectedTemplateUuid, templates])

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
        (groupId === "__ungrouped__" ? "未分组" : "逻辑组")

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
  }, [deduplicatedHosts, selectedNodeLookup])

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

  const canEnterStep2 = Boolean(
    policyName.trim() && version.trim() && selectedTemplateUuid,
  )
  const canEnterStep3 = canEnterStep2 && Boolean(createdPolicy)
  const canEnterStep4 = canEnterStep3 && deduplicatedHosts.length > 0

  const previewValidations = useMemo<DispatchValidation[]>(() => {
    const validations: DispatchValidation[] = []

    if (offlineHostCount > 0) {
      validations.push({
        level: "warning",
        code: "OFFLINE_HOSTS",
        message: `当前选择中包含 ${offlineHostCount} 台离线主机。`,
        suggestion: "离线主机可能暂时无法及时收到策略，请确认是否继续下发。",
      })
    }

    if (invalidHostCount > 0) {
      validations.push({
        level: "error",
        code: "INVALID_HOSTS",
        message: `当前选择中包含 ${invalidHostCount} 台不可下发主机。`,
        suggestion: "请先从选择范围中移除不可下发主机，再执行任务下发。",
      })
    }

    if (!createdPolicy) {
      validations.push({
        level: "error",
        code: "POLICY_NOT_CREATED",
        message: "尚未创建基线扫描策略对象。",
        suggestion: "请回到“任务计划”步骤，先创建策略对象。",
      })
    }

    if (deduplicatedHosts.length === 0) {
      validations.push({
        level: "error",
        code: "EMPTY_TARGETS",
        message: "当前没有可下发的目标主机。",
        suggestion: "请至少选择一台主机，或选择包含主机的逻辑组。",
      })
    }

    return validations
  }, [createdPolicy, deduplicatedHosts.length, invalidHostCount, offlineHostCount])

  const previewData = useMemo<DispatchPreviewData | undefined>(() => {
    if (!selectedTemplate) return undefined

    return {
      object: {
        type: "baseline",
        id: createdPolicy?.id,
        name: createdPolicy?.name || policyName || "未命名策略",
        version: version || undefined,
        sourceType:
          selectedTemplate.baseline_type?.toLowerCase() === "custom" ? "custom" : "template",
        mode: "create",
        description: `目标基线：${selectedTemplate.display_name || selectedTemplate.baseline_uuid}`,
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
        summary: buildScheduleSummary(schedule),
        executeAt: schedule.specific_time ? `每日 ${schedule.specific_time}` : undefined,
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
            ? "存在不可下发主机。"
            : !createdPolicy
              ? "请先创建策略对象。"
              : deduplicatedHosts.length === 0
                ? "请先选择目标主机。"
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
    schedule,
    selectedGroups.length,
    selectedHosts.length,
    selectedTemplate,
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
        title: "基线选择",
        description: "选择目标基线并填写策略基础信息",
        status: statuses[0],
      },
      {
        key: 2,
        title: "任务计划",
        description: "配置扫描周期并创建策略对象",
        status: statuses[1],
        disabled: !canEnterStep2,
      },
      {
        key: 3,
        title: "主机选择",
        description: "选择本次基线下发范围",
        status: statuses[2],
        disabled: !canEnterStep3,
      },
      {
        key: 4,
        title: "任务下发",
        description: "预览并确认下发",
        status: statuses[3],
        disabled: !canEnterStep4,
      },
    ]
  }, [canEnterStep2, canEnterStep3, canEnterStep4, currentStep])

  const currentStepLabel = useMemo(() => {
    return stepItems.find((item) => item.key === currentStep)?.title || "基线选择"
  }, [currentStep, stepItems])

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
    setCurrentStep(1)
  }, [])

  const handleScheduleChange = useCallback((value: ScanSchedule) => {
    setSchedule(value)
  }, [])

  const handleSelectionChange = useCallback((nodes: HostTreeNode[], ids: Set<string>) => {
    setSelectedNodes(nodes)
    setSelectedIds(new Set(ids))
  }, [])

  const handleCreatePolicy = useCallback(async () => {
    if (!selectedTemplate || !canEnterStep2) return

    setCreatingPolicy(true)

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 500))

      const nextPolicy = {
        id: createPolicyId(),
        name: policyName.trim(),
        version: version.trim(),
        baselineUuid: selectedTemplate.uuid,
        baselineName: selectedTemplate.display_name || selectedTemplate.baseline_uuid,
      }

      setCreatedPolicy(nextPolicy)
      setCurrentStep(3)
      toast.success("策略对象已创建，可以继续选择主机。")
    } finally {
      setCreatingPolicy(false)
    }
  }, [canEnterStep2, policyName, selectedTemplate, version])

  const handleOpenPreview = useCallback(() => {
    if (!previewData) return
    setPreviewOpen(true)
  }, [previewData])

  const handleConfirmDispatch = useCallback(async () => {
    if (!previewData?.permissions?.canSubmit) return

    setSubmitting(true)

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 800))
      setPreviewOpen(false)
      toast.success("基线下发已提交。")
    } finally {
      setSubmitting(false)
    }
  }, [previewData?.permissions?.canSubmit])

  const resetAll = useCallback(() => {
    setCurrentStep(1)
    setPolicyName("")
    setVersion("1.0.0")
    setSchedule(DEFAULT_SCAN_SCHEDULE)
    setCreatedPolicy(null)
    setSelectedNodes([])
    setSelectedIds(new Set())
    setSelectorVersion((value) => value + 1)
  }, [])

  const renderCurrentStep = () => {
    const selector = (
      <SharedBaselineSelector
        items={baselineItems}
        value={selectedTemplateUuid}
        onValueChange={handleTemplateChange}
        onRefresh={() => void loadTemplates()}
        isRefreshing={templatesLoading}
        className="w-full"
        text={BASELINE_SELECTOR_TEXT}
      />
    )

    if (currentStep === 1) {
      return (
        <BaselineSelectionStep
          policyName={policyName}
          version={version}
          selector={selector}
          canNext={canEnterStep2}
          onNameChange={setPolicyName}
          onVersionChange={setVersion}
          onNext={() => setCurrentStep(2)}
        />
      )
    }

    if (currentStep === 2) {
      return (
        <ScanScheduleStep
          schedule={schedule}
          creating={creatingPolicy}
          canCreatePolicy={canEnterStep2}
          onScheduleChange={handleScheduleChange}
          onBack={() => setCurrentStep(1)}
          onCreatePolicy={() => void handleCreatePolicy()}
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
        policyName={createdPolicy?.name || policyName}
        hasPolicy={Boolean(createdPolicy)}
        selectedHostCount={deduplicatedHosts.length}
        offlineHostCount={offlineHostCount}
        invalidHostCount={invalidHostCount}
        canPreview={Boolean(previewData?.permissions?.canSubmit)}
        onBack={() => setCurrentStep(3)}
        onPreview={handleOpenPreview}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_24%),linear-gradient(180deg,#f8fbff_0%,#eef3f8_100%)]">
      <div className="space-y-6 p-6">
        <section className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-slate-950 to-slate-700 p-3 shadow-lg shadow-slate-300/60">
                <ShieldCheck className="h-7 w-7 text-white" />
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                    基线下发
                  </h1>
                  <Badge variant="outline" className="rounded-full bg-white px-3">
                    四步流程
                  </Badge>
                </div>

                <p className="max-w-3xl text-sm leading-6 text-slate-600">
                  页面按“获取基线 → 创建基线扫描策略 → 选择主机 → 下发预览确认”的顺序组织。
                  右侧摘要固定展示，左侧根据当前步骤切换内容。
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge className="rounded-full bg-slate-950 px-3 text-white">
                    基线 {templates.length}
                  </Badge>
                  <Badge variant="secondary" className="rounded-full px-3">
                    已选主机 {deduplicatedHosts.length}
                  </Badge>
                  <Badge variant="secondary" className="rounded-full px-3">
                    已选节点 {selectedIds.size}
                  </Badge>
                  <Badge variant="secondary" className="rounded-full px-3">
                    当前步骤 {currentStep}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
              <div className="rounded-2xl border bg-slate-50/80 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <LayoutGrid className="h-4 w-4" />
                  当前基线
                </div>
                <div className="mt-2 truncate text-2xl font-semibold text-slate-950">
                  {selectedTemplate?.display_name || "--"}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {selectedTemplate
                    ? `${selectedTemplate.item_count} 条检查项`
                    : "尚未选择基线"}
                </div>
              </div>

              <div className="rounded-2xl border bg-slate-50/80 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Server className="h-4 w-4" />
                  策略对象
                </div>
                <div className="mt-2 truncate text-2xl font-semibold text-slate-950">
                  {createdPolicy?.name || "--"}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {createdPolicy ? `版本 ${createdPolicy.version}` : "尚未创建"}
                </div>
              </div>
            </div>
          </div>
        </section>

        {(templatesError || hostsError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>数据加载失败</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{templatesError || hostsError}</span>
              {!getAccessToken() ? (
                <Button asChild size="sm" variant="outline" className="shrink-0">
                  <Link href="/login">前往登录</Link>
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

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            {renderCurrentStep()}

            <div className="flex justify-end">
              <Button variant="outline" onClick={resetAll}>
                重置当前流程
              </Button>
            </div>
          </div>

          <DispatchSummaryCard
            currentStep={currentStep}
            stepLabel={currentStepLabel}
            policyName={policyName}
            version={version}
            selectedBaselineName={
              selectedTemplate?.display_name || selectedTemplate?.baseline_uuid
            }
            scheduleSummary={buildScheduleSummary(schedule)}
            selectedHostCount={deduplicatedHosts.length}
            offlineHostCount={offlineHostCount}
            invalidHostCount={invalidHostCount}
            createdPolicyName={createdPolicy?.name}
          />
        </div>
      </div>

      <DispatchPreview
        open={previewOpen}
        data={previewData}
        title="下发预览"
        subtitle="请在提交前确认策略对象、目标主机范围与执行计划。"
        confirmText="确认下发"
        submitting={submitting}
        onClose={() => setPreviewOpen(false)}
        onBack={() => setPreviewOpen(false)}
        onConfirm={() => void handleConfirmDispatch()}
        dangerConfirmRequired={offlineHostCount > 0}
      />
    </div>
  )
}
