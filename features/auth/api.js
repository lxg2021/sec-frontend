"use client"

import { useEffect, useState } from "react"
import { http, HttpError, setAuthRefreshHandler } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  getTokenExpiresAt,
  saveAuthTokens,
  setAccessToken,
  setRefreshToken,
} from "@/shared/lib/http/auth"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TOKEN_EXPIRY_SKEW_MS = 30 * 1000

function normalizeEmail(email) {
  return email?.toString().trim() || ""
}

function validateEmail(email) {
  const normalizedEmail = normalizeEmail(email)

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return {
      valid: false,
      email: normalizedEmail,
      code: 400,
      message: "请输入有效的邮箱地址",
      messageKey: "invalidEmail",
    }
  }

  return {
    valid: true,
    email: normalizedEmail,
  }
}

function parseJwtPayload(token) {
  try {
    if (!token || !token.includes(".")) return null

    const payload = token.split(".")[1]
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/")
    const decodedPayload = atob(normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, "="))

    return JSON.parse(decodedPayload)
  } catch {
    return null
  }
}

function isAccessTokenExpired(token) {
  if (!token) return true

  const expiresAt = getTokenExpiresAt()
  if (expiresAt) {
    return Date.now() + TOKEN_EXPIRY_SKEW_MS >= expiresAt
  }

  const payload = parseJwtPayload(token)
  if (!payload?.exp) return false

  return Date.now() + TOKEN_EXPIRY_SKEW_MS >= payload.exp * 1000
}

function normalizeLoginData(data = {}) {
  const accessToken = data.access_token || data.accessToken || data.token || ""
  const refreshToken = data.refresh_token || data.refreshToken || ""
  const expiresIn = Number(data.expires_in ?? data.expiresIn ?? 0)

  return {
    accessToken,
    refreshToken,
    expiresIn,
    user: data.user || {},
  }
}

function successResult(result, data = result.data) {
  return {
    success: true,
    code: result.code,
    message: result.message,
    requestId: result.requestId,
    ...data,
  }
}

function failureResult(error, fallbackMessage) {
  if (error instanceof HttpError) {
    return {
      success: false,
      code: error.code || error.status || -1,
      status: error.status,
      message: error.message || fallbackMessage,
      requestId: error.requestId,
      data: error.data,
    }
  }

  return {
    success: false,
    code: -1,
    message: error?.message || fallbackMessage,
  }
}

export class TokenManager {
  static TOKEN_KEY = "auth_token"
  static REFRESH_TOKEN_KEY = "refresh_token"

  static saveToken(token) {
    setAccessToken(token)
  }

  static getToken() {
    return getAccessToken()
  }

  static removeToken() {
    clearAuthTokens()
  }

  static clearToken() {
    setAccessToken(null)
  }

  static saveRefreshToken(refreshToken) {
    setRefreshToken(refreshToken)
  }

  static getRefreshToken() {
    return getRefreshToken()
  }

  static clearRefreshToken() {
    setRefreshToken(null)
  }

  static isTokenExpired(token) {
    return isAccessTokenExpired(token)
  }

  static parseToken(token) {
    return parseJwtPayload(token)
  }
}

export const authAPI = {
  async getValidToken() {
    let token = getAccessToken()

    if (!token || isAccessTokenExpired(token)) {
      const refreshResult = await authAPI.refreshToken()
      if (!refreshResult.success) {
        return {
          success: false,
          code: 401,
          message: "Token 无效或已过期，请重新登录",
        }
      }

      token = refreshResult.token
    }

    return {
      success: true,
      token,
    }
  },

  async login(credentials) {
    try {
      const payload = {
        request_id: createRequestId(),
        username: credentials.username,
        password: credentials.password,
        tenant_id: credentials.tenantId || credentials.tenant_id || "",
      }

      const result = await http.post("login", payload, { auth: false })
      const loginData = normalizeLoginData(result.data)

      if (!loginData.accessToken || !loginData.refreshToken) {
        return {
          success: false,
          code: result.code || -1,
          message: "登录失败，后端未返回完整令牌",
          requestId: result.requestId,
        }
      }

      saveAuthTokens(loginData)

      return successResult(result, {
        token: loginData.accessToken,
        accessToken: loginData.accessToken,
        refreshToken: loginData.refreshToken,
        expiresIn: loginData.expiresIn,
        user: loginData.user,
      })
    } catch (error) {
      return failureResult(error, "登录请求失败")
    }
  },

  async refreshToken() {
    try {
      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        return {
          success: false,
          code: 401,
          message: "缺少刷新令牌",
        }
      }

      const result = await http.post(
        "refreshToken",
        {
          request_id: createRequestId(),
          refresh_token: refreshToken,
        },
        { auth: false },
      )
      const loginData = normalizeLoginData(result.data)

      if (!loginData.accessToken) {
        return {
          success: false,
          code: result.code || -1,
          message: "刷新令牌失败，后端未返回访问令牌",
          requestId: result.requestId,
        }
      }

      saveAuthTokens({
        accessToken: loginData.accessToken,
        refreshToken: loginData.refreshToken || refreshToken,
        expiresIn: loginData.expiresIn,
      })

      return successResult(result, {
        token: loginData.accessToken,
        accessToken: loginData.accessToken,
        refreshToken: loginData.refreshToken || refreshToken,
        expiresIn: loginData.expiresIn,
        user: loginData.user,
      })
    } catch (error) {
      clearAuthTokens()
      return failureResult(error, "刷新令牌失败")
    }
  },

  async logout() {
    try {
      await http.post("logout", { request_id: createRequestId() })
    } catch {
      // Local logout should still clear credentials even if the backend is unreachable.
    } finally {
      clearAuthTokens()
    }

    return {
      success: true,
      code: 200,
      message: "已退出登录",
    }
  },

  async register(userData) {
    try {
      const result = await http.post(
        "register",
        {
          request_id: createRequestId(),
          ...userData,
        },
        { auth: false },
      )

      return successResult(result, {
        user: result.data || {},
      })
    } catch (error) {
      return failureResult(error, "注册请求失败")
    }
  },

  async getCurrentUser() {
    const tokenResult = await authAPI.getValidToken()
    if (!tokenResult.success) return tokenResult

    const payload = TokenManager.parseToken(tokenResult.token)
    const userId = payload?.user_id || payload?.userId || payload?.sub

    if (!userId) {
      return {
        success: false,
        code: -1,
        message: "Token 中缺少用户 ID",
      }
    }

    try {
      const result = await http.post("getUserInfo", {
        request_id: createRequestId(),
        user_id: userId,
      })

      return successResult(result, {
        user: result.data || {},
      })
    } catch (error) {
      return failureResult(error, "获取用户信息失败")
    }
  },

  async verifyToken(token) {
    if (!token || isAccessTokenExpired(token)) {
      return {
        success: false,
        code: 401,
        message: "Token 无效或已过期",
      }
    }

    return {
      success: true,
      code: 200,
      message: "Token 验证通过",
      payload: TokenManager.parseToken(token) || {},
    }
  },

  async resetPassword(email) {
    const validation = validateEmail(email)
    if (!validation.valid) {
      return {
        success: false,
        code: validation.code,
        message: validation.message,
        messageKey: validation.messageKey,
      }
    }

    try {
      const result = await http.post(
        "resetPassword",
        {
          request_id: createRequestId(),
          email: validation.email,
        },
        { auth: false },
      )

      return successResult(result)
    } catch (error) {
      return failureResult(error, "密码重置请求失败")
    }
  },

  async changePassword(oldPassword, newPassword, userId) {
    try {
      const result = await http.post("changePassword", {
        request_id: createRequestId(),
        user_id: userId,
        old_password: oldPassword,
        new_password: newPassword,
      })

      return successResult(result)
    } catch (error) {
      return failureResult(error, "密码修改请求失败")
    }
  },

}

setAuthRefreshHandler(async () => {
  const result = await authAPI.refreshToken()
  return result.success
})

export function useAuth() {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true)
        const tokenResult = await authAPI.getValidToken()

        if (!tokenResult.success) {
          setUser(null)
          setIsAuthenticated(false)
          return
        }

        const currentUser = await authAPI.getCurrentUser()
        if (currentUser.success) {
          setUser(currentUser.user)
          setIsAuthenticated(true)
          return
        }

        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (credentials) => {
    setIsLoading(true)

    try {
      const response = await authAPI.login(credentials)
      if (response.success) {
        setUser(response.user)
        setIsAuthenticated(true)
      }

      return response
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } finally {
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  const register = async (userData) => {
    setIsLoading(true)

    try {
      return await authAPI.register(userData)
    } finally {
      setIsLoading(false)
    }
  }

  return { user, isAuthenticated, isLoading, login, logout, register }
}
