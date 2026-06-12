import type { AttackGraphEdgeKind } from "./attack-graph-edge-types";
import type { AttackGraphNodePresentationKind } from "./attack-graph-node-types";

export interface GraphCaseNodeDto {
  key?: string;
  entity_type?: string;
  display_name?: string;
  properties?: Record<string, string>;
}

export interface GraphCaseEdgeDto {
  scope_type?: string;
  scope_id?: string;
  relation_type?: string;
  source_key?: string;
  target_key?: string;
  edge_key?: string;
  graph_origin?: string;
  properties?: Record<string, string>;
}

export interface GraphCaseResponseDto {
  request_id?: string;
  tenant_id?: string;
  case_id?: string;
  start_time?: string;
  end_time?: string;
  nodes?: GraphCaseNodeDto[];
  edges?: GraphCaseEdgeDto[];
  diagnostics?: {
    node_count?: number;
    edge_count?: number;
  };
}

export interface AttackGraphNodeModel {
  id: string;
  key: string;
  entityType: string;
  displayName: string;
  presentationKind: AttackGraphNodePresentationKind;
  properties: Record<string, string>;
  evidenceHit?: boolean;
  evidenceRefs?: AttackGraphEvidenceRef[];
  isNew?: boolean;
  missingFromResponse?: boolean;
  position?: AttackGraphPoint;
}

export interface AttackGraphEvidenceRef {
  evidenceKey: string;
  relationType: string;
  properties: Record<string, string>;
}

export interface AttackGraphEdgeModel {
  id: string;
  scopeType: string;
  scopeId: string;
  relationType: string;
  edgeKind: AttackGraphEdgeKind;
  source: string;
  target: string;
  edgeKey: string;
  graphOrigin: string;
  properties: Record<string, string>;
}

export interface AttackGraphModel {
  requestId: string;
  tenantId: string;
  caseId: string;
  startTime: string;
  endTime: string;
  nodes: AttackGraphNodeModel[];
  edges: AttackGraphEdgeModel[];
  diagnostics: {
    inputNodeCount: number;
    inputEdgeCount: number;
    returnedNodeCount: number;
    returnedEdgeCount: number;
    missingEndpointNodeCount: number;
    hiddenCaseNodeCount: number;
    hiddenCaseEdgeCount: number;
    evidenceHitNodeCount: number;
    duplicateNodeCount: number;
    duplicateEdgeCount: number;
    skippedEdgeCount: number;
  };
}

export interface AttackGraphPoint {
  x: number;
  y: number;
}

export type AttackGraphLayoutStrategy = "lane" | "stable";

export type AttackGraphLayoutMode = "tiny" | "compact" | "lane";

export interface AttackGraphLayoutLaneBounds {
  height: number;
  y: number;
}

export interface AttackGraphLayoutSession {
  activeLaneIds: string[];
  caseId: string;
  hasEnteredLaneMode: boolean;
  laneBoundsById: Map<string, AttackGraphLayoutLaneBounds>;
  mode: AttackGraphLayoutMode;
  newNodeIds: Set<string>;
  nodeLaneIdById: Map<string, string>;
  nodePositionsById: Map<string, AttackGraphPoint>;
  stableCenterNodeId?: string;
  strategy: AttackGraphLayoutStrategy;
}

export interface AttackGraphLayoutOptions {
  direction?: "LR" | "TB";
  nodeWidth?: number;
  nodeHeight?: number;
  portY?: number;
  nodeSep?: number;
  rankSep?: number;
  session?: AttackGraphLayoutSession | null;
  strategy?: AttackGraphLayoutStrategy;
}

export interface AttackGraphLayoutResult extends AttackGraphModel {
  width: number;
  height: number;
  layoutMode: AttackGraphLayoutMode;
  layoutSession: AttackGraphLayoutSession;
  layoutStrategy: AttackGraphLayoutStrategy;
}
