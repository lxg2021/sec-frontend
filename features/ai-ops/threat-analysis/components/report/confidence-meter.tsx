import { cn } from "@/shared/lib/utils"
import { confidencePct } from "@/features/ai-ops/threat-analysis/report-utils"

export function ConfidenceMeter({
  value,
  className,
  showLabel = true,
}: {
  value: number
  className?: string
  showLabel?: boolean
}) {
  const pct = confidencePct(value)

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-foreground/70" style={{ width: `${pct}%` }} />
      </div>
      {showLabel ? <span className="font-mono text-xs tabular-nums text-muted-foreground">{pct}%</span> : null}
    </div>
  )
}
