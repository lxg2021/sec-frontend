"use client"

import {
  AlertCircle,
  Archive,
  Ban,
  CheckCircle2,
  CircleStop,
  Eye,
  FileText,
  KeyRound,
  Loader2,
  Network,
  Play,
  Power,
  PowerOff,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useId, useState } from "react"
import { createPortal } from "react-dom"

import type {
  RemediationOrder,
  RemediationOrderItem,
  RemediationActionInput,
  RemediationTargetDraft,
} from "@/features/attack/remediation-order"
import {
  getRemediationActionDecision,
  getRemediationAgentDecision,
  getRemediationSelectableActions,
  getRemediationSelectableAgentIds,
} from "@/features/attack/remediation-order"
import {
  fileEAInputFromEditor,
  normalizeFileEANames,
  validateFileEAEditor,
} from "@/features/response/remediation-orchestration/remediation-order-model"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { Switch } from "@/shared/ui/switch"
import { Textarea } from "@/shared/ui/textarea"
import { getAttackGraphRemediationNodeConfig } from "../../model/node/attack-graph-remediation-config"
import { getRemediationTargetPresentation } from "./attack-graph-remediation-target-presentation"

export interface AttackGraphRemediationTargetsProps {
  targets: readonly RemediationTargetDraft[]
  historyItems: readonly RemediationOrderItem[]
  order: RemediationOrder | null
  loadingDraft: boolean
  saving: boolean
  dirty: boolean
  error: string
  workflowMissing: boolean
  editable: boolean
  allTargetsComplete: boolean
  onRemove: (targetKey: string) => void
  onRetry: (targetKey: string) => void | Promise<unknown>
  onAgentChange: (targetKey: string, agentId: string) => void
  onActionChange: (targetKey: string, actionCode: string) => void
  onActionInputChange: (
    targetKey: string,
    actionInput: RemediationActionInput,
  ) => void
  onOpenOrchestration: () => void | Promise<unknown>
  onViewOrchestration: () => void
}

export function AttackGraphRemediationTargets({
  targets,
  historyItems,
  order,
  loadingDraft,
  saving,
  dirty,
  error,
  workflowMissing,
  editable,
  allTargetsComplete,
  onRemove,
  onRetry,
  onAgentChange,
  onActionChange,
  onActionInputChange,
  onOpenOrchestration,
  onViewOrchestration,
}: AttackGraphRemediationTargetsProps) {
  const t = useTranslations("pages.attack.drill.controlPanel")
  const busy = saving
  const orderStatus = order?.status || ""
  const shouldSaveBeforeOpening = !order || dirty
  const targetCount = targets.length + historyItems.length
  const hasDispatchedHistory = historyItems.some((item) =>
    Boolean(item.dispatch_id.trim()) ||
    Boolean(item.execution?.dispatch_id.trim()) ||
    ["pending", "running", "success", "failed", "uncertain"].includes(
      item.status.trim().toLowerCase(),
    ),
  )

  if (loadingDraft && targetCount === 0) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm font-medium text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        {t("remediation.loadingDraft")}
      </div>
    )
  }

  return (
    <div className="flex h-full w-full min-w-0 flex-col">
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
        {targetCount === 0 ? (
          <div className="flex h-full min-h-[188px] flex-col items-center justify-center text-center">
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
          <table className="w-full min-w-[1100px] table-fixed border-collapse text-left">
            <caption className="sr-only">{t("remediation.caption")}</caption>
            <colgroup>
              <col className="w-[27%]" />
              <col className="w-[27%]" />
              <col className="w-[19%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              <col className="w-[5%]" />
            </colgroup>
            <thead className="sticky top-0 z-[2] bg-white">
              <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                <th className="px-3 py-2.5">{t("remediation.columns.target")}</th>
                <th className="px-3 py-2.5">{t("remediation.columns.agent")}</th>
                <th className="px-3 py-2.5">{t("remediation.columns.action")}</th>
                <th className="px-3 py-2.5">{t("remediation.columns.risk")}</th>
                <th className="px-3 py-2.5">{t("remediation.columns.status")}</th>
                <th className="px-2 py-2.5">
                  <span className="sr-only">{t("remediation.columns.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {historyItems.map((item) => (
                <RemediationHistoryRow key={item.item_id} item={item} />
              ))}
              {targets.map((target) => (
                <RemediationTargetRow
                  key={target.key}
                  target={target}
                  disabled={!editable || busy}
                  onActionChange={onActionChange}
                  onActionInputChange={onActionInputChange}
                  onAgentChange={onAgentChange}
                  onRemove={onRemove}
                  onRetry={onRetry}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {targetCount > 0 || order ? (
        <div className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-t border-slate-200/80 bg-slate-50/70 px-4 py-2">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900">
              <CheckCircle2 className="h-4 w-4 text-slate-500" aria-hidden="true" />
              {t("remediation.selectedCount", { count: targetCount })}
            </span>
            <OrderStageSummary dirty={dirty} order={order} />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {order && hasDispatchedHistory ? (
              <Button
                type="button"
                size="sm"
                onClick={onViewOrchestration}
                className="h-10 shrink-0 rounded-xl bg-slate-900 px-3.5 pr-4 text-xs font-semibold text-white shadow-[0_8px_18px_-10px_rgba(15,23,42,0.75)] hover:bg-slate-800 focus-visible:ring-slate-950 disabled:shadow-none"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                {t("remediation.viewRemediation")}
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              onClick={() => void onOpenOrchestration()}
              disabled={
                busy ||
                (shouldSaveBeforeOpening &&
                  (workflowMissing || !allTargetsComplete))
              }
              className="h-10 shrink-0 rounded-xl bg-slate-900 px-3.5 pr-4 text-xs font-semibold text-white shadow-[0_8px_18px_-10px_rgba(15,23,42,0.75)] hover:bg-slate-800 focus-visible:ring-slate-950 disabled:shadow-none"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
                {saving && shouldSaveBeforeOpening ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Play
                    className="h-3.5 w-3.5 fill-current"
                    aria-hidden="true"
                  />
                )}
              </span>
              {t("remediation.openOrchestration")}
            </Button>
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
  onActionInputChange,
  onAgentChange,
  onRemove,
  onRetry,
}: {
  target: RemediationTargetDraft
  disabled: boolean
  onActionChange: (targetKey: string, actionCode: string) => void
  onActionInputChange: (
    targetKey: string,
    actionInput: RemediationActionInput,
  ) => void
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
  const targetPresentation = getRemediationTargetPresentation(
    capability,
    target.node.displayName || target.key,
    target.node.properties,
  )

  return (
    <tr className="border-b border-slate-100 align-middle text-xs text-slate-700 last:border-b-0 hover:bg-slate-50/80">
      <td className="px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            {targetPresentation.showFullValue ? (
              <PointerPathTooltip
                fullValue={targetPresentation.fullValue}
                label={targetPresentation.label}
              />
            ) : (
              <span className="block truncate font-semibold text-slate-900">
                {targetPresentation.label}
              </span>
            )}
          </span>
        </div>
      </td>
      <td className="px-3 py-1.5">
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
            className="h-10 max-w-[320px] border-slate-300 bg-white text-xs focus:ring-slate-950"
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
      <td className="px-3 py-1.5">
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
            className="h-10 max-w-[240px] border-slate-300 bg-white text-xs focus:ring-slate-950 [&>span]:min-w-0 [&>span]:flex-1"
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
            >
              {action ? (
                <RemediationActionLabel
                  actionCode={action.action_code}
                  label={action.display_name || action.action_code}
                />
              ) : undefined}
            </SelectValue>
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
              const label = candidate.display_name || candidate.action_code
              const details = []
              if (
                agentDecision?.current_effect_state ===
                "same_action_in_flight"
              ) {
                details.push(t("remediation.applicability.processing"))
              } else if (
                agentDecision?.current_effect_state === "satisfied"
              ) {
                details.push(t("remediation.applicability.satisfied"))
              }
              const detail = details.join(" · ")
              return (
                <SelectItem
                  key={candidate.action_code}
                  value={candidate.action_code}
                  textValue={detail ? `${label} · ${detail}` : label}
                  className="text-xs"
                >
                  <RemediationActionLabel
                    actionCode={candidate.action_code}
                    detail={detail}
                    label={label}
                  />
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        {target.selectedActionCode === "file_ea.delete" ? (
          <FileEADeleteScopeEditor
            actionInput={target.actionInput}
            disabled={disabled}
            onChange={(actionInput) =>
              onActionInputChange(target.key, actionInput)
            }
          />
        ) : null}
        {target.selectedActionCode === "process.terminate" ? (
          <ProcessTerminationEditor
            actionInput={target.actionInput}
            disabled={disabled}
            onChange={(actionInput) =>
              onActionInputChange(target.key, actionInput)
            }
          />
        ) : null}
      </td>
      <td className="px-3 py-1.5">
        <RiskBadge risk={risk} />
      </td>
      <td className="px-3 py-1.5">
        <StatusBadge
          status={
            target.resolutionStatus !== "ready"
              ? target.resolutionStatus
              : target.itemStatus || "ready"
          }
        />
      </td>
      <td className="px-2 py-1.5 text-right">
        {target.resolutionStatus === "error" ||
        target.resolutionStatus === "blocked" ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => void onRetry(target.key)}
            disabled={disabled}
            className="h-10 w-10 text-slate-500 hover:bg-amber-50 hover:text-amber-700"
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
          className="h-10 w-10 text-slate-500 hover:bg-red-50 hover:text-red-600"
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

function ProcessTerminationEditor({
  actionInput,
  disabled,
  onChange,
}: {
  actionInput: RemediationActionInput
  disabled: boolean
  onChange: (actionInput: RemediationActionInput) => void
}) {
  const t = useTranslations("pages.attack.drill.controlPanel")
  const input = actionInput.process_terminate ?? {}
  const includeSelf = input.include_self ?? true
  const includeChildren = input.include_children ?? true
  const force = input.force ?? false

  function update(
    patch: Partial<NonNullable<RemediationActionInput["process_terminate"]>>,
  ) {
    onChange({
      process_terminate: {
        include_self: includeSelf,
        include_children: includeChildren,
        force,
        ...patch,
      },
    })
  }

  const options = [
    {
      key: "include_self",
      checked: includeSelf,
      label: t("remediation.processTerminate.includeSelf"),
    },
    {
      key: "include_children",
      checked: includeChildren,
      label: t("remediation.processTerminate.includeChildren"),
    },
    {
      key: "force",
      checked: force,
      label: t("remediation.processTerminate.force"),
    },
  ] as const

  return (
    <div className="mt-2 min-w-[230px] rounded-lg border border-slate-200 bg-slate-50 p-2">
      <div className="space-y-1.5">
        {options.map((option) => (
          <label
            key={option.key}
            className="flex min-h-8 items-center justify-between gap-3 rounded-md bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 ring-1 ring-inset ring-slate-200"
          >
            <span>{option.label}</span>
            <Switch
              aria-label={option.label}
              checked={option.checked}
              disabled={disabled}
              onCheckedChange={(checked) => update({ [option.key]: checked })}
              className="data-[state=checked]:bg-slate-900"
            />
          </label>
        ))}
      </div>
      {!includeSelf && !includeChildren ? (
        <p className="mt-1.5 text-[10px] leading-4 text-red-600" role="alert">
          {t("remediation.processTerminate.scopeRequired")}
        </p>
      ) : null}
      {force ? (
        <p className="mt-1.5 text-[10px] leading-4 text-amber-700">
          {t("remediation.processTerminate.forceWarning")}
        </p>
      ) : null}
    </div>
  )
}

function FileEADeleteScopeEditor({
  actionInput,
  disabled,
  onChange,
}: {
  actionInput: RemediationActionInput
  disabled: boolean
  onChange: (actionInput: RemediationActionInput) => void
}) {
  const t = useTranslations("pages.attack.drill.controlPanel")
  const locale = useLocale()
  const input = actionInput.file_ea ?? {}
  const mode = input.delete_all
    ? "all"
    : Array.isArray(input.ea_names)
      ? "named"
      : ""
  const persistedNames = input.ea_names?.join("\n") ?? ""
  const [eaNamesText, setEANamesText] = useState(persistedNames)

  useEffect(() => {
    setEANamesText(persistedNames)
  }, [persistedNames])

  const editor = {
    mode,
    eaNamesText,
    force: Boolean(input.force),
  } as const
  const error = validateFileEAEditor(editor, locale)

  function updateNamedScope(value: string) {
    setEANamesText(value)
    onChange({
      file_ea: fileEAInputFromEditor({
        mode: "named",
        eaNamesText: value,
        force: Boolean(input.force),
      }),
    })
  }

  return (
    <div className="mt-2 min-w-[230px] rounded-lg border border-slate-200 bg-slate-50 p-2">
      <Select
        disabled={disabled}
        value={mode || undefined}
        onValueChange={(value) => {
          if (value === "all") {
            onChange({
              file_ea: fileEAInputFromEditor({
                mode: "all",
                eaNamesText: "",
                force: Boolean(input.force),
              }),
            })
            return
          }
          updateNamedScope(eaNamesText)
        }}
      >
        <SelectTrigger
          className="h-8 border-slate-300 bg-white text-[11px] focus:ring-slate-950"
          aria-label={t("remediation.fileEA.scopeAria")}
        >
          <SelectValue placeholder={t("remediation.fileEA.selectScope")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="named" className="text-xs">
            {t("remediation.fileEA.named")}
          </SelectItem>
          <SelectItem value="all" className="text-xs">
            {t("remediation.fileEA.all")}
          </SelectItem>
        </SelectContent>
      </Select>
      {mode === "named" ? (
        <Textarea
          aria-label={t("remediation.fileEA.namesAria")}
          disabled={disabled}
          value={eaNamesText}
          placeholder={t("remediation.fileEA.namesPlaceholder")}
          onChange={(event) => updateNamedScope(event.target.value)}
          onBlur={() => {
            const normalized = normalizeFileEANames(eaNamesText).join("\n")
            setEANamesText(normalized)
            updateNamedScope(normalized)
          }}
          className="mt-2 min-h-16 resize-y border-slate-300 bg-white font-mono text-[11px] leading-4 focus-visible:ring-slate-950"
        />
      ) : null}
      {mode === "all" ? (
        <p className="mt-1.5 text-[10px] leading-4 text-amber-700">
          {t("remediation.fileEA.allWarning")}
        </p>
      ) : null}
      {error ? (
        <p className="mt-1.5 text-[10px] leading-4 text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function RemediationHistoryRow({ item }: { item: RemediationOrderItem }) {
  const t = useTranslations("pages.attack.drill.controlPanel")
  const config = getAttackGraphRemediationNodeConfig(item.entity_type)
  const capability = config?.capability ?? "unknown"
  const Icon =
    capability === "network"
      ? Network
      : capability === "file"
        ? FileText
        : ShieldCheck
  const targetPresentation = getRemediationTargetPresentation(
    capability,
    item.display_name || item.node_key,
    {},
  )

  return (
    <tr className="border-b border-slate-100 bg-slate-50/40 align-middle text-xs text-slate-600 last:border-b-0">
      <td className="px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            {targetPresentation.showFullValue ? (
              <PointerPathTooltip
                fullValue={targetPresentation.fullValue}
                label={targetPresentation.label}
              />
            ) : (
              <span className="block truncate font-semibold text-slate-800">
                {targetPresentation.label}
              </span>
            )}
          </span>
        </div>
      </td>
      <td className="px-3 py-1.5">
        <span className="block truncate font-mono text-[11px] text-slate-600" title={item.agent_id}>
          {item.agent_id || "-"}
        </span>
      </td>
      <td className="px-3 py-1.5">
        <RemediationActionLabel
          actionCode={item.action_code}
          label={getHistoryActionLabel(item.action_code, t)}
        />
      </td>
      <td className="px-3 py-1.5">
        <RiskBadge risk={item.risk_level} />
      </td>
      <td className="px-3 py-1.5">
        <StatusBadge status={item.status} />
      </td>
      <td className="px-2 py-1.5" />
    </tr>
  )
}

type PointerTooltipPosition = {
  left: number
  maxWidth: number
  top: number
}

function PointerPathTooltip({
  fullValue,
  label,
}: {
  fullValue: string
  label: string
}) {
  const tooltipId = useId()
  const [position, setPosition] = useState<PointerTooltipPosition | null>(null)

  const showAt = (clientX: number, clientY: number) => {
    const offset = 12
    const left = clientX + offset
    setPosition({
      left,
      maxWidth: Math.max(80, Math.min(560, window.innerWidth - left - offset)),
      top: Math.min(clientY + offset, window.innerHeight - 48),
    })
  }

  return (
    <>
      <span
        className="block cursor-help truncate rounded-sm font-semibold text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-1"
        tabIndex={0}
        aria-describedby={position ? tooltipId : undefined}
        aria-label={fullValue}
        onMouseEnter={(event) => showAt(event.clientX, event.clientY)}
        onMouseMove={(event) => showAt(event.clientX, event.clientY)}
        onMouseLeave={() => setPosition(null)}
        onFocus={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          showAt(rect.right, rect.top + rect.height / 2)
        }}
        onBlur={() => setPosition(null)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setPosition(null)
        }}
      >
        {label}
      </span>
      {position && typeof document !== "undefined"
        ? createPortal(
            <div
              id={tooltipId}
              role="tooltip"
              className="pointer-events-none fixed z-[1000] break-all rounded-md border bg-popover px-3 py-1.5 text-left font-mono text-xs leading-5 text-popover-foreground shadow-md"
              style={position}
            >
              {fullValue}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

function RemediationActionLabel({
  actionCode,
  detail = "",
  label,
}: {
  actionCode: string
  detail?: string
  label: string
}) {
  const Icon = getRemediationActionIcon(actionCode)
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Icon
        className="h-3.5 w-3.5 shrink-0 text-slate-500"
        aria-hidden="true"
      />
      <span className="min-w-0 truncate">
        {label}
        {detail ? <span className="text-slate-500"> · {detail}</span> : null}
      </span>
    </span>
  )
}

function getRemediationActionIcon(actionCode: string): LucideIcon {
  const normalized = actionCode.trim().toLowerCase()
  const actionName = normalized.split(".").at(-1) || ""

  if (actionName === "quarantine") return Archive
  if (actionName === "terminate") return CircleStop
  if (actionName === "block" || actionName === "block_execute")
    return Ban
  if (actionName === "bypass" || actionName === "bypass_execute")
    return ShieldCheck
  if (actionName === "disable") return PowerOff
  if (actionName === "enable") return Power
  if (actionName === "reset_password") return KeyRound
  if (actionName === "restore") return RotateCcw
  if (
    actionName === "delete" ||
    actionName === "delete_key" ||
    actionName === "delete_value"
  ) {
    return Trash2
  }
  return Wrench
}

function getHistoryActionLabel(actionCode: string, t: Translation) {
  switch (actionCode.trim().toLowerCase()) {
    case "file.quarantine":
      return t("remediation.historyActions.fileQuarantine")
    case "file.restore":
      return t("remediation.historyActions.fileRestore")
    case "process.terminate":
      return t("remediation.historyActions.processTerminate")
    case "process.block":
      return t("remediation.historyActions.processBlock")
    case "process.bypass":
      return t("remediation.historyActions.processBypass")
    case "net.block":
      return t("remediation.historyActions.netBlock")
    case "net.bypass":
      return t("remediation.historyActions.netBypass")
    case "scheduled_task.delete":
      return t("remediation.historyActions.scheduledTaskDelete")
    case "service.delete":
      return t("remediation.historyActions.serviceDelete")
    case "account.disable":
      return t("remediation.historyActions.accountDisable")
    case "registry.delete":
    case "registry.delete_key":
    case "registry.delete_value":
      return t("remediation.historyActions.registryDelete")
    case "wmi_class.delete":
      return t("remediation.historyActions.wmiClassDelete")
    case "wmi_subscription.delete":
      return t("remediation.historyActions.wmiSubscriptionDelete")
    case "bits_job.delete":
      return t("remediation.historyActions.bitsJobDelete")
    case "file_ea.delete":
      return t("remediation.historyActions.fileEADelete")
    case "ntfs_ads.delete":
      return t("remediation.historyActions.ntfsADSDelete")
    default:
      return actionCode || "-"
  }
}

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("pages.attack.drill.controlPanel")
  const normalized = status.trim().toLowerCase()
  const tone =
    normalized === "success" ||
    normalized === "satisfied" ||
    normalized === "completed"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : normalized === "failed" ||
          normalized === "blocked" ||
          normalized === "error"
        ? "border-red-200 bg-red-50 text-red-800"
        : normalized === "uncertain" || normalized === "configuration_required"
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : normalized === "prepared" ||
              normalized === "pending" ||
              normalized === "running"
            ? "border-blue-200 bg-blue-50 text-blue-800"
            : "border-slate-200 bg-slate-50 text-slate-600"

  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-semibold",
        tone,
      )}
    >
      {getStatusLabel(normalized, t)}
    </span>
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
