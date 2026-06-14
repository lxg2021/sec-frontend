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

export function renderWmiScopeKindValue(value: string) {
  const label = formatWmiScopeKind(value);
  if (!label) {
    return null;
  }

  return (
    <span
      className={
        label === "remote"
          ? "font-medium text-rose-600"
          : "font-medium text-slate-600"
      }
    >
      {label}
    </span>
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

export function renderWmiExplicitCredentialBadge(value: string) {
  if (!isTruthyWmiValue(value)) {
    return null;
  }

  return (
    <Badge
      variant="secondary"
      className="border-transparent bg-orange-50 text-orange-700 hover:bg-orange-50"
    >
      credential
    </Badge>
  );
}

export function renderWmiClassTypeBadge() {
  return renderWmiTypeBadge("wmi class");
}

export function renderWmiConsumerTypeBadge() {
  return renderWmiTypeBadge("wmi consumer");
}

export function renderWmiExecuteTypeBadge() {
  return renderWmiTypeBadge("wmi execute");
}

export function renderWmiFilterTypeBadge() {
  return renderWmiTypeBadge("wmi filter");
}

export function renderWmiQueryTypeBadge() {
  return renderWmiTypeBadge("wmi query");
}

function renderWmiTypeBadge(label: string) {
  return (
    <Badge
      variant="secondary"
      className="border-transparent bg-slate-100 text-slate-600 hover:bg-slate-100"
    >
      {label}
    </Badge>
  );
}

export function formatWmiExecuteTitle(
  _value: string,
  data: AttackGraphDetailData,
) {
  const className = data.class_name?.trim();
  const methodName = data.method_name?.trim();
  const executeName = [className, methodName].filter(Boolean).join(".");

  return executeName || "WmiExecute";
}

export function formatWmiMethodParameters(value: string) {
  const entries = parseWmiMethodParameters(value);
  if (entries.length === 0) {
    return formatRawWmiClassAttributes(value);
  }

  return entries.map((entry) => `${entry.name}: ${entry.value || "-"}`).join("\n");
}

export function renderWmiMethodParameters(value: string) {
  return (
    <pre className="m-0 whitespace-pre-wrap break-all font-mono">
      {formatWmiMethodParameters(value)}
    </pre>
  );
}

export function formatWmiConsumerContext(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return "";
  }

  try {
    const parsed = JSON.parse(normalized);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.entries(parsed as Record<string, unknown>)
        .map(([key, item]) => `${key}: ${stringifyWmiParameterValue(item) || "-"}`)
        .join("\n");
    }
    return JSON.stringify(parsed, null, 2);
  } catch {
    return normalized;
  }
}

export function renderWmiConsumerContext(value: string) {
  return (
    <pre className="m-0 whitespace-pre-wrap break-all font-mono">
      {formatWmiConsumerContext(value)}
    </pre>
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

function isTruthyWmiValue(value: string) {
  return parseWmiBoolean(value);
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

function parseWmiMethodParameters(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return [];
  }

  try {
    const parsed = JSON.parse(normalized);
    return normalizeWmiMethodParameterEntries(parsed);
  } catch {
    return [{ name: "Parameters", value: normalized }];
  }
}

function normalizeWmiMethodParameterEntries(parsed: unknown) {
  if (Array.isArray(parsed)) {
    return parsed.flatMap((item, index) => {
      if (!item || typeof item !== "object") {
        return [{ name: `Parameter ${index + 1}`, value: stringifyWmiParameterValue(item) }];
      }

      const raw = item as Record<string, unknown>;
      const parameterName = stringifyWmiParameterValue(
        raw.ParameterName ?? raw.parameter_name ?? raw.name,
      );
      const parameterValue = stringifyWmiParameterValue(
        raw.ParameterValue ?? raw.parameter_value ?? raw.value,
      );

      if (parameterName || parameterValue) {
        return [
          {
            name: parameterName || `Parameter ${index + 1}`,
            value: parameterValue,
          },
        ];
      }

      return Object.entries(raw).map(([key, value]) => ({
        name: key,
        value: stringifyWmiParameterValue(value),
      }));
    });
  }

  if (parsed && typeof parsed === "object") {
    return Object.entries(parsed as Record<string, unknown>).map(([key, value]) => ({
      name: key,
      value: stringifyWmiParameterValue(value),
    }));
  }

  return [{ name: "Parameters", value: stringifyWmiParameterValue(parsed) }];
}

function stringifyWmiParameterValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
