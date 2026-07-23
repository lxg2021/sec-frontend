export interface DispatchExecutionErrorPresentation {
  code: string
  description: string
  codeTitle: string
  descriptionTitle: string
}

function isChineseLocale(locale: string) {
  return locale.toLowerCase().startsWith("zh")
}

function isReportTimeout(code: string, message: string) {
  const normalizedCode = code.trim().toUpperCase()
  const normalizedMessage = message.trim().toUpperCase()
  return normalizedCode === "REPORT_TIMEOUT"
    || normalizedCode.startsWith("REPORT_DEADLINE_EXPIRED")
    || normalizedMessage === "REPORT_TIMEOUT"
    || normalizedMessage.startsWith("REPORT_DEADLINE_EXPIRED")
}

export function dispatchExecutionErrorPresentation(
  errorCode?: string,
  errorMessage?: string,
  locale = "zh-CN",
): DispatchExecutionErrorPresentation {
  const rawCode = errorCode?.trim() || ""
  const rawMessage = errorMessage?.trim() || ""

  if (isReportTimeout(rawCode, rawMessage)) {
    const chinese = isChineseLocale(locale)
    const code = chinese ? "回报超时" : "Report Timed Out"
    const description = chinese
      ? "下发请求已被接收，但在回报截止时间前未收到 Agent 的最终执行结果。"
      : "The dispatch request was accepted, but no final Agent result was received before the reporting deadline."
    return {
      code,
      description,
      codeTitle: rawCode ? `${code} (${rawCode})` : code,
      descriptionTitle: rawMessage && rawMessage !== rawCode
        ? `${description} (${rawMessage})`
        : description,
    }
  }

  const code = rawCode || "-"
  const description = rawMessage || "-"
  return {
    code,
    description,
    codeTitle: code,
    descriptionTitle: description,
  }
}
