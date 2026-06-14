import type { ReactNode } from "react";

import type { AttackGraphPresentationTone } from "./attack-graph-detail-types";

export interface AttackGraphDetailHeaderFieldConfig {
  key: string;
  label: string;
  icon?: AttackGraphDetailIconName;
  iconTone?: AttackGraphPresentationTone;
  tone?: AttackGraphPresentationTone;
  valueTone?: AttackGraphPresentationTone;
  mono?: boolean;
  copyable?: boolean;
  formatValue?: (value: string, data: AttackGraphDetailData) => string;
  resolveIcon?: (
    value: string,
    data: AttackGraphDetailData,
  ) => AttackGraphDetailIconName | undefined;
  resolveTone?: (
    value: string,
    data: AttackGraphDetailData,
  ) => AttackGraphPresentationTone | undefined;
}

export interface AttackGraphDetailBadgeConfig {
  key: string;
  label?: string;
  tone?: AttackGraphPresentationTone;
  customRender?: (value: string, data: AttackGraphDetailData) => ReactNode;
}

export interface AttackGraphDetailHeaderConfig {
  icon?: AttackGraphDetailIconName;
  iconTone?: AttackGraphPresentationTone;
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
  iconTone?: AttackGraphPresentationTone;
  tone?: AttackGraphPresentationTone;
  valueTone?: AttackGraphPresentationTone;
  display?: "inline" | "block" | "code";
  bold?: boolean;
  mono?: boolean;
  truncate?: boolean;
  maxLength?: number;
  expandable?: boolean;
  copyable?: boolean;
  showInPopover?: boolean;
  formatValue?: (value: string, data: AttackGraphDetailData) => string;
  resolveIcon?: (
    value: string,
    data: AttackGraphDetailData,
  ) => AttackGraphDetailIconName | undefined;
  resolveTone?: (
    value: string,
    data: AttackGraphDetailData,
  ) => AttackGraphPresentationTone | undefined;
  customRender?: (value: string, data: AttackGraphDetailData) => ReactNode;
}

export interface AttackGraphDetailSectionConfig {
  title: string;
  icon?: AttackGraphDetailIconName;
  tone?: AttackGraphPresentationTone;
  columns?: 1 | 2;
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
  | "Disc"
  | "Eye"
  | "EyeOff"
  | "FileText"
  | "Fingerprint"
  | "FolderOpen"
  | "GitBranch"
  | "HardDrive"
  | "Hash"
  | "Info"
  | "Key"
  | "Languages"
  | "Lock"
  | "Monitor"
  | "Network"
  | "Server"
  | "Shield"
  | "Tag"
  | "Terminal"
  | "Usb"
  | "User";
