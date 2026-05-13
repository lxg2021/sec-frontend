"use client"

import type { ReactNode } from "react"

import { Skeleton } from "@/shared/ui/skeleton"

export interface BaselinePolicyDetailItem {
  label: string
  value: ReactNode
}

export interface BaselinePolicyDetailSection {
  key: string
  title: string
  icon: ReactNode
  items: BaselinePolicyDetailItem[]
}

export interface BaselinePolicyDetailData {
  name: string
  id: string
  version: string
  sections: BaselinePolicyDetailSection[]
}

interface BaselinePolicyDetailProps {
  title?: string
  policy: BaselinePolicyDetailData | null
  loading?: boolean
  idLabel?: string
  emptyTitle?: string
  emptyDescription?: string
}

function PolicyDetailLoading() {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_32px_-24px_rgba(15,23,42,0.2)]">
      <div className="space-y-8 px-8 py-8">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-4">
            <Skeleton className="h-6 w-28" />
            <div className="space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function BaselinePolicyDetail({
  title,
  policy,
  loading = false,
  idLabel = "策略 ID",
  emptyTitle = "未选择策略",
  emptyDescription = "请先从左侧选择一个策略，再查看详细配置。",
}: BaselinePolicyDetailProps) {
  return (
    <section className="space-y-5">
      {title ? (
        <header className="space-y-1">
          <h3 className="text-[28px] font-semibold tracking-tight text-slate-950">
            {title}
          </h3>
        </header>
      ) : null}

      {loading ? (
        <PolicyDetailLoading />
      ) : policy ? (
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_32px_-24px_rgba(15,23,42,0.2)]">
          <div className="space-y-8 px-8 py-8">
            {policy.sections.map((section) => (
              <section key={section.key} className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-5 items-center justify-center text-slate-950">
                    {section.icon}
                  </span>
                  <h5 className="text-[15px] font-semibold text-slate-950">
                    {section.title}
                  </h5>
                </div>

                <div className="space-y-3 pl-8">
                  {section.items.map((item, index) => (
                    <div
                      key={`${section.key}-${index}`}
                      className="flex items-center justify-between gap-6 text-[15px]"
                    >
                      <span className="text-slate-500">{item.label}</span>
                      <span className="text-right font-medium text-slate-950">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
          <p className="text-base font-medium text-slate-900">{emptyTitle}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">{emptyDescription}</p>
        </div>
      )}
    </section>
  )
}
