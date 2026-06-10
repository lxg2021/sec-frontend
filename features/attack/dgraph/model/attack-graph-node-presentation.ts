import type { LucideIcon } from "lucide-react";
import {
  Archive,
  BadgeAlert,
  Binary,
  Box,
  Briefcase,
  Cpu,
  Database,
  FileArchive,
  FileCode,
  FileText,
  Fingerprint,
  Globe,
  HardDrive,
  KeyRound,
  Laptop,
  Network,
  RadioTower,
  Router,
  Server,
  Settings,
  ShieldAlert,
  SquareActivity,
  Terminal,
  User,
  Users,
  Workflow,
  Zap,
} from "lucide-react";

import type { AttackGraphNodePresentationKind } from "./attack-graph-node-types";
import { getAttackGraphNodePresentationKind } from "./attack-graph-node-types";

export type AttackGraphNodeFamily =
  | "case"
  | "evidence"
  | "process"
  | "identity"
  | "host"
  | "network"
  | "file"
  | "registry"
  | "persistence"
  | "ipc"
  | "security"
  | "unknown";

export type AttackGraphNodeShape =
  | "rounded"
  | "square"
  | "pill"
  | "diamond"
  | "hex";

export interface AttackGraphNodePresentation {
  kind: AttackGraphNodePresentationKind;
  label: string;
  family: AttackGraphNodeFamily;
  icon: LucideIcon;
  image: string;
  shape: AttackGraphNodeShape;
  priority: number;
  rootClassName: string;
  iconClassName: string;
  badgeClassName: string;
}

const processTone = {
  root: "border-sky-300 bg-sky-50 text-sky-950 shadow-[0_8px_20px_rgba(14,116,144,0.10)]",
  icon: "bg-sky-600 text-white",
  badge: "bg-sky-100 text-sky-800 ring-sky-200",
};

const securityTone = {
  root: "border-rose-300 bg-rose-50 text-rose-950 shadow-[0_8px_20px_rgba(190,18,60,0.10)]",
  icon: "bg-rose-600 text-white",
  badge: "bg-rose-100 text-rose-800 ring-rose-200",
};

const hostTone = {
  root: "border-slate-300 bg-slate-50 text-slate-950 shadow-[0_8px_20px_rgba(51,65,85,0.10)]",
  icon: "bg-slate-700 text-white",
  badge: "bg-slate-100 text-slate-700 ring-slate-200",
};

const networkTone = {
  root: "border-cyan-300 bg-cyan-50 text-cyan-950 shadow-[0_8px_20px_rgba(8,145,178,0.10)]",
  icon: "bg-cyan-600 text-white",
  badge: "bg-cyan-100 text-cyan-800 ring-cyan-200",
};

const fileTone = {
  root: "border-amber-300 bg-amber-50 text-amber-950 shadow-[0_8px_20px_rgba(180,83,9,0.10)]",
  icon: "bg-amber-600 text-white",
  badge: "bg-amber-100 text-amber-800 ring-amber-200",
};

const persistenceTone = {
  root: "border-violet-300 bg-violet-50 text-violet-950 shadow-[0_8px_20px_rgba(109,40,217,0.10)]",
  icon: "bg-violet-600 text-white",
  badge: "bg-violet-100 text-violet-800 ring-violet-200",
};

const identityTone = {
  root: "border-indigo-300 bg-indigo-50 text-indigo-950 shadow-[0_8px_20px_rgba(67,56,202,0.10)]",
  icon: "bg-indigo-600 text-white",
  badge: "bg-indigo-100 text-indigo-800 ring-indigo-200",
};

const caseTone = {
  root: "border-zinc-300 bg-white text-zinc-950 shadow-[0_10px_24px_rgba(39,39,42,0.10)]",
  icon: "bg-zinc-800 text-white",
  badge: "bg-zinc-100 text-zinc-700 ring-zinc-200",
};

const unknownTone = {
  root: "border-neutral-300 bg-neutral-50 text-neutral-950 shadow-[0_8px_20px_rgba(82,82,82,0.08)]",
  icon: "bg-neutral-500 text-white",
  badge: "bg-neutral-100 text-neutral-700 ring-neutral-200",
};

export const ATTACK_GRAPH_NODE_PRESENTATIONS: Record<
  AttackGraphNodePresentationKind,
  AttackGraphNodePresentation
> = {
  account: {
    kind: "account",
    label: "Account",
    family: "identity",
    icon: Users,
    image: "/icons/nodes/account-node.svg",
    shape: "rounded",
    priority: 58,
    rootClassName: identityTone.root,
    iconClassName: identityTone.icon,
    badgeClassName: identityTone.badge,
  },
  bits: {
    kind: "bits",
    label: "BITS",
    family: "persistence",
    icon: Archive,
    image: "/icons/nodes/bits-job-node.svg",
    shape: "rounded",
    priority: 54,
    rootClassName: persistenceTone.root,
    iconClassName: persistenceTone.icon,
    badgeClassName: persistenceTone.badge,
  },
  "credential-theft": {
    kind: "credential-theft",
    label: "Credential Theft",
    family: "security",
    icon: KeyRound,
    image: "/icons/nodes/credentials-node.svg",
    shape: "rounded",
    priority: 92,
    rootClassName: securityTone.root,
    iconClassName: securityTone.icon,
    badgeClassName: securityTone.badge,
  },
  crypto: {
    kind: "crypto",
    label: "Crypto",
    family: "security",
    icon: Fingerprint,
    image: "/icons/nodes/endecrypt-node.svg",
    shape: "rounded",
    priority: 78,
    rootClassName: securityTone.root,
    iconClassName: securityTone.icon,
    badgeClassName: securityTone.badge,
  },
  device: {
    kind: "device",
    label: "Device",
    family: "host",
    icon: Laptop,
    image: "/icons/nodes/device-node.svg",
    shape: "square",
    priority: 52,
    rootClassName: hostTone.root,
    iconClassName: hostTone.icon,
    badgeClassName: hostTone.badge,
  },
  "dns-name": {
    kind: "dns-name",
    label: "DNS",
    family: "network",
    icon: Globe,
    image: "/icons/nodes/dns-node.svg",
    shape: "hex",
    priority: 45,
    rootClassName: networkTone.root,
    iconClassName: networkTone.icon,
    badgeClassName: networkTone.badge,
  },
  file: {
    kind: "file",
    label: "File",
    family: "file",
    icon: FileText,
    image: "/icons/nodes/file-node.svg",
    shape: "rounded",
    priority: 50,
    rootClassName: fileTone.root,
    iconClassName: fileTone.icon,
    badgeClassName: fileTone.badge,
  },
  "file-stream": {
    kind: "file-stream",
    label: "File Stream",
    family: "file",
    icon: FileArchive,
    image: "/icons/nodes/file-stream-node.svg",
    shape: "rounded",
    priority: 56,
    rootClassName: fileTone.root,
    iconClassName: fileTone.icon,
    badgeClassName: fileTone.badge,
  },
  host: {
    kind: "host",
    label: "Host",
    family: "host",
    icon: Server,
    image: "/icons/nodes/agent-node.svg",
    shape: "square",
    priority: 62,
    rootClassName: hostTone.root,
    iconClassName: hostTone.icon,
    badgeClassName: hostTone.badge,
  },
  "host-ref": {
    kind: "host-ref",
    label: "Remote Host",
    family: "host",
    icon: RadioTower,
    image: "/icons/nodes/host-ref-node.svg",
    shape: "square",
    priority: 60,
    rootClassName: hostTone.root,
    iconClassName: hostTone.icon,
    badgeClassName: hostTone.badge,
  },
  "ipc-object": {
    kind: "ipc-object",
    label: "IPC",
    family: "ipc",
    icon: Box,
    image: "/icons/nodes/ipc-object-node.svg",
    shape: "pill",
    priority: 44,
    rootClassName: persistenceTone.root,
    iconClassName: persistenceTone.icon,
    badgeClassName: persistenceTone.badge,
  },
  mbr: {
    kind: "mbr",
    label: "MBR",
    family: "file",
    icon: HardDrive,
    image: "/icons/nodes/mbr-boot-node.svg",
    shape: "diamond",
    priority: 86,
    rootClassName: securityTone.root,
    iconClassName: securityTone.icon,
    badgeClassName: securityTone.badge,
  },
  "message-hook": {
    kind: "message-hook",
    label: "Message Hook",
    family: "persistence",
    icon: Workflow,
    image: "/icons/nodes/message-node.svg",
    shape: "diamond",
    priority: 74,
    rootClassName: persistenceTone.root,
    iconClassName: persistenceTone.icon,
    badgeClassName: persistenceTone.badge,
  },
  "net-address": {
    kind: "net-address",
    label: "Address",
    family: "network",
    icon: Router,
    image: "/icons/nodes/net-node.svg",
    shape: "hex",
    priority: 46,
    rootClassName: networkTone.root,
    iconClassName: networkTone.icon,
    badgeClassName: networkTone.badge,
  },
  "net-endpoint": {
    kind: "net-endpoint",
    label: "Endpoint",
    family: "network",
    icon: Network,
    image: "/icons/nodes/net-endpoint-node.svg",
    shape: "hex",
    priority: 48,
    rootClassName: networkTone.root,
    iconClassName: networkTone.icon,
    badgeClassName: networkTone.badge,
  },
  powershell: {
    kind: "powershell",
    label: "PowerShell",
    family: "process",
    icon: Terminal,
    image: "/icons/nodes/powershell-node.svg",
    shape: "rounded",
    priority: 82,
    rootClassName: processTone.root,
    iconClassName: processTone.icon,
    badgeClassName: processTone.badge,
  },
  process: {
    kind: "process",
    label: "Process",
    family: "process",
    icon: Cpu,
    image: "/icons/nodes/process-node.svg",
    shape: "rounded",
    priority: 90,
    rootClassName: processTone.root,
    iconClassName: processTone.icon,
    badgeClassName: processTone.badge,
  },
  registry: {
    kind: "registry",
    label: "Registry",
    family: "registry",
    icon: Database,
    image: "/icons/nodes/reg-key-node.svg",
    shape: "rounded",
    priority: 55,
    rootClassName: fileTone.root,
    iconClassName: fileTone.icon,
    badgeClassName: fileTone.badge,
  },
  service: {
    kind: "service",
    label: "Service",
    family: "persistence",
    icon: Settings,
    image: "/icons/nodes/service-runtime-node.svg",
    shape: "rounded",
    priority: 66,
    rootClassName: persistenceTone.root,
    iconClassName: persistenceTone.icon,
    badgeClassName: persistenceTone.badge,
  },
  task: {
    kind: "task",
    label: "Task",
    family: "persistence",
    icon: Briefcase,
    image: "/icons/nodes/task-node.svg",
    shape: "rounded",
    priority: 64,
    rootClassName: persistenceTone.root,
    iconClassName: persistenceTone.icon,
    badgeClassName: persistenceTone.badge,
  },
  "token-impersonation": {
    kind: "token-impersonation",
    label: "Token",
    family: "identity",
    icon: BadgeAlert,
    image: "/icons/nodes/impersonation-token-node.svg",
    shape: "diamond",
    priority: 80,
    rootClassName: identityTone.root,
    iconClassName: identityTone.icon,
    badgeClassName: identityTone.badge,
  },
  "url-resource": {
    kind: "url-resource",
    label: "URL",
    family: "network",
    icon: Globe,
    image: "/icons/nodes/url-node.svg",
    shape: "hex",
    priority: 47,
    rootClassName: networkTone.root,
    iconClassName: networkTone.icon,
    badgeClassName: networkTone.badge,
  },
  volume: {
    kind: "volume",
    label: "Volume",
    family: "file",
    icon: HardDrive,
    image: "/icons/nodes/volume-node.svg",
    shape: "square",
    priority: 40,
    rootClassName: fileTone.root,
    iconClassName: fileTone.icon,
    badgeClassName: fileTone.badge,
  },
  wmi: {
    kind: "wmi",
    label: "WMI",
    family: "persistence",
    icon: FileCode,
    image: "/icons/nodes/wmi-node.svg",
    shape: "rounded",
    priority: 76,
    rootClassName: persistenceTone.root,
    iconClassName: persistenceTone.icon,
    badgeClassName: persistenceTone.badge,
  },
  case: {
    kind: "case",
    label: "Case",
    family: "case",
    icon: ShieldAlert,
    image: "/icons/nodes/attack-node.svg",
    shape: "rounded",
    priority: 100,
    rootClassName: caseTone.root,
    iconClassName: caseTone.icon,
    badgeClassName: caseTone.badge,
  },
  "case-group": {
    kind: "case-group",
    label: "Group",
    family: "case",
    icon: SquareActivity,
    image: "/icons/nodes/attack-node.svg",
    shape: "rounded",
    priority: 98,
    rootClassName: caseTone.root,
    iconClassName: caseTone.icon,
    badgeClassName: caseTone.badge,
  },
  "case-instance": {
    kind: "case-instance",
    label: "Instance",
    family: "case",
    icon: Binary,
    image: "/icons/nodes/event-node.svg",
    shape: "rounded",
    priority: 96,
    rootClassName: caseTone.root,
    iconClassName: caseTone.icon,
    badgeClassName: caseTone.badge,
  },
  evidence: {
    kind: "evidence",
    label: "Evidence",
    family: "evidence",
    icon: Zap,
    image: "/icons/nodes/attack-node.svg",
    shape: "pill",
    priority: 94,
    rootClassName: securityTone.root,
    iconClassName: securityTone.icon,
    badgeClassName: securityTone.badge,
  },
  unknown: {
    kind: "unknown",
    label: "Unknown",
    family: "unknown",
    icon: User,
    image: "/icons/nodes/event-node.svg",
    shape: "rounded",
    priority: 1,
    rootClassName: unknownTone.root,
    iconClassName: unknownTone.icon,
    badgeClassName: unknownTone.badge,
  },
};

export function getAttackGraphNodePresentation(
  entityType: string | null | undefined,
): AttackGraphNodePresentation {
  return ATTACK_GRAPH_NODE_PRESENTATIONS[
    getAttackGraphNodePresentationKind(entityType)
  ];
}
