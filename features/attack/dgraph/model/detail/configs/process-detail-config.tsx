import { Badge } from "@/shared/ui/badge";

import type {
  AttackGraphDetailCardConfig,
  AttackGraphDetailData,
  AttackGraphDetailIconName,
} from "../attack-graph-detail-config-types";
import type { AttackGraphPresentationTone } from "../attack-graph-detail-types";

export const PROCESS_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    icon: "Terminal",
    iconTone: "cyan",
    title: {
      key: "process_name",
      fallback: "Process",
    },
    badges: [
      {
        key: "signature",
        customRender: (value) => (
          <Badge variant={isSigned(value) ? "default" : "destructive"}>
            {isSigned(value) ? "Signed" : "Unsigned"}
          </Badge>
        ),
      },
    ],
    fields: [
      { key: "agent_id", label: "Agent ID", icon: "Monitor", iconTone: "blue", mono: true },
      { key: "occurred_at", label: "Occurred", icon: "Clock", iconTone: "green", mono: true },
      { key: "user_id", label: "User ID", icon: "User", iconTone: "purple", mono: true },
      { key: "session", label: "Session", icon: "Hash", iconTone: "blue", mono: true },
    ],
  },
  sections: [
    {
      title: "Process Information",
      icon: "Activity",
      tone: "blue",
      columns: 2,
      fields: [
        { key: "process_id", label: "PID", icon: "Hash", iconTone: "blue", mono: true },
        {
          key: "process_name",
          label: "Process Name",
          icon: "FileText",
          bold: true,
          resolveTone: resolveProcessOriginalNameMismatchTone,
        },
        {
          key: "process_image",
          label: "Process Path",
          icon: "FolderOpen",
          display: "block",
          mono: true,
          copyable: true,
        },
        {
          key: "process_command_line",
          label: "Command Line",
          icon: "Terminal",
          iconTone: "cyan",
          valueTone: "cyan",
          display: "code",
          mono: true,
          truncate: true,
          maxLength: 120,
          expandable: true,
          showInPopover: true,
          copyable: true,
        },
        {
          key: "process_md5",
          label: "MD5",
          icon: "Fingerprint",
          iconTone: "slate",
          valueTone: "slate",
          mono: true,
          copyable: true,
        },
        {
          key: "process_guid",
          label: "GUID",
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
          copyable: true,
        },
      ],
    },
    {
      title: "Security Information",
      icon: "Shield",
      tone: "slate",
      resolveTone: resolveSecurityInformationTone,
      fields: [
        {
          key: "signature",
          label: "Signature",
          icon: "Lock",
          formatValue: formatSignature,
          resolveTone: resolveSignatureTone,
        },
        {
          key: "sign_vendor",
          label: "Sign Vendor",
          icon: "Shield",
          resolveTone: resolveSignatureRelatedTone,
        },
        {
          key: "rtlo",
          label: "RTLO",
          icon: "Languages",
          formatValue: formatRtlo,
          resolveTone: resolveRtloTone,
        },
        {
          key: "show_window_flag",
          label: "Show Window",
          icon: "Eye",
          mono: true,
          formatValue: formatShowWindowFlag,
          resolveIcon: resolveShowWindowIcon,
          resolveTone: resolveShowWindowTone,
        },
        {
          key: "org_file_name",
          label: "Original File Name",
          icon: "FileText",
          mono: true,
          copyable: true,
          resolveTone: resolveProcessOriginalNameMismatchTone,
        },
        {
          key: "driver_type",
          label: "Driver Type",
          icon: "HardDrive",
          formatValue: formatProcessDriverType,
          resolveIcon: resolveProcessDriverTypeIcon,
          resolveTone: resolveProcessDriverTypeTone,
        },
      ],
    },
  ],
};

function isSigned(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "signed" || normalized === "true";
}

function formatSignature(value: string) {
  return isSigned(value) ? "signed" : "unsigned";
}

function resolveSignatureTone(value: string): AttackGraphPresentationTone | undefined {
  return isSigned(value) ? undefined : "orange";
}

function resolveSignatureRelatedTone(
  _value: string,
  data: AttackGraphDetailData,
): AttackGraphPresentationTone | undefined {
  return isSigned(data.signature) ? undefined : "orange";
}

function resolveProcessOriginalNameMismatchTone(
  _value: string,
  data: AttackGraphDetailData,
): AttackGraphPresentationTone | undefined {
  return hasProcessOriginalNameMismatch(data) ? "orange" : undefined;
}

function resolveSecurityInformationTone(
  data: AttackGraphDetailData,
): AttackGraphPresentationTone {
  if (isRtloDetected(data.rtlo) || isShowWindowHidden(data.show_window_flag)) {
    return "red";
  }
  if (
    !isSigned(data.signature) ||
    PROCESS_DRIVER_TYPE_ALERT_VALUES.has((data.driver_type ?? "").trim())
  ) {
    return "orange";
  }
  return "slate";
}

function formatRtlo(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "1" || normalized === "true") {
    return "rtlo detected";
  }
  if (normalized === "0" || normalized === "false") {
    return "normal";
  }
  return value.toLowerCase();
}

function resolveRtloTone(value: string): AttackGraphPresentationTone | undefined {
  return isRtloDetected(value) ? "red" : undefined;
}

function formatShowWindowFlag(value: string) {
  const normalized = value.trim();
  const label = SHOW_WINDOW_FLAG_LABELS[normalized];
  return (label ?? normalized).toLowerCase();
}

function resolveShowWindowIcon(value: string): AttackGraphDetailIconName {
  return isShowWindowHidden(value) ? "EyeOff" : "Eye";
}

function resolveShowWindowTone(value: string): AttackGraphPresentationTone | undefined {
  return isShowWindowHidden(value) ? "red" : undefined;
}

function formatProcessDriverType(value: string) {
  const normalized = value.trim();
  const label = PROCESS_DRIVER_TYPE_LABELS[normalized];
  return (label ?? normalized).toLowerCase();
}

function resolveProcessDriverTypeIcon(value: string): AttackGraphDetailIconName {
  const normalized = value.trim();
  if (normalized === "2") {
    return "Usb";
  }
  if (normalized === "4") {
    return "Disc";
  }
  if (normalized === "8") {
    return "Network";
  }
  return "HardDrive";
}

function resolveProcessDriverTypeTone(
  value: string,
): AttackGraphPresentationTone | undefined {
  return PROCESS_DRIVER_TYPE_ALERT_VALUES.has(value.trim()) ? "orange" : undefined;
}

function isRtloDetected(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true";
}

function isShowWindowHidden(value: string) {
  return value.trim() === "0";
}

function hasProcessOriginalNameMismatch(data: AttackGraphDetailData) {
  const processName = normalizeComparableFileName(data.process_name);
  const originalFileName = normalizeComparableFileName(data.org_file_name);
  return (
    processName.length > 0 &&
    originalFileName.length > 0 &&
    processName !== originalFileName
  );
}

function normalizeComparableFileName(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

const SHOW_WINDOW_FLAG_LABELS: Record<string, string> = {
  "0": "Hidden",
  "1": "Normal",
  "2": "Minimized",
  "3": "Maximized",
  "4": "Shown No Activate",
  "5": "Show",
  "6": "Minimize",
  "7": "Minimized No Activate",
  "8": "Show No Activate",
  "9": "Restore",
  "10": "Default",
  "11": "Force Minimize",
};

const PROCESS_DRIVER_TYPE_LABELS: Record<string, string> = {
  "0": "Unknown",
  "1": "Local Disk",
  "2": "Removable",
  "4": "CD-ROM",
  "8": "Network",
  "16": "RAM Disk",
};

const PROCESS_DRIVER_TYPE_ALERT_VALUES = new Set(["2", "4", "8"]);
