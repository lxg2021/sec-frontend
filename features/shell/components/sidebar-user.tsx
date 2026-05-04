"use client"

import { useState, useEffect, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/shared/ui/context-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Button } from "@/shared/ui/button"
import { useToast } from "@/shared/hooks/use-toast"
import type { UserProfile } from "@/features/user/api"
import { User, Settings, Key, LogOut, Trash2, ShieldCheck, ShieldOff } from "lucide-react"

type DialogType = "profile" | "edit" | "password" | "delete" | null

interface SidebarUserProps {
  collapsed?: boolean
  getUserProfile: () => Promise<UserProfile>
  updateUserProfile: (data: {
    nickname: string
    phone?: string
    email: string
  }) => Promise<{ success: boolean; message: string; data?: UserProfile }>
  updatePassword: (data: {
    oldPassword: string
    newPassword: string
  }) => Promise<{ success: boolean; message: string }>
  enableTwoFactor: () => Promise<{ success: boolean; message: string; data?: UserProfile }>
  disableTwoFactor: () => Promise<{ success: boolean; message: string; data?: UserProfile }>
  deleteAccount: (confirmText: string) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<{ success: boolean; message: string }>
}

export function SidebarUser({
  collapsed = false,
  getUserProfile,
  updateUserProfile,
  updatePassword,
  enableTwoFactor,
  disableTwoFactor,
  deleteAccount,
  logout,
}: SidebarUserProps) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState<DialogType>(null)
  const [formData, setFormData] = useState({
    nickname: "",
    phone: "",
    email: "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
    deleteConfirm: "",
  })
  const { toast } = useToast()

  const loadUserProfile = useCallback(async () => {
    try {
      setLoading(true)
      const profile = await getUserProfile()
      setUser(profile)
      setFormData((prev) => ({
        ...prev,
        nickname: profile.nickname,
        phone: profile.phone || "",
        email: profile.email,
      }))
    } catch (error) {
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "加载用户信息失败",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [getUserProfile, toast])

  useEffect(() => {
    loadUserProfile()
  }, [loadUserProfile])

  const handleUpdateProfile = async () => {
    try {
      const result = await updateUserProfile({
        nickname: formData.nickname,
        phone: formData.phone || undefined,
        email: formData.email,
      })
      setUser(result.data!)
      toast({
        title: "成功",
        description: result.message,
      })
      setDialogOpen(null)
    } catch (error) {
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "更新失败",
        variant: "destructive",
      })
    }
  }

  const handleUpdatePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "错误",
        description: "两次输入的密码不一致",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await updatePassword({
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      })
      toast({
        title: "成功",
        description: result.message,
      })
      setDialogOpen(null)
      setFormData((prev) => ({
        ...prev,
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      }))
    } catch (error) {
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "修改密码失败",
        variant: "destructive",
      })
    }
  }

  const handleToggleTwoFactor = useCallback(async () => {
    if (!user) return

    try {
      const result = user.twoFactorEnabled ? await disableTwoFactor() : await enableTwoFactor()
      setUser(result.data!)
      toast({
        title: "成功",
        description: result.message,
      })
    } catch (error) {
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "操作失败",
        variant: "destructive",
      })
    }
  }, [user, enableTwoFactor, disableTwoFactor, toast])

  const handleDeleteAccount = async () => {
    if (formData.deleteConfirm !== "CONFIRM_DELETE") {
      toast({
        title: "错误",
        description: "请输入正确的确认文本",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await deleteAccount(formData.deleteConfirm)
      toast({
        title: "成功",
        description: result.message,
      })
      setDialogOpen(null)
      await loadUserProfile()
    } catch (error) {
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "注销账户失败",
        variant: "destructive",
      })
    }
  }

  const handleLogout = useCallback(async () => {
    try {
      const result = await logout()
      toast({
        title: "成功",
        description: result.message,
      })
      window.location.href = "/login"
    } catch (error) {
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "退出登录失败",
        variant: "destructive",
      })
    }
  }, [logout, toast])

  if (loading || !user) {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 ${collapsed ? 'justify-center' : ''}`}>
        <div className="h-10 w-10 rounded-full bg-slate-700 animate-pulse" />
        {!collapsed && (
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-slate-700 rounded animate-pulse" />
            <div className="h-3 w-32 bg-slate-700 rounded animate-pulse" />
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={`
            flex items-center gap-3 p-3 rounded-lg
            text-slate-400 border border-transparent
            transition-colors
            cursor-pointer
            ${collapsed ? 'justify-center' : ''}

            hover:text-white
            hover:bg-gradient-to-r hover:from-slate-800/50 hover:to-slate-700/50
            hover:border-slate-600/30
          `}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.nickname} />
              <AvatarFallback className="bg-slate-700 text-slate-300">
                {user.nickname.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.nickname}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent
          className="w-56"
          collisionPadding={8} // 避免边缘贴边
        >
          <ContextMenuItem onClick={() => setDialogOpen("profile")}>
            <User className="mr-2 h-4 w-4" />
            查看资料
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setDialogOpen("edit")}>
            <Settings className="mr-2 h-4 w-4" />
            编辑信息
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setDialogOpen("password")}>
            <Key className="mr-2 h-4 w-4" />
            修改密码
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleToggleTwoFactor}>
            {user.twoFactorEnabled ? (
              <>
                <ShieldOff className="mr-2 h-4 w-4" />
                关闭双重认证
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                开启双重认证
              </>
            )}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            退出登录
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => setDialogOpen("delete")}
            className="text-red-400 focus:text-red-400"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            注销账户
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* 查看资料对话框 */}
      <Dialog open={dialogOpen === "profile"} onOpenChange={(open) => !open && setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>用户资料</DialogTitle>
            <DialogDescription>查看您的个人信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.nickname} />
                <AvatarFallback>{user.nickname.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.nickname}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">用户ID:</span>
                <span className="font-mono">{user.id}</span>
              </div>
              {user.phone && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">手机号:</span>
                  <span>{user.phone}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">邮箱:</span>
                <span>{user.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">双重认证:</span>
                <span className={user.twoFactorEnabled ? "text-green-600" : ""}>
                  {user.twoFactorEnabled ? "已开启" : "未开启"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">创建时间:</span>
                <span>{new Date(user.createdAt).toLocaleDateString("zh-CN")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">更新时间:</span>
                <span>{new Date(user.updatedAt).toLocaleDateString("zh-CN")}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑信息对话框 */}
      <Dialog open={dialogOpen === "edit"} onOpenChange={(open) => !open && setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑信息</DialogTitle>
            <DialogDescription>修改您的个人信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">昵称</Label>
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={(e) => setFormData((prev) => ({ ...prev, nickname: e.target.value }))}
                placeholder="请输入昵称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="请输入邮箱"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">手机号</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="请输入手机号"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>
              取消
            </Button>
            <Button onClick={handleUpdateProfile}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 修改密码对话框 */}
      <Dialog open={dialogOpen === "password"} onOpenChange={(open) => !open && setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改密码</DialogTitle>
            <DialogDescription>请输入旧密码和新密码</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="oldPassword">旧密码</Label>
              <Input
                id="oldPassword"
                type="password"
                value={formData.oldPassword}
                onChange={(e) => setFormData((prev) => ({ ...prev, oldPassword: e.target.value }))}
                placeholder="请输入旧密码"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码</Label>
              <Input
                id="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData((prev) => ({ ...prev, newPassword: e.target.value }))}
                placeholder="请输入新密码(至少6位,包含字母和数字)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认新密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="请再次输入新密码"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>
              取消
            </Button>
            <Button onClick={handleUpdatePassword}>确认修改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 注销账户对话框 */}
      <Dialog open={dialogOpen === "delete"} onOpenChange={(open) => !open && setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">注销账户</DialogTitle>
            <DialogDescription>
              此操作不可逆,请谨慎操作。请输入 <code className="font-mono font-bold">CONFIRM_DELETE</code> 以确认注销。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deleteConfirm">确认文本</Label>
              <Input
                id="deleteConfirm"
                value={formData.deleteConfirm}
                onChange={(e) => setFormData((prev) => ({ ...prev, deleteConfirm: e.target.value }))}
                placeholder="请输入 CONFIRM_DELETE"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              确认注销
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
