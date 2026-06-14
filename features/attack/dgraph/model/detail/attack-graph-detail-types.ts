export type AttackGraphPresentationTone =
  | "slate"
  | "blue"
  | "cyan"
  | "green"
  | "amber"
  | "orange"
  | "red"
  | "purple"
  | "pink";

export interface AttackGraphBadge {
  key: string;
  label: string;
  tone?: AttackGraphPresentationTone;
  title?: string;
}

export interface AttackGraphDetailField {
  key: string;
  label: string;
  value: string;
  tone?: AttackGraphPresentationTone;
  mono?: boolean;
  copyable?: boolean;
  important?: boolean;
}

export interface AttackGraphNodeSummary {
  title: string;
  subtitle?: string;
  description?: string;
  badges: AttackGraphBadge[];
  fields: AttackGraphDetailField[];
}

export interface AttackGraphEdgeSummary {
  label: string;
  description?: string;
  badges: AttackGraphBadge[];
  fields: AttackGraphDetailField[];
}
