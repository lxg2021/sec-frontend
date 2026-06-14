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
      columns: 1,
      fields: [
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
        { key: "process_guid", label: "Process GUID", icon: "Fingerprint", iconTone: "purple", mono: true, copyable: true },
      ],
    },
    {
      title: "Parent Process",
      icon: "Activity",
      tone: "blue",
      columns: 1,
      fields: [
        { key: "parent_process_id", label: "Parent PID", icon: "Hash", iconTone: "blue", mono: true },
        {
          key: "parent_process_image",
          label: "Parent Path",
          icon: "FolderOpen",
          display: "block",
          mono: true,
          copyable: true,
        },
        {
          key: "parent_process_command_line",
          label: "Parent Command",
          icon: "Terminal",
          iconTone: "cyan",
          display: "code",
          mono: true,
          truncate: true,
          maxLength: 120,
          expandable: true,
          showInPopover: true,
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
        { key: "md5", label: "MD5", icon: "Fingerprint", mono: true, copyable: true },
        { key: "sha1", label: "SHA1", icon: "Fingerprint", mono: true, copyable: true },
        { key: "sha256", label: "SHA256", icon: "Fingerprint", mono: true, copyable: true },
      ],
    },
  ],
};

function isSigned(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "signed" || normalized === "true";
}
