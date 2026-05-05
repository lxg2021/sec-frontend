"use client"

import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { CheckCircle, Eye, EyeOff, Lock, User, AlertCircle } from "lucide-react"                              // 图标组件
import { useTranslations } from "next-intl"
import { useLoginHandlers } from "@/features/auth/hooks/use-login-handlers"
import LoginAnimation from "@/features/auth/components/login-animation"
import { LanguageSwitch } from "@/shared/i18n/language-switch"
import Link from 'next/link'

// 使用图片的Cypher LOGO组件
const CypherLogo = ({ className = "w-8 h-8", alt = "WatchPoint logo" }) => {
  return <img src="/logo.svg?height=64&width=64" alt={alt} className={className} />
}

export default function LoginForm() {
  const t = useTranslations("auth")
  const {
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
    fixedTenantId,
  } = useLoginHandlers()


  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* 动态背景画布 */}
      <LoginAnimation />

      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitch className="text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 rounded-lg" />
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            {/* <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl mb-4 shadow-2xl border border-blue-500/30"> */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 shadow-2xl border border-blue-500/30">
              <CypherLogo className="w-16 h-16" alt={t("logoAlt")} />
            </div>
          </div>

          {/* 登录卡片 */}
          <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center text-white">{t("loginTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tenant" className="text-white">
                    {t("tenant")}
                  </Label>
                  <Input
                    id="tenant"
                    name="tenant"
                    type="text"
                    value={fixedTenantId}
                    readOnly
                    className="bg-white/5 border-white/10 text-slate-400 cursor-not-allowed pl-3"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white">
                    {t("username")}
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder={t("usernamePlaceholder")}
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value)
                        setUsernameEdited(true)
                      }}
                      className={`pl-10 bg-white/10 border-white/20 focus:border-blue-400 focus:ring-blue-400 ${
                        usernameEdited ? "text-white" : "text-slate-400"
                      } placeholder:text-slate-400`}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">
                    {t("password")}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("passwordPlaceholder")}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setPasswordEdited(true)
                      }}
                      className={`pl-10 pr-10 bg-white/10 border-white/20 focus:border-blue-400 focus:ring-blue-400 ${
                        passwordEdited ? "text-white" : "text-slate-400"
                      } placeholder:text-slate-400`}
                      required
                    />
                    <button
                      type="button"
                      onClick={handleTogglePassword}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={handleRememberMe}
                      className="rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <span>{t("rememberMe")}</span>
                  </label>

                  {/* 忘记密码链接 */}
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {t("forgotPassword")}
                  </button>
                </div>

                {/* 消息提示 */}
                {message && messageType === "error" && (
                  <div className="flex items-center space-x-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span className="text-red-300 text-sm">{message}</span>
                  </div>
                )}
                {message && messageType === "success" && (
                  <div className="flex items-center space-x-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-green-300 text-sm">{message}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2.5 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{t("loggingIn")}</span>
                    </div>
                  ) : (
                    t("login")
                  )}
                </Button>
              </form>

              {/* 注销注册,后续由[用户管理]来添加用户 */}
              {/*
                    <div className="mt-6 text-center">
                      <p className="text-slate-400 text-sm">
                        还没有账户？{" "}
                        <button onClick={handleRegister} className="text-blue-400 hover:text-blue-300 transition-colors">
                          立即注册
                        </button>
                      </p>
                    </div>
              */}

              {/* 信息采集页面 - 优化后的版本 */}
              <div className="mt-8 pt-4 border-t border-white/10">
                <p className="text-center text-slate-400 text-sm">
                  {t("needCollectHostInfo")}{" "}
                  <Link
                    href="/collection"
                    className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                  >
                    {t("goCollection")}
                  </Link>
                </p>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
