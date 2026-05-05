"use client"

const FALLBACK_CONFIG = {
  api: {
    baseUrl: "http://127.0.0.1:8090",
    prefix: "/api/v1",
    timeout: 15000,
    successCodes: [0, 200],
    endpoints: {
      login: "/sensor/users/login",
      logout: "/sensor/users/logout",
      refreshToken: "/sensor/users/refresh",
      resetPassword: "/sensor/users/password-reset/request",
      confirmPasswordReset: "/sensor/users/password-reset/confirm",
    },
  },
}

let runtimeConfigPromise = null

function trimTrailingSlash(value) {
  return value ? value.replace(/\/$/, "") : ""
}

function ensureLeadingSlash(value) {
  if (!value) return ""
  return value.startsWith("/") ? value : `/${value}`
}

function normalizeConfig(config) {
  const api = {
    ...FALLBACK_CONFIG.api,
    ...(config?.api || {}),
  }

  return {
    ...FALLBACK_CONFIG,
    ...config,
    api: {
      ...api,
      baseUrl: trimTrailingSlash(api.baseUrl),
      prefix: ensureLeadingSlash(api.prefix).replace(/\/$/, ""),
      endpoints: {
        ...FALLBACK_CONFIG.api.endpoints,
        ...(api.endpoints || {}),
      },
    },
  }
}

export function clearRuntimeConfigCache() {
  runtimeConfigPromise = null
}

export async function getRuntimeConfig() {
  if (!runtimeConfigPromise) {
    runtimeConfigPromise = fetch("/config.json", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load config.json: ${response.status}`)
        }
        return response.json()
      })
      .then(normalizeConfig)
      .catch(() => normalizeConfig(FALLBACK_CONFIG))
  }

  return runtimeConfigPromise
}

export async function getApiConfig() {
  const config = await getRuntimeConfig()
  return config.api
}

export function joinUrl(...parts) {
  return parts
    .filter(Boolean)
    .map((part, index) => {
      const value = String(part)
      if (index === 0) return value.replace(/\/$/, "")
      return value.replace(/^\/+|\/+$/g, "")
    })
    .join("/")
}

export async function resolveApiUrl(pathOrEndpoint) {
  if (/^https?:\/\//i.test(pathOrEndpoint)) return pathOrEndpoint

  const api = await getApiConfig()
  const configuredPath = api.endpoints?.[pathOrEndpoint] || pathOrEndpoint
  const endpointPath = ensureLeadingSlash(configuredPath)

  return joinUrl(api.baseUrl, api.prefix, endpointPath)
}
