import { Badge } from "@/shared/ui/badge";

import type { AttackGraphDetailData } from "../attack-graph-detail-config-types";

export function formatAccountTitle(value: string, data: AttackGraphDetailData) {
  const user = value.trim();
  const domain = data.domain?.trim();

  if (domain && user && !user.includes("\\")) {
    return `${domain}\\${user}`;
  }

  return user || data.sid?.trim() || data.graph_display_name?.trim() || "Account";
}

export function formatAccountScope(value: string) {
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

export function renderAccountBadge() {
  return (
    <Badge
      variant="secondary"
      className="min-w-[72px] justify-center rounded-md border-transparent bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
    >
      account
    </Badge>
  );
}
