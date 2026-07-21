import { useState } from "react"
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from "@/shared/ui/tooltip"
import { Copy } from "lucide-react"

function TruncateCopyable({ value }: { value?: string }) {
  const [copied, setCopied] = useState(false)
  if (!value) return <div className="max-w-xs text-xs font-mono">-</div>
  const show = value.length > 10 ? value.slice(0, 10) + "..." : value

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 max-w-xs truncate text-xs font-mono cursor-pointer group">
            {show}
            <Copy
              className={`w-3 h-3 transition-colors ${
                copied
                  ? "text-green-600"
                  : "text-muted-foreground group-hover:text-primary"
              }`}
              onClick={e => {
                e.stopPropagation()
                handleCopy()
              }}
              style={{ cursor: "pointer" }}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <span className="select-all font-mono text-xs">{value}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default TruncateCopyable
