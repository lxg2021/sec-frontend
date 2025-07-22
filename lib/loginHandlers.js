"use client"

import { useState, useEffect } from "react"
import { authAPI } from "./auth"
import { useRouter } from 'next/navigation'

export function useLoginHandlers() {
  const [showPassword, setShowPassword] = useState(false) // 用于密码显示/隐藏
  const [isLoading, setIsLoading] = useState(false) // 用于登录按钮加载状态
  const [rememberMe, setRememberMe] = useState(false) // 用于CheckMe勾选渲染
  const [message, setMessage] = useState("")    // 登录返回的消息,控制显示
  const [messageType, setMessageType] = useState("") // "success" | "error" 错误类型
  const [username, setUsername] = useState("")    // 用于存储用户名
  const router = useRouter();

  // 初始化时检查是否有记住的用户名
  useEffect(() => {
    const savedUsername = localStorage.getItem("rememberedUsername")
    if (savedUsername) {
      setUsername(savedUsername)
      setRememberMe(true)
    }
  }, [])

  // 切换密码显示/隐藏
  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev)
  }

  // 处理记住我选项
  const handleRememberMe = (e) => {
    const checked = e.target.checked
    setRememberMe(checked)

    // 用户取消勾选时，清除已保存的用户名
    if (!checked) {
      localStorage.removeItem("rememberedUsername")
    }
  }

  // 处理登录逻辑
  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")
    setMessageType("")

    const formData = new FormData(e.currentTarget)
    const credentials = {
      username: formData.get("username")?.toString().trim(),
      password: formData.get("password")?.toString(),
    }

    if (!credentials.username || !credentials.password) {
      setMessage("请输入用户名和密码")
      setMessageType("error")
      setIsLoading(false)
      return
    }

    try {
      // const response = await authAPI.login(credentials)
      const response = await authAPI.mockLogin(credentials)

      if (response.success) {
        setMessage("登录成功，正在跳转...")
        setMessageType("success")

        if (rememberMe) {
          localStorage.setItem("rememberedUsername", credentials.username)
        } else {
          localStorage.removeItem("rememberedUsername")
        }

        router.push("/dashboard") // 可按需修改跳转目标

      } else {
        setMessage(response.message || "登录失败")
        setMessageType("error")
      }
    } catch (error) {
      console.error("登录异常:", error)
      setMessage("发生错误，请稍后重试")
      setMessageType("error")
    } finally {
      setIsLoading(false)
    }
  }


  // 处理忘记密码
  const handleForgotPassword = () => {
    router.push('/forgot-password')
  }


  return {
    showPassword,
    isLoading,
    rememberMe,
    message,
    messageType,
    username,
    setUsername,
    handleTogglePassword,
    handleLogin,
    handleForgotPassword,
    handleRememberMe,
  }
}
