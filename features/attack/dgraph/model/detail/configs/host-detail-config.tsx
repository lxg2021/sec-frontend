import type {
  AttackGraphDetailCardConfig,
  AttackGraphDetailData,
} from "../attack-graph-detail-config-types";

export const HOST_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    icon: "Monitor",
    iconTone: "blue",
    title: {
      key: "computer_name",
      fallback: "Host",
      formatValue: formatHostTitle,
    },
  },
  sections: [
    {
      title: "Host Information",
      icon: "Activity",
      tone: "blue",
      columns: 1,
      fields: [
        {
          key: "computer_name",
          label: "Computer Name",
          icon: "Monitor",
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
        },
        {
          key: "ips",
          label: "IP Addresses",
          icon: "Network",
          iconTone: "cyan",
          valueTone: "cyan",
          display: "code",
          mono: true,
          copyable: true,
          hideWhenEmpty: true,
          formatValue: formatHostIpList,
          customRender: renderHostIpList,
        },
        {
          key: "agent_id",
          label: "Agent ID",
          icon: "Monitor",
          iconTone: "blue",
          valueTone: "slate",
          mono: true,
          copyable: true,
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

function formatHostTitle(value: string, data: AttackGraphDetailData) {
  return (
    value.trim() ||
    data.domain?.trim() ||
    data.agent_id?.trim() ||
    data.graph_display_name?.trim() ||
    ""
  );
}

function formatHostIpList(value: string) {
  return parseHostIpList(value).join("\n");
}

function renderHostIpList(value: string) {
  return (
    <span className="whitespace-pre-wrap break-all">
      {formatHostIpList(value)}
    </span>
  );
}

function parseHostIpList(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return [];
  }

  try {
    const parsed = JSON.parse(normalized);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item ?? "").trim()).filter(Boolean);
    }
  } catch {
    // Graph transport may normalize string arrays as comma-separated text.
  }

  return normalized
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((item) => item.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}
