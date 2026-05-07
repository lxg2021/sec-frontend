"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Computer, FileUp, Loader2, RefreshCcw, Save } from "lucide-react"

import { CollectionApproval } from "@/features/assets/approval/components/collection-approval"
import { HostApproval } from "@/features/assets/approval/components/host-approval"
import {
  approveHost,
  getApprovalHosts,
  getApprovalLogicGroups,
  type HostPagination,
} from "@/features/assets/approval/host-api"
import { findHostsNeedingApproval } from "@/features/assets/approval/host-adapters"
import { backendLogicGroupsToUserTree } from "@/features/assets/approval/logic-group-tree-adapter"
import type { Host, LogicGroup } from "@/features/assets/approval/types"
import { replaceLogicTree } from "@/features/collection/api"
import { LogicGroupUploader } from "@/features/collection/components/logic-group-uploader"
import { TreeLogicGroup } from "@/features/collection/components/tree-logic-group"
import type { TableLogicGroup } from "@/features/collection/table-types"
import type { BackendLogicGroupCreateData, UserLogicGroup } from "@/features/collection/types"
import { useToast } from "@/shared/hooks/use-toast"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Toaster } from "@/shared/ui/toaster"

const TENANT_ID = "public"
const HOST_FETCH_PAGE_SIZE = 10

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
  const [logicGroupTreeVersion, setLogicGroupTreeVersion] = useState(0)
  const [logicGroupSaveRequestVersion, setLogicGroupSaveRequestVersion] = useState(0)
  const [savingLogicGroups, setSavingLogicGroups] = useState(false)
  const [hosts, setHosts] = useState<Host[]>([])
  const [originalHosts, setOriginalHosts] = useState<Host[]>([])
  const [hostPagination, setHostPagination] = useState<HostPagination>({
    current_page: 1,
    page_size: HOST_FETCH_PAGE_SIZE,
    total_count: 0,
    total_pages: 1,
    has_previous: false,
    has_next: false,
  })
  const [hostQuery, setHostQuery] = useState({
    page: 1,
    pageSize: HOST_FETCH_PAGE_SIZE,
    groupId: undefined as string | undefined,
    revision: 0,
  })
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
      setLogicGroupStatus("loaded")
    } catch (error) {
      const message = error instanceof Error ? error.message : "加载组织结构失败"
      setLogicGroups([])
      setUploadedGroups([])
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
    const { page, pageSize, groupId } = hostQuery

    try {
      const result = await getApprovalHosts({
        tenantId: TENANT_ID,
        page,
        pageSize,
        ...(groupId ? { groupId } : {}),
      })
      setHosts(result.hosts)
      setOriginalHosts(result.hosts)
      setHostPagination(result.pagination)
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
  }, [hostQuery, t, toast])

  useEffect(() => {
    void loadHosts()
  }, [loadHosts])

  const handleHostQueryChange = useCallback((query: { page: number; pageSize: number; groupId?: string }) => {
    setHostQuery((previous) => ({
      page: query.page,
      pageSize: query.pageSize,
      groupId: query.groupId,
      revision: previous.revision + 1,
    }))
  }, [])

  const handleGroupsUploaded = (groups: UserLogicGroup[], fileName: string) => {
    setUploadedGroups(groups)
    setUploadedFileName(fileName)
    setLogicGroupError("")
    setLogicGroupStatus("loaded")
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

  const handleRequestLogicSave = () => {
    if (savingLogicGroups || logicGroupStatus === "loading" || uploadedGroups.length === 0) {
      return
    }

    setLogicGroupSaveRequestVersion((value) => value + 1)
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

        <section data-approve-section="logic" className="dark space-y-4">
          <Card className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 text-slate-100 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2">
                  <Computer className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-100">
                    {t("editStructure")}
                  </CardTitle>
                  <p className="mt-1 text-sm text-slate-400">
                    左侧编辑组织树，右侧导入配置。
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void loadLogicGroups()}
                disabled={logicGroupStatus === "loading"}
                className="text-slate-300 hover:bg-slate-800 hover:text-slate-50"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                重新加载
              </Button>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
                <div className="flex min-h-[640px] flex-col rounded-lg border border-slate-800 bg-slate-900/70 shadow-sm">
                  <div className="border-b border-slate-800 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-xs text-slate-400">
                        {uploadedFileName ? `来源：${uploadedFileName}` : "来源：后端组织结构"}
                      </div>
                      <Button
                        onClick={handleRequestLogicSave}
                        disabled={savingLogicGroups || logicGroupStatus === "loading" || uploadedGroups.length === 0}
                        className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                      >
                        {savingLogicGroups ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            保存中...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            保存结构
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col space-y-4 p-4">
                    {logicGroupStatus === "loading" && (
                      <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        正在加载组织结构...
                      </div>
                    )}
                    {logicGroupStatus === "error" && (
                      <div className="flex flex-col gap-3 rounded-lg border border-rose-500/40 bg-rose-500/10 p-4 text-sm md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="font-medium text-rose-300">加载组织结构失败</div>
                          <div className="mt-1 text-slate-400">{logicGroupError}</div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void loadLogicGroups()}
                          className="border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800"
                        >
                          <RefreshCcw className="h-4 w-4" />
                          重新加载
                        </Button>
                      </div>
                    )}
                    <div className="flex-1 text-slate-200 [&_input]:border-slate-700 [&_input]:bg-slate-950/70 [&_input]:text-slate-100 [&_input]:placeholder:text-slate-500">
                      <TreeLogicGroup
                        key={`${logicGroupTreeVersion}-${uploadedFileName || "backend"}`}
                        groups={uploadedGroups}
                        onSave={handleSave}
                        disabled={savingLogicGroups}
                        tenantId={TENANT_ID}
                        hideSaveButton
                        saveRequestVersion={logicGroupSaveRequestVersion}
                        showFrame={false}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex h-full flex-col rounded-lg border border-slate-800 bg-slate-900/70 shadow-sm">
                  <div className="border-b border-slate-800 p-4">
                    <h3 className="text-base font-semibold text-slate-100">导入配置</h3>
                    <p className="mt-1 text-sm text-slate-400">上传组织结构文件，校验后同步到左侧树。</p>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col space-y-4 p-4">
                    <LogicGroupUploader
                      onGroupsUploaded={handleGroupsUploaded}
                      onBeforeUpload={handleBeforeUpload}
                      disabled={logicGroupStatus === "loading"}
                      showFrame={false}
                    />
                    <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs leading-5 text-slate-400">
                      导入完成后，直接在左侧树上新增、改名、删除和调整层级。
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section data-approve-section="host" className="space-y-6">
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
                pagination={hostPagination}
                loading={hostStatus === "loading" || savingHosts}
                onQueryChange={handleHostQueryChange}
                onSubmit={handleSubmit}
              />
            </CardContent>
          </Card>
        </section>

        <section data-approve-section="collection" className="space-y-6">
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
        </section>
      </div>
      <Toaster />
    </div>
  )
}
