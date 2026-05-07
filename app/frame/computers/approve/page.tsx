"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Computer, FileUp, Loader2, RefreshCcw } from "lucide-react"

import { CollectionApproval } from "@/features/assets/approval/components/collection-approval"
import { HostApproval } from "@/features/assets/approval/components/host-approval"
import { approveHost, getApprovalHosts, getApprovalLogicGroups } from "@/features/assets/approval/host-api"
import { findHostsNeedingApproval } from "@/features/assets/approval/host-adapters"
import { backendLogicGroupsToUserTree } from "@/features/assets/approval/logic-group-tree-adapter"
import type { Host, LogicGroup } from "@/features/assets/approval/types"
import { replaceLogicTree } from "@/features/collection/api"
import { LogicGroupUploader } from "@/features/collection/components/logic-group-uploader"
import { TreeLogicGroup } from "@/features/collection/components/tree-logic-group"
import type { TableLogicGroup } from "@/features/collection/table-types"
import type { BackendLogicGroupCreateData, UserLogicGroup } from "@/features/collection/types"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { Toaster } from "@/shared/ui/toaster"
import { useToast } from "@/shared/hooks/use-toast"

const TENANT_ID = "public"
const HOST_FETCH_PAGE_SIZE = 200

type LogicGroupLoadStatus = "loading" | "loaded" | "error"
type HostLoadStatus = "loading" | "loaded" | "error"

export default function LogicGroupsPage() {
  const t = useTranslations("pages.computers.approve")
  const { toast } = useToast()
  const [uploadedGroups, setUploadedGroups] = useState<UserLogicGroup[]>([])
  const [uploadedFileName, setUploadedFileName] = useState("")
  const [logicGroups, setLogicGroups] = useState<LogicGroup[]>([])
  const [logicGroupStatus, setLogicGroupStatus] = useState<LogicGroupLoadStatus>("loading")
  const [logicGroupError, setLogicGroupError] = useState("")
  const [logicGroupTab, setLogicGroupTab] = useState("upload")
  const [logicGroupTreeVersion, setLogicGroupTreeVersion] = useState(0)
  const [savingLogicGroups, setSavingLogicGroups] = useState(false)
  const [hosts, setHosts] = useState<Host[]>([])
  const [originalHosts, setOriginalHosts] = useState<Host[]>([])
  const [hostStatus, setHostStatus] = useState<HostLoadStatus>("loading")
  const [hostError, setHostError] = useState("")
  const [savingHosts, setSavingHosts] = useState(false)

  const loadLogicGroups = useCallback(async () => {
    setLogicGroupStatus("loading")
    setLogicGroupError("")

    try {
      const backendGroups = await getApprovalLogicGroups(TENANT_ID)
      const userGroups = backendLogicGroupsToUserTree(backendGroups)

      setLogicGroups(backendGroups)
      setUploadedGroups(userGroups)
      setUploadedFileName("")
      setLogicGroupTreeVersion((value) => value + 1)
      setLogicGroupTab(userGroups.length > 0 ? "edit" : "upload")
      setLogicGroupStatus("loaded")
    } catch (error) {
      const message = error instanceof Error ? error.message : "加载组织结构失败"
      setLogicGroups([])
      setUploadedGroups([])
      setLogicGroupTab("upload")
      setLogicGroupError(message)
      setLogicGroupStatus("error")
      toast({
        title: "加载组织结构失败",
        description: message,
        variant: "destructive",
      })
    }
  }, [toast])

  useEffect(() => {
    void loadLogicGroups()
  }, [loadLogicGroups])

  const loadHosts = useCallback(async () => {
    setHostStatus("loading")
    setHostError("")

    try {
      const firstPage = await getApprovalHosts({
        tenantId: TENANT_ID,
        page: 1,
        pageSize: HOST_FETCH_PAGE_SIZE,
      })
      const loadedHosts = [...firstPage.hosts]
      const totalPages = Math.max(1, firstPage.pagination.total_pages || 1)

      for (let page = 2; page <= totalPages; page += 1) {
        const nextPage = await getApprovalHosts({
          tenantId: TENANT_ID,
          page,
          pageSize: HOST_FETCH_PAGE_SIZE,
        })
        loadedHosts.push(...nextPage.hosts)
      }

      setHosts(loadedHosts)
      setOriginalHosts(loadedHosts)
      setHostStatus("loaded")
    } catch (error) {
      const message = error instanceof Error ? error.message : t("hostLoadFailed")
      setHosts([])
      setOriginalHosts([])
      setHostError(message)
      setHostStatus("error")
      toast({
        title: t("hostLoadFailed"),
        description: message,
        variant: "destructive",
      })
    }
  }, [t, toast])

  useEffect(() => {
    void loadHosts()
  }, [loadHosts])

  const handleGroupsUploaded = (groups: UserLogicGroup[], fileName: string) => {
    console.log("上传的逻辑组数量:", groups.length)
    console.log("逻辑组数据:", groups)
    setUploadedGroups(groups)
    setUploadedFileName(fileName)
    setLogicGroupTab("edit")
    setLogicGroupTreeVersion((value) => value + 1)
  }

  const handleBeforeUpload = async (file: File): Promise<boolean> => {
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error(t("fileTooLarge"))
    }
    return true
  }

  const handleSave = async (tableGroups: TableLogicGroup[]) => {
    console.log("保存的TableLogicGroup数据:", tableGroups)
    console.log("数据条数:", tableGroups.length)
    setSavingLogicGroups(true)

    try {
      const groups: BackendLogicGroupCreateData[] = tableGroups.map((group) => ({
        id: group.id,
        ...(group.parent_id ? { parent_id: group.parent_id } : {}),
        name: group.name,
        full_path: group.full_path,
        full_path_ids: group.full_path_ids,
        company_name: group.company_name,
        ...(group.department_name ? { department_name: group.department_name } : {}),
        ...(group.description ? { description: group.description } : {}),
      }))

      await replaceLogicTree(TENANT_ID, groups)
      toast({
        title: t("saveSuccess", { count: tableGroups.length }),
      })
      await loadLogicGroups()
    } catch (error) {
      toast({
        title: "保存组织结构失败",
        description: error instanceof Error ? error.message : "发生未知错误",
        variant: "destructive",
      })
    } finally {
      setSavingLogicGroups(false)
    }
  }

  const handleSubmit = async (updatedHosts: Host[]) => {
    const changedHosts = findHostsNeedingApproval(originalHosts, updatedHosts)

    if (changedHosts.length === 0) {
      toast({
        title: t("hostApproveNoChanges"),
      })
      return
    }

    setSavingHosts(true)
    try {
      for (const host of changedHosts) {
        await approveHost(TENANT_ID, host)
      }
      toast({
        title: t("hostApproveSuccess", { count: changedHosts.length }),
      })
      await loadHosts()
    } catch (error) {
      toast({
        title: t("hostApproveFailed"),
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setSavingHosts(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <Computer className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{t("title")}</h1>
              <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
            </div>
          </div>
        </div>

        <Tabs value={logicGroupTab} onValueChange={setLogicGroupTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Image src="/icons/computer/upload.svg" alt={t("uploadAlt")} width={16} height={16} />
              {t("uploadFile")}
            </TabsTrigger>
            <TabsTrigger
              value="edit"
              disabled={uploadedGroups.length === 0 || logicGroupStatus === "loading"}
              className="flex items-center gap-2"
            >
              <Image src="/icons/computer/organization.svg" alt={t("editAlt")} width={16} height={16} />
              {t("editStructure")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            {logicGroupStatus === "loading" && (
              <div className="flex items-center gap-2 rounded-lg border bg-white p-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                正在加载组织结构...
              </div>
            )}
            {logicGroupStatus === "error" && (
              <div className="flex flex-col gap-3 rounded-lg border border-destructive/40 bg-white p-4 text-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-medium text-destructive">加载组织结构失败</div>
                  <div className="mt-1 text-muted-foreground">{logicGroupError}</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => void loadLogicGroups()}>
                  <RefreshCcw className="h-4 w-4" />
                  重新加载
                </Button>
              </div>
            )}
            {logicGroupStatus === "loaded" && uploadedGroups.length === 0 && (
              <div className="rounded-lg border bg-white p-3 text-sm text-muted-foreground">
                暂无组织结构，请上传组织结构文件。
              </div>
            )}
            <LogicGroupUploader
              onGroupsUploaded={handleGroupsUploaded}
              onBeforeUpload={handleBeforeUpload}
              disabled={logicGroupStatus === "loading"}
            />
          </TabsContent>

          <TabsContent value="edit" className="space-y-6">
            {uploadedGroups.length > 0 && (
              <TreeLogicGroup
                key={`${logicGroupTreeVersion}-${uploadedFileName || "backend"}`}
                groups={uploadedGroups}
                onSave={handleSave}
                disabled={savingLogicGroups}
                tenantId={TENANT_ID}
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
            <Card className="rounded-xl border-0 bg-white shadow-lg dark:bg-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex items-center space-x-3">
                  <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-2">
                    <Computer className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
                      {t("approvalTitle")}
                    </CardTitle>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {t("approvalDescription")}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-6">
                {hostStatus === "loading" && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border bg-white p-3 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("hostLoading")}
                  </div>
                )}
                {hostStatus === "error" && (
                  <div className="mb-4 flex flex-col gap-3 rounded-lg border border-destructive/40 bg-white p-4 text-sm md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-medium text-destructive">{t("hostLoadFailed")}</div>
                      <div className="mt-1 text-muted-foreground">{hostError}</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => void loadHosts()}>
                      <RefreshCcw className="h-4 w-4" />
                      {t("hostRetry")}
                    </Button>
                  </div>
                )}
                <HostApproval
                  hosts={hosts}
                  logicGroups={logicGroups}
                  pageSize={10}
                  loading={hostStatus === "loading" || savingHosts}
                  onSubmit={handleSubmit}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="collection" className="space-y-6">
            <Card className="rounded-xl border-0 bg-white shadow-lg dark:bg-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex items-center space-x-3">
                  <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 p-2">
                    <FileUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
                      {t("collectionApprovalTitle")}
                    </CardTitle>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
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
