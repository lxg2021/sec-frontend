"use client"

import { useState, useEffect } from "react"
import { AssetCollectorHeader } from "@/components/computer/header"
import { ScannerDownload } from "@/components/computer/scanner-download"
import { FileUploader } from "@/components/computer/file-uploader"
import { UserInfoTable } from "@/components/computer/user-info-table"
import { AssetCollectorFooter } from "@/components/computer/footer"
import { platforms } from "@/lib/computer/platforms"
import { mockUserLogicGroups } from "@/lib/computer/user-logic-groups"
import { defaultTemplateData } from "@/lib/computer/uploader"
import { validateEmail, validatePhone } from "@/lib/computer/utils/validation"
import type { AssetData, UserInfo } from "@/lib/computer/asset"
import { Computer } from "lucide-react"

export default function AssetCollectorPage() {
  const [uploadedAssets, setUploadedAssets] = useState<AssetData[]>([])
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
    // 检查文件类型
    if (!file.name.endsWith(".json")) {
      throw new Error("请上传 JSON 格式的文件")
    }

    // 检查文件大小（例如限制10MB）
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      throw new Error("文件大小不能超过 10MB")
    }

    return true
  }

  const handleFileUploaded = (data: AssetData[], fileName: string) => {
    console.log("[v0] 文件上传成功:", fileName, "资产数量:", data.length)
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

    // 清除错误信息
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

    if (field === "email" && value) {
      if (!validateEmail(value)) {
        error = "邮箱格式不正确"
      }
    }

    if (field === "phone" && value) {
      if (!validatePhone(value)) {
        error = "手机号格式不正确"
      }
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

      // 验证必填字段
      if (!userInfo.name) {
        assetErrors.name = "姓名为必填项"
        hasError = true
      }
      if (!userInfo.phone) {
        assetErrors.phone = "电话为必填项"
        hasError = true
      } else if (!validatePhone(userInfo.phone)) {
        assetErrors.phone = "手机号格式不正确"
        hasError = true
      }
      if (!userInfo.email) {
        assetErrors.email = "邮箱为必填项"
        hasError = true
      } else if (!validateEmail(userInfo.email)) {
        assetErrors.email = "邮箱格式不正确"
        hasError = true
      }
      if (!userInfo.department) {
        assetErrors.department = "部门为必填项"
        hasError = true
      }

      if (Object.keys(assetErrors).length > 0) {
        newErrors[asset.host_id] = assetErrors
      }
    })

    setErrors(newErrors)

    if (!hasError) {
      console.log("[v0] 保存数据:", { assets: uploadedAssets, userInfos })
      alert("保存成功！")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        {/* 标题区域 - 居中显示 */}
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <div className="flex items-center gap-3">
              <img
                src="/logo.svg"
                alt="信息采集"
                className="h-9 w-auto"
              />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900">信息采集</h1>
              <p className="text-sm text-gray-500 mt-1">Information Collection</p>
            </div>
          </div>
        </div>

        {/* Scanner Download Section */}
        <ScannerDownload platforms={platforms} />

        {/* File Upload Section */}
        <FileUploader
          onFileUploaded={handleFileUploaded}
          onBeforeUpload={handleBeforeUpload}
          templateData={defaultTemplateData}
        />

        {/* User Info Table Section */}
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
