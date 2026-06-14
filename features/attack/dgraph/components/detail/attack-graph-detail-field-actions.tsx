import { ChevronDown, ChevronUp, Copy } from "lucide-react";

import { Button } from "@/shared/ui/button";

import type { AttackGraphDetailFieldConfig } from "../../model/detail/attack-graph-detail-config-types";

export function AttackGraphDetailFieldActions({
  canExpand,
  expanded,
  field,
  fieldId,
  onToggleExpanded,
  showCopy,
  stringValue,
}: {
  canExpand: boolean | undefined;
  expanded: boolean;
  field: AttackGraphDetailFieldConfig;
  fieldId: string;
  onToggleExpanded: (fieldId: string) => void;
  showCopy: boolean;
  stringValue: string;
}) {
  return (
    <>
      {canExpand ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleExpanded(fieldId)}
          className="h-6 px-2 text-xs"
        >
          {expanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
          {expanded ? "收起" : "展开"}
        </Button>
      ) : null}

      {showCopy ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => {
            void navigator.clipboard?.writeText(stringValue);
          }}
          className="h-6 w-6 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label={`Copy ${field.label}`}
        >
          <Copy className="h-3 w-3" />
        </Button>
      ) : null}
    </>
  );
}
