"use client"

import Link from "next/link"
import { ArrowLeft, CirclePlus, Home, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"

import { Button } from "@/shared/ui/button"

const CURRENT_PATH = "/frame/ai-ops/operations"

export default function OperationsNotFoundPage() {
  const router = useRouter()
  const t = useTranslations("pages.aiops.operations.notFound")

  return (
    <main className="relative flex min-h-[calc(100vh-3rem)] items-center justify-center overflow-hidden px-4 py-8 sm:px-6">

      <section
        className="relative flex min-h-[calc(100vh-7rem)] w-full flex-col items-center justify-center px-4 py-10 text-center sm:px-10"
        aria-labelledby="not-found-title"
      >


        <div className="relative mx-auto w-fit select-none" aria-hidden="true">
          <span className="bg-gradient-to-r from-teal-700 via-cyan-600 to-blue-600 bg-clip-text text-[132px] font-black leading-none tracking-[-0.08em] text-transparent sm:text-[184px] lg:text-[210px]">
            404
          </span>
          <span className="absolute left-1/2 top-[48%] flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-cyan-100 bg-white text-cyan-600 shadow-[0_0_0_9px_rgba(34,211,238,0.1)] sm:h-14 sm:w-14 dark:border-cyan-900 dark:bg-slate-900 dark:text-cyan-400">
            <X className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.2} />
          </span>
        </div>

        <h1 id="not-found-title" className="relative mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
          {t("title")}
        </h1>
        <p className="relative mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
          {t("description")}
        </p>
        <p className="relative mt-1 text-xs text-slate-400 dark:text-slate-500">{t("suggestion")}</p>

        <div className="relative mx-auto mt-8 flex w-full max-w-xl items-center gap-3 rounded-[14px] border border-slate-200 bg-slate-50/90 px-4 py-3 text-left dark:border-slate-700 dark:bg-slate-950/60">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
            <CirclePlus className="h-3.5 w-3.5" />
          </span>
          <code className="min-w-0 flex-1 truncate text-xs font-medium text-slate-600 dark:text-slate-300" title={CURRENT_PATH}>
            {CURRENT_PATH}
          </code>
          <span className="shrink-0 rounded-full bg-red-50 px-2 py-1 text-[9px] font-bold text-red-600 dark:bg-red-950/50 dark:text-red-400">
            {t("notFoundBadge")}
          </span>
        </div>

        <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="h-12 w-full rounded-[13px] border-slate-300 bg-white px-6 text-slate-700 shadow-none hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md sm:w-auto dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t("back")}
          </Button>
          <Button
            asChild
            className="h-12 w-full rounded-[13px] bg-gradient-to-r from-teal-700 to-cyan-600 px-6 text-white shadow-[0_10px_24px_-12px_rgba(15,118,110,0.75)] transition-all hover:-translate-y-0.5 hover:from-teal-800 hover:to-cyan-700 hover:shadow-[0_14px_28px_-12px_rgba(15,118,110,0.8)] sm:w-auto"
          >
            <Link href="/frame/dashboard">
              <Home className="h-4 w-4" aria-hidden="true" />
              {t("dashboard")}
            </Link>
          </Button>
        </div>

        <p className="relative mt-7 text-xs text-slate-400 dark:text-slate-500">{t("hint")}</p>
      </section>

      <div className="absolute bottom-5 right-6 hidden items-center gap-2 text-[10px] text-slate-500 md:flex dark:text-slate-400">
        <span className="relative flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
        {t("watchPointNormal")}
      </div>
    </main>
  )
}