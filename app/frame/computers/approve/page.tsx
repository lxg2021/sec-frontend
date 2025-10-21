"use client"

import { useState } from "react"
import { LogicGroupUploader } from "@/components/computer/logic-group-uploader"
import { TreeLogicGroup } from "@/components/computer/tree-logic-group"
import type { UserLogicGroup } from "@/lib/computer/ui-asset-data"
import type { TableLogicGroup } from "@/lib/computer/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toaster } from "@/components/ui/toaster"
import Image from "next/image";
import { Computer, FileUp } from "lucide-react"
import { HostApproval } from "@/components/hostapproval/HostApproval"
import type { Host, LogicGroup } from "@/components/hostapproval/computer"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { mockHosts, mockLogicGroups } from '@/data/mock-data-approve';


export default function LogicGroupsPage() {
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
      throw new Error("文件大小超过限制(最大5MB)")
    }
    return true
  }

  const handleSave = (tableGroups: TableLogicGroup[]) => {
    console.log("保存的TableLogicGroup数据:", tableGroups)
    console.log("数据条数:", tableGroups.length)
    // TODO: 这里可以调用API将数据发送到后台
    alert(`成功保存 ${tableGroups.length} 条组织结构数据！`)
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
              <h1 className="text-2xl font-semibold text-gray-900">主机审批</h1>
              <p className="text-sm text-gray-500 mt-1">Host Approval</p>
            </div>
          </div>
        </div>

        {/** 上传组织结构文件, 编辑保存组织结构 */}
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Image src="/icons/computer/upload.svg" alt="上传" width={16} height={16} />
              上传文件
            </TabsTrigger>
            <TabsTrigger
              value="edit"
              disabled={uploadedGroups.length === 0}
              className="flex items-center gap-2"
            >
              <Image src="/icons/computer/organization.svg" alt="编辑" width={16} height={16} />
              编辑结构
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

        {/** 主机人工审批 */}
        <Card className="border-0 shadow-lg bg-white dark:bg-gray-800 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <Computer className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
                  主机审批
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  可筛选、编辑、主机所属组与使用者
                </p>
              </div>
            </div>
            {/* 如果需要右上角加操作按钮，可以在这里加入 */}
          </CardHeader>
          <CardContent className="pb-6">
            <HostApproval hosts={mockHosts} logicGroups={mockLogicGroups} pageSize={10} onSubmit={handleSubmit} />
          </CardContent>
        </Card>

      </div>
      <Toaster />
    </div>
  )
}
