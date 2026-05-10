"use client"

import { http } from "@/shared/lib/http/client"
import {
  clearAuthTokens,
  getAccessToken,
  getCachedAuthUser,
  parseJwtPayload,
  setCachedAuthUser,
} from "@/shared/lib/http/auth"
import { createRequestId } from "@/shared/lib/utils"

export type UserRole = "admin" | "operator" | "auditor" | "client" | "unspecified" | string
export type UserStatus = "active" | "pending" | "inactive" | "locked" | "banned" | "unspecified" | string

type TimestampLike = string | { seconds?: number; nanos?: number } | null | undefined

export interface BackendUser {
  user_id?: string
  userId?: string
  username?: string
  email?: string
  phone?: string
  avatar?: string
  role?: UserRole | number
  status?: UserStatus | number
  last_login_ip?: string
  lastLoginIp?: string
  last_login_at?: TimestampLike
  lastLoginAt?: TimestampLike
  created_at?: TimestampLike
  createdAt?: TimestampLike
  updated_at?: TimestampLike
  updatedAt?: TimestampLike
  tenant_id?: string
  tenantId?: string
}

export interface UserListItem {
  id: string
  userId: string
  tenantId: string
  username: string
  email: string
  phone?: string
  avatar?: string
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
  raw: BackendUser
}

export interface UserProfile {
  id: string
  userId: string
  tenantId: string
  username: string
  nickname: string
  email: string
  phone?: string
  avatar?: string
  role: UserRole
  status: UserStatus
  lastLoginIp?: string
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
  raw: BackendUser
}

interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
}

export interface ListUsersResult {
  items: UserListItem[]
  total: number
  page: number
  pageSize: number
}

export interface ListUsersParams {
  page?: number
  pageSize?: number
}

interface UpdatePasswordPayload {
  oldPassword: string
  newPassword: string
}

export interface CreateUserPayload {
  username: string
  email: string
  phone?: string
  password: string
  avatar?: string
  role: number
}

function createUserId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }

  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (char) => {
    const random = Math.floor(Math.random() * 16)
    return (Number(char) ^ (random & (15 >> (Number(char) / 4)))).toString(16)
  })
}

function timestampToIso(value: TimestampLike) {
  if (!value) return ""
  if (typeof value === "string") return value

  const seconds = Number(value.seconds || 0)
  const nanos = Number(value.nanos || 0)
  if (!seconds) return ""

  return new Date(seconds * 1000 + Math.floor(nanos / 1000000)).toISOString()
}

function normalizeRole(role: BackendUser["role"]): UserRole {
  if (typeof role === "number") {
    switch (role) {
      case 1:
        return "admin"
      case 2:
        return "operator"
      case 3:
        return "auditor"
      case 4:
        return "client"
      default:
        return "unspecified"
    }
  }

  const normalized = String(role || "unspecified").toLowerCase()
  if (["admin", "operator", "auditor", "client"].includes(normalized)) {
    return normalized
  }

  return "unspecified"
}

function normalizeStatus(status: BackendUser["status"]): UserStatus {
  if (typeof status === "number") {
    switch (status) {
      case 1:
        return "pending"
      case 2:
        return "active"
      case 3:
        return "inactive"
      case 4:
        return "locked"
      case 5:
        return "banned"
      default:
        return "unspecified"
    }
  }

  const normalized = String(status || "unspecified").toLowerCase()
  if (["active", "pending", "inactive", "locked", "banned"].includes(normalized)) {
    return normalized
  }

  return "unspecified"
}

export function getAvatarByRole(role: BackendUser["role"]) {
  switch (normalizeRole(role)) {
    case "admin":
      return "/icons/avatars/admin.svg"
    case "operator":
      return "/icons/avatars/operator.svg"
    case "auditor":
      return "/icons/avatars/auditor.svg"
    case "client":
      return "/icons/avatars/client.svg"
    default:
      return "/icons/avatars/default.svg"
  }
}

function getCurrentTokenPayload() {
  return parseJwtPayload(getAccessToken()) || {}
}

function getCurrentUserId() {
  const cachedUser = getCachedAuthUser() as BackendUser | null
  const cachedUserId = cachedUser?.user_id || cachedUser?.userId
  if (cachedUserId) return cachedUserId

  const payload = getCurrentTokenPayload()

  return (
    payload.user_id ||
    payload.userId ||
    payload.sub ||
    payload.metadata?.user_id ||
    payload.metadata?.userId ||
    ""
  )
}

function getCurrentTenantId() {
  const cachedUser = getCachedAuthUser() as BackendUser | null
  const cachedTenantId = cachedUser?.tenant_id || cachedUser?.tenantId
  if (cachedTenantId) return cachedTenantId

  const payload = getCurrentTokenPayload()

  return payload.tenant_id || payload.tenantId || payload.metadata?.tenant_id || payload.metadata?.tenantId || "public"
}

function normalizeUser(user: BackendUser = {}): UserProfile {
  const userId = user.user_id || user.userId || ""
  const username = user.username || ""
  const createdAt = timestampToIso(user.created_at || user.createdAt) || new Date().toISOString()
  const updatedAt = timestampToIso(user.updated_at || user.updatedAt) || createdAt

  return {
    id: userId,
    userId,
    tenantId: user.tenant_id || user.tenantId || getCurrentTenantId(),
    username,
    nickname: username,
    email: user.email || "",
    phone: user.phone || undefined,
    avatar: user.avatar || getAvatarByRole(user.role),
    role: normalizeRole(user.role),
    status: normalizeStatus(user.status),
    lastLoginIp: user.last_login_ip || user.lastLoginIp || undefined,
    lastLoginAt: timestampToIso(user.last_login_at || user.lastLoginAt) || undefined,
    createdAt,
    updatedAt,
    raw: user,
  }
}

function normalizeUsers(users: BackendUser[] = []): UserListItem[] {
  return users.map((user) => {
    const normalized = normalizeUser(user)
    return {
      id: normalized.id,
      userId: normalized.userId,
      tenantId: normalized.tenantId,
      username: normalized.username,
      email: normalized.email,
      phone: normalized.phone,
      avatar: normalized.avatar,
      role: normalized.role,
      status: normalized.status,
      createdAt: normalized.createdAt,
      updatedAt: normalized.updatedAt,
      raw: user,
    }
  })
}

function extractUserArray(payload: unknown): BackendUser[] {
  if (Array.isArray(payload)) {
    return payload as BackendUser[]
  }

  if (!payload || typeof payload !== "object") {
    return []
  }

  const candidate = payload as {
    data?: unknown
    users?: unknown
    items?: unknown
  }

  if (Array.isArray(candidate.data)) return candidate.data as BackendUser[]
  if (Array.isArray(candidate.users)) return candidate.users as BackendUser[]
  if (Array.isArray(candidate.items)) return candidate.items as BackendUser[]

  return []
}

export async function getUserProfile(): Promise<UserProfile> {
  const cachedUser = getCachedAuthUser() as BackendUser | null
  if (cachedUser?.user_id || cachedUser?.userId) {
    return normalizeUser(cachedUser)
  }

  return refreshUserProfile()
}

export async function refreshUserProfile(): Promise<UserProfile> {
  const userId = getCurrentUserId()
  if (!userId) {
    throw new Error("当前登录信息中缺少用户 ID")
  }

  const result = await http.post("getUserById", {
    request_id: createRequestId(),
    user_id: userId,
    tenant_id: getCurrentTenantId(),
  })
  const user = result.data as BackendUser
  setCachedAuthUser(user)

  return normalizeUser(user)
}

export async function listUsers(params: ListUsersParams = {}): Promise<ListUsersResult> {
  const page = Math.max(1, Number(params.page || 1))
  const pageSize = Math.max(1, Math.min(100, Number(params.pageSize || 10)))
  const offset = (page - 1) * pageSize

  const result = await http.post("listUsers", {
    request_id: createRequestId(),
    limit: pageSize,
    offset,
    tenant_id: getCurrentTenantId(),
  })

  const items = normalizeUsers(extractUserArray(result.data))

  return {
    items,
    total: items.length,
    page,
    pageSize,
  }
}

export async function updateUserProfile(
  payload: Partial<Pick<UserProfile, "nickname" | "phone" | "email">>,
): Promise<ApiResponse<UserProfile>> {
  const currentUser = await getUserProfile()
  const result = await http.post("updateUser", {
    request_id: createRequestId(),
    user_id: currentUser.userId,
    username: payload.nickname?.trim() || currentUser.username,
    email: payload.email?.trim() || currentUser.email,
    phone: payload.phone?.trim() || currentUser.phone || "",
    avatar: currentUser.raw.avatar || currentUser.avatar || getAvatarByRole(currentUser.role),
    tenant_id: currentUser.tenantId,
  })

  const nextUser = await refreshUserProfile()

  return {
    success: true,
    message: result.message || "个人信息已更新",
    data: nextUser,
  }
}

export async function createUser(payload: CreateUserPayload): Promise<ApiResponse> {
  const tenantId = getCurrentTenantId()
  const result = await http.post("createUser", {
    request_id: createRequestId(),
    user_id: createUserId(),
    username: payload.username.trim(),
    email: payload.email.trim(),
    phone: payload.phone?.trim() || "",
    password: payload.password,
    avatar: payload.avatar || getAvatarByRole(payload.role),
    role: payload.role,
    status: 2,
    tenant_id: tenantId,
  })

  return {
    success: true,
    message: result.message || "用户创建成功",
  }
}

export async function hardDeleteUser(userId: string, tenantId?: string): Promise<ApiResponse> {
  const result = await http.post("hardDeleteUser", {
    request_id: createRequestId(),
    user_id: userId,
    tenant_id: tenantId || getCurrentTenantId(),
  })

  return {
    success: true,
    message: result.message || "用户已删除",
  }
}

export async function updatePassword(payload: UpdatePasswordPayload): Promise<ApiResponse> {
  const currentUser = await getUserProfile()

  const result = await http.post("changePassword", {
    request_id: createRequestId(),
    user_id: currentUser.userId,
    old_password: payload.oldPassword,
    new_password: payload.newPassword,
    tenant_id: currentUser.tenantId,
  })

  return {
    success: true,
    message: result.message || "密码修改成功",
  }
}

export async function deleteAccount(): Promise<ApiResponse> {
  const currentUser = await getUserProfile()
  const result = await http.post("softDeleteUser", {
    request_id: createRequestId(),
    user_id: currentUser.userId,
    tenant_id: currentUser.tenantId,
  })
  clearAuthTokens()
  sessionStorage.removeItem("user_session")

  return {
    success: true,
    message: result.message || "账户已注销",
  }
}

export async function logout(): Promise<ApiResponse> {
  let result: ApiResponse | null = null
  let logoutError: unknown = null

  try {
    result = await http.post("logout", {
      request_id: createRequestId(),
      tenant_id: getCurrentTenantId(),
    })
  } catch (error) {
    logoutError = error
  } finally {
    clearAuthTokens()
    sessionStorage.removeItem("user_session")
  }

  if (logoutError) {
    return {
      success: false,
      message: logoutError instanceof Error ? logoutError.message : "服务端退出登录失败，已清除本地登录状态",
    }
  }

  return {
    success: true,
    message: result?.message || "已退出登录",
  }
}
