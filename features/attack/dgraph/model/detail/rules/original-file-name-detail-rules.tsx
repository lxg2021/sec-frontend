import { Badge } from "@/shared/ui/badge";

import type { AttackGraphPresentationTone } from "../attack-graph-detail-types";

export function hasOriginalFileNameMismatch(
  currentFileName: unknown,
  originalFileName: unknown,
) {
  const current = normalizeComparableFileName(currentFileName);
  const original = normalizeComparableFileName(originalFileName);
  return current.length > 0 && original.length > 0 && current !== original;
}

export function resolveOriginalFileNameMismatchTone(
  mismatched: boolean,
): AttackGraphPresentationTone | undefined {
  return mismatched ? "orange" : undefined;
}

export function renderOriginalFileNameMismatchBadge(mismatched: boolean) {
  if (!mismatched) {
    return null;
  }

  return (
    <Badge
      variant="default"
      className="min-w-[72px] shrink-0 justify-center border-transparent bg-orange-100 text-orange-700 hover:bg-orange-100"
    >
      mismatch
    </Badge>
  );
}

function normalizeComparableFileName(value: unknown) {
  return basename(String(value ?? "")).trim().toLowerCase();
}

function basename(value: string) {
  const normalized = value.trim().replace(/[\\/]+$/g, "");
  if (!normalized) return "";

  const parts = normalized.split(/[\\/]+/).filter(Boolean);
  return parts[parts.length - 1] ?? normalized;
}
