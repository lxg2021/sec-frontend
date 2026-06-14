import type { ReactNode } from "react";

import type { AttackGraphPresentationTone } from "./attack-graph-detail-types";

export interface AttackGraphDetailHeaderFieldConfig {
  key: string;
  label: string;
  icon?: AttackGraphDetailIconName;
  tone?: AttackGraphPresentationTone;
  mono?: boolean;
  copyable?: boolean;
}

export interface AttackGraphDetailBadgeConfig {
  key: string;
  label?: string;
  tone?: AttackGraphPresentationTone;
  customRender?: (value: string, data: AttackGraphDetailData) => ReactNode;
}

export interface AttackGraphDetailHeaderConfig {
  title: {
    key: string;
    fallback?: string;
  };
  badges?: AttackGraphDetailBadgeConfig[];
  fields?: AttackGraphDetailHeaderFieldConfig[];
}

export interface AttackGraphDetailFieldConfig {
  key: string;
  label: string;
  icon?: AttackGraphDetailIconName;
  tone?: AttackGraphPresentationTone;
  bold?: boolean;
  mono?: boolean;
  truncate?: boolean;
  maxLength?: number;
  expandable?: boolean;
  copyable?: boolean;
  customRender?: (value: string, data: AttackGraphDetailData) => ReactNode;
}

export interface AttackGraphDetailSectionConfig {
  title: string;
  icon?: AttackGraphDetailIconName;
  tone?: AttackGraphPresentationTone;
  fields: AttackGraphDetailFieldConfig[];
}

export interface AttackGraphDetailCardConfig {
  header: AttackGraphDetailHeaderConfig;
  sections: AttackGraphDetailSectionConfig[];
}

export type AttackGraphDetailData = Record<string, string>;

export type AttackGraphDetailIconName =
  | "Activity"
  | "BadgeInfo"
  | "Clock"
  | "Code"
  | "Database"
  | "FileText"
  | "Fingerprint"
  | "FolderOpen"
  | "GitBranch"
  | "Hash"
  | "Info"
  | "Key"
  | "Lock"
  | "Monitor"
  | "Network"
  | "Server"
  | "Shield"
  | "Tag"
  | "Terminal"
  | "User";
