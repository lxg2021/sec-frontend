import { Badge } from "@/shared/ui/badge";

import type {
  AttackGraphDetailCardConfig,
  AttackGraphDetailData,
} from "../attack-graph-detail-config-types";

export const NET_ENDPOINT_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    icon: "Network",
    iconTone: "cyan",
    title: {
      key: "ip",
      fallback: "NetEndpoint",
      formatValue: formatNetEndpointTitle,
    },
    badges: [
      {
        key: "protocol",
        customRender: renderProtocolBadge,
      },
      {
        key: "is_ipv6",
        customRender: renderIpVersionBadge,
      },
    ],
  },
  sections: [
    {
      title: "Endpoint Information",
      icon: "Network",
      tone: "cyan",
      columns: 1,
      fields: [
        {
          key: "ip",
          label: "IP Address",
          icon: "Server",
          iconTone: "cyan",
          valueTone: "cyan",
          mono: true,
          copyable: true,
        },
        {
          key: "port",
          label: "Port",
          icon: "Hash",
          iconTone: "blue",
          valueTone: "blue",
          mono: true,
        },
        {
          key: "protocol",
          label: "Protocol",
          icon: "Network",
          iconTone: "slate",
          valueTone: "slate",
          formatValue: formatProtocol,
          mono: true,
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

function formatNetEndpointTitle(value: string, data: AttackGraphDetailData) {
  const ip = value.trim() || data.ip?.trim() || "";
  const port = data.port?.trim() || "";
  if (!ip) {
    return "";
  }

  const host = ip.includes(":") && !ip.startsWith("[") ? `[${ip}]` : ip;
  return port ? `${host}:${port}` : host;
}

function renderProtocolBadge(value: string) {
  const label = formatProtocol(value);
  if (!label || label === "-") {
    return null;
  }

  return (
    <Badge
      variant="secondary"
      className="border-transparent bg-cyan-50 text-cyan-700 hover:bg-cyan-50"
    >
      {label}
    </Badge>
  );
}

function renderIpVersionBadge(value: string) {
  const label = formatIpVersion(value);
  if (!label || label === "-") {
    return null;
  }

  return (
    <Badge
      variant="outline"
      className="border-slate-200 bg-slate-50 text-slate-600"
    >
      {label}
    </Badge>
  );
}

function formatProtocol(value: string) {
  return value.trim().toUpperCase();
}

function formatIpVersion(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "1" || normalized === "true") return "IPv6";
  if (normalized === "0" || normalized === "false") return "IPv4";
  return normalized;
}
