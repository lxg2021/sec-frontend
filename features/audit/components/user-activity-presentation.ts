import {
  BadgeCheck,
  CircleEllipsis,
  FileCog,
  KeyRound,
  LogIn,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  UserMinus,
  UserPlus,
  type LucideIcon,
} from "lucide-react"
import type { UserActionType } from "@/features/audit/types"

interface UserActionPresentation {
  icon: LucideIcon
  iconClass: string
  badgeClass: string
}

export function userActionPresentation(actionType: UserActionType): UserActionPresentation {
  switch (actionType) {
    case "ADD_USER":
      return { icon: UserPlus, iconClass: "text-emerald-600", badgeClass: "bg-emerald-50 text-emerald-800" }
    case "UPDATE_USER":
      return { icon: UserCog, iconClass: "text-blue-600", badgeClass: "bg-blue-50 text-blue-800" }
    case "PASSWORD_CHANGE":
      return { icon: KeyRound, iconClass: "text-violet-600", badgeClass: "bg-violet-50 text-violet-800" }
    case "STATUS_CHANGE":
      return { icon: ShieldCheck, iconClass: "text-cyan-600", badgeClass: "bg-cyan-50 text-cyan-800" }
    case "ROLE_CHANGE":
      return { icon: BadgeCheck, iconClass: "text-indigo-600", badgeClass: "bg-indigo-50 text-indigo-800" }
    case "DELETE_USER":
      return { icon: UserMinus, iconClass: "text-rose-600", badgeClass: "bg-rose-50 text-rose-800" }
    case "LOGIN":
      return { icon: LogIn, iconClass: "text-emerald-600", badgeClass: "bg-emerald-50 text-emerald-800" }
    case "LOGOUT":
      return { icon: LogOut, iconClass: "text-slate-600", badgeClass: "bg-slate-100 text-slate-700" }
    case "FAILED_LOGIN":
    case "MANUAL_BLOCK":
      return { icon: ShieldAlert, iconClass: "text-rose-600", badgeClass: "bg-rose-50 text-rose-800" }
    case "CREATE_TASK":
    case "UPDATE_TASK":
    case "DISPATCH_TASK":
    case "CREATE_CONFIG":
    case "UPDATE_CONFIG":
    case "DISPATCH_CONFIG":
      return { icon: FileCog, iconClass: "text-sky-600", badgeClass: "bg-sky-50 text-sky-800" }
    default:
      return { icon: CircleEllipsis, iconClass: "text-slate-600", badgeClass: "bg-slate-100 text-slate-700" }
  }
}

export function userActionLabelKey(actionType: UserActionType) {
  switch (actionType) {
    case "LOGIN": return "login"
    case "LOGOUT": return "logout"
    case "FAILED_LOGIN": return "failedLogin"
    case "PASSWORD_CHANGE": return "passwordChange"
    case "ROLE_CHANGE": return "roleChange"
    case "ADD_USER": return "addUser"
    case "UPDATE_USER": return "updateUser"
    case "STATUS_CHANGE": return "statusChange"
    case "DELETE_USER": return "deleteUser"
    case "CREATE_TASK": return "createTask"
    case "UPDATE_TASK": return "updateTask"
    case "DISPATCH_TASK": return "dispatchTask"
    case "CREATE_CONFIG": return "createConfig"
    case "UPDATE_CONFIG": return "updateConfig"
    case "DISPATCH_CONFIG": return "dispatchConfig"
    case "MANUAL_BLOCK": return "manualBlock"
    default: return "other"
  }
}

export function userTargetTypeLabelKey(targetType?: string) {
  switch (targetType) {
    case "TASK": return "task"
    case "POLICY": return "policy"
    case "HOST": return "host"
    case "USER": return "user"
    case "SYSTEM": return "system"
    default: return "otherTarget"
  }
}

export function userAuditDetailValue(value: unknown) {
  if (value === null) return "null"
  if (value === undefined || value === "") return "-"
  if (typeof value === "object") return JSON.stringify(value, null, 2)
  return String(value)
}
