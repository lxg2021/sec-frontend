export interface RemediationReadinessIssuePresentation {
  action: string;
  badge: string;
  badgeClassName: string;
  message: string;
}

export function remediationReadinessIssuePresentation(
  error: string,
): RemediationReadinessIssuePresentation {
  const message = error.trim() || "当前目标尚未满足准备条件。";
  const normalized = message.toLowerCase();

  if (
    normalized.includes("wait_existing_remediation") ||
    normalized.includes("same remediation action and parameters") ||
    normalized.includes("同一处置动作和参数") ||
    normalized.includes("同一处置仍在处理")
  ) {
    return {
      badge: "处理中",
      badgeClassName: "bg-blue-50 text-blue-700",
      action: "查看目标",
      message: "相同动作和参数已由现有任务处理。等待任务结束后，请重新 Prepare。",
    };
  }
  if (
    normalized.includes("remediation_result_uncertain") ||
    normalized.includes("结果尚未确认") ||
    normalized.includes("uncertain")
  ) {
    return {
      badge: "结果待确认",
      badgeClassName: "bg-orange-100 text-orange-800",
      action: "查看目标",
      message,
    };
  }
  if (
    normalized.includes("conflicting_action_in_flight") ||
    normalized.includes("remediation_parameter_conflict") ||
    normalized.includes("冲突动作") ||
    normalized.includes("不同参数")
  ) {
    return {
      badge: "动作冲突",
      badgeClassName: "bg-orange-100 text-orange-800",
      action: "查看目标",
      message:
        "该 Agent 上已有相关处置正在执行，或上一条处置结果尚未确认，当前不能重复下发。",
    };
  }
  if (
    normalized.includes("历史") ||
    normalized.includes("来源") ||
    normalized.includes("备份") ||
    normalized.includes("history") ||
    normalized.includes("backup")
  ) {
    return {
      badge: "待选来源",
      badgeClassName: "bg-amber-100 text-amber-800",
      action: "选择来源",
      message,
    };
  }
  if (
    normalized.includes("适用性依据") ||
    normalized.includes("适用性判定") ||
    normalized.includes("目标证据") ||
    normalized.includes("graph")
  ) {
    return {
      badge: "缺少依据",
      badgeClassName: "bg-blue-50 text-blue-700",
      action: "查看目标",
      message,
    };
  }
  if (
    normalized.includes("请选择") ||
    normalized.includes("填写") ||
    normalized.includes("参数") ||
    normalized.includes("必填") ||
    normalized.includes("required") ||
    normalized.includes("candidate") ||
    normalized.includes("scope")
  ) {
    return {
      badge: "待补参数",
      badgeClassName: "bg-amber-100 text-amber-800",
      action: "补充参数",
      message,
    };
  }
  return {
    badge: "待处理",
    badgeClassName: "bg-amber-100 text-amber-800",
    action: "查看目标",
    message,
  };
}
