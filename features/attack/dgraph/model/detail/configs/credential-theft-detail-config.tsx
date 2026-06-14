import type { AttackGraphDetailCardConfig } from "../attack-graph-detail-config-types";
import {
  formatCredentialDescription,
  formatCredentialTheftTitle,
  formatCredentialType,
  renderCredentialTheftBadge,
  resolveCredentialTheftTone,
} from "../rules/credential-theft-detail-rules";

export const CREDENTIAL_THEFT_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    icon: "Shield",
    iconTone: "red",
    title: {
      key: "cred_desc",
      fallback: "Credential Theft",
      formatValue: formatCredentialTheftTitle,
    },
    badges: [
      {
        key: "cred_type",
        customRender: renderCredentialTheftBadge,
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
      {
        key: "occurred_at",
        label: "Occurred",
        icon: "Clock",
        iconTone: "green",
        mono: true,
      },
    ],
  },
  sections: [
    {
      title: "Credential Information",
      icon: "Activity",
      tone: "blue",
      columns: 1,
      fields: [
        {
          key: "cred_desc",
          label: "Credential",
          icon: "Lock",
          iconTone: "red",
          valueTone: "red",
          display: "code",
          mono: true,
          copyable: true,
          truncate: true,
          maxLength: 140,
          expandable: true,
          showInPopover: true,
          formatValue: formatCredentialDescription,
          resolveTone: resolveCredentialTheftTone,
        },
        {
          key: "cred_type",
          label: "Credential Type",
          icon: "Shield",
          iconTone: "slate",
          valueTone: "slate",
          formatValue: formatCredentialType,
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
