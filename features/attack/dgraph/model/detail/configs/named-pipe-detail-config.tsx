import type { AttackGraphDetailCardConfig } from "../attack-graph-detail-config-types";

export const NAMED_PIPE_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    icon: "GitBranch",
    iconTone: "slate",
    title: {
      key: "pipe_name",
      fallback: "Named Pipe",
      formatValue: formatNamedPipeTitle,
    },
    fields: [
      { key: "agent_id", label: "Agent ID", icon: "Monitor", iconTone: "blue", mono: true },
      { key: "occurred_at", label: "Occurred", icon: "Clock", iconTone: "green", mono: true },
    ],
  },
  sections: [
    {
      title: "Pipe Information",
      icon: "GitBranch",
      tone: "slate",
      columns: 1,
      fields: [
        {
          key: "pipe_name",
          label: "Pipe Name",
          icon: "Terminal",
          iconTone: "cyan",
          valueTone: "cyan",
          display: "code",
          mono: true,
          copyable: true,
          truncate: true,
          maxLength: 120,
          expandable: true,
          showInPopover: true,
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
  ],
};

function formatNamedPipeTitle(value: string) {
  const normalized = value.trim().replace(/[\\/]+$/g, "");
  if (!normalized) {
    return "";
  }

  const parts = normalized.split(/[\\/]+/).filter(Boolean);
  return parts[parts.length - 1] ?? normalized;
}
