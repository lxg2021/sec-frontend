import { Badge } from "@/shared/ui/badge";

import type { AttackGraphDetailData } from "../attack-graph-detail-config-types";
import type { AttackGraphPresentationTone } from "../attack-graph-detail-types";

export function formatDeviceDescription(value: string) {
  const normalized = toRuleValue(value);
  if (!normalized) {
    return "";
  }

  return formatDeviceDescriptionToken(normalized);
}

export function formatDeviceType(value: string) {
  const normalized = toRuleValue(value);
  if (!normalized) {
    return "";
  }

  const numericValue = parseNumericValue(normalized);
  if (numericValue === null) {
    return formatDeviceDescriptionToken(normalized);
  }

  if (numericValue === 0) {
    return "unknown";
  }

  const labels = DEVICE_TYPE_FLAGS.reduce<string[]>((items, flag) => {
    if ((numericValue & flag.value) === flag.value) {
      items.push(flag.label);
    }
    return items;
  }, []);

  return labels.length > 0 ? labels.join(", ") : String(numericValue);
}

export function formatDeviceState(value: string, data?: AttackGraphDetailData) {
  const normalized = toRuleValue(value) || toRuleValue(data?.device_flag);
  if (!normalized) {
    return "";
  }

  const lower = normalized.toLowerCase();
  if (lower === "device_insert" || lower === "insert" || lower === "1") {
    return "insert";
  }
  if (lower === "device_remove" || lower === "remove" || lower === "0") {
    return "remove";
  }
  return lower.replace(/^device_/, "").replace(/_/g, " ");
}

export function resolveDeviceStateTone(
  value: string,
  data: AttackGraphDetailData,
): AttackGraphPresentationTone | undefined {
  const state = formatDeviceState(value, data);
  if (state === "insert") {
    return "green";
  }
  if (state === "remove") {
    return "orange";
  }
  return undefined;
}

export function renderDeviceTypeBadge() {
  return (
    <Badge
      variant="secondary"
      className="border-transparent bg-slate-100 text-slate-600 hover:bg-slate-100"
    >
      device
    </Badge>
  );
}

export function renderDeviceStateBadge(
  value: string,
  data: AttackGraphDetailData,
) {
  const state = formatDeviceState(value, data);
  if (!state || state === "-") {
    return null;
  }

  const className =
    state === "insert"
      ? "border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
      : state === "remove"
        ? "border-transparent bg-orange-100 text-orange-700 hover:bg-orange-100"
        : "border-transparent bg-slate-100 text-slate-600 hover:bg-slate-100";

  return (
    <Badge
      variant="secondary"
      className={`min-w-[72px] justify-center ${className}`}
    >
      {state}
    </Badge>
  );
}

function formatDeviceDescriptionToken(value: string) {
  const normalized = value.trim();
  const lower = normalized.toLowerCase();
  const label = DEVICE_DESCRIPTION_LABELS[lower];
  if (label) {
    return label;
  }

  if (lower.startsWith("device_type_")) {
    return lower.replace(/^device_type_/, "").replace(/_/g, " ");
  }

  return normalized;
}

function parseNumericValue(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!/^(0x[0-9a-f]+|\d+)$/i.test(normalized)) {
    return null;
  }

  const parsed = normalized.startsWith("0x")
    ? Number.parseInt(normalized.slice(2), 16)
    : Number.parseInt(normalized, 10);

  return Number.isFinite(parsed) ? parsed : null;
}

function toRuleValue(value: unknown) {
  return String(value ?? "").trim();
}

const DEVICE_DESCRIPTION_LABELS: Record<string, string> = {
  device_type_unknown: "unknown",
  device_type_cdrom: "cd-rom",
  device_type_floppy: "floppy",
  device_type_usbnormal: "usb device",
  device_type_usbstorage: "usb storage",
  device_type_printer: "printer",
  device_type_modem: "modem",
  device_type_serial: "serial",
  device_type_parport: "parallel port",
  device_type_1394controler: "1394 controller",
  device_type_infrared: "infrared",
  device_type_bluetooth: "bluetooth",
  device_type_pcmcia: "pcmcia",
  device_type_tape: "tape",
  device_type_image: "image",
  device_type_wirelesscard: "wireless card",
  device_type_smartcard: "smart card",
  device_type_media: "media",
  device_type_usbclass: "usb class",
  device_type_keyboard: "keyboard",
  device_type_mouse: "mouse",
  device_type_diskdrive: "disk drive",
  device_type_monitor: "monitor",
};

const DEVICE_TYPE_FLAGS = [
  { value: 0x00002, label: "cd-rom" },
  { value: 0x00004, label: "floppy" },
  { value: 0x00008, label: "usb device" },
  { value: 0x00010, label: "usb storage" },
  { value: 0x00020, label: "printer" },
  { value: 0x00040, label: "modem" },
  { value: 0x00080, label: "serial" },
  { value: 0x00100, label: "parallel port" },
  { value: 0x00200, label: "1394 controller" },
  { value: 0x00400, label: "infrared" },
  { value: 0x00800, label: "bluetooth" },
  { value: 0x01000, label: "pcmcia" },
  { value: 0x02000, label: "tape" },
  { value: 0x04000, label: "image" },
  { value: 0x08000, label: "wireless card" },
  { value: 0x10000, label: "smart card" },
  { value: 0x20000, label: "media" },
  { value: 0x40000, label: "usb class" },
  { value: 0x80000, label: "keyboard" },
  { value: 0x100000, label: "mouse" },
  { value: 0x200000, label: "disk drive" },
  { value: 0x400000, label: "monitor" },
];
