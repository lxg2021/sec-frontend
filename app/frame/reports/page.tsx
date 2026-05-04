import { AuditCenter } from "@/features/audit/components/audit-center"
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card"
import { ShieldCheck } from "lucide-react"
import { getTranslations } from "next-intl/server"


export default async function AuditPage() {
  const t = await getTranslations("pages.reports")

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-6 space-y-6">

        {/* 顶部标题区块 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <ShieldCheck className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {t("title")}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t("subtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* 主体卡片 */}
        <div className="border-0 shadow-lg bg-white dark:bg-gray-800">
          <AuditCenter />
        </div>

      </div>
    </div>
  )
}
