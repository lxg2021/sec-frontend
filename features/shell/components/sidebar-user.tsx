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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { useToast } from "@/shared/hooks/use-toast"
import type { UserProfile } from "@/features/user/api"
import {
  User,
  Settings,
  Key,
  LogOut,
  Trash2,
  ShieldCheck,
  ShieldOff,
  UserPlus,
  Mail,
  Phone,
  LockKeyhole,
  Users,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

type DialogType = "profile" | "create" | "edit" | "password" | "delete" | null

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
  createUser: (data: {
    username: string
    email: string
    phone?: string
    password: string
    avatar?: string
    role: number
  }) => Promise<{ success: boolean; message: string }>
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
  createUser,
  logout,
}: SidebarUserProps) {
  const t = useTranslations("shell.user")
  const tCommon = useTranslations("common")
  const locale = useLocale()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [submittingCreateUser, setSubmittingCreateUser] = useState(false)
  const [createUserResult, setCreateUserResult] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const [dialogOpen, setDialogOpen] = useState<DialogType>(null)
  const [formData, setFormData] = useState({
    nickname: "",
    phone: "",
    email: "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
    deleteConfirm: "",
    createUsername: "",
    createEmail: "",
    createPhone: "",
    createPassword: "",
    createConfirmPassword: "",
    createRole: "2",
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
        title: tCommon("error"),
        description: error instanceof Error ? error.message : t("loadFailed"),
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
        title: tCommon("success"),
        description: result.message,
      })
      setDialogOpen(null)
    } catch (error) {
      toast({
        title: tCommon("error"),
        description: error instanceof Error ? error.message : t("updateFailed"),
        variant: "destructive",
      })
    }
  }

  const handleUpdatePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: tCommon("error"),
        description: t("passwordMismatch"),
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
        title: tCommon("success"),
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
        title: tCommon("error"),
        description: error instanceof Error ? error.message : t("passwordUpdateFailed"),
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
        title: tCommon("success"),
        description: result.message,
      })
    } catch (error) {
      toast({
        title: tCommon("error"),
        description: error instanceof Error ? error.message : t("operationFailed"),
        variant: "destructive",
      })
    }
  }, [user, enableTwoFactor, disableTwoFactor, toast])

  const handleDeleteAccount = async () => {
    if (formData.deleteConfirm !== "CONFIRM_DELETE") {
      toast({
        title: tCommon("error"),
        description: t("confirmTextInvalid"),
        variant: "destructive",
      })
      return
    }

    try {
      const result = await deleteAccount(formData.deleteConfirm)
      toast({
        title: tCommon("success"),
        description: result.message,
      })
      setDialogOpen(null)
      await loadUserProfile()
    } catch (error) {
      toast({
        title: tCommon("error"),
        description: error instanceof Error ? error.message : t("deleteFailed"),
        variant: "destructive",
      })
    }
  }

  const handleLogout = useCallback(async () => {
    try {
      const result = await logout()
      toast({
        title: tCommon("success"),
        description: result.message,
      })
      window.location.href = "/login"
    } catch (error) {
      toast({
        title: tCommon("error"),
        description: error instanceof Error ? error.message : t("logoutFailed"),
        variant: "destructive",
      })
    }
  }, [logout, toast])

  const handleCreateUser = useCallback(() => {
    setCreateUserResult(null)
    setFormData((prev) => ({
      ...prev,
      createUsername: "",
      createEmail: "",
      createPhone: "",
      createPassword: "",
      createConfirmPassword: "",
      createRole: "2",
    }))
    setDialogOpen("create")
  }, [])

  const handleSubmitCreateUser = async () => {
    setCreateUserResult(null)
    const username = formData.createUsername.trim()
    const email = formData.createEmail.trim()
    const phone = formData.createPhone.trim()

    if (username.length < 3) {
      toast({
        title: tCommon("error"),
        description: t("createUsernameInvalid"),
        variant: "destructive",
      })
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: tCommon("error"),
        description: t("createEmailInvalid"),
        variant: "destructive",
      })
      return
    }

    if (phone && !/^\+[1-9]\d{6,14}$/.test(phone)) {
      toast({
        title: tCommon("error"),
        description: t("createPhoneInvalid"),
        variant: "destructive",
      })
      return
    }

    if (formData.createPassword.length < 6) {
      toast({
        title: tCommon("error"),
        description: t("createPasswordInvalid"),
        variant: "destructive",
      })
      return
    }

    if (formData.createPassword !== formData.createConfirmPassword) {
      toast({
        title: tCommon("error"),
        description: t("passwordMismatch"),
        variant: "destructive",
      })
      return
    }

    try {
      setSubmittingCreateUser(true)
      const result = await createUser({
        username,
        email,
        phone: phone || undefined,
        password: formData.createPassword,
        role: Number(formData.createRole),
      })

      toast({
        title: tCommon("success"),
        description: result.message || t("createUserSuccess"),
      })
      setDialogOpen(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : t("createUserFailed")
      toast({
        title: tCommon("error"),
        description: message,
        variant: "destructive",
      })
      setCreateUserResult({
        type: "error",
        message,
      })
    } finally {
      setSubmittingCreateUser(false)
    }
  }

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.currentTarget.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        clientX: event.clientX,
        clientY: event.clientY,
      }),
    )
  }

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
          <button
            type="button"
            onClick={handleOpenMenu}
            className={`
            flex w-full items-center gap-3 p-3 rounded-lg
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
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-white truncate">{user.nickname}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            )}
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent
          className="w-56"
          collisionPadding={8} // 避免边缘贴边
        >
          <ContextMenuItem onClick={() => setDialogOpen("profile")}>
            <User className="mr-2 h-4 w-4" />
            {t("viewProfile")}
          </ContextMenuItem>
          {user.role === "admin" && (
            <ContextMenuItem onClick={handleCreateUser}>
              <UserPlus className="mr-2 h-4 w-4" />
              {t("createUser")}
            </ContextMenuItem>
          )}
          <ContextMenuItem onClick={() => setDialogOpen("edit")}>
            <Settings className="mr-2 h-4 w-4" />
            {t("editProfile")}
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setDialogOpen("password")}>
            <Key className="mr-2 h-4 w-4" />
            {t("changePassword")}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleToggleTwoFactor}>
            {user.twoFactorEnabled ? (
              <>
                <ShieldOff className="mr-2 h-4 w-4" />
                {t("disable2fa")}
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                {t("enable2fa")}
              </>
            )}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            {t("logout")}
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => setDialogOpen("delete")}
            className="text-red-400 focus:text-red-400"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("deleteAccount")}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* 创建用户对话框 */}
      <Dialog open={dialogOpen === "create"} onOpenChange={(open) => !open && setDialogOpen(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("createUserTitle")}</DialogTitle>
            <DialogDescription>{t("createUserDescription")}</DialogDescription>
          </DialogHeader>
          {createUserResult && (
            <div
              className={
                createUserResult.type === "success"
                  ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
                  : "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              }
            >
              {createUserResult.message}
            </div>
          )}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="createUsername" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t("username")}
                </Label>
                <Input
                  id="createUsername"
                  value={formData.createUsername}
                  onChange={(e) => setFormData((prev) => ({ ...prev, createUsername: e.target.value }))}
                  placeholder={t("usernamePlaceholder")}
                  minLength={3}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="createEmail" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t("email")}
                </Label>
                <Input
                  id="createEmail"
                  type="email"
                  value={formData.createEmail}
                  onChange={(e) => setFormData((prev) => ({ ...prev, createEmail: e.target.value }))}
                  placeholder={t("emailPlaceholder")}
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="createRole" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t("role")}
                </Label>
                <Select
                  value={formData.createRole}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, createRole: value }))}
                >
                  <SelectTrigger id="createRole">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{t("roleAdmin")}</SelectItem>
                    <SelectItem value="3">{t("roleAuditor")}</SelectItem>
                    <SelectItem value="2">{t("roleOperator")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="createPhone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {t("phone")}
                </Label>
                <Input
                  id="createPhone"
                  value={formData.createPhone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, createPhone: e.target.value }))}
                  placeholder={t("createPhonePlaceholder")}
                  pattern="^\+[1-9]\d{6,14}$"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="createPassword" className="flex items-center gap-2">
                  <LockKeyhole className="h-4 w-4" />
                  {t("newPassword")}
                </Label>
                <Input
                  id="createPassword"
                  type="password"
                  value={formData.createPassword}
                  onChange={(e) => setFormData((prev) => ({ ...prev, createPassword: e.target.value }))}
                  placeholder={t("newPasswordPlaceholder")}
                  minLength={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="createConfirmPassword" className="flex items-center gap-2">
                  <LockKeyhole className="h-4 w-4" />
                  {t("confirmPassword")}
                </Label>
                <Input
                  id="createConfirmPassword"
                  type="password"
                  value={formData.createConfirmPassword}
                  onChange={(e) => setFormData((prev) => ({ ...prev, createConfirmPassword: e.target.value }))}
                  placeholder={t("confirmPasswordPlaceholder")}
                  minLength={6}
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter className="items-center sm:justify-end sm:space-x-3">
            <Button className="w-28" variant="outline" onClick={() => setDialogOpen(null)} disabled={submittingCreateUser}>
              {t("cancel")}
            </Button>
            <Button className="w-28" onClick={handleSubmitCreateUser} disabled={submittingCreateUser}>
              {submittingCreateUser ? t("creatingUser") : t("confirmCreateUser")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 查看资料对话框 */}
      <Dialog open={dialogOpen === "profile"} onOpenChange={(open) => !open && setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("profileTitle")}</DialogTitle>
            <DialogDescription>{t("profileDescription")}</DialogDescription>
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
                <span className="text-muted-foreground">{t("userId")}</span>
                <span className="font-mono">{user.id}</span>
              </div>
              {user.phone && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("phone")}</span>
                  <span>{user.phone}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("email")}</span>
                <span>{user.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("twoFactor")}</span>
                <span className={user.twoFactorEnabled ? "text-green-600" : ""}>
                  {user.twoFactorEnabled ? t("enabled") : t("disabled")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("createdAt")}</span>
                <span>{new Date(user.createdAt).toLocaleDateString(locale)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("updatedAt")}</span>
                <span>{new Date(user.updatedAt).toLocaleDateString(locale)}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑信息对话框 */}
      <Dialog open={dialogOpen === "edit"} onOpenChange={(open) => !open && setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editTitle")}</DialogTitle>
            <DialogDescription>{t("editDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">{t("nickname")}</Label>
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={(e) => setFormData((prev) => ({ ...prev, nickname: e.target.value }))}
                placeholder={t("nicknamePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder={t("emailPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder={t("phonePlaceholder")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleUpdateProfile}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 修改密码对话框 */}
      <Dialog open={dialogOpen === "password"} onOpenChange={(open) => !open && setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("passwordTitle")}</DialogTitle>
            <DialogDescription>{t("passwordDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="oldPassword">{t("oldPassword")}</Label>
              <Input
                id="oldPassword"
                type="password"
                value={formData.oldPassword}
                onChange={(e) => setFormData((prev) => ({ ...prev, oldPassword: e.target.value }))}
                placeholder={t("oldPasswordPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t("newPassword")}</Label>
              <Input
                id="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData((prev) => ({ ...prev, newPassword: e.target.value }))}
                placeholder={t("newPasswordPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder={t("confirmPasswordPlaceholder")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleUpdatePassword}>{t("confirmChange")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 注销账户对话框 */}
      <Dialog open={dialogOpen === "delete"} onOpenChange={(open) => !open && setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">{t("deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("deleteDescription")} <code className="font-mono font-bold">CONFIRM_DELETE</code> {t("deleteDescriptionTail")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deleteConfirm">{t("confirmText")}</Label>
              <Input
                id="deleteConfirm"
                value={formData.deleteConfirm}
                onChange={(e) => setFormData((prev) => ({ ...prev, deleteConfirm: e.target.value }))}
                placeholder={t("confirmTextPlaceholder")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              {t("confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
