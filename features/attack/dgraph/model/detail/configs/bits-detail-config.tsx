import type { AttackGraphDetailCardConfig } from "../attack-graph-detail-config-types";
import {
  formatBitsJobFiles,
  formatBitsJobStatus,
  formatBitsJobType,
  formatBitsTitle,
  renderBitsBadge,
  renderBitsJobFiles,
} from "../rules/bits-detail-rules";

export const BITS_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    icon: "Database",
    iconTone: "blue",
    title: {
      key: "job_name",
      fallback: "BITS Job",
      formatValue: formatBitsTitle,
    },
    badges: [
      {
        key: "entity_type",
        customRender: renderBitsBadge,
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
      title: "BITS Job Information",
      icon: "Activity",
      tone: "blue",
      columns: 2,
      fields: [
        {
          key: "job_name",
          label: "Job Name",
          icon: "FileText",
          iconTone: "blue",
          bold: true,
          copyable: true,
        },
        {
          key: "job_id",
          label: "Job ID",
          icon: "Fingerprint",
          iconTone: "slate",
          valueTone: "slate",
          mono: true,
          copyable: true,
        },
        {
          key: "job_type_desc",
          label: "Job Type",
          icon: "Tag",
          iconTone: "blue",
          valueTone: "slate",
          formatValue: formatBitsJobType,
        },
        {
          key: "job_status_desc",
          label: "Job Status",
          icon: "Tag",
          iconTone: "slate",
          valueTone: "slate",
          formatValue: formatBitsJobStatus,
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
    {
      title: "BITS Job Files",
      icon: "Activity",
      tone: "blue",
      columns: 1,
      fields: [
        {
          key: "job_files",
          label: "Files",
          icon: "FolderOpen",
          iconTone: "blue",
          display: "block",
          copyable: true,
          hideWhenEmpty: true,
          formatValue: formatBitsJobFiles,
          customRender: renderBitsJobFiles,
        },
      ],
    },
  ],
};
