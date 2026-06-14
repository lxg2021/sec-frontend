import { Badge } from "@/shared/ui/badge";

import type { AttackGraphDetailCardConfig } from "../attack-graph-detail-config-types";
import {
  formatDriverType,
  resolveDriverTypeIcon,
  resolveDriverTypeTone,
} from "../rules/driver-type-detail-rules";

export const MBR_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    icon: "HardDrive",
    iconTone: "red",
    title: {
      key: "physical_name",
      fallback: "MBR",
      formatValue: formatPhysicalDriveTitle,
    },
    badges: [
      {
        key: "physical_name",
        customRender: (value) =>
          value ? (
            <Badge
              variant="destructive"
              className="rounded-md px-2 py-0.5 text-xs font-medium"
            >
              MBR
            </Badge>
          ) : null,
      },
    ],
    fields: [
      { key: "agent_id", label: "Agent ID", icon: "Monitor", iconTone: "blue", mono: true },
      { key: "occurred_at", label: "Occurred", icon: "Clock", iconTone: "green", mono: true },
    ],
  },
  sections: [
    {
      title: "MBR Information",
      icon: "HardDrive",
      tone: "blue",
      columns: 1,
      fields: [
        {
          key: "physical_name",
          label: "Physical Drive",
          icon: "HardDrive",
          iconTone: "red",
          valueTone: "red",
          display: "code",
          mono: true,
          copyable: true,
          truncate: true,
          maxLength: 120,
          expandable: true,
          showInPopover: true,
        },
        {
          key: "driver_type",
          label: "Driver Type",
          icon: "HardDrive",
          formatValue: formatDriverType,
          resolveIcon: resolveDriverTypeIcon,
          resolveTone: resolveDriverTypeTone,
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

function formatPhysicalDriveTitle(value: string) {
  const normalized = value.trim().replace(/[\\/]+$/g, "");
  if (!normalized) {
    return "";
  }

  const parts = normalized.split(/[\\/]+/).filter(Boolean);
  return parts[parts.length - 1] ?? normalized;
}
