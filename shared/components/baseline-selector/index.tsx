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
  actions,
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
        "w-full rounded-[28px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_12px_34px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 text-teal-600">
            {icon ?? <ShieldCheckIcon className="h-5 w-5" />}
          </div>

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                role="combobox"
                aria-expanded={open}
                disabled={!hasItems}
                className="h-auto min-w-0 flex-1 justify-start rounded-2xl px-3 py-2 text-left hover:bg-slate-50 disabled:opacity-100"
              >
                {selectedItem ? (
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-lg font-semibold text-slate-950">{selectedItem.title}</span>
                      <ChevronDownIcon
                        className={cn(
                          "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
                          open && "rotate-180",
                        )}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          "h-7 rounded-full border-slate-200 bg-white px-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-700",
                          getStandardColor(selectedItem),
                        )}
                      >
                        {selectedItem.standardLabel}
                      </Badge>
                      <span className="text-sm text-slate-500">
                        {selectedItem.productLabel || text.unknown} / {selectedItem.profileLabel || text.unknown}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-500">
                    <span>{hasItems ? text.selectPlaceholder : text.emptyPlaceholder}</span>
                    <ChevronDownIcon
                      className={cn(
                        "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
                        open && "rotate-180",
                      )}
                    />
                  </div>
                )}
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
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:gap-3">
          {selectedItem ? (
            <div className="flex min-w-[220px] items-center gap-3 rounded-2xl bg-slate-50/90 px-3 py-2.5 lg:border-l lg:border-slate-200 lg:bg-transparent lg:pl-5 lg:pr-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200/80 lg:bg-slate-50">
                <ClockIcon className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs leading-none text-slate-400">{text.lastChecked}</span>
                <span className="mt-1 text-sm font-medium text-slate-700">
                  {formatCheckTime(selectedItem.lastCheckTime, text.noCheck)}
                </span>
              </div>
            </div>
          ) : null}

          {actions ? (
            <div className="flex items-center gap-1 lg:border-l lg:border-slate-200 lg:pl-4">{actions}</div>
          ) : null}

          <div className="flex items-center lg:border-l lg:border-slate-200 lg:pl-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isRefreshing || !onRefresh}
              className="h-10 w-10 shrink-0 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <RefreshCwIcon className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              <span className="sr-only">{text.refresh}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export type { BaselineSelectorItem, BaselineSelectorProps, BaselineSelectorText } from "./types"

export default BaselineSelector
