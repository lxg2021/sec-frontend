import type { AttackGraphDetailCardConfig } from "../attack-graph-detail-config-types";

export const PROCESS_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    title: {
      key: "process_name",
      fallback: "Process",
    },
    fields: [
      { key: "agent_id", label: "Agent ID", icon: "Monitor", mono: true },
      { key: "user_name", label: "User", icon: "User" },
      { key: "process_id", label: "PID", icon: "Hash", mono: true },
      { key: "parent_process_id", label: "Parent PID", icon: "Hash", mono: true },
    ],
  },
  sections: [
    {
      title: "Process Information",
      icon: "Activity",
      tone: "blue",
      fields: [
        { key: "process_name", label: "Process Name", icon: "FileText", bold: true },
        {
          key: "process_image",
          label: "Process Path",
          icon: "FolderOpen",
          mono: true,
          copyable: true,
        },
        {
          key: "process_command_line",
          label: "Command Line",
          icon: "Terminal",
          mono: true,
          truncate: true,
          maxLength: 120,
          expandable: true,
          copyable: true,
        },
        { key: "process_guid", label: "Process GUID", icon: "Fingerprint", mono: true, copyable: true },
      ],
    },
    {
      title: "Parent Process",
      icon: "Activity",
      tone: "slate",
      fields: [
        { key: "parent_process_id", label: "Parent PID", icon: "Hash", mono: true },
        {
          key: "parent_process_image",
          label: "Parent Path",
          icon: "FolderOpen",
          mono: true,
          copyable: true,
        },
        {
          key: "parent_process_command_line",
          label: "Parent Command",
          icon: "Terminal",
          mono: true,
          truncate: true,
          maxLength: 120,
          expandable: true,
          copyable: true,
        },
      ],
    },
    {
      title: "Security",
      icon: "Shield",
      tone: "red",
      fields: [
        { key: "signature", label: "Signature", icon: "Lock" },
        { key: "sign_vendor", label: "Sign Vendor", icon: "Shield" },
        { key: "md5", label: "MD5", icon: "Fingerprint", mono: true, copyable: true },
        { key: "sha1", label: "SHA1", icon: "Fingerprint", mono: true, copyable: true },
        { key: "sha256", label: "SHA256", icon: "Fingerprint", mono: true, copyable: true },
      ],
    },
  ],
};
