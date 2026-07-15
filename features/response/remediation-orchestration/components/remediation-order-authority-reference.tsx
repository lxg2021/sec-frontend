"use client"

import { useTranslations } from "next-intl"

import type {
  RemediationActionDecision,
  RemediationActionInput,
  RemediationOrderItem,
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

export function RemediationOrderAuthorityReference({
  actionInput,
  decision,
  disabled,
  item,
  onActionInputChange,
  onReverseSourceChange,
  reverseSourceItemId,
}: {
  actionInput: RemediationActionInput
  decision: RemediationActionDecision | null | undefined
  disabled: boolean
  item: RemediationOrderItem
  onActionInputChange: (input: RemediationActionInput) => void
  onReverseSourceChange: (sourceItemId: string) => void
  reverseSourceItemId: string
}) {
  const t = useTranslations("pages.collection.orchestration")
  const agentDecision = decision?.agent_decisions.find(
    (candidate) => candidate.agent_id === item.agent_id,
  )
  const reverseContexts = agentDecision?.reverse_contexts ?? []
  const targetCandidates = agentDecision?.target_candidates ?? []
  if (reverseContexts.length === 0 && targetCandidates.length === 0) return null

  const selectedCandidateId =
    actionInput.wmi_subscription?.target_candidate_id?.trim() ?? ""

  return (
    <div className="mb-4 grid gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
      <div>
        <div className="text-xs font-semibold text-blue-900">{t("reference.title")}</div>
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
