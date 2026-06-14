import type { AttackGraphDetailCardConfig } from "../attack-graph-detail-config-types";

export const FILE_MAPPING_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    icon: "Folder",
    iconTone: "blue",
    title: {
      key: "file_mapping_name",
      fallback: "FileMapping",
      formatValue: formatFileMappingTitle,
    },
    fields: [
      { key: "agent_id", label: "Agent ID", icon: "Monitor", iconTone: "blue", mono: true },
      { key: "occurred_at", label: "Occurred", icon: "Clock", iconTone: "green", mono: true },
    ],
  },
  sections: [
    {
      title: "File Mapping Information",
      icon: "Folder",
      tone: "blue",
      columns: 1,
      fields: [
        {
          key: "file_mapping_name",
          label: "File Mapping Name",
          icon: "Folder",
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
          key: "unique_id",
          label: "ID",
          icon: "Fingerprint",
          iconTone: "slate",
          valueTone: "slate",
          mono: true,
          hideWhenEmpty: true,
        },
      ],
    },
  ],
};

function formatFileMappingTitle(value: string) {
  const normalized = value.trim().replace(/[\\/]+$/g, "");
  if (!normalized) {
    return "";
  }

  const parts = normalized.split(/[\\/]+/).filter(Boolean);
  return parts[parts.length - 1] ?? normalized;
}
