"use client"

import { useState } from "react"
import { LogicGroupUploader } from "@/components/computer/logic-group-uploader"
import { TreeLogicGroup } from "@/components/computer/tree-logic-group"
import type { UserLogicGroup } from "@/lib/computer/ui-asset-data"
import type { TableLogicGroup } from "@/lib/computer/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toaster } from "@/components/ui/toaster"

export default function LogicGroupsPage() {
  const [uploadedGroups, setUploadedGroups] = useState<UserLogicGroup[]>([])
  const [uploadedFileName, setUploadedFileName] = useState<string>("")

  const handleGroupsUploaded = (groups: UserLogicGroup[], fileName: string) => {
    console.log("[v0] 上传的逻辑组数量:", groups.length)
    console.log("[v0] 逻辑组数据:", groups)
    setUploadedGroups(groups)
    setUploadedFileName(fileName)
  }

  const handleBeforeUpload = async (file: File): Promise<boolean> => {
    // 验证文件大小（最大5MB）
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error("文件大小超过限制（最大5MB）")
    }
    return true
  }

  const handleSave = (tableGroups: TableLogicGroup[]) => {
    console.log("[v0] 保存的TableLogicGroup数据:", tableGroups)
    console.log("[v0] 数据条数:", tableGroups.length)
    // TODO: 这里可以调用API将数据发送到后台
    alert(`成功保存 ${tableGroups.length} 条组织结构数据！`)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">逻辑组织结构管理</h1>
            <p className="text-muted-foreground">上传并管理公司的组织结构（公司/部门/组）</p>
          </div>

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">上传文件</TabsTrigger>
              <TabsTrigger value="edit" disabled={uploadedGroups.length === 0}>
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
        </div>
        <Toaster />
      </main>

    </div>
  )
}
