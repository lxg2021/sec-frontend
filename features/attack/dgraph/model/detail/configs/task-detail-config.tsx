import type {
  AttackGraphDetailCardConfig,
  AttackGraphDetailData,
} from "../attack-graph-detail-config-types";

export const TASK_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    icon: "Clock",
    iconTone: "blue",
    title: {
      key: "task_name",
      fallback: "Task",
      formatValue: formatTaskTitle,
    },
    fields: [
      { key: "agent_id", label: "Agent ID", icon: "Monitor", iconTone: "blue", mono: true },
      { key: "occurred_at", label: "Occurred", icon: "Clock", iconTone: "green", mono: true },
    ],
  },
  sections: [
    {
      title: "Task Information",
      icon: "Clock",
      tone: "blue",
      columns: 2,
      fields: [
        {
          key: "task_name",
          label: "Task Name",
          icon: "FileText",
          iconTone: "blue",
          bold: true,
        },
        {
          key: "task_path",
          label: "Task Path",
          icon: "FolderTree",
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
          key: "server_name",
          label: "Server",
          icon: "Server",
          iconTone: "blue",
          mono: true,
        },
        {
          key: "domain",
          label: "Domain",
          icon: "Network",
          iconTone: "blue",
          mono: true,
        },
        {
          key: "user",
          label: "User",
          icon: "User",
          iconTone: "purple",
          mono: true,
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
      title: "Task Image",
      icon: "Terminal",
      tone: "cyan",
      columns: 1,
      fields: [
        {
          key: "task_image_paths",
          label: "Image Path",
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
          formatValue: formatTaskListValue,
          customRender: renderTaskListValue,
        },
        {
          key: "task_image_parameters",
          label: "Parameters",
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
          formatValue: formatTaskListValue,
          customRender: renderTaskListValue,
        },
        {
          key: "task_image_md5s",
          label: "MD5",
          icon: "Fingerprint",
          iconTone: "slate",
          valueTone: "slate",
          display: "block",
          mono: true,
          copyable: true,
          formatValue: formatTaskListValue,
          customRender: renderTaskListValue,
        },
      ],
    },
    {
      title: "Trigger Information",
      icon: "Activity",
      tone: "slate",
      columns: 1,
      fields: [
        {
          key: "task_trigger_types",
          label: "Trigger Type",
          icon: "Tag",
          iconTone: "purple",
          mono: true,
          formatValue: formatTaskListValue,
          customRender: renderTaskListValue,
        },
        {
          key: "task_triggers_json",
          label: "Trigger JSON",
          icon: "Code",
          iconTone: "cyan",
          valueTone: "cyan",
          display: "code",
          mono: true,
          copyable: true,
          truncate: true,
          maxLength: 160,
          expandable: true,
          showInPopover: true,
          formatValue: formatTaskJsonValue,
          customRender: renderTaskJsonValue,
        },
      ],
    },
  ],
};

function formatTaskTitle(value: string, data: AttackGraphDetailData) {
  return value.trim() || basename(firstListValue(data.task_image_paths)) || "";
}

function formatTaskListValue(value: string) {
  return parseTaskListValue(value).join("\n");
}

function renderTaskListValue(value: string) {
  return (
    <span className="whitespace-pre-wrap break-all">
      {formatTaskListValue(value)}
    </span>
  );
}

function formatTaskJsonValue(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return "";
  }

  try {
    return JSON.stringify(JSON.parse(normalized), null, 2);
  } catch {
    return normalized;
  }
}

function renderTaskJsonValue(value: string) {
  return (
    <pre className="m-0 whitespace-pre-wrap break-all font-mono">
      {formatTaskJsonValue(value)}
    </pre>
  );
}

function firstListValue(value: string | undefined) {
  return parseTaskListValue(value ?? "")[0] ?? "";
}

function parseTaskListValue(value: string) {
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
    // Graph values can arrive as comma-separated strings after transport
    // normalization; fall through to lightweight splitting.
  }

  return normalized
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((item) => item.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

function basename(value: string) {
  const normalized = value.trim().replace(/[\\/]+$/g, "");
  if (!normalized) return "";

  const parts = normalized.split(/[\\/]+/).filter(Boolean);
  return parts[parts.length - 1] ?? normalized;
}
