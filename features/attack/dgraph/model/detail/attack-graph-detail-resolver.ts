import type {
  AttackGraphEdgeModel,
  AttackGraphNodeModel,
} from "../core/attack-graph-data";
import { getAttackGraphEdgeSummary } from "./attack-graph-edge-detail-config";
import type {
  AttackGraphEdgeSummary,
  AttackGraphNodeSummary,
} from "./attack-graph-detail-types";
import { getAttackGraphNodeSummary } from "./attack-graph-node-detail-config";

export function getAttackGraphSelectedNodeSummary(
  node: AttackGraphNodeModel,
): AttackGraphNodeSummary {
  return getAttackGraphNodeSummary({
    displayName: node.displayName,
    entityType: node.entityType,
    evidenceHit: node.evidenceHit,
    isNew: node.isNew,
    key: node.key,
    missingFromResponse: node.missingFromResponse,
    properties: node.properties,
  });
}

export function getAttackGraphSelectedEdgeSummary(
  edge: AttackGraphEdgeModel,
  nodesById: Map<string, AttackGraphNodeModel> | undefined,
): AttackGraphEdgeSummary {
  const sourceNode = nodesById?.get(edge.source);
  const targetNode = nodesById?.get(edge.target);

  return getAttackGraphEdgeSummary({
    edgeKey: edge.edgeKey,
    graphOrigin: edge.graphOrigin,
    id: edge.id,
    properties: edge.properties,
    relationType: edge.relationType,
    scopeId: edge.scopeId,
    scopeType: edge.scopeType,
    source: edge.source,
    sourceLabel: sourceNode
      ? getAttackGraphSelectedNodeSummary(sourceNode).title
      : edge.source,
    target: edge.target,
    targetLabel: targetNode
      ? getAttackGraphSelectedNodeSummary(targetNode).title
      : edge.target,
  });
}
