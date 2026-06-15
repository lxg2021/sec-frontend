import type {
  AttackGraphDetailCardConfig,
  AttackGraphDetailData,
} from "../attack-graph-detail-config-types";

export const POWERSHELL_EXECUTION_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    icon: "Terminal",
    iconTone: "cyan",
    title: {
      key: "file_name",
      fallback: "PowerShell Execution",
      formatValue: formatPowerShellExecutionTitle,
    },
    fields: [
      { key: "agent_id", label: "Agent ID", icon: "Monitor", iconTone: "blue", mono: true },
      { key: "occurred_at", label: "Occurred", icon: "Clock", iconTone: "green", mono: true },
    ],
  },
  sections: [
    {
      title: "PowerShell Execution",
      icon: "Terminal",
      tone: "blue",
      columns: 2,
      fields: [
        {
          key: "session_id",
          label: "Session",
          icon: "Hash",
          iconTone: "blue",
          mono: true,
        },
        {
          key: "process_guid",
          label: "Process GUID",
          icon: "Fingerprint",
          iconTone: "slate",
          valueTone: "slate",
          mono: true,
        },
        {
          key: "unique_id",
          label: "ID",
          icon: "Fingerprint",
          iconTone: "slate",
          valueTone: "slate",
          mono: true,
        },
      ],
    },
    {
      title: "Script Information",
      icon: "Code",
      tone: "blue",
      columns: 1,
      fields: [
        {
          key: "file_name",
          label: "Script Path",
          icon: "FolderOpen",
          iconTone: "cyan",
          valueTone: "cyan",
          display: "code",
          mono: true,
          copyable: true,
          truncate: true,
          maxLength: 140,
          expandable: true,
          showInPopover: true,
        },
        {
          key: "process_command_line",
          label: "Command Line",
          icon: "Terminal",
          iconTone: "cyan",
          valueTone: "cyan",
          display: "code",
          mono: true,
          copyable: true,
          truncate: true,
          maxLength: 160,
          expandable: true,
          showInPopover: true,
        },
        {
          key: "content",
          label: "Script Content",
          icon: "Code",
          iconTone: "orange",
          valueTone: "orange",
          display: "code",
          mono: true,
          copyable: true,
          truncate: true,
          maxLength: 180,
          expandable: true,
          showInPopover: true,
        },
      ],
    },
  ],
};

function formatPowerShellExecutionTitle(
  value: string,
  data: AttackGraphDetailData,
) {
  return (
    basename(value) ||
    commandSummary(data.process_command_line) ||
    commandSummary(data.content) ||
    ""
  );
}

function basename(value: string | undefined) {
  const normalized = (value ?? "").trim().replace(/[\\/]+$/g, "");
  if (!normalized) return "";

  const parts = normalized.split(/[\\/]+/).filter(Boolean);
  return parts[parts.length - 1] ?? normalized;
}

function commandSummary(value: string | undefined) {
  const normalized = (value ?? "").trim();
  if (!normalized) {
    return "";
  }
  return normalized.length > 72 ? `${normalized.slice(0, 69)}...` : normalized;
}
