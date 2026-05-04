import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import {
  AlertTriangle,
  Shield,
  XCircle,
  Check,
  Monitor,
  Hammer,
  Wrench,
} from "lucide-react"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

export default function FixDropdownMenu({
  selectedMethod,
  onSelect,
  buttonVariant = "default",
  buttonClassName = "",
  disabled = false,
}) {
  const fixMethods = [
    { label: "提醒用户", icon: AlertTriangle },
    { label: "隔离文件", icon: Shield },
    { label: "阻断网络", icon: XCircle },
    { label: "自动修复", icon: Hammer },
    { label: "阻断进程", icon: Monitor },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={buttonVariant}
          className={cn(
            "rounded-lg shadow-md transition-all duration-200 hover:shadow-lg",
            buttonClassName
          )}
          disabled={disabled}
        >
          <Wrench className="h-4 w-4 mr-2" />
          {selectedMethod}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="min-w-max rounded-xl shadow-xl border border-muted p-1"
      >
        {fixMethods.map((method) => {
          const Icon = method.icon
          return (
            <DropdownMenuItem
              key={method.label}
              onClick={() => onSelect(method.label)}
              className={cn(
                "flex items-center gap-2 px-2.5 py-1.5 text-sm rounded-md cursor-pointer hover:bg-muted/50",
                selectedMethod === method.label && "bg-muted/30 font-medium"
              )}
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span>{method.label}</span>
              {selectedMethod === method.label && (
                <Check className="h-4 w-4 text-green-500 ml-2" />
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
