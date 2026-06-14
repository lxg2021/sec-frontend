export function formatServiceType(value: string) {
  const normalized = toRuleValue(value);
  if (!normalized) return "";

  const numericValue = parseNumericValue(normalized);
  if (numericValue === null) {
    return normalized.toLowerCase();
  }

  const labels = SERVICE_TYPE_FLAGS.reduce<string[]>((items, flag) => {
    if ((numericValue & flag.value) === flag.value) {
      items.push(flag.label);
    }
    return items;
  }, []);

  return labels.length > 0 ? labels.join(", ") : normalized;
}

export function formatServiceStartType(value: string) {
  const normalized = toRuleValue(value);
  if (!normalized) return "";

  return SERVICE_START_TYPE_LABELS[normalized] ?? normalized.toLowerCase();
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

const SERVICE_TYPE_FLAGS = [
  { value: 0x1, label: "kernel driver" },
  { value: 0x2, label: "file system driver" },
  { value: 0x4, label: "adapter" },
  { value: 0x8, label: "recognizer driver" },
  { value: 0x10, label: "own process" },
  { value: 0x20, label: "shared process" },
  { value: 0x40, label: "user service" },
  { value: 0x80, label: "user service instance" },
  { value: 0x100, label: "interactive" },
  { value: 0x200, label: "package service" },
];

const SERVICE_START_TYPE_LABELS: Record<string, string> = {
  "0": "boot",
  "1": "system",
  "2": "automatic",
  "3": "manual",
  "4": "disabled",
};
