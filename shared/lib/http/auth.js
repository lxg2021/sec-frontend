"use client"

export const AUTH_TOKEN_KEY = "auth_token"
export const REFRESH_TOKEN_KEY = "refresh_token"
export const TOKEN_EXPIRES_AT_KEY = "token_expires_at"
export const AUTH_USER_KEY = "auth_user"

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

export function getAccessToken() {
  if (!canUseStorage()) return null
  return window.localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setAccessToken(token) {
  if (!canUseStorage()) return

  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token)
    return
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY)
  window.localStorage.removeItem(TOKEN_EXPIRES_AT_KEY)
}

export function getRefreshToken() {
  if (!canUseStorage()) return null
  return window.localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setRefreshToken(token) {
  if (!canUseStorage()) return

  if (token) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, token)
    return
  }

  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function clearAuthTokens() {
  if (!canUseStorage()) return
  window.localStorage.removeItem(AUTH_TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
  window.localStorage.removeItem(TOKEN_EXPIRES_AT_KEY)
  window.localStorage.removeItem(AUTH_USER_KEY)
}

export function getAuthHeaders(token = getAccessToken()) {
  if (!token) return {}
  return {
    Authorization: `Bearer ${token}`,
  }
}

export function parseJwtPayload(token) {
  try {
    if (!token || !token.includes(".")) return null

    const payload = token.split(".")[1]
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/")
    const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, "=")
    const decode = typeof window !== "undefined" && window.atob ? window.atob : atob
    const decodedPayload = decode(paddedPayload)

    return JSON.parse(decodedPayload)
  } catch {
    return null
  }
}

export function getTokenExpiresAt() {
  if (!canUseStorage()) return 0

  const expiresAt = Number(window.localStorage.getItem(TOKEN_EXPIRES_AT_KEY))
  return Number.isFinite(expiresAt) ? expiresAt : 0
}

export function setTokenExpiresAt(expiresAt) {
  if (!canUseStorage()) return

  if (expiresAt) {
    window.localStorage.setItem(TOKEN_EXPIRES_AT_KEY, String(expiresAt))
    return
  }

  window.localStorage.removeItem(TOKEN_EXPIRES_AT_KEY)
}

export function saveAuthTokens({ accessToken, refreshToken, expiresIn } = {}) {
  if (accessToken) setAccessToken(accessToken)
  if (refreshToken) setRefreshToken(refreshToken)
  if (expiresIn) setTokenExpiresAt(Date.now() + Number(expiresIn) * 1000)
}

export function getCachedAuthUser() {
  if (!canUseStorage()) return null

  try {
    const user = window.localStorage.getItem(AUTH_USER_KEY)
    return user ? JSON.parse(user) : null
  } catch {
    return null
  }
}

export function setCachedAuthUser(user) {
  if (!canUseStorage()) return

  if (user) {
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
    return
  }

  window.localStorage.removeItem(AUTH_USER_KEY)
}
