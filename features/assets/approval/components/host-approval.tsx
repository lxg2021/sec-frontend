"use client"

import { useEffect, useMemo, useState } from "react"
import type { Host, LogicGroup, HostFilterOptions } from "@/features/assets/approval/types"
import { HostTable } from "./host-table"
import { HostFilter } from "./host-filter"
import { HostEditModal } from "./host-edit-modal"
import { findHostsNeedingApproval } from "@/features/assets/approval/host-adapters"
import { filterHosts } from "@/features/assets/approval/utils"
import { Button } from "@/shared/ui/button"
import { Card } from "@/shared/ui/card"
import { useTranslations } from "next-intl"
import { useToast } from "@/shared/hooks/use-toast"
import { Save } from "lucide-react"

export interface HostApprovalProps {
  hosts: Host[]
  logicGroups: LogicGroup[]
  initialFilters?: HostFilterOptions
  pageSize?: number
  loading?: boolean
  onSubmit: (updatedHosts: Host[]) => void | Promise<void>
  onCancel?: () => void
}

export function HostApproval({
  hosts: initialHosts,
  logicGroups,
  initialFilters = {},
  pageSize = 20,
  loading = false,
  onSubmit,
  onCancel,
}: HostApprovalProps) {
  const t = useTranslations("pages.computers.approve")
  const { toast } = useToast()
  const [hosts, setHosts] = useState<Host[]>(initialHosts)
  const [filters, setFilters] = useState<HostFilterOptions>(initialFilters)
  const [currentPage, setCurrentPage] = useState(1)
  const [editingHost, setEditingHost] = useState<Host | null>(null)
  const [sortField, setSortField] = useState<keyof Host | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setHosts(initialHosts)
    setCurrentPage(1)
  }, [initialHosts])

  // Filter and sort hosts
  const filteredHosts = useMemo(() => {
    let result = filterHosts(hosts, filters)

    // Apply sorting
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

  // Paginate hosts
  const paginatedHosts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return filteredHosts.slice(start, end)
  }, [filteredHosts, currentPage, pageSize])

  const totalPages = Math.ceil(filteredHosts.length / pageSize)
  const pendingChangeCount = useMemo(
    () => findHostsNeedingApproval(initialHosts, hosts).length,
    [hosts, initialHosts],
  )

  const handleEditHost = (host: Host) => {
    setEditingHost(host)
  }

  const handleSaveHost = (updatedHost: Host) => {
    setHosts((prev) => prev.map((h) => (h.host_id === updatedHost.host_id ? updatedHost : h)))
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
          onFiltersChange={setFilters}
          logicGroups={logicGroups}
          totalHosts={hosts.length}
          filteredHosts={filteredHosts.length}
        />
      </Card>

      <Card className="border-border bg-card">
        <HostTable
          hosts={paginatedHosts}
          onEditHost={handleEditHost}
          highlightUngrouped={filters.ungrouped}
          highlightUnowned={filters.unowned}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-sm">
          <div className="text-muted-foreground">
            {t("approvalPageSummary", { filtered: filteredHosts.length, shown: paginatedHosts.length })}
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
