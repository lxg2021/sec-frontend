"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  ArrowRight,
  Clock3,
  Layers3,
  LayoutGrid,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

import { getAllBaselineTemplates, type BaselineTemplate } from "@/features/baseline/custom/api"
import DispatchPreview, {
  type DispatchPreviewData,
} from "@/shared/components/dispatch-preview"
import HostSelector from "@/shared/components/host-selector"
import { getHostSelectorTree } from "@/shared/components/host-selector/api"
import { ScanScheduleForm, type ScanSchedule } from "@/shared/components/scan-schedule"
import { getAccessToken } from "@/shared/lib/http/auth"
import { cn } from "@/shared/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Skeleton } from "@/shared/ui/skeleton"
import { Toaster } from "@/shared/ui/toaster"

const DEFAULT_SCHEDULE: ScanSchedule = {
  mode: "interval",
  interval_hours: 24,
  random_delay_minutes: 0,
  retry_limit: 3,
  retry_interval_minutes: 5,
  scan_on_startup: false,
}

function normalizeText(value: string) {
  return value.trim().toLowerCase()
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

export function BaselineDispatchClient() {
  const [templates, setTemplates] = useState<BaselineTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [templatesError, setTemplatesError] = useState("")
  const [templateSearch, setTemplateSearch] = useState("")
  const [standardFilter, setStandardFilter] = useState("all")
  const [profileFilter, setProfileFilter] = useState("all")
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

    if (selectedTemplateUuid && !templates.some((template) => template.uuid === selectedTemplateUuid)) {
      setSelectedTemplateUuid(templates[0]?.uuid ?? "")
    }
  }, [selectedTemplateUuid, templates])

  const filteredTemplates = useMemo(() => {
    const search = normalizeText(templateSearch)

    return templates.filter((template) => {
      const matchesSearch =
        !search ||
        normalizeText(template.display_name).includes(search) ||
        normalizeText(template.description).includes(search) ||
        normalizeText(template.standard).includes(search) ||
        normalizeText(template.product).includes(search) ||
        normalizeText(template.os_version).includes(search)

      const matchesStandard = standardFilter === "all" || template.standard === standardFilter
      const matchesProfile = profileFilter === "all" || template.profile === profileFilter

      return matchesSearch && matchesStandard && matchesProfile
    })
  }, [profileFilter, standardFilter, templateSearch, templates])

  const selectedTemplate = useMemo(() => {
    return templates.find((template) => template.uuid === selectedTemplateUuid) ?? templates[0] ?? null
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

  const selectedTemplateSummary = useMemo(() => {
    if (!selectedTemplate) return []

    return [
      { label: "条目数", value: `${selectedTemplate.item_count}` },
      { label: "适用产品", value: selectedTemplate.product || "--" },
      { label: "标准", value: selectedTemplate.standard || "--" },
      { label: "画像", value: selectedTemplate.profile || "--" },
    ]
  }, [selectedTemplate])

  const offlineHostCount = useMemo(() => {
    return selectedHosts.filter((host) =>
      String(host.status || "").toLowerCase().includes("offline"),
    ).length
  }, [selectedHosts])

  const invalidHostCount = useMemo(() => {
    return selectedHosts.filter((host) => host.valid === false).length
  }, [selectedHosts])

  const ungroupedHostCount = useMemo(() => {
    return selectedHosts.filter((host) => host.parentId === "__ungrouped__" || !host.parentId).length
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
        version: selectedTemplate.baseline_version || selectedTemplate.os_version,
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
                suggestion: "请先完成 Agent 安装、网络连通性或前置配置检查。",
              },
            ]
          : []),
        ...(offlineHostCount > 0
          ? [
              {
                level: "warning" as const,
                code: "offline-hosts",
                message: `${offlineHostCount} 台主机当前离线，可能无法立即接收下发任务。`,
                suggestion: "可先保留计划，待主机恢复在线后再执行。",
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
            ? "请选择一个基线模板。"
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
    setTemplateSearch("")
    setStandardFilter("all")
    setProfileFilter("all")
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
                  <Badge variant="outline" className="rounded-full border-slate-200 bg-white px-3">
                    draft flow
                  </Badge>
                </div>
                <p className="max-w-3xl text-sm leading-6 text-slate-600">
                  选择基线模板、目标主机和执行计划后，再进入统一的下发预览确认。
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge className="rounded-full bg-slate-950 px-3 text-white">
                    模板 {templates.length}
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
                  模板状态
                </div>
                <div className="mt-2 truncate text-2xl font-semibold text-slate-950">
                  {selectedTemplate ? selectedTemplate.display_name : "--"}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {selectedTemplate ? `${selectedTemplate.item_count} 条规则` : "尚未选择模板"}
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
                <div className="mt-1 text-sm text-slate-500">
                  已选主机
                </div>
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

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-6">
            <Card className="overflow-hidden border-slate-200/80 shadow-lg">
              <div className="h-1 bg-gradient-to-r from-slate-950 via-blue-600 to-cyan-400" />
              <CardHeader className="border-b bg-gradient-to-b from-white to-slate-50/60">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                      <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                        <LayoutGrid className="h-4 w-4" />
                      </div>
                      基线模板
                    </CardTitle>
                    <CardDescription className="mt-1">
                      选择一个模板作为本次下发对象。
                    </CardDescription>
                  </div>

                  <Button variant="outline" size="sm" onClick={() => void loadTemplates()} disabled={templatesLoading}>
                    <RefreshCw className={cn("mr-2 h-4 w-4", templatesLoading && "animate-spin")} />
                    刷新模板
                  </Button>
                </div>

                <div className="grid gap-3 pt-4 md:grid-cols-[minmax(0,1fr)_180px_180px]">
                  <Input
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    placeholder="搜索模板名称、描述、标准、产品或版本"
                    className="h-11 rounded-xl border-slate-200 bg-white/90 shadow-sm"
                  />
                  <Select value={standardFilter} onValueChange={setStandardFilter}>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white/90 shadow-sm">
                      <SelectValue placeholder="标准" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部标准</SelectItem>
                      {Array.from(new Set(templates.map((template) => template.standard).filter(Boolean))).map((standard) => (
                        <SelectItem key={standard} value={standard}>
                          {standard}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={profileFilter} onValueChange={setProfileFilter}>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white/90 shadow-sm">
                      <SelectValue placeholder="画像" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部画像</SelectItem>
                      {Array.from(new Set(templates.map((template) => template.profile).filter(Boolean))).map((profile) => (
                        <SelectItem key={profile} value={profile}>
                          {profile}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 p-4">
                {templatesLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Skeleton key={index} className="h-28 rounded-2xl" />
                    ))}
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="rounded-2xl border border-dashed bg-slate-50 px-6 py-12 text-center">
                    <Layers3 className="mx-auto h-12 w-12 text-slate-300" />
                    <p className="mt-3 text-sm font-medium text-slate-900">没有匹配的基线模板</p>
                    <p className="mt-1 text-xs text-slate-500">调整搜索条件后重试。</p>
                  </div>
                ) : (
                  <div className="max-h-[540px] space-y-3 overflow-y-auto pr-1">
                    {filteredTemplates.map((template) => {
                      const active = selectedTemplateUuid === template.uuid

                      return (
                        <button
                          key={template.uuid}
                          type="button"
                          onClick={() => setSelectedTemplateUuid(template.uuid)}
                          className={cn(
                            "w-full rounded-2xl border p-4 text-left transition-all duration-200",
                            active
                              ? "border-blue-300 bg-blue-50/80 shadow-sm ring-1 ring-blue-100"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm",
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="truncate text-sm font-semibold text-slate-950">
                                  {template.display_name}
                                </span>
                                {active && (
                                  <Badge className="rounded-full bg-blue-600 px-2 text-[11px] text-white">
                                    当前选择
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                                {template.description || `${template.standard} · ${template.product} · ${template.os_version}`}
                              </p>
                            </div>
                            <Badge variant="outline" className="shrink-0 rounded-full border-slate-200 bg-white px-2 text-xs text-slate-700">
                              {template.item_count} 条
                            </Badge>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge variant="secondary" className="rounded-full bg-slate-100 px-2 text-xs text-slate-700">
                              标准: {template.standard || "--"}
                            </Badge>
                            <Badge variant="secondary" className="rounded-full bg-slate-100 px-2 text-xs text-slate-700">
                              画像: {template.profile || "--"}
                            </Badge>
                            <Badge variant="secondary" className="rounded-full bg-slate-100 px-2 text-xs text-slate-700">
                              版本: {template.baseline_version || template.os_version || "--"}
                            </Badge>
                            <Badge variant="secondary" className="rounded-full bg-slate-100 px-2 text-xs text-slate-700">
                              主机: {template.host_count || 0}
                            </Badge>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-slate-200/80 shadow-lg">
              <div className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-slate-950" />
              <CardHeader className="border-b bg-gradient-to-b from-white to-slate-50/60">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                    <Server className="h-4 w-4" />
                  </div>
                  目标主机
                </CardTitle>
                <CardDescription>
                  从逻辑组或主机树中选择本次基线下发范围。
                </CardDescription>
              </CardHeader>
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

            <Card className="overflow-hidden border-slate-200/80 shadow-lg">
              <div className="h-1 bg-gradient-to-r from-slate-950 via-slate-700 to-blue-500" />
              <CardHeader className="border-b bg-gradient-to-b from-white to-slate-50/60">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <div className="rounded-xl bg-slate-950 p-2 text-white">
                    <Clock3 className="h-4 w-4" />
                  </div>
                  执行计划
                </CardTitle>
                <CardDescription>
                  配置本次基线检查的执行节奏与重试策略。
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <ScanScheduleForm
                  value={schedule}
                  onChange={setSchedule}
                  title="调度计划配置"
                  description="设置基线下发后主机的检查节奏与执行策略。"
                  className="max-w-none border-slate-200 shadow-none"
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <Card className="overflow-hidden border-slate-200/80 shadow-lg">
              <div className="h-1 bg-gradient-to-r from-slate-950 via-blue-600 to-cyan-400" />
              <CardHeader className="border-b bg-gradient-to-b from-white to-slate-50/60">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <div className="rounded-xl bg-slate-950 p-2 text-white">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  当前摘要
                </CardTitle>
                <CardDescription>确认后进入统一的下发预览。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div className="rounded-2xl border bg-slate-50/80 p-4">
                  <div className="text-xs font-medium text-slate-500">已选模板</div>
                  <div className="mt-1 text-base font-semibold text-slate-950">
                    {selectedTemplate?.display_name || "未选择"}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500">
                    {selectedTemplateSummary.map((item) => (
                      <div key={item.label} className="rounded-xl bg-white px-3 py-2">
                        <div>{item.label}</div>
                        <div className="mt-1 font-medium text-slate-800">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border bg-white p-4 shadow-sm">
                    <div className="text-xs text-slate-500">主机</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-950">
                      {selectedHosts.length.toLocaleString()}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">去重后目标主机</div>
                  </div>
                  <div className="rounded-2xl border bg-white p-4 shadow-sm">
                    <div className="text-xs text-slate-500">节点</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-950">
                      {selectedIds.size.toLocaleString()}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">当前选择节点数</div>
                  </div>
                </div>

                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <Clock3 className="h-4 w-4" />
                    执行计划摘要
                  </div>
                  <div className="mt-2 text-sm font-medium text-slate-950">
                    {buildScheduleSummary(schedule)}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    当前计划会带入下发预览作为最终确认信息。
                  </p>
                </div>

                <div className="space-y-2 rounded-2xl border bg-slate-50/80 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <Layers3 className="h-4 w-4 text-blue-600" />
                    状态检查
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="rounded-full bg-white px-2">
                      {selectionReady ? "可进入预览" : "等待补全"}
                    </Badge>
                    <Badge variant="outline" className="rounded-full bg-white px-2">
                      离线 {offlineHostCount}
                    </Badge>
                    <Badge variant="outline" className="rounded-full bg-white px-2">
                      不可下发 {invalidHostCount}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    className="h-11 flex-1 gap-2 bg-slate-950 text-white hover:bg-slate-800"
                    disabled={!selectionReady}
                    onClick={() => setPreviewOpen(true)}
                  >
                    <ArrowRight className="h-4 w-4" />
                    下发预览
                  </Button>
                  <Button variant="outline" className="h-11 gap-2" onClick={resetAll}>
                    重置
                  </Button>
                </div>
              </CardContent>
            </Card>

            {(invalidHostCount > 0 || offlineHostCount > 0) && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>当前范围包含风险主机</AlertTitle>
                <AlertDescription>
                  离线主机 {offlineHostCount} 台，不可下发主机 {invalidHostCount} 台。
                </AlertDescription>
              </Alert>
            )}
          </div>
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
