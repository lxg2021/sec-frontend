"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  CircleAlert,
  CircleStop,
  LoaderCircle,
  RotateCcw,
  Send,
  SquareTerminal,
  Unplug,
} from "lucide-react"

import {
  operateControlObject,
  queryControlObjectAgents,
  type ControlObjectDefinition,
  type ControlObjectOperation,
} from "@/features/control-object-library/api"
import {
  eligibleControlObjectAgentIds,
  filterHostTreeByAgentIds,
} from "@/features/control-object-library/operation-targets"
import HostSelector from "@/shared/components/host-selector"
import { getHostSelectorTree } from "@/shared/components/host-selector/api"
import type {
  HostSelectorHostNode,
  HostSelectorTreeNode,
} from "@/shared/components/host-selector/types"
import { useToast } from "@/shared/hooks/use-toast"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"

export interface ControlObjectOperationTarget {
  definition: ControlObjectDefinition
  operation: ControlObjectOperation
}

const HOST_SELECTOR_TEXT = {
  title: "选择目标主机",
  searchPlaceholder: "搜索主机名、IP、Agent ID、MAC 或操作系统",
  selectAll: "全选",
  clear: "清空",
  searchResults: (term: string, count: number) => `“${term}”匹配 ${count} 个节点`,
  clearSearch: "清除搜索",
  selectedSummary: (
    total: number,
    hostCount: number,
    groupCount: number,
    deptCount: number,
    companyCount: number,
  ) => {
    const groupTotal = groupCount + deptCount + companyCount
    return `已选择 ${hostCount} 台主机${groupTotal > 0 ? `，覆盖 ${groupTotal} 个组织节点` : ""}（${total} 个节点）`
  },
}

const OPERATION_PRESENTATION: Record<ControlObjectOperation, {
  label: string
  activeLabel: string
  icon: typeof Send
  iconClassName: string
  buttonClassName: string
}> = {
  apply: {
    label: "应用",
    activeLabel: "正在创建应用任务…",
    icon: Send,
    iconClassName: "text-cyan-700",
    buttonClassName: "bg-cyan-600 text-white hover:bg-cyan-700",
  },
  stop: {
    label: "停止",
    activeLabel: "正在创建停止任务…",
    icon: CircleStop,
    iconClassName: "text-amber-700",
    buttonClassName: "bg-amber-600 text-white hover:bg-amber-700",
  },
  remove: {
    label: "移除",
    activeLabel: "正在创建移除任务…",
    icon: Unplug,
    iconClassName: "text-rose-700",
    buttonClassName: "bg-rose-600 text-white hover:bg-rose-700",
  },
  execute: {
    label: "执行",
    activeLabel: "正在创建执行任务…",
    icon: SquareTerminal,
    iconClassName: "text-violet-700",
    buttonClassName: "bg-violet-600 text-white hover:bg-violet-700",
  },
}

function operationTitle(target: ControlObjectOperationTarget) {
  const { definition, operation } = target
  if (operation === "apply") return definition.objectType === "config" ? "下发配置" : "应用策略"
  if (operation === "stop") return "停止策略"
  if (operation === "remove") return definition.objectType === "config" ? "移除配置" : "移除策略"
  return "执行命令"
}

function operationDescription(operation: ControlObjectOperation) {
  if (operation === "apply") return "后台将为每台选中主机创建独立 Dispatch，并下发当前对象版本。"
  if (operation === "stop") return "仅显示当前策略正在生效且没有进行中变更的主机；停止不会删除 Catalog 对象。"
  if (operation === "remove") return "仅显示已有当前效果且没有进行中变更的主机；移除不会删除 Catalog 对象。"
  return "命令会在每台选中主机上独立执行，请在提交前确认目标范围。"
}

function operationErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message.trim() : ""
  const messages: Record<string, string> = {
    PMC_OBJECT_NOT_ACTIVE: "对象当前不是 active 状态，不能创建 Agent 操作。",
    PMC_OPERATION_NOT_ALLOWED: "后台能力合同不允许对该对象执行此操作。",
    PMC_AGENT_TARGETS_INVALID: "请至少选择一台主机，且一次不能超过 10000 台。",
    PMC_OPERATION_RESPONSE_INVALID: "后台已响应，但没有返回有效的 operation_id。",
    PMC_OBJECT_AGENT_INVALID: "后台返回了无效的对象关联主机。",
    PMC_OBJECT_AGENT_LIST_INVALID: "后台返回的对象关联主机列表格式无效。",
    PMC_OBJECT_AGENT_LIST_TRUNCATED: "关联主机超过当前安全加载上限，无法创建操作。",
  }
  return messages[message] || message || "创建 Agent 操作失败，请稍后重试。"
}

function uniqueSelectedHosts(nodes: HostSelectorTreeNode[]) {
  return Array.from(new Map(
    nodes
      .filter((node): node is HostSelectorHostNode => node.type === "host")
      .map((host) => [host.hostId, host]),
  ).values())
}

export function ControlObjectOperationDialog({
  target,
  onOpenChange,
}: {
  target: ControlObjectOperationTarget | null
  onOpenChange: (open: boolean) => void
}) {
  const { toast } = useToast()
  const [hostTree, setHostTree] = useState<HostSelectorTreeNode[]>([])
  const [selectedHosts, setSelectedHosts] = useState<HostSelectorHostNode[]>([])
  const [loadingHosts, setLoadingHosts] = useState(false)
  const [hostError, setHostError] = useState("")
  const [reloadToken, setReloadToken] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!target) {
      setHostTree([])
      setSelectedHosts([])
      setHostError("")
      setLoadingHosts(false)
      setSubmitting(false)
      return
    }

    let active = true
    setHostTree([])
    setSelectedHosts([])
    setHostError("")
    setLoadingHosts(true)

    const requiresCurrentEffect = target.operation === "stop" || target.operation === "remove"
    const treePromise = getHostSelectorTree()
    const agentsPromise = requiresCurrentEffect
      ? queryControlObjectAgents(target.definition)
      : Promise.resolve(null)

    void Promise.all([treePromise, agentsPromise])
      .then(([tree, agents]) => {
        if (!active) return

        if (!agents) {
          setHostTree(tree)
          return
        }

        const eligibleAgentIds = eligibleControlObjectAgentIds(agents, target.operation)
        setHostTree(filterHostTreeByAgentIds(tree, eligibleAgentIds))
      })
      .catch((error: unknown) => {
        if (active) {
          setHostError(error instanceof Error ? error.message : "目标主机加载失败")
        }
      })
      .finally(() => {
        if (active) setLoadingHosts(false)
      })

    return () => {
      active = false
    }
  }, [reloadToken, target])

  const handleSelectionChange = useCallback((nodes: HostSelectorTreeNode[]) => {
    setSelectedHosts(uniqueSelectedHosts(nodes))
  }, [])

  const presentation = target ? OPERATION_PRESENTATION[target.operation] : null
  const OperationIcon = presentation?.icon ?? Send
  const selectedAgentIds = useMemo(
    () => selectedHosts.map((host) => host.hostId),
    [selectedHosts],
  )
  const emptyHostText = target?.operation === "stop"
    ? "当前没有可停止的主机。主机必须已有正在生效的策略，且不能存在进行中的变更。"
    : target?.operation === "remove"
      ? "当前没有可移除的主机。主机必须已有策略或配置效果，且不能存在进行中的变更。"
      : "当前没有可选择的主机。"

  const handleSubmit = async () => {
    if (!target || submitting || selectedAgentIds.length === 0) return
    setSubmitting(true)

    try {
      const result = await operateControlObject(
        target.definition,
        target.operation,
        selectedAgentIds,
      )
      toast({
        title: `${presentation?.label || "操作"}任务已创建`,
        description: `${result.totalCount || selectedAgentIds.length} 台主机，Operation ID：${result.operationId}`,
        variant: "success",
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: `${presentation?.label || "操作"}任务创建失败`,
        description: operationErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={Boolean(target)}
      onOpenChange={(open) => {
        if (!submitting) onOpenChange(open)
      }}
    >
      <DialogContent
        overlayClassName="bg-slate-950/45 backdrop-blur-[2px]"
        className={cn(
          "flex h-[min(820px,calc(100dvh-2rem))] w-[calc(100vw-1.5rem)] max-w-[960px] flex-col gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-2xl",
          "[&>button]:right-4 [&>button]:top-3.5 [&>button]:flex [&>button]:h-8 [&>button]:w-8 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:border [&>button]:border-slate-200 [&>button]:bg-white [&>button]:text-slate-500 [&>button]:opacity-100",
          submitting && "[&>button]:pointer-events-none [&>button]:opacity-40",
        )}
      >
        <DialogHeader className="shrink-0 border-b border-slate-200 bg-slate-50/80 px-5 py-3 pr-16 text-left">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
              <OperationIcon className={cn("h-4 w-4 shrink-0", presentation?.iconClassName)} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="truncate text-sm font-semibold leading-5 text-slate-950">
                {target ? operationTitle(target) : "选择目标主机"}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {target ? `${target.definition.displayName} · v${target.definition.version}` : ""}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="shrink-0 border-b border-slate-100 bg-white px-5 py-2.5 text-xs leading-5 text-slate-600">
          {target ? operationDescription(target.operation) : ""}
        </div>

        <div className="flex min-h-0 flex-1 flex-col bg-slate-50/60 p-3 sm:p-4">
          {hostError ? (
            <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
              <div className="max-w-md">
                <CircleAlert className="mx-auto h-6 w-6 text-rose-600" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium text-rose-900">目标主机加载失败</p>
                <p className="mt-1.5 break-words text-xs leading-5 text-rose-700">{hostError}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReloadToken((token) => token + 1)}
                  className="mt-4 rounded-full border-rose-200 bg-white text-rose-700 hover:bg-rose-100"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  重试
                </Button>
              </div>
            </div>
          ) : (
            <HostSelector
              data={hostTree}
              loading={loadingHosts}
              emptyText={emptyHostText}
              fillAvailableHeight
              showHeader={false}
              compactHostRows
              text={HOST_SELECTOR_TEXT}
              onSelectionChange={handleSelectionChange}
            />
          )}
        </div>

        <DialogFooter className="min-h-14 shrink-0 flex-row items-center justify-between space-x-0 border-t border-slate-200 bg-white px-4 py-2.5 sm:px-5">
          <p className="text-xs text-slate-500" aria-live="polite">
            已选择 <span className="font-semibold tabular-nums text-slate-800">{selectedHosts.length}</span> 台主机
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-full px-4"
            >
              取消
            </Button>
            <Button
              type="button"
              disabled={submitting || loadingHosts || Boolean(hostError) || selectedHosts.length === 0}
              onClick={() => void handleSubmit()}
              className={cn("h-9 min-w-28 rounded-full px-4", presentation?.buttonClassName)}
            >
              {submitting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <OperationIcon className="h-4 w-4" aria-hidden="true" />
              )}
              {submitting ? presentation?.activeLabel : `确认${presentation?.label || "操作"}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
