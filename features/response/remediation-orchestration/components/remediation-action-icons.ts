import type { ComponentType } from "react";
import {
  Braces,
  CalendarClock,
  Database,
  FileCog,
  FileStack,
  FileWarning,
  Network,
  ServerCog,
  ShieldCheck,
  TerminalSquare,
  UserCog,
  Workflow,
} from "lucide-react";

type RemediationIcon = ComponentType<{
  className?: string;
  "aria-hidden"?: boolean;
}>;

export const REMEDIATION_TYPE_ICONS: Record<string, RemediationIcon> = {
  process: TerminalSquare,
  file: FileWarning,
  "scheduled-task": CalendarClock,
  service: ServerCog,
  account: UserCog,
  registry: Database,
  "wmi-class": Braces,
  "wmi-subscription": Workflow,
  "bits-job": FileStack,
  "file-ea": FileCog,
  "ntfs-ads": FileCog,
  "proc-execute": ShieldCheck,
  "net-quarantine": Network,
};

export function remediationTypeIcon(type: string): RemediationIcon {
  return REMEDIATION_TYPE_ICONS[type.trim().toLowerCase()] ?? ShieldCheck;
}

export function remediationActionIcon(actionCode: string): RemediationIcon {
  const action = actionCode.trim().toLowerCase();
  if (action.startsWith("process.block") || action.startsWith("process.bypass")) {
    return REMEDIATION_TYPE_ICONS["proc-execute"];
  }
  if (action.startsWith("file_ea.")) return REMEDIATION_TYPE_ICONS["file-ea"];
  if (action.startsWith("ntfs_ads.")) return REMEDIATION_TYPE_ICONS["ntfs-ads"];
  if (action.startsWith("wmi_subscription.")) {
    return REMEDIATION_TYPE_ICONS["wmi-subscription"];
  }
  if (action.startsWith("wmi_class.")) {
    return REMEDIATION_TYPE_ICONS["wmi-class"];
  }
  if (action.startsWith("scheduled_job.") || action.startsWith("scheduled_task.") || action.startsWith("task.")) {
    return REMEDIATION_TYPE_ICONS["scheduled-task"];
  }
  if (action.startsWith("bits.") || action.startsWith("bits_job.")) {
    return REMEDIATION_TYPE_ICONS["bits-job"];
  }
  if (action.startsWith("file.")) return REMEDIATION_TYPE_ICONS.file;
  if (action.startsWith("service.")) return REMEDIATION_TYPE_ICONS.service;
  if (action.startsWith("account.")) return REMEDIATION_TYPE_ICONS.account;
  if (action.startsWith("registry.")) return REMEDIATION_TYPE_ICONS.registry;
  if (action.startsWith("net.") || action.startsWith("network.")) {
    return REMEDIATION_TYPE_ICONS["net-quarantine"];
  }
  if (action.startsWith("process.")) return REMEDIATION_TYPE_ICONS.process;
  return ShieldCheck;
}

export function remediationActionIconClassName(actionCode: string): string {
  const action = actionCode.trim().toLowerCase();
  if (action.startsWith("file.") || action.startsWith("file_ea.") || action.startsWith("ntfs_ads.")) {
    return "text-amber-600";
  }
  if (
    action.startsWith("scheduled_job.") ||
    action.startsWith("scheduled_task.") ||
    action.startsWith("task.") ||
    action.startsWith("service.") ||
    action.startsWith("bits.") ||
    action.startsWith("bits_job.")
  ) {
    return "text-blue-600";
  }
  if (action.startsWith("account.")) return "text-cyan-600";
  if (action.startsWith("registry.")) return "text-emerald-600";
  if (action.startsWith("wmi_class.") || action.startsWith("wmi_subscription.")) {
    return "text-violet-600";
  }
  if (action.startsWith("net.") || action.startsWith("network.")) {
    return "text-teal-600";
  }
  if (action.startsWith("process.")) return "text-indigo-600";
  return "text-slate-500";
}
