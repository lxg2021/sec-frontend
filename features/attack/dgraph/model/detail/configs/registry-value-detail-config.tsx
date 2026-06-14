import { Badge } from "@/shared/ui/badge";

import type { AttackGraphDetailCardConfig } from "../attack-graph-detail-config-types";

export const REGISTRY_VALUE_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    icon: "Database",
    iconTone: "blue",
    title: {
      key: "object_name",
      fallback: "Registry Value",
      formatValue: formatRegistryValueName,
    },
    badges: [
      {
        key: "classification",
        customRender: (value) => (
          <Badge variant="outline" className="border-black bg-black text-white">
            {value || "N/A"}
          </Badge>
        ),
      },
    ],
    fields: [
      { key: "agent_id", label: "Agent ID", icon: "Monitor", iconTone: "blue", mono: true },
      { key: "occurred_at", label: "Occurred", icon: "Clock", iconTone: "green", mono: true },
    ],
  },
  sections: [
    {
      title: "RegValue Information",
      icon: "Database",
      tone: "blue",
      columns: 1,
      fields: [
        {
          key: "object_name",
          label: "ValueName",
          icon: "Tag",
          iconTone: "blue",
          formatValue: formatRegistryValueName,
        },
        {
          key: "object_name",
          label: "ValuePath",
          icon: "FolderTree",
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
          key: "object_value",
          label: "Value",
          icon: "Code",
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
        { key: "classification", label: "Classification", icon: "Tag", iconTone: "purple" },
        { key: "description", label: "Description", icon: "Info", iconTone: "slate" },
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

function formatRegistryValueName(value: string) {
  const normalized = value.trim().replace(/\\+$/g, "");
  if (!normalized) return "";

  const parts = normalized.split("\\").filter(Boolean);
  return parts[parts.length - 1] ?? normalized;
}
