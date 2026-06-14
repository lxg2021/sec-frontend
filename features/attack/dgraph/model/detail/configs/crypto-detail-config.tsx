import type { AttackGraphDetailCardConfig } from "../attack-graph-detail-config-types";
import {
  formatCryptoOperation,
  renderCryptoTypeBadge,
} from "../rules/crypto-detail-rules";

export const CRYPTO_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    icon: "Lock",
    iconTone: "blue",
    title: {
      key: "crypt_flag_description",
      fallback: "Crypto",
      formatValue: formatCryptoOperation,
    },
    badges: [
      {
        key: "entity_type",
        customRender: renderCryptoTypeBadge,
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
      title: "Crypto Information",
      icon: "Activity",
      tone: "blue",
      columns: 1,
      fields: [
        {
          key: "operation_kind",
          label: "Operation",
          icon: "Lock",
          iconTone: "blue",
          bold: true,
          formatValue: formatCryptoOperation,
        },
        {
          key: "crypt_flag_description",
          label: "Crypto Flag",
          icon: "Tag",
          iconTone: "slate",
          valueTone: "slate",
          formatValue: formatCryptoOperation,
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
