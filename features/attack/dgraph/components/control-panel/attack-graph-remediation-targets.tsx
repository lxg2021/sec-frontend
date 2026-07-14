"use client"

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  Network,
  RotateCcw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react"
import { useTranslations } from "next-intl"

import type {
  RemediationOrder,
  RemediationTargetDraft,
} from "@/features/attack/remediation-order"
import {
  getRemediationActionDecision,
  getRemediationAgentDecision,
  getRemediationSelectableActions,
  getRemediationSelectableAgentIds,
} from "@/features/attack/remediation-order"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"

import { getAttackGraphRemediationNodeConfig } from "../../model/node/attack-graph-remediation-config"

export interface AttackGraphRemediationTargetsProps {
  targets: readonly RemediationTargetDraft[]
  order: RemediationOrder | null
  loadingDraft: boolean
  saving: boolean
  dirty: boolean
  error: string
  workflowMissing: boolean
  editable: boolean
  allTargetsComplete: boolean
  onClear: () => void
  onRemove: (targetKey: string) => void
  onRetry: (targetKey: string) => void | Promise<unknown>
  onAgentChange: (targetKey: string, agentId: string) => void
  onActionChange: (targetKey: string, actionCode: string) => void
  onSave: () => void | Promise<unknown>
  onOpenOrchestration: () => void | Promise<unknown>
}

export function AttackGraphRemediationTargets({
  targets,
  order,
  loadingDraft,
  saving,
  dirty,
  error,
  workflowMissing,
  editable,
  allTargetsComplete,
  onClear,
  onRemove,
  onRetry,
  onAgentChange,
  onActionChange,
  onSave,
  onOpenOrchestration,
}: AttackGraphRemediationTargetsProps) {
  const t = useTranslations("pages.attack.drill.controlPanel")
  const busy = saving
  const orderStatus = order?.status || ""
  const showSave =
    targets.length > 0 &&
    editable &&
    (!order || dirty || orderStatus === "draft")
  const shouldSaveBeforeOpening = !order || dirty

  if (loadingDraft && targets.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center gap-2 text-sm font-medium text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        {t("remediation.loadingDraft")}
      </div>
    )
  }

  return (
    <div className="flex max-h-[460px] w-full min-w-0 flex-col">
      {error ? (
        <div
          className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 break-words">{error}</span>
        </div>
      ) : null}

      {orderStatus === "prepared" ? (
        <div
          className="mt-3 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900"
          role="status"
        >
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t("remediation.preparedHint")}</span>
        </div>
      ) : null}

      {workflowMissing && targets.length > 0 ? (
        <div
          className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
          role="status"
        >
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t("remediation.workflowMissing")}</span>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto">
        {targets.length === 0 ? (
          <div className="flex h-[260px] flex-col items-center justify-center text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-600">
              {t("remediation.empty")}
            </p>
            <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
              {t("remediation.emptyHint")}
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[1060px] table-fixed border-collapse text-left">
            <caption className="sr-only">{t("remediation.caption")}</caption>
            <colgroup>
              <col className="w-[26%]" />
              <col className="w-[24%]" />
              <col className="w-[32%]" />
              <col className="w-[12%]" />
              <col className="w-[6%]" />
            </colgroup>
            <thead className="sticky top-0 z-[2] bg-white">
              <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                <th className="px-3 py-2.5">{t("remediation.columns.target")}</th>
                <th className="px-3 py-2.5">{t("remediation.columns.agent")}</th>
                <th className="px-3 py-2.5">{t("remediation.columns.action")}</th>
                <th className="px-3 py-2.5">{t("remediation.columns.risk")}</th>
                <th className="px-2 py-2.5">
                  <span className="sr-only">{t("remediation.columns.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {targets.map((target) => (
                <RemediationTargetRow
                  key={target.key}
                  target={target}
                  disabled={!editable || busy}
                  onActionChange={onActionChange}
                  onAgentChange={onAgentChange}
                  onRemove={onRemove}
                  onRetry={onRetry}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {targets.length > 0 || order ? (
        <div className="shrink-0 border-t border-slate-200 bg-slate-50/90 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900">
                <CheckCircle2 className="h-4 w-4 text-slate-500" aria-hidden="true" />
                {t("remediation.selectedCount", { count: targets.length })}
              </span>
              <OrderStageSummary dirty={dirty} order={order} />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {editable && targets.length > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClear}
                  disabled={busy}
                  className="h-11 rounded-lg border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-none hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:ring-slate-950"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  {t("remediation.clear")}
                </Button>
              ) : null}

              {showSave ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void onSave()}
                  disabled={
                    busy || workflowMissing || !allTargetsComplete || (!dirty && Boolean(order))
                  }
                  className="h-11 rounded-lg border-slate-300 bg-white px-4 text-xs font-semibold shadow-none focus-visible:ring-slate-950"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Save className="h-4 w-4" aria-hidden="true" />
                  )}
                  {saving ? t("remediation.saving") : t("remediation.save")}
                </Button>
              ) : null}

              {targets.length > 0 || order ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void onOpenOrchestration()}
                  disabled={
                    busy ||
                    (shouldSaveBeforeOpening &&
                      (workflowMissing || !allTargetsComplete))
                  }
                  className="h-11 rounded-lg bg-emerald-700 px-4 text-xs font-semibold text-white hover:bg-emerald-800 focus-visible:ring-emerald-950"
                >
                  {saving && shouldSaveBeforeOpening ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  )}
                  {saving && shouldSaveBeforeOpening
                    ? t("remediation.savingAndOpening")
                    : shouldSaveBeforeOpening
                      ? t("remediation.saveAndOpen")
                      : t("remediation.openOrchestration")}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function RemediationTargetRow({
  target,
  disabled,
  onActionChange,
  onAgentChange,
  onRemove,
  onRetry,
}: {
  target: RemediationTargetDraft
  disabled: boolean
  onActionChange: (targetKey: string, actionCode: string) => void
  onAgentChange: (targetKey: string, agentId: string) => void
  onRemove: (targetKey: string) => void
  onRetry: (targetKey: string) => void | Promise<unknown>
}) {
  const t = useTranslations("pages.attack.drill.controlPanel")
  const config = getAttackGraphRemediationNodeConfig(target.node.entityType)
  const capability = config?.capability ?? "unknown"
  const Icon =
    capability === "network"
      ? Network
      : capability === "file"
        ? FileText
        : ShieldCheck
  const action = target.actions.find(
    (candidate) => candidate.action_code === target.selectedActionCode,
  )
  const selectableAgentIds = getRemediationSelectableAgentIds(target)
  const selectableActions = getRemediationSelectableActions(target)
  const risk = action?.risk_level || ""

  return (
    <tr className="border-b border-slate-100 align-top text-xs text-slate-700 last:border-b-0 hover:bg-slate-50/80">
      <td className="px-3 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span
              className="block truncate font-semibold text-slate-900"
              title={target.node.displayName || target.key}
            >
              {target.node.displayName || target.key}
            </span>
            <code
              className="mt-1 block truncate text-[10px] text-slate-500"
              title={target.key}
            >
              {target.key}
            </code>
          </span>
        </div>
      </td>
      <td className="px-3 py-3">
        <Select
          value={target.selectedAgentId || undefined}
          onValueChange={(value) => onAgentChange(target.key, value)}
          disabled={
            disabled ||
            target.resolutionStatus === "resolving" ||
            target.resolutionStatus === "error" ||
            selectableAgentIds.length === 0
          }
        >
          <SelectTrigger
            className="h-11 border-slate-300 bg-white text-xs focus:ring-slate-950"
            aria-label={t("remediation.selectAgentAria", {
              target: target.node.displayName || target.key,
            })}
          >
            <SelectValue placeholder={t("remediation.selectAgent")} />
          </SelectTrigger>
          <SelectContent>
            {selectableAgentIds.map((agentId) => (
              <SelectItem key={agentId} value={agentId} className="text-xs">
                {agentId}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="px-3 py-3">
        <Select
          value={target.selectedActionCode || undefined}
          onValueChange={(value) => onActionChange(target.key, value)}
          disabled={
            disabled ||
            target.resolutionStatus === "resolving" ||
            target.resolutionStatus === "error" ||
            selectableActions.length === 0
          }
        >
          <SelectTrigger
            className="h-11 border-slate-300 bg-white text-xs focus:ring-slate-950"
            aria-label={t("remediation.selectActionAria", {
              target: target.node.displayName || target.key,
            })}
          >
            <SelectValue
              placeholder={
                target.selectedAgentId && selectableActions.length === 0
                  ? t("remediation.noAvailableAction")
                  : t("remediation.selectAction")
              }
            />
          </SelectTrigger>
          <SelectContent>
            {selectableActions.map((candidate) => {
              const decision = getRemediationActionDecision(
                target,
                candidate.action_code,
              )
              const agentDecision = getRemediationAgentDecision(
                decision,
                target.selectedAgentId,
              )
              const applicabilityStatus =
                agentDecision?.status || "unavailable"
              return (
                <SelectItem
                  key={candidate.action_code}
                  value={candidate.action_code}
                  className="text-xs"
                >
                  {candidate.display_name || candidate.action_code}
                  {applicabilityStatus === "requires_configuration"
                    ? ` · ${t("remediation.applicability.requiresConfiguration")}`
                    : ""}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </td>
      <td className="px-3 py-3">
        <RiskBadge risk={risk} />
      </td>
      <td className="px-2 py-2 text-right">
        {target.resolutionStatus === "error" ||
        target.resolutionStatus === "blocked" ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => void onRetry(target.key)}
            disabled={disabled}
            className="h-11 w-11 text-slate-500 hover:bg-amber-50 hover:text-amber-700"
            aria-label={t("remediation.retryAria", {
              target: target.node.displayName || target.key,
            })}
            title={t("remediation.retry")}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(target.key)}
          disabled={disabled}
          className="h-11 w-11 text-slate-500 hover:bg-red-50 hover:text-red-600"
          aria-label={t("remediation.removeAria", {
            target: target.node.displayName || target.key,
          })}
          title={t("remediation.remove")}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </td>
    </tr>
  )
}

function RiskBadge({ risk }: { risk: string }) {
  const t = useTranslations("pages.attack.drill.controlPanel")
  const normalized = risk.toLowerCase()
  if (!normalized) {
    return <span className="text-xs text-slate-400">—</span>
  }
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold",
        normalized === "critical" || normalized === "high"
          ? "border-red-200 bg-red-50 text-red-800"
          : normalized === "medium"
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : normalized === "low"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-slate-200 bg-slate-50 text-slate-600",
      )}
    >
      {getRiskLabel(normalized, t)}
    </span>
  )
}

function OrderStageSummary({
  dirty,
  order,
}: {
  dirty: boolean
  order: RemediationOrder | null
}) {
  const t = useTranslations("pages.attack.drill.controlPanel")
  if (!order) {
    return <span className="text-slate-500">{t("remediation.localDraft")}</span>
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-slate-500">
      {getStatusLabel(order.status.toLowerCase(), t)}
      {dirty ? ` · ${t("remediation.unsaved")}` : ""}
    </span>
  )
}

type Translation = ReturnType<
  typeof useTranslations<"pages.attack.drill.controlPanel">
>

function getRiskLabel(risk: string, t: Translation) {
  if (risk === "critical") return t("remediation.risks.critical")
  if (risk === "high") return t("remediation.risks.high")
  if (risk === "medium") return t("remediation.risks.medium")
  if (risk === "low") return t("remediation.risks.low")
  return t("remediation.risks.unknown")
}

function getStatusLabel(status: string, t: Translation) {
  if (status === "resolving") return t("remediation.statuses.resolving")
  if (status === "ready") return t("remediation.statuses.ready")
  if (status === "configuration_required")
    return t("remediation.statuses.configurationRequired")
  if (status === "blocked") return t("remediation.statuses.blocked")
  if (status === "error") return t("remediation.statuses.error")
  if (status === "draft") return t("remediation.statuses.draft")
  if (status === "prepared") return t("remediation.statuses.prepared")
  if (status === "pending") return t("remediation.statuses.pending")
  if (status === "running") return t("remediation.statuses.running")
  if (status === "success") return t("remediation.statuses.success")
  if (status === "failed") return t("remediation.statuses.failed")
  if (status === "uncertain") return t("remediation.statuses.uncertain")
  if (status === "skipped") return t("remediation.statuses.skipped")
  if (status === "completed") return t("remediation.statuses.completed")
  if (status === "satisfied") return t("remediation.statuses.satisfied")
  if (status === "canceled") return t("remediation.statuses.canceled")
  if (status === "expired") return t("remediation.statuses.expired")
  return status || t("remediation.statuses.unknown")
}
