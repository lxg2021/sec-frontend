"use client"

import { useCallback, useEffect, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import {
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

export default function LogicGroupsPage() {
  const t = useTranslations("pages.computers.approve")
  const treeT = useTranslations("pages.collection.tree")
  const locale = useLocale()
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
      console.error("[ComputerApproval] loadLogicGroups:error", error)
      const message = t("structureLoadFailed")
      setLogicGroups([])
      setUploadedGroups([])
      setLogicGroupError(message)
      setLogicGroupStatus("error")
      toast({
        title: t("structureLoadFailed"),
        description: message,
        variant: "destructive",
      })
    }
  }, [t, toast])

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
      console.error("[ComputerApproval] loadHosts:error", error)
      const message = t("hostLoadFailed")
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
    const template = generateLogicGroupTemplate(locale)
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
      console.error("[ComputerApproval] saveLogicGroups:error", error)
      toast({
        title: t("structureSaveFailed"),
        description: t("unknownError"),
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
      console.error("[ComputerApproval] approveHosts:error", error)
      toast({
        title: t("hostApproveFailed"),
        description: t("unknownError"),
        variant: "destructive",
      })
    } finally {
      setSavingHosts(false)
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      <div className="space-y-4 p-3 sm:p-4 xl:p-5 2xl:p-6">
        <Card className="rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
          <CardHeader className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                <FolderTree className="size-6" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base font-medium text-slate-950">{t("editStructure")}</CardTitle>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {t("structureDescription")}
                </p>
              </div>
            </div>

            <div className="flex max-w-3xl flex-wrap items-center justify-start gap-2 lg:justify-end xl:flex-nowrap">
              <Button
                onClick={handleRequestLogicSave}
                disabled={savingLogicGroups || logicGroupStatus === "loading" || uploadedGroups.length === 0}
                className="h-10 min-w-28 justify-center rounded-2xl bg-slate-950 px-4 text-white hover:bg-slate-800"
              >
                {savingLogicGroups ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t("saveStructure")}
                  </>
                )}
              </Button>
              <Button
                onClick={handleAddCompany}
                disabled={logicGroupStatus === "loading"}
                className="h-10 min-w-28 justify-center rounded-2xl bg-violet-600 px-4 text-white hover:bg-violet-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("addCompany")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadLogicGroups()}
                disabled={logicGroupStatus === "loading"}
                className="h-10 rounded-2xl border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                {t("refresh")}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-5">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_440px]">
              <div className="min-h-[480px] min-w-0 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 text-xs text-slate-500">
                  {uploadedFileName
                    ? t("sourceFile", {
                        name: uploadedFileName === "manual" ? t("sourceManual") : uploadedFileName,
                      })
                    : t("sourceBackend")}
                </div>
                {logicGroupStatus === "loading" && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("structureLoading")}
                  </div>
                )}
                {logicGroupStatus === "error" && (
                  <div className="mb-4 flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-medium text-rose-700">{t("structureLoadFailed")}</div>
                      <div className="mt-1 text-slate-500">{logicGroupError}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void loadLogicGroups()}
                      className="rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    >
                      <RefreshCcw className="h-4 w-4" />
                      {t("refresh")}
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

              <div className="min-h-[480px] min-w-0 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-base font-medium text-slate-950">{t("importTitle")}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{t("importDescription")}</p>
                  </div>
                  <Button
                    onClick={handleDownloadTemplate}
                    className="h-10 w-full min-w-28 shrink-0 justify-center rounded-2xl bg-slate-950 px-4 text-white hover:bg-slate-800 sm:w-auto"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {t("downloadTemplate")}
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
                    {t("importHint")}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
          <CardHeader className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Computer className="size-6" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base font-medium text-slate-950">{t("approvalTitle")}</CardTitle>
                <p className="mt-1 text-xs leading-5 text-slate-500">{t("approvalDescription")}</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadHosts()}
              className="h-10 rounded-2xl border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              {t("refresh")}
            </Button>
          </CardHeader>
          <CardContent className="p-5">
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
                  className="rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                >
                  <RefreshCcw className="h-4 w-4" />
                  {t("refresh")}
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

        <Card className="rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
          <CardHeader className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <FileUp className="size-6" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base font-medium text-slate-950">{t("collectionApprovalTitle")}</CardTitle>
                <p className="mt-1 text-xs leading-5 text-slate-500">{t("collectionApprovalDescription")}</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCollectionRefreshRequestVersion((value) => value + 1)}
              className="h-10 rounded-2xl border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              {t("refresh")}
            </Button>
          </CardHeader>
          <CardContent className="p-5">
            <CollectionApproval
              refreshRequestVersion={collectionRefreshRequestVersion}
            />
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  )
}
