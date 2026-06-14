import { FolderOpen, Network } from "lucide-react";

import { Badge } from "@/shared/ui/badge";

import type { AttackGraphDetailData } from "../attack-graph-detail-config-types";

interface BitsJobFile {
  localName: string;
  remoteName: string;
}

export function formatBitsTitle(value: string, data: AttackGraphDetailData) {
  return value.trim() || data.job_id?.trim() || "BITS Job";
}

export function formatBitsJobType(value: string, data: AttackGraphDetailData) {
  return normalizeBitsEnumLabel(value) || data.job_type?.trim() || "";
}

export function formatBitsJobStatus(
  value: string,
  data: AttackGraphDetailData,
) {
  return normalizeBitsEnumLabel(value) || data.job_status?.trim() || "";
}

export function renderBitsBadge() {
  return (
    <Badge
      variant="secondary"
      className="border-transparent bg-slate-100 text-slate-600 hover:bg-slate-100"
    >
      bits
    </Badge>
  );
}

export function formatBitsJobFiles(value: string) {
  return parseBitsJobFiles(value)
    .map((file) =>
      [
        file.localName ? `Local: ${file.localName}` : "",
        file.remoteName ? `Remote: ${file.remoteName}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .filter(Boolean)
    .join("\n\n");
}

export function renderBitsJobFiles(value: string) {
  const files = parseBitsJobFiles(value);

  if (files.length === 0) {
    return <span>-</span>;
  }

  return (
    <div className="space-y-3">
      {files.map((file, index) => (
        <div
          key={`${file.localName}-${file.remoteName}-${index}`}
          className="space-y-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5"
        >
          <div className="flex min-w-0 items-start gap-2">
            <FolderOpen className="mt-0.5 h-4 w-4 shrink-0 text-cyan-700" />
            <span className="shrink-0 font-medium text-slate-700">
              Local:
            </span>
            <span
              className="min-w-0 flex-1 truncate font-mono text-xs leading-5 text-cyan-700"
              title={file.localName || "-"}
            >
              {file.localName || "-"}
            </span>
          </div>
          <div className="flex min-w-0 items-start gap-2">
            <Network className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
            <span className="shrink-0 font-medium text-slate-700">
              Remote:
            </span>
            <span
              className="min-w-0 flex-1 truncate font-mono text-xs leading-5 text-blue-700"
              title={file.remoteName || "-"}
            >
              {file.remoteName || "-"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function parseBitsJobFiles(value: string): BitsJobFile[] {
  const normalized = value.trim();
  if (!normalized) {
    return [];
  }

  const parsed = parseBitsJobFilesPayload(normalized);
  if (parsed.length > 0) {
    return parsed;
  }

  if (!normalized.startsWith("[") && !normalized.endsWith("]")) {
    return parseBitsJobFilesPayload(`[${normalized}]`);
  }

  return [];
}

function parseBitsJobFilesPayload(value: string): BitsJobFile[] {
  try {
    return normalizeBitsJobFiles(JSON.parse(value));
  } catch {
    return [];
  }
}

function normalizeBitsJobFiles(value: unknown): BitsJobFile[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => normalizeBitsJobFiles(item))
      .filter(hasBitsJobFileValue);
  }

  if (typeof value === "string") {
    return parseBitsJobFilesPayload(value);
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const item = value as Record<string, unknown>;
  const localName = stringValue(item.local_name ?? item.LocalName);
  const remoteName = stringValue(item.remote_name ?? item.RemoteName);

  return [{ localName, remoteName }].filter(hasBitsJobFileValue);
}

function hasBitsJobFileValue(file: BitsJobFile) {
  return file.localName.length > 0 || file.remoteName.length > 0;
}

function stringValue(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeBitsEnumLabel(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return "";
  }

  return normalized
    .replace(/^BG_JOB_TYPE_/i, "")
    .replace(/^BIT_STATUS_/i, "")
    .replace(/_/g, " ")
    .toLowerCase();
}
