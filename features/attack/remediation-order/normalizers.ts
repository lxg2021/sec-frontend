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
  RemediationCurrentEffectState,
  RemediationHostActionList,
  RemediationHostList,
  RemediationActionDescriptor,
  RemediationActionDecision,
  RemediationActionInput,
  RemediationActionTargetCandidate,
  RemediationAgentSnapshot,
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
  RemediationOrderReference,
  RemediationOrderSummary,
  RemediationOverviewSummary,
  RemediationDraftItemUpsertDisposition,
  RemediationDraftItemUpsertResult,
  RemediationDraftItemsUpsertData,
  RemediationPrepareDisposition,
  RemediationSource,
  RemediationSummary,
  RemediationTargetSnapshot,
  RemediationTargetSnapshotSource,
  RemediationTargetSnapshotStatus,
  RemediationScheduledTargetKind,
  RemediationRegistryTargetKind,
  RemediationNetworkTargetKind,
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

function currentEffectStateValue(
  value: unknown,
): RemediationCurrentEffectState {
  const normalized = stringValue(value).toLowerCase();
  if (value === 1 || normalized === "1" || normalized === "none" || normalized.endsWith("_none")) {
    return "none";
  }
  if (value === 2 || normalized === "2" || normalized === "satisfied" || normalized.endsWith("_satisfied")) {
    return "satisfied";
  }
  if (value === 3 || normalized === "3" || normalized === "same_action_in_flight" || normalized.endsWith("_same_action_in_flight")) {
    return "same_action_in_flight";
  }
  if (value === 4 || normalized === "4" || normalized === "conflicting_action_in_flight" || normalized.endsWith("_conflicting_action_in_flight")) {
    return "conflicting_action_in_flight";
  }
  if (value === 5 || normalized === "5" || normalized === "uncertain" || normalized.endsWith("_uncertain")) {
    return "uncertain";
  }
  return "unspecified";
}

function prepareDispositionValue(
  value: unknown,
): RemediationPrepareDisposition {
  const normalized = stringValue(value).toLowerCase();
  if (value === 1 || normalized === "1" || normalized === "execute" || normalized.endsWith("_execute")) {
    return "execute";
  }
  if (value === 2 || normalized === "2" || normalized === "skip_satisfied" || normalized.endsWith("_skip_satisfied")) {
    return "skip_satisfied";
  }
  if (value === 3 || normalized === "3" || normalized === "wait_existing" || normalized.endsWith("_wait_existing")) {
    return "wait_existing";
  }
  if (value === 4 || normalized === "4" || normalized === "block" || normalized.endsWith("_block")) {
    return "block";
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

function targetSnapshotStatusValue(
  value: unknown,
): RemediationTargetSnapshotStatus {
  const normalized = stringValue(value).toLowerCase();
  if (value === 1 || normalized === "1" || normalized === "available" || normalized.endsWith("_available")) {
    return "available";
  }
  if (value === 2 || normalized === "2" || normalized === "unavailable" || normalized.endsWith("_unavailable")) {
    return "unavailable";
  }
  return "unspecified";
}

function targetSnapshotSourceValue(
  value: unknown,
): RemediationTargetSnapshotSource {
  const normalized = stringValue(value).toLowerCase();
  if (value === 1 || normalized === "1" || normalized === "graph_current" || normalized.endsWith("_graph_current")) {
    return "graph_current";
  }
  if (value === 2 || normalized === "2" || normalized === "prepared_frozen" || normalized.endsWith("_prepared_frozen")) {
    return "prepared_frozen";
  }
  if (value === 3 || normalized === "3" || normalized === "history_frozen" || normalized.endsWith("_history_frozen")) {
    return "history_frozen";
  }
  return "unspecified";
}

function scheduledTargetKindValue(value: unknown): RemediationScheduledTargetKind {
  const normalized = stringValue(value).toLowerCase();
  if (value === 1 || normalized === "1" || normalized === "task" || normalized.endsWith("_task")) return "task";
  if (value === 2 || normalized === "2" || normalized === "job" || normalized.endsWith("_job")) return "job";
  return "unspecified";
}

function registryTargetKindValue(value: unknown): RemediationRegistryTargetKind {
  const normalized = stringValue(value).toLowerCase();
  if (value === 1 || normalized === "1" || normalized === "key" || normalized.endsWith("_key")) return "key";
  if (value === 2 || normalized === "2" || normalized === "value" || normalized.endsWith("_value")) return "value";
  return "unspecified";
}

function networkTargetKindValue(value: unknown): RemediationNetworkTargetKind {
  const normalized = stringValue(value).toLowerCase();
  if (value === 1 || normalized === "1" || normalized === "ip_address" || normalized.endsWith("_ip_address")) return "ip_address";
  if (value === 2 || normalized === "2" || normalized === "endpoint" || normalized.endsWith("_endpoint")) return "endpoint";
  if (value === 3 || normalized === "3" || normalized === "domain" || normalized.endsWith("_domain")) return "domain";
  if (value === 4 || normalized === "4" || normalized === "url" || normalized.endsWith("_url")) return "url";
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
      force: optionalBoolean(value, "force"),
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
    current_effect_state: currentEffectStateValue(decision.current_effect_state),
    prepare_disposition: prepareDispositionValue(decision.prepare_disposition),
    draft_selectable: boolValue(decision.draft_selectable),
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
    path_pairs: objectArray(backup.path_pairs).map((pair) => ({
      source_path: stringValue(pair.source_path),
      backup_path: stringValue(pair.backup_path),
      original_md5: stringValue(pair.original_md5),
    })),
  };
}

export function normalizeRemediationAgentSnapshot(
  raw: unknown,
): RemediationAgentSnapshot | null {
  const snapshot = objectValue(raw);
  if (Object.keys(snapshot).length === 0) return null;
  return {
    agent_id: stringValue(snapshot.agent_id),
    host_name: stringValue(snapshot.host_name),
    primary_ip: stringValue(snapshot.primary_ip),
    ip_addresses: stringArray(snapshot.ip_addresses),
    mac_addresses: stringArray(snapshot.mac_addresses),
    observed_at: stringValue(snapshot.observed_at),
    connectivity_status: normalizedConnectivityStatus(snapshot.connectivity_status),
  };
}

function normalizedConnectivityStatus(
  raw: unknown,
): RemediationAgentSnapshot["connectivity_status"] {
  const status = stringValue(raw).toLowerCase();
  return status === "online" || status === "offline" ? status : "unknown";
}

function emptyRemediationAgentSnapshot(): RemediationAgentSnapshot {
  return {
    agent_id: "",
    host_name: "",
    primary_ip: "",
    ip_addresses: [],
    mac_addresses: [],
    observed_at: "",
    connectivity_status: "unknown",
  };
}

export function normalizeRemediationTargetSnapshot(
  raw: unknown,
): RemediationTargetSnapshot | null {
  const snapshot = objectValue(raw);
  if (Object.keys(snapshot).length === 0) return null;

  const process = objectValue(snapshot.process);
  const file = objectValue(snapshot.file);
  const scheduledTask = objectValue(snapshot.scheduled_task);
  const service = objectValue(snapshot.service);
  const account = objectValue(snapshot.account);
  const registry = objectValue(snapshot.registry);
  const wmiClass = objectValue(snapshot.wmi_class);
  const wmiSubscription = objectValue(snapshot.wmi_subscription);
  const bitsJob = objectValue(snapshot.bits_job);
  const network = objectValue(snapshot.network);

  return {
    status: targetSnapshotStatusValue(snapshot.status),
    source: targetSnapshotSourceValue(snapshot.source),
    reason_code: stringValue(snapshot.reason_code),
    reason_message: stringValue(snapshot.reason_message),
    canonical_node_key: stringValue(snapshot.canonical_node_key),
    observed_at: stringValue(snapshot.observed_at),
    process: hasObject(snapshot, "process")
      ? {
          process_guid: stringValue(process.process_guid),
          pid: numberValue(process.pid),
          process_name: stringValue(process.process_name),
          process_path: stringValue(process.process_path),
          process_hash: stringValue(process.process_hash),
          command_line: stringValue(process.command_line),
        }
      : null,
    file: hasObject(snapshot, "file")
      ? {
          file_path: stringValue(file.file_path),
          file_hash: stringValue(file.file_hash),
          file_type: stringValue(file.file_type),
          signature: stringValue(file.signature),
          signer: stringValue(file.signer),
          observed_ea_names: stringArray(file.observed_ea_names),
          stream_name: stringValue(file.stream_name),
        }
      : null,
    scheduled_task: hasObject(snapshot, "scheduled_task")
      ? {
          kind: scheduledTargetKindValue(scheduledTask.kind),
          task_name: stringValue(scheduledTask.task_name),
          task_path: stringValue(scheduledTask.task_path),
          job_id: stringValue(scheduledTask.job_id),
          command: stringValue(scheduledTask.command),
          binary_path: stringValue(scheduledTask.binary_path),
          binary_hash: stringValue(scheduledTask.binary_hash),
          run_as: stringValue(scheduledTask.run_as),
          state: stringValue(scheduledTask.state),
        }
      : null,
    service: hasObject(snapshot, "service")
      ? {
          service_name: stringValue(service.service_name),
          display_name: stringValue(service.display_name),
          binary_path: stringValue(service.binary_path),
          binary_hash: stringValue(service.binary_hash),
          start_account: stringValue(service.start_account),
          state: stringValue(service.state),
        }
      : null,
    account: hasObject(snapshot, "account")
      ? compactOptional({
          account_name: stringValue(account.account_name),
          domain: stringValue(account.domain),
          sid: stringValue(account.sid),
          enabled: optionalBoolean(account, "enabled"),
          locked: optionalBoolean(account, "locked"),
        })
      : null,
    registry: hasObject(snapshot, "registry")
      ? compactOptional({
          kind: registryTargetKindValue(registry.kind),
          hive: stringValue(registry.hive),
          user_sid: stringValue(registry.user_sid),
          key_path: stringValue(registry.key_path),
          value_name: stringValue(registry.value_name),
          present: optionalBoolean(registry, "present"),
        })
      : null,
    wmi_class: hasObject(snapshot, "wmi_class")
      ? {
          namespace: stringValue(wmiClass.namespace),
          class_name: stringValue(wmiClass.class_name),
          class_path: stringValue(wmiClass.class_path),
          server_name: stringValue(wmiClass.server_name),
        }
      : null,
    wmi_subscription: hasObject(snapshot, "wmi_subscription")
      ? {
          candidate_id: stringValue(wmiSubscription.candidate_id),
          namespace: stringValue(wmiSubscription.namespace),
          filter_name: stringValue(wmiSubscription.filter_name),
          consumer_name: stringValue(wmiSubscription.consumer_name),
          consumer_type: stringValue(wmiSubscription.consumer_type),
          shared_filter: boolValue(wmiSubscription.shared_filter),
          shared_consumer: boolValue(wmiSubscription.shared_consumer),
          filter_binding_count: numberValue(
            wmiSubscription.filter_binding_count,
          ),
          consumer_binding_count: numberValue(
            wmiSubscription.consumer_binding_count,
          ),
        }
      : null,
    bits_job: hasObject(snapshot, "bits_job")
      ? {
          job_id: stringValue(bitsJob.job_id),
          job_name: stringValue(bitsJob.job_name),
          job_type: stringValue(bitsJob.job_type),
          job_status: stringValue(bitsJob.job_status),
          remote_url: stringValue(bitsJob.remote_url),
          local_files: stringArray(bitsJob.local_files),
        }
      : null,
    network: hasObject(snapshot, "network")
      ? compactOptional({
          kind: networkTargetKindValue(network.kind),
          ip: stringValue(network.ip),
          port: numberValue(network.port),
          protocol: stringValue(network.protocol),
          is_ipv6: optionalBoolean(network, "is_ipv6"),
          domain: stringValue(network.domain),
          url: stringValue(network.url),
        })
      : null,
  };
}

export function normalizeRemediationOrderItem(
  raw: unknown,
): RemediationOrderItem {
  const item = objectValue(raw);
  return {
    item_id: stringValue(item.item_id),
    round_no: numberValue(item.round_no),
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
    target_snapshot: normalizeRemediationTargetSnapshot(item.target_snapshot),
    agent_snapshot: normalizeRemediationAgentSnapshot(item.agent_snapshot),
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
    current_round: numberValue(order.current_round),
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

function draftItemUpsertDispositionValue(value: unknown): RemediationDraftItemUpsertDisposition {
  const normalized = stringValue(value).toLowerCase();
  if (value === 1 || normalized === "1" || normalized === "created" || normalized.endsWith("_created")) return "created";
  if (value === 2 || normalized === "2" || normalized === "updated" || normalized.endsWith("_updated")) return "updated";
  if (value === 3 || normalized === "3" || normalized === "already_present" || normalized.endsWith("_already_present")) return "already_present";
  if (value === 4 || normalized === "4" || normalized === "already_satisfied" || normalized.endsWith("_already_satisfied")) return "already_satisfied";
  if (value === 5 || normalized === "5" || normalized === "in_flight" || normalized.endsWith("_in_flight")) return "in_flight";
  return "unspecified";
}

export function normalizeRemediationDraftItemsUpsertData(raw: unknown): RemediationDraftItemsUpsertData {
  const data = objectValue(raw);
  return {
    order: normalizeRemediationOrder(data.order),
    item_results: objectArray(data.item_results).map((result): RemediationDraftItemUpsertResult => ({
      input_index: numberValue(result.input_index),
      item_id: stringValue(result.item_id),
      round_no: numberValue(result.round_no),
      disposition: draftItemUpsertDispositionValue(result.disposition),
      reason_code: stringValue(result.reason_code),
      reason_message: stringValue(result.reason_message),
    })),
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

export function normalizeRemediationOrderReference(
  raw: unknown,
): RemediationOrderReference {
  const order = objectValue(raw);
  return {
    order_id: stringValue(order.order_id),
    title: stringValue(order.title),
    source: normalizeRemediationSource(order.source),
  };
}

export function normalizeRemediationHostActionList(
  raw: unknown,
): RemediationHostActionList {
  const list = objectValue(raw);
  const host = normalizeRemediationAgentSnapshot(list.host) ?? emptyRemediationAgentSnapshot();
  return {
    host,
    items: objectArray(list.items).map((rawItem) => {
      const value = objectValue(rawItem);
      const order = normalizeRemediationOrderReference(value.order);
      const item = normalizeRemediationOrderItem(value.item);
      if (!item.order_id) item.order_id = order.order_id;
      return { order, item };
    }),
    total: uint64Value(list.total),
    page: numberValue(list.page),
    page_size: numberValue(list.page_size),
  };
}

export function normalizeRemediationHostList(raw: unknown): RemediationHostList {
  const list = objectValue(raw);
  return {
    items: objectArray(list.items).map((rawItem) => {
      const item = objectValue(rawItem);
      return {
        agent_snapshot:
          normalizeRemediationAgentSnapshot(item.agent_snapshot) ??
          emptyRemediationAgentSnapshot(),
        remediation_item_count: uint64Value(item.remediation_item_count),
        last_activity_at: stringValue(item.last_activity_at),
      };
    }),
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

export function normalizeRemediationOverviewSummary(
  raw: unknown,
): RemediationOverviewSummary {
  const summary = objectValue(raw);
  const totals = objectValue(summary.totals);

  return {
    totals: {
      order_count: uint64Value(totals.order_count),
      host_count: uint64Value(totals.host_count),
      active_order_count: uint64Value(totals.active_order_count),
      attention_order_count: uint64Value(totals.attention_order_count),
      item_count: uint64Value(totals.item_count),
      last_activity_at: stringValue(totals.last_activity_at),
    },
    order_statuses: objectArray(summary.order_statuses).map((bucket) => ({
      status: stringValue(bucket.status).toLowerCase(),
      count: uint64Value(bucket.count),
    })),
    sources: objectArray(summary.sources).map((bucket) => ({
      source_type: enumValue(bucket.source_type),
      order_count: uint64Value(bucket.order_count),
    })),
    actions: objectArray(summary.actions).map((bucket) => ({
      action_code: stringValue(bucket.action_code).toLowerCase(),
      item_count: uint64Value(bucket.item_count),
    })),
    trend: objectArray(summary.trend).map((point) => ({
      bucket_start_at: stringValue(point.bucket_start_at),
      terminal_item_count: uint64Value(point.terminal_item_count),
      success_count: uint64Value(point.success_count),
      failed_count: uint64Value(point.failed_count),
      uncertain_count: uint64Value(point.uncertain_count),
    })),
  };
}
