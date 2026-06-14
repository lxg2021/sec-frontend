import { Badge } from "@/shared/ui/badge";

import type { AttackGraphDetailCardConfig } from "../attack-graph-detail-config-types";
import {
  formatSignature,
  isSignedSignature,
  resolveSignatureRelatedTone,
  resolveSignatureTone,
} from "../rules/signature-detail-rules";
import {
  formatProcessDriverType,
  formatRtlo,
  formatShowWindowFlag,
  resolveProcessDriverTypeIcon,
  resolveProcessDriverTypeTone,
  resolveProcessOriginalNameMismatchTone,
  resolveRtloTone,
  resolveSecurityInformationTone,
  resolveShowWindowIcon,
  resolveShowWindowTone,
} from "../rules/process-detail-rules";

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
          <Badge variant={isSignedSignature(value) ? "default" : "destructive"}>
            {isSignedSignature(value) ? "Signed" : "Unsigned"}
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
