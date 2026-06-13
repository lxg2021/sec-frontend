import {
  getAttackGraphEdgeKind,
  type AttackGraphRelationType,
  RELATION_TYPE_TO_EDGE_KIND,
} from "./attack-graph-edge-types";
import { getAttackGraphNodePresentationKind } from "./attack-graph-node-types";
import { buildAttackGraphEdgeSemanticKey } from "./attack-graph-edge-identity";
import type {
  AttackGraphEdgeModel,
  AttackGraphEvidenceRef,
  AttackGraphModel,
  AttackGraphNodeModel,
  GraphCaseEdgeDto,
  GraphCaseNodeDto,
  GraphCaseResponseDto,
} from "./attack-graph-data";

export interface BuildAttackGraphModelOptions {
  includeMissingEndpointNodes?: boolean;
  hideCaseStructure?: boolean;
}

const DEFAULT_OPTIONS: Required<BuildAttackGraphModelOptions> = {
  includeMissingEndpointNodes: true,
  hideCaseStructure: true,
};

const CASE_ENTITY_TYPES = new Set([
  "AttackCase",
  "AttackCaseGroup",
  "AttackCaseInstance",
  "AttackCaseEvidence",
]);

const CASE_STRUCTURE_RELATION_TYPES = new Set([
  "CASE_HAS_GROUP",
  "GROUP_HAS_INSTANCE",
  "INSTANCE_HAS_EVIDENCE",
  "EVIDENCE_REFER_ENTITY",
]);

export function buildAttackGraphModel(
  response: GraphCaseResponseDto,
  options: BuildAttackGraphModelOptions = {},
): AttackGraphModel {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const rawNodes = Array.isArray(response.nodes) ? response.nodes : [];
  const rawEdges = Array.isArray(response.edges) ? response.edges : [];
  const rawNodeTypeByKey = new Map<string, string>();
  for (const rawNode of rawNodes) {
    const key = stringValue(rawNode.key);
    if (key) {
      rawNodeTypeByKey.set(key, stringValue(rawNode.entity_type));
    }
  }
  const evidenceRefsByTarget = collectEvidenceRefsByTarget(
    rawEdges,
    rawNodeTypeByKey,
  );

  const nodesByKey = new Map<string, AttackGraphNodeModel>();
  let duplicateNodeCount = 0;
  let hiddenCaseNodeCount = 0;
  for (const rawNode of rawNodes) {
    const node = normalizeNode(rawNode);
    if (!node) {
      continue;
    }
    if (mergedOptions.hideCaseStructure && isCaseEntityType(node.entityType)) {
      hiddenCaseNodeCount += 1;
      continue;
    }
    applyEvidenceRefs(node, evidenceRefsByTarget.get(node.key));
    if (nodesByKey.has(node.key)) {
      duplicateNodeCount += 1;
    }
    nodesByKey.set(node.key, node);
  }

  const edgesById = new Map<string, AttackGraphEdgeModel>();
  let duplicateEdgeCount = 0;
  let skippedEdgeCount = 0;
  let missingEndpointNodeCount = 0;
  let hiddenCaseEdgeCount = 0;

  for (const rawEdge of rawEdges) {
    const edge = normalizeEdge(rawEdge);
    if (!edge) {
      skippedEdgeCount += 1;
      continue;
    }
    if (
      mergedOptions.hideCaseStructure &&
      isCaseStructureRelationType(edge.relationType)
    ) {
      hiddenCaseEdgeCount += 1;
      continue;
    }

    if (mergedOptions.includeMissingEndpointNodes) {
      if (!nodesByKey.has(edge.source)) {
        nodesByKey.set(
          edge.source,
          buildMissingEndpointNode(edge.source, evidenceRefsByTarget),
        );
        missingEndpointNodeCount += 1;
      }
      if (!nodesByKey.has(edge.target)) {
        nodesByKey.set(
          edge.target,
          buildMissingEndpointNode(edge.target, evidenceRefsByTarget),
        );
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
      hiddenCaseNodeCount,
      hiddenCaseEdgeCount,
      evidenceHitNodeCount: [...nodesByKey.values()].filter(
        (node) => node.evidenceHit,
      ).length,
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
    id: buildAttackGraphEdgeSemanticKey({
      relationType,
      source,
      target,
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

function buildMissingEndpointNode(
  key: string,
  evidenceRefsByTarget: Map<string, AttackGraphEvidenceRef[]> = new Map(),
): AttackGraphNodeModel {
  const node: AttackGraphNodeModel = {
    id: key,
    key,
    entityType: "",
    displayName: key,
    presentationKind: "unknown",
    properties: {},
    missingFromResponse: true,
  };
  applyEvidenceRefs(node, evidenceRefsByTarget.get(key));
  return node;
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

function collectEvidenceRefsByTarget(
  rawEdges: GraphCaseEdgeDto[],
  rawNodeTypeByKey: Map<string, string>,
): Map<string, AttackGraphEvidenceRef[]> {
  const refsByTarget = new Map<string, AttackGraphEvidenceRef[]>();
  for (const rawEdge of rawEdges) {
    const relationType = stringValue(rawEdge.relation_type);
    if (relationType !== "EVIDENCE_REFER_ENTITY") {
      continue;
    }

    const source = stringValue(rawEdge.source_key);
    const target = stringValue(rawEdge.target_key);
    if (!source || !target) {
      continue;
    }

    const sourceType = rawNodeTypeByKey.get(source);
    if (sourceType && sourceType !== "AttackCaseEvidence") {
      continue;
    }

    const refs = refsByTarget.get(target) ?? [];
    refs.push({
      evidenceKey: source,
      relationType,
      properties: normalizeProperties(rawEdge.properties),
    });
    refsByTarget.set(target, refs);
  }
  return refsByTarget;
}

function applyEvidenceRefs(
  node: AttackGraphNodeModel,
  evidenceRefs: AttackGraphEvidenceRef[] | undefined,
) {
  if (!evidenceRefs?.length) {
    return;
  }
  node.evidenceHit = true;
  node.evidenceRefs = evidenceRefs;
}

function isCaseEntityType(entityType: string) {
  return CASE_ENTITY_TYPES.has(entityType);
}

function isCaseStructureRelationType(relationType: string) {
  return CASE_STRUCTURE_RELATION_TYPES.has(relationType);
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
