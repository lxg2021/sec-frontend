"use client"

import { useState, useMemo } from "react"
import type { Host, LogicGroup, HostFilterOptions } from "@/components/hostapproval/computer"
import { HostTable } from "./HostTable"
import { HostFilter } from "./HostFilter"
import { HostEditModal } from "./HostEditModal"
import { filterHosts } from "@/components/hostapproval/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export interface HostApprovalProps {
  hosts: Host[]
  logicGroups: LogicGroup[]
  initialFilters?: HostFilterOptions
  pageSize?: number
  onSubmit: (updatedHosts: Host[]) => void
  onCancel?: () => void
}

export function HostApproval({
  hosts: initialHosts,
  logicGroups,
  initialFilters = {},
  pageSize = 20,
  onSubmit,
  onCancel,
}: HostApprovalProps) {
  const [hosts, setHosts] = useState<Host[]>(initialHosts)
  const [filters, setFilters] = useState<HostFilterOptions>(initialFilters)
  const [currentPage, setCurrentPage] = useState(1)
  const [editingHost, setEditingHost] = useState<Host | null>(null)
  const [sortField, setSortField] = useState<keyof Host | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

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

  const handleEditHost = (host: Host) => {
    setEditingHost(host)
  }

  const handleSaveHost = (updatedHost: Host) => {
    setHosts((prev) => prev.map((h) => (h.host_id === updatedHost.host_id ? updatedHost : h)))
    setEditingHost(null)
  }

  const handleSort = (field: keyof Host) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleSubmit = () => {
    onSubmit(hosts)
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

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          显示 {filteredHosts.length} 个主机中的 {paginatedHosts.length} 个
        </div>
        <div className="flex gap-3">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              取消
            </Button>
          )}
          <Button onClick={handleSubmit}>保存更改</Button>
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
