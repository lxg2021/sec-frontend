import { Badge } from "@/shared/ui/badge";

import type { AttackGraphDetailData } from "../attack-graph-detail-config-types";
import type { AttackGraphPresentationTone } from "../attack-graph-detail-types";

export function formatCredentialTheftTitle(
  value: string,
  data?: AttackGraphDetailData,
) {
  return (
    formatCredentialDescription(value) ||
    formatCredentialType(data?.cred_type ?? "") ||
    ""
  );
}

export function formatCredentialDescription(value: string) {
  const normalized = toRuleValue(value);
  if (!normalized) {
    return "";
  }

  return normalized
    .replace(/^\[lsass\]:/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatCredentialType(value: string) {
  const normalized = toRuleValue(value);
  if (!normalized) {
    return "";
  }

  const numericValue = parseNumericValue(normalized);
  if (numericValue === null) {
    return normalized;
  }

  const label = CREDENTIAL_TYPE_LABELS[numericValue];
  return label ? `${label} (${numericValue})` : String(numericValue);
}

export function resolveCredentialTheftTone(): AttackGraphPresentationTone {
  return "red";
}

export function renderCredentialTheftBadge() {
  return (
    <Badge
      variant="destructive"
      className="min-w-[72px] justify-center rounded-md border-transparent px-2 py-0.5 text-xs font-medium"
    >
      theft
    </Badge>
  );
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

const CREDENTIAL_TYPE_LABELS: Record<number, string> = {
  1: "aes/des crypto key",
  2: "local logon session",
  3: "wdigest plaintext password",
  4: "tspkg rdp credential table",
  5: "livessp logon session",
  6: "security support provider",
  7: "cloudap logon",
  8: "credential manager",
  9: "dpapi system master key",
  10: "domain controller forest trust key",
  11: "dpapi cache master key",
  12: "read lsass security dll memory",
  13: "open lsass process",
  16: "domain controller backup master key",
};
