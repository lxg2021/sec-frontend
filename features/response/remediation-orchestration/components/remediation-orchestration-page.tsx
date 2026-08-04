"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  Clock3,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Workflow,
} from "lucide-react";

import {
  createAttackWorkflowAction,
  getAttackWorkflow,
  getAttackWorkflowByCaseId,
  updateAttackWorkflowStatus,
} from "@/features/attack/workflow/api";
import type {
  AttackWorkflowActionItem,
  AttackWorkflowItem,
  AttackWorkflowStatus,
} from "@/features/attack/workflow/types";
import {
  normalizeWorkflowStatus,
  workflowStatusIndex,
} from "@/features/attack/workflow/utils";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { useToast } from "@/shared/ui/use-toast";
import {
  buildRemediationOrchestrationHref,
  isLegacyCaseRemediationTitle,
  queryRemediationOrderList,
  type RemediationOrder,
} from "@/features/attack/remediation-order";

import type {
  RemediationActionInput,
  RemediationActionOption,
  RemediationCandidateNode,
  RemediationOrchestrationContext,
} from "../types";
import { CreateRemediationPreviewDialog } from "./create-remediation-preview-dialog";
import { RemediationOrderWorkspace } from "./remediation-order-workspace";

const RESPONSE_TIMEZONE = "Asia/Shanghai";
const PAGE_SOURCE = "remediation_orchestration_page";
const RESPONDING_STATUS: AttackWorkflowStatus = "responding";

function canonicalRemediationAction(
  actions: AttackWorkflowActionItem[],
  caseId: string,
) {
  const normalizedCaseId = caseId.trim();
  return (
    actions.find((action) => {
      const actionPhase = action.action_phase.trim().toLowerCase();
      const targetType = action.target_type.trim().toLowerCase();
      const actionType = action.action_type.trim().toLowerCase();
      const targetKey = action.target_key.trim();
      return (
        actionPhase === "remediation" &&
        targetType === "case" &&
        actionType === "remediation_orchestration" &&
        !action.action_batch_id.trim() &&
        (!normalizedCaseId || targetKey === normalizedCaseId)
      );
    }) ??
    actions.find(
      (action) => action.action_phase.trim().toLowerCase() === "remediation",
    ) ??
    null
  );
}

function formatHeaderRefreshTime(value: Date | null | undefined, locale: string) {
  if (!value) return "--";

  const parts = new Intl.DateTimeFormat(locale, {
    timeZone: RESPONSE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(value);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "00";

  return `${getPart("year")}-${getPart("month")}-${getPart("day")} ${getPart("hour")}:${getPart("minute")}:${getPart("second")}`;
}

function workflowBeforeResponding(status: string) {
  const normalized = normalizeWorkflowStatus(status);
  return Boolean(
    normalized &&
    workflowStatusIndex(normalized) >= 0 &&
    workflowStatusIndex(normalized) < workflowStatusIndex(RESPONDING_STATUS),
  );
}

function actionInputFor(
  actionCode: string,
  node?: RemediationCandidateNode,
): RemediationActionInput | undefined {
  switch (actionCode) {
    case "file.quarantine":
      return { file_quarantine: { delete_original: true, encrypt: true } };
    case "process.terminate":
      return {
        process_terminate: {
          include_self: true,
          include_children: true,
          force: false,
        },
      };
    case "process.force_terminate":
      return {
        process_terminate: {
          include_self: true,
          include_children: true,
          force: true,
        },
      };
    case "process.block_execute":
    case "process.bypass_execute":
      return {
        process_block: {
          object_path: stringRecordValue(node?.snapshot?.process, "process_path"),
          object_hash: stringRecordValue(node?.snapshot?.process, "hash"),
          audit: true,
        },
      };
    case "net.block":
    case "net.bypass":
      return { net_block: { direction: "out" } };
    default:
      return undefined;
  }
}

function stringRecordValue(record: unknown, key: string) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return "";
  const value = (record as Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function normalizeNodeFromContext(
  context: RemediationOrchestrationContext,
): RemediationCandidateNode | null {
  const nodeKey = context.node_key?.trim();
  if (!nodeKey) return null;
  const entityType = context.entity_type?.trim() || "File";
  const displayName = context.display_name?.trim() || nodeKey;
  return {
    node_key: nodeKey,
    entity_type: entityType,
    display_name: displayName,
    description: "来自图谱入口参数",
    resolve_status: "unresolved",
    agent_ids: [],
    snapshot: entityType.toLowerCase().includes("process")
      ? { process: { process_name: displayName, command_line: displayName } }
      : entityType.toLowerCase().includes("net")
        ? { network: { remote_address: displayName, protocol: "tcp" } }
        : { file: { file_path: displayName } },
  };
}

export function RemediationOrchestrationPage({
  context,
}: {
  context: RemediationOrchestrationContext;
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("pages.collection.orchestration");
  const { toast } = useToast();
  const [workflow, setWorkflow] = useState<AttackWorkflowItem | null>(null);
  const [action, setAction] = useState<AttackWorkflowActionItem | null>(null);
  const [nodes, setNodes] = useState<RemediationCandidateNode[]>([]);
  const [selectedNodeKey, setSelectedNodeKey] = useState("");
  const [actionOptions, setActionOptions] =
    useState<RemediationActionOption[]>([]);
  const [selectedActionCode, setSelectedActionCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [caseLookupLoading, setCaseLookupLoading] = useState(false);
  const [working, setWorking] = useState("");
  const [headerCaseInput, setHeaderCaseInput] = useState(
    context.case_id?.trim() || "",
  );
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  const [createPreviewOpen, setCreatePreviewOpen] = useState(false);
  const [orderRefreshKey, setOrderRefreshKey] = useState(0);
  const [orderLoading, setOrderLoading] = useState(false);
  const [loadedOrderCaseId, setLoadedOrderCaseId] = useState("");
  const [loadedOrderTitle, setLoadedOrderTitle] = useState("");
  const [loadedOrderStatus, setLoadedOrderStatus] = useState("");
  const [titleEditRequestKey, setTitleEditRequestKey] = useState(0);

  const routeCaseId = context.case_id?.trim() || "";
  const routeOrderId = context.order_id?.trim() || "";
  const orderMode = Boolean(routeOrderId);
  const routeWorkflowId = context.workflow_id?.trim() || "";
  const routeActionId = context.workflow_action_id?.trim() || "";
  const tenantId = context.tenant_id?.trim() || "";
  const hasLookupContext = Boolean(routeCaseId || routeWorkflowId);
  const currentCaseId = workflow?.case_id || routeCaseId;
  const currentWorkflowId = workflow?.workflow_id || routeWorkflowId;
  const scopeType = context.scope_type?.trim() || "case";
  const scopeId = context.scope_id?.trim() || currentCaseId;
  const sourceType = context.source_type?.trim() || "case_graph";
  const workflowClosed =
    normalizeWorkflowStatus(workflow?.status ?? "") === "closed";
  const selectedNode =
    nodes.find((node) => node.node_key === selectedNodeKey) ?? nodes[0];
  const selectedAction =
    actionOptions.find((option) => option.action_code === selectedActionCode) ??
    actionOptions[0];

  useEffect(() => {
    setLoadedOrderCaseId("");
    setLoadedOrderTitle("");
    setLoadedOrderStatus("");
  }, [routeOrderId]);

  const loadPage = useCallback(
    async (refreshingOnly = false) => {
      if (refreshingOnly) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const detailResult = routeWorkflowId
          ? await getAttackWorkflow({
              tenantId,
              workflowId: routeWorkflowId,
              includeActions: true,
              includeEvents: false,
            })
          : await getAttackWorkflowByCaseId({
              tenantId,
              caseId: routeCaseId,
              includeActions: true,
              includeEvents: false,
            });
        const nextWorkflow = detailResult?.workflow ?? null;
        const nextActions = detailResult?.actions ?? [];
        const contextNode = normalizeNodeFromContext(context);

        setNodes(contextNode ? [contextNode] : []);
        setSelectedNodeKey(contextNode?.node_key ?? "");
        setActionOptions([]);
        setSelectedActionCode("");

        if (!nextWorkflow) {
          setWorkflow(null);
          setAction(null);
          return;
        }

        const nextCaseId = nextWorkflow.case_id || routeCaseId;
        const routeAction = routeActionId
          ? (nextActions.find(
              (item) => item.workflow_action_id === routeActionId,
            ) ?? null)
          : null;

        setWorkflow(nextWorkflow);
        setAction(
          routeAction ?? canonicalRemediationAction(nextActions, nextCaseId),
        );
      } catch {
        setWorkflow(null);
        setAction(null);
        setNodes([]);
        setSelectedNodeKey("");
        setActionOptions([]);
        setSelectedActionCode("");
      } finally {
        setRefreshedAt(new Date());
        setLoading(false);
        setRefreshing(false);
      }
    },
    [context, routeActionId, routeCaseId, routeWorkflowId, tenantId],
  );

  useEffect(() => {
    if (orderMode) {
      setLoading(false);
      setRefreshing(false);
      setRefreshedAt(new Date());
      return;
    }
    if (!hasLookupContext) {
      setLoading(false);
      setRefreshing(false);
      setRefreshedAt(null);
      return;
    }
    void loadPage(false);
  }, [hasLookupContext, loadPage, orderMode]);

  useEffect(() => {
    setHeaderCaseInput(routeCaseId || loadedOrderCaseId);
  }, [loadedOrderCaseId, routeCaseId]);

  const handleOrderLoaded = useCallback(
    (nextOrder: RemediationOrder) => {
      setLoadedOrderCaseId(nextOrder.source.case_id.trim());
      const title = nextOrder.title.trim();
      setLoadedOrderTitle(
        isLegacyCaseRemediationTitle(
          title,
          nextOrder.source.case_id || nextOrder.source.source_ref_id,
        )
          ? "处置单"
          : title,
      );
      setLoadedOrderStatus(nextOrder.status.trim().toLowerCase());
      setRefreshedAt(new Date());
    },
    [],
  );

  const handleOrderLoadingChange = useCallback((nextLoading: boolean) => {
    setOrderLoading(nextLoading);
    setRefreshing(nextLoading);
    if (!nextLoading) setRefreshedAt(new Date());
  }, []);

  const openLatestOrderByCaseId = useCallback(
    async (caseId: string) => {
      setCaseLookupLoading(true);
      try {
        const result = await queryRemediationOrderList({
          case_id: caseId,
          page: 1,
          page_size: 1,
        });
        const order = result.items[0];
        if (!order?.order_id.trim()) {
          toast({
            title: t("page.notFound"),
            description: caseId,
            variant: "destructive",
          });
          return false;
        }

        router.push(buildRemediationOrchestrationHref(order));
        return true;
      } catch (cause) {
        toast({
          title: t("page.loadFailed"),
          description: cause instanceof Error ? cause.message : caseId,
          variant: "destructive",
        });
        return false;
      } finally {
        setCaseLookupLoading(false);
      }
    },
    [router, t, toast],
  );

  useEffect(() => {
    if (
      orderMode ||
      !routeCaseId ||
      routeWorkflowId ||
      context.node_key?.trim()
    ) {
      return;
    }
    void openLatestOrderByCaseId(routeCaseId);
  }, [
    context.node_key,
    openLatestOrderByCaseId,
    orderMode,
    routeCaseId,
    routeWorkflowId,
  ]);

  async function submitHeaderCase(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (orderMode) {
      setOrderRefreshKey((current) => current + 1);
      return;
    }
    const nextCaseId = headerCaseInput.trim();
    const current = routeCaseId;

    if (nextCaseId === current) {
      if (nextCaseId) {
        const opened = await openLatestOrderByCaseId(nextCaseId);
        if (!opened) void loadPage(true);
      } else {
        void loadPage(true);
      }
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (nextCaseId) {
      params.set("case_id", nextCaseId);
      params.set("scope_type", "case");
      params.set("scope_id", nextCaseId);
    } else {
      params.delete("case_id");
      params.delete("scope_id");
    }
    params.delete("workflow_id");
    params.delete("workflow_action_id");

    const query = params.toString();
    router.push(`${window.location.pathname}${query ? `?${query}` : ""}`);
  }

  function refreshHeader() {
    if (orderMode) {
      setOrderRefreshKey((current) => current + 1);
      return;
    }
    void submitHeaderCase();
  }

  async function ensureCanonicalAction() {
    if (action?.workflow_action_id) return action;
    if (!workflow?.workflow_id || !currentCaseId || workflowClosed) return null;

    setWorking("ensure-action");
    try {
      const created = await createAttackWorkflowAction({
        tenantId,
        workflowId: workflow.workflow_id,
        actionPhase: "remediation",
        targetType: "case",
        targetKey: currentCaseId,
        caseId: currentCaseId,
        actionType: "remediation_orchestration",
        actionStatus: "pending",
        createdBy: PAGE_SOURCE,
      });

      if (!created?.workflow_action_id) {
        throw new Error("处置阶段准备失败");
      }

      setAction(created);
      toast({ title: "已准备处置阶段" });
      return created;
    } finally {
      setWorking("");
    }
  }

  async function moveWorkflowToResponding() {
    if (
      !workflow ||
      workflowClosed ||
      !workflowBeforeResponding(workflow.status)
    )
      return workflow;
    setWorking("move-responding");
    try {
      const updated = await updateAttackWorkflowStatus({
        tenantId,
        workflowId: workflow.workflow_id,
        status: RESPONDING_STATUS,
        payloadJson: JSON.stringify({
          source: PAGE_SOURCE,
          comment: "enter remediation orchestration",
        }),
      });
      if (updated) {
        setWorkflow(updated);
        toast({ title: "工作流已进入处置阶段" });
        return updated;
      }
      return workflow;
    } finally {
      setWorking("");
    }
  }

  function handleCreatePreview() {
    if (workflowClosed) return;
    setCreatePreviewOpen(true);
  }

  async function prepareCreatePreviewWorkflowContext() {
    const existingActionId = action?.workflow_action_id || routeActionId;

    if (existingActionId && currentCaseId && currentWorkflowId) {
      await moveWorkflowToResponding();
      return {
        case_id: currentCaseId,
        workflow_id: currentWorkflowId,
        workflow_action_id: existingActionId,
      };
    }

    const ensuredAction = await ensureCanonicalAction();
    if (!ensuredAction?.workflow_action_id) return null;

    await moveWorkflowToResponding();
    return {
      case_id: ensuredAction.case_id || currentCaseId,
      workflow_id: ensuredAction.workflow_id || currentWorkflowId,
      workflow_action_id: ensuredAction.workflow_action_id,
    };
  }

  const canCreatePreview = Boolean(
    selectedNode && selectedAction && !workflowClosed,
  );
  return (
    <main className="min-h-[calc(100dvh-3rem)] bg-[#f5f8fb] p-4 text-slate-900 xl:p-5">
      <div className="flex w-full min-w-0 flex-col gap-5">
        <header className="w-full rounded-[28px] border border-slate-200/80 bg-white px-5 py-[13px] shadow-[0_12px_34px_rgba(15,23,42,0.08)]">
          <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center">
            <div className="flex min-w-0 items-center gap-4 xl:w-[330px] xl:flex-none 2xl:w-[380px]">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 text-teal-600">
                <Workflow aria-hidden className="h-5 w-5" />
              </div>

              <div className="min-w-0 space-y-1.5">
                <div className="flex min-w-0 flex-wrap items-center gap-3">
                  <h1 className="line-clamp-2 break-words text-lg font-semibold leading-tight text-slate-950">
                    {t("page.title")}
                  </h1>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-full border-slate-200 bg-white px-3 text-slate-800"
                    onClick={() => router.back()}
                  >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    {t("page.back")}
                  </Button>
                </div>
                {orderMode ? (
                  <div className="flex min-w-0 items-center gap-1">
                    <p
                      className="min-w-0 truncate text-sm text-slate-500"
                      title={loadedOrderTitle || undefined}
                    >
                      {loadedOrderTitle || t("page.orderLoading")}
                    </p>
                    {loadedOrderStatus === "draft" ? (
                      <button
                        type="button"
                        className="flex size-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                        onClick={() =>
                          setTitleEditRequestKey((current) => current + 1)
                        }
                        aria-label={t("page.editOrderTitle")}
                        title={t("page.editOrderTitle")}
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                ) : null}
                {!orderMode ? (
                <p className="min-w-0 truncate text-sm text-slate-500">
                  {t("page.description")}
                </p>
                ) : null}
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 xl:flex-nowrap xl:justify-end">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 xl:flex-nowrap xl:justify-end">
                <form
                  className="flex h-12 min-w-[260px] flex-1 basis-full items-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 px-4 shadow-inner shadow-slate-200/20 sm:min-w-[320px] lg:basis-[420px] xl:min-w-[360px] xl:basis-auto 2xl:min-w-[520px]"
                  onSubmit={(event) => void submitHeaderCase(event)}
                >
                  <Search
                    aria-hidden
                    className="h-4 w-4 shrink-0 text-slate-400"
                  />
                  <input
                    type="search"
                    aria-label={t("page.caseId")}
                    value={headerCaseInput}
                    onChange={(event) => setHeaderCaseInput(event.target.value)}
                    placeholder={t("page.caseIdPlaceholder")}
                    disabled={orderMode ? orderLoading : loading || caseLookupLoading}
                    readOnly={orderMode}
                    className="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 read-only:cursor-default disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </form>

                <span
                  className="hidden h-6 w-px shrink-0 bg-slate-200 xl:block"
                  aria-hidden="true"
                />

                <div className="flex shrink-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400">
                    <Clock3 aria-hidden className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-slate-400">{t("page.updatedAt")}</div>
                    <div className="whitespace-nowrap text-sm font-medium tabular-nums text-slate-700">
                      {formatHeaderRefreshTime(refreshedAt, locale)}
                    </div>
                  </div>
                </div>

                <span
                  className="hidden h-6 w-px shrink-0 bg-slate-200 xl:block"
                  aria-hidden="true"
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={refreshHeader}
                  disabled={loading || refreshing || orderLoading || caseLookupLoading}
                  aria-label={t("page.refresh")}
                  className="h-10 w-10 shrink-0 rounded-full border-0 text-slate-400 shadow-none hover:bg-slate-100 hover:text-slate-600"
                >
                  <RefreshCcw
                    className={cn(
                      "h-4 w-4",
                    (loading || refreshing || orderLoading || caseLookupLoading) &&
                      "animate-spin",
                    )}
                  />
                  <span className="sr-only">{t("page.refresh")}</span>
                </Button>

                {orderMode ? (
                  <span className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-slate-100 px-4 text-sm font-medium text-slate-600">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    {t("page.orderMode")}
                  </span>
                ) : (
                  <Button
                    type="button"
                    disabled={!canCreatePreview || working === "create-preview"}
                    onClick={() => void handleCreatePreview()}
                    className="h-10 shrink-0 rounded-full bg-teal-600 px-4 text-white shadow-sm hover:bg-teal-700"
                  >
                    {working === "create-preview" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    <span>新建预览</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        {orderMode ? (
          <RemediationOrderWorkspace
            onLoadingChange={handleOrderLoadingChange}
            onOrderLoaded={handleOrderLoaded}
            orderId={routeOrderId}
            refreshKey={orderRefreshKey}
            titleEditRequestKey={titleEditRequestKey}
          />
        ) : (
          <CreateRemediationPreviewDialog
            agentResolve={null}
            buildActionInput={(actionCode, node) =>
              actionInputFor(actionCode, node)
            }
            caseId={currentCaseId}
            expireSeconds={600}
            onCreated={() => {
              toast({
                title: "处置预览已创建",
                description: "已按 mitigation 预览结果生成目标明细",
              });
            }}
            onOpenChange={setCreatePreviewOpen}
            open={createPreviewOpen}
            prepareWorkflowContext={prepareCreatePreviewWorkflowContext}
            scopeId={scopeId}
            scopeType={scopeType}
            selectedAction={selectedAction}
            selectedNode={selectedNode}
            sourceType={sourceType}
            tenantId={tenantId}
            workflowActionId={action?.workflow_action_id || routeActionId}
            workflowId={currentWorkflowId}
          />
        )}

      </div>
      {loading ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/55 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-lg">
            <Loader2 className="size-4 animate-spin text-sky-500" />
            正在加载处置编排上下文
          </div>
        </div>
      ) : null}
    </main>
  );
}
