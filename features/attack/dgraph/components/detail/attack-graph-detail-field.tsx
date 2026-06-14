import { cn } from "@/shared/lib/utils";

import type {
  AttackGraphDetailData,
  AttackGraphDetailFieldConfig,
} from "../../model/detail/attack-graph-detail-config-types";
import { AttackGraphDetailFieldActions } from "./attack-graph-detail-field-actions";
import {
  ATTACK_GRAPH_DETAIL_FIELD_TONE_CLASS_NAMES,
  formatAttackGraphDetailValue,
  getAttackGraphDetailIcon,
  readAttackGraphDetailValue,
} from "./attack-graph-detail-presentation";
import { AttackGraphDetailTruncatedText } from "./attack-graph-detail-text";

export function AttackGraphDetailField({
  className,
  data,
  expanded,
  field,
  fieldId,
  onToggleExpanded,
}: {
  className?: string;
  data: AttackGraphDetailData;
  expanded: boolean;
  field: AttackGraphDetailFieldConfig;
  fieldId: string;
  onToggleExpanded: (fieldId: string) => void;
}) {
  const stringValue = readAttackGraphDetailValue(data, field.key);
  const formattedValue = field.formatValue
    ? field.formatValue(stringValue, data)
    : formatAttackGraphDetailValue(stringValue);
  const hasValue = stringValue.length > 0;
  const renderedValue = field.customRender
    ? field.customRender(stringValue, data)
    : null;
  const canExpand = false;
  const canPopover =
    hasValue &&
    field.showInPopover &&
    field.maxLength !== undefined &&
    stringValue.length > field.maxLength;
  const displayValue = formattedValue;
  const resolvedIcon = field.resolveIcon?.(stringValue, data);
  const resolvedTone = field.resolveTone?.(stringValue, data);
  const Icon = getAttackGraphDetailIcon(resolvedIcon ?? field.icon);
  const tone = resolvedTone ?? field.tone ?? "slate";
  const iconTone = field.iconTone ?? tone;
  const valueTone = field.valueTone ?? tone;
  const display = field.display ?? "inline";
  const valueClassName = cn(
    ATTACK_GRAPH_DETAIL_FIELD_TONE_CLASS_NAMES[valueTone],
    field.bold ? "font-semibold" : "",
    field.mono ? "font-mono text-xs" : "",
  );
  const fieldActions = (
    <AttackGraphDetailFieldActions
      canExpand={canExpand}
      canPopover={canPopover}
      expanded={expanded}
      field={field}
      fieldId={fieldId}
      onToggleExpanded={onToggleExpanded}
      showCopy={hasValue && Boolean(field.copyable)}
      stringValue={stringValue}
    />
  );

  if ((display === "block" || display === "code") && hasValue) {
    return (
      <div className={cn("min-w-0 text-sm", className)}>
        <div className="mb-1.5 flex min-w-0 items-center gap-2">
          <Icon
            className={cn(
              "h-4 w-4 shrink-0",
              ATTACK_GRAPH_DETAIL_FIELD_TONE_CLASS_NAMES[iconTone],
            )}
          />
          <span className="min-w-0 font-medium text-gray-700">
            {field.label}
          </span>
          <div className="ml-auto flex w-16 shrink-0 items-center justify-end gap-1">
            {fieldActions}
          </div>
        </div>
        {renderedValue ? (
          <div
            className={cn(
              "min-w-0 overflow-hidden",
              display === "code"
                ? cn(
                    valueClassName,
                    "rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs leading-5",
                  )
                : cn(valueClassName, "pl-6 leading-5"),
            )}
            title={stringValue}
          >
            {renderedValue}
          </div>
        ) : (
          <AttackGraphDetailTruncatedText
            value={displayValue}
            tooltipValue={
              field.formatValue
                ? `${displayValue}\nRaw: ${stringValue}`
                : stringValue
            }
            className={cn(
              valueClassName,
              display === "code"
                ? "rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs leading-5"
                : "pl-6 leading-5",
            )}
          />
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-[24px] items-start gap-2 text-sm", className)}>
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          ATTACK_GRAPH_DETAIL_FIELD_TONE_CLASS_NAMES[iconTone],
        )}
      />
      <span className="shrink-0 font-medium text-gray-700">{field.label}:</span>
      <div className="flex min-w-0 flex-1 items-start gap-2">
        {renderedValue ? (
          <span
            className={cn(valueClassName, "min-w-0 truncate")}
            title={stringValue}
          >
            {renderedValue}
          </span>
        ) : (
          <AttackGraphDetailTruncatedText
            value={displayValue}
            tooltipValue={
              field.formatValue
                ? `${displayValue}\nRaw: ${stringValue}`
                : stringValue
            }
            className={valueClassName}
          />
        )}
      </div>
      <div className="ml-auto flex w-16 shrink-0 items-center justify-end gap-1">
        {fieldActions}
      </div>
    </div>
  );
}
