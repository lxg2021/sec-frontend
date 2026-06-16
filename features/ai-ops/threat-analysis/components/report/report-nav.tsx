"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"

import { cn } from "@/shared/lib/utils"

export function ReportNav() {
  const t = useTranslations("pages.aiops.threatAnalysis.report")
  const items = [
    { id: "attack-story", label: t("nav.attackStory") },
    { id: "key-findings", label: t("nav.keyFindings") },
    { id: "iocs", label: t("nav.iocs") },
    { id: "assets", label: t("nav.assets") },
    { id: "actions", label: t("nav.actions") },
    { id: "hypotheses", label: t("nav.hypotheses") },
    { id: "limitations", label: t("nav.limitations") },
  ]
  const [active, setActive] = useState(items[0].id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: "-20% 0px -70% 0px" },
    )
    items.forEach((item) => {
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
          {items.map((item) => (
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
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
