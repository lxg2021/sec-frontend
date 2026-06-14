import { Badge } from "@/shared/ui/badge";

import type { AttackGraphDetailCardConfig } from "../attack-graph-detail-config-types";

export const REGISTRY_KEY_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    icon: "Database",
    iconTone: "purple",
    title: {
      key: "object_name",
      fallback: "Registry Key",
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
      { key: "classification", label: "Class", icon: "Tag", iconTone: "purple" },
      { key: "agent_id", label: "Agent ID", icon: "Monitor", iconTone: "blue", mono: true },
    ],
  },
  sections: [
    {
      title: "Registry Key",
      icon: "Database",
      tone: "purple",
      columns: 1,
      fields: [
        {
          key: "object_name",
          label: "Object Name",
          icon: "Key",
          iconTone: "purple",
          display: "code",
          mono: true,
          copyable: true,
          truncate: true,
          maxLength: 120,
          expandable: true,
          showInPopover: true,
        },
        { key: "description", label: "Description", icon: "Info", iconTone: "blue" },
        { key: "classification", label: "Classification", icon: "Tag", iconTone: "purple" },
      ],
    },
    {
      title: "Context",
      icon: "Info",
      tone: "slate",
      columns: 1,
      fields: [
        { key: "process_name", label: "Process", icon: "Activity", iconTone: "cyan" },
        {
          key: "process_image",
          label: "Process Path",
          icon: "FolderOpen",
          iconTone: "blue",
          display: "block",
          mono: true,
          copyable: true,
        },
        { key: "user_name", label: "User", icon: "User", iconTone: "purple" },
      ],
    },
  ],
};
