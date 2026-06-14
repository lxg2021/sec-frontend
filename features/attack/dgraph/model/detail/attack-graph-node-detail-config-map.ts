import type { AttackGraphNodeModel } from "../core/attack-graph-data";
import type {
  AttackGraphDetailData,
  AttackGraphDetailCardConfig,
} from "./attack-graph-detail-config-types";
import {
  FILE_DETAIL_CONFIG,
  PROCESS_DETAIL_CONFIG,
  REGISTRY_KEY_DETAIL_CONFIG,
  REGISTRY_VALUE_DETAIL_CONFIG,
  SCHEDULED_JOB_DETAIL_CONFIG,
  SERVICE_DETAIL_CONFIG,
  TASK_DETAIL_CONFIG,
  TOKEN_IMPERSONATION_DETAIL_CONFIG,
} from "./configs";

const NODE_DETAIL_CONFIG_BY_ENTITY_TYPE: Partial<
  Record<string, AttackGraphDetailCardConfig>
> = {
  File: FILE_DETAIL_CONFIG,
  Process: PROCESS_DETAIL_CONFIG,
  RegistryKey: REGISTRY_KEY_DETAIL_CONFIG,
  RegistryValue: REGISTRY_VALUE_DETAIL_CONFIG,
  ScheduledJob: SCHEDULED_JOB_DETAIL_CONFIG,
  Service: SERVICE_DETAIL_CONFIG,
  Task: TASK_DETAIL_CONFIG,
  TokenImpersonation: TOKEN_IMPERSONATION_DETAIL_CONFIG,
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
