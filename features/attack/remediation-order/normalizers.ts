import type {
  AccountInput,
  FileEAInput,
  FileQuarantineInput,
  ForceInput,
  NetBlockInput,
  ProcessBlockInput,
  ProcessTerminateInput,
  ProtoEnum,
  RegistryInput,
  RemediationActionAgentDecision,
  RemediationActionApplicabilityStatus,
  RemediationActionDescriptor,
  RemediationActionDecision,
  RemediationActionInput,
  RemediationActionTargetCandidate,
  RemediationBackupAvailability,
  RemediationItemExecution,
  RemediationItemList,
  RemediationNodeAction,
  RemediationNodeActionsResult,
  RemediationNodeResolutionStatus,
  RemediationOrder,
  RemediationOrderItem,
  RemediationOrderList,
  RemediationOrderListItem,
  RemediationOrderSummary,
  RemediationSource,
  RemediationSummary,
  RemediationReverseContextOption,
  ResolveRemediationNodeAgentsResult,
  ScheduledTaskInput,
  ServiceInput,
  UInt64,
  WmiClassInput,
  WmiSubscriptionInput,
} from "./types";

type BackendObject = Record<string, unknown>;

function objectValue(value: unknown): BackendObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as BackendObject)
    : {};
}

function hasObject(value: BackendObject, key: string) {
  const candidate = value[key];
  return Boolean(
    candidate && typeof candidate === "object" && !Array.isArray(candidate),
  );
}

function stringValue(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : value == null
      ? ""
      : String(value).trim();
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function boolValue(value: unknown) {
  return value === true || value === 1 || value === "1" || value === "true";
}

function optionalBoolean(value: BackendObject, key: string) {
  return Object.prototype.hasOwnProperty.call(value, key)
    ? boolValue(value[key])
    : undefined;
}

function optionalString(value: BackendObject, key: string) {
  return Object.prototype.hasOwnProperty.call(value, key)
    ? stringValue(value[key])
    : undefined;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map(stringValue).filter(Boolean) : [];
}

function objectArray(value: unknown) {
  return Array.isArray(value) ? value.map(objectValue) : [];
}

function enumValue(value: unknown): ProtoEnum {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : stringValue(value);
}

function applicabilityStatusValue(
  value: unknown,
): RemediationActionApplicabilityStatus {
  const normalized = stringValue(value).toLowerCase();
  if (
    value === 1 ||
    normalized === "1" ||
    normalized === "available" ||
    normalized.endsWith("_available")
  ) {
    return "available";
  }
  if (
    value === 2 ||
    normalized === "2" ||
    normalized === "requires_configuration" ||
    normalized.endsWith("_requires_configuration")
  ) {
    return "requires_configuration";
  }
  if (
    value === 3 ||
    normalized === "3" ||
    normalized === "unavailable" ||
    normalized.endsWith("_unavailable")
  ) {
    return "unavailable";
  }
  return "unspecified";
}

function nodeResolutionStatusValue(
  value: unknown,
): RemediationNodeResolutionStatus {
  const normalized = stringValue(value).toLowerCase();
  if (
    value === 1 ||
    normalized === "1" ||
    normalized === "resolved" ||
    normalized.endsWith("_resolved")
  ) {
    return "resolved";
  }
  if (
    value === 2 ||
    normalized === "2" ||
    normalized === "unavailable" ||
    normalized.endsWith("_unavailable")
  ) {
    return "unavailable";
  }
  return "unspecified";
}

function uint64Value(value: unknown): UInt64 {
  if (typeof value === "bigint") {
    return value >= BigInt(0) ? value.toString() : "0";
  }
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value >= 0 ? String(value) : "0";
  }
  const normalized = stringValue(value);
  return /^\d+$/.test(normalized) ? normalized.replace(/^0+(?=\d)/, "") : "0";
}

function compactOptional<T extends BackendObject>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, field]) => field !== undefined),
  ) as T;
}

export function normalizeRemediationSource(raw: unknown): RemediationSource {
  const source = objectValue(raw);
  return {
    source_type: enumValue(source.source_type),
    source_ref_id: stringValue(source.source_ref_id),
    case_id: stringValue(source.case_id),
    workflow_id: stringValue(source.workflow_id),
  };
}

export function normalizeResolveRemediationNodeAgents(
  raw: unknown,
): ResolveRemediationNodeAgentsResult {
  const result = objectValue(raw);
  return {
    request_id: stringValue(result.request_id),
    tenant_id: stringValue(result.tenant_id),
    scope_type: stringValue(result.scope_type),
    scope_id: stringValue(result.scope_id),
    node_key: stringValue(result.node_key),
    entity_type: stringValue(result.entity_type),
    status: stringValue(result.status),
    agent_ids: stringArray(result.agent_ids),
    resolve_source: stringValue(result.resolve_source),
    message: stringValue(result.message),
  };
}

export function normalizeRemediationReverseContextOption(
  raw: unknown,
): RemediationReverseContextOption {
  const context = objectValue(raw);
  return {
    source_item_id: stringValue(context.source_item_id),
    source_action_code: stringValue(context.source_action_code),
  };
}

export function normalizeRemediationActionInput(
  raw: unknown,
): RemediationActionInput {
  const input = objectValue(raw);
  const result: RemediationActionInput = {};

  if (hasObject(input, "file_quarantine")) {
    const value = objectValue(input.file_quarantine);
    result.file_quarantine = compactOptional<
      FileQuarantineInput & BackendObject
    >({
      delete_original: optionalBoolean(value, "delete_original"),
      storage: optionalString(value, "storage"),
      encrypt: optionalBoolean(value, "encrypt"),
      suffix: optionalString(value, "suffix"),
    });
  }
  if (hasObject(input, "process_terminate")) {
    const value = objectValue(input.process_terminate);
    result.process_terminate = compactOptional<
      ProcessTerminateInput & BackendObject
    >({
      include_self: optionalBoolean(value, "include_self"),
      include_children: optionalBoolean(value, "include_children"),
    });
  }
  if (hasObject(input, "process_block")) {
    const value = objectValue(input.process_block);
    result.process_block = compactOptional<ProcessBlockInput & BackendObject>({
      subject_path: optionalString(value, "subject_path"),
      subject_hash: optionalString(value, "subject_hash"),
      object_path: optionalString(value, "object_path"),
      object_hash: optionalString(value, "object_hash"),
      except_path: optionalString(value, "except_path"),
      except_hash: optionalString(value, "except_hash"),
      audit: optionalBoolean(value, "audit"),
    });
  }
  if (hasObject(input, "net_block")) {
    const value = objectValue(input.net_block);
    result.net_block = compactOptional<NetBlockInput & BackendObject>({
      direction: optionalString(value, "direction"),
    });
  }
  if (hasObject(input, "scheduled_task")) {
    const value = objectValue(input.scheduled_task);
    result.scheduled_task = compactOptional<ScheduledTaskInput & BackendObject>(
      {
        force: optionalBoolean(value, "force"),
      },
    );
  }
  if (hasObject(input, "service")) {
    const value = objectValue(input.service);
    result.service = compactOptional<ServiceInput & BackendObject>({
      stop_before_delete: optionalBoolean(value, "stop_before_delete"),
    });
  }
  if (hasObject(input, "account")) {
    const value = objectValue(input.account);
    result.account = compactOptional<AccountInput & BackendObject>({
      force_logoff: optionalBoolean(value, "force_logoff"),
      new_password: optionalString(value, "new_password"),
      force_change_at_next_logon: optionalBoolean(
        value,
        "force_change_at_next_logon",
      ),
      unlock_account: optionalBoolean(value, "unlock_account"),
    });
  }
  if (hasObject(input, "registry")) {
    const value = objectValue(input.registry);
    result.registry = compactOptional<RegistryInput & BackendObject>({
      recursive: optionalBoolean(value, "recursive"),
      stop_on_failure: optionalBoolean(value, "stop_on_failure"),
    });
  }
  if (hasObject(input, "wmi_class")) {
    const value = objectValue(input.wmi_class);
    result.wmi_class = compactOptional<WmiClassInput & BackendObject>({
      delete_instances: optionalBoolean(value, "delete_instances"),
      recursive_delete: optionalBoolean(value, "recursive_delete"),
    });
  }
  if (hasObject(input, "wmi_subscription")) {
    const value = objectValue(input.wmi_subscription);
    result.wmi_subscription = compactOptional<
      WmiSubscriptionInput & BackendObject
    >({
      remove_binding_only: optionalBoolean(value, "remove_binding_only"),
      target_candidate_id: optionalString(value, "target_candidate_id"),
    });
  }
  for (const key of ["bits_job", "ntfs_ads"] as const) {
    if (!hasObject(input, key)) continue;
    const value = objectValue(input[key]);
    result[key] = compactOptional<ForceInput & BackendObject>({
      force: optionalBoolean(value, "force"),
    });
  }
  if (hasObject(input, "file_ea")) {
    const value = objectValue(input.file_ea);
    result.file_ea = compactOptional<FileEAInput & BackendObject>({
      force: optionalBoolean(value, "force"),
      ea_names: Object.prototype.hasOwnProperty.call(value, "ea_names")
        ? stringArray(value.ea_names)
        : undefined,
      delete_all: optionalBoolean(value, "delete_all"),
    });
  }
  return result;
}

export function normalizeRemediationActionDescriptor(
  raw: unknown,
): RemediationActionDescriptor {
  const option = objectValue(raw);
  return {
    action_code: stringValue(option.action_code),
    display_name: stringValue(option.display_name),
    risk_level: stringValue(option.risk_level),
    reversible: boolValue(option.reversible),
  };
}

export function normalizeRemediationActionAgentDecision(
  raw: unknown,
): RemediationActionAgentDecision {
  const decision = objectValue(raw);
  return {
    agent_id: stringValue(decision.agent_id),
    status: applicabilityStatusValue(decision.status),
    reason_code: stringValue(decision.reason_code),
    reason_message: stringValue(decision.reason_message),
    required_input_fields: stringArray(decision.required_input_fields),
    reverse_contexts: objectArray(decision.reverse_contexts).map(
      normalizeRemediationReverseContextOption,
    ),
    target_candidates: objectArray(decision.target_candidates).map(
      normalizeRemediationActionTargetCandidate,
    ),
  };
}

export function normalizeRemediationActionTargetCandidate(
  raw: unknown,
): RemediationActionTargetCandidate {
  const candidate = objectValue(raw);
  return {
    candidate_id: stringValue(candidate.candidate_id),
    target_type: stringValue(candidate.target_type),
    display_name: stringValue(candidate.display_name),
    shared_source: boolValue(candidate.shared_source),
    shared_target: boolValue(candidate.shared_target),
    source_binding_count: numberValue(candidate.source_binding_count),
    target_binding_count: numberValue(candidate.target_binding_count),
  };
}

export function normalizeRemediationActionDecision(
  raw: unknown,
): RemediationActionDecision {
  const decision = objectValue(raw);
  return {
    action: normalizeRemediationActionDescriptor(decision.action),
    agent_decisions: objectArray(decision.agent_decisions).map(
      normalizeRemediationActionAgentDecision,
    ),
  };
}

export function normalizeRemediationNodeAction(
  raw: unknown,
): RemediationNodeAction {
  const node = objectValue(raw);
  return {
    node_key: stringValue(node.node_key),
    entity_type: stringValue(node.entity_type),
    resolution_status: nodeResolutionStatusValue(node.resolution_status),
    reason_code: stringValue(node.reason_code),
    reason_message: stringValue(node.reason_message),
    actions: objectArray(node.actions).map(normalizeRemediationActionDecision),
  };
}

export function normalizeRemediationNodeActionsResult(
  raw: unknown,
): RemediationNodeActionsResult {
  const result = objectValue(raw);
  return {
    tenant_id: stringValue(result.tenant_id),
    source_type: stringValue(result.source_type),
    scope_type: stringValue(result.scope_type),
    scope_id: stringValue(result.scope_id),
    node: normalizeRemediationNodeAction(result.node),
  };
}

export function normalizeRemediationItemExecution(
  raw: unknown,
): RemediationItemExecution | null {
  const execution = objectValue(raw);
  if (Object.keys(execution).length === 0) return null;
  return {
    operation_id: stringValue(execution.operation_id),
    operation: stringValue(execution.operation),
    operation_status: stringValue(execution.operation_status),
    operation_outcome: stringValue(execution.operation_outcome),
    operation_result_version: numberValue(execution.operation_result_version),
    total_count: numberValue(execution.total_count),
    pending_count: numberValue(execution.pending_count),
    running_count: numberValue(execution.running_count),
    success_count: numberValue(execution.success_count),
    failed_count: numberValue(execution.failed_count),
    uncertain_count: numberValue(execution.uncertain_count),
    skipped_count: numberValue(execution.skipped_count),
    canceled_count: numberValue(execution.canceled_count),
    dispatch_id: stringValue(execution.dispatch_id),
    publish_status: stringValue(execution.publish_status),
    publish_attempt_count: numberValue(execution.publish_attempt_count),
    publish_acceptance_unknown: boolValue(execution.publish_acceptance_unknown),
    execution_status: stringValue(execution.execution_status),
    failure_certainty: stringValue(execution.failure_certainty),
    reason_code: stringValue(execution.reason_code),
    reason_message: stringValue(execution.reason_message),
    error_code: stringValue(execution.error_code),
    error_message: stringValue(execution.error_message),
    dispatch_result_version: numberValue(execution.dispatch_result_version),
    report_deadline_at: stringValue(execution.report_deadline_at),
    first_publish_attempt_at: stringValue(execution.first_publish_attempt_at),
    published_at: stringValue(execution.published_at),
    started_at: stringValue(execution.started_at),
    last_report_at: stringValue(execution.last_report_at),
    finished_at: stringValue(execution.finished_at),
    created_at: stringValue(execution.created_at),
    updated_at: stringValue(execution.updated_at),
    completed_at: stringValue(execution.completed_at),
  };
}

export function normalizeRemediationBackupAvailability(
  raw: unknown,
): RemediationBackupAvailability | null {
  const backup = objectValue(raw);
  if (Object.keys(backup).length === 0) return null;
  return {
    backup_id: stringValue(backup.backup_id),
    source_item_id: stringValue(backup.source_item_id),
    resource_type: stringValue(backup.resource_type),
    resource_state: stringValue(backup.resource_state),
    available: boolValue(backup.available),
    unavailable_reason_code: stringValue(backup.unavailable_reason_code),
    created_at: stringValue(backup.created_at),
    updated_at: stringValue(backup.updated_at),
    last_verified_at: stringValue(backup.last_verified_at),
    expires_at: stringValue(backup.expires_at),
  };
}

export function normalizeRemediationOrderItem(
  raw: unknown,
): RemediationOrderItem {
  const item = objectValue(raw);
  return {
    item_id: stringValue(item.item_id),
    position: numberValue(item.position),
    node_key: stringValue(item.node_key),
    entity_type: stringValue(item.entity_type),
    display_name: stringValue(item.display_name),
    graph_origin: stringValue(item.graph_origin),
    agent_id: stringValue(item.agent_id),
    action_code: stringValue(item.action_code),
    action_input: normalizeRemediationActionInput(item.action_input),
    reverse_source_type: stringValue(item.reverse_source_type),
    reverse_source_id: stringValue(item.reverse_source_id),
    status: stringValue(item.status),
    reason_code: stringValue(item.reason_code),
    reason_message: stringValue(item.reason_message),
    risk_level: stringValue(item.risk_level),
    catalog_version: stringValue(item.catalog_version),
    executor_kind: stringValue(item.executor_kind),
    result_authority: stringValue(item.result_authority),
    retry_safety: stringValue(item.retry_safety),
    effect_group: stringValue(item.effect_group),
    execution_timeout_seconds: numberValue(item.execution_timeout_seconds),
    created_at: stringValue(item.created_at),
    updated_at: stringValue(item.updated_at),
    object_type: numberValue(item.object_type),
    object_id: stringValue(item.object_id),
    object_version: stringValue(item.object_version),
    capability_profile: stringValue(item.capability_profile),
    capability_contract_version: numberValue(item.capability_contract_version),
    capability_fingerprint: stringValue(item.capability_fingerprint),
    resolved_operation: stringValue(item.resolved_operation),
    catalog_delete_mode: stringValue(item.catalog_delete_mode),
    operation_id: stringValue(item.operation_id),
    dispatch_id: stringValue(item.dispatch_id),
    error_code: stringValue(item.error_code),
    error_message: stringValue(item.error_message),
    result_version: numberValue(item.result_version),
    uncertainty_since_at: stringValue(item.uncertainty_since_at),
    finished_at: stringValue(item.finished_at),
    execution: normalizeRemediationItemExecution(item.execution),
    backup: normalizeRemediationBackupAvailability(item.backup),
    order_id: stringValue(item.order_id),
  };
}

export function normalizeRemediationOrderSummary(
  raw: unknown,
): RemediationOrderSummary {
  const summary = objectValue(raw);
  return {
    total: numberValue(summary.total),
    draft: numberValue(summary.draft),
    ready: numberValue(summary.ready),
    satisfied: numberValue(summary.satisfied),
    blocked: numberValue(summary.blocked),
    pending: numberValue(summary.pending),
    running: numberValue(summary.running),
    success: numberValue(summary.success),
    failed: numberValue(summary.failed),
    skipped: numberValue(summary.skipped),
    uncertain: numberValue(summary.uncertain),
  };
}

export function normalizeRemediationOrder(raw: unknown): RemediationOrder {
  const order = objectValue(raw);
  return {
    tenant_id: stringValue(order.tenant_id),
    order_id: stringValue(order.order_id),
    source: normalizeRemediationSource(order.source),
    title: stringValue(order.title),
    status: stringValue(order.status),
    outcome: stringValue(order.outcome),
    revision: uint64Value(order.revision),
    prepared_fingerprint_version: stringValue(
      order.prepared_fingerprint_version,
    ),
    prepared_fingerprint: stringValue(order.prepared_fingerprint),
    prepared_at: stringValue(order.prepared_at),
    prepared_expires_at: stringValue(order.prepared_expires_at),
    confirmable: boolValue(order.confirmable),
    summary: normalizeRemediationOrderSummary(order.summary),
    items: objectArray(order.items).map(normalizeRemediationOrderItem),
    created_by: stringValue(order.created_by),
    updated_by: stringValue(order.updated_by),
    canceled_by: stringValue(order.canceled_by),
    cancel_reason: stringValue(order.cancel_reason),
    created_at: stringValue(order.created_at),
    updated_at: stringValue(order.updated_at),
    canceled_at: stringValue(order.canceled_at),
    expires_at: stringValue(order.expires_at),
  };
}

export function normalizeRemediationOrderListItem(
  raw: unknown,
): RemediationOrderListItem {
  const item = objectValue(raw);
  return {
    order_id: stringValue(item.order_id),
    source: normalizeRemediationSource(item.source),
    title: stringValue(item.title),
    status: stringValue(item.status),
    outcome: stringValue(item.outcome),
    revision: uint64Value(item.revision),
    confirmable: boolValue(item.confirmable),
    summary: normalizeRemediationOrderSummary(item.summary),
    created_by: stringValue(item.created_by),
    created_at: stringValue(item.created_at),
    updated_at: stringValue(item.updated_at),
  };
}

export function normalizeRemediationOrderList(
  raw: unknown,
): RemediationOrderList {
  const list = objectValue(raw);
  return {
    items: objectArray(list.items).map(normalizeRemediationOrderListItem),
    total: uint64Value(list.total),
    page: numberValue(list.page),
    page_size: numberValue(list.page_size),
  };
}

export function normalizeRemediationItemList(
  raw: unknown,
): RemediationItemList {
  const list = objectValue(raw);
  return {
    items: objectArray(list.items).map(normalizeRemediationOrderItem),
    total: uint64Value(list.total),
    page: numberValue(list.page),
    page_size: numberValue(list.page_size),
  };
}

export function normalizeRemediationSummary(raw: unknown): RemediationSummary {
  const summary = objectValue(raw);
  return {
    order_count: uint64Value(summary.order_count),
    item_count: uint64Value(summary.item_count),
    running_count: uint64Value(summary.running_count),
    success_count: uint64Value(summary.success_count),
    failed_count: uint64Value(summary.failed_count),
    uncertain_count: uint64Value(summary.uncertain_count),
  };
}
