// user.ts

/**
 * 用户个人资料接口定义
 * /typedef {Object} UserProfile
 * /property {string} id - 用户唯一标识符
 * /property {string} nickname - 用户昵称
 * /property {string} email - 用户邮箱地址
 * /property {string} [phone] - 用户手机号（可选）
 * /property {string} [avatar] - 用户头像URL（可选）
 * /property {boolean} twoFactorEnabled - 是否开启双重认证
 * /property {string} createdAt - 账户创建时间（ISO 8601格式）
 * /property {string} updatedAt - 最后更新时间（ISO 8601格式）
 */
export interface UserProfile {
  id: string
  nickname: string
  email: string
  phone?: string
  avatar?: string
  twoFactorEnabled: boolean
  createdAt: string
  updatedAt: string
}

/**
 * API响应通用格式
 * /template T - 数据类型
 */
interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
}

/**
 * 修改密码请求参数
 */
interface UpdatePasswordPayload {
  oldPassword: string
  newPassword: string
}

// 模拟用户数据库（mock 数据）
let mockUser: UserProfile = {
  id: "u_10001",
  nickname: "admin",
  email: "sentinel/example.com",
  phone: "138****8888",
  avatar: "/icons/avatars/avatar.svg",
  twoFactorEnabled: false,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-10-10T10:00:00Z",
}

/**
 * 模拟网络延迟
 * /param {number} [ms=500] - 延迟时间（毫秒）
 * /returns {Promise<void>}
 */
function delay(ms = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// =======================
// Mock 接口实现
// =======================

/**
 * 获取当前用户个人信息
 * /async
 * /function
 * /returns {Promise<UserProfile>} 用户个人资料
 * /throws {Error} 当获取用户信息失败时抛出错误
 * /example
 * const user = await getUserProfile();
 * console.log(user.nickname);
 */
export async function getUserProfile(): Promise<UserProfile> {
  await delay()
  // 模拟随机错误（实际项目中可移除）
  // if (Math.random() < 0.1) {
  //   throw new Error("获取用户信息失败，请稍后重试")
  // }
  return { ...mockUser }
}

/**
 * 修改用户基本信息
 * /async
 * /function
 * /param {Partial<Pick<UserProfile, "nickname" | "phone" | "email">>} payload - 要更新的用户信息
 * /returns {Promise<ApiResponse<UserProfile>>} 更新结果和更新后的用户数据
 * /throws {Error} 当更新操作失败时抛出错误
 * /example
 * await updateUserProfile({ nickname: "新昵称", phone: "139****9999", email: "new/example.com" });
 */
export async function updateUserProfile(
  payload: Partial<Pick<UserProfile, "nickname" | "phone" | "email">>,
): Promise<ApiResponse<UserProfile>> {
  await delay()

  if (payload.nickname && payload.nickname.length < 2) {
    throw new Error("昵称长度不能少于2个字符")
  }

  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    throw new Error("邮箱格式不正确")
  }

  mockUser = {
    ...mockUser,
    ...payload,
    updatedAt: new Date().toISOString(),
  }

  return {
    success: true,
    message: "个人信息已更新",
    data: { ...mockUser },
  }
}

/**
 * 修改用户密码
 * /async
 * /function
 * /param {UpdatePasswordPayload} payload - 密码修改参数
 * /param {string} payload.oldPassword - 旧密码
 * /param {string} payload.newPassword - 新密码
 * /returns {Promise<ApiResponse>} 修改结果
 * /throws {Error} 当密码修改失败时抛出错误
 * /example
 * await updatePassword({
 *   oldPassword: "oldPassword123",
 *   newPassword: "newPassword456"
 * });
 */
export async function updatePassword(payload: UpdatePasswordPayload): Promise<ApiResponse> {
  await delay()

  if (!payload.oldPassword || !payload.newPassword) {
    throw new Error("请输入旧密码和新密码")
  }

  if (payload.newPassword.length < 6) {
    throw new Error("新密码长度不能少于6个字符")
  }

  // 模拟密码强度检查
  if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(payload.newPassword)) {
    throw new Error("新密码必须包含字母和数字")
  }

  return {
    success: true,
    message: "密码修改成功",
  }
}

/**
 * 开启双重认证
 * /async
 * /function
 * /returns {Promise<ApiResponse<UserProfile>>} 开启结果和更新后的用户数据
 * /throws {Error} 当开启双重认证失败时抛出错误
 * /example
 * await enableTwoFactor();
 */
export async function enableTwoFactor(): Promise<ApiResponse<UserProfile>> {
  await delay()
  mockUser = {
    ...mockUser,
    twoFactorEnabled: true,
    updatedAt: new Date().toISOString(),
  }
  return {
    success: true,
    message: "两步验证已开启",
    data: { ...mockUser },
  }
}

/**
 * 关闭双重认证
 * /async
 * /function
 * /returns {Promise<ApiResponse<UserProfile>>} 关闭结果和更新后的用户数据
 * /throws {Error} 当关闭双重认证失败时抛出错误
 * /example
 * await disableTwoFactor();
 */
export async function disableTwoFactor(): Promise<ApiResponse<UserProfile>> {
  await delay()
  mockUser = {
    ...mockUser,
    twoFactorEnabled: false,
    updatedAt: new Date().toISOString(),
  }
  return {
    success: true,
    message: "两步验证已关闭",
    data: { ...mockUser },
  }
}

/**
 * 注销用户账户
 * /async
 * /function
 * /param {string} confirmToken - 确认注销的令牌
 * /returns {Promise<ApiResponse>} 注销结果
 * /throws {Error} 当确认令牌错误或注销失败时抛出错误
 * /example
 * await deleteAccount("CONFIRM_DELETE");
 */
export async function deleteAccount(confirmToken: string): Promise<ApiResponse> {
  await delay()

  if (confirmToken !== "CONFIRM_DELETE") {
    throw new Error("确认令牌错误，账户未注销")
  }

  mockUser = {
    ...mockUser,
    nickname: "已注销用户",
    email: `deleted_${mockUser.email}`,
    updatedAt: new Date().toISOString(),
  }

  return {
    success: true,
    message: "账户已注销",
  }
}

/**
 * 用户退出登录
 * /async
 * /function
 * /returns {Promise<ApiResponse>} 退出结果
 * /example
 * await logout();
 */
export async function logout(): Promise<ApiResponse> {
  await delay()
  // 清空本地认证相关缓存
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
  sessionStorage.removeItem("user_session")

  return {
    success: true,
    message: "已退出登录",
  }
}
