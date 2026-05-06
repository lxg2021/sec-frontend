"use client"

import { http, HttpError, setAuthRefreshHandler } from "@/shared/lib/http/client"
import { createRequestId } from "@/shared/lib/utils"
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  getTokenExpiresAt,
  parseJwtPayload,
  saveAuthTokens,
  setCachedAuthUser,
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
      setCachedAuthUser(loginData.user)

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
      if (loginData.user && Object.keys(loginData.user).length > 0) {
        setCachedAuthUser(loginData.user)
      }

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

  async getCurrentUser() {
    const tokenResult = await authAPI.getValidToken()
    if (!tokenResult.success) return tokenResult

    const payload = parseJwtPayload(tokenResult.token)
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

  async resetPassword(email, tenantId = "") {
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
          tenant_id: tenantId || "",
        },
        { auth: false },
      )

      return successResult(result)
    } catch (error) {
      return failureResult(error, "密码重置请求失败")
    }
  },

  async confirmPasswordReset(token, newPassword, tenantId = "") {
    try {
      const result = await http.post(
        "confirmPasswordReset",
        {
          request_id: createRequestId(),
          token,
          new_password: newPassword,
          tenant_id: tenantId || "",
        },
        { auth: false },
      )

      return successResult(result)
    } catch (error) {
      return failureResult(error, "瀵嗙爜閲嶇疆纭璇锋眰澶辫触")
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
