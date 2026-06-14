import type { AttackGraphEdgeModel } from "../core/attack-graph-data";
import type {
  AttackGraphDetailCardConfig,
  AttackGraphDetailData,
} from "./attack-graph-detail-config-types";

export function buildAttackGraphEdgeDetailCardConfig(
  label: string,
): AttackGraphDetailCardConfig {
  return {
    header: {
      icon: "GitBranch",
      title: {
        key: "relation_type",
        fallback: label,
      },
      fields: [
        { key: "source_label", label: "Source", icon: "Server" },
        { key: "target_label", label: "Target", icon: "Server" },
      ],
    },
    sections: [
      {
        title: "Edge Information",
        icon: "GitBranch",
        tone: "slate",
        fields: [
          {
            key: "relation_type",
            label: "Relation Type",
            icon: "Network",
            mono: true,
            copyable: true,
          },
          {
            key: "source",
            label: "Source Key",
            icon: "Key",
            mono: true,
            copyable: true,
          },
          {
            key: "target",
            label: "Target Key",
            icon: "Key",
            mono: true,
            copyable: true,
          },
          { key: "scope_type", label: "Scope Type", icon: "BadgeInfo", mono: true },
          {
            key: "scope_id",
            label: "Scope ID",
            icon: "Hash",
            mono: true,
            copyable: true,
          },
          {
            key: "edge_key",
            label: "Edge Key",
            icon: "Key",
            mono: true,
            copyable: true,
          },
          { key: "graph_origin", label: "Graph Origin", icon: "Info", mono: true },
        ],
      },
    ],
  };
}

export function toAttackGraphEdgeDetailData(
  edge: AttackGraphEdgeModel,
  sourceLabel: string,
  targetLabel: string,
): AttackGraphDetailData {
  return {
    ...edge.properties,
    edge_key: edge.edgeKey,
    graph_origin: edge.graphOrigin,
    id: edge.id,
    relation_type: edge.relationType,
    scope_id: edge.scopeId,
    scope_type: edge.scopeType,
    source: edge.source,
    source_label: sourceLabel,
    target: edge.target,
    target_label: targetLabel,
  };
}
