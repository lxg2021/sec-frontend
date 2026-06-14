import { Badge } from "@/shared/ui/badge";

import type { AttackGraphDetailCardConfig } from "../attack-graph-detail-config-types";

export const FILE_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
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
      { key: "driver_type", label: "Driver", icon: "Database", iconTone: "amber" },
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
        { key: "signature", label: "Signature", icon: "Lock", iconTone: "red" },
        { key: "sign_vendor", label: "Sign Vendor", icon: "Shield", iconTone: "red" },
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
