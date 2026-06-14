import { cn } from "@/shared/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

import { formatAttackGraphDetailValue } from "./attack-graph-detail-presentation";

export function AttackGraphDetailTruncatedText({
  className,
  tooltipValue,
  value,
}: {
  className?: string;
  tooltipValue?: string;
  value: string;
}) {
  const formattedValue = formatAttackGraphDetailValue(value);
  const fullValue = formatAttackGraphDetailValue(tooltipValue ?? value);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn("block min-w-0 max-w-full truncate", className)}
          title={fullValue}
        >
          {formattedValue}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-[520px] whitespace-pre-wrap break-all text-xs leading-5">
        {fullValue}
      </TooltipContent>
    </Tooltip>
  );
}
