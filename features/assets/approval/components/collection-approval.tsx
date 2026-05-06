"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  CheckCircle2,
  Eye,
  FileText,
  RefreshCcw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { approveCollectionSubmission, getCollectionSubmission, listCollectionSubmissions, rejectCollectionSubmission } from "@/features/assets/approval/collection-api"
import type {
  CollectionSubmissionDetail,
  CollectionSubmissionStatus,
  CollectionSubmissionSummary,
} from "@/features/assets/approval/collection-types"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { ScrollArea } from "@/shared/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { Textarea } from "@/shared/ui/textarea"
import { useToast } from "@/shared/ui/use-toast"
import { cn } from "@/shared/lib/utils"

const TENANT_ID = "public"

const STATUS_OPTIONS: Array<{ value: "all" | CollectionSubmissionStatus; labelKey: string }> = [
  { value: "all", labelKey: "allStatus" },
  { value: 1, labelKey: "pending" },
  { value: 2, labelKey: "approving" },
  { value: 3, labelKey: "approved" },
  { value: 4, labelKey: "rejected" },
  { value: 5, labelKey: "failed" },
  { value: 6, labelKey: "deleted" },
]

type Translator = (key: string, values?: Record<string, string | number>) => string

function statusLabel(status: CollectionSubmissionStatus, t: Translator) {
  switch (status) {
    case 1:
    case "COLLECTION_SUBMISSION_PENDING":
      return t("pending")
    case 2:
    case "COLLECTION_SUBMISSION_APPROVING":
      return t("approving")
    case 3:
    case "COLLECTION_SUBMISSION_APPROVED":
      return t("approved")
    case 4:
    case "COLLECTION_SUBMISSION_REJECTED":
      return t("rejected")
    case 5:
    case "COLLECTION_SUBMISSION_FAILED":
      return t("failed")
    case 6:
    case "COLLECTION_SUBMISSION_DELETED":
      return t("deleted")
    default:
      return t("pending")
  }
}

function statusTone(status: CollectionSubmissionStatus) {
  switch (status) {
    case 1:
    case "COLLECTION_SUBMISSION_PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700"
    case 2:
    case "COLLECTION_SUBMISSION_APPROVING":
      return "border-blue-200 bg-blue-50 text-blue-700"
    case 3:
    case "COLLECTION_SUBMISSION_APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case 4:
    case "COLLECTION_SUBMISSION_REJECTED":
      return "border-slate-200 bg-slate-50 text-slate-700"
    case 5:
    case "COLLECTION_SUBMISSION_FAILED":
      return "border-rose-200 bg-rose-50 text-rose-700"
    case 6:
    case "COLLECTION_SUBMISSION_DELETED":
      return "border-zinc-200 bg-zinc-50 text-zinc-700"
    default:
      return "border-slate-200 bg-slate-50 text-slate-700"
  }
}

function formatDateTime(value?: number) {
  if (!value) return "-"
  const date = new Date(value < 1_000_000_000_000 ? value * 1000 : value)
  return date.toLocaleString()
}

function formatJson(value?: string) {
  if (!value) return "-"
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

export function CollectionApproval() {
  const t = useTranslations("pages.computers.approve.collection")
  const { toast } = useToast()
  const [items, setItems] = useState<CollectionSubmissionSummary[]>([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState<"all" | CollectionSubmissionStatus>("all")
  const [keyword, setKeyword] = useState("")
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [selected, setSelected] = useState<CollectionSubmissionDetail | null>(null)
  const [open, setOpen] = useState(false)
  const [reviewNote, setReviewNote] = useState("")

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listCollectionSubmissions({
        tenantId: TENANT_ID,
        page,
        pageSize,
        ...(status === "all" ? {} : { status }),
        ...(keyword.trim() ? { keyword } : {}),
      })
      setItems(result.items)
      setTotal(result.total)
    } catch (error) {
      toast({
        title: t("loadFailed"),
        description: error instanceof Error ? error.message : t("unknownError"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [keyword, page, pageSize, status, t, toast])

  useEffect(() => {
    void loadList()
  }, [loadList])

  useEffect(() => {
    setPage(1)
  }, [keyword, status])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [pageSize, total])

  const openDetail = useCallback(
    async (submissionId: string) => {
      setOpen(true)
      setDetailLoading(true)
      setReviewNote("")
      setSelected(null)
      try {
        const detail = await getCollectionSubmission(TENANT_ID, submissionId)
        setSelected(detail)
      } catch (error) {
        toast({
          title: t("detailLoadFailed"),
          description: error instanceof Error ? error.message : t("unknownError"),
          variant: "destructive",
        })
      } finally {
        setDetailLoading(false)
      }
    },
    [t, toast],
  )

  const refresh = () => void loadList()

  const handleApprove = async () => {
    if (!selected) return
    setActionLoading(true)
    try {
      await approveCollectionSubmission(TENANT_ID, selected.submission_id, reviewNote)
      toast({ title: t("approveSuccess"), description: selected.submission_id })
      setOpen(false)
      setSelected(null)
      await loadList()
    } catch (error) {
      toast({
        title: t("approveFailed"),
        description: error instanceof Error ? error.message : t("unknownError"),
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selected) return
    if (!reviewNote.trim()) {
      toast({
        title: t("rejectFailed"),
        description: t("rejectNoteRequired"),
        variant: "destructive",
      })
      return
    }
    setActionLoading(true)
    try {
      await rejectCollectionSubmission(TENANT_ID, selected.submission_id, reviewNote)
      toast({ title: t("rejectSuccess"), description: selected.submission_id })
      setOpen(false)
      setSelected(null)
      await loadList()
    } catch (error) {
      toast({
        title: t("rejectFailed"),
        description: error instanceof Error ? error.message : t("unknownError"),
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="px-0 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
              <FileText className="h-5 w-5 text-slate-900 dark:text-white" />
              {t("title")}
            </CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </div>
          <Button variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCcw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            {t("refresh")}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-0">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="pl-9"
            />
          </div>
          <div className="w-full lg:w-56">
            <Select value={String(status)} onValueChange={(value) => setStatus(value === "all" ? "all" : (Number(value) as CollectionSubmissionStatus))}>
              <SelectTrigger>
                <SelectValue placeholder={t("statusFilter")} />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={String(option.value)} value={String(option.value)}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xs text-muted-foreground">{t("statTotal")}</div>
            <div className="text-2xl font-semibold">{total}</div>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xs text-muted-foreground">{t("statPending")}</div>
            <div className="text-2xl font-semibold">{items.filter((item) => item.status === 1 || item.status === "COLLECTION_SUBMISSION_PENDING").length}</div>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xs text-muted-foreground">{t("statApproved")}</div>
            <div className="text-2xl font-semibold">{items.filter((item) => item.status === 3 || item.status === "COLLECTION_SUBMISSION_APPROVED").length}</div>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xs text-muted-foreground">{t("statFailed")}</div>
            <div className="text-2xl font-semibold">{items.filter((item) => item.status === 5 || item.status === "COLLECTION_SUBMISSION_FAILED").length}</div>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xs text-muted-foreground">{t("statRejected")}</div>
            <div className="text-2xl font-semibold">{items.filter((item) => item.status === 4 || item.status === "COLLECTION_SUBMISSION_REJECTED").length}</div>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("submissionId")}</TableHead>
                  <TableHead>{t("tenant")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("hostCount")}</TableHead>
                  <TableHead>{t("logicGroupCount")}</TableHead>
                  <TableHead>{t("submitter")}</TableHead>
                  <TableHead>{t("createdAt")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      {t("loading")}
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      {t("empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.submission_id}>
                      <TableCell className="font-mono text-xs">{item.submission_id}</TableCell>
                      <TableCell>{item.tenant_id}</TableCell>
                      <TableCell>
                        <span className={cn("inline-flex rounded-full border px-2 py-1 text-xs font-medium", statusTone(item.status))}>
                          {statusLabel(item.status, t)}
                        </span>
                      </TableCell>
                      <TableCell>{item.host_count}</TableCell>
                      <TableCell>{item.logic_group_count}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{item.submitter?.name || "-"}</span>
                          <span className="text-xs text-muted-foreground">{item.submitter?.email || item.submitter?.phone || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDateTime(item.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openDetail(item.submission_id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            {t("view")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
            <div>
              {t("paginationInfo", { page, totalPages, total })}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                {t("prevPage")}
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
                {t("nextPage")}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (!nextOpen) {
            setSelected(null)
            setReviewNote("")
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              {t("detailTitle")}
            </DialogTitle>
            <DialogDescription>
              {selected ? selected.submission_id : t("detailDescription")}
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex min-h-64 items-center justify-center text-muted-foreground">
              {t("detailLoading")}
            </div>
          ) : selected ? (
            <div className="space-y-4 overflow-hidden">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">{t("tenant")}</div>
                  <div className="font-medium">{selected.tenant_id}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">{t("status")}</div>
                  <div className="font-medium">{statusLabel(selected.status, t)}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">{t("hostCount")}</div>
                  <div className="font-medium">{selected.host_count}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">{t("logicGroupCount")}</div>
                  <div className="font-medium">{selected.logic_group_count}</div>
                </div>
              </div>

              <Tabs defaultValue="hosts">
                <TabsList>
                  <TabsTrigger value="hosts">{t("hostsTab")}</TabsTrigger>
                  <TabsTrigger value="groups">{t("groupsTab")}</TabsTrigger>
                  <TabsTrigger value="raw">{t("rawTab")}</TabsTrigger>
                </TabsList>
                <TabsContent value="hosts" className="mt-4">
                  <ScrollArea className="h-[280px] rounded-lg border">
                    <div className="p-3">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("hostName")}</TableHead>
                            <TableHead>{t("ip")}</TableHead>
                            <TableHead>{t("os")}</TableHead>
                            <TableHead>{t("department")}</TableHead>
                            <TableHead>{t("owner")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selected.hosts.map((host) => (
                            <TableRow key={host.agent_id}>
                              <TableCell className="font-mono text-xs">{host.hostname}</TableCell>
                              <TableCell className="text-xs">{host.ip.join(", ")}</TableCell>
                              <TableCell className="text-xs">{host.os_name} {host.os_version}</TableCell>
                              <TableCell className="text-xs">{host.department_path || host.group_id || "-"}</TableCell>
                              <TableCell className="text-xs">
                                {host.owner ? `${host.owner.username} / ${host.owner.role}` : "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="groups" className="mt-4">
                  <ScrollArea className="h-[280px] rounded-lg border">
                    <div className="space-y-2 p-3">
                      {selected.logic_groups.map((group) => (
                        <div key={group.id} className="rounded-lg border p-3">
                          <div className="font-medium">{group.path}</div>
                          <div className="text-xs text-muted-foreground">{group.type} / {group.name}</div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="raw" className="mt-4">
                  <ScrollArea className="h-[280px] rounded-lg border bg-muted/30">
                    <pre className="p-4 text-xs leading-5">{formatJson(selected.import_result_json || selected.error_msg || "")}</pre>
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              <div className="space-y-2">
                <Label htmlFor="review-note">{t("reviewNote")}</Label>
                <Textarea
                  id="review-note"
                  value={reviewNote}
                  onChange={(event) => setReviewNote(event.target.value)}
                  placeholder={t("reviewNotePlaceholder")}
                  rows={4}
                />
              </div>
            </div>
          ) : (
            <div className="flex min-h-64 items-center justify-center text-muted-foreground">
              {t("empty")}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("close")}
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={actionLoading || !selected}>
              <XCircle className="mr-2 h-4 w-4" />
              {t("reject")}
            </Button>
            <Button onClick={handleApprove} disabled={actionLoading || !selected}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {t("approve")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
