"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ComponentType,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock3,
  FileWarning,
  Loader2,
  Network,
  Plus,
  RefreshCcw,
  Search,
  Square,
  TerminalSquare,
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
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { useToast } from "@/shared/ui/use-toast";

import {
  cancelRemediationPreview,
  confirmRemediationPreview,
  queryRemediationNodeActions,
  resolveRemediationNodeAgents,
} from "../api";
import {
  MOCK_ACTION_OPTIONS,
  MOCK_DETAIL,
  MOCK_EXECUTION,
  MOCK_NODES,
  MOCK_REMEDIATION_ACTION,
  MOCK_STATS,
  MOCK_WORKFLOW,
} from "../mock";
import type {
  RemediationActionInput,
  RemediationActionOption,
  RemediationCandidateNode,
  RemediationExecutionSnapshot,
  RemediationOrchestrationContext,
  RemediationPreviewSnapshot,
  RemediationPreviewDetail,
  RemediationWorkflowStats,
  ResolveRemediationNodeAgentsResponse,
} from "../types";
import { CreateRemediationPreviewDialog } from "./create-remediation-preview-dialog";
import type { RemediationHistoryData } from "./remediation-history-panel";

const RESPONSE_TIMEZONE = "Asia/Shanghai";
const PAGE_SOURCE = "remediation_orchestration_page";
const RESPONDING_STATUS: AttackWorkflowStatus = "responding";

const STATUS_LABELS: Record<string, string> = {
  detected: "已发现",
  investigating: "调查中",
  confirmed: "已确认",
  forensics: "取证中",
  responding: "处置中",
  contained: "已遏制",
  remediated: "已处置",
  closed: "已关闭",
  pending: "等待中",
  running: "运行中",
  success: "成功",
  failed: "失败",
  skipped: "已跳过",
  created: "已创建",
  dispatched: "已下发",
  confirmed_preview: "已确认",
  canceled: "已取消",
  expired: "已过期",
  ready: "就绪",
  partial: "部分可执行",
  blocked: "阻断",
  resolved: "已解析",
  unresolved: "未解析",
  ambiguous: "多 Agent",
  unresolvable: "不可解析",
};

const ACTION_LABELS: Record<string, string> = {
  "file.quarantine": "隔离文件",
  "file.restore": "恢复文件",
  "process.terminate": "终止进程",
  "process.force_terminate": "强制终止",
  "process.block_execute": "阻断执行",
  "process.bypass_execute": "放行执行",
  "net.block": "阻断网络",
  "net.bypass": "放行网络",
};

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

function todayDate() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function monthAgoDate() {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function formatHeaderRefreshTime(value?: Date | null) {
  if (!value) return "--";

  const parts = new Intl.DateTimeFormat("zh-CN", {
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

function statusLabel(status: string | number | undefined) {
  const normalized =
    typeof status === "number"
      ? String(status)
      : String(status ?? "")
          .trim()
          .toLowerCase();
  return STATUS_LABELS[normalized] ?? String(status ?? "-");
}

function statusTone(status: string | number | undefined) {
  const normalized = String(status ?? "")
    .trim()
    .toLowerCase();
  if (
    [
      "success",
      "ready",
      "resolved",
      "confirmed",
      "confirmed_preview",
      "remediated",
    ].includes(normalized)
  ) {
    return "emerald";
  }
  if (
    ["failed", "blocked", "unresolvable", "canceled", "expired"].includes(
      normalized,
    )
  ) {
    return "red";
  }
  if (
    [
      "created",
      "dispatched",
      "running",
      "pending",
      "ambiguous",
      "partial",
      "responding",
    ].includes(normalized)
  ) {
    return "amber";
  }
  if (["closed", "skipped"].includes(normalized)) return "slate";
  return "blue";
}

function toneClasses(tone: string) {
  switch (tone) {
    case "emerald":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "red":
      return "border-red-200 bg-red-50 text-red-700";
    case "amber":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "slate":
      return "border-slate-200 bg-slate-50 text-slate-600";
    default:
      return "border-sky-200 bg-sky-50 text-sky-700";
  }
}

function actionLabel(actionCode: string) {
  return ACTION_LABELS[actionCode] ?? actionCode;
}

function actionOptionLabel(option: RemediationActionOption) {
  return option.display_name?.trim() || actionLabel(option.action_code);
}

function actionOptionHint(option: RemediationActionOption) {
  const hints = [
    option.requires_agent ? "需要终端" : "",
    option.requires_history ? "依赖历史" : "",
    option.contexts.length > 0 ? `${option.contexts.length} 个上下文` : "",
  ].filter(Boolean);
  return hints.join(" · ") || "当前目标可执行";
}

function entityTypeLabel(entityType: string) {
  const normalized = entityType.trim().toLowerCase();
  if (normalized.includes("file")) return "文件";
  if (normalized.includes("process")) return "进程";
  if (normalized.includes("net")) return "网络";
  if (normalized.includes("dns")) return "域名";
  if (normalized.includes("url")) return "URL";
  if (normalized.includes("account")) return "账号";
  if (normalized.includes("service")) return "服务";
  return entityType || "目标";
}

function shortValue(value: string) {
  const normalized = value.trim();
  if (!normalized) return "-";
  if (normalized.length <= 18) return normalized;
  return `${normalized.slice(0, 12)}...${normalized.slice(-4)}`;
}

function sourceTypeLabel(sourceType: string) {
  const normalized = sourceType.trim().toLowerCase();
  if (normalized === "case_graph") return "案件图谱";
  if (normalized === "drill_graph") return "溯源图谱";
  if (normalized === "locate_graph") return "定位图谱";
  if (normalized === "manual") return "手动创建";
  return sourceType || "-";
}

function scopeTypeLabel(scopeType: string) {
  const normalized = scopeType.trim().toLowerCase();
  if (normalized === "case") return "案件范围";
  if (normalized === "positioning") return "定位范围";
  return scopeType || "-";
}

function actionInputFor(
  actionCode: string,
  node?: RemediationCandidateNode,
): RemediationActionInput | undefined {
  switch (actionCode) {
    case "file.quarantine":
      return { file_quarantine: { delete_original: true, encrypt: true } };
    case "process.terminate":
    case "process.force_terminate":
      return {
        process_terminate: { include_self: true, include_children: true },
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

function nodeIcon(entityType: string): ComponentType<{ className?: string }> {
  const normalized = entityType.trim().toLowerCase();
  if (normalized.includes("file")) return FileWarning;
  if (normalized.includes("process")) return TerminalSquare;
  if (
    normalized.includes("net") ||
    normalized.includes("dns") ||
    normalized.includes("url")
  ) {
    return Network;
  }
  return Square;
}

function isMockContext(context: RemediationOrchestrationContext) {
  return !context.case_id?.trim() && !context.workflow_id?.trim();
}

function statusBadge(status: string | number | undefined, className?: string) {
  const tone = statusTone(status);
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 rounded-full px-2.5 text-[11px] font-medium",
        toneClasses(tone),
        className,
      )}
    >
      {statusLabel(status)}
    </Badge>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
      <Icon className="size-8 text-slate-300" />
      <div className="mt-3 text-sm font-medium text-slate-700">{title}</div>
      <div className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
        {description}
      </div>
    </div>
  );
}

function normalizeNodeFromContext(
  context: RemediationOrchestrationContext,
): RemediationCandidateNode | null {
  const nodeKey = context.node_key?.trim();
  if (!nodeKey) return null;
  const entityType = context.entity_type?.trim() || "File";
  const displayName = context.display_name?.trim() || nodeKey;
  const agentId = context.workflow_id ? "" : MOCK_WORKFLOW.primary_agent_id;
  return {
    node_key: nodeKey,
    entity_type: entityType,
    display_name: displayName,
    description: "来自图谱入口参数",
    resolve_status: agentId ? "resolved" : "unresolved",
    agent_ids: agentId ? [agentId] : [],
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
  const { toast } = useToast();
  const [workflow, setWorkflow] = useState<AttackWorkflowItem | null>(null);
  const [action, setAction] = useState<AttackWorkflowActionItem | null>(null);
  const [stats, setStats] = useState<RemediationWorkflowStats | null>(null);
  const [detail, setDetail] = useState<RemediationPreviewDetail | null>(null);
  const [execution, setExecution] =
    useState<RemediationExecutionSnapshot | null>(null);
  const [preview, setPreview] = useState<RemediationPreviewSnapshot | null>(
    null,
  );
  const [nodes, setNodes] = useState<RemediationCandidateNode[]>(MOCK_NODES);
  const [selectedNodeKey, setSelectedNodeKey] = useState(
    MOCK_NODES[0]?.node_key ?? "",
  );
  const [actionOptions, setActionOptions] =
    useState<RemediationActionOption[]>(MOCK_ACTION_OPTIONS);
  const [selectedActionCode, setSelectedActionCode] = useState(
    MOCK_ACTION_OPTIONS[0]?.action_code ?? "",
  );
  const [agentResolve, setAgentResolve] =
    useState<ResolveRemediationNodeAgentsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [mockMode, setMockMode] = useState(isMockContext(context));
  const [headerCaseInput, setHeaderCaseInput] = useState(
    context.case_id?.trim() || "",
  );
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  const [batchesRefreshKey, setBatchesRefreshKey] = useState(0);
  const [createPreviewOpen, setCreatePreviewOpen] = useState(false);
  const [startTime] = useState(monthAgoDate);
  const [endTime] = useState(todayDate);

  const routeCaseId = context.case_id?.trim() || "";
  const routeWorkflowId = context.workflow_id?.trim() || "";
  const routeActionId = context.workflow_action_id?.trim() || "";
  const tenantId = context.tenant_id?.trim() || "";
  const currentCaseId =
    workflow?.case_id || routeCaseId || (mockMode ? MOCK_WORKFLOW.case_id : "");
  const currentWorkflowId =
    workflow?.workflow_id ||
    routeWorkflowId ||
    (mockMode ? MOCK_WORKFLOW.workflow_id : "");
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

  const loadPage = useCallback(
    async (refreshingOnly = false) => {
      if (refreshingOnly) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      try {
        const demoMode = isMockContext(context);
        let nextWorkflow: AttackWorkflowItem | null = null;
        let nextActions: AttackWorkflowActionItem[] = [];

        if (!demoMode) {
          const detailResult = routeWorkflowId
            ? await getAttackWorkflow({
                tenantId,
                workflowId: routeWorkflowId,
                includeActions: true,
                includeEvents: false,
              })
            : routeCaseId
              ? await getAttackWorkflowByCaseId({
                  tenantId,
                  caseId: routeCaseId,
                  includeActions: true,
                  includeEvents: false,
                })
              : null;

          nextWorkflow = detailResult?.workflow ?? null;
          nextActions = detailResult?.actions ?? [];
        }

        if (!nextWorkflow) {
          setMockMode(true);
          nextWorkflow = {
            ...MOCK_WORKFLOW,
            case_id: routeCaseId || MOCK_WORKFLOW.case_id,
            root_id: routeCaseId || MOCK_WORKFLOW.root_id,
            workflow_id: routeWorkflowId || MOCK_WORKFLOW.workflow_id,
          };
          nextActions = [MOCK_REMEDIATION_ACTION];
        } else {
          setMockMode(false);
        }

        const nextCaseId = nextWorkflow.case_id || routeCaseId;
        const routeAction = routeActionId
          ? (nextActions.find(
              (item) => item.workflow_action_id === routeActionId,
            ) ?? null)
          : null;
        const nextAction =
          routeAction ?? canonicalRemediationAction(nextActions, nextCaseId);

        setWorkflow(nextWorkflow);
        setAction(
          nextAction ??
            (demoMode
              ? {
                  ...MOCK_REMEDIATION_ACTION,
                  workflow_id: nextWorkflow.workflow_id,
                  case_id: nextWorkflow.case_id,
                  target_key: nextWorkflow.case_id,
                }
              : null),
        );

        const contextNode = normalizeNodeFromContext(context);
        if (contextNode) {
          setNodes([contextNode, ...MOCK_NODES]);
          setSelectedNodeKey(contextNode.node_key);
        }

        if (demoMode) {
          setStats(MOCK_STATS);
          setDetail(MOCK_DETAIL);
          setExecution(MOCK_EXECUTION);
        } else {
          setStats(null);
          setDetail(null);
          setExecution(null);
        }
        setBatchesRefreshKey((current) => current + 1);
      } catch (err) {
        setMockMode(true);
        setWorkflow(MOCK_WORKFLOW);
        setAction(MOCK_REMEDIATION_ACTION);
        setStats(MOCK_STATS);
        setDetail(MOCK_DETAIL);
        setExecution(MOCK_EXECUTION);
        setError(
          err instanceof Error
            ? err.message
            : "处置编排数据加载失败，当前展示演示数据",
        );
      } finally {
        setRefreshedAt(new Date());
        setLoading(false);
        setRefreshing(false);
      }
    },
    [context, routeActionId, routeCaseId, routeWorkflowId, tenantId],
  );

  useEffect(() => {
    void loadPage(false);
  }, [loadPage]);

  useEffect(() => {
    setHeaderCaseInput(routeCaseId);
  }, [routeCaseId]);

  function submitHeaderCase(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const nextCaseId = headerCaseInput.trim();
    const current = routeCaseId;

    if (nextCaseId === current) {
      void loadPage(true);
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
    const nextCaseId = headerCaseInput.trim();
    const current = routeCaseId;
    if (nextCaseId !== current) {
      submitHeaderCase();
      return;
    }
    void loadPage(true);
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

  async function resolveSelectedNode() {
    if (!selectedNode || mockMode) return;
    setWorking("resolve-node");
    try {
      const resolved = await resolveRemediationNodeAgents({
        tenant_id: tenantId,
        scope_type: scopeType,
        scope_id: scopeId,
        node_key: selectedNode.node_key,
        entity_type: selectedNode.entity_type,
      });
      setAgentResolve(resolved);
      setNodes((current) =>
        current.map((node) =>
          node.node_key === selectedNode.node_key
            ? {
                ...node,
                resolve_status: resolved.status,
                agent_ids: resolved.agent_ids,
              }
            : node,
        ),
      );
    } catch (err) {
      toast({
        title: "Agent 解析失败",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setWorking("");
    }
  }

  async function querySelectedNodeActions() {
    if (!selectedNode || mockMode) return;
    setWorking("query-actions");
    try {
      const result = await queryRemediationNodeActions({
        tenant_id: tenantId,
        source_type: sourceType,
        scope_type: scopeType,
        scope_id: scopeId,
        node: {
          node_key: selectedNode.node_key,
          entity_type: selectedNode.entity_type,
          agent_ids: selectedNode.agent_ids,
        },
      });
      const actions = result.node.actions;
      setActionOptions(actions.length > 0 ? actions : []);
      setSelectedActionCode(actions[0]?.action_code ?? "");
    } catch (err) {
      toast({
        title: "动作查询失败",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setWorking("");
    }
  }

  function handleCreatePreview() {
    if (workflowClosed) return;
    if (mockMode) {
      setPreview(MOCK_DETAIL.preview);
      toast({ title: "演示模式已生成预览示例" });
      return;
    }

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

  async function handleConfirmPreview() {
    const previewId = preview?.preview_id;
    if (!previewId || workflowClosed) return;
    if (mockMode) {
      setExecution(MOCK_EXECUTION);
      setDetail(MOCK_DETAIL);
      setBatchesRefreshKey((current) => current + 1);
      toast({ title: "演示模式已确认执行示例" });
      return;
    }

    setWorking("confirm-preview");
    try {
      const nextExecution = await confirmRemediationPreview({
        tenant_id: tenantId,
        preview_id: previewId,
      });
      if (!nextExecution?.execution_id)
        throw new Error("执行确认失败，缺少批次信息");
      setExecution(nextExecution);
      setBatchesRefreshKey((current) => current + 1);
      toast({ title: "处置预览已确认并下发" });
    } catch (err) {
      toast({
        title: "确认预览失败",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setWorking("");
    }
  }

  async function handleCancelPreview() {
    const previewId = preview?.preview_id;
    if (!previewId || workflowClosed) return;
    if (mockMode) {
      setPreview(null);
      setBatchesRefreshKey((current) => current + 1);
      toast({ title: "演示预览已取消" });
      return;
    }

    setWorking("cancel-preview");
    try {
      const nextPreview = await cancelRemediationPreview({
        tenant_id: tenantId,
        preview_id: previewId,
        cancel_reason: "operator canceled from remediation orchestration page",
      });
      setPreview(nextPreview);
      setBatchesRefreshKey((current) => current + 1);
      toast({ title: "处置预览已取消" });
    } catch (err) {
      toast({
        title: "取消预览失败",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setWorking("");
    }
  }

  const selectRemediationNode = useCallback(
    (node: RemediationCandidateNode) => {
      setSelectedNodeKey(node.node_key);
      const nextActions = MOCK_ACTION_OPTIONS.filter((option) => {
        const entity = node.entity_type.toLowerCase();
        if (entity.includes("file"))
          return option.action_code.startsWith("file.");
        if (entity.includes("process"))
          return option.action_code.startsWith("process.");
        if (entity.includes("net"))
          return option.action_code.startsWith("net.");
        return true;
      });
      setActionOptions(nextActions);
      setSelectedActionCode(nextActions[0]?.action_code ?? "");
      setPreview(null);
    },
    [],
  );

  const canCreatePreview = Boolean(
    selectedNode && selectedAction && !workflowClosed,
  );
  const activePreviewStatus = String(preview?.preview_status ?? "")
    .trim()
    .toLowerCase();
  const canConfirm =
    Boolean(preview?.preview_id) &&
    !workflowClosed &&
    !["confirmed", "canceled", "expired"].includes(activePreviewStatus);
  const handleBatchesDataChange = useCallback(
    ({
      detail: nextDetail,
      execution: nextExecution,
      stats: nextStats,
    }: RemediationHistoryData) => {
      setStats(nextStats);
      setDetail(nextDetail);
      setExecution(nextExecution);
    },
    [],
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
                    处置编排
                  </h1>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-full border-slate-200 bg-white px-3 text-slate-800"
                    onClick={() => router.back()}
                  >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    返回
                  </Button>
                </div>
                <p className="min-w-0 truncate text-sm text-slate-500">
                  预览、下发、跟踪处置动作
                </p>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 xl:flex-nowrap xl:justify-end">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 xl:flex-nowrap xl:justify-end">
                <form
                  className="flex h-12 min-w-[260px] flex-1 basis-full items-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 px-4 shadow-inner shadow-slate-200/20 sm:min-w-[320px] lg:basis-[420px] xl:min-w-[360px] xl:basis-auto 2xl:min-w-[520px]"
                  onSubmit={submitHeaderCase}
                >
                  <Search
                    aria-hidden
                    className="h-4 w-4 shrink-0 text-slate-400"
                  />
                  <input
                    type="search"
                    aria-label="案件 ID"
                    value={headerCaseInput}
                    onChange={(event) => setHeaderCaseInput(event.target.value)}
                    placeholder="请输入案件 ID"
                    disabled={loading}
                    className="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
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
                    <div className="text-xs text-slate-400">更新时间</div>
                    <div className="whitespace-nowrap text-sm font-medium tabular-nums text-slate-700">
                      {formatHeaderRefreshTime(refreshedAt)}
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
                  disabled={loading || refreshing}
                  aria-label="刷新"
                  className="h-10 w-10 shrink-0 rounded-full border-0 text-slate-400 shadow-none hover:bg-slate-100 hover:text-slate-600"
                >
                  <RefreshCcw
                    className={cn(
                      "h-4 w-4",
                      (loading || refreshing) && "animate-spin",
                    )}
                  />
                  <span className="sr-only">刷新</span>
                </Button>

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
              </div>
            </div>
          </div>
        </header>

        <CreateRemediationPreviewDialog
          agentResolve={agentResolve}
          buildActionInput={(actionCode, node) => actionInputFor(actionCode, node)}
          caseId={currentCaseId}
          expireSeconds={600}
          onCreated={(nextPreview, nextDetail) => {
            setPreview(nextDetail?.preview ?? nextPreview);
            setDetail(nextDetail);
            setExecution(nextDetail?.execution ?? null);
            setBatchesRefreshKey((current) => current + 1);
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

        {/*
            <section className="grid min-h-[720px] gap-5 xl:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[320px_400px_minmax(0,1fr)]">
              <aside className="flex min-h-0 flex-col rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.45)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">
                      处置对象
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      从案件图谱中选择需要处置的目标
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={loading || refreshing}
                    onClick={() => void loadPage(true)}
                    className="rounded-xl border-slate-200"
                  >
                    {refreshing ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <RefreshCcw className="size-4" />
                    )}
                  </Button>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <div className="grid gap-3 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-400">案件</span>
                      <span
                        className="truncate font-mono text-slate-700"
                        title={currentCaseId}
                      >
                        {shortValue(currentCaseId)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-400">工作流</span>
                      <span
                        className="truncate font-mono text-slate-700"
                        title={currentWorkflowId}
                      >
                        {shortValue(currentWorkflowId)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-400">处置阶段</span>
                      <span>
                        {statusBadge(workflow?.status || "responding")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex min-h-0 flex-1 flex-col">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-950">
                        目标列表
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {sourceTypeLabel(sourceType)} ·{" "}
                        {scopeTypeLabel(scopeType)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={
                        !selectedNode || mockMode || working === "resolve-node"
                      }
                      onClick={() => void resolveSelectedNode()}
                      className="rounded-xl border-slate-200"
                    >
                      {working === "resolve-node" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Search className="size-4" />
                      )}
                      解析
                    </Button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {nodes.map((node) => {
                      const Icon = nodeIcon(node.entity_type);
                      const active = node.node_key === selectedNodeKey;
                      return (
                        <button
                          key={node.node_key}
                          type="button"
                          onClick={() => {
                            setSelectedNodeKey(node.node_key);
                            setActionOptions(
                              MOCK_ACTION_OPTIONS.filter((option) => {
                                const entity = node.entity_type.toLowerCase();
                                if (entity.includes("file"))
                                  return option.action_code.startsWith("file.");
                                if (entity.includes("process"))
                                  return option.action_code.startsWith(
                                    "process.",
                                  );
                                if (entity.includes("net"))
                                  return option.action_code.startsWith("net.");
                                return true;
                              }),
                            );
                            const next = MOCK_ACTION_OPTIONS.find((option) => {
                              const entity = node.entity_type.toLowerCase();
                              if (entity.includes("file"))
                                return option.action_code.startsWith("file.");
                              if (entity.includes("process"))
                                return option.action_code.startsWith(
                                  "process.",
                                );
                              if (entity.includes("net"))
                                return option.action_code.startsWith("net.");
                              return true;
                            });
                            setSelectedActionCode(next?.action_code ?? "");
                          }}
                          className={cn(
                            "group w-full rounded-2xl border p-3 text-left transition-colors duration-200",
                            active
                              ? "border-sky-300 bg-sky-50"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 group-hover:bg-white">
                              <Icon className="size-5" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-900">
                                  {entityTypeLabel(node.entity_type)}
                                </span>
                                {statusBadge(node.resolve_status)}
                              </div>
                              <div
                                className="mt-1 truncate text-xs text-slate-500"
                                title={node.display_name}
                              >
                                {node.display_name}
                              </div>
                              <div
                                className="mt-1 truncate font-mono text-[11px] text-slate-400"
                                title={node.description}
                              >
                                {node.description}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </aside>

              <section className="flex min-h-0 flex-col rounded-[18px] border border-slate-200 bg-white shadow-[0_18px_45px_-35px_rgba(15,23,42,0.45)]">
                <div>
                  <div className="px-5 pt-5">
                    <h2 className="text-base font-semibold text-slate-950">
                      处置配置
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      选择动作，生成预览，确认后下发执行
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex min-h-0 flex-1 flex-col divide-y divide-slate-100">
                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          目标解析
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          确认目标所在终端，避免处置下发到错误对象
                        </div>
                      </div>
                      {statusBadge(
                        agentResolve?.status ||
                          selectedNode?.resolve_status ||
                          "pending",
                      )}
                    </div>
                    <div className="mt-4 grid gap-3 text-xs text-slate-600 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <div className="text-slate-400">范围</div>
                        <div className="mt-1 truncate font-mono">
                          {scopeTypeLabel(scopeType)} / {shortValue(scopeId)}
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <div className="text-slate-400">终端</div>
                        <div className="mt-1 truncate font-mono">
                          {(selectedNode?.agent_ids ?? []).join(" / ") || "-"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          动作选择
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          只展示当前目标可执行的处置动作
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={
                          !selectedNode ||
                          mockMode ||
                          working === "query-actions"
                        }
                        onClick={() => void querySelectedNodeActions()}
                        className="rounded-xl border-slate-200 bg-white hover:bg-slate-50"
                      >
                        {working === "query-actions" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Search className="size-4" />
                        )}
                        刷新
                      </Button>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {actionOptions.length > 0 ? (
                        actionOptions.map((option) => {
                          const active =
                            option.action_code === selectedActionCode;
                          return (
                            <button
                              type="button"
                              key={option.action_code}
                              onClick={() =>
                                setSelectedActionCode(option.action_code)
                              }
                              className={cn(
                                "rounded-2xl border px-3 py-3 text-left transition-colors duration-200",
                                active
                                  ? "border-slate-950 bg-slate-950 text-white"
                                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                              )}
                            >
                              <div
                                className={cn(
                                  "text-sm font-medium",
                                  active ? "text-white" : "text-slate-900",
                                )}
                              >
                                {actionOptionLabel(option)}
                              </div>
                              <div
                                className={cn(
                                  "mt-1 truncate text-[11px]",
                                  active ? "text-slate-300" : "text-slate-400",
                                )}
                              >
                                {actionOptionHint(option)}
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <EmptyState
                          icon={Ban}
                          title="当前节点没有可用动作"
                          description="请检查目标类型、终端解析结果，或稍后刷新动作列表"
                        />
                      )}
                    </div>
                  </div>

                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          处置预览
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          确认目标、动作和终端后生成预览
                        </div>
                      </div>
                      {preview
                        ? statusBadge(preview?.preview_status || "created")
                        : statusBadge("pending")}
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <div className="text-[11px] text-slate-400">
                          预览批次
                        </div>
                        <div
                          className="mt-1 truncate font-mono text-xs text-slate-700"
                          title={preview?.preview_id ?? ""}
                        >
                          {shortValue(preview?.preview_id ?? "")}
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <div className="text-[11px] text-slate-400">
                          计划状态
                        </div>
                        <div className="mt-1 text-xs text-emerald-700">
                          {statusLabel(preview?.plan_status ?? "ready")}
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <div className="text-[11px] text-slate-400">目标</div>
                        <div className="mt-1 truncate text-xs text-slate-700">
                          {selectedNode?.agent_ids.length || 0} 终端 ·{" "}
                          {actionLabel(selectedActionCode)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 px-5 py-5 sm:grid-cols-2">
                    <Button
                      type="button"
                      disabled={
                        !canCreatePreview || working === "create-preview"
                      }
                      onClick={() => void handleCreatePreview()}
                      className="h-[72px] justify-between rounded-2xl bg-slate-950 px-5 text-white hover:bg-slate-800"
                    >
                      <span className="flex flex-col items-start">
                        <span className="text-sm font-semibold">生成预览</span>
                        <span className="mt-1 text-[11px] text-slate-300">
                          检查目标后再确认执行
                        </span>
                      </span>
                      {working === "create-preview" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <ArrowRight className="size-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!canConfirm || working === "confirm-preview"}
                      onClick={() => void handleConfirmPreview()}
                      className="h-[72px] justify-between rounded-2xl border-slate-200 bg-white px-5 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      <span className="flex flex-col items-start">
                        <span className="text-sm font-semibold">确认执行</span>
                        <span className="mt-1 text-[11px] text-slate-400">
                          生成执行批次并下发
                        </span>
                      </span>
                      {working === "confirm-preview" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Play className="size-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!canConfirm || working === "cancel-preview"}
                      onClick={() => void handleCancelPreview()}
                      className="h-11 rounded-2xl border-slate-200 bg-white hover:bg-red-50 hover:text-red-700 sm:col-span-2"
                    >
                      {working === "cancel-preview" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Ban className="size-4" />
                      )}
                      取消预览
                    </Button>
                  </div>
                </div>
              </section>

              <RemediationExecutionBatchesPanel
                className="xl:col-span-2 2xl:col-span-1"
                caseId={workflow?.case_id || routeCaseId}
                enabled={!mockMode}
                endTime={endTime}
                fallbackDetail={mockMode ? (detail ?? MOCK_DETAIL) : null}
                fallbackExecution={
                  mockMode ? (execution ?? MOCK_EXECUTION) : null
                }
                fallbackStats={mockMode ? (stats ?? MOCK_STATS) : null}
                onDataChange={handleBatchesDataChange}
                refreshKey={batchesRefreshKey}
                startTime={startTime}
                tenantId={tenantId}
                timezone={RESPONSE_TIMEZONE}
                workflowActionId={action?.workflow_action_id || routeActionId}
                workflowId={workflow?.workflow_id || routeWorkflowId}
              />
            </section>

            <section className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[17px] border border-slate-200 bg-white px-5 py-3 text-xs text-slate-500">
              <span className="font-medium text-slate-600">阶段流转</span>
              <span>发现 -&gt; 调查 -&gt; 取证 -&gt; 处置 -&gt; 关闭</span>
              <span className="font-medium text-slate-600">关闭后只读</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => router.push("/frame/attack/workflow")}
                className="ml-auto rounded-xl text-slate-500 hover:bg-slate-100"
              >
                <Workflow className="size-4" />
                返回工作流
              </Button>
            </section>
        */}
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
