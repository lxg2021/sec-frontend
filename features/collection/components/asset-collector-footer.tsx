import { useTranslations } from "next-intl"

export function AssetCollectorFooter() {
  const t = useTranslations("pages.collection.footer")

  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <span className="cursor-default text-muted-foreground">
              {t("privacy")}
            </span>
            <span className="text-border">|</span>
            <span className="cursor-default text-muted-foreground">
              {t("terms")}
            </span>
            <span className="text-border">|</span>
            <span className="cursor-default text-muted-foreground">
              {t("contact")}
            </span>
          </div>

          <div className="text-center md:text-right">
            <p>{t("copyright")}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
