import type { AttackGraphDetailCardConfig } from "../attack-graph-detail-config-types";

export const REGISTRY_KEY_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    title: {
      key: "object_name",
      fallback: "Registry Key",
    },
    fields: [
      { key: "classification", label: "Class", icon: "Tag" },
      { key: "agent_id", label: "Agent ID", icon: "Monitor", mono: true },
    ],
  },
  sections: [
    {
      title: "Registry Key",
      icon: "Database",
      tone: "purple",
      fields: [
        {
          key: "object_name",
          label: "Object Name",
          icon: "Key",
          mono: true,
          copyable: true,
          truncate: true,
          maxLength: 120,
          expandable: true,
        },
        { key: "description", label: "Description", icon: "Info" },
        { key: "classification", label: "Classification", icon: "Tag" },
      ],
    },
    {
      title: "Context",
      icon: "Info",
      tone: "slate",
      fields: [
        { key: "process_name", label: "Process", icon: "Activity" },
        {
          key: "process_image",
          label: "Process Path",
          icon: "FolderOpen",
          mono: true,
          copyable: true,
        },
        { key: "user_name", label: "User", icon: "User" },
      ],
    },
  ],
};
