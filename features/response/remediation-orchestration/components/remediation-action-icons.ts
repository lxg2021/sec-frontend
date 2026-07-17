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

export const REMEDIATION_ACTION_TYPE_CATALOG = [
  { type: "process", representativeActionCode: "process.terminate" },
  { type: "file", representativeActionCode: "file.quarantine" },
  { type: "scheduled-task", representativeActionCode: "scheduled_job.delete" },
  { type: "service", representativeActionCode: "service.delete" },
  { type: "account", representativeActionCode: "account.disable" },
  { type: "registry", representativeActionCode: "registry.delete_key" },
  { type: "wmi-class", representativeActionCode: "wmi_class.delete" },
  { type: "wmi-subscription", representativeActionCode: "wmi_subscription.delete" },
  { type: "bits-job", representativeActionCode: "bits.delete" },
  { type: "file-ea", representativeActionCode: "file_ea.delete" },
  { type: "ntfs-ads", representativeActionCode: "ntfs_ads.delete" },
  { type: "proc-execute", representativeActionCode: "process.block_execute" },
  { type: "net-quarantine", representativeActionCode: "net.block" },
] as const;

export type RemediationActionType = (typeof REMEDIATION_ACTION_TYPE_CATALOG)[number]["type"];

export function remediationActionType(actionCode: string): RemediationActionType | null {
  const action = actionCode.trim().toLowerCase();
  if (action.startsWith("process.block") || action.startsWith("process.bypass")) return "proc-execute";
  if (action.startsWith("file_ea.")) return "file-ea";
  if (action.startsWith("ntfs_ads.")) return "ntfs-ads";
  if (action.startsWith("wmi_subscription.")) return "wmi-subscription";
  if (action.startsWith("wmi_class.")) return "wmi-class";
  if (action.startsWith("scheduled_job.") || action.startsWith("scheduled_task.") || action.startsWith("task.")) {
    return "scheduled-task";
  }
  if (action.startsWith("bits.") || action.startsWith("bits_job.")) return "bits-job";
  if (action.startsWith("file.")) return "file";
  if (action.startsWith("service.")) return "service";
  if (action.startsWith("account.")) return "account";
  if (action.startsWith("registry.")) return "registry";
  if (action.startsWith("net.") || action.startsWith("network.")) return "net-quarantine";
  if (action.startsWith("process.")) return "process";
  return null;
}

export function remediationTypeIcon(type: string): RemediationIcon {
  return REMEDIATION_TYPE_ICONS[type.trim().toLowerCase()] ?? ShieldCheck;
}

export function remediationActionIcon(actionCode: string): RemediationIcon {
  const type = remediationActionType(actionCode);
  return type ? REMEDIATION_TYPE_ICONS[type] : ShieldCheck;
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
