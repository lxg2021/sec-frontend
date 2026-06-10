import type { CSSProperties } from "react";

import type { AttackGraphEdgeKind } from "./attack-graph-edge-types";
import { getAttackGraphEdgeKind } from "./attack-graph-edge-types";

export interface AttackGraphEdgePresentation {
  kind: AttackGraphEdgeKind;
  label: string;
  color: string;
  width: number;
  priority: number;
  animated: boolean;
  strokeDasharray?: string;
  opacity: number;
}

export const ATTACK_GRAPH_EDGE_PRESENTATIONS: Record<
  AttackGraphEdgeKind,
  AttackGraphEdgePresentation
> = {
  "case-structure": {
    kind: "case-structure",
    label: "Case Structure",
    color: "#64748b",
    width: 1.4,
    priority: 30,
    animated: false,
    opacity: 0.72,
  },
  "evidence-link": {
    kind: "evidence-link",
    label: "Evidence Link",
    color: "#e11d48",
    width: 1.8,
    priority: 88,
    animated: false,
    strokeDasharray: "5 4",
    opacity: 0.82,
  },
  "process-execution": {
    kind: "process-execution",
    label: "Execution",
    color: "#dc2626",
    width: 2.2,
    priority: 96,
    animated: false,
    opacity: 0.9,
  },
  "process-access": {
    kind: "process-access",
    label: "Process Access",
    color: "#f97316",
    width: 2,
    priority: 86,
    animated: false,
    opacity: 0.86,
  },
  "file-activity": {
    kind: "file-activity",
    label: "File Activity",
    color: "#d97706",
    width: 1.8,
    priority: 64,
    animated: false,
    opacity: 0.78,
  },
  "registry-activity": {
    kind: "registry-activity",
    label: "Registry",
    color: "#7c3aed",
    width: 1.8,
    priority: 68,
    animated: false,
    opacity: 0.78,
  },
  "network-activity": {
    kind: "network-activity",
    label: "Network",
    color: "#0891b2",
    width: 1.8,
    priority: 72,
    animated: false,
    opacity: 0.8,
  },
  "account-activity": {
    kind: "account-activity",
    label: "Account",
    color: "#4f46e5",
    width: 1.8,
    priority: 74,
    animated: false,
    opacity: 0.8,
  },
  persistence: {
    kind: "persistence",
    label: "Persistence",
    color: "#9333ea",
    width: 1.9,
    priority: 82,
    animated: false,
    opacity: 0.82,
  },
  "ipc-activity": {
    kind: "ipc-activity",
    label: "IPC",
    color: "#475569",
    width: 1.6,
    priority: 56,
    animated: false,
    opacity: 0.7,
  },
  "security-impact": {
    kind: "security-impact",
    label: "Security Impact",
    color: "#be123c",
    width: 2.2,
    priority: 94,
    animated: false,
    opacity: 0.9,
  },
  association: {
    kind: "association",
    label: "Association",
    color: "#71717a",
    width: 1.4,
    priority: 34,
    animated: false,
    strokeDasharray: "4 4",
    opacity: 0.62,
  },
  unknown: {
    kind: "unknown",
    label: "Unknown",
    color: "#737373",
    width: 1.2,
    priority: 1,
    animated: false,
    strokeDasharray: "3 5",
    opacity: 0.55,
  },
};

export function getAttackGraphEdgePresentation(
  relationType: string | null | undefined,
): AttackGraphEdgePresentation {
  return ATTACK_GRAPH_EDGE_PRESENTATIONS[getAttackGraphEdgeKind(relationType)];
}

export function getAttackGraphEdgeStyle(
  relationType: string | null | undefined,
  options?: {
    dimmed?: boolean;
    highlighted?: boolean;
  },
): CSSProperties {
  const presentation = getAttackGraphEdgePresentation(relationType);
  const highlighted = options?.highlighted === true;
  const dimmed = options?.dimmed === true && !highlighted;

  return {
    stroke: presentation.color,
    strokeWidth: highlighted ? presentation.width + 1 : presentation.width,
    strokeDasharray: presentation.strokeDasharray,
    opacity: dimmed ? Math.min(presentation.opacity, 0.28) : presentation.opacity,
  };
}

