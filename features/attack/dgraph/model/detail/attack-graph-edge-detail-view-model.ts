import type {
  AttackGraphEdgeModel,
  AttackGraphNodeModel,
} from "../core/attack-graph-data";
import {
  getAttackGraphRelationLabel,
  toAttackGraphEdgeVisualData,
  type AttackGraphEdgeVisualData,
} from "../edge/attack-graph-edge-config";
import type { AttackGraphEdgeKind } from "../edge/attack-graph-edge-types";
import { getAttackGraphNodeKindConfig } from "../node/attack-graph-node-config";
import type { AttackGraphNodePresentationKind } from "../node/attack-graph-node-types";
import type { AttackGraphDetailIconName } from "./attack-graph-detail-config-types";
import { getAttackGraphNodeSummary } from "./attack-graph-node-detail-config";
import type { AttackGraphPresentationTone } from "./attack-graph-detail-types";

export interface AttackGraphEdgeDetailNodeViewModel {
  entityType: string;
  fullName: string;
  icon: AttackGraphDetailIconName;
  key: string;
  kind: string;
  name: string;
  tone: AttackGraphPresentationTone;
}

export interface AttackGraphEdgeDetailRelationRow {
  boxed?: boolean;
  key: string;
  label: string;
  value: string;
}

export interface AttackGraphEdgeDetailViewModel {
  edgeId: string;
  edgeTone: AttackGraphPresentationTone;
  relationLabel: string;
  relationRows: AttackGraphEdgeDetailRelationRow[];
  relationType: string;
  sentenceAction: string;
  source: AttackGraphEdgeDetailNodeViewModel;
  target: AttackGraphEdgeDetailNodeViewModel;
  title: string;
  titleTooltip: string;
  visual: AttackGraphEdgeVisualData;
}

export function buildAttackGraphEdgeDetailViewModel(
  edge: AttackGraphEdgeModel,
  nodesById?: Map<string, AttackGraphNodeModel>,
): AttackGraphEdgeDetailViewModel {
  const source = buildEdgeDetailNodeViewModel(
    nodesById?.get(edge.source),
    edge.source,
  );
  const target = buildEdgeDetailNodeViewModel(
    nodesById?.get(edge.target),
    edge.target,
  );
  const visual = toAttackGraphEdgeVisualData({
    edgeKey: edge.edgeKey,
    graphOrigin: edge.graphOrigin,
    properties: edge.properties,
    relationType: edge.relationType,
  });
  const relationLabel = getAttackGraphRelationLabel(edge.relationType);

  return {
    edgeId: edge.id,
    edgeTone: getAttackGraphEdgePresentationTone(visual.kind),
    relationLabel,
    relationRows: buildRelationRows(edge),
    relationType: edge.relationType,
    sentenceAction: relationLabel.trim() || "linked to",
    source,
    target,
    title: `${source.name || "-"} -> ${target.name || "-"}`,
    titleTooltip: `${source.fullName} -> ${target.fullName}`,
    visual,
  };
}

export function getAttackGraphEdgePresentationTone(
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

function buildEdgeDetailNodeViewModel(
  node: AttackGraphNodeModel | undefined,
  fallbackKey: string,
): AttackGraphEdgeDetailNodeViewModel {
  if (!node) {
    return {
      entityType: "",
      fullName: fallbackKey,
      icon: "Server",
      key: fallbackKey,
      kind: "Node",
      name: fallbackKey,
      tone: "slate",
    };
  }

  const summary = getAttackGraphNodeSummary({
    displayName: node.displayName,
    entityType: node.entityType,
    evidenceHit: node.evidenceHit,
    isNew: node.isNew,
    key: node.key,
    missingFromResponse: node.missingFromResponse,
    properties: node.properties,
  });
  const kindConfig = getAttackGraphNodeKindConfig(node.presentationKind);

  return {
    entityType: node.entityType,
    fullName: node.displayName || summary.title || node.key,
    icon: getNodeDetailIcon(node.presentationKind),
    key: node.key,
    kind: kindConfig.label || summary.subtitle || node.entityType || "Node",
    name: summary.title || node.displayName || node.key,
    tone: getNodeDetailTone(node.presentationKind),
  };
}

function buildRelationRows(
  edge: AttackGraphEdgeModel,
): AttackGraphEdgeDetailRelationRow[] {
  const rows: AttackGraphEdgeDetailRelationRow[] = [
    {
      key: "relation_type",
      label: "Relation Type",
      value: edge.relationType,
    },
    {
      key: "source_key",
      label: "Source Key",
      value: edge.source,
      boxed: true,
    },
    {
      key: "target_key",
      label: "Target Key",
      value: edge.target,
      boxed: true,
    },
    {
      key: "graph_origin",
      label: "Graph Origin",
      value: edge.graphOrigin,
    },
    {
      key: "scope_type",
      label: "Scope Type",
      value: edge.scopeType,
    },
    {
      key: "scope_id",
      label: "Scope ID",
      value: edge.scopeId,
      boxed: true,
    },
    {
      key: "edge_key",
      label: "Edge Key",
      value: edge.edgeKey,
      boxed: true,
    },
  ];

  return rows.filter((row) => stringValue(row.value).length > 0);
}

function getNodeDetailIcon(
  kind: AttackGraphNodePresentationKind,
): AttackGraphDetailIconName {
  const family = getAttackGraphNodeKindConfig(kind).family;
  if (family === "process") {
    return "Terminal";
  }
  if (family === "file" || family === "registry") {
    return "FileText";
  }
  if (family === "network") {
    return "Network";
  }
  if (family === "identity") {
    return "User";
  }
  if (family === "security" || family === "evidence") {
    return "Shield";
  }
  if (family === "persistence" || family === "ipc") {
    return "GitBranch";
  }
  return "Server";
}

function getNodeDetailTone(
  kind: AttackGraphNodePresentationKind,
): AttackGraphPresentationTone {
  const family = getAttackGraphNodeKindConfig(kind).family;
  if (family === "process") {
    return "cyan";
  }
  if (family === "network" || family === "host" || family === "identity") {
    return "blue";
  }
  if (family === "file") {
    return "amber";
  }
  if (family === "registry" || family === "persistence") {
    return "purple";
  }
  if (family === "security" || family === "evidence") {
    return "red";
  }
  return "slate";
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
