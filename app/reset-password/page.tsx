"use client"

import { useMemo, useState, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { AlertCircle, CheckCircle, CircleArrowLeft, Eye, EyeOff, Lock } from "lucide-react"
import { authAPI } from "@/features/auth/api"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { LanguageSwitch } from "@/shared/i18n/language-switch"

function getParam(value: string | null) {
  return value?.trim() || ""
}

function StatusMessage({
  message,
  type,
}: {
  message: string
  type: "success" | "error" | ""
}) {
  if (!message || !type) return null

  const isSuccess = type === "success"
  const Icon = isSuccess ? CheckCircle : AlertCircle

  return (
    <div
      className={`flex items-center gap-2 p-3 rounded-lg border ${
        isSuccess
          ? "bg-green-500/10 border-green-500/20 text-green-300"
          : "bg-red-500/10 border-red-500/20 text-red-300"
      }`}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 ${isSuccess ? "text-green-400" : "text-red-400"}`} />
      <span className="text-sm">{message}</span>
    </div>
  )
}

export default function ResetPasswordPage() {
  const t = useTranslations("auth")
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = useMemo(() => getParam(searchParams.get("token")), [searchParams])
  const tenantId = useMemo(() => getParam(searchParams.get("tenant_id")) || "public", [searchParams])
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "">("")
  const [isSuccess, setIsSuccess] = useState(false)

  const handleBackToLogin = () => {
    router.push("/login")
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage("")
    const newPassword = password.trim()
    const newConfirmPassword = confirmPassword.trim()

    if (!token) {
      setMessageType("error")
      setMessage(t("resetTokenMissing"))
      return
    }

    if (!newPassword || newPassword.length < 6) {
      setMessageType("error")
      setMessage(t("newPasswordInvalid"))
      return
    }

    if (newPassword !== newConfirmPassword) {
      setMessageType("error")
      setMessage(t("passwordMismatch"))
      return
    }

    setIsLoading(true)

    try {
      const response = await authAPI.confirmPasswordReset(token, newPassword, tenantId)

      if (response.success) {
        sessionStorage.setItem("passwordResetComplete", "1")
        setMessageType("success")
        setMessage(t("resetPasswordSuccess"))
        setIsSuccess(true)
      } else {
        setMessageType("error")
        setMessage(response.message || t("resetPasswordFailed"))
      }
    } catch {
      setMessageType("error")
      setMessage(t("resetPasswordFailed"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      <div className="fixed top-4 left-4 z-50">
        <Link
          href="/login"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
          title={t("backToLoginTitle")}
        >
          <CircleArrowLeft className="w-5 h-5" />
          <span className="text-sm">{t("backToLogin")}</span>
        </Link>
      </div>

      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitch className="text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 rounded-lg" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl text-white">
                {isSuccess ? t("resetPasswordDoneTitle") : t("resetPasswordTitle")}
              </CardTitle>
              <p className="text-slate-300 text-sm">
                {isSuccess ? t("resetPasswordDoneDescription") : t("resetPasswordDescription")}
              </p>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <StatusMessage message={message} type={messageType} />
              </div>

              {!isSuccess ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tenant" className="text-white">
                      {t("tenant")}
                    </Label>
                    <Input
                      id="tenant"
                      name="tenant"
                      type="text"
                      value={tenantId}
                      readOnly
                      className="bg-white/5 border-white/10 text-slate-400 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="token" className="text-white">
                      {t("resetToken")}
                    </Label>
                    <Input
                      id="token"
                      name="token"
                      type="text"
                      value={token}
                      readOnly
                      className="bg-white/5 border-white/10 text-slate-400 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">
                      {t("newPassword")}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t("newPasswordPlaceholder")}
                        className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white">
                      {t("confirmNewPassword")}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t("confirmNewPasswordPlaceholder")}
                        className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full text-white font-medium py-2.5 transition-all duration-200 transform hover:scale-[1.02] shadow-lg border-0"
                    style={{
                      background: `linear-gradient(135deg, rgb(var(--theme-primary)), rgb(var(--theme-primary) / 0.8))`,
                    }}
                    disabled={isLoading || !token}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{t("resettingPassword")}</span>
                      </div>
                    ) : (
                      t("resetPasswordAction")
                    )}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <div className="text-green-300">
                      <p className="font-medium">{t("resetPasswordSuccess")}</p>
                      <p className="text-sm text-green-400 mt-1">{t("resetPasswordDoneDescription")}</p>
                    </div>
                  </div>

                  <Button
                    onClick={handleBackToLogin}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2.5 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                  >
                    {t("backToLogin")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
