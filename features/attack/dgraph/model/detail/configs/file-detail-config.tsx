import { Badge } from "@/shared/ui/badge";

import type {
  AttackGraphDetailCardConfig,
  AttackGraphDetailData,
  AttackGraphDetailIconName,
} from "../attack-graph-detail-config-types";
import type { AttackGraphPresentationTone } from "../attack-graph-detail-types";

export const FILE_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    icon: "FileText",
    iconTone: "amber",
    title: {
      key: "file_name",
      fallback: "File",
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
      { key: "file_size", label: "Size", icon: "Hash", iconTone: "slate", mono: true },
      {
        key: "driver_type",
        label: "Driver",
        icon: "HardDrive",
        formatValue: formatFileDriverType,
        resolveIcon: resolveFileDriverTypeIcon,
        resolveTone: resolveFileDriverTypeTone,
      },
    ],
  },
  sections: [
    {
      title: "File Information",
      icon: "FileText",
      tone: "amber",
      columns: 1,
      fields: [
        {
          key: "file_name",
          label: "File Name",
          icon: "FolderOpen",
          iconTone: "amber",
          display: "block",
          mono: true,
          copyable: true,
        },
        { key: "org_file_name", label: "Original File", icon: "FileText", iconTone: "amber" },
        { key: "description", label: "Description", icon: "Info", iconTone: "blue" },
        { key: "file_size", label: "File Size", icon: "Hash", iconTone: "slate", mono: true },
      ],
    },
    {
      title: "Hashes",
      icon: "Fingerprint",
      tone: "red",
      fields: [
        { key: "md5", label: "MD5", icon: "Fingerprint", iconTone: "red", valueTone: "red", mono: true, copyable: true },
        { key: "sha1", label: "SHA1", icon: "Fingerprint", iconTone: "red", valueTone: "red", mono: true, copyable: true },
        { key: "sha256", label: "SHA256", icon: "Fingerprint", iconTone: "red", valueTone: "red", mono: true, copyable: true },
      ],
    },
    {
      title: "Detection",
      icon: "Shield",
      tone: "red",
      columns: 1,
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
          key: "detection_content",
          label: "Detection Content",
          icon: "Code",
          iconTone: "red",
          valueTone: "red",
          display: "code",
          mono: true,
          truncate: true,
          maxLength: 120,
          expandable: true,
          showInPopover: true,
          copyable: true,
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
  return isSigned(value) ? "Signed" : "Unsigned";
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

function formatFileDriverType(value: string) {
  const normalized = value.trim();
  const label = FILE_DRIVER_TYPE_LABELS[normalized];
  return label ?? normalized;
}

function resolveFileDriverTypeIcon(value: string): AttackGraphDetailIconName {
  const normalized = value.trim();
  if (normalized === "4" || normalized === "64") {
    return "Disc";
  }
  if (normalized === "8") {
    return "Network";
  }
  if (normalized === "2" || normalized === "16" || normalized === "32") {
    return "Usb";
  }
  return "HardDrive";
}

function resolveFileDriverTypeTone(
  value: string,
): AttackGraphPresentationTone | undefined {
  return FILE_DRIVER_TYPE_ALERT_VALUES.has(value.trim()) ? "orange" : undefined;
}

const FILE_DRIVER_TYPE_LABELS: Record<string, string> = {
  "0": "Unknown",
  "1": "Local Disk",
  "2": "Removable",
  "4": "CD-ROM",
  "8": "Network",
  "16": "USB Hard Disk",
  "32": "USB Removable",
  "64": "USB CD-ROM",
};

const FILE_DRIVER_TYPE_ALERT_VALUES = new Set(["2", "4", "8", "16", "32", "64"]);
