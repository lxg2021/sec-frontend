import type {
  AttackGraphDetailData,
  AttackGraphDetailIconName,
} from "../attack-graph-detail-config-types";
import type { AttackGraphPresentationTone } from "../attack-graph-detail-types";
import { isSignedSignature } from "./signature-detail-rules";

export function resolveProcessOriginalNameMismatchTone(
  _value: string,
  data: AttackGraphDetailData,
): AttackGraphPresentationTone | undefined {
  return hasProcessOriginalNameMismatch(data) ? "orange" : undefined;
}

export function resolveSecurityInformationTone(
  data: AttackGraphDetailData,
): AttackGraphPresentationTone {
  if (isRtloDetected(data.rtlo) || isShowWindowHidden(data.show_window_flag)) {
    return "red";
  }
  if (
    !isSignedSignature(data.signature) ||
    PROCESS_DRIVER_TYPE_ALERT_VALUES.has(toRuleValue(data.driver_type))
  ) {
    return "orange";
  }
  return "slate";
}

export function formatRtlo(value: string) {
  const normalized = toRuleValue(value).toLowerCase();
  if (normalized === "1" || normalized === "true") {
    return "rtlo detected";
  }
  if (normalized === "0" || normalized === "false") {
    return "normal";
  }
  return value.toLowerCase();
}

export function resolveRtloTone(
  value: string,
): AttackGraphPresentationTone | undefined {
  return isRtloDetected(value) ? "red" : undefined;
}

export function formatShowWindowFlag(value: string) {
  const normalized = toRuleValue(value);
  const label = SHOW_WINDOW_FLAG_LABELS[normalized];
  return (label ?? normalized).toLowerCase();
}

export function resolveShowWindowIcon(
  value: string,
): AttackGraphDetailIconName {
  return isShowWindowHidden(value) ? "EyeOff" : "Eye";
}

export function resolveShowWindowTone(
  value: string,
): AttackGraphPresentationTone | undefined {
  return isShowWindowHidden(value) ? "red" : undefined;
}

export function formatProcessDriverType(value: string) {
  const normalized = toRuleValue(value);
  const label = PROCESS_DRIVER_TYPE_LABELS[normalized];
  return (label ?? normalized).toLowerCase();
}

export function resolveProcessDriverTypeIcon(
  value: string,
): AttackGraphDetailIconName {
  const normalized = toRuleValue(value);
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

export function resolveProcessDriverTypeTone(
  value: string,
): AttackGraphPresentationTone | undefined {
  return PROCESS_DRIVER_TYPE_ALERT_VALUES.has(toRuleValue(value))
    ? "orange"
    : undefined;
}

function isRtloDetected(value: unknown) {
  const normalized = toRuleValue(value).toLowerCase();
  return normalized === "1" || normalized === "true";
}

function isShowWindowHidden(value: unknown) {
  return toRuleValue(value) === "0";
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
  return toRuleValue(value).toLowerCase();
}

function toRuleValue(value: unknown) {
  return String(value ?? "").trim();
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
