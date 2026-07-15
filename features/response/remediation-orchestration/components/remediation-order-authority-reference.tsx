"use client"

import { useTranslations } from "next-intl"

import type {
  RemediationActionDecision,
  RemediationActionInput,
  RemediationOrderItem,
  RemediationReverseContextOption,
} from "@/features/attack/remediation-order"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"

function shortId(value: string, left = 8, right = 4) {
  const normalized = value.trim()
  if (normalized.length <= left + right + 3) return normalized || "-"
  return `${normalized.slice(0, left)}...${normalized.slice(-right)}`
}

function basename(value: string) {
  const normalized = value.trim().replace(/[\\/]+$/, "")
  if (!normalized) return "-"
  return normalized.split(/[\\/]/).filter(Boolean).pop() || normalized
}

export function remediationRestoreSourceDetails(
  sourceItemId: string,
  sourceItems: readonly RemediationOrderItem[],
  fallbackBackupId = "",
) {
  const source = sourceItems.find(
    (candidate) => candidate.item_id === sourceItemId,
  )
  if (!source) return null
  const target =
    source.target_snapshot?.file?.file_path ||
    source.display_name ||
    source.node_key
  return {
    backupFileId: source.backup?.backup_id || fallbackBackupId,
    backupFileName: basename(target),
    sourceItemId: source.item_id,
  }
}

export function RemediationOrderAuthorityReference({
  actionInput,
  decision,
  disabled,
  item,
  onActionInputChange,
  onReverseSourceChange,
  reverseSourceItemId,
  sourceItems,
}: {
  actionInput: RemediationActionInput
  decision: RemediationActionDecision | null | undefined
  disabled: boolean
  item: RemediationOrderItem
  onActionInputChange: (input: RemediationActionInput) => void
  onReverseSourceChange: (sourceItemId: string) => void
  reverseSourceItemId: string
  sourceItems: readonly RemediationOrderItem[]
}) {
  const t = useTranslations("pages.collection.orchestration")
  const agentDecision = decision?.agent_decisions.find(
    (candidate) => candidate.agent_id === item.agent_id,
  )
  const decisionReverseContexts = agentDecision?.reverse_contexts ?? []
  const sourceItem = sourceItems.find(
    (candidate) => candidate.item_id === item.reverse_source_id,
  )
  const reverseContexts =
    decisionReverseContexts.length > 0
      ? decisionReverseContexts
      : item.reverse_source_id
        ? [
            {
              source_item_id: item.reverse_source_id,
              source_action_code: sourceItem?.action_code ?? "",
            },
          ]
        : []
  const targetCandidates = agentDecision?.target_candidates ?? []
  if (reverseContexts.length === 0 && targetCandidates.length === 0) return null

  const fileRestore = item.action_code.trim().toLowerCase() === "file.restore"
  const restoreSourceDetails = (context: RemediationReverseContextOption) =>
    remediationRestoreSourceDetails(
      context.source_item_id,
      sourceItems,
      item.backup?.backup_id ?? "",
    )
  const restoreSourceLabel = (context: RemediationReverseContextOption) => {
    const details = remediationRestoreSourceDetails(
      context.source_item_id,
      sourceItems,
      item.backup?.backup_id ?? "",
    )
    if (!details) {
      return `${t("reference.historyAction")} · ${shortId(context.source_item_id)}`
    }
    return `${details.backupFileName} · ${shortId(details.backupFileId)}`
  }
  const selectedReverseContext = reverseContexts.find(
    (context) => context.source_item_id === reverseSourceItemId,
  )
  const selectedRestoreDetails = selectedReverseContext
    ? restoreSourceDetails(selectedReverseContext)
    : null

  const selectedCandidateId =
    actionInput.wmi_subscription?.target_candidate_id?.trim() ?? ""

  if (fileRestore) {
    return (
      <div className="mt-4">
        <div className="mb-2 text-xs font-semibold text-slate-700">
          {t("reference.restoreTitle")}
        </div>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2">
          {reverseContexts.length > 0 ? (
            <label className="block min-w-0 bg-slate-50 px-4 py-3 sm:col-span-2">
              <span className="block text-[11px] text-slate-400">
                {t("reference.restoreSource")}
              </span>
              <Select
                disabled={disabled}
                value={reverseSourceItemId || undefined}
                onValueChange={onReverseSourceChange}
              >
                <SelectTrigger className="mt-2 h-10 rounded-xl border-slate-200 bg-white text-left shadow-none focus:ring-teal-200">
                  <SelectValue
                    placeholder={t("reference.restoreSourcePlaceholder")}
                  >
                    {selectedReverseContext
                      ? restoreSourceLabel(selectedReverseContext)
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {reverseContexts.map((context) => (
                    <SelectItem
                      key={context.source_item_id}
                      textValue={restoreSourceLabel(context)}
                      value={context.source_item_id}
                    >
                      <span className="grid min-w-0 gap-0.5 py-0.5">
                        <span className="truncate text-xs font-medium text-slate-800">
                          {restoreSourceLabel(context)}
                        </span>
                        {restoreSourceDetails(context) ? (
                          <span className="truncate font-mono text-[10px] text-slate-400">
                            {restoreSourceDetails(context)?.backupFileId || "-"}
                          </span>
                        ) : null}
                        <span
                          className="truncate font-mono text-[10px] text-slate-400"
                          title={context.source_item_id}
                        >
                          {t("reference.sourceItem", {
                            item: shortId(context.source_item_id),
                          })}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          ) : null}

          {selectedRestoreDetails ? (
            <>
              <div className="min-w-0 bg-slate-50 px-4 py-2.5">
                <div className="text-[11px] text-slate-400">
                  {t("reference.backupFileId")}
                </div>
                <div
                  className="mt-1 truncate font-mono text-xs font-medium text-slate-700"
                  title={selectedRestoreDetails.backupFileId || "-"}
                >
                  {selectedRestoreDetails.backupFileId || "-"}
                </div>
              </div>
              <div className="min-w-0 bg-slate-50 px-4 py-2.5">
                <div className="text-[11px] text-slate-400">
                  {t("reference.backupFileName")}
                </div>
                <div
                  className="mt-1 truncate text-xs font-medium text-slate-700"
                  title={selectedRestoreDetails.backupFileName || "-"}
                >
                  {selectedRestoreDetails.backupFileName || "-"}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="mb-4 grid gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
      <div>
        <div className="text-xs font-semibold text-blue-900">
          {t("reference.title")}
        </div>
        <p className="mt-1 text-xs leading-5 text-blue-700">
          {t("reference.description")}
        </p>
      </div>

      {reverseContexts.length > 0 ? (
        <label className="grid gap-2 text-xs font-medium text-slate-700">
          {t("reference.restoreSource")}
          <Select
            disabled={disabled}
            value={reverseSourceItemId || undefined}
            onValueChange={onReverseSourceChange}
          >
            <SelectTrigger className="h-10 bg-white text-left">
              <SelectValue placeholder={t("reference.restoreSourcePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {reverseContexts.map((context) => (
                <SelectItem
                  key={context.source_item_id}
                  textValue={`${context.source_action_code || t("reference.historyAction")} · ${context.source_item_id}`}
                  value={context.source_item_id}
                >
                  {context.source_action_code || t("reference.historyAction")} · {shortId(context.source_item_id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      ) : null}

      {targetCandidates.length > 0 ? (
        <label className="grid gap-2 text-xs font-medium text-slate-700">
          {t("reference.target")}
          <Select
            disabled={disabled}
            value={selectedCandidateId || undefined}
            onValueChange={(candidateId) =>
              onActionInputChange({
                ...actionInput,
                wmi_subscription: {
                  ...actionInput.wmi_subscription,
                  target_candidate_id: candidateId,
                },
              })
            }
          >
            <SelectTrigger className="h-10 bg-white text-left">
              <SelectValue placeholder={t("reference.targetPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {targetCandidates.map((candidate) => (
                <SelectItem
                  key={candidate.candidate_id}
                  value={candidate.candidate_id}
                >
                  {candidate.display_name || candidate.candidate_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      ) : null}
    </div>
  )
}
