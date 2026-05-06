"use client"

import { useEffect, useMemo, useState } from "react"
import { Building2, Shield } from "lucide-react"
import { useTranslations } from "next-intl"
import { ScannerDownload } from "@/features/collection/components/scanner-download"
import { FileUploader } from "@/features/collection/components/file-uploader"
import { UserInfoTable } from "@/features/collection/components/user-info-table"
import { AssetCollectorFooter } from "@/features/collection/components/asset-collector-footer"
import type { CollectionImportData, UiAssetData, UserInfo } from "@/features/collection/types"
import { defaultCollectionTemplate, platformDownloads, PUBLIC_TENANT_ID } from "@/features/collection/lib/collection-template"
import { buildReplaceLogicTreeGroups, ensureLogicGroupIds, findLogicGroupIdByPath } from "@/features/collection/lib/logic-group-utils"
import { replaceLogicTree, importHosts, approveHost } from "@/features/collection/api"
import { validateEmail, validatePhone } from "@/features/collection/lib/validation"

export default function AssetCollectorPage() {
  const t = useTranslations("pages.collection")
  const [tenantId] = useState(PUBLIC_TENANT_ID)
  const [logicGroups, setLogicGroups] = useState(() => ensureLogicGroupIds([]))
  const [uploadedAssets, setUploadedAssets] = useState<UiAssetData[]>([])
  const [userInfos, setUserInfos] = useState<Record<string, UserInfo>>({})
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [submitMessage, setSubmitMessage] = useState("")

  useEffect(() => {
    const initialUserInfos: Record<string, UserInfo> = {}
    uploadedAssets.forEach((asset) => {
      initialUserInfos[asset.agent_id] = {
        name: asset.owner?.username || "",
        role: asset.owner?.role || "operator",
        phone: asset.owner?.phone || "",
        email: asset.owner?.email || "",
        department: asset.department_path || "",
      }
    })
    setUserInfos(initialUserInfos)
    setErrors({})
  }, [uploadedAssets])

  const tenantLabel = useMemo(() => tenantId, [tenantId])

  const handleBeforeUpload = async (file: File): Promise<boolean> => {
    if (!file.name.endsWith(".json")) {
      throw new Error(t("validation.jsonFileOnly"))
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error(t("validation.fileTooLarge"))
    }

    return true
  }

  const handleFileUploaded = (data: CollectionImportData) => {
    setLogicGroups(ensureLogicGroupIds(data.logic_groups))
    setUploadedAssets(data.hosts)
    setSubmitMessage("")
  }

  const handleUserInfoChange = (hostId: string, field: keyof UserInfo, value: string) => {
    setUserInfos((prev) => ({
      ...prev,
      [hostId]: {
        ...prev[hostId],
        [field]: value,
      },
    }))

    setErrors((prev) => ({
      ...prev,
      [hostId]: {
        ...prev[hostId],
        [field]: "",
      },
    }))
  }

  const handleFieldBlur = (hostId: string, field: keyof UserInfo, value: string) => {
    let error = ""

    if (field === "email" && value && !validateEmail(value)) {
      error = t("validation.emailInvalid")
    }

    if (field === "phone" && value && !validatePhone(value)) {
      error = t("validation.phoneInvalid")
    }

    if (error) {
      setErrors((prev) => ({
        ...prev,
        [hostId]: {
          ...prev[hostId],
          [field]: error,
        },
      }))
    }
  }

  const handleSave = async () => {
    const newErrors: Record<string, Record<string, string>> = {}
    let hasError = false

    uploadedAssets.forEach((asset) => {
      const userInfo = userInfos[asset.agent_id]
      const assetErrors: Record<string, string> = {}

      if (!userInfo?.name) {
        assetErrors.name = t("validation.nameRequired")
        hasError = true
      }
      if (!userInfo?.phone) {
        assetErrors.phone = t("validation.phoneRequired")
        hasError = true
      } else if (!validatePhone(userInfo.phone)) {
        assetErrors.phone = t("validation.phoneInvalid")
        hasError = true
      }
      if (!userInfo?.email) {
        assetErrors.email = t("validation.emailRequired")
        hasError = true
      } else if (!validateEmail(userInfo.email)) {
        assetErrors.email = t("validation.emailInvalid")
        hasError = true
      }
      if (!userInfo?.department) {
        assetErrors.department = t("validation.departmentRequired")
        hasError = true
      } else if (!findLogicGroupIdByPath(logicGroups, userInfo.department)) {
        assetErrors.department = t("validation.departmentInvalid")
        hasError = true
      }

      if (Object.keys(assetErrors).length > 0) {
        newErrors[asset.agent_id] = assetErrors
      }
    })

    setErrors(newErrors)

    if (hasError) {
      setSubmitMessage("")
      return
    }

    setIsSaving(true)
    try {
      const logicTreeGroups = buildReplaceLogicTreeGroups(logicGroups)
      await replaceLogicTree(tenantId, logicTreeGroups)

      const confirmedAssets = uploadedAssets.map((asset) => {
        const userInfo = userInfos[asset.agent_id]
        const groupId = userInfo.department ? findLogicGroupIdByPath(logicGroups, userInfo.department) : undefined

        return {
          ...asset,
          group_id: groupId,
          department_path: userInfo.department,
          owner: {
            username: userInfo.name,
            phone: userInfo.phone,
            email: userInfo.email,
            role: userInfo.role,
          },
        }
      })

      const hostsPayload = confirmedAssets.map((asset) => {
        const owner = asset.owner
        return {
          request_id: String(Date.now()),
          agent_id: asset.agent_id,
          hostname: asset.hostname,
          ip: asset.ip,
          os_type: asset.os_type || "unknown",
          os_name: asset.os_name,
          os_version: asset.os_version,
          product_id: asset.product_id,
          cpu_id: asset.cpu_id,
          board_serial: asset.board_serial,
          harddisk_id: asset.harddisk_id,
          macs: asset.macs,
          group_id: asset.group_id,
          owner: owner
            ? {
                agent_id: asset.agent_id,
                username: owner.username,
                phone: owner.phone,
                email: owner.email,
                role: owner.role,
              }
            : undefined,
          tenant_id: tenantId,
          timestamp: Date.now(),
        }
      })

      await importHosts(tenantId, hostsPayload)

      await Promise.all(confirmedAssets.map((asset) => approveHost(tenantId, asset)))

      setSubmitMessage(t("validation.saveSuccess"))
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : t("validation.saveFailed"))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between rounded-xl border bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{t("title")}</h1>
              <p className="text-sm text-gray-500">{t("subtitle")}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>{tenantLabel}</span>
          </div>
        </div>

        <ScannerDownload platforms={platformDownloads} />

        <FileUploader
          onFileUploaded={handleFileUploaded}
          onBeforeUpload={handleBeforeUpload}
          templateData={defaultCollectionTemplate}
          acceptDisplay={t("uploader.acceptDisplay")}
        />

        {submitMessage && (
          <div className="rounded-md border bg-white px-4 py-3 text-sm text-gray-700 shadow-sm">{submitMessage}</div>
        )}

        <UserInfoTable
          assets={uploadedAssets}
          userInfos={userInfos}
          errors={errors}
          userLogicGroups={logicGroups}
          onUserInfoChange={handleUserInfoChange}
          onFieldBlur={handleFieldBlur}
          onSave={handleSave}
        />

        {isSaving && (
          <div className="text-sm text-muted-foreground">
            {t("validation.saving")}
          </div>
        )}
      </div>

      <AssetCollectorFooter />
    </div>
  )
}
