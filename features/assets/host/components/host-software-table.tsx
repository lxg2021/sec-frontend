"use client"

import { useState, useMemo } from "react"
import { Search, Package, Calendar, FolderOpen, Archive, Trash2, VolumeX, ExternalLink } from "lucide-react"
import { Input } from "@/shared/ui/input"
import { Card, CardContent } from "@/shared/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import type { AgentSoftInfo } from "@/features/assets/host/types/software"
import TruncateCopyable from "@/features/assets/software/components/truncate-copyable"
import { useTranslations } from "next-intl"

interface HostSoftwareTableProps {
  software: AgentSoftInfo | null
}

export function HostSoftwareTable({ software }: HostSoftwareTableProps) {
  const t = useTranslations("pages.assets.hardware.host.softwarePanel")
  const [searchTerm, setSearchTerm] = useState("")
  const [vendorFilter, setVendorFilter] = useState<string>("all")

  const vendors = useMemo(() => {
    if (!software) return []
    const unique = Array.from(new Set(software.softwareList.map((s) => s.vendor).filter(Boolean)))
    return unique.sort()
  }, [software])

  const filteredSoftware = useMemo(() => {
    if (!software) return []

    let filtered = software.softwareList

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (sw) =>
          sw.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sw.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sw.vendor.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Vendor filter
    if (vendorFilter !== "all") {
      filtered = filtered.filter((sw) => sw.vendor === vendorFilter)
    }

    return filtered
  }, [software, searchTerm, vendorFilter])

  if (!software) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">{t("empty")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={vendorFilter} onValueChange={setVendorFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t("selectVendor")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allVendors")}</SelectItem>
            {vendors.map((vendor) => (
              <SelectItem key={vendor} value={vendor}>
                {vendor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          <span>{t("count", { count: filteredSoftware.length })}</span>
        </div>
        {(searchTerm || vendorFilter !== "all") && <div>({t("filteredFrom", { count: software.softwareList.length })})</div>}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("description")}</TableHead>
              <TableHead>
                <div className="flex items-left gap-2">
                  <Calendar className="h-4 w-4" />
                  {t("installDate")}
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  {t("installPath")}
                </div>
              </TableHead>
              <TableHead>{t("internalName")}</TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <Archive className="h-4 w-4" />
                  {t("packageCache")}
                </div>
              </TableHead>
              <TableHead>{t("vendor")}</TableHead>
              <TableHead>{t("version")}</TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  {t("uninstallCommand")}
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <VolumeX className="h-4 w-4" />
                  {t("quietUninstall")}
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  {t("infoUrl")}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSoftware.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                  {searchTerm || vendorFilter !== "all" ? t("noMatch") : t("empty")}
                </TableCell>
              </TableRow>
            ) : (
              filteredSoftware.map((sw, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="font-medium max-w-xs truncate" title={sw.displayName}>
                      {sw.displayName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate font-mono text-sm text-muted-foreground" title={sw.description}>
                      {sw.description || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{sw.installDate || "-"}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TruncateCopyable value={sw.installLocation || ""} />
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="max-w-xs truncate font-mono text-sm" title={sw.name}>
                      {sw.name || "-"}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TruncateCopyable value={sw.packageCache || ""} />
                    </div>
                  </TableCell>

                  <TableCell className="font-mono text-sm">{sw.vendor || "-"}</TableCell>
                  <TableCell className="font-mono text-sm">{sw.version || "-"}</TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TruncateCopyable value={sw.uninstallString || ""} />
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TruncateCopyable value={sw.quietUninstallString || ""} />
                    </div>
                  </TableCell>

                  <TableCell>
                    {sw.urlInfoAbout ? (
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <a
                          href={sw.urlInfoAbout}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-xs truncate max-w-xs block"
                          title={sw.urlInfoAbout}
                        >
                          {t("details")}
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span>-</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
