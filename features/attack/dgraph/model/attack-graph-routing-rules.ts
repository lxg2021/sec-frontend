import {
  ATTACK_GRAPH_RELATION_TYPES,
  type AttackGraphRelationType,
} from "./attack-graph-edge-types";
import {
  getAttackGraphNodeLayoutRule,
  getAttackGraphRelationLayoutRule,
  type AttackGraphLayoutLaneId,
} from "./attack-graph-layout-rules";

export type AttackGraphEdgeRouteKind =
  | "straight"
  | "orthogonal"
  | "smooth"
  | "loop";

export type AttackGraphEdgeLabelPlacement =
  | "center"
  | "horizontal-segment"
  | "source-side"
  | "target-side";

export interface AttackGraphRoutingNodeLike {
  id: string;
  entityType: string;
}

export interface AttackGraphRoutingEdgeLike {
  relationType: string;
  source: string;
  target: string;
}

export interface AttackGraphEdgeRoutingRule {
  route: AttackGraphEdgeRouteKind;
  labelPlacement: AttackGraphEdgeLabelPlacement;
  avoidDiagonal: boolean;
  allowStraightOnlyWhenSameLane: boolean;
  allowStraightOnlyWhenShort: boolean;
  parallelStrategy: "bundle" | "offset" | "spread-loop";
}

export interface AttackGraphResolvedEdgeRoutingRule
  extends AttackGraphEdgeRoutingRule {
  sourceLane: AttackGraphLayoutLaneId;
  targetLane: AttackGraphLayoutLaneId;
  sameLane: boolean;
  selfLoop: boolean;
}

export interface AttackGraphRoutingCoverageReport {
  relationTypeCount: number;
  missingRelationTypes: string[];
  extraRelationTypes: string[];
}

export const ATTACK_GRAPH_EDGE_ROUTING_RULES: Record<
  AttackGraphRelationType,
  AttackGraphEdgeRoutingRule
> = {
  ACCOUNT_GROUP_HAS_MEMBER: straightStructure(),
  ADDRESS_HAS_ENDPOINT: straightStructure(),
  ASSOCIATED_WITH_FILE: crossLaneAssociation(),
  BITS_LOCAL_FILE: crossLaneAssociation(),
  BITS_REMOTE_URL: crossLaneAssociation(),
  CASE_HAS_GROUP: hiddenStructure(),
  DEVICE_BELONG_TO_HOST: straightStructure(),
  DNS_NAME_RESOLVE_ADDRESS: straightStructure(),
  EVIDENCE_REFER_ENTITY: hiddenStructure(),
  FILE_HAS_STREAM: straightStructure(),
  FILE_MOVE_TO: smoothStructure(),
  FILE_RENAME_TO: smoothStructure(),
  GROUP_HAS_INSTANCE: hiddenStructure(),
  INSTANCE_HAS_EVIDENCE: hiddenStructure(),
  MESSAGE_HOOK_MODULE_MATCH_FILE: crossLaneAssociation(),
  POWERSHELL_SCRIPT_MATCH_FILE: crossLaneAssociation(),
  PROCESS_ACCESS_PROCESS: smoothProcess(),
  PROCESS_ACCESS_URL: crossLaneProcess(),
  PROCESS_ACCESS_VOLUME: crossLaneProcess(),
  PROCESS_ADD_ACCOUNT_TO_GROUP: crossLaneProcess(),
  PROCESS_ADD_FILES_TO_BITS: crossLaneProcess(),
  PROCESS_ADJUST_TOKEN_PRIVILEGES: crossLaneProcess(),
  PROCESS_CHANGE_BITS_STATUS: crossLaneProcess(),
  PROCESS_CHANGE_FILE_ATTRIBUTES: crossLaneProcess(),
  PROCESS_CONFIG_SERVICE: crossLaneProcess(),
  PROCESS_CONNECT_ENDPOINT: crossLaneProcess(),
  PROCESS_CONNECT_FILE_MAPPING: crossLaneProcess(),
  PROCESS_CONNECT_MAIL_SLOT: crossLaneProcess(),
  PROCESS_CONNECT_NAMED_PIPE: crossLaneProcess(),
  PROCESS_CONTROL_SERVICE: crossLaneProcess(),
  PROCESS_CREATE_ACCOUNT: crossLaneProcess(),
  PROCESS_CREATE_ACCOUNT_GROUP: crossLaneProcess(),
  PROCESS_CREATE_BITS: crossLaneProcess(),
  PROCESS_CREATE_FILE: crossLaneProcess(),
  PROCESS_CREATE_FILE_MAPPING: crossLaneProcess(),
  PROCESS_CREATE_FILE_STREAM: crossLaneProcess(),
  PROCESS_CREATE_MAIL_SLOT: crossLaneProcess(),
  PROCESS_CREATE_NAMED_EVENT: crossLaneProcess(),
  PROCESS_CREATE_NAMED_PIPE: crossLaneProcess(),
  PROCESS_CREATE_PROCESS: primaryProcessChain(),
  PROCESS_CREATE_REGISTRY_KEY: crossLaneProcess(),
  PROCESS_CREATE_REMOTE_THREAD: smoothProcess(),
  PROCESS_CREATE_SCHEDULED_JOB: crossLaneProcess(),
  PROCESS_CREATE_SERVICE: crossLaneProcess(),
  PROCESS_CREATE_TASK: crossLaneProcess(),
  PROCESS_CREATE_WMI_CLASS: crossLaneProcess(),
  PROCESS_CREATE_WMI_CONSUMER: crossLaneProcess(),
  PROCESS_CREATE_WMI_FILTER: crossLaneProcess(),
  PROCESS_CROSS_MEMORY_EXECUTE: smoothProcess(),
  PROCESS_DELETE_ACCOUNT: crossLaneProcess(),
  PROCESS_DELETE_ACCOUNT_GROUP: crossLaneProcess(),
  PROCESS_DELETE_FILE: crossLaneProcess(),
  PROCESS_DELETE_FILE_STREAM: crossLaneProcess(),
  PROCESS_DELETE_REGISTRY_KEY: crossLaneProcess(),
  PROCESS_DELETE_REGISTRY_VALUE: crossLaneProcess(),
  PROCESS_DELETE_SCHEDULED_JOB: crossLaneProcess(),
  PROCESS_DELETE_SERVICE: crossLaneProcess(),
  PROCESS_DELETE_TASK: crossLaneProcess(),
  PROCESS_DISABLE_ACCOUNT: crossLaneProcess(),
  PROCESS_ENABLE_ACCOUNT: crossLaneProcess(),
  PROCESS_EXECUTE_CRYPTO: crossLaneProcess(),
  PROCESS_EXECUTE_POWERSHELL: primaryProcessChain(),
  PROCESS_EXECUTE_WMI: crossLaneProcess(),
  PROCESS_IMPERSONATE_TOKEN: crossLaneProcess(),
  PROCESS_LOAD_DLL: crossLaneProcess(),
  PROCESS_LOAD_DRIVER: crossLaneProcess(),
  PROCESS_MODIFY_ACCOUNT: crossLaneProcess(),
  PROCESS_MOVE_FILE: crossLaneProcess(),
  PROCESS_OPEN_NAMED_EVENT: crossLaneProcess(),
  PROCESS_QUERY_DNS_NAME: crossLaneProcess(),
  PROCESS_QUERY_REGISTRY_VALUE: crossLaneProcess(),
  PROCESS_QUERY_WMI: crossLaneProcess(),
  PROCESS_READ_FILE: crossLaneProcess(),
  PROCESS_REMOVE_ACCOUNT_FROM_GROUP: crossLaneProcess(),
  PROCESS_RENAME_FILE: crossLaneProcess(),
  PROCESS_RENAME_REGISTRY_KEY: crossLaneProcess(),
  PROCESS_RESET_ACCOUNT_PASSWORD: crossLaneProcess(),
  PROCESS_SET_FILE_EA: crossLaneProcess(),
  PROCESS_SET_MESSAGE_HOOK: crossLaneProcess(),
  PROCESS_SET_REGISTRY_VALUE: crossLaneProcess(),
  PROCESS_SET_TOKEN: crossLaneProcess(),
  PROCESS_START_SERVICE: crossLaneProcess(),
  PROCESS_STEAL_CREDENTIALS: crossLaneProcess(),
  PROCESS_STOP_SERVICE: crossLaneProcess(),
  PROCESS_TERMINATE_PROCESS: smoothProcess(),
  PROCESS_TOUCH_MBR: crossLaneProcess(),
  PROCESS_WRITE_FILE: crossLaneProcess(),
  REGISTRY_KEY_RENAME_TO: smoothStructure(),
  SERVICE_IMAGE_MATCH_FILE: crossLaneAssociation(),
  TARGET_REMOTE_HOST: crossLaneAssociation(),
  TASK_IMAGE_MATCH_FILE: crossLaneAssociation(),
  URL_DOWNLOAD_TO_FILE: crossLaneAssociation(),
  WMI_FILTER_BIND_CONSUMER: smoothStructure(),
};

export function getAttackGraphEdgeRoutingRule(
  relationType: string | null | undefined,
  sourceNode?: AttackGraphRoutingNodeLike,
  targetNode?: AttackGraphRoutingNodeLike,
): AttackGraphResolvedEdgeRoutingRule {
  const normalized = String(relationType ?? "").trim();
  const baseRule =
    normalized in ATTACK_GRAPH_EDGE_ROUTING_RULES
      ? ATTACK_GRAPH_EDGE_ROUTING_RULES[
          normalized as AttackGraphRelationType
        ]
      : fallbackRoutingRule(normalized);
  const sourceLane = sourceNode
    ? getAttackGraphNodeLayoutRule(sourceNode.entityType).lane
    : "unknown";
  const targetLane = targetNode
    ? getAttackGraphNodeLayoutRule(targetNode.entityType).lane
    : "unknown";
  const selfLoop =
    Boolean(sourceNode?.id && targetNode?.id) && sourceNode?.id === targetNode?.id;
  const sameLane = sourceLane === targetLane;

  if (selfLoop) {
    return {
      ...baseRule,
      route: "loop",
      labelPlacement: "target-side",
      parallelStrategy: "spread-loop",
      sourceLane,
      targetLane,
      sameLane,
      selfLoop,
    };
  }

  if (
    baseRule.allowStraightOnlyWhenSameLane &&
    !sameLane &&
    baseRule.route === "straight"
  ) {
    return {
      ...baseRule,
      route: "orthogonal",
      labelPlacement: "horizontal-segment",
      sourceLane,
      targetLane,
      sameLane,
      selfLoop,
    };
  }

  return {
    ...baseRule,
    sourceLane,
    targetLane,
    sameLane,
    selfLoop,
  };
}

export function getAttackGraphRoutingCoverageReport(): AttackGraphRoutingCoverageReport {
  const expectedRelationTypes = new Set<string>(ATTACK_GRAPH_RELATION_TYPES);
  const configuredRelationTypes = new Set<string>(
    Object.keys(ATTACK_GRAPH_EDGE_ROUTING_RULES),
  );

  return {
    relationTypeCount: expectedRelationTypes.size,
    missingRelationTypes: diffSets(expectedRelationTypes, configuredRelationTypes),
    extraRelationTypes: diffSets(configuredRelationTypes, expectedRelationTypes),
  };
}

function primaryProcessChain(): AttackGraphEdgeRoutingRule {
  return {
    route: "straight",
    labelPlacement: "center",
    avoidDiagonal: false,
    allowStraightOnlyWhenSameLane: true,
    allowStraightOnlyWhenShort: true,
    parallelStrategy: "offset",
  };
}

function smoothProcess(): AttackGraphEdgeRoutingRule {
  return {
    route: "smooth",
    labelPlacement: "source-side",
    avoidDiagonal: false,
    allowStraightOnlyWhenSameLane: false,
    allowStraightOnlyWhenShort: false,
    parallelStrategy: "offset",
  };
}

function crossLaneProcess(): AttackGraphEdgeRoutingRule {
  return {
    route: "orthogonal",
    labelPlacement: "horizontal-segment",
    avoidDiagonal: true,
    allowStraightOnlyWhenSameLane: false,
    allowStraightOnlyWhenShort: false,
    parallelStrategy: "bundle",
  };
}

function straightStructure(): AttackGraphEdgeRoutingRule {
  return {
    route: "straight",
    labelPlacement: "center",
    avoidDiagonal: false,
    allowStraightOnlyWhenSameLane: true,
    allowStraightOnlyWhenShort: true,
    parallelStrategy: "offset",
  };
}

function smoothStructure(): AttackGraphEdgeRoutingRule {
  return {
    route: "smooth",
    labelPlacement: "center",
    avoidDiagonal: false,
    allowStraightOnlyWhenSameLane: true,
    allowStraightOnlyWhenShort: false,
    parallelStrategy: "offset",
  };
}

function crossLaneAssociation(): AttackGraphEdgeRoutingRule {
  return {
    route: "orthogonal",
    labelPlacement: "horizontal-segment",
    avoidDiagonal: true,
    allowStraightOnlyWhenSameLane: false,
    allowStraightOnlyWhenShort: false,
    parallelStrategy: "bundle",
  };
}

function hiddenStructure(): AttackGraphEdgeRoutingRule {
  return {
    route: "straight",
    labelPlacement: "center",
    avoidDiagonal: false,
    allowStraightOnlyWhenSameLane: false,
    allowStraightOnlyWhenShort: true,
    parallelStrategy: "offset",
  };
}

function fallbackRoutingRule(
  relationType: string,
): AttackGraphEdgeRoutingRule {
  const layoutRule = getAttackGraphRelationLayoutRule(relationType);
  if (layoutRule.preferStraightChain) {
    return straightStructure();
  }
  if (layoutRule.role === "primary-process-chain") {
    return primaryProcessChain();
  }
  if (layoutRule.role === "resource-structure-chain") {
    return smoothStructure();
  }
  return crossLaneAssociation();
}

function diffSets(left: Set<string>, right: Set<string>): string[] {
  return [...left].filter((value) => !right.has(value)).sort();
}
