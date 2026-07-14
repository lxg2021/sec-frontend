"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileCog,
  History,
  Loader2,
  Play,
  RefreshCcw,
  Save,
  ShieldCheck,
} from "lucide-react";

import {
  confirmRemediationOrder,
  prepareRemediationOrder,
  queryRemediationNodeActions,
  queryRemediationOrderById,
  updateRemediationOrder,
  type RemediationActionDecision,
  type RemediationReverseContextOption,
  type RemediationOrder,
  type RemediationOrderItem,
} from "@/features/attack/remediation-order";
import { cn } from "@/shared/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";

import type { RemediationOrchestrationContext } from "../types";
import {
  applicableHistoryContexts,
  buildRemediationOrderDraftItems,
  applicableWmiSubscriptionCandidates,
  fileEAEditorFromItem,
  resolveWmiSubscriptionCandidate,
  shouldPollRemediationOrder,
  validateOrderForPrepare,
  validateWmiSubscriptionEditor,
  wmiSubscriptionEditorFromItem,
  type FileEAEditorState,
  type WmiSubscriptionEditorState,
} from "../remediation-order-model";

const POLL_INTERVAL_MS = 2_000;

type WorkingState = "" | "load" | "refresh" | "save" | "prepare" | "confirm";

export function RemediationOrderOrchestrationPage({
  context,
}: {
  context: RemediationOrchestrationContext;
}) {
  const router = useRouter();
  const orderId = context.order_id?.trim() || "";
  const [order, setOrder] = useState<RemediationOrder | null>(null);
  const [title, setTitle] = useState("");
  const [fileEAEditors, setFileEAEditors] = useState<
    Record<string, FileEAEditorState>
  >({});
  const [wmiSubscriptionEditors, setWmiSubscriptionEditors] = useState<
    Record<string, WmiSubscriptionEditorState>
  >({});
  const [actionDecisions, setActionDecisions] = useState<
    Record<string, RemediationActionDecision | null>
  >({});
  const [actionDecisionErrors, setActionDecisionErrors] =
    useState<Record<string, string>>({});
  const [reverseSourceItemIds, setReverseSourceItemIds] = useState<
    Record<string, string>
  >({});
  const [loadingActionDecisions, setLoadingActionDecisions] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [working, setWorking] = useState<WorkingState>("");
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const adoptOrder = useCallback((next: RemediationOrder) => {
    const editors: Record<string, FileEAEditorState> = {};
    const wmiEditors: Record<string, WmiSubscriptionEditorState> = {};
    const reverseSources: Record<string, string> = {};
    for (const item of next.items) {
      if (item.action_code === "file_ea.delete") {
        editors[item.item_id] = fileEAEditorFromItem(item);
      }
      if (item.action_code === "wmi_subscription.delete") {
        wmiEditors[item.item_id] = wmiSubscriptionEditorFromItem(item);
      }
      reverseSources[item.item_id] = item.reverse_source_id;
    }
    setOrder(next);
    setTitle(next.title);
    setFileEAEditors(editors);
    setWmiSubscriptionEditors(wmiEditors);
    setActionDecisions({});
    setActionDecisionErrors({});
    setReverseSourceItemIds(reverseSources);
    setFieldErrors({});
    setDirty(false);
    setLastUpdatedAt(new Date());
    return next;
  }, []);

  const loadOrder = useCallback(
    async (mode: "load" | "refresh" | "poll" = "load") => {
      if (!orderId) {
        setError("URL 中缺少 order_id，无法加载处置单。");
        return null;
      }
      if (mode === "poll") setPolling(true);
      else setWorking(mode);
      if (mode !== "poll") {
        setError("");
        setNotice("");
      }
      try {
        const next = await queryRemediationOrderById({ order_id: orderId });
        if (mode === "poll" && next.status === "completed") {
          setNotice("处置执行已完成，结果已同步。");
        }
        return adoptOrder(next);
      } catch (cause) {
        const message = requestErrorMessage(cause);
        setError(`加载处置单失败：${message}`);
        return null;
      } finally {
        if (mode === "poll") setPolling(false);
        else setWorking("");
      }
    },
    [adoptOrder, orderId],
  );

  useEffect(() => {
    void loadOrder("load");
  }, [loadOrder]);

  useEffect(() => {
    if (!shouldPollRemediationOrder(order)) return;
    const timer = window.setTimeout(() => {
      void loadOrder("poll");
    }, POLL_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [loadOrder, order]);

  useEffect(() => {
    if (!order || !["draft", "prepared"].includes(order.status)) {
      setLoadingActionDecisions(false);
      return;
    }
    const items = order.items;
    if (items.length === 0) {
      setLoadingActionDecisions(false);
      return;
    }
    const source = remediationNodeActionSource(order);
    if (!source) {
      setActionDecisionErrors(
        Object.fromEntries(
          items.map((item) => [item.item_id, "处置单缺少有效的 Graph scope。"]),
        ),
      );
      setLoadingActionDecisions(false);
      return;
    }
    let canceled = false;
    setLoadingActionDecisions(true);
    setActionDecisions(
      Object.fromEntries(items.map((item) => [item.item_id, null])),
    );
    setActionDecisionErrors({});
    void Promise.all(
      items.map(async (item) => {
        try {
          const result = await queryRemediationNodeActions({
            tenant_id: order.tenant_id || undefined,
            source_type: source.sourceType,
            scope_type: source.scopeType,
            scope_id: source.scopeId,
            node_key: item.node_key,
          });
          const decision =
            result.node.actions.find(
              (value) => value.action.action_code === item.action_code,
            ) ?? null;
          return {
            item,
            decision,
            error: decision ? "" : "当前动作未在节点动作判定中返回。",
          };
        } catch (cause) {
          return {
            item,
            decision: null,
            error: requestErrorMessage(cause),
          };
        }
      }),
    ).then((results) => {
      if (canceled) return;
      const decisions: Record<string, RemediationActionDecision | null> = {};
      const errors: Record<string, string> = {};
      setWmiSubscriptionEditors((current) => {
        const next = { ...current };
        for (const result of results) {
          decisions[result.item.item_id] = result.decision;
          if (result.error) errors[result.item.item_id] = result.error;
          if (result.item.action_code !== "wmi_subscription.delete") continue;
          const editor =
            next[result.item.item_id] ??
            wmiSubscriptionEditorFromItem(result.item);
          const candidates = applicableWmiSubscriptionCandidates(
            result.decision,
            result.item.agent_id,
          );
          if (!editor.targetCandidateId && candidates.length === 1) {
            next[result.item.item_id] = {
              ...editor,
              targetCandidateId: candidates[0].candidate_id,
            };
          }
        }
        return next;
      });
      setActionDecisions(decisions);
      setActionDecisionErrors(errors);
    }).finally(() => {
      if (!canceled) setLoadingActionDecisions(false);
    });
    return () => {
      canceled = true;
    };
  }, [order]);

  const editable = Boolean(
    order && (order.status === "draft" || order.status === "prepared"),
  );
  const busy = Boolean(working);
  const prepareErrors = useMemo(
    () =>
      order
        ? validateOrderForPrepare(
            order,
            fileEAEditors,
            wmiSubscriptionEditors,
            actionDecisions,
            reverseSourceItemIds,
          )
        : {},
    [
      actionDecisions,
      fileEAEditors,
      order,
      reverseSourceItemIds,
      wmiSubscriptionEditors,
    ],
  );

  function updateEAEditor(
    itemId: string,
    update: (current: FileEAEditorState) => FileEAEditorState,
  ) {
    if (!editable) return;
    setFileEAEditors((current) => {
      const base = current[itemId] ?? {
        mode: "",
        eaNamesText: "",
        force: false,
      };
      const next = { ...current, [itemId]: update(base) };
      const message = order
        ? validateOrderForPrepare(
            order,
            next,
            wmiSubscriptionEditors,
            actionDecisions,
            reverseSourceItemIds,
          )[itemId] || ""
        : "";
      setFieldErrors((errors) => ({ ...errors, [itemId]: message }));
      return next;
    });
    setDirty(true);
  }

  function updateWmiSubscriptionEditor(
    item: RemediationOrderItem,
    update: (current: WmiSubscriptionEditorState) => WmiSubscriptionEditorState,
  ) {
    if (!editable) return;
    setWmiSubscriptionEditors((current) => {
      const base = current[item.item_id] ?? wmiSubscriptionEditorFromItem(item);
      const next = { ...current, [item.item_id]: update(base) };
      const message = validateWmiSubscriptionEditor(
        next[item.item_id],
        actionDecisions[item.item_id],
        item.agent_id,
      );
      setFieldErrors((errors) => ({ ...errors, [item.item_id]: message }));
      return next;
    });
    setDirty(true);
  }

  function updateReverseSource(item: RemediationOrderItem, sourceItemId: string) {
    if (!editable) return;
    setReverseSourceItemIds((current) => ({
      ...current,
      [item.item_id]: sourceItemId,
    }));
    setFieldErrors((current) => {
      if (!current[item.item_id]) return current;
      const next = { ...current };
      delete next[item.item_id];
      return next;
    });
    setDirty(true);
  }

  async function persistOrder(current: RemediationOrder) {
    const next = await updateRemediationOrder({
      order_id: current.order_id,
      expected_revision: current.revision,
      title: title.trim() || current.title || `处置单 ${current.order_id}`,
      source: current.source,
      items: buildRemediationOrderDraftItems(
        current,
        fileEAEditors,
        wmiSubscriptionEditors,
        reverseSourceItemIds,
      ),
    });
    return adoptOrder(next);
  }

  async function handleSave() {
    if (!order || !editable) return;
    setWorking("save");
    setError("");
    setNotice("");
    try {
      await persistOrder(order);
      setNotice("处置草稿已保存。");
    } catch (cause) {
      setError(`保存草稿失败：${requestErrorMessage(cause)}`);
    } finally {
      setWorking("");
    }
  }

  async function handlePrepare() {
    if (!order || !editable) return;
    const errors = validateOrderForPrepare(
      order,
      fileEAEditors,
      wmiSubscriptionEditors,
      actionDecisions,
      reverseSourceItemIds,
    );
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("准备校验前，请先完成所有动作参数。");
      document
        .getElementById(`remediation-item-${Object.keys(errors)[0]}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setWorking("prepare");
    setError("");
    setNotice("");
    try {
      const saved = dirty ? await persistOrder(order) : order;
      const prepared = await prepareRemediationOrder({
        order_id: saved.order_id,
        revision: saved.revision,
      });
      adoptOrder(prepared);
      if (prepared.summary.blocked > 0) {
        setError(
          "准备校验完成，但仍有被阻止的处置项。请根据每项原因修改后重新准备。",
        );
      } else {
        setNotice("准备校验通过，可以确认并下发执行。");
      }
    } catch (cause) {
      setError(`准备校验失败：${requestErrorMessage(cause)}`);
    } finally {
      setWorking("");
    }
  }

  async function handleConfirm() {
    if (!order || order.status !== "prepared" || !order.confirmable) return;
    setWorking("confirm");
    setError("");
    setNotice("");
    try {
      const confirmed = await confirmRemediationOrder({
        order_id: order.order_id,
        revision: order.revision,
        prepared_fingerprint_version: order.prepared_fingerprint_version,
        prepared_fingerprint: order.prepared_fingerprint,
      });
      adoptOrder(confirmed);
      setNotice(
        confirmed.status === "completed"
          ? "处置单已完成，没有需要下发的动作。"
          : "处置单已确认，正在等待执行结果。",
      );
    } catch (cause) {
      setError(`确认执行失败：${requestErrorMessage(cause)}`);
    } finally {
      setWorking("");
    }
  }

  if (working === "load" && !order) {
    return <PageLoading label="正在加载处置单..." />;
  }

  if (!order) {
    return (
      <main className="min-h-[calc(100dvh-3rem)] bg-slate-50 p-4 lg:p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <AlertCircle className="h-8 w-8 text-red-600" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-semibold text-slate-950">
            无法打开处置编排
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600" role="alert">
            {error || "未找到处置单。"}
          </p>
          <div className="mt-5 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              返回
            </Button>
            <Button type="button" onClick={() => void loadOrder("load")}>
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              重试
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const canConfirm =
    order.status === "prepared" &&
    order.confirmable &&
    order.summary.blocked === 0 &&
    !dirty;

  return (
    <main className="min-h-[calc(100dvh-3rem)] bg-slate-50 p-3 text-slate-900 sm:p-4 lg:p-6">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-4">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-11 w-11 shrink-0"
                onClick={() => router.back()}
                aria-label="返回上一页"
              >
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              </Button>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-semibold text-slate-950">
                    处置编排
                  </h1>
                  <OrderStatusBadge status={order.status} />
                  {polling ? (
                    <span
                      className="inline-flex items-center gap-1 text-xs text-blue-700"
                      role="status"
                    >
                      <Loader2
                        className="h-3.5 w-3.5 animate-spin"
                        aria-hidden="true"
                      />
                      同步执行状态
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 break-all font-mono text-xs text-slate-500">
                  Order ID：{order.order_id} · Revision {order.revision}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={() => void loadOrder("refresh")}
                disabled={busy || dirty}
              >
                <RefreshCcw
                  className={cn(
                    "h-4 w-4",
                    working === "refresh" && "animate-spin",
                  )}
                  aria-hidden="true"
                />
                刷新
              </Button>
              {editable ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11"
                  onClick={() => void handleSave()}
                  disabled={busy || !dirty}
                >
                  {working === "save" ? (
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Save className="h-4 w-4" aria-hidden="true" />
                  )}
                  保存草稿
                </Button>
              ) : null}
              {editable ? (
                <Button
                  type="button"
                  className="h-11"
                  onClick={() => void handlePrepare()}
                  disabled={busy || loadingActionDecisions}
                >
                  {working === "prepare" ? (
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  )}
                  {dirty ? "保存并准备" : "准备校验"}
                </Button>
              ) : null}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    className="h-11 bg-red-700 text-white hover:bg-red-800"
                    disabled={!canConfirm || busy}
                  >
                    <Play className="h-4 w-4" aria-hidden="true" />
                    确认并执行
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认执行处置单？</AlertDialogTitle>
                    <AlertDialogDescription className="leading-6">
                      将向 {order.summary.ready}{" "}
                      个就绪目标下发处置动作。执行后不能再编辑该处置单；恢复类动作必须通过新的处置单完成。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>返回检查</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-700 hover:bg-red-800"
                      onClick={() => void handleConfirm()}
                    >
                      确认下发
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </header>

        {error ? (
          <div
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
            role="alert"
          >
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <span>{error}</span>
          </div>
        ) : null}

        {notice ? (
          <div
            className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <span>{notice}</span>
          </div>
        ) : null}

        <section
          className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7"
          aria-label="处置单统计"
        >
          <SummaryCard
            label="总目标"
            value={order.summary.total}
            tone="slate"
          />
          <SummaryCard label="草稿" value={order.summary.draft} tone="slate" />
          <SummaryCard label="就绪" value={order.summary.ready} tone="blue" />
          <SummaryCard
            label="已满足"
            value={order.summary.satisfied}
            tone="emerald"
          />
          <SummaryCard label="阻止" value={order.summary.blocked} tone="red" />
          <SummaryCard
            label="执行中"
            value={order.summary.pending + order.summary.running}
            tone="amber"
          />
          <SummaryCard
            label="成功 / 失败"
            value={`${order.summary.success} / ${order.summary.failed}`}
            tone="emerald"
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <label
            htmlFor="remediation-order-title"
            className="text-sm font-semibold text-slate-900"
          >
            处置单标题
          </label>
          <input
            id="remediation-order-title"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setDirty(true);
            }}
            disabled={!editable || busy}
            className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100 disabled:text-slate-500"
          />
          <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-3">
            <span>来源：{formatSource(order)}</span>
            <span>Case：{order.source.case_id || "--"}</span>
            <span>Workflow：{order.source.workflow_id || "--"}</span>
          </div>
          {order.status === "prepared" && dirty ? (
            <p
              className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
              role="status"
            >
              修改会使当前 Prepared 指纹失效；保存后需要重新准备校验。
            </p>
          ) : null}
        </section>

        <section
          className="space-y-3"
          aria-labelledby="remediation-order-items-title"
        >
          <div className="flex items-end justify-between gap-3 px-1">
            <div>
              <h2
                id="remediation-order-items-title"
                className="text-base font-semibold text-slate-950"
              >
                处置目标与参数
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Prepare 会重新验证 Graph、Agent、历史、冲突和动作参数。
              </p>
            </div>
            <span className="text-xs tabular-nums text-slate-500">
              {order.items.length} 项
            </span>
          </div>
          {order.items.map((item, index) => (
            <OrderItemCard
              key={item.item_id}
              item={item}
              index={index}
              editable={editable && !busy}
              editor={fileEAEditors[item.item_id]}
              wmiEditor={wmiSubscriptionEditors[item.item_id]}
              actionDecision={actionDecisions[item.item_id]}
              actionDecisionError={actionDecisionErrors[item.item_id]}
              reverseSourceItemId={reverseSourceItemIds[item.item_id] ?? ""}
              fieldError={
                fieldErrors[item.item_id] || prepareErrors[item.item_id] || ""
              }
              onEditorChange={(update) => updateEAEditor(item.item_id, update)}
              onWmiEditorChange={(update) =>
                updateWmiSubscriptionEditor(item, update)
              }
              onReverseSourceChange={(sourceItemId) =>
                updateReverseSource(item, sourceItemId)
              }
            />
          ))}
        </section>

        <footer className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              最近同步：
              {lastUpdatedAt
                ? lastUpdatedAt.toLocaleString("zh-CN", { hour12: false })
                : "--"}
            </span>
            <span>
              Prepared 有效期：{formatDateTime(order.prepared_expires_at)}
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}

function OrderItemCard({
  item,
  index,
  editable,
  editor,
  wmiEditor,
  actionDecision,
  actionDecisionError,
  reverseSourceItemId,
  fieldError,
  onEditorChange,
  onWmiEditorChange,
  onReverseSourceChange,
}: {
  item: RemediationOrderItem;
  index: number;
  editable: boolean;
  editor?: FileEAEditorState;
  wmiEditor?: WmiSubscriptionEditorState;
  actionDecision?: RemediationActionDecision | null;
  actionDecisionError?: string;
  reverseSourceItemId: string;
  fieldError: string;
  onEditorChange: (
    update: (current: FileEAEditorState) => FileEAEditorState,
  ) => void;
  onWmiEditorChange: (
    update: (current: WmiSubscriptionEditorState) => WmiSubscriptionEditorState,
  ) => void;
  onReverseSourceChange: (sourceItemId: string) => void;
}) {
  const effectiveEditor = editor ?? fileEAEditorFromItem(item);
  const effectiveWmiEditor = wmiEditor ?? wmiSubscriptionEditorFromItem(item);
  const isFileEADelete = item.action_code === "file_ea.delete";
  const isWmiSubscriptionDelete =
    item.action_code === "wmi_subscription.delete";
  const wmiCandidates = applicableWmiSubscriptionCandidates(
    actionDecision,
    item.agent_id,
  );
  const selectedWmiCandidate = resolveWmiSubscriptionCandidate(
    effectiveWmiEditor,
    wmiCandidates,
  );
  const historyContexts = applicableHistoryContexts(
    actionDecision,
    item.agent_id,
  );
  const isHistoryAction =
    historyContexts.length > 0 || Boolean(item.reverse_source_id);
  const selectedHistoryContext = historyContexts.find(
    (context) => context.source_item_id === reverseSourceItemId,
  );
  return (
    <article
      id={`remediation-item-${item.item_id}`}
      className="scroll-mt-20 rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100">
            {isFileEADelete ? (
              <FileCog className="h-5 w-5" aria-hidden="true" />
            ) : isHistoryAction ? (
              <History className="h-5 w-5" aria-hidden="true" />
            ) : (
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-950">
                {index + 1}. {item.display_name || item.node_key}
              </h3>
              <ItemStatusBadge status={item.status} />
              <RiskBadge risk={item.risk_level} />
            </div>
            <p className="mt-1 break-all font-mono text-[11px] leading-5 text-slate-500">
              {item.node_key}
            </p>
          </div>
        </div>
        <dl className="grid shrink-0 grid-cols-2 gap-x-5 gap-y-1 text-xs md:text-right">
          <div>
            <dt className="text-slate-400">Agent</dt>
            <dd className="font-mono text-slate-700">
              {item.agent_id || "--"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">动作</dt>
            <dd className="font-mono text-slate-700">{item.action_code}</dd>
          </div>
        </dl>
      </div>

      {isFileEADelete ? (
        <fieldset className="p-4" disabled={!editable}>
          <legend className="text-sm font-semibold text-slate-900">
            File EA 删除范围
          </legend>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            必须按名称指定 EA，或明确确认删除该文件上的全部
            EA。空列表不会被当作隐式“全部”。
          </p>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <label
              className={cn(
                "flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border p-3",
                effectiveEditor.mode === "named"
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 bg-white",
                !editable && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                type="radio"
                name={`ea-scope-${item.item_id}`}
                value="named"
                checked={effectiveEditor.mode === "named"}
                onChange={() =>
                  onEditorChange((current) => ({ ...current, mode: "named" }))
                }
                className="mt-1 h-4 w-4"
              />
              <span>
                <span className="block text-sm font-medium text-slate-900">
                  按 EA 名称删除
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  每行或逗号分隔一个名称，最多 128 个。
                </span>
              </span>
            </label>
            <label
              className={cn(
                "flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border p-3",
                effectiveEditor.mode === "all"
                  ? "border-red-500 bg-red-50"
                  : "border-slate-200 bg-white",
                !editable && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                type="radio"
                name={`ea-scope-${item.item_id}`}
                value="all"
                checked={effectiveEditor.mode === "all"}
                onChange={() =>
                  onEditorChange((current) => ({
                    ...current,
                    mode: "all",
                    eaNamesText: "",
                  }))
                }
                className="mt-1 h-4 w-4"
              />
              <span>
                <span className="block text-sm font-medium text-red-900">
                  删除全部 EA
                </span>
                <span className="mt-1 block text-xs text-red-700">
                  这是破坏性范围，必须显式选择后才能 Prepare。
                </span>
              </span>
            </label>
          </div>
          {effectiveEditor.mode === "named" ? (
            <div className="mt-3">
              <label
                htmlFor={`ea-names-${item.item_id}`}
                className="text-xs font-medium text-slate-700"
              >
                EA 名称列表
              </label>
              <textarea
                id={`ea-names-${item.item_id}`}
                value={effectiveEditor.eaNamesText}
                onChange={(event) =>
                  onEditorChange((current) => ({
                    ...current,
                    eaNamesText: event.target.value,
                  }))
                }
                rows={4}
                placeholder={"Zone.Identifier\nMalwareMeta"}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
              />
            </div>
          ) : null}
          <label className="mt-3 flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
            <Checkbox
              checked={effectiveEditor.force}
              onCheckedChange={(checked) =>
                onEditorChange((current) => ({
                  ...current,
                  force: Boolean(checked),
                }))
              }
              disabled={!editable}
              aria-label="强制执行 File EA 删除"
            />
            强制执行
          </label>
          {fieldError ? (
            <p className="mt-2 text-xs font-medium text-red-700" role="alert">
              {fieldError}
            </p>
          ) : null}
        </fieldset>
      ) : isWmiSubscriptionDelete ? (
        <fieldset className="p-4" disabled={!editable}>
          <legend className="text-sm font-semibold text-slate-900">
            WMI Subscription 处置目标
          </legend>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            目标来自 Graph 解析出的 Filter–Binding–Consumer
            关系。这里只选择服务器返回的候选引用，不能手工填写 namespace、Filter
            或 Consumer。
          </p>

          <div className="mt-3">
            <label
              htmlFor={`wmi-target-${item.item_id}`}
              className="text-xs font-medium text-slate-700"
            >
              具体 Binding
            </label>
            <select
              id={`wmi-target-${item.item_id}`}
              value={selectedWmiCandidate?.candidate_id ?? ""}
              onChange={(event) =>
                onWmiEditorChange((current) => ({
                  ...current,
                  targetCandidateId: event.target.value,
                }))
              }
              className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
            >
              <option value="">
                {actionDecision
                  ? "请选择 WMI Subscription Binding"
                  : "正在加载 Graph 权威目标…"}
              </option>
              {wmiCandidates.map((candidate) => (
                <option
                  key={candidate.candidate_id}
                  value={candidate.candidate_id}
                >
                  {candidate.display_name || candidate.candidate_id}
                </option>
              ))}
            </select>
          </div>

          {selectedWmiCandidate ? (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
              <div>
                Filter 绑定数：{selectedWmiCandidate.source_binding_count}
                ；Consumer 绑定数：{selectedWmiCandidate.target_binding_count}
              </div>
              <div className="mt-1 font-mono text-[11px] text-slate-500">
                candidate_id: {selectedWmiCandidate.candidate_id}
              </div>
            </div>
          ) : null}

          <label
            className={cn(
              "mt-3 flex min-h-11 items-start gap-3 rounded-lg border px-3 py-2 text-sm",
              selectedWmiCandidate?.shared_source ||
                selectedWmiCandidate?.shared_target
                ? "border-amber-300 bg-amber-50 text-amber-950"
                : "border-slate-200 text-slate-700",
            )}
          >
            <Checkbox
              checked={effectiveWmiEditor.removeBindingOnly}
              onCheckedChange={(checked) =>
                onWmiEditorChange((current) => ({
                  ...current,
                  removeBindingOnly: Boolean(checked),
                }))
              }
              disabled={!editable}
              aria-label="仅移除所选 WMI Binding"
            />
            <span>
              <span className="block font-medium">仅移除所选 Binding</span>
              <span className="mt-1 block text-xs opacity-80">
                当 Filter 或 Consumer
                被其他订阅共享时，这是唯一允许的安全删除范围。
              </span>
            </span>
          </label>

          {actionDecisionError ? (
            <p className="mt-2 text-xs font-medium text-red-700" role="alert">
              加载 WMI 目标失败：{actionDecisionError}
            </p>
          ) : null}
          {fieldError ? (
            <p className="mt-2 text-xs font-medium text-red-700" role="alert">
              {fieldError}
            </p>
          ) : null}
        </fieldset>
      ) : isHistoryAction ? (
        <fieldset className="p-4" disabled={!editable}>
          <legend className="text-sm font-semibold text-slate-900">
            历史处置来源
          </legend>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            该动作需要引用一次权威的历史成功处置。这里只选择后台返回的来源记录，不能手工填写备份或任务标识。
          </p>
          <div className="mt-3">
            <label
              htmlFor={`history-source-${item.item_id}`}
              className="text-xs font-medium text-slate-700"
            >
              回滚来源
            </label>
            <select
              id={`history-source-${item.item_id}`}
              value={reverseSourceItemId}
              onChange={(event) => onReverseSourceChange(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
            >
              <option value="">请选择历史处置来源</option>
              {historyContexts.map((context) => (
                <option
                  key={context.source_item_id}
                  value={context.source_item_id}
                >
                  {formatHistoryContext(context)}
                </option>
              ))}
            </select>
          </div>

          {selectedHistoryContext ? (
            <dl className="mt-3 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 sm:grid-cols-2">
              <div>
                <dt className="text-slate-400">来源动作</dt>
                <dd className="mt-0.5 font-mono text-slate-700">
                  {selectedHistoryContext.source_action_code || "--"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">来源 Item</dt>
                <dd className="mt-0.5 break-all font-mono text-slate-700">
                  {selectedHistoryContext.source_item_id}
                </dd>
              </div>
            </dl>
          ) : null}

          {actionDecisionError ? (
            <p className="mt-2 text-xs font-medium text-red-700" role="alert">
              加载历史来源失败：{actionDecisionError}
            </p>
          ) : null}
          {fieldError ? (
            <p className="mt-2 text-xs font-medium text-red-700" role="alert">
              {fieldError}
            </p>
          ) : null}
        </fieldset>
      ) : (
        <div className="p-4 text-xs text-slate-500">
          该动作当前没有需要在编排页修改的参数；Prepare
          仍会重新校验其权威上下文。
        </div>
      )}

      {item.reason_code || item.reason_message || item.error_message ? (
        <div
          className="border-t border-slate-100 bg-amber-50 px-4 py-3 text-xs text-amber-900"
          role="status"
        >
          <span className="font-semibold">
            {item.reason_code || item.error_code || "ITEM_STATUS"}
          </span>
          <span className="ml-2">
            {item.reason_message || item.error_message}
          </span>
        </div>
      ) : null}
      {item.execution ? (
        <div className="grid gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
          <span>
            Operation：<b>{item.execution.operation_status || "--"}</b>
          </span>
          <span>
            Dispatch：
            <b>{item.dispatch_id || item.execution.dispatch_id || "--"}</b>
          </span>
          <span>
            执行状态：<b>{item.execution.execution_status || item.status}</b>
          </span>
          <span>
            结果版本：<b>{item.result_version}</b>
          </span>
        </div>
      ) : null}
    </article>
  );
}

function PageLoading({ label }: { label: string }) {
  return (
    <main className="flex min-h-[calc(100dvh-3rem)] items-center justify-center bg-slate-50">
      <div
        className="flex items-center gap-2 text-sm text-slate-600"
        role="status"
      >
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        {label}
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "slate" | "blue" | "emerald" | "amber" | "red";
}) {
  const tones = {
    slate: "border-slate-200 bg-white text-slate-950",
    blue: "border-blue-200 bg-blue-50 text-blue-900",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    red: "border-red-200 bg-red-50 text-red-900",
  };
  return (
    <div className={cn("rounded-xl border p-3 shadow-sm", tones[tone])}>
      <div className="text-[11px] font-medium opacity-70">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const label = statusLabel(status);
  const tone =
    status === "completed"
      ? "bg-emerald-100 text-emerald-800"
      : status === "running"
        ? "bg-blue-100 text-blue-800"
        : status === "prepared"
          ? "bg-violet-100 text-violet-800"
          : status === "draft"
            ? "bg-slate-100 text-slate-700"
            : "bg-amber-100 text-amber-800";
  return <Badge className={cn("border-0", tone)}>{label}</Badge>;
}

function ItemStatusBadge({ status }: { status: string }) {
  const failed = ["blocked", "failed", "uncertain"].includes(status);
  const success = ["ready", "satisfied", "success", "skipped"].includes(status);
  return (
    <Badge
      variant="outline"
      className={cn(
        failed
          ? "border-red-200 bg-red-50 text-red-800"
          : success
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-slate-200 bg-slate-50 text-slate-700",
      )}
    >
      {statusLabel(status)}
    </Badge>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const normalized = risk.toLowerCase();
  return (
    <Badge
      variant="outline"
      className={cn(
        normalized === "high" || normalized === "critical"
          ? "border-red-200 bg-red-50 text-red-800"
          : normalized === "medium"
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : "border-slate-200 bg-slate-50 text-slate-700",
      )}
    >
      {risk || "unknown"}
    </Badge>
  );
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: "草稿",
    prepared: "已准备",
    running: "执行中",
    completed: "已完成",
    canceled: "已取消",
    expired: "已过期",
    ready: "就绪",
    satisfied: "已满足",
    blocked: "已阻止",
    pending: "等待执行",
    success: "成功",
    failed: "失败",
    skipped: "已跳过",
    uncertain: "结果不确定",
  };
  return labels[status] || status || "未知";
}

function formatHistoryContext(context: RemediationReverseContextOption) {
  const action = context.source_action_code || "历史处置";
  return `${action} · ${context.source_item_id}`;
}

function remediationNodeActionSource(order: RemediationOrder) {
  const value = String(order.source.source_type).trim().toLowerCase();
  if (
    value === "1" ||
    value === "case_graph" ||
    value.endsWith("_case_graph")
  ) {
    const scopeId = order.source.case_id.trim();
    return scopeId
      ? { sourceType: "case_graph", scopeType: "case", scopeId }
      : null;
  }
  if (
    value === "2" ||
    value === "drill_graph" ||
    value.endsWith("_drill_graph")
  ) {
    const scopeId = order.source.source_ref_id.trim();
    return scopeId
      ? { sourceType: "drill_graph", scopeType: "positioning", scopeId }
      : null;
  }
  if (
    value === "3" ||
    value === "locate_graph" ||
    value.endsWith("_locate_graph")
  ) {
    const scopeId = order.source.source_ref_id.trim();
    return scopeId
      ? { sourceType: "locate_graph", scopeType: "positioning", scopeId }
      : null;
  }
  return null;
}

function formatSource(order: RemediationOrder) {
  const source = String(order.source.source_type);
  return source || "--";
}

function formatDateTime(value: string) {
  if (!value) return "--";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("zh-CN", { hour12: false });
}

function requestErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "未知请求错误";
}
