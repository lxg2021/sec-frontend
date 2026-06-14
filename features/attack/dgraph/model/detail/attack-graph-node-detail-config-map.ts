import type { AttackGraphNodeModel } from "../core/attack-graph-data";
import type {
  AttackGraphDetailData,
  AttackGraphDetailCardConfig,
} from "./attack-graph-detail-config-types";
import {
  FILE_DETAIL_CONFIG,
  FILE_MAPPING_DETAIL_CONFIG,
  MAIL_SLOT_DETAIL_CONFIG,
  MBR_DETAIL_CONFIG,
  MESSAGE_HOOK_DETAIL_CONFIG,
  NAMED_EVENT_DETAIL_CONFIG,
  NAMED_PIPE_DETAIL_CONFIG,
  NET_ADDRESS_DETAIL_CONFIG,
  NET_ENDPOINT_DETAIL_CONFIG,
  POWERSHELL_EXECUTION_DETAIL_CONFIG,
  PROCESS_DETAIL_CONFIG,
  REGISTRY_KEY_DETAIL_CONFIG,
  REGISTRY_VALUE_DETAIL_CONFIG,
  SCHEDULED_JOB_DETAIL_CONFIG,
  SERVICE_DETAIL_CONFIG,
  TASK_DETAIL_CONFIG,
  TOKEN_IMPERSONATION_DETAIL_CONFIG,
  VOLUME_DETAIL_CONFIG,
  WMI_CLASS_DETAIL_CONFIG,
  WMI_CONSUMER_DETAIL_CONFIG,
  WMI_EXECUTE_DETAIL_CONFIG,
  WMI_FILTER_DETAIL_CONFIG,
  WMI_QUERY_DETAIL_CONFIG,
} from "./configs";

const NODE_DETAIL_CONFIG_BY_ENTITY_TYPE: Partial<
  Record<string, AttackGraphDetailCardConfig>
> = {
  File: FILE_DETAIL_CONFIG,
  FileMapping: FILE_MAPPING_DETAIL_CONFIG,
  MailSlot: MAIL_SLOT_DETAIL_CONFIG,
  Mbr: MBR_DETAIL_CONFIG,
  MessageHook: MESSAGE_HOOK_DETAIL_CONFIG,
  NamedEvent: NAMED_EVENT_DETAIL_CONFIG,
  NamedPipe: NAMED_PIPE_DETAIL_CONFIG,
  NetAddress: NET_ADDRESS_DETAIL_CONFIG,
  NetEndpoint: NET_ENDPOINT_DETAIL_CONFIG,
  PowerShellExecution: POWERSHELL_EXECUTION_DETAIL_CONFIG,
  Process: PROCESS_DETAIL_CONFIG,
  RegistryKey: REGISTRY_KEY_DETAIL_CONFIG,
  RegistryValue: REGISTRY_VALUE_DETAIL_CONFIG,
  ScheduledJob: SCHEDULED_JOB_DETAIL_CONFIG,
  Service: SERVICE_DETAIL_CONFIG,
  Task: TASK_DETAIL_CONFIG,
  TokenImpersonation: TOKEN_IMPERSONATION_DETAIL_CONFIG,
  Volume: VOLUME_DETAIL_CONFIG,
  WmiClass: WMI_CLASS_DETAIL_CONFIG,
  WmiConsumer: WMI_CONSUMER_DETAIL_CONFIG,
  WmiExecute: WMI_EXECUTE_DETAIL_CONFIG,
  WmiFilter: WMI_FILTER_DETAIL_CONFIG,
  WmiQuery: WMI_QUERY_DETAIL_CONFIG,
};

export function getAttackGraphNodeDetailConfig(
  node: AttackGraphNodeModel,
): AttackGraphDetailCardConfig {
  return NODE_DETAIL_CONFIG_BY_ENTITY_TYPE[node.entityType] ?? buildFallbackConfig(node);
}

export function toAttackGraphNodeDetailData(
  node: AttackGraphNodeModel,
): AttackGraphDetailData {
  return {
    ...node.properties,
    display_name: node.properties.display_name || node.displayName,
    entity_type: node.entityType,
    graph_display_name: node.displayName,
    key: node.key,
  };
}

function buildFallbackConfig(
  node: AttackGraphNodeModel,
): AttackGraphDetailCardConfig {
  const propertyFields = Object.keys(node.properties)
    .sort()
    .slice(0, 24)
    .map((key) => ({
      key,
      label: toTitleLabel(key),
      mono: isMonoField(key),
      copyable: isCopyableField(key),
    }));

  return {
    header: {
      icon: "Info",
      title: {
        key: "display_name",
        fallback: node.entityType || "Node",
      },
      fields: [
        { key: "entity_type", label: "Entity Type", icon: "BadgeInfo" },
        { key: "key", label: "Node Key", icon: "Key", mono: true, copyable: true },
      ],
    },
    sections: [
      {
        title: "Properties",
        icon: "Info",
        tone: "slate",
        fields: propertyFields,
      },
    ],
  };
}

function toTitleLabel(key: string) {
  return key
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isMonoField(key: string) {
  return /(^|_)(id|key|sid|md5|sha1|sha256|fingerprint|guid|pid)($|_)/i.test(
    key,
  );
}

function isCopyableField(key: string) {
  return (
    isMonoField(key) ||
    key.includes("command") ||
    key.includes("name") ||
    key.includes("path") ||
    key === "url" ||
    key === "object_value"
  );
}
