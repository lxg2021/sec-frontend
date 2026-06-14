import type { AttackGraphDetailData } from "../attack-graph-detail-config-types";
import type { AttackGraphPresentationTone } from "../attack-graph-detail-types";

const FILE_DETECTION_MAJOR_TYPES = [
  { bit: 0x01, label: "shell" },
  { bit: 0x02, label: "sdb" },
  { bit: 0x04, label: "office" },
] as const;

const FILE_DETECTION_MINOR_TYPES = [
  { bit: 0x001, label: "office ole id" },
  { bit: 0x002, label: "office msodde" },
  { bit: 0x004, label: "office rtf object" },
  { bit: 0x008, label: "office ole vba" },
  { bit: 0x010, label: "office ole metadata" },
  { bit: 0x020, label: "office ole times" },
  { bit: 0x040, label: "office ole directory" },
  { bit: 0x080, label: "office ole object" },
  { bit: 0x100, label: "office pyx swf" },
  { bit: 0x200, label: "office mraptor" },
] as const;

export function formatFileDetectionMajorType(value: string) {
  return formatDetectionMask(value, FILE_DETECTION_MAJOR_TYPES);
}

export function formatFileDetectionMinorType(value: string) {
  return formatDetectionMask(value, FILE_DETECTION_MINOR_TYPES);
}

export function hasFileDetectionSignal(data: AttackGraphDetailData) {
  return (
    readDetectionNumber(data.detection_major_type) > 0 ||
    readDetectionNumber(data.detection_minor_type) > 0 ||
    Boolean(data.detection_content?.trim())
  );
}

export function resolveFileDetectionTone(
  _value: string,
  data: AttackGraphDetailData,
): AttackGraphPresentationTone | undefined {
  return hasFileDetectionSignal(data) ? "red" : undefined;
}

function formatDetectionMask(
  value: string,
  mapping: readonly { bit: number; label: string }[],
) {
  const numericValue = readDetectionNumber(value);
  if (numericValue <= 0) {
    return "-";
  }

  const labels = mapping
    .filter((item) => (numericValue & item.bit) === item.bit)
    .map((item) => item.label);
  const knownMask = mapping.reduce((mask, item) => mask | item.bit, 0);
  const unknownMask = numericValue & ~knownMask;

  if (unknownMask > 0) {
    labels.push(`unknown ${unknownMask}`);
  }

  return labels.length > 0 ? labels.join(", ") : String(numericValue);
}

function readDetectionNumber(value: unknown) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return 0;
  }

  const numericValue = Number.parseInt(normalized, 10);
  return Number.isFinite(numericValue) ? numericValue : 0;
}
