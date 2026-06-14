import type {
  AttackGraphDetailCardConfig,
  AttackGraphDetailData,
} from "../attack-graph-detail-config-types";
import {
  formatDriverType,
  resolveDriverTypeIcon,
  resolveDriverTypeTone,
} from "../rules/driver-type-detail-rules";

export const FILE_STREAM_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    icon: "FileText",
    iconTone: "blue",
    title: {
      key: "stream_name",
      fallback: "FileStream",
      formatValue: formatFileStreamTitle,
    },
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
      title: "File Stream Information",
      icon: "Activity",
      tone: "blue",
      columns: 1,
      fields: [
        {
          key: "stream_name",
          label: "Stream Name",
          icon: "GitBranch",
          iconTone: "blue",
          valueTone: "blue",
          bold: true,
          mono: true,
          copyable: true,
        },
        {
          key: "base_path",
          label: "Full Path",
          icon: "FolderOpen",
          iconTone: "cyan",
          valueTone: "cyan",
          display: "code",
          mono: true,
          copyable: true,
          truncate: true,
          maxLength: 140,
          expandable: true,
          showInPopover: true,
          formatValue: formatFileStreamFullPath,
        },
        {
          key: "base_path",
          label: "Base Path",
          icon: "FolderOpen",
          iconTone: "cyan",
          valueTone: "cyan",
          display: "code",
          mono: true,
          copyable: true,
          truncate: true,
          maxLength: 140,
          expandable: true,
          showInPopover: true,
        },
        {
          key: "file_md5",
          label: "MD5",
          icon: "Fingerprint",
          iconTone: "slate",
          valueTone: "slate",
          mono: true,
          copyable: true,
          hideWhenEmpty: true,
        },
        {
          key: "file_class_description",
          label: "File Class",
          icon: "Tag",
          iconTone: "blue",
          valueTone: "slate",
          formatValue: formatFileStreamDescriptor,
          hideWhenEmpty: true,
        },
        {
          key: "file_format_description",
          label: "File Format",
          icon: "Tag",
          iconTone: "blue",
          valueTone: "slate",
          formatValue: formatFileStreamDescriptor,
          hideWhenEmpty: true,
        },
        {
          key: "driver_type",
          label: "Driver Type",
          icon: "HardDrive",
          formatValue: formatDriverType,
          resolveIcon: resolveDriverTypeIcon,
          resolveTone: resolveDriverTypeTone,
          hideWhenEmpty: true,
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

function formatFileStreamTitle(value: string, data: AttackGraphDetailData) {
  const streamName = value.trim() || data.stream_name?.trim() || "";
  const baseName = basename(data.base_path);

  if (baseName && streamName && !baseName.includes(`:${streamName}`)) {
    return `${baseName}:${streamName}`;
  }

  return streamName || baseName || data.graph_display_name?.trim() || "";
}

function formatFileStreamDescriptor(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return "";
  }

  return normalized.replace(/^(fc|fmt)_/i, "").replace(/_/g, " ");
}

function formatFileStreamFullPath(value: string, data: AttackGraphDetailData) {
  const basePath = value.trim();
  const streamName = data.stream_name?.trim() ?? "";

  if (basePath && streamName && !basePath.endsWith(`:${streamName}`)) {
    return `${basePath}:${streamName}`;
  }

  return basePath || streamName;
}

function basename(value: string | undefined) {
  const normalized = value?.trim().replace(/[\\/]+$/g, "") ?? "";
  if (!normalized) return "";

  const parts = normalized.split(/[\\/]+/).filter(Boolean);
  return parts[parts.length - 1] ?? normalized;
}
