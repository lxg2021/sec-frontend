import type { AttackGraphDetailCardConfig } from "../attack-graph-detail-config-types";

export const MAIL_SLOT_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    icon: "Mail",
    iconTone: "blue",
    title: {
      key: "mail_slot_name",
      fallback: "MailSlot",
      formatValue: formatMailSlotTitle,
    },
    fields: [
      { key: "agent_id", label: "Agent ID", icon: "Monitor", iconTone: "blue", mono: true },
      { key: "occurred_at", label: "Occurred", icon: "Clock", iconTone: "green", mono: true },
    ],
  },
  sections: [
    {
      title: "MailSlot Information",
      icon: "Activity",
      tone: "blue",
      columns: 1,
      fields: [
        {
          key: "mail_slot_name",
          label: "MailSlot Name",
          icon: "Mail",
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
          hideWhenEmpty: true,
        },
      ],
    },
  ],
};

function formatMailSlotTitle(value: string) {
  const normalized = value.trim().replace(/[\\/]+$/g, "");
  if (!normalized) {
    return "";
  }

  const parts = normalized.split(/[\\/]+/).filter(Boolean);
  return parts[parts.length - 1] ?? normalized;
}
