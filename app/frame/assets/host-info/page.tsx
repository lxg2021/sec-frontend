"use client"

import { List } from "lucide-react"
import { useTranslations } from "next-intl"

import { HostAssetPage } from "@/features/assets/host/components/host-asset-page"

export default function HostInfoPage() {
  const t = useTranslations("pages.assets.hardware")

  return (
    <HostAssetPage
      listTitle={t("hostList")}
      listDescription={t("hostListDescription")}
      listIcon={List}
      loadingSummaryText={t("loadingSummary")}
      loadingListText={t("loadingHostList")}
      summaryLoadFailedText={t("summaryLoadFailed")}
      listLoadFailedText={t("hostListLoadFailed")}
      retryText={t("retry")}
      refreshText={t("refresh")}
      totalLabel={(total, start, end) =>
        total > 0 ? t("hostTotalRange", { total, start, end }) : t("hostTotal", { total })
      }
      pageLabel={(page, totalPages) => t("pageInfo", { page, totalPages })}
      pageSizeLabel={t("pageSize")}
      previousText={t("previousPage")}
      nextText={t("nextPage")}
    />
  )
}
