import type {
  AttackGraphDetailCardConfig,
  AttackGraphDetailData,
} from "../attack-graph-detail-config-types";

export const MESSAGE_HOOK_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    icon: "Activity",
    iconTone: "blue",
    title: {
      key: "hook_type_description",
      fallback: "Message Hook",
      formatValue: formatMessageHookTitle,
    },
    fields: [
      { key: "agent_id", label: "Agent ID", icon: "Monitor", iconTone: "blue", mono: true },
      { key: "occurred_at", label: "Occurred", icon: "Clock", iconTone: "green", mono: true },
    ],
  },
  sections: [
    {
      title: "Message Hook Information",
      icon: "Activity",
      tone: "blue",
      columns: 1,
      fields: [
        {
          key: "hook_type_description",
          label: "Hook Type",
          icon: "Tag",
          iconTone: "orange",
          valueTone: "orange",
          bold: true,
          formatValue: formatHookTypeDescription,
        },
        {
          key: "hook_type",
          label: "Hook Type ID",
          icon: "Hash",
          iconTone: "slate",
          mono: true,
        },
        {
          key: "message_hook_module",
          label: "Hook Module",
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
          hideWhenEmpty: true,
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
          hideWhenEmpty: true,
        },
      ],
    },
  ],
};

function formatMessageHookTitle(value: string, data: AttackGraphDetailData) {
  return (
    formatHookTypeDescription(value) ||
    data.hook_type?.trim() ||
    basename(data.message_hook_module) ||
    ""
  );
}

function formatHookTypeDescription(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return "";
  }

  return normalized
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function basename(value: string | undefined) {
  const normalized = (value ?? "").trim().replace(/[\\/]+$/g, "");
  if (!normalized) {
    return "";
  }

  const parts = normalized.split(/[\\/]+/).filter(Boolean);
  return parts[parts.length - 1] ?? normalized;
}
