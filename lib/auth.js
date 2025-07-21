"use client"

import { useEffect } from "react"
import { useState } from "react"
import { endpoints } from '@/lib/api/endpoints';
import { parseResponse } from '@/lib/responseParser';

// JWT Token管理
export class TokenManager {
  static TOKEN_KEY = "auth_token"
  static REFRESH_TOKEN_KEY = "refresh_token"

  // 保存token到localStorage
  static saveToken(token) {
    // TODO: 实现token保存逻辑
    if (typeof window !== "undefined") {
      localStorage.setItem(TokenManager.TOKEN_KEY, token)
    }
  }

  // 获取token
  static getToken() {
    // TODO: 实现token获取逻辑
    if (typeof window !== "undefined") {
      return localStorage.getItem(TokenManager.TOKEN_KEY)
    }
    return null
  }

  // 移除token
  static removeToken() {
    // TODO: 实现token移除逻辑
    if (typeof window !== "undefined") {
      localStorage.removeItem(TokenManager.TOKEN_KEY)
      localStorage.removeItem(TokenManager.REFRESH_TOKEN_KEY)
    }
  }

  // 保存刷新token
  static saveRefreshToken(refreshToken) {
    // TODO: 实现刷新token保存逻辑
    if (typeof window !== "undefined") {
      localStorage.setItem(TokenManager.REFRESH_TOKEN_KEY, refreshToken)
    }
  }

  // 获取刷新token
  static getRefreshToken() {
    // TODO: 实现刷新token获取逻辑
    if (typeof window !== "undefined") {
      return localStorage.getItem(TokenManager.REFRESH_TOKEN_KEY)
    }
    return null
  }

  // 验证token是否过期
  static isTokenExpired(token) {
    // TODO: 实现token过期验证逻辑
    try {
      if (!token) return true

      // 简单的JWT解析（生产环境建议使用专门的库）
      const payload = JSON.parse(atob(token.split(".")[1]))
      const currentTime = Date.now() / 1000

      return payload.exp < currentTime
    } catch (error) {
      return true
    }
  }

  // 解析JWT token
  static parseToken(token) {
    // TODO: 实现token解析逻辑
    try {
      if (!token) return null

      const payload = JSON.parse(atob(token.split(".")[1]))
      return payload
    } catch (error) {
      console.error("Token解析失败:", error)
      return null
    }
  }
}

// 认证API函数
export const authAPI = {

  /** 所有业务API接口调用时候，都需要来获取下Valid Token
   * 
   * 获取有效的访问令牌（access token）
   * 如果当前 token 不存在或已过期，尝试刷新 token
   * @returns {Promise<{ success: boolean, token?: string, message?: string, code?: number }>}
   */
  async getValidToken() {
    let token = TokenManager.getToken();

    if (!token || TokenManager.isTokenExpired(token)) {
      const refreshResult = await refreshToken();
      if (!refreshResult.success) {
        return {
          success: false,
          code: 401,
          message: 'Token 无效或已过期，且刷新失败，请重新登录',
        };
      }
      token = refreshResult.token; // 刷新成功后更新 token
    }

    return {
      success: true,
      token,
    };
  },

  /** 用户登录函数，向后端发送登录请求并处理响应结果。
   *
   * @param credentials - 用户登录凭证对象，包含用户名和密码
   * @param credentials.username - 用户名
   * @param credentials.password - 密码
   * @returns 返回一个 Promise，解析为登录结果对象，包含登录是否成功、令牌、用户信息等
   *
   * 返回示例（成功）:
   * {
   *   success: true,
   *   token: "xxx.jwt.token",
   *   user: { username: "admin", email: "admin@example.com" },
   *   message: "登录成功"
   * }
   *
   * 返回示例（失败 - 接口返回错误）:
   * {
   *   success: false,
   *   code: 401,
   *   message: "用户名或密码错误"
   * }
   *
   * 返回示例（失败 - 网络异常）:
   * {
   *   success: false,
   *   code: -1,
   *   message: "登录请求失败，错误信息: Failed to fetch"
   * }
   */
  async login(credentials) {
    try {
      const response = await fetch(endpoints.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const text = await response.text();

      if (!response.ok) {
        // HTTP 错误，返回状态码和错误消息
        return {
          success: false,
          code: response.status,
          message: `登录失败，状态码: ${response.status}`,
        };
      }

      const [ok, result] = parseResponse(text);

      if (ok && result.token && result.refreshToken) {

        // 保存令牌
        TokenManager.saveToken(result.token);
        TokenManager.saveRefreshToken(result.refreshToken);

        return {
          success: true,
          token: result.token,               // 访问令牌
          refreshToken: result.refreshToken, // 刷新令牌
          user: result.user || {},
          message: '登录成功',
        };
      }

      return {
        success: false,
        code: result.code || -1,
        message: result.message || '登录失败，未返回 token 或刷新令牌',
      };
    } catch (err) {
      return {
        success: false,
        code: -1,
        message: '登录请求失败，错误信息: ' + (err.message || err.toString()),
      };
    }
  },

  /** 模拟登录API调用 */
  async mockLogin(credentials) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      if (credentials.username === "admin" && credentials.password === "admin") {
        const mockToken = "mock.jwt.token"
        const refreshToken = "mock.refresh.token"

        TokenManager.saveToken(mockToken)
        TokenManager.saveRefreshToken(refreshToken)

        return {
          success: true,
          token: mockToken,
          refreshToken: refreshToken,
          user: {
            username: credentials.username,
            email: "admin@example.com",
          },
          message: "登录成功",
        }
      } else {
        return {
          success: false,
          code: 401,
          message: "用户名或密码错误",
        }
      }
    } catch (err) {
      return {
        success: false,
        code: -1,
        message: '模拟登录异常: ' + (err.message || err.toString()),
      };
    }
  },

  /** 用户注册函数，向后端发送注册请求并处理响应结果。
   *
   * @param userData - 注册所需的用户信息
   * @param userData.username - 用户名，必填
   * @param userData.password - 密码，必填
   * @param userData.email - 用户邮箱，可选
   *
   * @returns 返回一个 Promise，解析为注册结果对象，包含是否成功和提示信息。
   *
   * 返回示例（成功）:
   * {
   *   code: 0,
   *   success: true,
   *   message: "注册成功，请登录"
   * }
   *
   * 返回示例（失败）:
   * {
   *   success: false,
   *   code: 400,
   *   message: "注册失败，用户名已存在"
   * }
   *
   * 返回示例（网络异常）:
   * {
   *   success: false,
   *   code: -1,
   *   message: "注册请求失败，错误信息: Network error"
   * }
   */
  async register(userData) {
    try {
      const response = await fetch(endpoints.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const text = await response.text();

      if (!response.ok) {
        return {
          success: false,
          code: response.status,
          message: `注册失败，状态码: ${response.status}`,
        };
      }

      const [ok, result] = parseResponse(text);

      if (ok) {
        return {
          code: result.code || 0,
          success: true,
          message: result.message || '注册成功，请登录',
          user: result.user || {},
        };
      }

      return {
        success: false,
        code: result.code || -1,
        message: result.message || '注册失败',
      };

    } catch (err) {
      return {
        success: false,
        code: -1,
        message: '注册请求失败，错误信息: ' + (err.message || err.toString()),
      };
    }
  },

  /** 模拟用户注册调用 */
  async mockRegister(userData) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      return {
        code: 0,
        success: true,
        message: "注册成功，请登录",
      }
    } catch (error) {
      return {
        code: -1,
        success: false,
        message: "注册失败，请稍后重试",
      }
    }
  },

  /** 刷新访问令牌
   * 
   * 什么时候去刷新 Token？
   * - 访问令牌即将过期时（比如剩余时间很短）。
   * - 访问令牌请求接口时服务器返回“令牌过期”错误。
   * - 应用启动时检测到本地令牌过期，自动刷新。
   *
   * 访问令牌（access token） — 用于认证后续请求，通常有效期短（几分钟到几小时）
   * 刷新令牌（refresh token） — 用于在访问令牌过期后，申请新的访问令牌，有效期更长（几天甚至更长）
   *
   * 后台接收刷新令牌请求后，一般要做如下步骤：
   *
   * 1. 验证请求
   *    - 检查请求体中是否带有刷新令牌（refreshToken）。
   *    - 验证刷新令牌格式是否正确。
   *
   * 2. 验证刷新令牌有效性
   *    - 验证刷新令牌是否存在于数据库或缓存中（防止伪造）。
   *    - 检查刷新令牌是否过期。
   *    - 确认刷新令牌未被吊销或撤销。
   *
   * 3. 生成新的访问令牌（access token）
   *    - 根据刷新令牌中的用户信息，生成一个新的短期访问令牌。
   *    - 有时也会生成新的刷新令牌并替换旧的。
   *
   * 4. 返回新的令牌给客户端
   *    - 返回新的访问令牌和（可选）新的刷新令牌给前端。
   *    - 同时返回操作成功的状态码和消息。
   *
   * 5. 异常处理
   *    - 若刷新令牌无效、过期或不存在，返回错误信息（如401 Unauthorized）。
   *    - 记录相关日志，方便排查安全问题。
   */
  async refreshToken() {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (!refreshToken) {
        return {
          success: false,
          message: "无刷新令牌",
        };
      }

      // 发送刷新请求到后端接口，注意替换为你的实际刷新接口地址
      const response = await fetch(endpoints.refreshToken, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        return {
          success: false,
          code: response.status,
          message: `刷新令牌失败，状态码: ${response.status}`,
        };
      }

      const text = await response.text();
      const [ok, result] = parseResponse(text);

      if (ok && result.token) {
        // 保存新的访问令牌（access token）
        TokenManager.saveToken(result.token);

        // 如果返回新的刷新令牌，也可以保存
        if (result.refreshToken) {
          TokenManager.saveRefreshToken(result.refreshToken);
        }

        return {
          success: true,
          token: result.token,
          message: "Token刷新成功",
        };
      }

      return {
        success: false,
        code: result.code || -1,
        message: result.message || "刷新令牌失败",
      };
    } catch (err) {
      return {
        success: false,
        code: -1,
        message: "刷新请求失败，错误信息: " + (err.message || err.toString()),
      };
    }
  },

  /** 用户登出 */
  async logout() {
    try {
      TokenManager.removeToken()
      console.log("用户已登出")
    } catch (error) {
      console.error("登出过程中发生错误:", error)
    }
  },

  /** 获取当前用户信息 */
  async mockGetCurrentUser() {
    try {
      const token = TokenManager.getToken();
      if (!token || TokenManager.isTokenExpired(token)) {
        return {
          success: false,
          code: -1,
          message: "未登录或 token 无效",
        };
      }

      const payload = TokenManager.parseToken(token);
      if (!payload) {
        return {
          success: false,
          code: -1,
          message: "token 无法解析",
        };
      }

      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 300));

      // 返回模拟用户数据
      return {
        success: true,
        code: 0,
        message: "获取成功",
        user: {
          username: payload.username || "admin",
          email: payload.email || "admin@example.com",
          role: payload.role || "user",
        },
      };
    } catch (error) {
      console.error("获取用户信息失败:", error);
      return {
        success: false,
        code: -1,
        message: "模拟用户信息获取失败: " + (error.message || error.toString()),
      };
    }
  },

  /** 模拟重置密码 */
  async mockResetPassword(email) {
    try {
      // 校验 email 基本合法性
      if (!email || !email.includes("@")) {
        return {
          success: false,
          code: 400,
          message: "请输入有效的邮箱地址",
        };
      }

      // 模拟网络延迟
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 模拟特定邮箱失败
      if (email === "fail@example.com") {
        return {
          success: false,
          code: 500,
          message: "模拟：服务器错误，邮件发送失败",
        };
      }

      // 默认成功情况
      return {
        success: true,
        code: 0,
        message: "模拟：密码重置邮件已发送，请查收您的邮箱",
      };
    } catch (error) {
      console.error("模拟密码重置失败:", error);
      return {
        success: false,
        code: -1,
        message: "模拟请求出错: " + (error.message || error.toString()),
      };
    }
  },

  /** 获取当前已登录用户的信息
   *
   * 功能说明：
   * - 从本地 TokenManager 中获取存储的 JWT Token。
   * - 判断 Token 是否存在或已过期，若无效则返回失败。
   * - 调用后端用户信息接口（如 `/api/user/me`）并携带 Authorization 头部。
   * - 对响应结果进行解析，如果成功返回用户信息，否则返回失败信息。
   *
   * 返回值：
   * - 成功：
   *   {
   *     success: true,
   *     code: 0,
   *     user: { id, username, email, role, ... },
   *     message: '获取成功'
   *   }
   * - 失败：
   *   {
   *     success: false,
   *     code: 响应状态码 或 -1,
   *     message: 错误描述
   *   }
   *
   * 注意事项：
   * - 要求后端接口支持 Bearer Token 认证。
   * - 依赖 TokenManager 提供的 `getToken`、`isTokenExpired`、`parseToken` 方法。
   * - 依赖 `endpoints.getUserInfo` 指向正确的用户信息接口地址。
   * - 依赖 `parseResponse` 对后端统一响应格式进行解析。
   */
  async getCurrentUser() {
    try {
      // 获取有效的 Token
      const tokenResult = await getValidToken();
      if (!tokenResult.success) {
        return tokenResult; // 直接返回错误信息
      }
      const token = tokenResult.token;

      const response = await fetch(endpoints.getUserInfo, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // 添加 Token 到请求头
        },
      });

      const text = await response.text();

      if (!response.ok) {
        return {
          success: false,
          code: response.status,
          message: `获取用户信息失败，状态码: ${response.status}`,
        };
      }

      const [ok, result] = parseResponse(text);

      if (ok && result.user) {
        return {
          success: true,
          code: result.code || 0,
          user: result.user,
          message: result.message || '获取成功',
        };
      }

      return {
        success: false,
        code: result.code || -1,
        message: result.message || '用户信息返回格式错误',
      };
    } catch (err) {
      return {
        success: false,
        code: -1,
        message: '请求失败，错误信息: ' + (err.message || err.toString()),
      };
    }
  },

  /** 验证token有效性
   * 
   * 验证 Token 是否有效（包括本地格式检查 + 服务器端验证）
   * @param token 要验证的 JWT Token
   * @returns 验证结果对象，包含 success 状态和附加信息
   */
  async verifyToken(token) {
    try {
      // 1. 本地检查
      if (!token || TokenManager.isTokenExpired(token)) {
        return {
          success: false,
          code: 401,
          message: 'Token 无效或已过期',
        };
      }

      // 2. 调用后端验证接口
      const response = await fetch(endpoints.verifyToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // 推荐放在 Authorization Header 中
        },
        body: JSON.stringify({ token }), // 可选，看服务端设计
      });

      const text = await response.text();

      if (!response.ok) {
        return {
          success: false,
          code: response.status,
          message: `服务器验证失败，状态码: ${response.status}`,
        };
      }

      const [ok, result] = parseResponse(text);

      if (ok) {
        return {
          success: true,
          code: result.code || 0,
          message: result.message || 'Token 验证通过',
          payload: result.payload || {}, // 如需返回用户信息
        };
      } else {
        return {
          success: false,
          code: result.code || 401,
          message: result.message || 'Token 验证失败',
        };
      }
    } catch (err) {
      return {
        success: false,
        code: -1,
        message: 'Token 验证请求失败，错误信息: ' + (err.message || err.toString()),
      };
    }
  },

  /**  发送重置密码请求到服务器
   *
   * 密码重置流程说明：
   * 
   * 1. 用户提交邮箱，发起重置请求
   *    POST /api/request-password-reset
   *    {
   *      "email": "user@example.com"
   *    }
   * 
   * 2. 服务器做的事情：
   *    - 验证邮箱是否存在
   *    - 生成一个一次性、短期有效的 Token（例如 JWT 或带签名的 UUID）
   *    - 构造一个链接：
   *      https://your-frontend.com/reset-password?token=abcd1234
   *    - 把这个链接通过邮件发送给用户
   * 
   * 3. 用户收到邮件，点击链接：
   *    - 用户在浏览器中打开类似：
   *      https://your-frontend.com/reset-password?token=abcd1234
   *    - 前端从 URL 中解析出 token，保存到状态或隐藏字段中
   * 
   * 4. 用户填写新密码并提交：
   *    POST /api/reset-password
   *    {
   *      "token": "abcd1234",
   *      "newPassword": "MyNewPassword123"
   *    }
   *
   * @param email 用户邮箱
   * @returns     包含操作是否成功的信息对象
   */
  async resetPassword(email) {
    try {
      const response = await fetch(endpoints.resetPassword, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const text = await response.text();

      if (!response.ok) {
        return {
          success: false,
          code: response.status,
          message: `密码重置失败，状态码: ${response.status}`,
        };
      }

      const [ok, result] = parseResponse(text);

      if (ok) {
        return {
          success: true,
          code: result.code || 0,
          message: result.message || '密码重置邮件已发送，请查收邮箱',
        };
      }

      return {
        success: false,
        code: result.code || -1,
        message: result.message || '密码重置失败',
      };
    } catch (err) {
      return {
        success: false,
        code: -1,
        message: '密码重置请求失败，错误信息: ' + (err.message || err.toString()),
      };
    }
  },

  /** 修改用户密码
   * 
   * @param oldPassword 旧密码
   * @param newPassword 新密码
   * @returns 包含操作是否成功及提示信息的对象
   */
  async changePassword(oldPassword, newPassword) {
    try {
      // 获取有效的 Token
      const tokenResult = await getValidToken();
      if (!tokenResult.success) {
        return tokenResult; // 直接返回错误信息
      }
      const token = tokenResult.token;

      const response = await fetch(endpoints.changePassword, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // 携带token认证
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const text = await response.text();

      if (!response.ok) {
        return {
          success: false,
          code: response.status,
          message: `密码修改失败，状态码: ${response.status}`,
        };
      }

      const [ok, result] = parseResponse(text);

      if (ok) {
        return {
          code: result.code || 0,
          success: true,
          message: result.message || "密码修改成功",
        };
      }

      return {
        success: false,
        code: result.code || -1,
        message: result.message || "密码修改失败",
      };
    } catch (err) {
      return {
        success: false,
        code: -1,
        message: "密码修改请求失败，错误信息: " + (err.message || err.toString()),
      };
    }
  },
}

// 认证状态管理Hook
export function useAuth() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        let token = TokenManager.getToken();

        if (!token || TokenManager.isTokenExpired(token)) {
          const refreshResult = await authAPI.refreshToken();
          if (refreshResult.success) {
            token = refreshResult.token;
          } else {
            setUser(null);
            setIsAuthenticated(false);
            return;
          }
        }

        const currentUser = await authAPI.getCurrentUser();
        if (currentUser.success) {
          setUser(currentUser.user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('检查认证状态失败:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login(credentials);

      if (response.success) {
        TokenManager.saveToken(response.token);
        if (response.refreshToken) {
          TokenManager.saveRefreshToken(response.refreshToken);
        }
        setUser(response.user);
        setIsAuthenticated(true);
      }

      return response;
    } catch (error) {
      console.error('登录失败:', error);
      return { success: false, message: '登录过程中发生错误' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('登出失败:', error);
    } finally {
      TokenManager.clearToken();
      TokenManager.clearRefreshToken();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      const response = await authAPI.register(userData);
      return response;
    } catch (error) {
      console.error('注册失败:', error);
      return { success: false, message: '注册过程中发生错误' };
    } finally {
      setIsLoading(false);
    }
  };

  return { user, isAuthenticated, isLoading, login, logout, register };
}
