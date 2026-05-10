"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { MouseEvent } from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { useToast } from "@/shared/hooks/use-toast"
import type { UserListItem, UserProfile } from "@/features/user/api"
import { getAvatarByRole, hardDeleteUser, listUsers } from "@/features/user/api"
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  FileUser,
  IdCard,
  Key,
  LockKeyhole,
  LogOut,
  Mail,
  MoreHorizontal,
  Phone,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  User,
  UserCircle2,
  UserPlus,
  Users,
} from "lucide-react"

type DialogType = "profile" | "create" | "edit" | "password" | "delete" | "users" | null

interface SidebarUserProps {
  collapsed?: boolean
  classicStyle?: boolean
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

const ROLE_OPTIONS = [
  { value: "1", key: "roleAdmin" },
  { value: "3", key: "roleAuditor" },
  { value: "2", key: "roleOperator" },
]

function formatDateTime(value: string, locale: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  return date.toLocaleString(locale)
}

function compactId(value: string) {
  if (!value) return "-"
  if (value.length <= 12) return value

  return `${value.slice(0, 8)}...${value.slice(-4)}`
}

export function SidebarUser({
  collapsed = false,
  classicStyle = false,
  getUserProfile,
  updateUserProfile,
  updatePassword,
  deleteAccount,
  createUser,
  logout,
}: SidebarUserProps) {
  const t = useTranslations("shell.user")
  const tCommon = useTranslations("common")
  const locale = useLocale()
  const { toast } = useToast()

  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState<DialogType>(null)
  const [submittingCreateUser, setSubmittingCreateUser] = useState(false)
  const [submittingDeleteAccount, setSubmittingDeleteAccount] = useState(false)
  const [submittingLogout, setSubmittingLogout] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState({
    old: false,
    next: false,
    confirm: false,
  })
  const [users, setUsers] = useState<UserListItem[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersPage, setUsersPage] = useState(1)
  const [usersPageSize] = useState(10)
  const [usersSearch, setUsersSearch] = useState("")
  const [userDeleteTarget, setUserDeleteTarget] = useState<UserListItem | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
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

  const isAdmin = user?.role === "admin"
  const userButtonClassName = [
    "group flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 shadow-sm outline-none transition-all duration-200 active:translate-y-0 active:scale-[0.99]",
    collapsed ? "justify-center" : "",
    classicStyle
      ? menuOpen
        ? "border-blue-200 bg-blue-50/70 text-slate-950 shadow-md shadow-slate-200/80 ring-1 ring-blue-100"
        : "border-slate-200 bg-white/70 text-slate-600 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-slate-50 hover:text-slate-950 hover:shadow-md hover:shadow-slate-200/80 focus-visible:border-blue-300 focus-visible:ring-2 focus-visible:ring-blue-100"
      : menuOpen
        ? "border-cyan-400/30 bg-slate-800/80 text-white shadow-lg shadow-cyan-950/25 ring-1 ring-cyan-400/10"
        : "border-white/10 bg-slate-900/45 text-slate-400 hover:-translate-y-0.5 hover:border-cyan-400/25 hover:bg-slate-800/75 hover:text-white hover:shadow-lg hover:shadow-black/30 focus-visible:border-cyan-400/40 focus-visible:ring-2 focus-visible:ring-cyan-400/20",
  ]
    .filter(Boolean)
    .join(" ")
  const avatarClassName = classicStyle
    ? "h-10 w-10 ring-2 ring-slate-200 transition-all duration-200 group-hover:ring-blue-200"
    : "h-10 w-10 ring-2 ring-white/10 transition-all duration-200 group-hover:ring-cyan-300/30"
  const nameClassName = classicStyle
    ? "truncate text-sm font-medium text-slate-900"
    : "truncate text-sm font-medium text-white"
  const emailClassName = classicStyle ? "truncate text-xs text-slate-500" : "truncate text-xs text-slate-400"
  const getDisplayAvatar = (role: UserProfile["role"] | UserListItem["role"]) => getAvatarByRole(role)

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
  }, [getUserProfile, t, tCommon, toast])

  useEffect(() => {
    void loadUserProfile()
  }, [loadUserProfile])

  const roleLabel = useCallback(
    (value: string | number) => {
      const normalized = String(value).toLowerCase()
      if (normalized === "1" || normalized === "admin") return t("roleAdmin")
      if (normalized === "3" || normalized === "auditor") return t("roleAuditor")
      return t("roleOperator")
    },
    [t],
  )

  const statusLabel = useCallback(
    (value: string | number) => {
      const normalized = String(value).toLowerCase()
      if (normalized === "active" || normalized === "2") return t("statusActive")
      if (normalized === "inactive" || normalized === "3") return t("statusInactive")
      if (normalized === "locked" || normalized === "4") return t("statusLocked")
      if (normalized === "banned" || normalized === "5") return t("statusBanned")
      return t("statusPending")
    },
    [t],
  )

  const filteredUsers = useMemo(() => {
    const keyword = usersSearch.trim().toLowerCase()
    if (!keyword) return users

    return users.filter((item) =>
      [item.username, item.email, item.phone, item.userId, item.role, item.status].some((value) =>
        String(value || "").toLowerCase().includes(keyword),
      ),
    )
  }, [users, usersSearch])

  const hasNextPage = users.length === usersPageSize

  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true)
      const result = await listUsers({ page: usersPage, pageSize: usersPageSize })
      setUsers(result.items)
    } catch (error) {
      toast({
        title: tCommon("error"),
        description: error instanceof Error ? error.message : t("loadUsersFailed"),
        variant: "destructive",
      })
    } finally {
      setUsersLoading(false)
    }
  }, [t, tCommon, toast, usersPage, usersPageSize])

  useEffect(() => {
    if (dialogOpen === "users") {
      void loadUsers()
    }
  }, [dialogOpen, loadUsers])

  const handleUpdateProfile = async () => {
    try {
      const result = await updateUserProfile({
        nickname: formData.nickname,
        phone: formData.phone || undefined,
        email: formData.email,
      })
      if (result.data) {
        setUser(result.data)
      }
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
      setPasswordVisible({
        old: false,
        next: false,
        confirm: false,
      })
    } catch (error) {
      toast({
        title: tCommon("error"),
        description: error instanceof Error ? error.message : t("passwordUpdateFailed"),
        variant: "destructive",
      })
    }
  }

  const handleDeleteAccount = async () => {
    if (submittingDeleteAccount) return

    if (formData.deleteConfirm !== "CONFIRM_DELETE") {
      toast({
        title: tCommon("error"),
        description: t("confirmTextInvalid"),
        variant: "destructive",
      })
      return
    }

    try {
      setSubmittingDeleteAccount(true)
      const result = await deleteAccount(formData.deleteConfirm)
      toast({
        title: tCommon("success"),
        description: result.message,
      })
      setDialogOpen(null)
      window.location.href = "/login"
    } catch (error) {
      toast({
        title: tCommon("error"),
        description: error instanceof Error ? error.message : t("deleteFailed"),
        variant: "destructive",
      })
    } finally {
      setSubmittingDeleteAccount(false)
    }
  }

  const handleLogout = useCallback(async () => {
    if (submittingLogout) return

    try {
      setSubmittingLogout(true)
      const result = await logout()
      toast({
        title: result.success ? tCommon("success") : tCommon("error"),
        description: result.message,
        variant: result.success ? "default" : "destructive",
      })
      window.location.href = "/login"
    } catch (error) {
      toast({
        title: tCommon("error"),
        description: error instanceof Error ? error.message : t("logoutFailed"),
        variant: "destructive",
      })
    } finally {
      setSubmittingLogout(false)
    }
  }, [logout, submittingLogout, t, tCommon, toast])

  const handleCreateUser = useCallback(() => {
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
    const username = formData.createUsername.trim()
    const email = formData.createEmail.trim()
    const phone = formData.createPhone.trim()

    if (username.length < 3) {
      toast({ title: tCommon("error"), description: t("createUsernameInvalid"), variant: "destructive" })
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: tCommon("error"), description: t("createEmailInvalid"), variant: "destructive" })
      return
    }

    if (phone && !/^\+[1-9]\d{6,14}$/.test(phone)) {
      toast({ title: tCommon("error"), description: t("createPhoneInvalid"), variant: "destructive" })
      return
    }

    if (formData.createPassword.length < 6) {
      toast({ title: tCommon("error"), description: t("createPasswordInvalid"), variant: "destructive" })
      return
    }

    if (formData.createPassword !== formData.createConfirmPassword) {
      toast({ title: tCommon("error"), description: t("passwordMismatch"), variant: "destructive" })
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
      toast({
        title: tCommon("error"),
        description: error instanceof Error ? error.message : t("createUserFailed"),
        variant: "destructive",
      })
    } finally {
      setSubmittingCreateUser(false)
    }
  }

  const handleOpenUsers = useCallback(() => {
    setUsersSearch("")
    setUsersPage(1)
    setDialogOpen("users")
  }, [])

  const handleDeleteUser = async () => {
    if (!userDeleteTarget) return

    try {
      const result = await hardDeleteUser(userDeleteTarget.userId, userDeleteTarget.tenantId)
      toast({
        title: tCommon("success"),
        description: result.message || t("deleteUserSuccess"),
      })
      setUserDeleteTarget(null)
      await loadUsers()
    } catch (error) {
      toast({
        title: tCommon("error"),
        description: error instanceof Error ? error.message : t("deleteUserFailed"),
        variant: "destructive",
      })
    }
  }

  const handleOpenMenu = (event: MouseEvent<HTMLButtonElement>) => {
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
      <div className={`flex items-center gap-3 rounded-lg bg-slate-800/50 p-3 ${collapsed ? "justify-center" : ""}`}>
        <div className="h-10 w-10 animate-pulse rounded-full bg-slate-700" />
        {!collapsed && (
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-700" />
            <div className="h-3 w-32 animate-pulse rounded bg-slate-700" />
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <ContextMenu onOpenChange={setMenuOpen}>
        <ContextMenuTrigger asChild>
          <button
            type="button"
            onClick={handleOpenMenu}
            className={userButtonClassName}
          >
            <Avatar className={avatarClassName}>
              <AvatarImage src={getDisplayAvatar(user.role)} alt={user.nickname} />
              <AvatarFallback className="bg-slate-700 text-slate-300">{user.nickname.slice(0, 2)}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0 flex-1 text-left">
                <p className={nameClassName}>{user.nickname}</p>
                <p className={emailClassName}>{user.email}</p>
              </div>
            )}
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56" collisionPadding={8}>
          <ContextMenuItem onClick={() => setDialogOpen("profile")}>
            <User className="mr-2 h-4 w-4" />
            {t("viewProfile")}
          </ContextMenuItem>
          {isAdmin && (
            <>
              <ContextMenuItem onClick={handleCreateUser}>
                <UserPlus className="mr-2 h-4 w-4" />
                {t("createUser")}
              </ContextMenuItem>
              <ContextMenuItem onClick={handleOpenUsers}>
                <FileUser className="mr-2 h-4 w-4" />
                {t("userList")}
              </ContextMenuItem>
            </>
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
          <ContextMenuItem onClick={handleLogout} disabled={submittingLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            {t("logout")}
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setDialogOpen("delete")} className="text-red-400 focus:text-red-400">
            <Trash2 className="mr-2 h-4 w-4" />
            {t("deleteAccount")}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <Dialog open={dialogOpen === "users"} onOpenChange={(open) => !open && setDialogOpen(null)}>
        <DialogContent className="max-h-[86vh] overflow-hidden sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUser className="h-5 w-5" />
              {t("userList")}
            </DialogTitle>
            <DialogDescription>{t("userListDescription")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={usersSearch}
                onChange={(event) => setUsersSearch(event.target.value)}
                placeholder={t("searchUsers")}
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={loadUsers} disabled={usersLoading} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${usersLoading ? "animate-spin" : ""}`} />
              {tCommon("refresh")}
            </Button>
          </div>
          <div className="overflow-hidden rounded-md border">
            <div className="max-h-[52vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-40">
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {t("username")}
                      </span>
                    </TableHead>
                    <TableHead className="min-w-52">
                      <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {t("email")}
                      </span>
                    </TableHead>
                    <TableHead className="min-w-36">
                      <span className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {t("phone")}
                      </span>
                    </TableHead>
                    <TableHead className="min-w-28">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {t("role")}
                      </span>
                    </TableHead>
                    <TableHead className="min-w-28">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        {t("status")}
                      </span>
                    </TableHead>
                    <TableHead className="w-24 text-right">
                      {t("operation")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        {tCommon("loading")}
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length ? (
                    filteredUsers.map((item) => (
                      <TableRow key={item.userId}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={getDisplayAvatar(item.role)} alt={item.username} />
                              <AvatarFallback>{item.username.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="truncate font-medium">{item.username || "-"}</div>
                              <div className="font-mono text-xs text-muted-foreground">{compactId(item.userId)}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.email || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{item.phone || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            {roleLabel(item.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.status === "active" ? "default" : "secondary"} className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {statusLabel(item.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label={t("operation")}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => setUserDeleteTarget(item)}
                                disabled={item.userId === user.userId}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t("deleteUser")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        {t("noUsers")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter className="items-center justify-between gap-3 sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {t("userListCount", { count: filteredUsers.length })} · {t("pageInfo", { page: usersPage })}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={usersPage <= 1 || usersLoading}
                onClick={() => setUsersPage((page) => Math.max(1, page - 1))}
              >
                {t("previousPage")}
              </Button>
              <Button
                variant="outline"
                disabled={!hasNextPage || usersLoading}
                onClick={() => setUsersPage((page) => page + 1)}
              >
                {t("nextPage")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen === "create"} onOpenChange={(open) => !open && setDialogOpen(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {t("createUserTitle")}
            </DialogTitle>
            <DialogDescription>{t("createUserDescription")}</DialogDescription>
          </DialogHeader>
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
                  onChange={(event) => setFormData((prev) => ({ ...prev, createUsername: event.target.value }))}
                  placeholder={t("usernamePlaceholder")}
                  minLength={3}
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
                  onChange={(event) => setFormData((prev) => ({ ...prev, createEmail: event.target.value }))}
                  placeholder={t("emailPlaceholder")}
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
                    {ROLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.key)}
                      </SelectItem>
                    ))}
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
                  onChange={(event) => setFormData((prev) => ({ ...prev, createPhone: event.target.value }))}
                  placeholder={t("createPhonePlaceholder")}
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
                  onChange={(event) => setFormData((prev) => ({ ...prev, createPassword: event.target.value }))}
                  placeholder={t("newPasswordPlaceholder")}
                  minLength={6}
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
                  onChange={(event) => setFormData((prev) => ({ ...prev, createConfirmPassword: event.target.value }))}
                  placeholder={t("confirmPasswordPlaceholder")}
                  minLength={6}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button variant="outline" onClick={() => setDialogOpen(null)} disabled={submittingCreateUser}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSubmitCreateUser} disabled={submittingCreateUser}>
              {submittingCreateUser ? t("creatingUser") : t("confirmCreateUser")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen === "profile"} onOpenChange={(open) => !open && setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle2 className="h-5 w-5" />
              {t("profileTitle")}
            </DialogTitle>
            <DialogDescription>{t("profileDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={getDisplayAvatar(user.role)} alt={user.nickname} />
                <AvatarFallback>{user.nickname.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.nickname}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              <InfoRow icon={IdCard} label={t("userId")} value={user.id} mono />
              <InfoRow icon={Phone} label={t("phone")} value={user.phone || "-"} />
              <InfoRow icon={Mail} label={t("email")} value={user.email || "-"} />
              <InfoRow icon={ShieldCheck} label={t("role")} value={roleLabel(user.role)} />
              <InfoRow icon={CheckCircle2} label={t("status")} value={statusLabel(user.status)} />
              <InfoRow
                icon={CalendarClock}
                label={t("createdAt")}
                value={formatDateTime(user.createdAt, locale)}
              />
              <InfoRow icon={Clock3} label={t("updatedAt")} value={formatDateTime(user.updatedAt, locale)} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen === "edit"} onOpenChange={(open) => !open && setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t("editTitle")}
            </DialogTitle>
            <DialogDescription>{t("editDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t("username")}
              </Label>
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={(event) => setFormData((prev) => ({ ...prev, nickname: event.target.value }))}
                placeholder={t("usernamePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {t("email")}
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                placeholder={t("emailPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {t("phone")}
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
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

      <Dialog open={dialogOpen === "password"} onOpenChange={(open) => !open && setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {t("passwordTitle")}
            </DialogTitle>
            <DialogDescription>{t("passwordDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <PasswordInput
              id="oldPassword"
              label={t("oldPassword")}
              placeholder={t("oldPasswordPlaceholder")}
              value={formData.oldPassword}
              visible={passwordVisible.old}
              showLabel={passwordVisible.old ? t("hidePassword") : t("showPassword")}
              onToggle={() => setPasswordVisible((prev) => ({ ...prev, old: !prev.old }))}
              onChange={(value) => setFormData((prev) => ({ ...prev, oldPassword: value }))}
            />
            <PasswordInput
              id="newPassword"
              label={t("newPassword")}
              placeholder={t("newPasswordPlaceholder")}
              value={formData.newPassword}
              visible={passwordVisible.next}
              showLabel={passwordVisible.next ? t("hidePassword") : t("showPassword")}
              onToggle={() => setPasswordVisible((prev) => ({ ...prev, next: !prev.next }))}
              onChange={(value) => setFormData((prev) => ({ ...prev, newPassword: value }))}
            />
            <PasswordInput
              id="confirmPassword"
              label={t("confirmPassword")}
              placeholder={t("confirmPasswordPlaceholder")}
              value={formData.confirmPassword}
              visible={passwordVisible.confirm}
              showLabel={passwordVisible.confirm ? t("hidePassword") : t("showPassword")}
              onToggle={() => setPasswordVisible((prev) => ({ ...prev, confirm: !prev.confirm }))}
              onChange={(value) => setFormData((prev) => ({ ...prev, confirmPassword: value }))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleUpdatePassword}>{t("confirmChange")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen === "delete"} onOpenChange={(open) => !open && setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              {t("deleteTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("deleteDescription")} <code className="font-mono font-bold">CONFIRM_DELETE</code>{" "}
              {t("deleteDescriptionTail")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="deleteConfirm" className="flex items-center gap-2">
              <IdCard className="h-4 w-4" />
              {t("confirmText")}
            </Label>
            <Input
              id="deleteConfirm"
              value={formData.deleteConfirm}
              onChange={(event) => setFormData((prev) => ({ ...prev, deleteConfirm: event.target.value }))}
              placeholder={t("confirmTextPlaceholder")}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)} disabled={submittingDeleteAccount}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={submittingDeleteAccount}>
              {t("confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(userDeleteTarget)} onOpenChange={(open) => !open && setUserDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              {t("deleteUserTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteUserDescription", { username: userDeleteTarget?.username || "-" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 text-white hover:bg-red-700">
              {t("deleteUser")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof User
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span className={`text-right ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  )
}

function PasswordInput({
  id,
  label,
  placeholder,
  value,
  visible,
  showLabel,
  onChange,
  onToggle,
}: {
  id: string
  label: string
  placeholder: string
  value: string
  visible: boolean
  showLabel: string
  onChange: (value: string) => void
  onToggle: () => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-2">
        <LockKeyhole className="h-4 w-4" />
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
          onClick={onToggle}
          aria-label={showLabel}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
