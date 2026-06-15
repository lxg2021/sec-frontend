import type { AttackGraphEdgeModel } from "../core/attack-graph-data";
import type { AttackGraphRelationType } from "../edge/attack-graph-edge-types";

export interface AttackGraphEdgeDetailFieldConfig {
  key: string;
  label?: string;
  boxed?: boolean;
}

const field = (
  key: string,
  options: Omit<AttackGraphEdgeDetailFieldConfig, "key"> = {},
): AttackGraphEdgeDetailFieldConfig => ({
  key,
  label: options.label ?? getDefaultEdgeFieldLabel(key),
  boxed: options.boxed ?? isBoxedEdgeDetailField(key),
});

const fields = (keys: string[]) => keys.map((key) => field(key));

const OBSERVATION_FIELDS = fields([
  "event_count",
  "first_seen_at",
  "last_seen_at",
  "first_source_unique_id",
  "last_source_unique_id",
]);

const ACCOUNT_ACTION_FIELDS = fields([
  "occurred_at",
  "subject_user_sid",
  "subject_user_name",
  "subject_domain_name",
  "subject_logon_id",
  "target_sid",
  "target_user_name",
  "target_domain_name",
  "sam_account_name",
]);

const ACCOUNT_MEMBER_ACTION_FIELDS = fields([
  "occurred_at",
  "subject_user_sid",
  "subject_user_name",
  "subject_domain_name",
  "subject_logon_id",
  "target_sid",
  "target_user_name",
  "target_domain_name",
  "member_name",
  "member_sid",
]);

const BITS_CREATE_FIELDS = fields([
  "occurred_at",
  "job_id",
  "job_type",
  "job_type_desc",
  "job_name",
  "job_files",
  "job_status",
  "job_status_desc",
]);

const BITS_FILE_FIELDS = fields([
  "occurred_at",
  "job_id",
  "job_type",
  "job_type_desc",
  "job_name",
  "job_files",
]);

const FILE_RENAME_FIELDS = fields(["occurred_at", "old_path", "new_path"]);

const SIMPLE_OCCURRED_AT_FIELDS = fields(["occurred_at"]);

const SERVICE_BINARY_FIELDS = fields([
  "occurred_at",
  "service_binary_path_name",
  "service_binary_md5",
]);

const ASSOCIATED_FILE_FIELDS = fields([
  "associated_file_kind",
  "match_kind",
  "matched_md5",
]);

export const ATTACK_GRAPH_EDGE_BUSINESS_FIELD_CONFIGS = {
  CASE_HAS_GROUP: fields(["display_order"]),
  GROUP_HAS_INSTANCE: fields(["display_order"]),
  INSTANCE_HAS_EVIDENCE: fields(["display_order"]),
  EVIDENCE_REFER_ENTITY: fields([
    "role",
    "entity_key",
    "entity_type",
    "display_order",
    "evidence_id",
    "case_id",
    "group_id",
    "instance_id",
    "tenant_id",
    "rule_id",
    "agent_id",
    "source_unique_id",
    "event_type",
    "event_name",
    "occurred_at",
  ]),

  PROCESS_CREATE_PROCESS: fields(["created_at"]),
  PROCESS_TERMINATE_PROCESS: fields(["self_exit"]),
  PROCESS_ACCESS_PROCESS: fields([
    "occurred_at",
    "granted_access",
    "call_trace",
  ]),
  PROCESS_CROSS_MEMORY_EXECUTE: fields([
    "occurred_at",
    "address",
    "page_protect",
  ]),
  PROCESS_CREATE_REMOTE_THREAD: fields(["occurred_at", "thread_id"]),
  PROCESS_ADJUST_TOKEN_PRIVILEGES: fields([
    "occurred_at",
    "privileges",
    "token_flag",
    "token_flag_description",
    "self",
  ]),
  PROCESS_SET_TOKEN: fields([
    "occurred_at",
    "operator_token_context",
    "target_token_context",
    "token_flag",
    "token_flag_description",
  ]),
  PROCESS_EXECUTE_CRYPTO: OBSERVATION_FIELDS,
  PROCESS_EXECUTE_POWERSHELL: OBSERVATION_FIELDS,
  PROCESS_STEAL_CREDENTIALS: OBSERVATION_FIELDS,
  PROCESS_SET_MESSAGE_HOOK: OBSERVATION_FIELDS,
  PROCESS_IMPERSONATE_TOKEN: OBSERVATION_FIELDS,

  PROCESS_CREATE_BITS: BITS_CREATE_FIELDS,
  PROCESS_ADD_FILES_TO_BITS: BITS_FILE_FIELDS,
  PROCESS_CHANGE_BITS_STATUS: fields([
    "occurred_at",
    "job_id",
    "job_status",
    "job_status_desc",
    "job_name",
  ]),
  BITS_REMOTE_URL: fields(["pair_index"]),
  BITS_LOCAL_FILE: fields(["pair_index"]),
  URL_DOWNLOAD_TO_FILE: fields(["pair_index", "edge_key"]),
  PROCESS_CREATE_FILE: SIMPLE_OCCURRED_AT_FIELDS,
  PROCESS_DELETE_FILE: SIMPLE_OCCURRED_AT_FIELDS,
  PROCESS_READ_FILE: SIMPLE_OCCURRED_AT_FIELDS,
  PROCESS_WRITE_FILE: SIMPLE_OCCURRED_AT_FIELDS,
  PROCESS_SET_FILE_EA: SIMPLE_OCCURRED_AT_FIELDS,
  PROCESS_LOAD_DLL: fields(["loaded_at"]),
  PROCESS_LOAD_DRIVER: fields(["loaded_at"]),
  PROCESS_RENAME_FILE: FILE_RENAME_FIELDS,
  PROCESS_MOVE_FILE: FILE_RENAME_FIELDS,
  PROCESS_CHANGE_FILE_ATTRIBUTES: fields([
    "occurred_at",
    "flag",
    "org_create_time",
    "new_create_time",
  ]),
  FILE_RENAME_TO: fields(["old_path", "new_path"]),
  FILE_MOVE_TO: fields(["old_path", "new_path"]),
  PROCESS_CREATE_FILE_STREAM: SIMPLE_OCCURRED_AT_FIELDS,
  PROCESS_DELETE_FILE_STREAM: SIMPLE_OCCURRED_AT_FIELDS,
  FILE_HAS_STREAM: fields(["relation_kind"]),
  PROCESS_ACCESS_URL: fields(["visited_at"]),
  PROCESS_ACCESS_VOLUME: fields(["access_type", "driver_type"]),

  DEVICE_BELONG_TO_HOST: fields([
    "first_seen_at",
    "last_seen_at",
    "last_change_at",
    "last_change_type",
    "is_present",
    "last_source_unique_id",
  ]),
  PROCESS_CONNECT_ENDPOINT: fields([
    "protocol",
    "direction",
    "local_ip",
    "local_port",
    "remote_ip",
    "remote_port",
  ]),
  PROCESS_QUERY_DNS_NAME: fields([
    "first_seen_at",
    "last_seen_at",
    "last_source_unique_id",
    "query_count",
  ]),
  DNS_NAME_RESOLVE_ADDRESS: fields(["resolved_at"]),
  ADDRESS_HAS_ENDPOINT: [],
  PROCESS_CREATE_NAMED_EVENT: SIMPLE_OCCURRED_AT_FIELDS,
  PROCESS_OPEN_NAMED_EVENT: SIMPLE_OCCURRED_AT_FIELDS,
  PROCESS_CREATE_FILE_MAPPING: fields(["occurred_at", "stack_module"]),
  PROCESS_CONNECT_FILE_MAPPING: fields(["occurred_at", "stack_module"]),
  PROCESS_CREATE_MAIL_SLOT: SIMPLE_OCCURRED_AT_FIELDS,
  PROCESS_CONNECT_MAIL_SLOT: SIMPLE_OCCURRED_AT_FIELDS,
  PROCESS_CREATE_NAMED_PIPE: SIMPLE_OCCURRED_AT_FIELDS,
  PROCESS_CONNECT_NAMED_PIPE: SIMPLE_OCCURRED_AT_FIELDS,
  PROCESS_TOUCH_MBR: fields(["driver_type"]),

  PROCESS_CREATE_ACCOUNT: ACCOUNT_ACTION_FIELDS,
  PROCESS_ENABLE_ACCOUNT: ACCOUNT_ACTION_FIELDS,
  PROCESS_RESET_ACCOUNT_PASSWORD: ACCOUNT_ACTION_FIELDS,
  PROCESS_DISABLE_ACCOUNT: ACCOUNT_ACTION_FIELDS,
  PROCESS_DELETE_ACCOUNT: ACCOUNT_ACTION_FIELDS,
  PROCESS_MODIFY_ACCOUNT: ACCOUNT_ACTION_FIELDS,
  PROCESS_ADD_ACCOUNT_TO_GROUP: [
    ...ACCOUNT_ACTION_FIELDS,
    ...fields(["member_name", "member_sid"]),
  ],
  PROCESS_REMOVE_ACCOUNT_FROM_GROUP: ACCOUNT_MEMBER_ACTION_FIELDS,
  PROCESS_CREATE_ACCOUNT_GROUP: ACCOUNT_ACTION_FIELDS,
  PROCESS_DELETE_ACCOUNT_GROUP: ACCOUNT_ACTION_FIELDS,
  ACCOUNT_GROUP_HAS_MEMBER: fields([
    "last_change_at",
    "last_change_type",
    "is_present",
    "member_name",
    "member_sid",
  ]),

  PROCESS_CREATE_REGISTRY_KEY: SIMPLE_OCCURRED_AT_FIELDS,
  PROCESS_DELETE_REGISTRY_KEY: SIMPLE_OCCURRED_AT_FIELDS,
  PROCESS_RENAME_REGISTRY_KEY: fields([
    "occurred_at",
    "old_object_name",
    "new_object_name",
  ]),
  REGISTRY_KEY_RENAME_TO: fields(["old_object_name", "new_object_name"]),
  PROCESS_SET_REGISTRY_VALUE: fields(["occurred_at", "value_exist"]),
  PROCESS_DELETE_REGISTRY_VALUE: SIMPLE_OCCURRED_AT_FIELDS,
  PROCESS_QUERY_REGISTRY_VALUE: fields(["occurred_at", "value_exist"]),
  PROCESS_CREATE_SERVICE: SERVICE_BINARY_FIELDS,
  PROCESS_START_SERVICE: [
    ...SERVICE_BINARY_FIELDS,
    ...fields(["service_start_args"]),
  ],
  PROCESS_DELETE_SERVICE: SERVICE_BINARY_FIELDS,
  PROCESS_STOP_SERVICE: fields(["occurred_at", "service_control_code"]),
  PROCESS_CONTROL_SERVICE: fields(["occurred_at", "service_control_code"]),
  PROCESS_CONFIG_SERVICE: fields([
    "occurred_at",
    "org_service_binary_path_name",
    "new_service_binary_path_name",
    "org_service_binary_md5",
    "new_service_binary_md5",
    "binding_state",
  ]),
  PROCESS_CREATE_TASK: SIMPLE_OCCURRED_AT_FIELDS,
  PROCESS_DELETE_TASK: SIMPLE_OCCURRED_AT_FIELDS,
  PROCESS_CREATE_SCHEDULED_JOB: fields([
    "occurred_at",
    "job_binary_path_name",
    "job_binary_md5",
  ]),
  PROCESS_DELETE_SCHEDULED_JOB: fields([
    "occurred_at",
    "job_binary_path_name",
    "job_binary_md5",
  ]),
  PROCESS_CREATE_WMI_CLASS: SIMPLE_OCCURRED_AT_FIELDS,
  PROCESS_CREATE_WMI_CONSUMER: SIMPLE_OCCURRED_AT_FIELDS,
  PROCESS_CREATE_WMI_FILTER: SIMPLE_OCCURRED_AT_FIELDS,
  PROCESS_QUERY_WMI: SIMPLE_OCCURRED_AT_FIELDS,
  PROCESS_EXECUTE_WMI: SIMPLE_OCCURRED_AT_FIELDS,
  WMI_FILTER_BIND_CONSUMER: SIMPLE_OCCURRED_AT_FIELDS,
  TARGET_REMOTE_HOST: fields([
    "server_name",
    "normalized_server_name",
    "target_remote_kind",
    "has_explicit_credential",
  ]),
  ASSOCIATED_WITH_FILE: ASSOCIATED_FILE_FIELDS,
  MESSAGE_HOOK_MODULE_MATCH_FILE: ASSOCIATED_FILE_FIELDS,
  POWERSHELL_SCRIPT_MATCH_FILE: ASSOCIATED_FILE_FIELDS,
  SERVICE_IMAGE_MATCH_FILE: ASSOCIATED_FILE_FIELDS,
  TASK_IMAGE_MATCH_FILE: ASSOCIATED_FILE_FIELDS,
} satisfies Record<
  AttackGraphRelationType,
  readonly AttackGraphEdgeDetailFieldConfig[]
>;

export const COMMON_ATTACK_GRAPH_EDGE_DETAIL_FIELDS = [
  field("relation_type", { label: "Relation Type" }),
] as const;

export function getAttackGraphEdgeBusinessFieldConfigs(
  relationType: string | null | undefined,
) {
  const normalized = String(relationType ?? "").trim();
  if (normalized in ATTACK_GRAPH_EDGE_BUSINESS_FIELD_CONFIGS) {
    return ATTACK_GRAPH_EDGE_BUSINESS_FIELD_CONFIGS[
      normalized as AttackGraphRelationType
    ];
  }
  return [];
}

export function getAttackGraphEdgeDetailRows(edge: AttackGraphEdgeModel) {
  const rows: Array<{
    boxed?: boolean;
    key: string;
    label: string;
    value: string;
  }> = [];
  const added = new Set<string>();
  const businessFields = getAttackGraphEdgeBusinessFieldConfigs(
    edge.relationType,
  );

  for (const config of COMMON_ATTACK_GRAPH_EDGE_DETAIL_FIELDS) {
    addEdgeDetailRow(rows, added, edge, config);
  }
  for (const config of businessFields) {
    addEdgeDetailRow(rows, added, edge, config);
  }

  return rows;
}

function addEdgeDetailRow(
  rows: Array<{ boxed?: boolean; key: string; label: string; value: string }>,
  added: Set<string>,
  edge: AttackGraphEdgeModel,
  config: AttackGraphEdgeDetailFieldConfig,
) {
  if (added.has(config.key)) {
    return;
  }
  const value = getEdgeDetailFieldValue(edge, config.key);
  if (!value) {
    return;
  }
  rows.push({
    boxed: config.boxed,
    key: config.key,
    label: config.label ?? toEdgeFieldLabel(config.key),
    value,
  });
  added.add(config.key);
}

function getEdgeDetailFieldValue(edge: AttackGraphEdgeModel, key: string) {
  if (key === "relation_type") {
    return stringValue(edge.relationType);
  }
  if (key === "source_key") {
    return stringValue(edge.source);
  }
  if (key === "target_key") {
    return stringValue(edge.target);
  }
  if (key === "graph_origin") {
    return stringValue(edge.graphOrigin);
  }
  if (key === "scope_type") {
    return stringValue(edge.scopeType);
  }
  if (key === "scope_id") {
    return stringValue(edge.scopeId);
  }
  if (key === "edge_key") {
    return stringValue(edge.edgeKey);
  }
  return stringValue(edge.properties[key]);
}

function getDefaultEdgeFieldLabel(key: string) {
  if (key === "occurred_at") {
    return "Occurred";
  }
  return toEdgeFieldLabel(key);
}

function toEdgeFieldLabel(key: string) {
  return key
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isBoxedEdgeDetailField(key: string) {
  return (
    /(^|_)(key|id|sid|guid|md5|hash|fingerprint)($|_)/i.test(key) ||
    /(_path|_trace|_context|_json|privileges|job_files|parameters|query)$/i.test(
      key,
    )
  );
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
