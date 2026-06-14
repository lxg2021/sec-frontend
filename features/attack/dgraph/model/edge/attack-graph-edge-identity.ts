import type { GraphCaseEdgeDto } from "../core/attack-graph-data";

export interface AttackGraphEdgeSemanticKeyInput {
  relationType?: string | null;
  source?: string | null;
  target?: string | null;
}

export function buildAttackGraphEdgeSemanticKey({
  relationType,
  source,
  target,
}: AttackGraphEdgeSemanticKeyInput) {
  const normalizedRelationType = normalizeKeyPart(relationType);
  const normalizedSource = normalizeKeyPart(source);
  const normalizedTarget = normalizeKeyPart(target);

  if (!normalizedRelationType || !normalizedSource || !normalizedTarget) {
    return "";
  }

  return [normalizedRelationType, normalizedSource, normalizedTarget].join("|");
}

export function getGraphCaseEdgeSemanticKey(edge: GraphCaseEdgeDto) {
  return buildAttackGraphEdgeSemanticKey({
    relationType: edge.relation_type,
    source: edge.source_key,
    target: edge.target_key,
  });
}

function normalizeKeyPart(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}
