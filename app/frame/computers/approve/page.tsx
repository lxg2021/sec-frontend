"use client"

import { useState } from "react"
import { LogicGroupUploader } from "@/features/collection/components/logic-group-uploader"
import { TreeLogicGroup } from "@/features/collection/components/tree-logic-group"
import type { UserLogicGroup } from "@/features/collection/types"
import type { TableLogicGroup } from "@/features/collection/table-types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { Toaster } from "@/shared/ui/toaster"
import Image from "next/image";
import { Computer, FileUp } from "lucide-react"
import { HostApproval } from "@/features/assets/approval/components/host-approval"
import { CollectionApproval } from "@/features/assets/approval/components/collection-approval"
import type { Host, LogicGroup } from "@/features/assets/approval/types"
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card"
import { mockHosts, mockLogicGroups } from '@/features/assets/approval/mock/approve';
import { useTranslations } from "next-intl"


export default function LogicGroupsPage() {
  const t = useTranslations("pages.computers.approve")
  const [uploadedGroups, setUploadedGroups] = useState<UserLogicGroup[]>([])
  const [uploadedFileName, setUploadedFileName] = useState<string>("")

  const handleGroupsUploaded = (groups: UserLogicGroup[], fileName: string) => {
    console.log("上传的逻辑组数量:", groups.length)
    console.log("逻辑组数据:", groups)
    setUploadedGroups(groups)
    setUploadedFileName(fileName)
  }

  const handleBeforeUpload = async (file: File): Promise<boolean> => {
    // 验证文件大小（最大5MB）
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error(t("fileTooLarge"))
    }
    return true
  }

  const handleSave = (tableGroups: TableLogicGroup[]) => {
    console.log("保存的TableLogicGroup数据:", tableGroups)
    console.log("数据条数:", tableGroups.length)
    // TODO: 这里可以调用API将数据发送到后台
    alert(t("saveSuccess", { count: tableGroups.length }))
  }

  const handleSubmit = (updatedHosts: Host[]) => {
    console.log("Updated hosts:", updatedHosts)
    // Here you would typically send the data to your backend
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Computer className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{t("title")}</h1>
              <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
            </div>
          </div>
        </div>

        {/** 上传组织结构文件, 编辑保存组织结构 */}
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Image src="/icons/computer/upload.svg" alt={t("uploadAlt")} width={16} height={16} />
              {t("uploadFile")}
            </TabsTrigger>
            <TabsTrigger
              value="edit"
              disabled={uploadedGroups.length === 0}
              className="flex items-center gap-2"
            >
              <Image src="/icons/computer/organization.svg" alt={t("editAlt")} width={16} height={16} />
              {t("editStructure")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <LogicGroupUploader onGroupsUploaded={handleGroupsUploaded} onBeforeUpload={handleBeforeUpload} />
          </TabsContent>

          <TabsContent value="edit" className="space-y-6">
            {uploadedGroups.length > 0 && (
              <TreeLogicGroup
                groups={uploadedGroups}
                onSave={handleSave}
                tenantId="default-tenant"
                createdBy="current-user"
              />
            )}
          </TabsContent>
        </Tabs>

        <Tabs defaultValue="host" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="host" className="flex items-center gap-2">
              <Computer className="h-4 w-4" />
              {t("hostApprovalTab")}
            </TabsTrigger>
            <TabsTrigger value="collection" className="flex items-center gap-2">
              <FileUp className="h-4 w-4" />
              {t("collectionApprovalTab")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="host" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white dark:bg-gray-800 rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                    <Computer className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
                      {t("approvalTitle")}
                    </CardTitle>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      {t("approvalDescription")}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-6">
                <HostApproval hosts={mockHosts} logicGroups={mockLogicGroups} pageSize={10} onSubmit={handleSubmit} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="collection" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white dark:bg-gray-800 rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
                    <FileUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
                      {t("collectionApprovalTitle")}
                    </CardTitle>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      {t("collectionApprovalDescription")}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-6">
                <CollectionApproval />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
      <Toaster />
    </div>
  )
}
