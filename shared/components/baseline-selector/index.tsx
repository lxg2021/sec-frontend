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

import type { BaselineSelectorItem, BaselineSelectorProps } from "./types"

const standardColors: Record<string, string> = {
  cis: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  custom: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  dod: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  intune: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  msft: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  other: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  tls: "bg-purple-500/10 text-purple-600 border-purple-500/20",
}

function formatCheckTime(dateString: string | undefined, emptyText: string) {
  if (!dateString) return emptyText

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return dateString.replace("T", " ").slice(0, 19)
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

function getStandardColor(item: BaselineSelectorItem) {
  if (!item.standardKey) return standardColors.other
  return standardColors[item.standardKey.toLowerCase()] || standardColors.other
}

export function BaselineSelector({
  className,
  icon,
  isRefreshing = false,
  items,
  onRefresh,
  onValueChange,
  text,
  value,
}: BaselineSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const selectedItem = items.find((item) => item.id === value) ?? null
  const hasItems = items.length > 0

  return (
    <div
      className={cn(
        "flex items-center gap-5 rounded-xl bg-card/50 p-2 shadow-sm backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon ?? <ShieldCheckIcon className="h-5 w-5" />}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            disabled={!hasItems}
            className="h-auto min-w-[280px] max-w-[430px] flex-1 justify-between px-3 py-2 pr-5 hover:bg-accent/50 disabled:opacity-100"
          >
            {selectedItem ? (
              <div className="flex flex-col items-start gap-0.5 text-left">
                <span className="line-clamp-1 font-medium text-foreground">
                  {selectedItem.title}
                </span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-5 px-1.5 text-[10px] font-medium",
                      getStandardColor(selectedItem),
                    )}
                  >
                    {selectedItem.standardLabel}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {selectedItem.productLabel || text.unknown} /{" "}
                    {selectedItem.profileLabel || text.unknown}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">
                {hasItems ? text.selectPlaceholder : text.emptyPlaceholder}
              </span>
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
            <CommandInput placeholder={text.searchPlaceholder} />
            <CommandList className="max-h-[400px]">
              <CommandEmpty className="py-8 text-center">
                <SearchIcon className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">{text.noMatches}</p>
              </CommandEmpty>
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.title} ${item.standardLabel} ${item.productLabel} ${item.profileLabel} ${item.osVersionLabel || ""}`}
                    onSelect={() => {
                      onValueChange?.(item.id)
                      setOpen(false)
                    }}
                    className={cn(
                      "relative flex cursor-pointer flex-col items-start gap-2 border-l-2 px-3 py-3 transition-all duration-200",
                      value === item.id
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
                              value === item.id ? "text-primary" : "text-foreground",
                            )}
                          >
                            {item.title}
                          </span>
                          {value === item.id ? (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                              <CheckIcon className="h-3 w-3 text-primary-foreground" />
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "h-5 px-1.5 text-[10px] font-medium",
                              getStandardColor(item),
                            )}
                          >
                            {item.standardLabel}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="h-5 bg-secondary/50 px-1.5 text-[10px] font-medium"
                          >
                            {item.productLabel || text.unknown}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="h-5 bg-secondary/50 px-1.5 text-[10px] font-medium"
                          >
                            {item.profileLabel || text.unknown}
                          </Badge>
                          {item.osVersionLabel ? (
                            <Badge
                              variant="outline"
                              className="h-5 bg-secondary/50 px-1.5 text-[10px] font-medium"
                            >
                              {item.osVersionLabel}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div
                      className={cn(
                        "flex w-full items-center justify-between text-xs",
                        value === item.id ? "text-primary/70" : "text-muted-foreground",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <ServerIcon className="h-3 w-3" />
                          <span>{text.hosts(item.hostCount ?? 0)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="flex items-center gap-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            {item.highCount ?? 0}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            {item.mediumCount ?? 0}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            {item.lowCount ?? 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{text.checks(item.itemCount ?? 0)}</span>
                        {value === item.id ? (
                          <Badge className="h-4 border-0 bg-primary/20 px-1.5 text-[9px] text-primary">
                            {text.current}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedItem ? (
        <div className="ml-4 flex min-w-[180px] items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
            <ClockIcon className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] leading-none text-muted-foreground">
              {text.lastChecked}
            </span>
            <span className="text-xs font-medium text-foreground">
              {formatCheckTime(selectedItem.lastCheckTime, text.noCheck)}
            </span>
          </div>
        </div>
      ) : null}

      <div className="flex-1" />

      <Button
        variant="ghost"
        size="icon"
        onClick={onRefresh}
        disabled={isRefreshing || !onRefresh}
        className="h-10 w-10 shrink-0 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700"
      >
        <RefreshCwIcon className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
        <span className="sr-only">{text.refresh}</span>
      </Button>
    </div>
  )
}

export type { BaselineSelectorItem, BaselineSelectorProps, BaselineSelectorText } from "./types"

export default BaselineSelector
