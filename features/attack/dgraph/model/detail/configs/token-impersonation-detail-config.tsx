import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";

import type {
  AttackGraphDetailData,
  AttackGraphDetailCardConfig,
} from "../attack-graph-detail-config-types";

interface TokenContext {
  accountName: string;
  impersonationLevel: string;
  integrityLevel: string;
  privilege: string;
  sessionId: string;
  sid: string;
  tokenType: string;
}

const SENSITIVE_PRIVILEGE_TONES: Record<string, "orange" | "red"> = {
  seassignprimarytokenprivilege: "orange",
  sebackupprivilege: "orange",
  sedebugprivilege: "red",
  sedelegatesessionuserimpersonateprivilege: "red",
  seimpersonateprivilege: "red",
  seloaddriverprivilege: "orange",
  serestoreprivilege: "orange",
  setcbprivilege: "red",
};

const TOKEN_OPERATION_LABELS: Record<string, string> = {
  "3": "thread impersonate token",
  "5": "impersonate token pipe client",
  thread_impersonate_token: "thread impersonate token",
  thread_impersonate_token_pipe_client: "impersonate token pipe client",
};

export const TOKEN_IMPERSONATION_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    icon: "Shield",
    iconTone: "orange",
    title: {
      key: "token_flag_description",
      fallback: "Token Impersonation",
      formatValue: formatTokenOperationTitle,
    },
    fields: [
      { key: "agent_id", label: "Agent ID", icon: "Monitor", iconTone: "blue", mono: true },
      { key: "occurred_at", label: "Occurred", icon: "Clock", iconTone: "green", mono: true },
    ],
  },
  sections: [
    {
      title: "Token Operation",
      icon: "Activity",
      tone: "orange",
      columns: 2,
      fields: [
        {
          key: "token_flag_description",
          label: "Operation",
          icon: "Activity",
          iconTone: "orange",
          valueTone: "orange",
          bold: true,
          formatValue: formatTokenOperationTitle,
        },
        {
          key: "token_flag",
          label: "Token Flag",
          icon: "Hash",
          iconTone: "slate",
          mono: true,
        },
        {
          key: "process_guid",
          label: "Process GUID",
          icon: "Fingerprint",
          iconTone: "slate",
          valueTone: "slate",
          mono: true,
        },
        {
          key: "unique_id",
          label: "ID",
          icon: "Fingerprint",
          iconTone: "slate",
          valueTone: "slate",
          mono: true,
        },
      ],
    },
    {
      title: "Operator Token",
      icon: "User",
      tone: "blue",
      columns: 2,
      fields: [
        tokenField("operator_token_context", "Account", "accountName", "User", "purple"),
        tokenField("operator_token_context", "Session", "sessionId", "Hash", "blue"),
        tokenField("operator_token_context", "SID", "sid", "Fingerprint", "slate", true),
        tokenField("operator_token_context", "Token Type", "tokenType", "Key", "slate"),
        tokenField("operator_token_context", "Integrity", "integrityLevel", "Shield", "orange"),
        tokenField(
          "operator_token_context",
          "Impersonation",
          "impersonationLevel",
          "User",
          "orange",
        ),
        tokenPrivilegesField("operator_token_context"),
      ],
    },
    {
      title: "Target Token",
      icon: "User",
      tone: "purple",
      columns: 2,
      fields: [
        tokenField("target_token_context", "Account", "accountName", "User", "purple"),
        tokenField("target_token_context", "Session", "sessionId", "Hash", "blue"),
        tokenField("target_token_context", "SID", "sid", "Fingerprint", "slate", true),
        tokenField("target_token_context", "Token Type", "tokenType", "Key", "slate"),
        tokenField("target_token_context", "Integrity", "integrityLevel", "Shield", "orange"),
        tokenField(
          "target_token_context",
          "Impersonation",
          "impersonationLevel",
          "User",
          "orange",
        ),
        tokenPrivilegesField("target_token_context"),
      ],
    },
  ],
};

function tokenField(
  key: string,
  label: string,
  tokenKey: keyof TokenContext,
  icon: "Fingerprint" | "Hash" | "Key" | "Shield" | "User",
  iconTone: "blue" | "orange" | "purple" | "slate",
  mono = false,
) {
  return {
    key,
    label,
    icon,
    iconTone,
    valueTone: iconTone,
    mono,
    formatValue: (value: string) => parseTokenContext(value)[tokenKey] || "-",
    customRender: (value: string) => {
      const displayValue = parseTokenContext(value)[tokenKey] || "-";
      return (
        <span
          className={cn(
            "min-w-0 truncate",
            mono ? "font-mono text-xs" : "",
          )}
          title={displayValue}
        >
          {displayValue}
        </span>
      );
    },
  };
}

function tokenPrivilegesField(key: string) {
  return {
    key,
    label: "Privileges",
    icon: "Shield" as const,
    iconTone: "orange" as const,
    display: "block" as const,
    customRender: (value: string) => {
      const privileges = parsePrivileges(parseTokenContext(value).privilege);
      if (privileges.length === 0) {
        return <span className="text-gray-500">-</span>;
      }

      return (
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {privileges.map((privilege) => {
            const tone = SENSITIVE_PRIVILEGE_TONES[privilege];
            return (
              <Badge
                key={privilege}
                className={cn(
                  "max-w-full rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium",
                  tone === "red"
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : tone === "orange"
                      ? "border-orange-200 bg-orange-50 text-orange-700"
                      : "border-slate-200 bg-slate-50 text-slate-600",
                )}
                title={privilege}
                variant="outline"
              >
                <span className="max-w-[260px] truncate">{privilege}</span>
              </Badge>
            );
          })}
        </div>
      );
    },
  };
}

function formatTokenOperationTitle(value: string, data?: AttackGraphDetailData) {
  const normalized = value.trim().toLowerCase();
  const tokenFlag = data?.token_flag?.trim();

  if (normalized && TOKEN_OPERATION_LABELS[normalized]) {
    return TOKEN_OPERATION_LABELS[normalized];
  }

  if (tokenFlag && TOKEN_OPERATION_LABELS[tokenFlag]) {
    return TOKEN_OPERATION_LABELS[tokenFlag];
  }

  if (!normalized) {
    return "";
  }

  return normalized
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function parseTokenContext(value: string): TokenContext {
  const parsed = parseJsonObject(value);

  return {
    accountName: readTokenValue(parsed, "accountname", "AccountName"),
    impersonationLevel: readTokenValue(parsed, "impersonationlevel", "ImpersonationLevel"),
    integrityLevel: readTokenValue(parsed, "integritylevel", "IntegrityLevel"),
    privilege: readTokenValue(parsed, "privilege", "Privilege"),
    sessionId: readTokenValue(parsed, "sessionid", "SessionID"),
    sid: readTokenValue(parsed, "sid", "SID"),
    tokenType: readTokenValue(parsed, "tokentype", "TokenType"),
  };
}

function parseJsonObject(value: string): Record<string, unknown> {
  const normalized = value.trim();
  if (!normalized) {
    return {};
  }

  try {
    const parsed = JSON.parse(normalized);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return {};
  }

  return {};
}

function readTokenValue(
  parsed: Record<string, unknown>,
  lowerKey: string,
  upperKey: string,
) {
  return stringifyTokenValue(parsed[lowerKey] ?? parsed[upperKey]);
}

function stringifyTokenValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

function parsePrivileges(value: string) {
  return value
    .split(";")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}
