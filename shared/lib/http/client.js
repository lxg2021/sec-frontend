"use client"

import { clearAuthTokens, getAuthHeaders } from "@/shared/lib/http/auth"
import { getApiConfig, resolveApiUrl } from "@/shared/lib/http/config"
import { isSuccessResponse, normalizeApiResponse, parseResponseBody } from "@/shared/lib/http/response"

let authRefreshHandler = null

export class HttpError extends Error {
  constructor(message, { status = 0, code = -1, data = null, requestId = "" } = {}) {
    super(message)
    this.name = "HttpError"
    this.status = status
    this.code = code
    this.data = data
    this.requestId = requestId
  }
}

function isAbortLikeError(error) {
  if (!error) return false
  if (error.name === "AbortError" || error.name === "TimeoutError") return true
  const message = String(error.message || error).toLowerCase()
  return message.includes("aborted") || message.includes("abort") || message.includes("timeout")
}

export function setAuthRefreshHandler(handler) {
  authRefreshHandler = handler
}

function isAuthError(error) {
  return [401, 497, 498].includes(Number(error?.status)) || [401, 497, 498].includes(Number(error?.code))
}

function normalizeHeaders(headers = {}) {
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries())
  }

  return { ...headers }
}

function redirectToLogin() {
  if (typeof window === "undefined") return
  clearAuthTokens()
  const current = `${window.location.pathname}${window.location.search}`
  const next = current && current !== "/login" ? `/login?redirect=${encodeURIComponent(current)}` : "/login"
  window.location.href = next
}

export async function request(path, options = {}) {
  const {
    method = "GET",
    data,
    body,
    headers,
    auth = true,
    signal,
    timeout,
    retryOnAuthFailure = true,
    ...rest
  } = options
  const apiConfig = await getApiConfig()
  const requestTimeout = timeout ?? apiConfig.timeout
  const controller = !signal && requestTimeout ? new AbortController() : null
  let didTimeout = false
  const timeoutId = controller
    ? window.setTimeout(() => {
        didTimeout = true
        if (typeof DOMException !== "undefined") {
          controller.abort(new DOMException(`request timeout after ${requestTimeout}ms`, "TimeoutError"))
          return
        }
        controller.abort()
      }, requestTimeout)
    : null

  const requestHeaders = {
    Accept: "application/json",
    ...normalizeHeaders(headers),
  }

  if (auth) {
    Object.assign(requestHeaders, getAuthHeaders())
  }

  let requestBody = body
  if (data !== undefined) {
    requestHeaders["Content-Type"] = requestHeaders["Content-Type"] || "application/json"
    requestBody = JSON.stringify(data)
  }

  const send = async () => {
    const response = await fetch(await resolveApiUrl(path), {
      method,
      headers: requestHeaders,
      body: requestBody,
      signal: signal || controller?.signal,
      ...rest,
    })

    const payload = await parseResponseBody(response)
    const result = normalizeApiResponse(payload, response)

    const successCodes = apiConfig.successCodes || [0, 200]

    if (!response.ok || !isSuccessResponse(result, successCodes)) {
      throw new HttpError(result.message || "request failed", {
        status: response.status,
        code: result.code,
        data: result.data,
        requestId: result.requestId,
      })
    }

    return result
  }

  try {
    try {
      return await send()
    } catch (error) {
      if (didTimeout && isAbortLikeError(error)) {
        throw new HttpError(`request timeout after ${requestTimeout}ms`, {
          status: 0,
          code: -1,
        })
      }

      if (!auth || !retryOnAuthFailure || !authRefreshHandler || !isAuthError(error)) {
        throw error
      }

      const refreshed = await authRefreshHandler()
      if (!refreshed) {
        redirectToLogin()
        throw error
      }

      Object.assign(requestHeaders, getAuthHeaders())
      return await send()
    }
  } finally {
    if (timeoutId) {
      window.clearTimeout(timeoutId)
    }
  }
}

export const http = {
  get(path, options) {
    return request(path, { ...options, method: "GET" })
  },

  post(path, data, options) {
    return request(path, { ...options, method: "POST", data })
  },

  put(path, data, options) {
    return request(path, { ...options, method: "PUT", data })
  },

  patch(path, data, options) {
    return request(path, { ...options, method: "PATCH", data })
  },

  delete(path, options) {
    return request(path, { ...options, method: "DELETE" })
  },
}
