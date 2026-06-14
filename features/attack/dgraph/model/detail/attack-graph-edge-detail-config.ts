import {
  getAttackGraphEdgePresentation,
  getAttackGraphRelationLabel,
} from "../edge/attack-graph-edge-config";
import type { AttackGraphEdgeKind } from "../edge/attack-graph-edge-types";
import type {
  AttackGraphBadge,
  AttackGraphDetailField,
  AttackGraphEdgeSummary,
  AttackGraphPresentationTone,
} from "./attack-graph-detail-types";

export interface AttackGraphEdgeDetailInput {
  id?: string | null;
  relationType: string | null | undefined;
  edgeKey?: string | null;
  graphOrigin?: string | null;
  scopeType?: string | null;
  scopeId?: string | null;
  source?: string | null;
  sourceLabel?: string | null;
  target?: string | null;
  targetLabel?: string | null;
  properties?: Record<string, string> | null;
}

interface NormalizedAttackGraphEdgeDetailInput {
  id: string;
  relationType: string;
  edgeKey: string;
  graphOrigin: string;
  scopeType: string;
  scopeId: string;
  source: string;
  sourceLabel: string;
  target: string;
  targetLabel: string;
  properties: Record<string, string>;
}

export function getAttackGraphEdgeSummary(
  input: AttackGraphEdgeDetailInput,
): AttackGraphEdgeSummary {
  const normalized = normalizeEdgeDetailInput(input);
  const presentation = getAttackGraphEdgePresentation(normalized.relationType);
  const label = getAttackGraphRelationLabel(normalized.relationType);
  const description = buildEdgeSummaryDescription(normalized, presentation.label);
  return {
    label,
    description,
    badges: buildEdgeBadges(normalized, presentation.kind, presentation.label),
    fields: getAttackGraphEdgeDetailFields(normalized),
  };
}

export function getAttackGraphEdgeDetailFields(
  input: AttackGraphEdgeDetailInput,
): AttackGraphDetailField[] {
  const normalized = normalizeEdgeDetailInput(input);
  const fields: AttackGraphDetailField[] = [];
  const added = new Set<string>();

  addEdgeDetailField(fields, added, {
    key: "relation_type",
    label: "Relation Type",
    value: normalized.relationType,
    mono: true,
    copyable: true,
    important: true,
  });
  addEdgeDetailField(fields, added, {
    key: "source_label",
    label: "Source Node",
    value: normalized.sourceLabel,
    copyable: true,
    important: true,
  });
  addEdgeDetailField(fields, added, {
    key: "source",
    label: "Source Key",
    value: normalized.source,
    mono: true,
    copyable: true,
    important: !normalized.sourceLabel,
  });
  addEdgeDetailField(fields, added, {
    key: "target_label",
    label: "Target Node",
    value: normalized.targetLabel,
    copyable: true,
    important: true,
  });
  addEdgeDetailField(fields, added, {
    key: "target",
    label: "Target Key",
    value: normalized.target,
    mono: true,
    copyable: true,
    important: !normalized.targetLabel,
  });
  addEdgeDetailField(fields, added, {
    key: "scope_type",
    label: "Scope Type",
    value: normalized.scopeType,
    mono: true,
    copyable: true,
  });
  addEdgeDetailField(fields, added, {
    key: "scope_id",
    label: "Scope ID",
    value: normalized.scopeId,
    mono: true,
    copyable: true,
  });
  addEdgeDetailField(fields, added, {
    key: "edge_key",
    label: "Edge Key",
    value: normalized.edgeKey,
    mono: true,
    copyable: true,
  });
  addEdgeDetailField(fields, added, {
    key: "graph_origin",
    label: "Graph Origin",
    value: normalized.graphOrigin,
    mono: true,
    copyable: true,
  });

  for (const [key, value] of Object.entries(normalized.properties).sort()) {
    if (fields.length >= 18) {
      break;
    }
    addEdgeDetailField(fields, added, {
      key,
      label: toFieldLabel(key),
      value,
      mono: isMonoEdgeField(key),
      copyable: isCopyableEdgeField(key),
    });
  }

  addEdgeDetailField(fields, added, {
    key: "id",
    label: "Edge ID",
    value: normalized.id,
    mono: true,
    copyable: true,
  });

  return fields;
}

function normalizeEdgeDetailInput(
  input: AttackGraphEdgeDetailInput,
): NormalizedAttackGraphEdgeDetailInput {
  return {
    id: stringValue(input.id),
    relationType: stringValue(input.relationType),
    edgeKey: stringValue(input.edgeKey),
    graphOrigin: stringValue(input.graphOrigin),
    scopeType: stringValue(input.scopeType),
    scopeId: stringValue(input.scopeId),
    source: stringValue(input.source),
    sourceLabel: stringValue(input.sourceLabel),
    target: stringValue(input.target),
    targetLabel: stringValue(input.targetLabel),
    properties: normalizeStringRecord(input.properties),
  };
}

function buildEdgeSummaryDescription(
  input: NormalizedAttackGraphEdgeDetailInput,
  fallback: string,
) {
  const source = input.sourceLabel || input.source;
  const target = input.targetLabel || input.target;
  if (source && target) {
    return `${source} -> ${target}`;
  }
  return fallback;
}

function buildEdgeBadges(
  input: NormalizedAttackGraphEdgeDetailInput,
  kind: AttackGraphEdgeKind,
  kindLabel: string,
): AttackGraphBadge[] {
  const badges: AttackGraphBadge[] = [
    {
      key: "edge-kind",
      label: kindLabel,
      tone: getEdgePresentationTone(kind),
    },
  ];

  if (input.graphOrigin) {
    badges.push({
      key: "graph-origin",
      label: input.graphOrigin,
      tone: "slate",
      title: "Graph origin",
    });
  }

  if (input.scopeType) {
    badges.push({
      key: "scope-type",
      label: input.scopeType,
      tone: "slate",
      title: "Scope type",
    });
  }

  return badges;
}

function getEdgePresentationTone(
  kind: AttackGraphEdgeKind,
): AttackGraphPresentationTone {
  if (kind === "security-impact" || kind === "process-execution") {
    return "red";
  }
  if (kind === "network-activity") {
    return "cyan";
  }
  if (kind === "file-activity") {
    return "amber";
  }
  if (kind === "registry-activity" || kind === "persistence") {
    return "purple";
  }
  if (kind === "account-activity" || kind === "process-access") {
    return "blue";
  }
  return "slate";
}

function addEdgeDetailField(
  fields: AttackGraphDetailField[],
  added: Set<string>,
  field: AttackGraphDetailField,
) {
  const value = stringValue(field.value);
  if (!value || added.has(field.key)) {
    return;
  }
  fields.push({
    ...field,
    value,
  });
  added.add(field.key);
}

function toFieldLabel(key: string) {
  return key
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isMonoEdgeField(key: string) {
  return /(^|_)(id|key|hash|md5|sha1|sha256|fingerprint|guid)($|_)/i.test(key);
}

function isCopyableEdgeField(key: string) {
  return isMonoEdgeField(key) || key.includes("name") || key.includes("path");
}

function normalizeStringRecord(
  value: Record<string, string> | null | undefined,
): Record<string, string> {
  if (!value) {
    return {};
  }

  return Object.entries(value).reduce<Record<string, string>>(
    (record, [key, item]) => {
      const normalizedKey = stringValue(key);
      const normalizedValue = stringValue(item);
      if (normalizedKey && normalizedValue) {
        record[normalizedKey] = normalizedValue;
      }
      return record;
    },
    {},
  );
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
