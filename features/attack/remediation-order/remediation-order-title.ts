import type { RemediationTargetDraft } from "./use-remediation-order-workspace";

// The service validates the title using Go's byte length and stores it in a
// varchar(255) column. Keeping the same limit in the UI prevents a successful
//-looking submit from being rejected by the API for non-ASCII titles.
export const MAX_REMEDIATION_ORDER_TITLE_BYTES = 255;

export type RemediationOrderTitleLocale = "zh" | "en";

function utf8Length(value: string) {
  return new TextEncoder().encode(value).length;
}

function truncateUtf8(value: string, maxBytes: number) {
  let result = "";
  let length = 0;
  for (const character of value) {
    const characterLength = utf8Length(character);
    if (length + characterLength > maxBytes) break;
    result += character;
    length += characterLength;
  }
  return result;
}

function basename(value: string) {
  const normalized = value.trim().replace(/[\\/]+$/u, "");
  if (!normalized) return "";
  return normalized.split(/[\\/]/u).filter(Boolean).pop() || normalized;
}

function conciseTitlePart(value: string) {
  const normalized = value.trim();
  if (!normalized) return "";
  return truncateUtf8(normalized, 96);
}

function selectedActionName(target: RemediationTargetDraft) {
  const action = target.actions.find(
    (candidate) => candidate.action_code === target.selectedActionCode,
  );
  return action?.display_name.trim() || action?.action_code.trim() || "";
}

export function remediationOrderTitleLocale(locale: string): RemediationOrderTitleLocale {
  return locale.toLowerCase().startsWith("zh") ? "zh" : "en";
}

export function normalizeRemediationOrderTitle(value: string) {
  return value.trim();
}

export function remediationOrderTitleError(
  value: string,
  locale: RemediationOrderTitleLocale,
) {
  const title = normalizeRemediationOrderTitle(value);
  if (!title) {
    return locale === "zh" ? "请输入处置单名称。" : "Enter a response order name.";
  }
  if (utf8Length(title) > MAX_REMEDIATION_ORDER_TITLE_BYTES) {
    return locale === "zh"
      ? `处置单名称不能超过 ${MAX_REMEDIATION_ORDER_TITLE_BYTES} 个字节。`
      : `The response order name must be at most ${MAX_REMEDIATION_ORDER_TITLE_BYTES} bytes.`;
  }
  return "";
}

export function suggestRemediationOrderTitle(
  targets: readonly RemediationTargetDraft[],
  locale: RemediationOrderTitleLocale,
) {
  const firstTarget = targets[0];
  if (!firstTarget) {
    return locale === "zh" ? "处置编排" : "Response orchestration";
  }

  const actionName = conciseTitlePart(selectedActionName(firstTarget));
  const targetName = conciseTitlePart(
    basename(firstTarget.node.displayName || firstTarget.key),
  );

  if (targets.length === 1) {
    if (targetName && actionName) {
      return truncateUtf8(
        `${targetName} · ${actionName}`,
        MAX_REMEDIATION_ORDER_TITLE_BYTES,
      );
    }
    if (actionName) {
      return truncateUtf8(actionName, MAX_REMEDIATION_ORDER_TITLE_BYTES);
    }
    if (targetName) {
      return truncateUtf8(
        locale === "zh" ? `${targetName} 处置` : `${targetName} response`,
        MAX_REMEDIATION_ORDER_TITLE_BYTES,
      );
    }
  }

  if (actionName) {
    return truncateUtf8(
      locale === "zh"
        ? `${actionName}等 ${targets.length} 项处置`
        : `${actionName} and ${targets.length - 1} more response actions`,
      MAX_REMEDIATION_ORDER_TITLE_BYTES,
    );
  }
  return truncateUtf8(
    locale === "zh"
      ? `${targets.length} 项处置目标`
      : `${targets.length} response targets`,
    MAX_REMEDIATION_ORDER_TITLE_BYTES,
  );
}

export function isLegacyCaseRemediationTitle(title: string, caseId: string) {
  const normalizedTitle = normalizeRemediationOrderTitle(title).toLowerCase();
  const normalizedCaseId = caseId.trim().toLowerCase();
  return Boolean(normalizedCaseId) &&
    normalizedTitle === `case ${normalizedCaseId} remediation`;
}
