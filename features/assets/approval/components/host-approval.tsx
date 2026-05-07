"use client"

import { useEffect, useMemo, useState } from "react"
import { Save } from "lucide-react"
import { useTranslations } from "next-intl"

import type { HostPagination } from "@/features/assets/approval/host-api"
import { findHostsNeedingApproval } from "@/features/assets/approval/host-adapters"
import { filterHosts } from "@/features/assets/approval/utils"
import type { Host, LogicGroup, HostFilterOptions } from "@/features/assets/approval/types"
import { useToast } from "@/shared/hooks/use-toast"
import { Button } from "@/shared/ui/button"
import { Card } from "@/shared/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

import { HostEditModal } from "./host-edit-modal"
import { HostFilter } from "./host-filter"
import { HostTable } from "./host-table"

export interface HostApprovalProps {
  hosts: Host[]
  logicGroups: LogicGroup[]
  pagination: HostPagination
  initialFilters?: HostFilterOptions
  loading?: boolean
  onQueryChange: (query: { page: number; pageSize: number; groupId?: string }) => void
  onSubmit: (updatedHosts: Host[]) => void | Promise<void>
  onCancel?: () => void
}

export function HostApproval({
  hosts: initialHosts,
  logicGroups,
  pagination,
  initialFilters = {},
  loading = false,
  onQueryChange,
  onSubmit,
  onCancel,
}: HostApprovalProps) {
  const t = useTranslations("pages.computers.approve")
  const { toast } = useToast()
  const [hosts, setHosts] = useState<Host[]>(initialHosts)
  const [filters, setFilters] = useState<HostFilterOptions>(initialFilters)
  const [editingHost, setEditingHost] = useState<Host | null>(null)
  const [sortField, setSortField] = useState<keyof Host | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setHosts(initialHosts)
  }, [initialHosts])

  const displayedHosts = useMemo(() => {
    let result = filterHosts(hosts, filters)

    if (sortField) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortField]
        const bVal = b[sortField]

        if (aVal === undefined || aVal === null) return 1
        if (bVal === undefined || bVal === null) return -1

        let comparison = 0
        if (typeof aVal === "string" && typeof bVal === "string") {
          comparison = aVal.localeCompare(bVal)
        } else if (Array.isArray(aVal) && Array.isArray(bVal)) {
          comparison = aVal.length - bVal.length
        } else {
          comparison = String(aVal).localeCompare(String(bVal))
        }

        return sortDirection === "asc" ? comparison : -comparison
      })
    }

    return result
  }, [hosts, filters, sortField, sortDirection])

  const pendingChangeCount = useMemo(
    () => findHostsNeedingApproval(initialHosts, hosts).length,
    [hosts, initialHosts],
  )

  const syncQuery = (nextFilters: HostFilterOptions, page = 1, pageSize = pagination.page_size) => {
    onQueryChange({
      page,
      pageSize,
      groupId: nextFilters.groupIds?.[0],
    })
  }

  const handleEditHost = (host: Host) => {
    setEditingHost(host)
  }

  const handleSaveHost = (updatedHost: Host) => {
    setHosts((prev) => prev.map((host) => (host.host_id === updatedHost.host_id ? updatedHost : host)))
    setEditingHost(null)
    toast({
      title: t("hostSaveToastTitle"),
      description: t("hostSaveToastDescription", { host: updatedHost.hostname }),
    })
  }

  const handleSort = (field: keyof Host) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleFiltersChange = (nextFilters: HostFilterOptions) => {
    setFilters(nextFilters)
    syncQuery(nextFilters)
  }

  const handlePageChange = (page: number) => {
    syncQuery(filters, page)
  }

  const handlePageSizeChange = (pageSize: number) => {
    syncQuery(filters, 1, pageSize)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await onSubmit(hosts)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card p-6">
        <HostFilter
          filters={filters}
          onFiltersChange={handleFiltersChange}
          logicGroups={logicGroups}
          totalHosts={pagination.total_count}
          filteredHosts={displayedHosts.length}
        />
      </Card>

      <Card className="border-border bg-card">
        <HostTable
          hosts={displayedHosts}
          onEditHost={handleEditHost}
          highlightUngrouped={filters.ungrouped}
          highlightUnowned={filters.unowned}
          currentPage={pagination.current_page}
          totalPages={pagination.total_pages}
          onPageChange={handlePageChange}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="text-muted-foreground">
            {t("approvalPageSummary", { filtered: pagination.total_count, shown: displayedHosts.length })}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{t("pageSize")}</span>
            <Select value={String(pagination.page_size)} onValueChange={(value) => handlePageSizeChange(Number(value))}>
              <SelectTrigger className="h-9 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-3 sm:flex-1">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              {t("cancel")}
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={loading || submitting || pendingChangeCount === 0}>
            {!submitting && <Save className="mr-2 h-4 w-4" />}
            {submitting ? "保存中..." : t("saveChanges")}
          </Button>
        </div>
      </div>

      {editingHost && (
        <HostEditModal
          visible={true}
          host={editingHost}
          logicGroups={logicGroups}
          onCancel={() => setEditingHost(null)}
          onSave={handleSaveHost}
        />
      )}
    </div>
  )
}
