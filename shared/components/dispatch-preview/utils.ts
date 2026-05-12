import type {
  DispatchPreviewData,
  DispatchPreviewStatus,
  DispatchTarget,
} from "./types"

export function getPreviewStatus(
  data: DispatchPreviewData | undefined,
  loading: boolean,
  error?: string,
  submitting?: boolean
): DispatchPreviewStatus {
  if (submitting) return "submitting"
  if (loading) return "loading"
  if (error) return "error"
  if (!data) return "empty"

  const hasObject = Boolean(data.object?.name)
  const hasTarget = typeof data.target?.deduplicatedHostCount === "number"

  if (!hasObject || !hasTarget) return "empty"

  const hasPartialGroups =
    data.target.groups?.some((group) => group.hosts === undefined) ?? false

  if (hasPartialGroups) return "partial"

  return "ready"
}

export function getStatusTags(data: DispatchPreviewData | undefined): string[] {
  if (!data) return []

  const tags: string[] = []
  const hasErrors = data.validations?.some((item) => item.level === "error")
  const hasWarnings = data.validations?.some((item) => item.level === "warning")

  if (data.schedule?.mode === "immediate") {
    tags.push("立即执行")
  }

  if (data.schedule?.mode === "scheduled") {
    tags.push("定时执行")
  }

  if (hasErrors) {
    tags.push("部分目标不可下发")
  } else if (hasWarnings) {
    tags.push("高风险")
  }

  if (data.permissions?.canSubmit === false) {
    tags.push("权限不足")
  }

  return tags
}

export function getTagVariant(
  tag: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (tag) {
    case "立即执行":
      return "default"
    case "定时执行":
      return "secondary"
    case "部分目标不可下发":
    case "权限不足":
      return "destructive"
    case "高风险":
      return "outline"
    default:
      return "secondary"
  }
}

export function getSelectionModeText(mode: DispatchTarget["selectionMode"]) {
  const modeMap: Record<DispatchTarget["selectionMode"], string> = {
    group: "按逻辑组选择",
    host: "按主机选择",
    mixed: "混合选择",
    all: "全部适用主机",
  }

  return modeMap[mode]
}
