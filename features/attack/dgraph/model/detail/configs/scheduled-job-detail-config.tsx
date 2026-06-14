import { Badge } from "@/shared/ui/badge";

import type {
  AttackGraphDetailCardConfig,
  AttackGraphDetailData,
} from "../attack-graph-detail-config-types";

export const SCHEDULED_JOB_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    icon: "Clock",
    iconTone: "blue",
    title: {
      key: "job_binary_path_name",
      fallback: "Scheduled Job",
      formatValue: formatScheduledJobTitle,
    },
    badges: [
      {
        key: "flag",
        customRender: (value) => (
          <Badge variant="outline" className="border-black bg-black text-white">
            {value || "N/A"}
          </Badge>
        ),
      },
    ],
    fields: [
      { key: "agent_id", label: "Agent ID", icon: "Monitor", iconTone: "blue", mono: true },
      { key: "occurred_at", label: "Occurred", icon: "Clock", iconTone: "green", mono: true },
    ],
  },
  sections: [
    {
      title: "Scheduled Job Information",
      icon: "Clock",
      tone: "blue",
      columns: 2,
      fields: [
        { key: "job_id", label: "Job ID", icon: "Hash", iconTone: "blue", mono: true },
        {
          key: "command",
          label: "Command",
          icon: "Terminal",
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
          key: "job_binary_path_name",
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
          key: "job_binary_md5",
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
    {
      title: "Schedule Information",
      icon: "Clock",
      tone: "slate",
      columns: 2,
      fields: [
        {
          key: "first_execute_time",
          label: "First Execute",
          icon: "Clock",
          iconTone: "green",
          mono: true,
        },
        {
          key: "days_of_month",
          label: "Days Of Month",
          icon: "Hash",
          iconTone: "slate",
          mono: true,
        },
        {
          key: "days_of_week",
          label: "Days Of Week",
          icon: "Hash",
          iconTone: "slate",
          mono: true,
        },
        {
          key: "flag",
          label: "Flag",
          icon: "Tag",
          iconTone: "purple",
          mono: true,
        },
      ],
    },
  ],
};

function formatScheduledJobTitle(
  value: string,
  data: AttackGraphDetailData,
) {
  return (
    basename(value) ||
    data.command?.trim() ||
    formatJobId(data.job_id) ||
    ""
  );
}

function formatJobId(value: string | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized ? `Job #${normalized}` : "";
}

function basename(value: string) {
  const normalized = value.trim().replace(/[\\/]+$/g, "");
  if (!normalized) return "";

  const parts = normalized.split(/[\\/]+/).filter(Boolean);
  return parts[parts.length - 1] ?? normalized;
}
