import { Badge } from "@/shared/ui/badge";

import type {
  AttackGraphDetailCardConfig,
  AttackGraphDetailData,
} from "../attack-graph-detail-config-types";
import {
  formatDriverType,
  isDriverTypeSuspicious,
  resolveDriverTypeIcon,
  resolveDriverTypeTone,
} from "../rules/driver-type-detail-rules";
import {
  formatSignature,
  isSignedSignature,
  resolveSignatureRelatedTone,
  resolveSignatureTone,
} from "../rules/signature-detail-rules";

export const FILE_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    icon: "FileText",
    iconTone: "blue",
    title: {
      key: "file_name",
      fallback: "File",
      formatValue: formatFileTitle,
    },
    badges: [
      {
        key: "signature",
        customRender: (value) => {
          if (!value.trim()) {
            return null;
          }

          return (
            <Badge variant={isSignedSignature(value) ? "default" : "destructive"}>
              {isSignedSignature(value) ? "signed" : "unsigned"}
            </Badge>
          );
        },
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
      title: "File Information",
      icon: "Activity",
      tone: "blue",
      columns: 2,
      fields: [
        {
          key: "file_name",
          label: "File Name",
          icon: "FileText",
          iconTone: "blue",
          valueTone: "blue",
          bold: true,
          formatValue: formatFileTitle,
          copyable: true,
        },
        {
          key: "file_name",
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
        },
        {
          key: "file_md5",
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
          hideWhenEmpty: true,
        },
        {
          key: "org_file_name",
          label: "Original File Name",
          icon: "FileText",
          iconTone: "slate",
          valueTone: "slate",
          mono: true,
          copyable: true,
        },
        {
          key: "description",
          label: "Description",
          icon: "Info",
          iconTone: "slate",
          hideWhenEmpty: true,
        },
        {
          key: "file_type",
          label: "File Type",
          icon: "Tag",
          iconTone: "slate",
          valueTone: "slate",
          mono: true,
          hideWhenEmpty: true,
        },
      ],
    },
    {
      title: "Security Information",
      icon: "Shield",
      tone: "slate",
      resolveTone: resolveFileSecurityInformationTone,
      columns: 2,
      fields: [
        {
          key: "signature",
          label: "Signature",
          icon: "Lock",
          formatValue: formatSignature,
          resolveTone: resolveSignatureTone,
          hideWhenEmpty: true,
        },
        {
          key: "sign_vendor",
          label: "Sign Vendor",
          icon: "Shield",
          resolveTone: resolveSignatureRelatedTone,
        },
        {
          key: "file_class_description",
          label: "File Class",
          icon: "Tag",
          iconTone: "blue",
          valueTone: "slate",
          formatValue: formatFileDescriptor,
          hideWhenEmpty: true,
        },
        {
          key: "file_format_description",
          label: "File Format",
          icon: "Tag",
          iconTone: "blue",
          valueTone: "slate",
          formatValue: formatFileDescriptor,
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
          key: "detection_content",
          label: "Detection Content",
          icon: "Code",
          iconTone: "red",
          valueTone: "red",
          display: "code",
          mono: true,
          copyable: true,
          truncate: true,
          maxLength: 160,
          expandable: true,
          showInPopover: true,
          hideWhenEmpty: true,
        },
      ],
    },
  ],
};

function formatFileTitle(value: string, data?: AttackGraphDetailData) {
  return basename(value.trim() || data?.file_name?.trim() || "");
}

function formatFileDescriptor(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return "";
  }

  return normalized.replace(/^(fc|fmt)_/i, "").replace(/_/g, " ");
}

function resolveFileSecurityInformationTone(data: AttackGraphDetailData) {
  if (data.detection_content?.trim()) {
    return "red";
  }

  if (
    (data.signature?.trim() && !isSignedSignature(data.signature)) ||
    isDriverTypeSuspicious(data.driver_type)
  ) {
    return "orange";
  }

  return undefined;
}

function basename(value: string) {
  const normalized = value.trim().replace(/[\\/]+$/g, "");
  if (!normalized) return "";

  const parts = normalized.split(/[\\/]+/).filter(Boolean);
  return parts[parts.length - 1] ?? normalized;
}
