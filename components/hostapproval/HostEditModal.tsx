"use client"

import { useState } from "react"
import type { Host, LogicGroup, HostOwner } from "@/components/hostapproval/computer"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { validateHostData, validateField } from "@/components/hostapproval/utils"

export interface HostEditModalProps {
  visible: boolean
  host: Host
  logicGroups: LogicGroup[]
  onCancel: () => void
  onSave: (updatedHost: Host) => void
}

export function HostEditModal({ visible, host, logicGroups, onCancel, onSave }: HostEditModalProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(host.group?.id)
  const [ownerName, setOwnerName] = useState(host.owner?.owner_name || "")
  const [ownerPhone, setOwnerPhone] = useState(host.owner?.phone || "")
  const [ownerEmail, setOwnerEmail] = useState(host.owner?.email || "")
  const [ownerRole, setOwnerRole] = useState(host.owner?.owner_role || "使用者")
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
    const validation = validateHostData({
      ownerName,
      ownerPhone,
      ownerEmail,
      ownerRole,
      selectedGroupId,
    })

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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>编辑主机信息</DialogTitle>
          <DialogDescription>
            为主机 <code className="text-foreground">{host.hostname}</code> 分配逻辑组和负责人
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Host Info */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h4 className="mb-3 text-sm font-semibold text-foreground">主机基本信息</h4>
            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">主机名:</span>
                <code className="font-mono text-foreground">{host.hostname}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">IP地址:</span>
                <div className="flex gap-2">
                  {host.ip.map((ip, idx) => (
                    <Badge key={idx} variant="secondary">
                      {ip}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">操作系统:</span>
                <span className="text-foreground">
                  {host.os_name} {host.os_version}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">MAC地址:</span>
                <code className="font-mono text-xs text-foreground">{host.macs[0]}</code>
              </div>
            </div>
          </div>

          {/* Logic Group Selection */}
          <div className="space-y-2">
            <Label htmlFor="group">逻辑组</Label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger id="group">
                <SelectValue placeholder="选择逻辑组" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">不分配组</SelectItem>
                {logicGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.full_path}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Owner Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">负责人信息</h4>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ownerName">姓名 *</Label>
                <Input
                  id="ownerName"
                  value={ownerName}
                  onChange={(e) => handleFieldChange('ownerName', e.target.value, setOwnerName)}
                  placeholder="输入负责人姓名"
                  className={fieldErrors.ownerName ? "border-destructive" : ""}
                />
                {fieldErrors.ownerName && (
                  <p className="text-sm text-destructive">{fieldErrors.ownerName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerRole">角色</Label>
                <Select value={ownerRole} onValueChange={(value) => handleFieldChange('ownerRole', value, setOwnerRole)}>
                  <SelectTrigger id="ownerRole" className={fieldErrors.ownerRole ? "border-destructive" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="管理员">管理员</SelectItem>
                    <SelectItem value="使用者">使用者</SelectItem>
                    <SelectItem value="维护者">维护者</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors.ownerRole && (
                  <p className="text-sm text-destructive">{fieldErrors.ownerRole}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerPhone">电话</Label>
                <Input
                  id="ownerPhone"
                  value={ownerPhone}
                  onChange={(e) => handleFieldChange('ownerPhone', e.target.value, setOwnerPhone)}
                  placeholder="输入电话号码"
                  className={fieldErrors.ownerPhone ? "border-destructive" : ""}
                />
                {fieldErrors.ownerPhone && (
                  <p className="text-sm text-destructive">{fieldErrors.ownerPhone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerEmail">邮箱</Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => handleFieldChange('ownerEmail', e.target.value, setOwnerEmail)}
                  placeholder="输入邮箱地址"
                  className={fieldErrors.ownerEmail ? "border-destructive" : ""}
                />
                {fieldErrors.ownerEmail && (
                  <p className="text-sm text-destructive">{fieldErrors.ownerEmail}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={ownerName.trim() === ""}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}