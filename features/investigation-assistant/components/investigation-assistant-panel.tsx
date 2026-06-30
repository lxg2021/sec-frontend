"use client"

import { InvestigationAssistant } from "@/features/investigation-assistant/components/investigation-assistant"
import { MOCK_AI_INVESTIGATION_PREVIEW } from "@/features/investigation-assistant/mock-preview"
import type {
  InvestigationAssistantLanguage,
  InvestigationNextAction,
} from "@/features/investigation-assistant/types"

export interface InvestigationAssistantPanelProps {
  caseId: string
  language?: InvestigationAssistantLanguage
  focusNodeIds?: string[]
  className?: string
  onActionClick?: (action: InvestigationNextAction) => void | Promise<void>
}

export function InvestigationAssistantPanel({
  caseId,
  className,
  onActionClick,
}: InvestigationAssistantPanelProps) {
  const data = MOCK_AI_INVESTIGATION_PREVIEW.assistant_result

  if (!caseId.trim() || !data) {
    return null
  }

  return (
    <InvestigationAssistant
      className={className}
      data={{
        ...data,
        case_id: data.case_id || caseId.trim(),
      }}
      onActionClick={onActionClick}
    />
  )
}
