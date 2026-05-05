"use client"

export async function parseResponseBody(response) {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export function normalizeApiResponse(payload, response = {}) {
  const ok = response.ok ?? true
  const status = response.status ?? 0
  const statusText = response.statusText ?? ""

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      code: ok ? 0 : status,
      message: ok ? "success" : statusText,
      requestId: "",
      data: payload,
      raw: payload,
    }
  }

  const code = payload.code ?? payload.Code ?? (ok ? 0 : status)
  const message = payload.msg ?? payload.Msg ?? payload.message ?? payload.Message ?? statusText
  const requestId = payload.request_id ?? payload.requestId ?? payload.RequestId ?? ""
  const data = payload.data ?? payload.Data ?? payload

  return {
    code: Number(code),
    message,
    requestId,
    data,
    raw: payload,
  }
}

export function isSuccessResponse(result, successCodes = [0, 200]) {
  return successCodes.includes(Number(result?.code))
}

export function parseApiResponse(responseBody) {
  try {
    const payload = typeof responseBody === "string" ? JSON.parse(responseBody) : responseBody
    const result = normalizeApiResponse(payload)

    return [isSuccessResponse(result), result]
  } catch (error) {
    return [
      false,
      {
        code: -1,
        message: `JSON 解析错误: ${error.message}`,
        requestId: "",
        data: null,
        raw: responseBody,
      },
    ]
  }
}

