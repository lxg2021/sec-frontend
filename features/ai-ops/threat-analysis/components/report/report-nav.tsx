"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"

import { cn } from "@/shared/lib/utils"

const NAV_ITEMS = [
  { id: "attack-story", labelKey: "nav.attackStory" },
  { id: "key-findings", labelKey: "nav.keyFindings" },
  { id: "iocs", labelKey: "nav.iocs" },
  { id: "assets", labelKey: "nav.assets" },
  { id: "actions", labelKey: "nav.actions" },
  { id: "hypotheses", labelKey: "nav.hypotheses" },
  { id: "limitations", labelKey: "nav.limitations" },
] as const

type NavItemId = (typeof NAV_ITEMS)[number]["id"]

export function ReportNav() {
  const t = useTranslations("pages.aiops.threatAnalysis.report")
  const [active, setActive] = useState<NavItemId>(NAV_ITEMS[0].id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && NAV_ITEMS.some((item) => item.id === entry.target.id)) {
            setActive(entry.target.id as NavItemId)
          }
        })
      },
      { rootMargin: "-20% 0px -70% 0px" },
    )
    NAV_ITEMS.forEach((item) => {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <nav className="hidden lg:block">
      <div className="sticky top-8">
        <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("nav.title")}</p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={cn(
                  "block rounded-md border-l-2 px-3 py-1.5 text-sm transition-colors",
                  active === item.id
                    ? "border-primary bg-accent/50 font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t(item.labelKey)}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
