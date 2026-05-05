"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { authAPI } from "@/features/auth/api"

const REMEMBERED_USERNAME_KEY = "rememberedUsername"
const PASSWORD_RESET_COMPLETE_KEY = "passwordResetComplete"
const FIXED_TENANT_ID = "public"
const DEFAULT_USERNAME = "admin"
const DEFAULT_PASSWORD = "admin@1234"

export function useLoginHandlers() {
  const t = useTranslations("auth")
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")
  const [username, setUsername] = useState(DEFAULT_USERNAME)
  const [password, setPassword] = useState(DEFAULT_PASSWORD)
  const [usernameEdited, setUsernameEdited] = useState(false)
  const [passwordEdited, setPasswordEdited] = useState(false)

  useEffect(() => {
    const passwordResetComplete = sessionStorage.getItem(PASSWORD_RESET_COMPLETE_KEY) === "1"
    if (passwordResetComplete) {
      sessionStorage.removeItem(PASSWORD_RESET_COMPLETE_KEY)
      setPassword("")
      setPasswordEdited(true)
      setMessage(t("resetPasswordDoneDescription"))
      setMessageType("success")
    }

    const savedUsername = localStorage.getItem(REMEMBERED_USERNAME_KEY)
    if (savedUsername) {
      setUsername(savedUsername)
      setRememberMe(true)
      setUsernameEdited(true)
    }
  }, [t])

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev)
  }

  const handleRememberMe = (e) => {
    const checked = e.target.checked
    setRememberMe(checked)

    if (!checked) {
      localStorage.removeItem(REMEMBERED_USERNAME_KEY)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")
    setMessageType("")

    const formData = new FormData(e.currentTarget)
    const credentials = {
      username: formData.get("username")?.toString().trim(),
      password: formData.get("password")?.toString().trim(),
      tenantId: FIXED_TENANT_ID,
    }

    if (!credentials.username || !credentials.password) {
      setMessage(t("missingCredentials"))
      setMessageType("error")
      setIsLoading(false)
      return
    }

    try {
      const response = await authAPI.login(credentials)

      if (!response.success) {
        setMessage(response.message || t("loginFailed"))
        setMessageType("error")
        return
      }

      setMessage(t("loginSuccess"))
      setMessageType("success")

      if (rememberMe) {
        localStorage.setItem(REMEMBERED_USERNAME_KEY, credentials.username)
      } else {
        localStorage.removeItem(REMEMBERED_USERNAME_KEY)
      }

      router.push("/frame")
    } catch (error) {
      console.error("Login failed:", error)
      setMessage(t("loginError"))
      setMessageType("error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = () => {
    router.push("/forgot-password")
  }

  return {
    showPassword,
    isLoading,
    rememberMe,
    message,
    messageType,
    username,
    setUsername,
    usernameEdited,
    setUsernameEdited,
    password,
    setPassword,
    passwordEdited,
    setPasswordEdited,
    handleTogglePassword,
    handleLogin,
    handleForgotPassword,
    handleRememberMe,
    fixedTenantId: FIXED_TENANT_ID,
  }
}
