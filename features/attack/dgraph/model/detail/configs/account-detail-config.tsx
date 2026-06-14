import type { AttackGraphDetailCardConfig } from "../attack-graph-detail-config-types";
import {
  formatAccountScope,
  formatAccountTitle,
  renderAccountBadge,
} from "../rules/account-detail-rules";

export const ACCOUNT_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    icon: "User",
    iconTone: "blue",
    title: {
      key: "user",
      fallback: "Account",
      formatValue: formatAccountTitle,
    },
    badges: [
      {
        key: "entity_type",
        customRender: renderAccountBadge,
      },
    ],
    fields: [
      {
        key: "agent_id",
        label: "Agent ID",
        icon: "Monitor",
        iconTone: "blue",
        mono: true,
      },
    ],
  },
  sections: [
    {
      title: "Account Information",
      icon: "Activity",
      tone: "blue",
      columns: 1,
      fields: [
        {
          key: "user",
          label: "User Name",
          icon: "User",
          iconTone: "blue",
          valueTone: "blue",
          bold: true,
          copyable: true,
        },
        {
          key: "domain",
          label: "Domain",
          icon: "Network",
          iconTone: "blue",
          valueTone: "slate",
          mono: true,
          copyable: true,
          hideWhenEmpty: true,
        },
        {
          key: "scope_kind",
          label: "Scope",
          icon: "BadgeInfo",
          iconTone: "slate",
          valueTone: "slate",
          formatValue: formatAccountScope,
        },
        {
          key: "agent_id",
          label: "Agent ID",
          icon: "Monitor",
          iconTone: "blue",
          valueTone: "slate",
          mono: true,
          copyable: true,
          hideWhenEmpty: true,
        },
        {
          key: "sid",
          label: "SID",
          icon: "Fingerprint",
          iconTone: "slate",
          valueTone: "slate",
          mono: true,
          copyable: true,
          hideWhenEmpty: true,
        },
      ],
    },
  ],
};
