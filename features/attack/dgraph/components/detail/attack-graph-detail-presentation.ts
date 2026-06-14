import {
  Activity,
  BadgeInfo,
  Clock,
  Code,
  Database,
  Disc,
  Eye,
  EyeOff,
  Filter,
  FileText,
  Fingerprint,
  FolderOpen,
  FolderTree,
  GitBranch,
  HardDrive,
  Hash,
  Info,
  Key,
  Languages,
  Lock,
  Monitor,
  Network,
  Server,
  Shield,
  Tag,
  Terminal,
  Usb,
  User,
  type LucideIcon,
} from "lucide-react";

import type {
  AttackGraphDetailData,
  AttackGraphDetailIconName,
} from "../../model/detail/attack-graph-detail-config-types";
import type { AttackGraphPresentationTone } from "../../model/detail/attack-graph-detail-types";

export const ATTACK_GRAPH_DETAIL_ICONS: Record<
  AttackGraphDetailIconName,
  LucideIcon
> = {
  Activity,
  BadgeInfo,
  Clock,
  Code,
  Database,
  Disc,
  Eye,
  EyeOff,
  Filter,
  FileText,
  Fingerprint,
  FolderOpen,
  FolderTree,
  GitBranch,
  HardDrive,
  Hash,
  Info,
  Key,
  Languages,
  Lock,
  Monitor,
  Network,
  Server,
  Shield,
  Tag,
  Terminal,
  Usb,
  User,
};

export const ATTACK_GRAPH_DETAIL_BADGE_TONE_CLASS_NAMES: Record<
  AttackGraphPresentationTone,
  string
> = {
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  orange: "border-orange-200 bg-orange-50 text-orange-700",
  pink: "border-pink-200 bg-pink-50 text-pink-700",
  purple: "border-purple-200 bg-purple-50 text-purple-700",
  red: "border-rose-200 bg-rose-50 text-rose-700",
  slate: "border-slate-200 bg-slate-50 text-slate-600",
};

export const ATTACK_GRAPH_DETAIL_SECTION_TONE_CLASS_NAMES: Record<
  AttackGraphPresentationTone,
  string
> = {
  amber: "text-amber-700",
  blue: "text-blue-700",
  cyan: "text-cyan-700",
  green: "text-emerald-700",
  orange: "text-orange-700",
  pink: "text-pink-700",
  purple: "text-purple-700",
  red: "text-rose-700",
  slate: "text-slate-700",
};

export const ATTACK_GRAPH_DETAIL_FIELD_TONE_CLASS_NAMES: Record<
  AttackGraphPresentationTone,
  string
> = {
  amber: "text-amber-700",
  blue: "text-blue-700",
  cyan: "text-cyan-700",
  green: "text-emerald-700",
  orange: "text-orange-700",
  pink: "text-pink-700",
  purple: "text-purple-700",
  red: "text-rose-600",
  slate: "text-gray-600",
};

export function getAttackGraphDetailIcon(
  iconName: AttackGraphDetailIconName | undefined,
) {
  return iconName ? ATTACK_GRAPH_DETAIL_ICONS[iconName] ?? Info : Info;
}

export function readAttackGraphDetailValue(
  data: AttackGraphDetailData,
  key: string,
) {
  return String(data[key] ?? "").trim();
}

export function formatAttackGraphDetailValue(value: string) {
  return value.length > 0 ? value : "-";
}
