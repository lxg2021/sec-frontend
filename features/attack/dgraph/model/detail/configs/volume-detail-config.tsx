import { Badge } from "@/shared/ui/badge";

import type { AttackGraphDetailCardConfig } from "../attack-graph-detail-config-types";
import {
  formatDriverType,
  resolveDriverTypeIcon,
  resolveDriverTypeTone,
} from "../rules/driver-type-detail-rules";
import {
  formatVolumeAccessType,
  resolveVolumeAccessTypeTone,
} from "../rules/volume-detail-rules";

export const VOLUME_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    icon: "HardDrive",
    iconTone: "cyan",
    title: {
      key: "file_name",
      fallback: "Volume",
    },
    badges: [
      {
        key: "access_type",
        customRender: (value) => {
          const label = formatVolumeAccessType(value);
          if (!label || label === "none") {
            return null;
          }

          return (
            <Badge variant="destructive" className="rounded-md px-2 py-0.5 text-xs font-medium">
              {label}
            </Badge>
          );
        },
      },
    ],
    fields: [
      { key: "agent_id", label: "Agent ID", icon: "Monitor", iconTone: "blue", mono: true },
      { key: "occurred_at", label: "Occurred", icon: "Clock", iconTone: "green", mono: true },
    ],
  },
  sections: [
    {
      title: "Volume Information",
      icon: "HardDrive",
      tone: "blue",
      columns: 1,
      fields: [
        {
          key: "file_name",
          label: "Volume Name",
          icon: "HardDrive",
          iconTone: "cyan",
          display: "code",
          mono: true,
          copyable: true,
        },
        {
          key: "access_type",
          label: "Access Type",
          icon: "Lock",
          formatValue: formatVolumeAccessType,
          resolveTone: resolveVolumeAccessTypeTone,
          mono: true,
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
        },
      ],
    },
  ],
};
