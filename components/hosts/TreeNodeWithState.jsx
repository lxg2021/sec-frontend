"use client"

import { memo, useRef, useEffect } from "react"
import { Building2, Users, Server, Monitor, ChevronRight, ChevronDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { HostInfoDialog } from '@/components/hosts/HostInfoDialog';
import { HostInfoPopover } from '@/components/hosts/HostInfoPopover';

// 图标映射
const getIcon = (type) => {
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

// 图标颜色映射
const getIconColor = (type, checkboxState) => {
  const baseColors = {
    company: "text-purple-500",
    department: "text-blue-500",
    group: "text-emerald-500",
    host: "text-slate-600",
  }

  if (checkboxState === "checked") {
    return {
      company: "text-purple-600",
      department: "text-blue-600",
      group: "text-emerald-600",
      host: "text-slate-700",
    }[type]
  }

  if (checkboxState === "indeterminate") {
    return {
      company: "text-purple-500",
      department: "text-blue-500",
      group: "text-emerald-500",
      host: "text-slate-500",
    }[type]
  }

  return baseColors[type] || "text-slate-400"
}

// 状态颜色映射
const getStatusColor = (status) => {
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
}) {
  const Icon = getIcon(node.type)
  const isHost = node.type === "host"
  const paddingLeft = node.level * 24 + 12
  const checkboxRef = useRef(null)

  // 设置 checkbox 的 indeterminate 状态
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = checkboxState === "indeterminate"
    }
  }, [checkboxState])

  return (
	 <div
	  className={cn(
		"flex items-center gap-3 py-3 px-3 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-indigo-50/60 cursor-pointer border-b border-slate-100/60 transition-all duration-200 group"
	  )}
	  style={{ paddingLeft }}
	>
      {/* 展开/折叠按钮 */}
      <div className="w-5 h-5 flex items-center justify-center">
        {node.hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 hover:bg-blue-100 hover:text-blue-600 transition-colors duration-200 rounded-md"
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpanded(node.id)
            }}
          >
            {node.isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </Button>
        )}
      </div>

      {/* 选择框 */}
      <Checkbox
        ref={checkboxRef}
        checked={checkboxState === "checked"}
        onCheckedChange={(checked) => {
          onToggleSelected(node.id, node)
        }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "transition-all duration-200 border-slate-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500",
          checkboxState === "indeterminate" &&
            "data-[state=unchecked]:bg-blue-500 data-[state=unchecked]:text-white data-[state=unchecked]:border-blue-500",
        )}
      />

      {/* 图标 */}
      <div
        className={cn(
          "p-1.5 rounded-lg transition-all duration-200",
          checkboxState === "checked" && "bg-white/80 shadow-sm",
          checkboxState === "indeterminate" && "bg-white/60",
        )}
      >
        <Icon
          className={cn("h-4 w-4 flex-shrink-0 transition-colors duration-200", getIconColor(node.type, checkboxState))}
        />
      </div>

      {/* 节点名称 */}
      <span
        className={cn(
          "text-sm font-medium flex-1 min-w-0 truncate transition-colors duration-200",
          checkboxState === "checked"
            ? "text-slate-700"
            : checkboxState === "indeterminate"
              ? "text-slate-600"
              : "text-slate-600 group-hover:text-slate-700",
        )}
      >
        {node.name}
      </span>

      {/* 主机状态指示器 */}
      {isHost && node.status && (
        <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", getStatusColor(node.status))} />
      )}

      {/* 主机额外信息 */}
      {isHost && (
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-xs text-slate-500 bg-slate-100/80 px-2 py-1 rounded-md font-mono">{node.ip}</div>
          <div className="text-xs text-slate-500 bg-slate-100/80 px-2 py-1 rounded-md font-mono">{node.hostId}</div>
          <HostInfoPopover node={node}>
			  <Button
				variant="ghost"
				size="sm"
				className="h-7 w-7 p-0 hover:bg-blue-100 hover:text-blue-600 transition-colors duration-200 rounded-full opacity-0 group-hover:opacity-100"
				onClick={(e) => e.stopPropagation()}
			  >
				<MoreHorizontal className="h-3.5 w-3.5" />
			  </Button>
		</HostInfoPopover>
        </div>
      )}
    </div>
  )
})
