import {
  getAttackGraphEdgeKind,
  type AttackGraphRelationType,
  RELATION_TYPE_TO_EDGE_KIND,
} from "./attack-graph-edge-types";
import { getAttackGraphNodePresentationKind } from "./attack-graph-node-types";
import type {
  AttackGraphEdgeModel,
  AttackGraphModel,
  AttackGraphNodeModel,
  GraphCaseEdgeDto,
  GraphCaseNodeDto,
  GraphCaseResponseDto,
} from "./attack-graph-data";

export interface BuildAttackGraphModelOptions {
  includeMissingEndpointNodes?: boolean;
}

const DEFAULT_OPTIONS: Required<BuildAttackGraphModelOptions> = {
  includeMissingEndpointNodes: true,
};

export function buildAttackGraphModel(
  response: GraphCaseResponseDto,
  options: BuildAttackGraphModelOptions = {},
): AttackGraphModel {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const rawNodes = Array.isArray(response.nodes) ? response.nodes : [];
  const rawEdges = Array.isArray(response.edges) ? response.edges : [];

  const nodesByKey = new Map<string, AttackGraphNodeModel>();
  let duplicateNodeCount = 0;
  for (const rawNode of rawNodes) {
    const node = normalizeNode(rawNode);
    if (!node) {
      continue;
    }
    if (nodesByKey.has(node.key)) {
      duplicateNodeCount += 1;
    }
    nodesByKey.set(node.key, node);
  }

  const edgesById = new Map<string, AttackGraphEdgeModel>();
  let duplicateEdgeCount = 0;
  let skippedEdgeCount = 0;
  let missingEndpointNodeCount = 0;

  for (const rawEdge of rawEdges) {
    const edge = normalizeEdge(rawEdge);
    if (!edge) {
      skippedEdgeCount += 1;
      continue;
    }

    if (mergedOptions.includeMissingEndpointNodes) {
      if (!nodesByKey.has(edge.source)) {
        nodesByKey.set(edge.source, buildMissingEndpointNode(edge.source));
        missingEndpointNodeCount += 1;
      }
      if (!nodesByKey.has(edge.target)) {
        nodesByKey.set(edge.target, buildMissingEndpointNode(edge.target));
        missingEndpointNodeCount += 1;
      }
    }

    if (edgesById.has(edge.id)) {
      duplicateEdgeCount += 1;
    }
    edgesById.set(edge.id, edge);
  }

  return {
    requestId: stringValue(response.request_id),
    tenantId: stringValue(response.tenant_id),
    caseId: stringValue(response.case_id),
    startTime: stringValue(response.start_time),
    endTime: stringValue(response.end_time),
    nodes: [...nodesByKey.values()],
    edges: [...edgesById.values()],
    diagnostics: {
      inputNodeCount: rawNodes.length,
      inputEdgeCount: rawEdges.length,
      returnedNodeCount: nodesByKey.size,
      returnedEdgeCount: edgesById.size,
      missingEndpointNodeCount,
      duplicateNodeCount,
      duplicateEdgeCount,
      skippedEdgeCount,
    },
  };
}

export function isKnownAttackGraphRelationType(
  relationType: string | null | undefined,
): relationType is AttackGraphRelationType {
  return stringValue(relationType) in RELATION_TYPE_TO_EDGE_KIND;
}

function normalizeNode(rawNode: GraphCaseNodeDto): AttackGraphNodeModel | null {
  const key = stringValue(rawNode.key);
  if (!key) {
    return null;
  }

  const entityType = stringValue(rawNode.entity_type);
  const properties = normalizeProperties(rawNode.properties);
  const displayName = pickDisplayName(rawNode.display_name, properties, key);

  return {
    id: key,
    key,
    entityType,
    displayName,
    presentationKind: getAttackGraphNodePresentationKind(entityType),
    properties,
  };
}

function normalizeEdge(rawEdge: GraphCaseEdgeDto): AttackGraphEdgeModel | null {
  const relationType = stringValue(rawEdge.relation_type);
  const source = stringValue(rawEdge.source_key);
  const target = stringValue(rawEdge.target_key);
  if (!relationType || !source || !target) {
    return null;
  }

  const scopeType = stringValue(rawEdge.scope_type);
  const scopeId = stringValue(rawEdge.scope_id);
  const edgeKey = stringValue(rawEdge.edge_key);
  const graphOrigin = stringValue(rawEdge.graph_origin);

  return {
    id: buildEdgeId({
      scopeType,
      scopeId,
      relationType,
      source,
      target,
      edgeKey,
      graphOrigin,
    }),
    scopeType,
    scopeId,
    relationType,
    edgeKind: getAttackGraphEdgeKind(relationType),
    source,
    target,
    edgeKey,
    graphOrigin,
    properties: normalizeProperties(rawEdge.properties),
  };
}

function buildMissingEndpointNode(key: string): AttackGraphNodeModel {
  return {
    id: key,
    key,
    entityType: "",
    displayName: key,
    presentationKind: "unknown",
    properties: {},
    missingFromResponse: true,
  };
}

function buildEdgeId(input: {
  scopeType: string;
  scopeId: string;
  relationType: string;
  source: string;
  target: string;
  edgeKey: string;
  graphOrigin: string;
}) {
  return [
    input.scopeType,
    input.scopeId,
    input.relationType,
    input.source,
    input.target,
    input.edgeKey,
    input.graphOrigin,
  ].join("|");
}

function normalizeProperties(
  properties: Record<string, string> | undefined,
): Record<string, string> {
  const normalized: Record<string, string> = {};
  if (!properties) {
    return normalized;
  }
  for (const [key, value] of Object.entries(properties)) {
    const normalizedKey = stringValue(key);
    if (!normalizedKey) {
      continue;
    }
    normalized[normalizedKey] = String(value ?? "");
  }
  return normalized;
}

function pickDisplayName(
  explicitName: string | undefined,
  properties: Record<string, string>,
  fallback: string,
): string {
  const candidates = [
    explicitName,
    properties.display_name,
    properties.name,
    properties.process_name,
    properties.computer_name,
    properties.device_description,
    properties.service_name,
    properties.job_name,
    properties.task_name,
    properties.user_name,
    properties.group_name,
    properties.class_name,
    properties.url,
    properties.path,
    properties.file_name,
    properties.org_file_name,
    properties.object_name,
    properties.query,
  ];
  for (const candidate of candidates) {
    const value = stringValue(candidate);
    if (value) {
      return value;
    }
  }
  return fallback;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

