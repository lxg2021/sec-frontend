"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
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
import { controlObjectDisplayNameKey } from "@/features/control-object-library/table-presentation"
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

const OPERATION_PRESENTATION: Record<ControlObjectOperation, {
  labelKey: string
  activeLabelKey: string
  icon: typeof Send
  iconClassName: string
  buttonClassName: string
}> = {
  apply: {
    labelKey: "operationDialog.operations.apply",
    activeLabelKey: "operationDialog.operations.creatingApply",
    icon: Send,
    iconClassName: "text-cyan-700",
    buttonClassName: "bg-cyan-600 text-white hover:bg-cyan-700",
  },
  stop: {
    labelKey: "operationDialog.operations.stop",
    activeLabelKey: "operationDialog.operations.creatingStop",
    icon: CircleStop,
    iconClassName: "text-amber-700",
    buttonClassName: "bg-amber-600 text-white hover:bg-amber-700",
  },
  remove: {
    labelKey: "operationDialog.operations.remove",
    activeLabelKey: "operationDialog.operations.creatingRemove",
    icon: Unplug,
    iconClassName: "text-rose-700",
    buttonClassName: "bg-rose-600 text-white hover:bg-rose-700",
  },
  execute: {
    labelKey: "operationDialog.operations.execute",
    activeLabelKey: "operationDialog.operations.creatingExecute",
    icon: SquareTerminal,
    iconClassName: "text-violet-700",
    buttonClassName: "bg-violet-600 text-white hover:bg-violet-700",
  },
}

function operationTitleKey(target: ControlObjectOperationTarget) {
  const { definition, operation } = target
  if (operation === "apply") return definition.objectType === "config" ? "operationDialog.titles.deployConfig" : "operationDialog.titles.applyPolicy"
  if (operation === "stop") return "operationDialog.titles.stopPolicy"
  if (operation === "remove") return definition.objectType === "config" ? "operationDialog.titles.removeConfig" : "operationDialog.titles.removePolicy"
  return "operationDialog.titles.executeCommand"
}

function operationDescriptionKey(operation: ControlObjectOperation) {
  if (operation === "apply") return "operationDialog.descriptions.apply"
  if (operation === "stop") return "operationDialog.descriptions.stop"
  if (operation === "remove") return "operationDialog.descriptions.remove"
  return "operationDialog.descriptions.execute"
}

function operationErrorMessage(error: unknown, translate: (key: string) => string) {
  const message = error instanceof Error ? error.message.trim() : ""
  const messages: Record<string, string> = {
    PMC_OBJECT_NOT_ACTIVE: "operationDialog.errors.notActive",
    PMC_OPERATION_NOT_ALLOWED: "operationDialog.errors.notAllowed",
    PMC_AGENT_TARGETS_INVALID: "operationDialog.errors.targetsInvalid",
    PMC_OPERATION_RESPONSE_INVALID: "operationDialog.errors.responseInvalid",
    PMC_OBJECT_AGENT_INVALID: "operationDialog.errors.agentInvalid",
    PMC_OBJECT_AGENT_LIST_INVALID: "operationDialog.errors.agentListInvalid",
    PMC_OBJECT_AGENT_LIST_TRUNCATED: "operationDialog.errors.agentListTruncated",
  }
  return messages[message]
    ? translate(messages[message])
    : message || translate("operationDialog.errors.failed")
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
  const t = useTranslations("pages.controlCenter")
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
          setHostError(error instanceof Error ? error.message : t("operationDialog.hosts.loadFailed"))
        }
      })
      .finally(() => {
        if (active) setLoadingHosts(false)
      })

    return () => {
      active = false
    }
  }, [reloadToken, t, target])

  const handleSelectionChange = useCallback((nodes: HostSelectorTreeNode[]) => {
    setSelectedHosts(uniqueSelectedHosts(nodes))
  }, [])

  const presentation = target ? OPERATION_PRESENTATION[target.operation] : null
  const OperationIcon = presentation?.icon ?? Send
  const selectedAgentIds = useMemo(
    () => selectedHosts.map((host) => host.hostId),
    [selectedHosts],
  )
  const hostSelectorText = useMemo(() => ({
    title: t("operationDialog.hosts.title"),
    searchPlaceholder: t("operationDialog.hosts.searchPlaceholder"),
    selectAll: t("operationDialog.hosts.selectAll"),
    clear: t("operationDialog.hosts.clear"),
    searchResults: (term: string, count: number) => t("operationDialog.hosts.searchResults", { term, count }),
    clearSearch: t("operationDialog.hosts.clearSearch"),
    selectedSummary: (
      total: number,
      hostCount: number,
      groupCount: number,
      deptCount: number,
      companyCount: number,
    ) => {
      const groupTotal = groupCount + deptCount + companyCount
      return groupTotal > 0
        ? t("operationDialog.hosts.selectedSummaryWithGroups", { total, hostCount, groupTotal })
        : t("operationDialog.hosts.selectedSummary", { total, hostCount })
    },
  }), [t])
  const emptyHostText = target?.operation === "stop"
    ? t("operationDialog.hosts.emptyStop")
    : target?.operation === "remove"
      ? t("operationDialog.hosts.emptyRemove")
      : t("operationDialog.hosts.empty")

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
        title: t("operationDialog.toast.created", {
          operation: presentation ? t(presentation.labelKey) : t("operationDialog.operations.operation"),
        }),
        description: t("operationDialog.toast.createdDescription", {
          count: result.totalCount || selectedAgentIds.length,
          operationId: result.operationId,
        }),
        variant: "success",
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: t("operationDialog.toast.failed", {
          operation: presentation ? t(presentation.labelKey) : t("operationDialog.operations.operation"),
        }),
        description: operationErrorMessage(error, (key) => t(key)),
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
        closeLabel={t("common.close")}
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
                {target ? t(operationTitleKey(target)) : t("operationDialog.hosts.title")}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {target ? `${controlObjectDisplayNameKey(target.definition) ? t(controlObjectDisplayNameKey(target.definition)!) : target.definition.displayName} · v${target.definition.version}` : ""}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="shrink-0 border-b border-slate-100 bg-white px-5 py-2.5 text-xs leading-5 text-slate-600">
          {target ? t(operationDescriptionKey(target.operation)) : ""}
        </div>

        <div className="flex min-h-0 flex-1 flex-col bg-slate-50/60 p-3 sm:p-4">
          {hostError ? (
            <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
              <div className="max-w-md">
                <CircleAlert className="mx-auto h-6 w-6 text-rose-600" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium text-rose-900">{t("operationDialog.hosts.loadFailed")}</p>
                <p className="mt-1.5 break-words text-xs leading-5 text-rose-700">{hostError}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReloadToken((token) => token + 1)}
                  className="mt-4 rounded-full border-rose-200 bg-white text-rose-700 hover:bg-rose-100"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("common.retry")}
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
              text={hostSelectorText}
              onSelectionChange={handleSelectionChange}
            />
          )}
        </div>

        <DialogFooter className="min-h-14 shrink-0 flex-row items-center justify-between space-x-0 border-t border-slate-200 bg-white px-4 py-2.5 sm:px-5">
          <p className="text-xs text-slate-500" aria-live="polite">
            {t.rich("operationDialog.hosts.selectedCount", {
              count: selectedHosts.length,
              strong: (chunks) => <span className="font-semibold tabular-nums text-slate-800">{chunks}</span>,
            })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-full px-4"
            >
              {t("common.cancel")}
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
              {submitting
                ? (presentation ? t(presentation.activeLabelKey) : t("operationDialog.operations.creating"))
                : t("operationDialog.confirm", {
                    operation: presentation ? t(presentation.labelKey) : t("operationDialog.operations.operation"),
                  })}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
