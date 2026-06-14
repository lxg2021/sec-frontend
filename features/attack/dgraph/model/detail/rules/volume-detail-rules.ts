import type { AttackGraphPresentationTone } from "../attack-graph-detail-types";

export function formatVolumeAccessType(value: string) {
  const accessType = Number.parseInt(String(value ?? "").trim(), 10);
  if (!Number.isFinite(accessType)) {
    return String(value ?? "").trim().toLowerCase();
  }

  if (accessType === 0) {
    return "none";
  }

  const operations: string[] = [];
  if ((accessType & VOLUME_ACCESS_READ) !== 0) {
    operations.push("read");
  }
  if ((accessType & VOLUME_ACCESS_WRITE) !== 0) {
    operations.push("write");
  }

  if (operations.length > 0) {
    return operations.join(" / ");
  }

  if ((accessType & VOLUME_ACCESS_OPEN) !== 0) {
    return "open";
  }

  return String(accessType);
}

export function resolveVolumeAccessTypeTone(
  value: string,
): AttackGraphPresentationTone | undefined {
  const accessType = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(accessType) && accessType > 0 ? "red" : undefined;
}

const VOLUME_ACCESS_OPEN = 1;
const VOLUME_ACCESS_READ = 2;
const VOLUME_ACCESS_WRITE = 4;
