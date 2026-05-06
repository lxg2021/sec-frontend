"use client"

import { useEffect, useMemo, useState } from "react"
import { Building2, Layers3 } from "lucide-react"
import { useTranslations } from "next-intl"
import { ScannerDownload } from "@/features/collection/components/scanner-download"
import { FileUploader } from "@/features/collection/components/file-uploader"
import { UserInfoTable } from "@/features/collection/components/user-info-table"
import { AssetCollectorFooter } from "@/features/collection/components/asset-collector-footer"
import { LanguageSwitch } from "@/shared/i18n/language-switch"
import { Card, CardContent } from "@/shared/ui/card"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import type { CollectionImportData, UiAssetData, UserInfo } from "@/features/collection/types"
import { defaultCollectionTemplate, platformDownloads, PUBLIC_TENANT_ID } from "@/features/collection/lib/collection-template"
import { ensureLogicGroupIds, findLogicGroupIdByPath } from "@/features/collection/lib/logic-group-utils"
import { getLogicGroups, submitCollection } from "@/features/collection/api"
import { validateEmail, validatePhone } from "@/features/collection/lib/validation"

export default function AssetCollectorPage() {
  const t = useTranslations("pages.collection")
  const [tenantId] = useState(PUBLIC_TENANT_ID)
  const [logicGroups, setLogicGroups] = useState(() => ensureLogicGroupIds([]))
  const [uploadedAssets, setUploadedAssets] = useState<UiAssetData[]>([])
  const [userInfos, setUserInfos] = useState<Record<string, UserInfo>>({})
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [submitMessage, setSubmitMessage] = useState("")

  useEffect(() => {
    let canceled = false

    async function loadLogicGroups() {
      setIsLoadingGroups(true)
      try {
        const response = await getLogicGroups(tenantId)
        if (!canceled) {
          setLogicGroups(logicGroupsFromBackend(response.data))
        }
      } catch (error) {
        if (!canceled) {
          setSubmitMessage(error instanceof Error ? error.message : t("validation.logicGroupsLoadFailed"))
        }
      } finally {
        if (!canceled) {
          setIsLoadingGroups(false)
        }
      }
    }

    loadLogicGroups()

    return () => {
      canceled = true
    }
  }, [tenantId, t])

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

      await submitCollection({
        tenant_id: tenantId,
        logic_groups: logicGroups,
        hosts: confirmedAssets,
        metadata: {
          source: "collection-page",
          template_version: "2",
        },
      })

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
        <Card className="border-0 bg-gray-50 shadow-none">
          <CardContent className="px-5 py-4">
            <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
              <div className="flex items-center justify-center sm:justify-start">
                <LanguageSwitch className="h-9 w-9 rounded-md border text-slate-600 hover:bg-slate-50 hover:text-slate-900" />
              </div>

              <div className="flex items-center justify-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-black/10 bg-transparent">
                  <Layers3 className="h-5 w-5 text-black" />
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t("title")}</h1>
              </div>

              <div className="flex items-center justify-center sm:justify-end">
                <div className="flex items-center gap-2">
                  <Label htmlFor="collection-tenant" className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    {t("tenant.label")}
                  </Label>
                  <Select value={tenantLabel}>
                    <SelectTrigger id="collection-tenant" className="h-9 w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PUBLIC_TENANT_ID}>{t("tenant.value")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
          isLoadingLogicGroups={isLoadingGroups}
          isSaving={isSaving}
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

function logicGroupsFromBackend(groups: any[]): ReturnType<typeof ensureLogicGroupIds> {
  const items = Array.isArray(groups) ? groups : []
  const byParent = new Map<string, any[]>()

  items.forEach((item) => {
    const parentId = String(item.parent_id || "")
    byParent.set(parentId, [...(byParent.get(parentId) || []), item])
  })

  const build = (parentId = ""): any[] => {
    return (byParent.get(parentId) || []).map((item) => ({
      id: String(item.id || ""),
      name: String(item.name || ""),
      path: String(item.full_path || item.name || ""),
      type: logicGroupTypeFromBackend(item),
      parentId: item.parent_id || undefined,
      children: build(String(item.id || "")),
    }))
  }

  return ensureLogicGroupIds(build())
}

function logicGroupTypeFromBackend(item: any) {
  const type = item.type ?? item.group_type
  if (type === "company" || type === "department" || type === "group") {
    return type
  }
  if (Number(type) === 1) return "company"
  if (Number(type) === 2) return "department"
  return "group"
}
