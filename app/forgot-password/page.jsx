"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, CircleArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import { authAPI } from "@/lib/auth"
import { useRouter } from 'next/navigation'


export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)       // 控制提交按钮显示和是否可用
  const [message, setMessage] = useState("")              // 重置返回的消息,控制显示
  const [messageType, setMessageType] = useState("")      // "success" | "error" 错误类型
  const [isSubmitted, setIsSubmitted] = useState(false)   // 是否已提交表单，控制提示，显示内容
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      // const response = await authAPI.resetPassword(email)
      const response = await authAPI.mockResetPassword(email)

      if (response.success) {
        setMessageType("success")
        setMessage(response.message)
        setIsSubmitted(true)
      } else {
        setMessageType("error")
        setMessage(response.message)
      }
    } catch (error) {
      setMessageType("error")
      setMessage("发送重置邮件失败，请稍后重试")
    } finally {
      setIsLoading(false)
    }
  }

  /* 路由跳转到登录页面 */
  const handleBackToLogin = () => {
	  router.push('/login')
  }

  /* 重新发送，重置密码，重新渲染 */
  const handleResendEmail = () => {
    setIsSubmitted(false)
    setMessage("")
    setMessageType("")
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">

      {/* 返回登录按钮 - 左上角 */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={handleBackToLogin}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
          title="返回登录页面"
        >
          <CircleArrowLeft className="w-6 h-6" />
          <span className="text-sm">返回登录</span>
        </button>
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          {/* 忘记密码卡片 */}
          <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl text-white">{isSubmitted ? "邮件已发送" : "忘记密码"}</CardTitle>
              <p className="text-slate-300 text-sm">
                {isSubmitted ? "请检查您的邮箱并按照说明重置密码" : "输入您的邮箱地址，我们将发送重置密码的链接"}
              </p>
            </CardHeader>
            <CardContent>
              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">
                      邮箱地址
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="请输入您的邮箱地址"
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        style={{
                          "--tw-ring-color": `rgb(var(--focus-color))`,
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = `rgb(var(--focus-color))`
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "rgb(255 255 255 / 0.2)"
                        }}
                        required
                      />
                    </div>
                  </div>

                  {/* 错误消息 */}
                  {message && messageType === "error" && (
                    <div className="flex items-center space-x-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span className="text-red-300 text-sm">{message}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full text-white font-medium py-2.5 transition-all duration-200 transform hover:scale-[1.02] shadow-lg border-0"
                    style={{
                      background: `linear-gradient(135deg, rgb(var(--theme-primary)), rgb(var(--theme-primary) / 0.8))`,
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = `linear-gradient(135deg, rgb(var(--theme-primary) / 0.9), rgb(var(--theme-primary) / 0.7))`
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = `linear-gradient(135deg, rgb(var(--theme-primary)), rgb(var(--theme-primary) / 0.8))`
                    }}
                    disabled={isLoading || !email.trim()}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>发送中...</span>
                      </div>
                    ) : (
                      "发送重置邮件"
                    )}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">

                  {/* 重置密码邮件成功消息 */}
                  <div className="flex items-center space-x-2 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <div className="text-green-300">
                      <p className="font-medium">重置邮件已发送！</p>
                      <p className="text-sm text-green-400 mt-1">
                        我们已向 <span className="font-medium">{email}</span> 发送了密码重置链接
                      </p>
                    </div>
                  </div>

                  {/* 提示信息 */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">接下来该怎么做？</h4>
                    <ul className="text-slate-300 text-sm space-y-1">
                      <li>• 检查您的邮箱收件箱</li>
                      <li>• 如果没有收到，请检查垃圾邮件文件夹</li>
                      <li>• 点击邮件中的重置链接</li>
                      <li>• 按照说明设置新密码</li>
                    </ul>
                  </div>

                  {/* 重新发送按钮 */}
                  <div className="flex space-x-3">
                    <Button
                      onClick={handleResendEmail}
                      variant="outline"
                      className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
                    >
                      重新发送
                    </Button>
                    <Button
                      onClick={handleBackToLogin}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2.5 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                    >
                      返回登录
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  )
}
