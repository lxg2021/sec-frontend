import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertTriangle, Shield, XCircle, CheckCircle, Monitor, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function FixDropdownMenu({ selectedMethod, onSelect, buttonVariant = "default", buttonClassName = "", disabled = false }) {
  const fixMethods = [
    { label: "提醒用户", icon: AlertTriangle },
    { label: "隔离文件", icon: Shield },
    { label: "阻断网络", icon: XCircle },
    { label: "自动修复", icon: CheckCircle },
    { label: "阻断进程", icon: Monitor },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={buttonVariant}
          className={buttonClassName}
          disabled={disabled}
        >
          <Wrench className="h-4 w-4 mr-2" />
          {selectedMethod}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {fixMethods.map((method) => (
          <DropdownMenuItem
            key={method.label}
            onClick={() => onSelect(method.label)}
            className="flex items-center space-x-2"
          >
            <method.icon className="h-4 w-4" />
            <span>{method.label}</span>
            {selectedMethod === method.label && <CheckCircle className="h-4 w-4 ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}