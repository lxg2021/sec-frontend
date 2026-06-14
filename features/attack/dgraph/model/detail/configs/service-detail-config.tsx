import type {
  AttackGraphDetailCardConfig,
  AttackGraphDetailData,
} from "../attack-graph-detail-config-types";
import {
  formatServiceStartType,
  formatServiceType,
} from "../rules/service-detail-rules";

export const SERVICE_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    icon: "Server",
    iconTone: "blue",
    title: {
      key: "service_name",
      fallback: "Service",
      formatValue: formatServiceTitle,
    },
    fields: [
      { key: "agent_id", label: "Agent ID", icon: "Monitor", iconTone: "blue", mono: true },
      { key: "occurred_at", label: "Occurred", icon: "Clock", iconTone: "green", mono: true },
    ],
  },
  sections: [
    {
      title: "Service Information",
      icon: "Server",
      tone: "blue",
      columns: 2,
      fields: [
        {
          key: "service_name",
          label: "Service Name",
          icon: "FileText",
          iconTone: "blue",
          bold: true,
        },
        {
          key: "display_name",
          label: "Display Name",
          icon: "FileText",
          iconTone: "slate",
        },
        {
          key: "service_type",
          label: "Service Type",
          icon: "Hash",
          iconTone: "slate",
          mono: true,
          formatValue: formatServiceType,
        },
        {
          key: "start_type",
          label: "Start Type",
          icon: "Activity",
          iconTone: "slate",
          mono: true,
          formatValue: formatServiceStartType,
        },
        {
          key: "service_start_name",
          label: "Service Start Name",
          icon: "User",
          iconTone: "purple",
          mono: true,
        },
        {
          key: "service_binary_path_name",
          label: "Binary Path",
          icon: "FolderOpen",
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
          key: "service_binary_md5",
          label: "MD5",
          icon: "Fingerprint",
          iconTone: "slate",
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
        },
      ],
    },
  ],
};

function formatServiceTitle(value: string, data: AttackGraphDetailData) {
  return (
    value.trim() ||
    data.display_name?.trim() ||
    basename(data.service_binary_path_name) ||
    ""
  );
}

function basename(value: string | undefined) {
  const normalized = value?.trim().replace(/[\\/]+$/g, "") ?? "";
  if (!normalized) return "";

  const parts = normalized.split(/[\\/]+/).filter(Boolean);
  return parts[parts.length - 1] ?? normalized;
}
