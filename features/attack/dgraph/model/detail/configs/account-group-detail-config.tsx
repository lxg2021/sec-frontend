import type { AttackGraphDetailCardConfig } from "../attack-graph-detail-config-types";
import {
  formatAccountGroupScope,
  formatAccountGroupTitle,
  renderAccountGroupBadge,
} from "../rules/account-group-detail-rules";

export const ACCOUNT_GROUP_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    icon: "Users",
    iconTone: "blue",
    title: {
      key: "group_name",
      fallback: "Account Group",
      formatValue: formatAccountGroupTitle,
    },
    badges: [
      {
        key: "entity_type",
        customRender: renderAccountGroupBadge,
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
      title: "Account Group Information",
      icon: "Activity",
      tone: "blue",
      columns: 1,
      fields: [
        {
          key: "group_name",
          label: "Group Name",
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
          formatValue: formatAccountGroupScope,
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
