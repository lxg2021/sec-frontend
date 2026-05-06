"use client"

import { Save, AlertCircle, Users } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Badge } from "@/shared/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { flattenLogicGroupPaths } from "@/features/collection/lib/logic-group-utils"
import type { UserInfoTableProps } from "@/features/collection/components/user-info-table.types"
import { useTranslations } from "next-intl"

export function UserInfoTable({
  assets,
  userInfos,
  errors,
  userLogicGroups,
  onUserInfoChange,
  onFieldBlur,
  onSave,
}: UserInfoTableProps) {
  const t = useTranslations("pages.collection.userInfo")
  const departmentPaths = flattenLogicGroupPaths(userLogicGroups)

  if (assets.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg">
              <Users className="h-8 w-8 text-primary" />
            </div>

            <div>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
                {t("title")}
              </CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {t("emptyDescription")}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
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
            <Users className="h-8 w-8 text-primary" />
          </div>

          <div>
            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
              {t("title")}
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              {t("description")}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">{t("hostName")}</TableHead>
                <TableHead className="min-w-[140px]">{t("ipAddress")}</TableHead>
                <TableHead className="min-w-[140px]">{t("macAddress")}</TableHead>
                <TableHead className="min-w-[120px]">{t("os")}</TableHead>
                <TableHead className="min-w-[150px]">
                  {t("name")} <span className="text-destructive">*</span>
                </TableHead>
                <TableHead className="min-w-[150px]">
                  {t("role")} <span className="text-destructive">*</span>
                </TableHead>
                <TableHead className="min-w-[150px]">
                  {t("phone")} <span className="text-destructive">*</span>
                </TableHead>
                <TableHead className="min-w-[200px]">
                  {t("email")} <span className="text-destructive">*</span>
                </TableHead>
                <TableHead className="min-w-[200px]">
                  {t("department")} <span className="text-destructive">*</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => {
                const userInfo = userInfos[asset.agent_id] || {}
                const assetErrors = errors[asset.agent_id] || {}

                return (
                  <TableRow key={asset.agent_id}>
                    <TableCell>
                      <Badge variant="secondary">{asset.hostname}</Badge>
                    </TableCell>
                    <TableCell>
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
                    <TableCell>
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
                    <TableCell>
                      {asset.os_name} {asset.os_version}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Input
                          value={userInfo.name || ""}
                          onChange={(e) => onUserInfoChange(asset.agent_id, "name", e.target.value)}
                          placeholder={t("namePlaceholder")}
                          className={assetErrors.name ? "border-destructive" : ""}
                        />
                        {assetErrors.name && <p className="text-xs text-destructive">{assetErrors.name}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
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
                    <TableCell>
                      <div className="space-y-1">
                        <Input
                          value={userInfo.phone || ""}
                          onChange={(e) => onUserInfoChange(asset.agent_id, "phone", e.target.value)}
                          onBlur={(e) => onFieldBlur(asset.agent_id, "phone", e.target.value)}
                          placeholder={t("phonePlaceholder")}
                          className={assetErrors.phone ? "border-destructive" : ""}
                        />
                        {assetErrors.phone && <p className="text-xs text-destructive">{assetErrors.phone}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Input
                          type="email"
                          value={userInfo.email || ""}
                          onChange={(e) => onUserInfoChange(asset.agent_id, "email", e.target.value)}
                          onBlur={(e) => onFieldBlur(asset.agent_id, "email", e.target.value)}
                          placeholder={t("emailPlaceholder")}
                          className={assetErrors.email ? "border-destructive" : ""}
                        />
                        {assetErrors.email && <p className="text-xs text-destructive">{assetErrors.email}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Select
                          value={userInfo.department || ""}
                          onValueChange={(value) => onUserInfoChange(asset.agent_id, "department", value)}
                        >
                          <SelectTrigger className={assetErrors.department ? "border-destructive" : ""}>
                            <SelectValue placeholder={t("departmentPlaceholder")} />
                          </SelectTrigger>
                          <SelectContent>
                            {departmentPaths.map((path) => (
                              <SelectItem key={path} value={path}>
                                {path}
                              </SelectItem>
                            ))}
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

        <div className="w-full flex justify-center py-4">
          <div className="w-full max-w-5xl px-6 flex justify-center">
            <Button onClick={onSave} className="gap-2 shadow-md rounded-lg">
              <Save className="h-4 w-4" />
              {t("save")}
            </Button>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
