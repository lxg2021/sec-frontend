"use client"

import { useEffect, useState } from "react"
import { ScannerDownload } from "@/features/collection/components/scanner-download"
import { FileUploader } from "@/features/collection/components/file-uploader"
import { UserInfoTable } from "@/features/collection/components/user-info-table"
import { AssetCollectorFooter } from "@/features/collection/components/asset-collector-footer"
import { platforms } from "@/features/collection/mock/platforms"
import { mockUserLogicGroups } from "@/features/collection/mock/user-info-table-props"
import { defaultTemplateData } from "@/features/collection/mock/file-uploader-props"
import { validateEmail, validatePhone } from "@/features/collection/lib/validation"
import type { UiAssetData, UserInfo } from "@/features/collection/types"
import { useTranslations } from "next-intl"

export default function AssetCollectorPage() {
  const t = useTranslations("pages.collection")
  const [uploadedAssets, setUploadedAssets] = useState<UiAssetData[]>([])
  const [userInfos, setUserInfos] = useState<Record<string, UserInfo>>({})
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({})

  useEffect(() => {
    if (uploadedAssets.length > 0) {
      const initialUserInfos: Record<string, UserInfo> = {}
      uploadedAssets.forEach((asset) => {
        initialUserInfos[asset.host_id] = {
          name: asset.owner_name || "",
          phone: asset.phone || "",
          email: asset.email || "",
          department: asset.department_path || "",
        }
      })
      setUserInfos(initialUserInfos)
      setErrors({})
    }
  }, [uploadedAssets])

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

  const handleFileUploaded = (data: UiAssetData[]) => {
    setUploadedAssets(data)
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

  const handleSave = () => {
    const newErrors: Record<string, Record<string, string>> = {}
    let hasError = false

    uploadedAssets.forEach((asset) => {
      const userInfo = userInfos[asset.host_id]
      const assetErrors: Record<string, string> = {}

      if (!userInfo.name) {
        assetErrors.name = t("validation.nameRequired")
        hasError = true
      }
      if (!userInfo.phone) {
        assetErrors.phone = t("validation.phoneRequired")
        hasError = true
      } else if (!validatePhone(userInfo.phone)) {
        assetErrors.phone = t("validation.phoneInvalid")
        hasError = true
      }
      if (!userInfo.email) {
        assetErrors.email = t("validation.emailRequired")
        hasError = true
      } else if (!validateEmail(userInfo.email)) {
        assetErrors.email = t("validation.emailInvalid")
        hasError = true
      }
      if (!userInfo.department) {
        assetErrors.department = t("validation.departmentRequired")
        hasError = true
      }

      if (Object.keys(assetErrors).length > 0) {
        newErrors[asset.host_id] = assetErrors
      }
    })

    setErrors(newErrors)

    if (!hasError) {
      alert(t("validation.saveSuccess"))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt={t("logoAlt")} className="h-9 w-auto" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900">{t("title")}</h1>
              <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
            </div>
          </div>
        </div>

        <ScannerDownload platforms={platforms} />

        <FileUploader
          onFileUploaded={handleFileUploaded}
          onBeforeUpload={handleBeforeUpload}
          templateData={defaultTemplateData}
          acceptDisplay={t("uploader.acceptDisplay")}
        />

        <UserInfoTable
          assets={uploadedAssets}
          userInfos={userInfos}
          errors={errors}
          userLogicGroups={mockUserLogicGroups}
          onUserInfoChange={handleUserInfoChange}
          onFieldBlur={handleFieldBlur}
          onSave={handleSave}
        />
      </div>

      <AssetCollectorFooter />
    </div>
  )
}
