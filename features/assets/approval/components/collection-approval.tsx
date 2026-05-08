"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ComponentType, ReactNode } from "react"
import {
  AlertTriangle,
  Ban,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Clock3,
  Cpu,
  Eye,
  FileText,
  Fingerprint,
  FolderTree,
  Mail,
  Monitor,
  Network,
  Phone,
  Search,
  Server,
  Settings,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { approveCollectionSubmission, getCollectionSubmission, listCollectionSubmissions, rejectCollectionSubmission } from "@/features/assets/approval/collection-api"
import { buildCollectionOwnerRows } from "@/features/assets/approval/collection-detail-view-model"
import {
  canApproveCollectionSubmission,
  canRejectCollectionSubmission,
  summarizeApprovalResult,
  type ApprovalResultSummary,
} from "@/features/assets/approval/collection-result"
import type {
  CollectionSubmissionDetail,
  CollectionSubmissionStatus,
  CollectionSubmissionSummary,
} from "@/features/assets/approval/collection-types"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { ScrollArea } from "@/shared/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { Textarea } from "@/shared/ui/textarea"
import { useToast } from "@/shared/hooks/use-toast"
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

function TableHeaderLabel({
  icon: Icon,
  children,
  className,
}: {
  icon: ComponentType<{ className?: string }>
  children: ReactNode
  className?: string
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      {children}
    </span>
  )
}

function CollectionStatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: number
  tone: "blue" | "amber" | "emerald" | "rose" | "slate"
}) {
  const tones = {
    blue: {
      iconBg: "bg-blue-50",
      icon: "text-blue-600",
      value: "text-blue-600",
      border: "border-t-blue-500",
    },
    amber: {
      iconBg: "bg-amber-50",
      icon: "text-amber-600",
      value: "text-amber-600",
      border: "border-t-amber-500",
    },
    emerald: {
      iconBg: "bg-emerald-50",
      icon: "text-emerald-600",
      value: "text-emerald-600",
      border: "border-t-emerald-500",
    },
    rose: {
      iconBg: "bg-rose-50",
      icon: "text-rose-600",
      value: "text-rose-600",
      border: "border-t-rose-500",
    },
    slate: {
      iconBg: "bg-slate-100",
      icon: "text-slate-600",
      value: "text-slate-600",
      border: "border-t-slate-400",
    },
  }[tone]

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-lg border border-t-2 border-slate-200 bg-white px-4 py-3 transition-colors hover:border-slate-300 hover:bg-slate-50/60",
        tones.border,
      )}
    >
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", tones.iconBg, tones.icon)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-xs font-medium text-slate-500">{label}</div>
        <div className={cn("mt-1 truncate text-2xl font-semibold leading-7 tabular-nums", tones.value)}>
          {value}
        </div>
      </div>
    </div>
  )
}

function DetailSummaryItem({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: ReactNode
  tone: "blue" | "amber" | "emerald" | "rose" | "slate"
}) {
  const tones = {
    blue: {
      icon: "text-blue-500",
      dot: "bg-blue-500",
      value: "text-blue-600",
      border: "border-t-blue-500",
    },
    amber: {
      icon: "text-amber-500",
      dot: "bg-amber-500",
      value: "text-amber-600",
      border: "border-t-amber-500",
    },
    emerald: {
      icon: "text-emerald-500",
      dot: "bg-emerald-500",
      value: "text-emerald-600",
      border: "border-t-emerald-500",
    },
    rose: {
      icon: "text-rose-500",
      dot: "bg-rose-500",
      value: "text-rose-600",
      border: "border-t-rose-500",
    },
    slate: {
      icon: "text-slate-500",
      dot: "bg-slate-400",
      value: "text-slate-900",
      border: "border-t-slate-400",
    },
  }[tone]

  return (
    <div
      className={cn(
        "rounded-lg border border-t-2 border-slate-200 bg-white p-3 transition-colors hover:border-slate-300 hover:bg-slate-50/60",
        tones.border,
      )}
    >
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <Icon className={cn("h-3.5 w-3.5", tones.icon)} />
          {label}
        </span>
        <span className={cn("h-1.5 w-1.5 rounded-full", tones.dot)} />
      </div>
      <div className={cn("mt-2 truncate text-lg font-semibold leading-none", tones.value)}>{value}</div>
    </div>
  )
}

export interface CollectionApprovalProps {
  onTotalChange?: (total: number) => void
  refreshRequestVersion?: number
}

export function CollectionApproval({ onTotalChange, refreshRequestVersion = 0 }: CollectionApprovalProps) {
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
  const [approvalResult, setApprovalResult] = useState<ApprovalResultSummary | null>(null)

  const ownerRows = useMemo(() => buildCollectionOwnerRows(selected?.hosts || []), [selected?.hosts])

  const loadList = useCallback(async () => {
    console.info("[CollectionApproval] loadList:start", {
      tenantId: TENANT_ID,
      page,
      pageSize,
      status,
      keyword: keyword.trim(),
    })
    setLoading(true)
    try {
      const result = await listCollectionSubmissions({
        tenantId: TENANT_ID,
        page,
        pageSize,
        ...(status === "all" ? {} : { status }),
        ...(keyword.trim() ? { keyword } : {}),
      })
      console.info("[CollectionApproval] loadList:success", {
        itemCount: result.items.length,
        total: result.total,
        page: result.page,
        pageSize: result.page_size,
      })
      setItems(result.items)
      setTotal(result.total)
    } catch (error) {
      console.error("[CollectionApproval] loadList:error", error)
      toast({
        title: t("loadFailed"),
        description: error instanceof Error ? error.message : t("unknownError"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [keyword, page, pageSize, status, t, toast])

  const loadListRef = useRef(loadList)

  useEffect(() => {
    loadListRef.current = loadList
  }, [loadList])

  useEffect(() => {
    void loadList()
  }, [loadList])

  useEffect(() => {
    onTotalChange?.(total)
  }, [onTotalChange, total])

  useEffect(() => {
    if (refreshRequestVersion > 0) {
      void loadListRef.current()
    }
  }, [refreshRequestVersion])

  useEffect(() => {
    setPage(1)
  }, [keyword, status])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [pageSize, total])
  const pendingCount = useMemo(
    () => items.filter((item) => item.status === 1 || item.status === "COLLECTION_SUBMISSION_PENDING").length,
    [items],
  )
  const approvedCount = useMemo(
    () => items.filter((item) => item.status === 3 || item.status === "COLLECTION_SUBMISSION_APPROVED").length,
    [items],
  )
  const failedCount = useMemo(
    () => items.filter((item) => item.status === 5 || item.status === "COLLECTION_SUBMISSION_FAILED").length,
    [items],
  )
  const rejectedCount = useMemo(
    () => items.filter((item) => item.status === 4 || item.status === "COLLECTION_SUBMISSION_REJECTED").length,
    [items],
  )

  const openDetail = useCallback(
    async (submissionId: string) => {
      setOpen(true)
      setDetailLoading(true)
      setReviewNote("")
      setApprovalResult(null)
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

  const handleApprove = async () => {
    if (!selected) return
    setActionLoading(true)
    try {
      const result = await approveCollectionSubmission(TENANT_ID, selected.submission_id, reviewNote)
      const summary = summarizeApprovalResult(result)
      setApprovalResult(summary)
      setSelected((current) =>
        current
          ? {
              ...current,
              status: result.status,
              import_result_json: JSON.stringify(result),
            }
          : current,
      )
      toast({
        title: summary.failureCount > 0 ? t("failed") : t("approveSuccess"),
        description: `${summary.successCount}/${summary.total}`,
      })
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
    if (!canRejectCollectionSubmission(selected.status)) {
      toast({
        title: t("rejectFailed"),
        description: t("rejectNotAllowed"),
        variant: "destructive",
      })
      return
    }
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
          <CollectionStatCard icon={FileText} label={t("statTotal")} value={total} tone="blue" />
          <CollectionStatCard icon={Clock3} label={t("statPending")} value={pendingCount} tone="amber" />
          <CollectionStatCard icon={CheckCircle2} label={t("statApproved")} value={approvedCount} tone="emerald" />
          <CollectionStatCard icon={AlertTriangle} label={t("statFailed")} value={failedCount} tone="rose" />
          <CollectionStatCard icon={Ban} label={t("statRejected")} value={rejectedCount} tone="slate" />
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <TableHeaderLabel icon={FileText}>{t("submissionId")}</TableHeaderLabel>
                  </TableHead>
                  <TableHead>
                    <TableHeaderLabel icon={Building2}>{t("tenant")}</TableHeaderLabel>
                  </TableHead>
                  <TableHead>
                    <TableHeaderLabel icon={CircleDot}>{t("status")}</TableHeaderLabel>
                  </TableHead>
                  <TableHead>
                    <TableHeaderLabel icon={Server}>{t("hostCount")}</TableHeaderLabel>
                  </TableHead>
                  <TableHead>
                    <TableHeaderLabel icon={FolderTree}>{t("logicGroupCount")}</TableHeaderLabel>
                  </TableHead>
                  <TableHead>
                    <TableHeaderLabel icon={UserRound}>{t("submitter")}</TableHeaderLabel>
                  </TableHead>
                  <TableHead>
                    <TableHeaderLabel icon={CalendarClock}>{t("createdAt")}</TableHeaderLabel>
                  </TableHead>
                  <TableHead className="text-right">
                    <TableHeaderLabel icon={Settings} className="justify-end">
                      {t("actions")}
                    </TableHeaderLabel>
                  </TableHead>
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
            setApprovalResult(null)
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
                <DetailSummaryItem icon={Building2} label={t("tenant")} value={selected.tenant_id} tone="blue" />
                <DetailSummaryItem icon={CircleDot} label={t("status")} value={statusLabel(selected.status, t)} tone="amber" />
                <DetailSummaryItem icon={UserRound} label={t("ownerCount")} value={ownerRows.length} tone="emerald" />
                <DetailSummaryItem icon={Server} label={t("hostCount")} value={selected.host_count} tone="slate" />
              </div>

              <Tabs defaultValue="hosts">
                <TabsList>
                  <TabsTrigger value="hosts">{t("hostsTab")}</TabsTrigger>
                  <TabsTrigger value="owners">{t("ownersTab")}</TabsTrigger>
                </TabsList>
                <TabsContent value="hosts" className="mt-4">
                  <ScrollArea className="h-[220px] rounded-lg border">
                    <div className="p-3">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              <TableHeaderLabel icon={Fingerprint}>{t("agentId")}</TableHeaderLabel>
                            </TableHead>
                            <TableHead>
                              <TableHeaderLabel icon={Monitor}>{t("hostName")}</TableHeaderLabel>
                            </TableHead>
                            <TableHead>
                              <TableHeaderLabel icon={Network}>{t("ip")}</TableHeaderLabel>
                            </TableHead>
                            <TableHead>
                              <TableHeaderLabel icon={Cpu}>{t("os")}</TableHeaderLabel>
                            </TableHead>
                            <TableHead>
                              <TableHeaderLabel icon={FolderTree}>{t("department")}</TableHeaderLabel>
                            </TableHead>
                            <TableHead>
                              <TableHeaderLabel icon={UserRound}>{t("owner")}</TableHeaderLabel>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selected.hosts.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                                {t("noHosts")}
                              </TableCell>
                            </TableRow>
                          ) : (
                            selected.hosts.map((host) => (
                              <TableRow key={host.agent_id}>
                                <TableCell className="font-mono text-xs">{host.agent_id || "-"}</TableCell>
                                <TableCell className="font-mono text-xs">{host.hostname || "-"}</TableCell>
                                <TableCell className="text-xs">{host.ip?.length ? host.ip.join(", ") : "-"}</TableCell>
                                <TableCell className="text-xs">{[host.os_name, host.os_version].filter(Boolean).join(" ") || host.os_type || "-"}</TableCell>
                                <TableCell className="text-xs">{host.department_path || host.group_id || "-"}</TableCell>
                                <TableCell className="text-xs">
                                  <div className="flex flex-col gap-0.5">
                                    <span>{host.owner ? `${host.owner.username} / ${host.owner.role}` : "-"}</span>
                                    {host.owner && (
                                      <span className="text-muted-foreground">{host.owner.email || host.owner.phone || "-"}</span>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="owners" className="mt-4">
                  <ScrollArea className="h-[220px] rounded-lg border">
                    <div className="p-3">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              <TableHeaderLabel icon={UserRound}>{t("ownerName")}</TableHeaderLabel>
                            </TableHead>
                            <TableHead>
                              <TableHeaderLabel icon={ShieldCheck}>{t("ownerRole")}</TableHeaderLabel>
                            </TableHead>
                            <TableHead>
                              <TableHeaderLabel icon={Phone}>{t("ownerPhone")}</TableHeaderLabel>
                            </TableHead>
                            <TableHead>
                              <TableHeaderLabel icon={Mail}>{t("ownerEmail")}</TableHeaderLabel>
                            </TableHead>
                            <TableHead>
                              <TableHeaderLabel icon={Monitor}>{t("ownerHost")}</TableHeaderLabel>
                            </TableHead>
                            <TableHead>
                              <TableHeaderLabel icon={Fingerprint}>{t("agentId")}</TableHeaderLabel>
                            </TableHead>
                            <TableHead>
                              <TableHeaderLabel icon={FolderTree}>{t("department")}</TableHeaderLabel>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ownerRows.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                {t("noOwners")}
                              </TableCell>
                            </TableRow>
                          ) : (
                            ownerRows.map((owner) => (
                              <TableRow key={owner.key}>
                                <TableCell className="font-medium">{owner.username}</TableCell>
                                <TableCell className="text-xs">{owner.role}</TableCell>
                                <TableCell className="text-xs">{owner.phone}</TableCell>
                                <TableCell className="text-xs">{owner.email}</TableCell>
                                <TableCell className="text-xs">{owner.hostname}</TableCell>
                                <TableCell className="font-mono text-xs">{owner.agentId}</TableCell>
                                <TableCell className="text-xs">{owner.department}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              {approvalResult && (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">入库结果</div>
                      <div className="text-xs text-muted-foreground">{approvalResult.submissionId}</div>
                    </div>
                    <span className={cn("inline-flex rounded-full border px-2 py-1 text-xs font-medium", statusTone(approvalResult.status))}>
                      {statusLabel(approvalResult.status, t)}
                    </span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-md border bg-background p-3">
                      <div className="text-xs text-muted-foreground">主机总数</div>
                      <div className="text-xl font-semibold">{approvalResult.total}</div>
                    </div>
                    <div className="rounded-md border bg-background p-3">
                      <div className="text-xs text-muted-foreground">成功入库</div>
                      <div className="text-xl font-semibold text-emerald-600">{approvalResult.successCount}</div>
                    </div>
                    <div className="rounded-md border bg-background p-3">
                      <div className="text-xs text-muted-foreground">入库失败</div>
                      <div className="text-xl font-semibold text-rose-600">{approvalResult.failureCount}</div>
                    </div>
                  </div>
                  {approvalResult.hostResults.length > 0 && (
                    <div className="mt-3 overflow-hidden rounded-md border bg-background">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Agent ID</TableHead>
                            <TableHead>结果</TableHead>
                            <TableHead>说明</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {approvalResult.hostResults.map((result) => (
                            <TableRow key={result.agent_id}>
                              <TableCell className="font-mono text-xs">{result.agent_id}</TableCell>
                              <TableCell>
                                {result.success ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-600">
                                    <CheckCircle2 className="h-4 w-4" />
                                    成功
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-rose-600">
                                    <XCircle className="h-4 w-4" />
                                    失败
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{result.msg || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  {approvalResult.failedResults.length > 0 && (
                    <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                      存在失败主机，可保留弹窗查看原因；采集单进入失败状态后可再次审核重试。
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="review-note">{t("reviewNote")}</Label>
                <Textarea
                  id="review-note"
                  value={reviewNote}
                  onChange={(event) => setReviewNote(event.target.value)}
                  placeholder={t("reviewNotePlaceholder")}
                  rows={2}
                  className="min-h-[72px]"
                />
              </div>
            </div>
          ) : (
            <div className="flex min-h-64 items-center justify-center text-muted-foreground">
              {t("empty")}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="destructive" onClick={handleReject} disabled={actionLoading || !selected || !canRejectCollectionSubmission(selected.status)}>
              <XCircle className="mr-2 h-4 w-4" />
              {t("reject")}
            </Button>
            <Button
              onClick={handleApprove}
              disabled={actionLoading || !selected || !canApproveCollectionSubmission(selected.status)}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {t("approve")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
