"use client"

import type { FormEvent } from "react"
import { Globe2, Loader2, Search } from "lucide-react"
import { useTranslations } from "next-intl"

import type { IocVerificationType } from "@/features/ioc-analysis/types"
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

type IocSearchHeaderStatus = "idle" | "loading" | "success" | "error"

interface IocSearchHeaderProps {
  queryType: IocVerificationType
  queryValue: string
  typeOptions: IocVerificationType[]
  status: IocSearchHeaderStatus
  canSearch: boolean
  onQueryTypeChange: (value: IocVerificationType) => void
  onQueryValueChange: (value: string) => void
  onSearch: () => void | Promise<void>
}

export function IocSearchHeader({
  queryType,
  queryValue,
  typeOptions,
  status,
  canSearch,
  onQueryTypeChange,
  onQueryValueChange,
  onSearch,
}: IocSearchHeaderProps) {
  const t = useTranslations("pages.iocAnalysis.search")
  const typeText = useTranslations("pages.iocAnalysis.verification.types")
  const loading = status === "loading"

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      const result = onSearch()
      if (result && typeof result.catch === "function") {
        void result.catch(() => undefined)
      }
    } catch {
      // The page-level handler owns user-facing error feedback.
    }
  }

  return (
    <header className="w-full shrink-0 rounded-[28px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_12px_34px_rgba(15,23,42,0.08)]">
      <div className="grid gap-4 lg:grid-cols-[minmax(180px,1fr)_minmax(560px,760px)_minmax(140px,1fr)] lg:items-center xl:grid-cols-[minmax(190px,1fr)_minmax(860px,1040px)_minmax(150px,1fr)] 2xl:grid-cols-[minmax(220px,1fr)_minmax(980px,1180px)_minmax(170px,1fr)]">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 text-teal-600">
            <Globe2 className="h-5 w-5" aria-hidden="true" />
          </span>

          <div className="min-w-0 space-y-1.5">
            <h1 className="line-clamp-2 break-words text-lg font-semibold leading-tight text-slate-950">
              {t("title")}
            </h1>
            <div className="flex flex-wrap items-center gap-2.5 text-sm">
              <span className="min-w-0 truncate text-slate-500">
                {t("description")}
              </span>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className={cn(
            "flex h-14 w-full min-w-0 items-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 px-4 shadow-inner shadow-slate-200/20 transition-[border-color,background-color,box-shadow] duration-200 ease-out lg:justify-self-center",
            "hover:border-slate-300 hover:bg-white hover:shadow-sm",
            "focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-sm",
            loading && "animate-pulse"
          )}
        >
          <Select
            value={queryType}
            onValueChange={(value) => onQueryTypeChange(value as IocVerificationType)}
            disabled={loading}
          >
            <SelectTrigger
              aria-label={t("typeLabel")}
              className="h-10 w-[112px] shrink-0 rounded-full border-slate-200 bg-white pl-4 pr-3 text-xs font-semibold text-slate-800 shadow-none transition-colors hover:border-slate-300 hover:bg-white focus:ring-0 focus:ring-offset-0 data-[placeholder]:text-slate-500 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-slate-500 [&>svg]:opacity-100"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              align="start"
              sideOffset={8}
              className="z-[80] min-w-[132px] rounded-xl border-slate-200 bg-white p-1.5 shadow-[0_18px_45px_rgba(15,23,42,0.14)]"
            >
              {typeOptions.map((type) => (
                <SelectItem
                  key={type}
                  value={type}
                  className="h-9 cursor-pointer rounded-lg pl-8 pr-3 text-xs font-semibold uppercase text-slate-700 focus:bg-blue-50 focus:text-blue-700 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white [&_svg]:h-3.5 [&_svg]:w-3.5"
                >
                  {typeText(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            value={queryValue}
            onChange={(event) => onQueryValueChange(event.target.value)}
            onFocus={(event) => {
              if (status === "success" || status === "error") {
                event.currentTarget.select()
              }
            }}
            placeholder={t("placeholder")}
            className="h-11 min-w-0 flex-1 rounded-none border-0 bg-transparent px-3 font-mono text-sm shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={loading}
          />

          <Button
            type="submit"
            className="h-10 shrink-0 rounded-full bg-blue-600 px-5 text-white hover:bg-blue-700"
            disabled={loading || !canSearch}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {t("submit")}
          </Button>
        </form>

        <div className="hidden lg:block" aria-hidden="true" />
      </div>
    </header>
  )
}
