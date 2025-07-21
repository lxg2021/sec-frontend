"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Lock, User } from "lucide-react"                              // 图标组件
import { useLoginHandlers } from "@/lib/loginHandlers"
import LoginAnimation from "@/components/loginanimation"
import { useRouter } from 'next/navigation'

// 使用图片的Cypher LOGO组件
const CypherLogo = ({ className = "w-8 h-8" }) => {
  return <img src="/logo.svg?height=64&width=64" alt="Cypher Logo" className={className} />
}

export default function LoginForm() {
  const {
    showPassword,
    isLoading,
    handleTogglePassword,
    handleLogin,
    handleForgotPassword,
    handleRegister,
    handleRememberMe,
  } = useLoginHandlers()

  const router = useRouter();

  const handleForgotPassword2 = () => {
    router.push('/forgot-password')
  };


  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* 动态背景画布 */}
      <LoginAnimation />

      {/* 主要内容 */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            {/* <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl mb-4 shadow-2xl border border-blue-500/30"> */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 shadow-2xl border border-blue-500/30">
              <CypherLogo className="w-16 h-16" />
            </div>
          </div>

          {/* 登录卡片 */}
          <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center text-white">登录账户</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white">
                    用户名
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="请输入用户名"
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">
                    密码
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="请输入密码"
                      className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400"
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
                      onChange={handleRememberMe}
                      className="rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <span>记住我</span>
                  </label>

                  {/* 忘记密码链接 */}
                  <button
                    type="button"
                    onClick={handleForgotPassword2}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    忘记密码？
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2.5 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>登录中...</span>
                    </div>
                  ) : (
                    "登录"
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

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
