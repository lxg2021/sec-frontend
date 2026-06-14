import { Badge } from "@/shared/ui/badge";

import type { AttackGraphDetailData } from "../attack-graph-detail-config-types";

export function formatCryptoOperation(value: string, data?: AttackGraphDetailData) {
  const normalized =
    toRuleValue(value) ||
    toRuleValue(data?.operation_kind) ||
    formatCryptoFlagDescription(data?.crypt_flag);

  if (!normalized) {
    return "";
  }

  return CRYPTO_OPERATION_LABELS[normalized.toLowerCase()] ?? formatToken(normalized);
}

export function formatCryptoFlag(value: string, data?: AttackGraphDetailData) {
  const normalized = toRuleValue(value);
  if (!normalized) {
    return "";
  }

  const operation = formatCryptoFlagDescription(normalized) || formatCryptoOperation("", data);
  return operation ? `${normalized} (${operation})` : normalized;
}

export function renderCryptoTypeBadge() {
  return (
    <Badge
      variant="secondary"
      className="border-transparent bg-slate-100 text-slate-600 hover:bg-slate-100"
    >
      crypto
    </Badge>
  );
}

function formatCryptoFlagDescription(value: unknown) {
  const normalized = toRuleValue(value);
  if (!normalized) {
    return "";
  }

  return CRYPTO_FLAG_LABELS[normalized] ?? "";
}

function formatToken(value: string) {
  return value
    .trim()
    .replace(/^crypt_/, "")
    .replace(/_flag$/, "")
    .replace(/_/g, " ");
}

function toRuleValue(value: unknown) {
  return String(value ?? "").trim();
}

const CRYPTO_FLAG_LABELS: Record<string, string> = {
  "1": "protect data",
  "2": "unprotect data",
  "3": "protect memory",
  "4": "unprotect memory",
  "5": "protect",
  "6": "unprotect",
};

const CRYPTO_OPERATION_LABELS: Record<string, string> = {
  crypt_protect_data_flag: "protect data",
  crypt_unprotect_data_flag: "unprotect data",
  crypt_protect_memory_flag: "protect memory",
  crypt_unprotect_memory_flag: "unprotect memory",
  crypt_protect_flag: "protect",
  crypt_unprotect_flag: "unprotect",
};
