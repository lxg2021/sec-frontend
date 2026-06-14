import type { AttackGraphDetailIconName } from "../attack-graph-detail-config-types";
import type { AttackGraphPresentationTone } from "../attack-graph-detail-types";

export function formatFileDriverType(value: string) {
  const normalized = toRuleValue(value);
  const label = FILE_DRIVER_TYPE_LABELS[normalized];
  return (label ?? normalized).toLowerCase();
}

export function resolveFileDriverTypeIcon(
  value: string,
): AttackGraphDetailIconName {
  const normalized = toRuleValue(value);
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

export function resolveFileDriverTypeTone(
  value: string,
): AttackGraphPresentationTone | undefined {
  return FILE_DRIVER_TYPE_ALERT_VALUES.has(toRuleValue(value))
    ? "orange"
    : undefined;
}

function toRuleValue(value: unknown) {
  return String(value ?? "").trim();
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
