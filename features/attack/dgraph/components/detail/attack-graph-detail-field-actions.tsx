import { ChevronDown, ChevronUp, Copy } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

import type { AttackGraphDetailFieldConfig } from "../../model/detail/attack-graph-detail-config-types";

export function AttackGraphDetailFieldActions({
  canExpand,
  canPopover,
  expanded,
  field,
  fieldId,
  onToggleExpanded,
  showCopy,
  stringValue,
}: {
  canExpand: boolean | undefined;
  canPopover: boolean | undefined;
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
          size="sm"
          onClick={() => {
            void navigator.clipboard?.writeText(stringValue);
          }}
          className="h-6 px-2 text-xs"
        >
          <Copy className="h-3 w-3" />
        </Button>
      ) : null}

      {canPopover ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              <ChevronDown className="h-3 w-3" />
              查看
            </Button>
          </PopoverTrigger>
          <PopoverContent className="max-h-80 w-96 overflow-auto">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-medium">{field.label}</h5>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard?.writeText(stringValue);
                  }}
                  className="h-6 px-2 text-xs"
                >
                  <Copy className="h-3 w-3" />
                  复制
                </Button>
              </div>
              <div
                className={cn(
                  "break-all whitespace-pre-wrap text-xs",
                  field.mono ? "font-mono" : "",
                )}
              >
                {stringValue}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      ) : null}
    </>
  );
}
