"use client"

import { memo } from "react"
import { Building2, Users, Server, Monitor, ChevronRight, ChevronDown, MoreHorizontal } from "lucide-react"

import { HostInfoPopover } from "@/features/assets/host/components/host-info-popover"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"

function getIcon(type: string) {
  switch (type) {
    case "company":
      return Building2
    case "department":
      return Users
    case "group":
      return Server
    case "host":
      return Monitor
    default:
      return Monitor
  }
}

function getIconColor(type: string, checkboxState: string) {
  const baseColors: Record<string, string> = {
    company: "text-purple-500",
    department: "text-blue-500",
    group: "text-emerald-500",
    host: "text-slate-600",
  }

  if (checkboxState === "checked") {
    return (
      {
        company: "text-purple-600",
        department: "text-blue-600",
        group: "text-emerald-600",
        host: "text-slate-700",
      }[type] || baseColors[type] || "text-slate-400"
    )
  }

  if (checkboxState === "indeterminate") {
    return (
      {
        company: "text-purple-500",
        department: "text-blue-500",
        group: "text-emerald-500",
        host: "text-slate-500",
      }[type] || baseColors[type] || "text-slate-400"
    )
  }

  return baseColors[type] || "text-slate-400"
}

function getStatusColor(status: string) {
  switch (status) {
    case "online":
      return "bg-emerald-400 shadow-emerald-200 shadow-sm"
    case "offline":
      return "bg-rose-400 shadow-rose-200 shadow-sm"
    case "maintenance":
      return "bg-amber-400 shadow-amber-200 shadow-sm"
    default:
      return "bg-slate-300"
  }
}

export const TreeNodeWithState = memo(function TreeNodeWithState({
  node,
  isSelected,
  checkboxState,
  onToggleExpanded,
  onToggleSelected,
}: {
  node: any
  isSelected: boolean
  checkboxState: "checked" | "unchecked" | "indeterminate"
  onToggleExpanded: (nodeId: string) => void
  onToggleSelected: (nodeId: string, node: any) => void
}) {
  const Icon = getIcon(node.type)
  const isHost = node.type === "host"
  const paddingLeft = node.level * 24 + 12

  return (
    <div
      className={cn(
        "group flex min-w-0 cursor-pointer items-center gap-3 border-b border-slate-100/60 px-3 py-3 transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-indigo-50/60",
        (isSelected || checkboxState === "indeterminate") && "bg-gradient-to-r from-blue-50/60 to-indigo-50/40",
        isSelected && "shadow-sm",
      )}
      style={{ paddingLeft }}
    >
      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
        {node.hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 rounded-md p-0 transition-colors duration-200 hover:bg-blue-100 hover:text-blue-600"
            onClick={(event) => {
              event.stopPropagation()
              onToggleExpanded(node.id)
            }}
          >
            {node.isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </Button>
        )}
      </div>

      <Checkbox
        checked={checkboxState === "indeterminate" ? "indeterminate" : checkboxState === "checked"}
        onCheckedChange={() => onToggleSelected(node.id, node)}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "flex-shrink-0 border-slate-300 transition-all duration-200 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500",
          checkboxState === "indeterminate" &&
            "data-[state=unchecked]:border-blue-500 data-[state=unchecked]:bg-blue-500 data-[state=unchecked]:text-white",
        )}
      />

      <div
        className={cn(
          "flex-shrink-0 rounded-lg p-1.5 transition-all duration-200",
          checkboxState === "checked" && "bg-white/80 shadow-sm",
          checkboxState === "indeterminate" && "bg-white/60",
        )}
      >
        <Icon className={cn("h-4 w-4 flex-shrink-0 transition-colors duration-200", getIconColor(node.type, checkboxState))} />
      </div>

      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm font-medium transition-colors duration-200",
          checkboxState === "checked"
            ? "text-slate-700"
            : checkboxState === "indeterminate"
              ? "text-slate-600"
              : "text-slate-600 group-hover:text-slate-700",
        )}
        title={node.name}
      >
        {node.name}
      </span>

      {!isHost && typeof node.hostCount === "number" && (
        <div className="rounded-md border border-slate-200 bg-white/80 px-2 py-1 text-xs font-medium text-slate-500">
          {node.hostCount}
        </div>
      )}

      {isHost && node.status && (
        <div className={cn("h-2.5 w-2.5 flex-shrink-0 rounded-full", getStatusColor(node.status))} />
      )}

      {isHost && (
        <div className="flex flex-shrink-0 items-center gap-3">
          <div className="rounded-md bg-slate-100/80 px-2 py-1 font-mono text-xs text-slate-500">{node.ip}</div>
          <div className="rounded-md bg-slate-100/80 px-2 py-1 font-mono text-xs text-slate-500">{node.hostId}</div>
          <HostInfoPopover node={node}>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 rounded-full p-0 opacity-0 transition-colors duration-200 hover:bg-blue-100 hover:text-blue-600 group-hover:opacity-100"
              onClick={(event) => event.stopPropagation()}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </HostInfoPopover>
        </div>
      )}
    </div>
  )
})
