"use client"

import {
  AlertCircle,
  Building2,
  Cpu,
  Fingerprint,
  Globe,
  Mail,
  Phone,
  Save,
  Server,
  Shield,
  User,
} from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Badge } from "@/shared/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { flattenDepartmentLogicGroupPaths } from "@/features/collection/lib/logic-group-utils"
import type { UserInfoTableProps } from "@/features/collection/components/user-info-table.types"
import { useTranslations } from "next-intl"

export function UserInfoTable({
  assets,
  userInfos,
  errors,
  userLogicGroups,
  isLoadingLogicGroups = false,
  isSaving = false,
  onUserInfoChange,
  onFieldBlur,
  onSave,
}: UserInfoTableProps) {
  const t = useTranslations("pages.collection.userInfo")
  const departmentPaths = flattenDepartmentLogicGroupPaths(userLogicGroups)
  const columns = [
    { icon: Server, label: t("hostName"), width: "10%" },
    { icon: Globe, label: t("ipAddress"), width: "12%" },
    { icon: Fingerprint, label: t("macAddress"), width: "12%" },
    { icon: Cpu, label: t("os"), width: "11%" },
    { icon: User, label: t("name"), required: true, width: "8%" },
    { icon: Shield, label: t("role"), required: true, width: "8%" },
    { icon: Phone, label: t("phone"), required: true, width: "11%" },
    { icon: Mail, label: t("email"), required: true, width: "14%" },
    { icon: Building2, label: t("department"), required: true, width: "14%" },
  ]

  if (assets.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg">
              <User className="h-8 w-8 text-primary" />
            </div>

            <div>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">{t("title")}</CardTitle>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t("emptyDescription")}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg">
            <User className="h-8 w-8 text-primary" />
          </div>

          <div>
            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">{t("title")}</CardTitle>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t("description")}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto rounded-md border">
          <Table className="min-w-[1260px] table-fixed">
            <colgroup>
              {columns.map((column, index) => (
                <col key={index} style={{ width: column.width }} />
              ))}
            </colgroup>
            <TableHeader>
              <TableRow>
                {columns.map((column, index) => {
                  const Icon = column.icon
                  return (
                    <TableHead key={index} className="h-12 px-2 text-center align-middle font-medium">
                      <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                        <Icon className="h-4 w-4" />
                        <span>
                          {column.label}
                          {column.required && <span className="text-destructive"> *</span>}
                        </span>
                      </div>
                    </TableHead>
                  )
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => {
                const userInfo = userInfos[asset.agent_id] || {}
                const assetErrors = errors[asset.agent_id] || {}

                return (
                  <TableRow key={asset.agent_id}>
                    <TableCell className="px-2 text-center align-middle">
                      <Badge variant="secondary">{asset.hostname}</Badge>
                    </TableCell>
                    <TableCell className="px-2 text-center align-middle">
                      <div className="flex flex-col gap-1">
                        {asset.ip.length > 0 ? (
                          asset.ip.map((ip, index) => (
                            <div key={index} className="font-mono text-xs">
                              {ip}
                            </div>
                          ))
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-2 text-center align-middle">
                      <div className="flex flex-col gap-1">
                        {asset.macs.length > 0 ? (
                          asset.macs.map((mac, index) => (
                            <div key={index} className="font-mono text-xs">
                              {mac}
                            </div>
                          ))
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-2 text-center align-middle">
                      {asset.os_name} {asset.os_version}
                    </TableCell>
                    <TableCell className="px-2 text-center align-middle">
                      <div className="space-y-1">
                        <Input
                          value={userInfo.name || ""}
                          onChange={(e) => onUserInfoChange(asset.agent_id, "name", e.target.value)}
                          placeholder={t("namePlaceholder")}
                          className={`text-center ${assetErrors.name ? "border-destructive" : ""}`}
                        />
                        {assetErrors.name && <p className="text-xs text-destructive">{assetErrors.name}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="px-2 text-center align-middle">
                      <div className="space-y-1">
                        <Select
                          value={userInfo.role || "operator"}
                          onValueChange={(value) => onUserInfoChange(asset.agent_id, "role", value)}
                        >
                          <SelectTrigger className={assetErrors.role ? "border-destructive" : ""}>
                            <SelectValue placeholder={t("rolePlaceholder")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">{t("roleAdmin")}</SelectItem>
                            <SelectItem value="auditor">{t("roleAuditor")}</SelectItem>
                            <SelectItem value="operator">{t("roleOperator")}</SelectItem>
                          </SelectContent>
                        </Select>
                        {assetErrors.role && <p className="text-xs text-destructive">{assetErrors.role}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="px-2 text-center align-middle">
                      <div className="space-y-1">
                        <Input
                          value={userInfo.phone || ""}
                          onChange={(e) => onUserInfoChange(asset.agent_id, "phone", e.target.value)}
                          onBlur={(e) => onFieldBlur(asset.agent_id, "phone", e.target.value)}
                          placeholder={t("phonePlaceholder")}
                          className={`text-center ${assetErrors.phone ? "border-destructive" : ""}`}
                        />
                        {assetErrors.phone && <p className="text-xs text-destructive">{assetErrors.phone}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="px-2 text-center align-middle">
                      <div className="space-y-1">
                        <Input
                          type="email"
                          value={userInfo.email || ""}
                          onChange={(e) => onUserInfoChange(asset.agent_id, "email", e.target.value)}
                          onBlur={(e) => onFieldBlur(asset.agent_id, "email", e.target.value)}
                          placeholder={t("emailPlaceholder")}
                          className={`text-center ${assetErrors.email ? "border-destructive" : ""}`}
                        />
                        {assetErrors.email && <p className="text-xs text-destructive">{assetErrors.email}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="px-2 text-center align-middle">
                      <div className="space-y-1">
                        <Select
                          value={userInfo.department || ""}
                          onValueChange={(value) => onUserInfoChange(asset.agent_id, "department", value)}
                          disabled={isLoadingLogicGroups}
                        >
                          <SelectTrigger className={assetErrors.department ? "border-destructive" : ""}>
                            <SelectValue placeholder={t("departmentPlaceholder")} />
                          </SelectTrigger>
                          <SelectContent>
                            {departmentPaths.length === 0 ? (
                              <SelectItem value="__empty__" disabled>
                                {t("departmentEmpty")}
                              </SelectItem>
                            ) : (
                              departmentPaths.map((path) => (
                                <SelectItem key={path} value={path}>
                                  {path}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {assetErrors.department && <p className="text-xs text-destructive">{assetErrors.department}</p>}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex w-full justify-center py-4">
          <div className="flex w-full max-w-5xl justify-center px-6">
            <Button onClick={onSave} disabled={isSaving} className="gap-2 rounded-lg shadow-md">
              <Save className="h-4 w-4" />
              {t("save")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
