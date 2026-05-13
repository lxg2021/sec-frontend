"use client"

import Link from "next/link"
import { useMemo } from "react"
import { useTranslations } from "next-intl"

import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"

import HostSelector from "./index"
import { useHostSelectorTree } from "./hooks/use-host-selector-tree"
import type { HostSelectorTreeNode } from "./types"

interface RemoteHostSelectorProps {
  emptyText?: string
  onSelectionChange?: (nodes: HostSelectorTreeNode[], selectedIds: Set<string>) => void
  showHeader?: boolean
}

export function RemoteHostSelector({
  emptyText,
  onSelectionChange,
  showHeader = true,
}: RemoteHostSelectorProps) {
  const t = useTranslations("pages.baseline.dispatch")
  const { data, error, loading, reload, requiresLogin } = useHostSelectorTree()

  const text = useMemo(
    () => ({
      title: t("hostSelection.selector.title"),
      searchPlaceholder: t("hostSelection.selector.searchPlaceholder"),
      selectAll: t("hostSelection.selector.selectAll"),
      clear: t("hostSelection.selector.clear"),
      searchResults: (term: string, count: number) =>
        t("hostSelection.selector.searchResults", { term, count }),
      clearSearch: t("hostSelection.selector.clearSearch"),
      selectedSummary: (
        total: number,
        hostCount: number,
        groupCount: number,
        deptCount: number,
        companyCount: number,
      ) =>
        t("hostSelection.selector.selectedSummary", {
          total,
          hostCount,
          groupCount,
          deptCount,
          companyCount,
        }),
    }),
    [t],
  )

  const resolvedEmptyText = requiresLogin
    ? t("errors.hosts.noAuth")
    : error
      ? t("errors.hosts.loadFailed")
      : emptyText || t("hostSelection.empty")

  return (
    <div className="space-y-4">
      {requiresLogin ? (
        <Alert variant="destructive">
          <AlertTitle>{t("errors.loadDataTitle")}</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{t("errors.hosts.noAuth")}</span>
            <Button asChild size="sm" variant="outline" className="shrink-0">
              <Link href="/login">{t("errors.goLogin")}</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {!requiresLogin && error ? (
        <Alert variant="destructive">
          <AlertTitle>{t("errors.loadDataTitle")}</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button size="sm" variant="outline" className="shrink-0" onClick={() => void reload()}>
              {t("errors.retry")}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <HostSelector
        data={data}
        emptyText={resolvedEmptyText}
        loading={loading}
        onSelectionChange={onSelectionChange}
        showHeader={showHeader}
        text={text}
      />
    </div>
  )
}
