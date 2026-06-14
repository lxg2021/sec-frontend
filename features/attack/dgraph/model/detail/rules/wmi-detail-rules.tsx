import { Badge } from "@/shared/ui/badge";

import type { AttackGraphDetailData } from "../attack-graph-detail-config-types";
import type { AttackGraphPresentationTone } from "../attack-graph-detail-types";

interface WmiClassAttributeItem {
  AttrName?: unknown;
  AttrValue?: unknown;
  IsBase64?: unknown;
  attrname?: unknown;
  attrvalue?: unknown;
  isbase64?: unknown;
  attr_name?: unknown;
  attr_value?: unknown;
  is_base64?: unknown;
}

interface NormalizedWmiClassAttributeItem {
  name: string;
  value: string;
  isBase64: boolean;
}

export function hasBase64WmiClassAttribute(value: string | undefined) {
  return parseWmiClassAttributes(value ?? "").some((item) => item.isBase64);
}

export function resolveWmiClassAttributesTone(
  data: AttackGraphDetailData,
): AttackGraphPresentationTone | undefined {
  return hasBase64WmiClassAttribute(data.class_attributes) ? "red" : undefined;
}

export function formatWmiScopeKind(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "host_ref") return "remote";
  if (normalized === "host") return "host";
  return normalized;
}

export function renderWmiScopeBadge(value: string) {
  const label = formatWmiScopeKind(value);
  if (!label || label === "host") {
    return null;
  }

  return (
    <Badge
      variant="secondary"
      className="border-transparent bg-orange-50 text-orange-700 hover:bg-orange-50"
    >
      {label}
    </Badge>
  );
}

export function renderWmiBase64AttributesBadge(
  _value: string,
  data: AttackGraphDetailData,
) {
  if (!hasBase64WmiClassAttribute(data.class_attributes)) {
    return null;
  }

  return (
    <Badge variant="destructive" className="rounded-md px-2 py-0.5 text-xs font-medium">
      base64
    </Badge>
  );
}

export function formatWmiClassAttributes(value: string) {
  const items = parseWmiClassAttributes(value);
  if (items.length === 0) {
    return formatRawWmiClassAttributes(value);
  }

  return items
    .map((item) => {
      const suffix = item.isBase64 ? " [base64]" : "";
      return `${item.name}: ${item.value}${suffix}`;
    })
    .join("\n");
}

export function renderWmiClassAttributes(value: string) {
  const items = parseWmiClassAttributes(value);
  if (items.length === 0) {
    const rawValue = formatRawWmiClassAttributes(value);
    return <pre className="m-0 whitespace-pre-wrap break-all font-mono">{rawValue}</pre>;
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={`${item.name}-${index}`}
          className={
            item.isBase64
              ? "rounded-md border border-rose-200 bg-rose-50 px-3 py-2"
              : "rounded-md border border-slate-200 bg-white px-3 py-2"
          }
        >
          <div className="flex min-w-0 items-start gap-2">
            <span
              className={
                item.isBase64
                  ? "shrink-0 font-semibold text-rose-700"
                  : "shrink-0 font-semibold text-slate-700"
              }
              title={item.name}
            >
              {item.name}:
            </span>
            <span
              className={
                item.isBase64
                  ? "min-w-0 flex-1 whitespace-pre-wrap break-all text-rose-700"
                  : "min-w-0 flex-1 whitespace-pre-wrap break-all text-slate-600"
              }
            >
              {item.value || "-"}
            </span>
            {item.isBase64 ? (
              <Badge variant="destructive" className="mt-0.5 shrink-0 px-1.5 py-0 text-[10px]">
                base64
              </Badge>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function parseWmiClassAttributes(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return [];
  }

  try {
    const parsed = JSON.parse(normalized);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(normalizeWmiClassAttributeItem)
      .filter((item): item is NormalizedWmiClassAttributeItem => Boolean(item));
  } catch {
    return [];
  }
}

function normalizeWmiClassAttributeItem(item: unknown) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const rawItem = item as WmiClassAttributeItem;
  const name = String(
    rawItem.AttrName ?? rawItem.attr_name ?? rawItem.attrname ?? "",
  ).trim();
  const attrValue = String(
    rawItem.AttrValue ?? rawItem.attr_value ?? rawItem.attrvalue ?? "",
  ).trim();
  const isBase64 = parseWmiBoolean(
    rawItem.IsBase64 ?? rawItem.is_base64 ?? rawItem.isbase64,
  );

  if (!name && !attrValue) {
    return null;
  }

  return {
    name,
    value: attrValue,
    isBase64,
  };
}

function parseWmiBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }

  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function formatRawWmiClassAttributes(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return "";
  }

  try {
    return JSON.stringify(JSON.parse(normalized), null, 2);
  } catch {
    return normalized;
  }
}
