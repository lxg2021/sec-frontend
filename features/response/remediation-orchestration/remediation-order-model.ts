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
  locale = "zh-CN",
) {
  const zh = locale.toLowerCase().startsWith("zh");
  if (!decision) {
    return zh
      ? "尚未取得当前动作的节点适用性依据。"
      : "No node-level applicability evidence is available for this action yet.";
  }
  const agentDecision = decision.agent_decisions.find(
    (item) => item.agent_id === agentId,
  );
  if (!agentDecision) {
    return zh
      ? "后台没有返回当前 Agent 的动作适用性判定。"
      : "The backend did not return an action applicability decision for this Agent.";
  }
  if (agentDecision.status !== "unavailable") return "";
  const reasonCode = agentDecision.reason_code.trim().toUpperCase();
  if (reasonCode === "REMEDIATION_RESULT_UNCERTAIN") {
    return zh
      ? "该目标上一条处置的结果尚未确认，确认结果前不能创建新的执行计划。"
      : "The previous remediation result for this target is still uncertain. A new execution plan cannot be created until it is confirmed.";
  }
  if (reasonCode === "REMEDIATION_PARAMETER_CONFLICT") {
    return zh
      ? "该目标已有相同动作使用不同参数执行中，请等待其结束后再准备。"
      : "The same action is already running on this target with different parameters. Wait for it to finish before preparing again.";
  }
  if (reasonCode === "CONFLICTING_ACTION_IN_FLIGHT") {
    return zh
      ? "该目标已有相反或对象级冲突动作执行中，请等待其结束后再操作。"
      : "An opposite or object-level conflicting action is already running on this target. Wait for it to finish before continuing.";
  }
  return (
    (zh
      ? agentDecision.reason_message || agentDecision.reason_code
      : agentDecision.reason_code || agentDecision.reason_message) ||
    (zh
      ? "当前动作已不适用于该 Agent。"
      : "This action is no longer applicable to the Agent.")
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

// An Order retains historical execution Rounds. Editing and preparing always
// operate on the Items belonging to its current Round only.
export function getRemediationOrderCurrentRoundItems(order: RemediationOrder) {
  return order.items.filter((item) => item.round_no === order.current_round);
}

export function getRemediationOrderHistoricalItems(order: RemediationOrder) {
  return order.items.filter((item) => item.round_no !== order.current_round);
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

export function validateFileEAEditor(
  editor: FileEAEditorState,
  locale = "zh-CN",
) {
  const zh = locale.toLowerCase().startsWith("zh");
  if (editor.mode === "all") return "";
  if (editor.mode !== "named") {
    return zh
      ? "请选择按名称删除，或明确确认删除全部 EA。"
      : "Delete EAs by name, or explicitly confirm deletion of all EAs.";
  }
  const names = normalizeFileEANames(editor.eaNamesText);
  if (names.length === 0) {
    return zh ? "请至少填写一个 EA 名称。" : "Enter at least one EA name.";
  }
  if (names.length > 128) {
    return zh
      ? "单个处置项最多允许 128 个 EA 名称。"
      : "A remediation item can contain at most 128 EA names.";
  }
  const invalid = names.find(
    (name) =>
      new TextEncoder().encode(name).length > 255 || name.includes("\0"),
  );
  if (invalid) {
    return zh
      ? `EA 名称“${invalid}”为空、过长或包含非法字符。`
      : `EA name "${invalid}" is empty, too long, or contains invalid characters.`;
  }
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
  locale = "zh-CN",
) {
  const zh = locale.toLowerCase().startsWith("zh");
  if (!decision) {
    return zh
      ? "尚未加载该节点的 WMI Subscription 权威目标。"
      : "The authoritative WMI Subscription target has not been loaded for this node.";
  }
  const candidates = applicableWmiSubscriptionCandidates(decision, agentId);
  if (candidates.length === 0) {
    return zh
      ? "当前 Agent 没有可执行的 WMI Filter–Binding–Consumer 目标。"
      : "This Agent has no executable WMI Filter–Binding–Consumer target.";
  }
  const selected = resolveWmiSubscriptionCandidate(editor, candidates);
  if (!selected) {
    return zh
      ? "请选择一个具体的 WMI Subscription Binding。"
      : "Select a specific WMI Subscription Binding.";
  }
  if (
    (selected.shared_source || selected.shared_target) &&
    !editor.removeBindingOnly
  ) {
    return zh
      ? "所选 Filter 或 Consumer 被其他订阅共享，只允许移除当前 Binding。"
      : "The selected Filter or Consumer is shared by another subscription. Only the current Binding can be removed.";
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
  return Object.prototype.hasOwnProperty.call(
    reverseSourceItemIds,
    item.item_id,
  )
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
      applicableHistoryContexts(actionDecisions[item.item_id], item.agent_id)
        .length > 0 ||
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
