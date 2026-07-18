"use client"

import { LibraryBig, RefreshCw } from "lucide-react"
import { useTranslations } from "next-intl"

import type { BaselineScanPolicyListResult, ReusableBaselineScanPolicy } from "@/features/baseline/dispatch/api"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"

import { BaselineTableList } from "./baseline-table-list"

interface BaselinePolicySelectorDialogProps {
  data: BaselineScanPolicyListResult | null
  error?: string
  loading: boolean
  onOpenChange: (open: boolean) => void
  onPageChange: (page: number) => void
  onRefresh: () => void
  onRowClick: (item: ReusableBaselineScanPolicy) => void
  onSelect: () => void
  onSelectionChange: (selectedKey: string | null) => void
  open: boolean
  selectedKey: string | null
}

export function BaselinePolicySelectorDialog({
  data,
  error,
  loading,
  onOpenChange,
  onPageChange,
  onRefresh,
  onRowClick,
  onSelect,
  onSelectionChange,
  open,
  selectedKey,
}: BaselinePolicySelectorDialogProps) {
  const t = useTranslations("pages.baseline.dispatch.workspace")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid max-h-[88vh] w-[94vw] max-w-[1440px] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="border-b border-slate-200 px-6 py-5 pr-14">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
              <LibraryBig className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <DialogTitle>{t("existingDialogTitle")}</DialogTitle>
              <DialogDescription className="mt-1">{t("existingDialogDescription")}</DialogDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="ml-auto mr-2 h-9 shrink-0 rounded-full px-3 text-slate-500"
            >
              <RefreshCw className={loading ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
              {t("refresh")}
            </Button>
          </div>
        </DialogHeader>

        <div className="min-h-0 overflow-auto px-6 py-5">
          <BaselineTableList
            data={data}
            error={error}
            loading={loading}
            onPageChange={onPageChange}
            onRefresh={onRefresh}
            onRowClick={onRowClick}
            onSelectionChange={onSelectionChange}
            selectedKey={selectedKey}
          />
        </div>

        <DialogFooter className="border-t border-slate-200 px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="button" onClick={onSelect} disabled={!selectedKey || loading} className="bg-slate-950 text-white hover:bg-slate-800">
            {t("useTask")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
