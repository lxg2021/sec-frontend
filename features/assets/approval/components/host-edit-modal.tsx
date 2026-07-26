"use client"

import { useState } from "react"
import type { Host, LogicGroup, HostOwner } from "@/features/assets/approval/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { validateHostData } from "@/features/assets/approval/utils"
import { Edit3, Server, Users, User } from "lucide-react";
import { useTranslations } from "next-intl"

export interface HostEditModalProps {
  visible: boolean
  host: Host
  logicGroups: LogicGroup[]
  onCancel: () => void
  onSave: (updatedHost: Host) => void
}

export function HostEditModal({ visible, host, logicGroups, onCancel, onSave }: HostEditModalProps) {
  const t = useTranslations("pages.computers.approve")
  const validationMessages = {
    ownerName: {
      required: t("validation.ownerNameRequired"),
      minLength: t("validation.ownerNameMinLength"),
      maxLength: t("validation.ownerNameMaxLength"),
      pattern: t("validation.ownerNamePattern"),
    },
    ownerPhone: {
      pattern: t("validation.ownerPhonePattern"),
    },
    ownerEmail: {
      pattern: t("validation.ownerEmailPattern"),
    },
    ownerRole: {
      required: t("validation.ownerRoleRequired"),
    },
  }
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(host.group?.id)
  const [ownerName, setOwnerName] = useState(host.owner?.owner_name || "")
  const [ownerPhone, setOwnerPhone] = useState(host.owner?.phone || "")
  const [ownerEmail, setOwnerEmail] = useState(host.owner?.email || "")
  const [ownerRole, setOwnerRole] = useState(host.owner?.owner_role || "operator")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // 实时验证字段
  const handleFieldChange = (field: string, value: string, setter: (value: string) => void) => {
    setter(value)

    // 清除该字段的错误
    if (fieldErrors[field]) {
      const newErrors = { ...fieldErrors }
      delete newErrors[field]
      setFieldErrors(newErrors)
    }
  }

  const handleSave = () => {
    // 执行完整验证
    const validation = validateHostData(
      {
        ownerName,
        ownerPhone,
        ownerEmail,
        ownerRole,
        selectedGroupId,
      },
      validationMessages,
    )

    if (!validation.isValid) {
      setFieldErrors(validation.errors)
      return
    }

    // 清除所有错误
    setFieldErrors({})

    const selectedGroup = logicGroups.find((g) => g.id === selectedGroupId)

    const updatedOwner: HostOwner | undefined =
      ownerName.trim() !== ""
        ? {
          host_id: host.host_id,
          user_id: host.owner?.user_id || `user-${Date.now()}`,
          owner_name: ownerName,
          phone: ownerPhone || null,
          email: ownerEmail || null,
          owner_role: ownerRole,
          assigned_at: host.owner?.assigned_at || new Date().toISOString(),
        }
        : undefined

    const updatedHost: Host = {
      ...host,
      group: selectedGroup || null,
      owner: updatedOwner || null,
    }

    onSave(updatedHost)
  }

  const handleCancel = () => {
    // 清除错误状态
    setFieldErrors({})
    onCancel()
  }

  return (
    <Dialog open={visible} onOpenChange={handleCancel}>
      <DialogContent
        closeLabel={t("close")}
        className="max-h-[90vh] w-[calc(100vw-1rem)] max-w-2xl overflow-y-auto rounded-[24px]"
      >
        <DialogHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <Edit3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-slate-800 dark:text-white">
                {t("editHostTitle")}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {t("editHostDescriptionPrefix")}{" "}
                <code className="text-foreground font-medium">{host.hostname}</code>{" "}
                {t("editHostDescriptionSuffix")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 主机基本信息 Card */}
          <Card className="rounded-[20px] border-slate-200 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Server className="h-4 w-4 text-blue-500" />
                <CardTitle className="text-sm font-semibold">{t("baseInfoTitle")}</CardTitle>
              </div>
              <CardDescription className="text-xs">
                {t("baseInfoDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-muted-foreground">{t("hostname")}</span>
                  <code className="font-mono text-sm font-medium text-foreground bg-muted px-2 py-1 rounded">
                    {host.hostname}
                  </code>
                </div>

                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-muted-foreground">{t("os")}</span>
                  <span className="text-sm text-foreground font-medium">
                    {host.os_name} {host.os_version}
                  </span>
                </div>

                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-muted-foreground">{t("macAddress")}</span>
                  <code className="font-mono text-xs text-foreground bg-muted px-2 py-1 rounded">
                    {host.macs[0]}
                  </code>
                </div>

                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-muted-foreground">{t("ipAddress")}</span>
                  <div className="flex flex-wrap gap-1">
                    {host.ip.map((ip, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {ip}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 逻辑组选择 Card */}
          <Card className="rounded-[20px] border-slate-200 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-green-500" />
                <CardTitle className="text-sm font-semibold">{t("logicGroupTitle")}</CardTitle>
              </div>
              <CardDescription className="text-xs">
                {t("logicGroupDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="group" className="text-sm">{t("logicGroup")}</Label>
                <Select
                  value={selectedGroupId || "none"}
                  onValueChange={(value) => setSelectedGroupId(value === "none" ? undefined : value)}
                >
                  <SelectTrigger
                    id="group"
                    className={fieldErrors.selectedGroupId ? "border-destructive" : ""}
                    aria-invalid={Boolean(fieldErrors.selectedGroupId)}
                    aria-describedby={fieldErrors.selectedGroupId ? "group-error" : undefined}
                  >
                    <SelectValue placeholder={t("selectLogicGroup")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("noGroup")}</SelectItem>
                    {logicGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.full_path}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.selectedGroupId && (
                  <p id="group-error" className="mt-1 text-sm text-destructive" role="alert">
                    {fieldErrors.selectedGroupId}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 负责人信息 Card */}
          <Card className="rounded-[20px] border-slate-200 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-purple-500" />
                <CardTitle className="text-sm font-semibold">{t("ownerTitle")}</CardTitle>
              </div>
              <CardDescription className="text-xs">
                {t("ownerDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ownerName" className="text-sm">{t("ownerName")} *</Label>
                  <Input
                    id="ownerName"
                    value={ownerName}
                    onChange={(e) => handleFieldChange('ownerName', e.target.value, setOwnerName)}
                    placeholder={t("ownerNamePlaceholder")}
                    className={fieldErrors.ownerName ? "border-destructive" : ""}
                    aria-invalid={Boolean(fieldErrors.ownerName)}
                    aria-describedby={fieldErrors.ownerName ? "ownerName-error" : undefined}
                  />
                  {fieldErrors.ownerName && (
                    <p id="ownerName-error" className="text-sm text-destructive" role="alert">
                      {fieldErrors.ownerName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerRole" className="text-sm">{t("ownerRole")}</Label>
                  <Select value={ownerRole} onValueChange={(value) => handleFieldChange('ownerRole', value, setOwnerRole)}>
                    <SelectTrigger
                      id="ownerRole"
                      className={fieldErrors.ownerRole ? "border-destructive" : ""}
                      aria-invalid={Boolean(fieldErrors.ownerRole)}
                      aria-describedby={fieldErrors.ownerRole ? "ownerRole-error" : undefined}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">{t("ownerAdmin")}</SelectItem>
                      <SelectItem value="auditor">{t("ownerAuditor")}</SelectItem>
                      <SelectItem value="operator">{t("ownerOperator")}</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldErrors.ownerRole && (
                    <p id="ownerRole-error" className="text-sm text-destructive" role="alert">
                      {fieldErrors.ownerRole}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerPhone" className="text-sm">{t("phone")}</Label>
                  <Input
                    id="ownerPhone"
                    value={ownerPhone}
                    onChange={(e) => handleFieldChange('ownerPhone', e.target.value, setOwnerPhone)}
                    placeholder={t("phonePlaceholder")}
                    className={fieldErrors.ownerPhone ? "border-destructive" : ""}
                    aria-invalid={Boolean(fieldErrors.ownerPhone)}
                    aria-describedby={fieldErrors.ownerPhone ? "ownerPhone-error" : undefined}
                  />
                  {fieldErrors.ownerPhone && (
                    <p id="ownerPhone-error" className="text-sm text-destructive" role="alert">
                      {fieldErrors.ownerPhone}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerEmail" className="text-sm">{t("email")}</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => handleFieldChange('ownerEmail', e.target.value, setOwnerEmail)}
                    placeholder={t("emailPlaceholder")}
                    className={fieldErrors.ownerEmail ? "border-destructive" : ""}
                    aria-invalid={Boolean(fieldErrors.ownerEmail)}
                    aria-describedby={fieldErrors.ownerEmail ? "ownerEmail-error" : undefined}
                  />
                  {fieldErrors.ownerEmail && (
                    <p id="ownerEmail-error" className="text-sm text-destructive" role="alert">
                      {fieldErrors.ownerEmail}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full rounded-2xl border-slate-200"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={ownerName.trim() === ""}
            className="w-full rounded-2xl bg-blue-600 text-white hover:bg-blue-700"
          >
            {t("save")}
          </Button>
        </DialogFooter>
        
      </DialogContent>
    </Dialog>
  )
}
