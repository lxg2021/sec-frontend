"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import {
  Activity,
  Computer,
  Download,
  FileUp,
  FolderTree,
  Loader2,
  Plus,
  RefreshCcw,
  Save,
} from "lucide-react"

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
import { generateLogicGroupTemplate } from "@/features/collection/lib/logic-group-parser"
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

function countLogicNodes(groups: UserLogicGroup[]): number {
  return groups.reduce((total, group) => total + 1 + countLogicNodes(group.children || []), 0)
}

function countOnlineHosts(hosts: Host[]): number {
  return hosts.filter((host) => host.status === "online").length
}

export default function LogicGroupsPage() {
  const t = useTranslations("pages.computers.approve")
  const treeT = useTranslations("pages.collection.tree")
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
  const [collectionTotal, setCollectionTotal] = useState(0)
  const [collectionRefreshRequestVersion, setCollectionRefreshRequestVersion] = useState(0)
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

  const handleAddCompany = () => {
    const baseName = treeT("newCompany")
    const existingNames = new Set(uploadedGroups.map((group) => group.name))
    let name = baseName
    let index = 2

    while (existingNames.has(name)) {
      name = `${baseName} ${index}`
      index += 1
    }

    const newNode: UserLogicGroup = {
      id: `company-${Date.now()}`,
      name,
      path: name,
      type: "company",
    }

    setUploadedGroups((current) => [...current, newNode])
    setUploadedFileName((current) => current || "manual")
    setLogicGroupError("")
    setLogicGroupStatus("loaded")
    setLogicGroupTreeVersion((value) => value + 1)
  }

  const handleDownloadTemplate = () => {
    const template = generateLogicGroupTemplate()
    const blob = new Blob([template], { type: "text/yaml" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "logic-group-template.yml"
    anchor.click()
    URL.revokeObjectURL(url)
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
      toast({ title: t("saveSuccess", { count: tableGroups.length }) })
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
      toast({ title: t("hostApproveNoChanges") })
      return
    }

    setSavingHosts(true)
    try {
      for (const host of changedHosts) {
        await approveHost(TENANT_ID, host)
      }
      toast({ title: t("hostApproveSuccess", { count: changedHosts.length }) })
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

  const logicNodeCount = useMemo(() => countLogicNodes(uploadedGroups), [uploadedGroups])
  const onlineHostCount = useMemo(() => countOnlineHosts(hosts), [hosts])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <Computer className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{t("title")}</h1>
              <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              待处理主机 <strong className="text-slate-900">{hostPagination.total_count}</strong>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              采集单 <strong className="text-slate-900">{collectionTotal}</strong>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              组织节点 <strong className="text-slate-900">{logicNodeCount}</strong>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-violet-500" />
              在线主机 <strong className="text-slate-900">{onlineHostCount}</strong>
            </span>
          </div>
        </div>

        <Card className="rounded-xl border-0 bg-white shadow-lg">
          <CardHeader className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-slate-900 p-2 text-white">
                <FolderTree className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-800">{t("editStructure")}</CardTitle>
                <p className="mt-1 text-sm text-slate-600">
                  管理公司、部门与逻辑组的层级结构，支持导入、编辑与批量维护。
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleRequestLogicSave}
                disabled={savingLogicGroups || logicGroupStatus === "loading" || uploadedGroups.length === 0}
                className="h-10 w-28 justify-center bg-slate-900 text-white hover:bg-slate-800"
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
              <Button
                onClick={handleAddCompany}
                disabled={logicGroupStatus === "loading"}
                className="h-10 w-28 justify-center bg-slate-900 text-white hover:bg-slate-800"
              >
                <Plus className="mr-2 h-4 w-4" />
                添加公司
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadLogicGroups()}
                disabled={logicGroupStatus === "loading"}
                className="h-10 border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                刷新
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_440px]">
              <div className="min-h-[480px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 text-xs text-slate-500">
                  {uploadedFileName ? `来源：${uploadedFileName}` : "来源：后端组织结构"}
                </div>
                {logicGroupStatus === "loading" && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    正在加载组织结构...
                  </div>
                )}
                {logicGroupStatus === "error" && (
                  <div className="mb-4 flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-medium text-rose-700">加载组织结构失败</div>
                      <div className="mt-1 text-slate-500">{logicGroupError}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void loadLogicGroups()}
                      className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    >
                      <RefreshCcw className="h-4 w-4" />
                      刷新
                    </Button>
                  </div>
                )}
                <div className="text-slate-800 [&_input]:border-slate-300 [&_input]:bg-white [&_input]:text-slate-900 [&_input]:placeholder:text-slate-400">
                  <TreeLogicGroup
                    key={`${logicGroupTreeVersion}-${uploadedFileName || "backend"}`}
                    groups={uploadedGroups}
                    onSave={handleSave}
                    disabled={savingLogicGroups}
                    tenantId={TENANT_ID}
                    hideSaveButton
                    hideAddCompanyButton
                    saveRequestVersion={logicGroupSaveRequestVersion}
                    showFrame={false}
                  />
                </div>
              </div>

              <div className="min-h-[480px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">导入配置</h3>
                    <p className="mt-1 text-sm text-slate-500">上传组织结构文件，校验后同步到左侧树。</p>
                  </div>
                  <Button
                    onClick={handleDownloadTemplate}
                    className="h-10 w-28 shrink-0 justify-center bg-slate-900 text-white hover:bg-slate-800"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    下载模板
                  </Button>
                </div>
                <div className="space-y-4">
                  <LogicGroupUploader
                    onGroupsUploaded={handleGroupsUploaded}
                    onBeforeUpload={handleBeforeUpload}
                    disabled={logicGroupStatus === "loading"}
                    showFrame={false}
                    hideDownloadButton
                  />
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
                    导入完成后，可在左侧树上直接编辑、添加和删除节点。
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 bg-white shadow-lg">
          <CardHeader className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blue-600 p-2 text-white">
                <Computer className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-800">{t("approvalTitle")}</CardTitle>
                <p className="mt-1 text-sm text-slate-600">{t("approvalDescription")}</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadHosts()}
              className="h-10 border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              刷新
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            {hostStatus === "loading" && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("hostLoading")}
              </div>
            )}
            {hostStatus === "error" && (
              <div className="mb-4 flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-medium text-rose-700">{t("hostLoadFailed")}</div>
                  <div className="mt-1 text-slate-500">{hostError}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void loadHosts()}
                  className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                >
                  <RefreshCcw className="h-4 w-4" />
                  刷新
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

        <Card className="rounded-xl border-0 bg-white shadow-lg">
          <CardHeader className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-emerald-600 p-2 text-white">
                <FileUp className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-800">{t("collectionApprovalTitle")}</CardTitle>
                <p className="mt-1 text-sm text-slate-600">{t("collectionApprovalDescription")}</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCollectionRefreshRequestVersion((value) => value + 1)}
              className="h-10 border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              刷新
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            <CollectionApproval
              onTotalChange={setCollectionTotal}
              refreshRequestVersion={collectionRefreshRequestVersion}
            />
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  )
}
