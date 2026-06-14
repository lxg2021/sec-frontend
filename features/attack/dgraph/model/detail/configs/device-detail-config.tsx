import type {
  AttackGraphDetailCardConfig,
  AttackGraphDetailData,
} from "../attack-graph-detail-config-types";
import {
  formatDeviceDescription,
  formatDeviceState,
  formatDeviceType,
  renderDeviceStateBadge,
  renderDeviceTypeBadge,
  resolveDeviceStateTone,
} from "../rules/device-detail-rules";

export const DEVICE_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    icon: "Usb",
    iconTone: "blue",
    title: {
      key: "device_description",
      fallback: "Device",
      formatValue: formatDeviceTitle,
    },
    badges: [
      {
        key: "entity_type",
        customRender: renderDeviceTypeBadge,
      },
      {
        key: "device_flag_description",
        customRender: renderDeviceStateBadge,
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
    ],
  },
  sections: [
    {
      title: "Device Information",
      icon: "Activity",
      tone: "blue",
      columns: 1,
      fields: [
        {
          key: "device_description",
          label: "Device Type",
          icon: "Usb",
          iconTone: "slate",
          valueTone: "slate",
          bold: true,
          formatValue: formatDeviceDescription,
        },
        {
          key: "hid",
          label: "HID",
          icon: "Key",
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
          key: "device_guid",
          label: "Device GUID",
          icon: "Fingerprint",
          iconTone: "slate",
          valueTone: "slate",
          mono: true,
          copyable: true,
        },
        {
          key: "device_type",
          label: "Device Type Code",
          icon: "HardDrive",
          iconTone: "slate",
          valueTone: "slate",
          formatValue: formatDeviceType,
          hideWhenEmpty: true,
        },
        {
          key: "device_flag_description",
          label: "Device State",
          icon: "BadgeInfo",
          formatValue: formatDeviceState,
          resolveTone: resolveDeviceStateTone,
        },
      ],
    },
  ],
};

function formatDeviceTitle(value: string, data: AttackGraphDetailData) {
  return (
    formatDeviceDescription(value) ||
    data.hid?.trim() ||
    data.device_guid?.trim() ||
    data.graph_display_name?.trim() ||
    ""
  );
}
