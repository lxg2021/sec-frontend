import type { AttackGraphDetailData } from "../attack-graph-detail-config-types";

export function formatAccountGroupTitle(
  value: string,
  data: AttackGraphDetailData,
) {
  const groupName = value.trim();
  const domain = data.domain?.trim();

  if (domain && groupName && !groupName.includes("\\")) {
    return `${domain}\\${groupName}`;
  }

  return (
    groupName ||
    data.sid?.trim() ||
    data.graph_display_name?.trim() ||
    "Account Group"
  );
}

export function formatAccountGroupScope(value: string) {
  const normalized = value.trim().toLowerCase();

  switch (normalized) {
    case "local":
      return "local";
    case "domain":
      return "domain";
    default:
      return normalized;
  }
}
