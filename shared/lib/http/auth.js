"use client"

export const AUTH_TOKEN_KEY = "auth_token"
export const REFRESH_TOKEN_KEY = "refresh_token"
export const TOKEN_EXPIRES_AT_KEY = "token_expires_at"

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
}

export function getAuthHeaders(token = getAccessToken()) {
  if (!token) return {}
  return {
    Authorization: `Bearer ${token}`,
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
