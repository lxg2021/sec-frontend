"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  ArrowRight,
  Clock3,
  LayoutGrid,
  Server,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import { getAllBaselineTemplates, type BaselineTemplate } from "@/features/baseline/custom/api"
import SharedBaselineSelector, {
  type BaselineSelectorItem,
} from "@/shared/components/baseline-selector"
import DispatchPreview, {
  type DispatchPreviewData,
} from "@/shared/components/dispatch-preview"
import HostSelector from "@/shared/components/host-selector"
import { getHostSelectorTree } from "@/shared/components/host-selector/api"
import { ScanScheduleForm, type ScanSchedule } from "@/shared/components/scan-schedule"
import { getAccessToken } from "@/shared/lib/http/auth"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Toaster } from "@/shared/ui/toaster"

const DEFAULT_SCHEDULE: ScanSchedule = {
  mode: "interval",
  interval_hours: 24,
  random_delay_minutes: 0,
  retry_limit: 3,
  retry_interval_minutes: 5,
  scan_on_startup: false,
}

const knownStandards = new Set(["cis", "dod", "msft", "tls", "intune", "custom"])
const knownProfiles = new Set(["machine", "user", "both"])

interface PreviewHostItem {
  agentId: string
  hostname: string
  ip?: string
  status?: string
  valid?: boolean
  invalidReason?: string
}

interface PreviewGroupBucket {
  id: string
  name: string
  hostCount: number
  hosts: PreviewHostItem[]
}

function buildScheduleSummary(schedule: ScanSchedule) {
  const parts = [`每 ${schedule.interval_hours ?? 24} 小时执行一次`]

  if (schedule.random_delay_minutes && schedule.random_delay_minutes > 0) {
    parts.push(`随机延迟 ${schedule.random_delay_minutes} 分钟`)
  }

  if ((schedule.retry_limit ?? 0) > 0) {
    parts.push(`失败重试 ${schedule.retry_limit} 次`)
  }

  if (schedule.scan_on_startup) {
    parts.push("启动时自动执行")
  }

  return parts.join("，")
}

export function BaselineDispatchClient() {
  const [templates, setTemplates] = useState<BaselineTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [templatesError, setTemplatesError] = useState("")
  const [selectedTemplateUuid, setSelectedTemplateUuid] = useState("")

  const [hostTree, setHostTree] = useState<any[]>([])
  const [hostsLoading, setHostsLoading] = useState(true)
  const [hostsError, setHostsError] = useState("")
  const [selectorVersion, setSelectorVersion] = useState(0)
  const [selectedNodes, setSelectedNodes] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [schedule, setSchedule] = useState<ScanSchedule>(DEFAULT_SCHEDULE)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true)
    setTemplatesError("")

    if (!getAccessToken()) {
      setTemplatesError("Authorization header is required.")
      setTemplates([])
      setTemplatesLoading(false)
      return
    }

    try {
      const data = await getAllBaselineTemplates()
      setTemplates(data)
    } catch (error) {
      setTemplatesError(
        error instanceof Error ? error.message : "Failed to load baseline templates.",
      )
      setTemplates([])
    } finally {
      setTemplatesLoading(false)
    }
  }, [])

  const loadHosts = useCallback(async () => {
    setHostsLoading(true)
    setHostsError("")

    if (!getAccessToken()) {
      setHostsError("Authorization header is required.")
      setHostTree([])
      setHostsLoading(false)
      return
    }

    try {
      const data = await getHostSelectorTree()
      setHostTree(data)
    } catch (error) {
      setHostsError(error instanceof Error ? error.message : "Failed to load host tree.")
      setHostTree([])
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
      !templates.some((template) => template.uuid === selectedTemplateUuid)
    ) {
      setSelectedTemplateUuid(templates[0]?.uuid ?? "")
    }
  }, [selectedTemplateUuid, templates])

  const baselineSelectorItems = useMemo<BaselineSelectorItem[]>(() => {
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
    return (
      templates.find((template) => template.uuid === selectedTemplateUuid) ??
      templates[0] ??
      null
    )
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

  const hostBuckets = useMemo(() => {
    const buckets = new Map<string, PreviewGroupBucket>()

    for (const host of selectedHosts) {
      const groupId = host.parentId || "__ungrouped__"
      const groupName =
        selectedNodeLookup.get(groupId)?.name ||
        (groupId === "__ungrouped__" ? "未分组" : "逻辑组")

      const current =
        buckets.get(groupId) || {
          id: groupId,
          name: groupName,
          hostCount: 0,
          hosts: [] as PreviewHostItem[],
        }

      current.hostCount += 1
      current.hosts.push({
        agentId: host.hostId || host.agentId || host.id,
        hostname: host.hostname || host.name || host.hostId || host.id,
        ip: host.ip || undefined,
        status: host.status,
        valid: host.valid,
        invalidReason: host.invalidReason,
      })

      buckets.set(groupId, current)
    }

    return Array.from(buckets.values())
  }, [selectedHosts, selectedNodeLookup])

  const offlineHostCount = useMemo(() => {
    return selectedHosts.filter((host) =>
      String(host.status || "").toLowerCase().includes("offline"),
    ).length
  }, [selectedHosts])

  const invalidHostCount = useMemo(() => {
    return selectedHosts.filter((host) => host.valid === false).length
  }, [selectedHosts])

  const ungroupedHostCount = useMemo(() => {
    return selectedHosts.filter(
      (host) => host.parentId === "__ungrouped__" || !host.parentId,
    ).length
  }, [selectedHosts])

  const previewData = useMemo<DispatchPreviewData | undefined>(() => {
    if (!selectedTemplate || selectedHosts.length === 0) return undefined

    const groupCount = new Set(
      selectedHosts.map((host) => host.parentId || "__ungrouped__"),
    ).size

    return {
      object: {
        type: "baseline",
        name: selectedTemplate.display_name,
        description:
          selectedTemplate.description ||
          `${selectedTemplate.standard} ${selectedTemplate.product} ${selectedTemplate.os_version}`,
        id: selectedTemplate.baseline_uuid,
        version:
          selectedTemplate.baseline_version || selectedTemplate.os_version || undefined,
        sourceType: "template",
        mode: "create",
      },
      target: {
        selectionMode:
          selectedGroups.length > 0 && selectedHosts.length > 0
            ? "mixed"
            : selectedGroups.length > 0
              ? "group"
              : "host",
        groupCount,
        hostCount: selectedHosts.length,
        deduplicatedHostCount: selectedHosts.length,
        ungroupedHostCount,
        offlineHostCount,
        invalidHostCount,
        boundHostCount: selectedHosts.length,
        groups: hostBuckets,
      },
      schedule: {
        mode: "scheduled",
        summary: buildScheduleSummary(schedule),
        executeAt: schedule.specific_time || undefined,
        timezone: "Asia/Shanghai",
      },
      validations: [
        ...(invalidHostCount > 0
          ? [
              {
                level: "error" as const,
                code: "invalid-hosts",
                message: `${invalidHostCount} 台主机未满足下发条件。`,
                suggestion: "请先完成 Agent 安装、连通性或前置配置检查。",
              },
            ]
          : []),
        ...(offlineHostCount > 0
          ? [
              {
                level: "warning" as const,
                code: "offline-hosts",
                message: `${offlineHostCount} 台主机当前离线，可能无法立即接收任务。`,
                suggestion: "可先保留策略，待主机恢复在线后再执行。",
              },
            ]
          : []),
        ...(selectedHosts.length >= 100
          ? [
              {
                level: "warning" as const,
                code: "large-scope",
                message: "本次下发范围较大，建议先在小范围验证后再批量执行。",
              },
            ]
          : []),
      ],
      permissions: {
        canSubmit:
          Boolean(selectedTemplate) &&
          selectedHosts.length > 0 &&
          !templatesLoading &&
          !hostsLoading &&
          !templatesError &&
          !hostsError,
        reason:
          !selectedTemplate
            ? "请选择一个基线。"
            : selectedHosts.length === 0
              ? "请选择目标主机。"
              : templatesError || hostsError || "",
      },
    }
  }, [
    hostBuckets,
    hostsError,
    hostsLoading,
    invalidHostCount,
    offlineHostCount,
    schedule,
    selectedGroups.length,
    selectedHosts,
    selectedTemplate,
    templatesError,
    templatesLoading,
    ungroupedHostCount,
  ])

  const selectionReady = Boolean(
    selectedTemplate &&
      selectedHosts.length > 0 &&
      !templatesError &&
      !hostsError,
  )

  const handleHostSelectionChange = useCallback(
    (nodes: any[], ids: Set<string>) => {
      setSelectedNodes(nodes)
      setSelectedIds(new Set(ids))
    },
    [],
  )

  const resetAll = useCallback(() => {
    setSchedule(DEFAULT_SCHEDULE)
    setSelectedNodes([])
    setSelectedIds(new Set())
    setSelectedTemplateUuid(templates[0]?.uuid ?? "")
    setSelectorVersion((value) => value + 1)
  }, [templates])

  const handlePreviewConfirm = useCallback(() => {
    setSubmitting(true)

    window.setTimeout(() => {
      setSubmitting(false)
      setPreviewOpen(false)
      toast.success("基线下发预览已确认")
    }, 1200)
  }, [])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_25%),linear-gradient(180deg,#f8fbff_0%,#eef3f8_100%)]">
      <div className="space-y-6 p-6">
        <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur">
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
                  <Badge
                    variant="outline"
                    className="rounded-full border-slate-200 bg-white px-3"
                  >
                    draft flow
                  </Badge>
                </div>

                <p className="max-w-3xl text-sm leading-6 text-slate-600">
                  先选择基线，再配置扫描计划，最后选择主机并进入下发预览。
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge className="rounded-full bg-slate-950 px-3 text-white">
                    基线 {templates.length}
                  </Badge>
                  <Badge variant="secondary" className="rounded-full px-3">
                    主机 {selectedHosts.length}
                  </Badge>
                  <Badge variant="secondary" className="rounded-full px-3">
                    节点 {selectedIds.size}
                  </Badge>
                  <Badge variant="secondary" className="rounded-full px-3">
                    计划 {buildScheduleSummary(schedule)}
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
                  {selectedTemplate ? selectedTemplate.display_name : "--"}
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
                  目标状态
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">
                  {selectedHosts.length.toLocaleString()}
                </div>
                <div className="mt-1 text-sm text-slate-500">已选主机</div>
              </div>
            </div>
          </div>
        </div>

        {(templatesError || hostsError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>数据加载失败</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{templatesError || hostsError}</span>
              <Button asChild size="sm" variant="outline" className="shrink-0">
                <Link href="/login">前往登录</Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          <Card className="overflow-hidden border-slate-200/80 shadow-lg">
            <div className="h-1 bg-gradient-to-r from-slate-950 via-blue-600 to-cyan-400" />
            <CardHeader className="border-b bg-gradient-to-b from-white to-slate-50/60">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                  <LayoutGrid className="h-4 w-4" />
                </div>
                基线选择
              </CardTitle>
              <CardDescription>展示方式和 /frame/baseline 保持一致。</CardDescription>
            </CardHeader>

            <CardContent className="p-4">
              <SharedBaselineSelector
                items={baselineSelectorItems}
                value={selectedTemplateUuid}
                onValueChange={setSelectedTemplateUuid}
                onRefresh={() => void loadTemplates()}
                isRefreshing={templatesLoading}
                className="w-full"
                text={{
                  current: "当前",
                  emptyPlaceholder: "暂无可选基线",
                  hosts: (count) => `主机 ${count}`,
                  checks: (count) => `检查项 ${count}`,
                  lastChecked: "最近检查",
                  noCheck: "暂无检查",
                  noMatches: "没有匹配的基线",
                  refresh: "刷新",
                  searchPlaceholder: "搜索基线名称、标准、产品或画像",
                  selectPlaceholder: "请选择基线",
                  unknown: "未知",
                }}
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-slate-200/80 shadow-lg">
            <div className="h-1 bg-gradient-to-r from-slate-950 via-slate-700 to-blue-500" />
            <CardHeader className="border-b bg-gradient-to-b from-white to-slate-50/60">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <div className="rounded-xl bg-slate-950 p-2 text-white">
                  <Clock3 className="h-4 w-4" />
                </div>
                扫描计划
              </CardTitle>
              <CardDescription>当前 proto 只支持 interval 模式。</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <ScanScheduleForm
                value={schedule}
                onChange={setSchedule}
                title="调度计划配置"
                description="设置策略执行的周期、随机延迟和重试方式。"
                className="max-w-none border-slate-200 shadow-none"
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-slate-200/80 shadow-lg">
            <div className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-slate-950" />
            <CardContent className="p-4">
              <HostSelector
                key={selectorVersion}
                data={hostTree}
                loading={hostsLoading}
                emptyText="未获取到主机树数据。"
                onSelectionChange={handleHostSelectionChange}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {(invalidHostCount > 0 || offlineHostCount > 0) && (
            <Alert className="min-w-[320px] flex-1">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>当前范围包含风险主机</AlertTitle>
              <AlertDescription>
                离线主机 {offlineHostCount} 台，不可下发主机 {invalidHostCount} 台。
              </AlertDescription>
            </Alert>
          )}

          <Button variant="outline" className="h-11 gap-2" onClick={resetAll}>
            重置
          </Button>

          <Button
            className="h-11 gap-2 bg-slate-950 text-white hover:bg-slate-800"
            disabled={!selectionReady}
            onClick={() => setPreviewOpen(true)}
          >
            <ArrowRight className="h-4 w-4" />
            下发预览
          </Button>
        </div>
      </div>

      <DispatchPreview
        open={previewOpen}
        data={previewData}
        submitting={submitting}
        onClose={() => setPreviewOpen(false)}
        onBack={() => setPreviewOpen(false)}
        onConfirm={handlePreviewConfirm}
        confirmText="确认下发"
        dangerConfirmRequired
      />

      <Toaster />
    </div>
  )
}
