import { X } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { CardHeader, CardTitle } from "@/shared/ui/card";

import type {
  AttackGraphPresentationTone,
} from "../../model/detail/attack-graph-detail-types";
import type {
  AttackGraphDetailBadgeConfig,
  AttackGraphDetailData,
  AttackGraphDetailHeaderConfig,
  AttackGraphDetailHeaderFieldConfig,
} from "../../model/detail/attack-graph-detail-config-types";
import {
  ATTACK_GRAPH_DETAIL_BADGE_TONE_CLASS_NAMES,
  ATTACK_GRAPH_DETAIL_FIELD_TONE_CLASS_NAMES,
  formatAttackGraphDetailValue,
  getAttackGraphDetailIcon,
  readAttackGraphDetailValue,
} from "./attack-graph-detail-presentation";
import { AttackGraphDetailTruncatedText } from "./attack-graph-detail-text";

export function AttackGraphDetailHeader({
  data,
  header,
  headerIconTone,
  onClose,
  title,
}: {
  data: AttackGraphDetailData;
  header: AttackGraphDetailHeaderConfig;
  headerIconTone: AttackGraphPresentationTone;
  onClose?: () => void;
  title: string;
}) {
  const HeaderIcon = getAttackGraphDetailIcon(header.icon);

  return (
    <CardHeader className="shrink-0 border-b border-slate-100 p-4 pb-4">
      <div className="flex items-center justify-between gap-3">
        <CardTitle className="flex min-w-0 items-center gap-2 text-xl font-semibold leading-6 text-slate-950">
          <HeaderIcon
            className={cn(
              "h-5 w-5 shrink-0",
              ATTACK_GRAPH_DETAIL_FIELD_TONE_CLASS_NAMES[headerIconTone],
            )}
          />
          <AttackGraphDetailTruncatedText
            value={title}
            className="text-slate-950"
          />
        </CardTitle>

        <div className="flex shrink-0 items-center gap-2">
          <AttackGraphDetailHeaderBadges
            badges={header.badges ?? []}
            data={data}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
            aria-label="Close detail"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <AttackGraphDetailHeaderFields
          data={data}
          fields={header.fields ?? []}
        />
      </div>
    </CardHeader>
  );
}

function AttackGraphDetailHeaderBadges({
  badges,
  data,
}: {
  badges: AttackGraphDetailBadgeConfig[];
  data: AttackGraphDetailData;
}) {
  if (badges.length === 0) {
    return null;
  }

  return (
    <>
      {badges.map((badge) => {
        const value = readAttackGraphDetailValue(data, badge.key);
        if (badge.customRender) {
          return <div key={badge.key}>{badge.customRender(value, data)}</div>;
        }

        const tone = badge.tone ?? "slate";
        return (
          <Badge
            key={badge.key}
            variant="outline"
            className={cn(
              "max-w-[120px] rounded-md px-2 py-0.5 text-xs font-medium",
              ATTACK_GRAPH_DETAIL_BADGE_TONE_CLASS_NAMES[tone],
            )}
            title={formatAttackGraphDetailValue(value)}
          >
            <span className="truncate">
              {badge.label ? `${badge.label}: ` : ""}
              {formatAttackGraphDetailValue(value)}
            </span>
          </Badge>
        );
      })}
    </>
  );
}

function AttackGraphDetailHeaderFields({
  data,
  fields,
}: {
  data: AttackGraphDetailData;
  fields: AttackGraphDetailHeaderFieldConfig[];
}) {
  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-3 text-sm text-gray-600 sm:grid-cols-[minmax(0,1fr)_max-content]">
      {fields.map((field) => {
        const rawValue = readAttackGraphDetailValue(data, field.key);
        const formattedValue = field.formatValue
          ? field.formatValue(rawValue, data)
          : formatAttackGraphDetailValue(rawValue);
        const resolvedIcon = field.resolveIcon?.(rawValue, data);
        const resolvedTone = field.resolveTone?.(rawValue, data);
        const Icon = getAttackGraphDetailIcon(resolvedIcon ?? field.icon);
        const iconTone =
          field.iconTone ?? resolvedTone ?? field.tone ?? "slate";
        const valueTone =
          field.valueTone ?? resolvedTone ?? field.tone ?? "slate";
        return (
          <div key={field.key} className="flex min-w-0 items-center gap-2">
            <Icon
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                ATTACK_GRAPH_DETAIL_FIELD_TONE_CLASS_NAMES[iconTone],
              )}
            />
            <span className="shrink-0 font-medium text-gray-700">
              {field.label}:
            </span>
            <AttackGraphDetailTruncatedText
              value={formattedValue}
              tooltipValue={
                field.formatValue
                  ? `${formattedValue}\nRaw: ${rawValue}`
                  : rawValue
              }
              className={cn(
                ATTACK_GRAPH_DETAIL_FIELD_TONE_CLASS_NAMES[valueTone],
                field.mono ? "font-mono text-xs" : "",
              )}
            />
          </div>
        );
      })}
    </div>
  );
}
