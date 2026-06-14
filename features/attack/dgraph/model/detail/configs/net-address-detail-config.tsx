import { Badge } from "@/shared/ui/badge";

import type {
  AttackGraphDetailCardConfig,
  AttackGraphDetailData,
} from "../attack-graph-detail-config-types";

export const NET_ADDRESS_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    icon: "Network",
    iconTone: "blue",
    title: {
      key: "ip",
      fallback: "NetAddress",
      formatValue: formatNetAddressTitle,
    },
    badges: [
      {
        key: "is_ipv6",
        customRender: renderIpVersionBadge,
      },
    ],
  },
  sections: [
    {
      title: "Address Information",
      icon: "Network",
      tone: "blue",
      columns: 1,
      fields: [
        {
          key: "ip",
          label: "IP Address",
          icon: "Server",
          iconTone: "blue",
          valueTone: "blue",
          mono: true,
          copyable: true,
        },
        {
          key: "is_ipv6",
          label: "IP Version",
          icon: "BadgeInfo",
          iconTone: "slate",
          valueTone: "slate",
          formatValue: formatIpVersion,
          mono: true,
        },
      ],
    },
  ],
};

function formatNetAddressTitle(value: string, data: AttackGraphDetailData) {
  return value.trim() || data.ip?.trim() || "";
}

function renderIpVersionBadge(value: string) {
  const label = formatIpVersion(value);
  if (!label || label === "-") {
    return null;
  }

  return (
    <Badge
      variant="outline"
      className="border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-50"
    >
      {label}
    </Badge>
  );
}

function formatIpVersion(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "1" || normalized === "true") return "IPv6";
  if (normalized === "0" || normalized === "false") return "IPv4";
  return normalized;
}
