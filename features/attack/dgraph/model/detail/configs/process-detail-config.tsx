import { Badge } from "@/shared/ui/badge";

import type { AttackGraphDetailCardConfig } from "../attack-graph-detail-config-types";

export const PROCESS_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    icon: "Terminal",
    iconTone: "cyan",
    title: {
      key: "process_name",
      fallback: "Process",
    },
    badges: [
      {
        key: "signature",
        customRender: (value) => (
          <Badge variant={isSigned(value) ? "default" : "destructive"}>
            {isSigned(value) ? "Signed" : "Unsigned"}
          </Badge>
        ),
      },
    ],
    fields: [
      { key: "agent_id", label: "Agent ID", icon: "Monitor", iconTone: "blue", mono: true },
      { key: "occurred_at", label: "Occurred At", icon: "Clock", iconTone: "slate", mono: true },
      { key: "user_id", label: "User ID", icon: "User", iconTone: "purple", mono: true },
      { key: "session", label: "Session", icon: "Hash", iconTone: "blue", mono: true },
    ],
  },
  sections: [
    {
      title: "Process Information",
      icon: "Activity",
      tone: "blue",
      columns: 2,
      fields: [
        { key: "process_id", label: "PID", icon: "Hash", iconTone: "blue", mono: true },
        { key: "process_name", label: "Process Name", icon: "FileText", bold: true },
        {
          key: "process_image",
          label: "Process Path",
          icon: "FolderOpen",
          display: "block",
          mono: true,
          copyable: true,
        },
        {
          key: "process_command_line",
          label: "Command Line",
          icon: "Terminal",
          iconTone: "cyan",
          valueTone: "cyan",
          display: "code",
          mono: true,
          truncate: true,
          maxLength: 120,
          expandable: true,
          showInPopover: true,
          copyable: true,
        },
        {
          key: "process_md5",
          label: "Process MD5",
          icon: "Fingerprint",
          iconTone: "slate",
          valueTone: "slate",
          mono: true,
          copyable: true,
        },
        {
          key: "process_guid",
          label: "Process GUID",
          icon: "Fingerprint",
          iconTone: "slate",
          valueTone: "slate",
          mono: true,
          copyable: true,
        },
        {
          key: "unique_id",
          label: "Unique ID",
          icon: "Fingerprint",
          iconTone: "slate",
          valueTone: "slate",
          mono: true,
          copyable: true,
        },
      ],
    },
    {
      title: "Security",
      icon: "Shield",
      tone: "red",
      fields: [
        { key: "signature", label: "Signature", icon: "Lock", iconTone: "red" },
        { key: "sign_vendor", label: "Sign Vendor", icon: "Shield", iconTone: "red" },
        { key: "rtlo", label: "RTLO", icon: "BadgeInfo", mono: true },
        { key: "show_window_flag", label: "Show Window Flag", icon: "BadgeInfo", mono: true },
        { key: "org_file_name", label: "Original File Name", icon: "FileText", mono: true, copyable: true },
        { key: "driver_type", label: "Driver Type", icon: "BadgeInfo", mono: true },
      ],
    },
  ],
};

function isSigned(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "signed" || normalized === "true";
}
