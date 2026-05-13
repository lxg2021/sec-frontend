"use client"

import { Clock3, Search } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { Skeleton } from "@/shared/ui/skeleton"

export interface BaselinePolicyListItem {
  id: string
  name: string
  version: string
  updatedText: string
}

export interface BaselinePolicySortOption {
  value: string
  label: string
}

interface BaselinePolicyListProps {
  title: string
  searchPlaceholder: string
  searchValue: string
  sortValue: string
  sortOptions: BaselinePolicySortOption[]
  items: BaselinePolicyListItem[]
  selectedId?: string
  loading?: boolean
  error?: string
  emptyTitle?: string
  emptyDescription?: string
  retryLabel?: string
  onRetry?: () => void
  onSearchChange: (value: string) => void
  onSortChange: (value: string) => void
  onSelect: (id: string) => void
}

function PolicyListLoading() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-[24px] border border-slate-200 bg-white p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-9 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function BaselinePolicyList({
  title,
  searchPlaceholder,
  searchValue,
  sortValue,
  sortOptions,
  items,
  selectedId,
  loading = false,
  error,
  emptyTitle = "暂无策略",
  emptyDescription = "当前没有可展示的策略数据。",
  retryLabel = "重试",
  onRetry,
  onSearchChange,
  onSortChange,
  onSelect,
}: BaselinePolicyListProps) {
  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h3 className="text-[28px] font-semibold tracking-tight text-slate-950">
          {title}
        </h3>
      </header>

      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-12 rounded-[18px] border-slate-200 bg-white pl-14 text-base shadow-none placeholder:text-slate-400"
          />
        </div>

        <Select value={sortValue} onValueChange={onSortChange}>
          <SelectTrigger className="h-12 rounded-[18px] border-slate-200 bg-white text-base shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <PolicyListLoading />
      ) : error ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-rose-900">{error}</p>
            {onRetry ? (
              <Button
                type="button"
                variant="outline"
                onClick={onRetry}
                className="h-10 rounded-2xl border-rose-200 bg-white text-rose-900 hover:bg-rose-50"
              >
                {retryLabel}
              </Button>
            ) : null}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
          <p className="text-base font-medium text-slate-900">{emptyTitle}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">{emptyDescription}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const active = item.id === selectedId

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={cn(
                  "w-full rounded-[24px] border bg-white px-5 py-4 text-left transition-colors",
                  active
                    ? "border-slate-950 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.3)]"
                    : "border-slate-200 hover:border-slate-300",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-[17px] font-semibold text-slate-950">
                      {item.name}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                      <Clock3 className="size-4 shrink-0" />
                      <span>{item.updatedText}</span>
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-950">
                    {item.version}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
