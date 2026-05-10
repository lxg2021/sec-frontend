"use client"

import * as React from "react"
import {
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  RefreshCwIcon,
  SearchIcon,
  ServerIcon,
  ShieldCheckIcon,
} from "lucide-react"

import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"
import { cn } from "@/shared/lib/utils"

import type { BaselineOption } from "../api"

interface BaselineSelectorProps {
  options: BaselineOption[]
  value?: string
  onValueChange?: (value: string) => void
  onRefresh?: () => void
  isRefreshing?: boolean
  className?: string
}

const standardLabels: Record<string, { label: string; color: string }> = {
  cis: { label: "CIS", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  dod: { label: "DoD", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  msft: { label: "MSFT", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  tls: { label: "TLS", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  intune: { label: "Intune", color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20" },
  custom: { label: "自定义", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  other: { label: "其他", color: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
}

const profileLabels: Record<string, string> = {
  machine: "计算机",
  user: "用户",
  both: "全部",
}

function getStandardMeta(standard: string) {
  const key = standard.toLowerCase()
  return (
    standardLabels[key] ?? {
      label: standard ? standard.toUpperCase() : "OTHER",
      color: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    }
  )
}

function formatCheckTime(dateString: string): string {
  if (!dateString) return "暂无检查"

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString.replace("T", " ").slice(0, 19)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export function BaselineSelector({
  options,
  value,
  onValueChange,
  onRefresh,
  isRefreshing = false,
  className,
}: BaselineSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const selectedOption = options.find((opt) => opt.baseline_uuid === value)
  const hasOptions = options.length > 0

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl bg-card/50 p-2 shadow-sm backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <ShieldCheckIcon className="h-5 w-5" />
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            disabled={!hasOptions}
            className="h-auto min-w-[280px] max-w-[430px] flex-1 justify-between px-3 py-2 hover:bg-accent/50 disabled:opacity-100"
          >
            {selectedOption ? (
              <div className="flex flex-col items-start gap-0.5 text-left">
                <span className="line-clamp-1 font-medium text-foreground">
                  {selectedOption.display_name || selectedOption.baseline_uuid}
                </span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn("h-5 px-1.5 text-[10px] font-medium", getStandardMeta(selectedOption.standard).color)}
                  >
                    {getStandardMeta(selectedOption.standard).label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {selectedOption.product || "unknown"} /{" "}
                    {profileLabels[selectedOption.profile] || selectedOption.profile || "unknown"}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">{hasOptions ? "选择基线..." : "暂无可选基线"}</span>
            )}
            <ChevronDownIcon
              className={cn(
                "ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                open && "rotate-180",
              )}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[480px] p-0" align="start" sideOffset={8}>
          <Command>
            <CommandInput placeholder="搜索基线名称、标准或产品..." />
            <CommandList className="max-h-[400px]">
              <CommandEmpty className="py-8 text-center">
                <SearchIcon className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">未找到匹配的基线</p>
              </CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const standard = getStandardMeta(option.standard)

                  return (
                    <CommandItem
                      key={option.baseline_uuid}
                      value={`${option.display_name} ${option.standard} ${option.product} ${option.profile}`}
                      onSelect={() => {
                        onValueChange?.(option.baseline_uuid)
                        setOpen(false)
                      }}
                      className={cn(
                        "relative flex cursor-pointer flex-col items-start gap-2 border-l-2 px-3 py-3 transition-all duration-200",
                        value === option.baseline_uuid
                          ? "border-l-primary bg-primary/8"
                          : "border-l-transparent hover:bg-accent/50",
                      )}
                    >
                      <div className="flex w-full items-start justify-between gap-2">
                        <div className="flex flex-1 flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "font-medium",
                                value === option.baseline_uuid ? "text-primary" : "text-foreground",
                              )}
                            >
                              {option.display_name || option.baseline_uuid}
                            </span>
                            {value === option.baseline_uuid && (
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                                <CheckIcon className="h-3 w-3 text-primary-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px] font-medium", standard.color)}>
                              {standard.label}
                            </Badge>
                            <Badge variant="outline" className="h-5 bg-secondary/50 px-1.5 text-[10px] font-medium">
                              {option.product || "unknown"}
                            </Badge>
                            <Badge variant="outline" className="h-5 bg-secondary/50 px-1.5 text-[10px] font-medium">
                              {profileLabels[option.profile] || option.profile || "unknown"}
                            </Badge>
                            {option.os_version && (
                              <Badge variant="outline" className="h-5 bg-secondary/50 px-1.5 text-[10px] font-medium">
                                {option.os_version}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div
                        className={cn(
                          "flex w-full items-center justify-between text-xs",
                          value === option.baseline_uuid ? "text-primary/70" : "text-muted-foreground",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <ServerIcon className="h-3 w-3" />
                            <span>{option.host_count} 台主机</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="flex items-center gap-0.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                              {option.high_count}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              {option.medium_count}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                              {option.low_count}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>{option.item_count} 项检查</span>
                          {value === option.baseline_uuid && (
                            <Badge className="h-4 border-0 bg-primary/20 px-1.5 text-[9px] text-primary">当前</Badge>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedOption && (
        <div className="flex min-w-[180px] items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
            <ClockIcon className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] leading-none text-muted-foreground">最后检查</span>
            <span className="text-xs font-medium text-foreground">
              {formatCheckTime(selectedOption.latest_check_time)}
            </span>
          </div>
        </div>
      )}

      <div className="flex-1" />

      <Button
        variant="ghost"
        size="icon"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="h-10 w-10 shrink-0 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700"
      >
        <RefreshCwIcon className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
        <span className="sr-only">刷新数据</span>
      </Button>
    </div>
  )
}
