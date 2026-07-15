import type {
  FileEAInput,
  RemediationActionDecision,
  RemediationActionTargetCandidate,
  RemediationActionInput,
  RemediationOrder,
  RemediationOrderDraftItemInput,
  RemediationOrderItem,
} from "@/features/attack/remediation-order";

export type FileEADeleteScopeMode = "" | "named" | "all";

export interface FileEAEditorState {
  mode: FileEADeleteScopeMode;
  eaNamesText: string;
  force: boolean;
}

export interface WmiSubscriptionEditorState {
  targetCandidateId: string;
  removeBindingOnly: boolean;
}

export type RemediationActionDecisionMap = Record<
  string,
  RemediationActionDecision | null
>;

export interface RemediationOrderLifecycleActions {
  cancel: boolean;
  confirm: boolean;
  delete: boolean;
  edit: boolean;
  poll: boolean;
  prepare: boolean;
}

export function remediationOrderLifecycleActions(
  order: RemediationOrder | null,
): RemediationOrderLifecycleActions {
  const status = order?.status.trim().toLowerCase() ?? "";
  return {
    edit: status === "draft",
    delete: status === "draft",
    prepare: status === "draft" || status === "prepared",
    confirm: status === "prepared" && Boolean(order?.confirmable),
    cancel: status === "prepared",
    poll: status === "running",
  };
}

export function remediationActionApplicabilityError(
  decision: RemediationActionDecision | null | undefined,
  agentId: string,
) {
  if (!decision) return "尚未取得当前动作的节点适用性依据。";
  const agentDecision = decision.agent_decisions.find(
    (item) => item.agent_id === agentId,
  );
  if (!agentDecision) return "后台没有返回当前 Agent 的动作适用性判定。";
  if (agentDecision.status !== "unavailable") return "";
  if (
    agentDecision.reason_code.trim().toUpperCase() === "ACTIVE_EFFECT" &&
    !/[\u3400-\u9fff]/.test(agentDecision.reason_message)
  ) {
    return "该 Agent 上已有相关处置正在执行，或上一条处置结果尚未确认，当前不能重复下发。";
  }
  return (
    agentDecision.reason_message ||
    agentDecision.reason_code ||
    "当前动作已不适用于该 Agent。"
  );
}

export function buildRemediationOrderDraftItemsFromInputs(
  order: RemediationOrder,
  actionInputs: Record<string, RemediationActionInput>,
  reverseSourceItemIds: Record<string, string>,
): RemediationOrderDraftItemInput[] {
  return order.items.map((item) => {
    const actionInput = actionInputs[item.item_id] ?? item.action_input ?? {};
    const reverseSourceItemId = Object.prototype.hasOwnProperty.call(
      reverseSourceItemIds,
      item.item_id,
    )
      ? reverseSourceItemIds[item.item_id].trim()
      : item.reverse_source_id.trim();
    return {
      item_id: item.item_id,
      action_code: item.action_code,
      ...(Object.keys(actionInput).length ? { action_input: actionInput } : {}),
      graph_target: {
        node_key: item.node_key,
        agent_id: item.agent_id,
      },
      ...(reverseSourceItemId
        ? { reverse_source_item_id: reverseSourceItemId }
        : {}),
    };
  });
}

export function fileEAEditorFromItem(
  item: RemediationOrderItem,
): FileEAEditorState {
  const input = item.action_input.file_ea;
  return {
    mode: input?.delete_all
      ? "all"
      : Array.isArray(input?.ea_names)
        ? "named"
        : "",
    eaNamesText: input?.ea_names?.join("\n") ?? "",
    force: Boolean(input?.force),
  };
}

export function normalizeFileEANames(value: string) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of value.split(/[\n,]/)) {
    const name = part.trim();
    if (!name) continue;
    const key = name.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(name);
  }
  return result.sort((left, right) =>
    left.localeCompare(right, undefined, { sensitivity: "base" }),
  );
}

export function validateFileEAEditor(editor: FileEAEditorState) {
  if (editor.mode === "all") return "";
  if (editor.mode !== "named") {
    return "请选择按名称删除，或明确确认删除全部 EA。";
  }
  const names = normalizeFileEANames(editor.eaNamesText);
  if (names.length === 0) return "请至少填写一个 EA 名称。";
  if (names.length > 128) return "单个处置项最多允许 128 个 EA 名称。";
  const invalid = names.find(
    (name) =>
      new TextEncoder().encode(name).length > 255 || name.includes("\0"),
  );
  if (invalid) return `EA 名称“${invalid}”为空、过长或包含非法字符。`;
  return "";
}

export function fileEAInputFromEditor(editor: FileEAEditorState): FileEAInput {
  if (editor.mode === "all") {
    return { ...(editor.force ? { force: true } : {}), delete_all: true };
  }
  if (editor.mode === "named") {
    return {
      ...(editor.force ? { force: true } : {}),
      ea_names: normalizeFileEANames(editor.eaNamesText),
    };
  }
  return editor.force ? { force: true } : {};
}

export function actionInputWithFileEAEditor(
  current: RemediationActionInput,
  editor: FileEAEditorState,
): RemediationActionInput {
  return { ...current, file_ea: fileEAInputFromEditor(editor) };
}

export function wmiSubscriptionEditorFromItem(
  item: RemediationOrderItem,
): WmiSubscriptionEditorState {
  const input = item.action_input.wmi_subscription;
  return {
    targetCandidateId: input?.target_candidate_id?.trim() ?? "",
    removeBindingOnly: Boolean(input?.remove_binding_only),
  };
}

export function actionInputWithWmiSubscriptionEditor(
  current: RemediationActionInput,
  editor: WmiSubscriptionEditorState,
): RemediationActionInput {
  return {
    ...current,
    wmi_subscription: {
      ...(editor.targetCandidateId.trim()
        ? { target_candidate_id: editor.targetCandidateId.trim() }
        : {}),
      ...(editor.removeBindingOnly ? { remove_binding_only: true } : {}),
    },
  };
}

export function applicableWmiSubscriptionCandidates(
  decision: RemediationActionDecision | null | undefined,
  agentId: string,
) {
  const normalizedAgent = agentId.trim();
  return (
    decision?.agent_decisions.find(
      (agentDecision) => agentDecision.agent_id === normalizedAgent,
    )?.target_candidates ?? []
  ).filter((candidate) => candidate.candidate_id);
}

export function resolveWmiSubscriptionCandidate(
  editor: WmiSubscriptionEditorState,
  candidates: RemediationActionTargetCandidate[],
) {
  const selectedId = editor.targetCandidateId.trim();
  if (selectedId) {
    return candidates.find(
      (candidate) => candidate.candidate_id === selectedId,
    );
  }
  return candidates.length === 1 ? candidates[0] : undefined;
}

export function validateWmiSubscriptionEditor(
  editor: WmiSubscriptionEditorState,
  decision: RemediationActionDecision | null | undefined,
  agentId: string,
) {
  if (!decision) return "尚未加载该节点的 WMI Subscription 权威目标。";
  const candidates = applicableWmiSubscriptionCandidates(decision, agentId);
  if (candidates.length === 0) {
    return "当前 Agent 没有可执行的 WMI Filter–Binding–Consumer 目标。";
  }
  const selected = resolveWmiSubscriptionCandidate(editor, candidates);
  if (!selected) return "请选择一个具体的 WMI Subscription Binding。";
  if (
    (selected.shared_source || selected.shared_target) &&
    !editor.removeBindingOnly
  ) {
    return "所选 Filter 或 Consumer 被其他订阅共享，只允许移除当前 Binding。";
  }
  return "";
}

export function applicableHistoryContexts(
  decision: RemediationActionDecision | null | undefined,
  agentId: string,
) {
  if (!decision) return [];
  const normalizedAgent = agentId.trim();
  const contexts =
    decision.agent_decisions.find(
      (agentDecision) => agentDecision.agent_id === normalizedAgent,
    )?.reverse_contexts ?? [];
  const seen = new Set<string>();
  return contexts.filter((context) => {
    const sourceItemId = context.source_item_id.trim();
    if (!sourceItemId || seen.has(sourceItemId)) return false;
    seen.add(sourceItemId);
    return true;
  });
}

export function validateHistorySource(
  sourceItemId: string,
  decision: RemediationActionDecision | null | undefined,
  agentId: string,
) {
  if (!decision) return "尚未加载该动作的权威历史来源。";
  const contexts = applicableHistoryContexts(decision, agentId);
  if (contexts.length === 0) return "当前 Agent 没有可用的历史处置来源。";
  if (!sourceItemId.trim()) return "请选择需要回滚的历史处置来源。";
  if (
    !contexts.some((context) => context.source_item_id === sourceItemId.trim())
  ) {
    return "所选历史处置来源已失效，请重新选择。";
  }
  return "";
}

function reverseSourceIdForItem(
  item: RemediationOrderItem,
  reverseSourceItemIds: Record<string, string>,
) {
  return Object.prototype.hasOwnProperty.call(reverseSourceItemIds, item.item_id)
    ? reverseSourceItemIds[item.item_id].trim()
    : item.reverse_source_id.trim();
}

export function buildRemediationOrderDraftItems(
  order: RemediationOrder,
  fileEAEditors: Record<string, FileEAEditorState>,
  wmiSubscriptionEditors: Record<string, WmiSubscriptionEditorState> = {},
  reverseSourceItemIds: Record<string, string> = {},
): RemediationOrderDraftItemInput[] {
  return order.items.map((item) => {
    const editor = fileEAEditors[item.item_id];
    let actionInput = editor
      ? actionInputWithFileEAEditor(item.action_input, editor)
      : item.action_input;
    const wmiEditor = wmiSubscriptionEditors[item.item_id];
    if (wmiEditor) {
      actionInput = actionInputWithWmiSubscriptionEditor(
        actionInput,
        wmiEditor,
      );
    }
    const reverseSourceItemId = reverseSourceIdForItem(
      item,
      reverseSourceItemIds,
    );
    return {
      item_id: item.item_id,
      action_code: item.action_code,
      ...(Object.keys(actionInput).length ? { action_input: actionInput } : {}),
      graph_target: { node_key: item.node_key, agent_id: item.agent_id },
      ...(reverseSourceItemId
        ? { reverse_source_item_id: reverseSourceItemId }
        : {}),
    };
  });
}

export function validateOrderForPrepare(
  order: RemediationOrder,
  fileEAEditors: Record<string, FileEAEditorState>,
  wmiSubscriptionEditors: Record<string, WmiSubscriptionEditorState> = {},
  actionDecisions: RemediationActionDecisionMap = {},
  reverseSourceItemIds: Record<string, string> = {},
) {
  const errors: Record<string, string> = {};
  for (const item of order.items) {
    if (item.action_code === "file_ea.delete") {
      errors[item.item_id] = validateFileEAEditor(
        fileEAEditors[item.item_id] ?? fileEAEditorFromItem(item),
      );
    } else if (item.action_code === "wmi_subscription.delete") {
      errors[item.item_id] = validateWmiSubscriptionEditor(
        wmiSubscriptionEditors[item.item_id] ??
          wmiSubscriptionEditorFromItem(item),
        actionDecisions[item.item_id],
        item.agent_id,
      );
    } else if (
      applicableHistoryContexts(
        actionDecisions[item.item_id],
        item.agent_id,
      ).length > 0 ||
      Boolean(item.reverse_source_id)
    ) {
      errors[item.item_id] = validateHistorySource(
        reverseSourceIdForItem(item, reverseSourceItemIds),
        actionDecisions[item.item_id],
        item.agent_id,
      );
    } else {
      continue;
    }
    if (!errors[item.item_id]) delete errors[item.item_id];
  }
  return errors;
}

export function shouldPollRemediationOrder(order: RemediationOrder | null) {
  return remediationOrderLifecycleActions(order).poll;
}
