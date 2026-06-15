import type {
  AttackGraphDetailCardConfig,
  AttackGraphDetailData,
} from "../attack-graph-detail-config-types";

export const DNS_NAME_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    icon: "Network",
    iconTone: "blue",
    title: {
      key: "domain",
      fallback: "DnsName",
      formatValue: formatDnsNameTitle,
    },
  },
  sections: [
    {
      title: "DNS Information",
      icon: "Activity",
      tone: "blue",
      columns: 1,
      fields: [
        {
          key: "domain",
          label: "Domain",
          icon: "Network",
          iconTone: "blue",
          valueTone: "blue",
          bold: true,
          mono: true,
          copyable: true,
        },
      ],
    },
  ],
};

function formatDnsNameTitle(value: string, data: AttackGraphDetailData) {
  return value.trim() || data.graph_display_name?.trim() || "";
}
