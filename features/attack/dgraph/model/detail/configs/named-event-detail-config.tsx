import type { AttackGraphDetailCardConfig } from "../attack-graph-detail-config-types";

export const NAMED_EVENT_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    icon: "Activity",
    iconTone: "blue",
    title: {
      key: "event_name",
      fallback: "Named Event",
      formatValue: formatNamedEventTitle,
    },
    fields: [
      { key: "agent_id", label: "Agent ID", icon: "Monitor", iconTone: "blue", mono: true },
      { key: "occurred_at", label: "Occurred", icon: "Clock", iconTone: "green", mono: true },
    ],
  },
  sections: [
    {
      title: "Event Information",
      icon: "Activity",
      tone: "blue",
      columns: 1,
      fields: [
        {
          key: "event_name",
          label: "Event Name",
          icon: "Activity",
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
          key: "manual_reset",
          label: "Manual Reset",
          icon: "Tag",
          iconTone: "purple",
          mono: true,
          hideWhenEmpty: true,
        },
        {
          key: "initial_state",
          label: "Initial State",
          icon: "Activity",
          iconTone: "blue",
          mono: true,
          hideWhenEmpty: true,
        },
        {
          key: "desired_access",
          label: "Desired Access",
          icon: "Lock",
          iconTone: "orange",
          valueTone: "orange",
          mono: true,
          hideWhenEmpty: true,
        },
        {
          key: "inherit_handle",
          label: "Inherit Handle",
          icon: "GitBranch",
          iconTone: "slate",
          mono: true,
          hideWhenEmpty: true,
        },
        {
          key: "number",
          label: "Number",
          icon: "Hash",
          iconTone: "slate",
          mono: true,
          hideWhenEmpty: true,
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

function formatNamedEventTitle(value: string) {
  const normalized = value.trim().replace(/[\\/]+$/g, "");
  if (!normalized) {
    return "";
  }

  const parts = normalized.split(/[\\/]+/).filter(Boolean);
  return parts[parts.length - 1] ?? normalized;
}
