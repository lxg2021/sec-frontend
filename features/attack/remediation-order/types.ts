export type ProtoEnum = number | string;
export type UInt64 = string;
export type UInt64Input = number | string;

export enum RemediationSourceType {
  Unspecified = 0,
  CaseGraph = 1,
  DrillGraph = 2,
  LocateGraph = 3,
}

export interface RemediationSource {
  source_type: ProtoEnum;
  source_ref_id: string;
  case_id: string;
  workflow_id: string;
}

export interface RemediationReverseContextOption {
  source_item_id: string;
  source_action_code: string;
}

export interface FileQuarantineInput {
  delete_original?: boolean;
  storage?: string;
  encrypt?: boolean;
  suffix?: string;
}

export interface ProcessTerminateInput {
  include_self?: boolean;
  include_children?: boolean;
  force?: boolean;
}

export interface ProcessBlockInput {
  subject_path?: string;
  subject_hash?: string;
  object_path?: string;
  object_hash?: string;
  except_path?: string;
  except_hash?: string;
  audit?: boolean;
}

export interface NetBlockInput {
  direction?: string;
}

export interface ScheduledTaskInput {
  force?: boolean;
}

export interface ServiceInput {
  stop_before_delete?: boolean;
}

export interface AccountInput {
  force_logoff?: boolean;
  new_password?: string;
  force_change_at_next_logon?: boolean;
  unlock_account?: boolean;
}

export interface RegistryInput {
  recursive?: boolean;
  stop_on_failure?: boolean;
}

export interface WmiClassInput {
  delete_instances?: boolean;
  recursive_delete?: boolean;
}

export interface WmiSubscriptionInput {
  remove_binding_only?: boolean;
  target_candidate_id?: string;
}

export interface ForceInput {
  force?: boolean;
}

export interface FileEAInput extends ForceInput {
  ea_names?: string[];
  delete_all?: boolean;
}

// Protobuf defines these fields as a oneof. The optional shape keeps response
// normalization tolerant while request builders must set at most one member.
export interface RemediationActionInput {
  file_quarantine?: FileQuarantineInput;
  process_terminate?: ProcessTerminateInput;
  process_block?: ProcessBlockInput;
  net_block?: NetBlockInput;
  scheduled_task?: ScheduledTaskInput;
  service?: ServiceInput;
  account?: AccountInput;
  registry?: RegistryInput;
  wmi_class?: WmiClassInput;
  wmi_subscription?: WmiSubscriptionInput;
  bits_job?: ForceInput;
  file_ea?: FileEAInput;
  ntfs_ads?: ForceInput;
}

export interface ResolveRemediationNodeAgentsRequest {
  request_id: string;
  tenant_id?: string;
  scope_type: "case" | "positioning";
  scope_id: string;
  node_key: string;
  entity_type?: string;
}

export interface ResolveRemediationNodeAgentsResult {
  request_id: string;
  tenant_id: string;
  scope_type: string;
  scope_id: string;
  node_key: string;
  entity_type: string;
  status: string;
  agent_ids: string[];
  resolve_source: string;
  message: string;
}

export interface QueryRemediationNodeActionsRequest {
  request_id: string;
  tenant_id?: string;
  source_type: string;
  scope_type: string;
  scope_id: string;
  node_key: string;
}

export interface RemediationActionDescriptor {
  action_code: string;
  display_name: string;
  risk_level: string;
  reversible: boolean;
}

export type RemediationActionApplicabilityStatus =
  "unspecified" | "available" | "requires_configuration" | "unavailable";

export type RemediationCurrentEffectState =
  | "unspecified"
  | "none"
  | "satisfied"
  | "same_action_in_flight"
  | "conflicting_action_in_flight"
  | "uncertain";

export type RemediationPrepareDisposition =
  | "unspecified"
  | "execute"
  | "skip_satisfied"
  | "wait_existing"
  | "block";

export interface RemediationActionAgentDecision {
  agent_id: string;
  status: RemediationActionApplicabilityStatus;
  reason_code: string;
  reason_message: string;
  required_input_fields: string[];
  reverse_contexts: RemediationReverseContextOption[];
  target_candidates: RemediationActionTargetCandidate[];
  current_effect_state: RemediationCurrentEffectState;
  prepare_disposition: RemediationPrepareDisposition;
  draft_selectable: boolean;
}

export interface RemediationActionTargetCandidate {
  candidate_id: string;
  target_type: string;
  display_name: string;
  shared_source: boolean;
  shared_target: boolean;
  source_binding_count: number;
  target_binding_count: number;
}

export interface RemediationActionDecision {
  action: RemediationActionDescriptor;
  agent_decisions: RemediationActionAgentDecision[];
}

export type RemediationNodeResolutionStatus =
  "unspecified" | "resolved" | "unavailable";

export interface RemediationNodeAction {
  node_key: string;
  entity_type: string;
  resolution_status: RemediationNodeResolutionStatus;
  reason_code: string;
  reason_message: string;
  actions: RemediationActionDecision[];
}

export interface RemediationNodeActionsResult {
  tenant_id: string;
  source_type: string;
  scope_type: string;
  scope_id: string;
  node: RemediationNodeAction;
}

export interface RemediationGraphTargetReference {
  node_key: string;
  agent_id: string;
}

export interface RemediationOrderDraftItemInput {
  item_id?: string;
  action_code: string;
  action_input?: RemediationActionInput;
  graph_target: RemediationGraphTargetReference;
  reverse_source_item_id?: string;
}

export interface CreateRemediationOrderRequest {
  request_id: string;
  title: string;
  source: RemediationSource;
  items: RemediationOrderDraftItemInput[];
}

export interface GetOrCreateRemediationOrderBySourceRequest {
  request_id: string;
  title?: string;
  source: RemediationSource;
}

export type RemediationDraftItemUpsertDisposition =
  | "unspecified"
  | "created"
  | "updated"
  | "already_present"
  | "already_satisfied"
  | "in_flight";

export interface UpsertRemediationDraftItemsRequest {
  request_id: string;
  order_id: string;
  expected_revision: UInt64Input;
  items: RemediationOrderDraftItemInput[];
}

export interface DeleteRemediationDraftItemRequest {
  request_id: string;
  order_id: string;
  item_id: string;
  expected_revision: UInt64Input;
}

export interface RemediationDraftItemUpsertResult {
  input_index: number;
  item_id: string;
  round_no: number;
  disposition: RemediationDraftItemUpsertDisposition;
  reason_code: string;
  reason_message: string;
}

export interface RemediationDraftItemsUpsertData {
  order: RemediationOrder;
  item_results: RemediationDraftItemUpsertResult[];
}

export interface UpdateRemediationOrderRequest {
  request_id: string;
  order_id: string;
  expected_revision: UInt64Input;
  title: string;
  source: RemediationSource;
  items: RemediationOrderDraftItemInput[];
}

export interface DeleteRemediationOrderRequest {
  request_id: string;
  order_id: string;
  expected_revision: UInt64Input;
}

export interface QueryRemediationOrderByIdRequest {
  request_id: string;
  order_id: string;
}

export interface QueryEditableRemediationOrderBySourceRequest {
  request_id: string;
  source_type: RemediationSourceType;
  source_ref_id: string;
}

export interface QueryRemediationOrderListRequest {
  request_id: string;
  source_type?: RemediationSourceType;
  source_ref_id?: string;
  case_id?: string;
  workflow_id?: string;
  status?: string;
  page?: number;
  page_size?: number;
}

export interface CancelRemediationOrderRequest {
  request_id: string;
  order_id: string;
  revision: UInt64Input;
  reason: string;
}

export interface PrepareRemediationOrderRequest {
  request_id: string;
  order_id: string;
  revision: UInt64Input;
}

export interface ConfirmRemediationOrderRequest {
  request_id: string;
  order_id: string;
  revision: UInt64Input;
  prepared_fingerprint_version: string;
  prepared_fingerprint: string;
}

export type RemediationReconcileDecision =
  "still_unknown" | "effect_present" | "effect_absent";

export interface ReconcileRemediationItemRequest {
  request_id: string;
  item_id: string;
  expected_result_version: number;
  decision: RemediationReconcileDecision;
  evidence_ref: string;
  reason: string;
}

export interface QueryRemediationItemsByAgentIdRequest {
  request_id: string;
  agent_id: string;
  source_type?: RemediationSourceType;
  item_status?: string;
  page?: number;
  page_size?: number;
}

export interface QueryRemediationHostListRequest {
  request_id: string;
  keyword?: string;
  source_type?: RemediationSourceType;
  item_status?: string;
  page?: number;
  page_size?: number;
}

export interface QueryRemediationItemsBySourceRequest {
  request_id: string;
  source_type: RemediationSourceType;
  source_ref_id: string;
  status?: string;
  page?: number;
  page_size?: number;
}

export interface QueryRemediationSummaryRequest {
  request_id: string;
  source_type: RemediationSourceType;
  source_ref_id: string;
}

export interface QueryRemediationOverviewSummaryRequest {
  request_id: string;
}

export interface RemediationOverviewTotals {
  order_count: UInt64;
  host_count: UInt64;
  active_order_count: UInt64;
  attention_order_count: UInt64;
  item_count: UInt64;
  last_activity_at: string;
}

export interface RemediationOverviewOrderStatusBucket {
  status: string;
  count: UInt64;
}

export interface RemediationOverviewSourceBucket {
  source_type: ProtoEnum;
  order_count: UInt64;
}

export interface RemediationOverviewActionBucket {
  action_code: string;
  item_count: UInt64;
}

export interface RemediationOverviewTrendPoint {
  bucket_start_at: string;
  terminal_item_count: UInt64;
  success_count: UInt64;
  failed_count: UInt64;
  uncertain_count: UInt64;
}

export interface RemediationOverviewSummary {
  totals: RemediationOverviewTotals;
  order_statuses: RemediationOverviewOrderStatusBucket[];
  sources: RemediationOverviewSourceBucket[];
  actions: RemediationOverviewActionBucket[];
  trend: RemediationOverviewTrendPoint[];
}

export interface RemediationItemExecution {
  operation_id: string;
  operation: string;
  operation_status: string;
  operation_outcome: string;
  operation_result_version: number;
  total_count: number;
  pending_count: number;
  running_count: number;
  success_count: number;
  failed_count: number;
  uncertain_count: number;
  skipped_count: number;
  canceled_count: number;
  dispatch_id: string;
  publish_status: string;
  publish_attempt_count: number;
  publish_acceptance_unknown: boolean;
  execution_status: string;
  failure_certainty: string;
  reason_code: string;
  reason_message: string;
  error_code: string;
  error_message: string;
  dispatch_result_version: number;
  report_deadline_at: string;
  first_publish_attempt_at: string;
  published_at: string;
  started_at: string;
  last_report_at: string;
  finished_at: string;
  created_at: string;
  updated_at: string;
  completed_at: string;
}

export interface RemediationBackupAvailability {
  backup_id: string;
  source_item_id: string;
  resource_type: string;
  resource_state: string;
  available: boolean;
  unavailable_reason_code: string;
  created_at: string;
  updated_at: string;
  last_verified_at: string;
  expires_at: string;
  path_pairs: RemediationBackupPathPair[];
}

export interface RemediationBackupPathPair {
  source_path: string;
  backup_path: string;
  original_md5: string;
}

export interface RemediationAgentSnapshot {
  agent_id: string;
  host_name: string;
  primary_ip: string;
  ip_addresses: string[];
  mac_addresses: string[];
  observed_at: string;
  connectivity_status: "online" | "offline" | "unknown";
}

export type RemediationTargetSnapshotStatus =
  | "unspecified"
  | "available"
  | "unavailable";

export type RemediationTargetSnapshotSource =
  | "unspecified"
  | "graph_current"
  | "prepared_frozen"
  | "history_frozen";

export interface RemediationProcessTargetSnapshot {
  process_guid: string;
  pid: number;
  process_name: string;
  process_path: string;
  process_hash: string;
  command_line: string;
}

export interface RemediationFileTargetSnapshot {
  file_path: string;
  file_hash: string;
  file_type: string;
  signature: string;
  signer: string;
  observed_ea_names: string[];
  stream_name: string;
}

export type RemediationScheduledTargetKind =
  | "unspecified"
  | "task"
  | "job";

export interface RemediationScheduledTaskTargetSnapshot {
  kind: RemediationScheduledTargetKind;
  task_name: string;
  task_path: string;
  job_id: string;
  command: string;
  binary_path: string;
  binary_hash: string;
  run_as: string;
  state: string;
}

export interface RemediationServiceTargetSnapshot {
  service_name: string;
  display_name: string;
  binary_path: string;
  binary_hash: string;
  start_account: string;
  state: string;
}

export interface RemediationAccountTargetSnapshot {
  account_name: string;
  domain: string;
  sid: string;
  enabled?: boolean;
  locked?: boolean;
}

export type RemediationRegistryTargetKind =
  | "unspecified"
  | "key"
  | "value";

export interface RemediationRegistryTargetSnapshot {
  kind: RemediationRegistryTargetKind;
  hive: string;
  user_sid: string;
  key_path: string;
  value_name: string;
  present?: boolean;
}

export interface RemediationWmiClassTargetSnapshot {
  namespace: string;
  class_name: string;
  class_path: string;
  server_name: string;
}

export interface RemediationWmiSubscriptionTargetSnapshot {
  candidate_id: string;
  namespace: string;
  filter_name: string;
  consumer_name: string;
  consumer_type: string;
  shared_filter: boolean;
  shared_consumer: boolean;
  filter_binding_count: number;
  consumer_binding_count: number;
}

export interface RemediationBitsJobTargetSnapshot {
  job_id: string;
  job_name: string;
  job_type: string;
  job_status: string;
  remote_url: string;
  local_files: string[];
}

export type RemediationNetworkTargetKind =
  | "unspecified"
  | "ip_address"
  | "endpoint"
  | "domain"
  | "url";

export interface RemediationNetworkTargetSnapshot {
  kind: RemediationNetworkTargetKind;
  ip: string;
  port: number;
  protocol: string;
  is_ipv6?: boolean;
  domain: string;
  url: string;
}

export interface RemediationTargetSnapshot {
  status: RemediationTargetSnapshotStatus;
  source: RemediationTargetSnapshotSource;
  reason_code: string;
  reason_message: string;
  canonical_node_key: string;
  observed_at: string;
  process: RemediationProcessTargetSnapshot | null;
  file: RemediationFileTargetSnapshot | null;
  scheduled_task: RemediationScheduledTaskTargetSnapshot | null;
  service: RemediationServiceTargetSnapshot | null;
  account: RemediationAccountTargetSnapshot | null;
  registry: RemediationRegistryTargetSnapshot | null;
  wmi_class: RemediationWmiClassTargetSnapshot | null;
  wmi_subscription: RemediationWmiSubscriptionTargetSnapshot | null;
  bits_job: RemediationBitsJobTargetSnapshot | null;
  network: RemediationNetworkTargetSnapshot | null;
}

export interface RemediationOrderItem {
  item_id: string;
  round_no: number;
  position: number;
  node_key: string;
  entity_type: string;
  display_name: string;
  graph_origin: string;
  agent_id: string;
  action_code: string;
  action_input: RemediationActionInput;
  reverse_source_type: string;
  reverse_source_id: string;
  status: string;
  reason_code: string;
  reason_message: string;
  risk_level: string;
  catalog_version: string;
  executor_kind: string;
  result_authority: string;
  retry_safety: string;
  effect_group: string;
  execution_timeout_seconds: number;
  created_at: string;
  updated_at: string;
  object_type: number;
  object_id: string;
  object_version: string;
  capability_profile: string;
  capability_contract_version: number;
  capability_fingerprint: string;
  resolved_operation: string;
  catalog_delete_mode: string;
  operation_id: string;
  dispatch_id: string;
  error_code: string;
  error_message: string;
  result_version: number;
  uncertainty_since_at: string;
  finished_at: string;
  execution: RemediationItemExecution | null;
  backup: RemediationBackupAvailability | null;
  order_id: string;
  target_snapshot: RemediationTargetSnapshot | null;
  agent_snapshot: RemediationAgentSnapshot | null;
}

export interface RemediationOrderSummary {
  total: number;
  draft: number;
  ready: number;
  satisfied: number;
  blocked: number;
  pending: number;
  running: number;
  success: number;
  failed: number;
  skipped: number;
  uncertain: number;
}

export interface RemediationOrder {
  tenant_id: string;
  order_id: string;
  source: RemediationSource;
  title: string;
  status: string;
  outcome: string;
  revision: UInt64;
  current_round: number;
  prepared_fingerprint_version: string;
  prepared_fingerprint: string;
  prepared_at: string;
  prepared_expires_at: string;
  confirmable: boolean;
  summary: RemediationOrderSummary;
  items: RemediationOrderItem[];
  created_by: string;
  updated_by: string;
  canceled_by: string;
  cancel_reason: string;
  created_at: string;
  updated_at: string;
  canceled_at: string;
  expires_at: string;
}

export interface RemediationOrderListItem {
  order_id: string;
  source: RemediationSource;
  title: string;
  status: string;
  outcome: string;
  revision: UInt64;
  confirmable: boolean;
  summary: RemediationOrderSummary;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface RemediationOrderList {
  items: RemediationOrderListItem[];
  total: UInt64;
  page: number;
  page_size: number;
}

export interface RemediationItemList {
  items: RemediationOrderItem[];
  total: UInt64;
  page: number;
  page_size: number;
}

export interface RemediationOrderReference {
  order_id: string;
  title: string;
  source: RemediationSource;
}

export interface RemediationHostActionItem {
  order: RemediationOrderReference;
  item: RemediationOrderItem;
}

export interface RemediationHostActionList {
  host: RemediationAgentSnapshot;
  items: RemediationHostActionItem[];
  total: UInt64;
  page: number;
  page_size: number;
}

export interface RemediationHostListItem {
  agent_snapshot: RemediationAgentSnapshot;
  remediation_item_count: UInt64;
  last_activity_at: string;
}

export interface RemediationHostList {
  items: RemediationHostListItem[];
  total: UInt64;
  page: number;
  page_size: number;
}

export interface RemediationSummary {
  order_count: UInt64;
  item_count: UInt64;
  running_count: UInt64;
  success_count: UInt64;
  failed_count: UInt64;
  uncertain_count: UInt64;
}

export type RequestWithOptionalId<T extends { request_id: string }> = Omit<
  T,
  "request_id"
> & { request_id?: string };
