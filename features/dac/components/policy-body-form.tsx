import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Separator } from "@/shared/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { HelpCircle } from "lucide-react";
import type { PolicyType } from "@/features/dac/types";

interface PolicyBodyFormProps {
  policyType: PolicyType;
  exceptSource: string;
  subjectSource: string;
  objectSource: string;
  onExceptSourceChange: (source: string) => void;
  onSubjectSourceChange: (source: string) => void;
  onObjectSourceChange: (source: string) => void;
}

export function PolicyBodyForm({
  policyType,
  exceptSource,
  subjectSource,
  objectSource,
  onExceptSourceChange,
  onSubjectSourceChange,
  onObjectSourceChange,
}: PolicyBodyFormProps) {
  const getObjectLabel = () => {
    switch (policyType) {
      case "fs": return "文件";
      case "reg": return "注册表";
      case "ps": return "进程";
      default: return "对象";
    }
  };

  const getSubjectPlaceholder = () => {
    switch (policyType) {
      case "fs":
        return "例如: *\\notepad.exe 或 C:\\Windows\\System32\\*.exe";
      case "reg":
        return "例如: *\\regedit.exe 或 *\\powershell.exe";
      case "ps":
        return "例如: *\\taskmgr.exe 或 C:\\Program Files\\**\\*.exe";
      default:
        return "请输入主体进程路径";
    }
  };

  const getObjectPlaceholder = () => {
    switch (policyType) {
      case "fs":
        return "例如: C:\\Data\\*.txt 或 D:\\**\\*.log";
      case "reg":
        return "例如: HKEY_CURRENT_USER\\Software\\* 或 HKEY_LOCAL_MACHINE\\**\\Run";
      case "ps":
        return "例如: *\\calc.exe 或 C:\\Windows\\System32\\*.exe";
      default:
        return "请输入客体路径";
    }
  };

  return (
    <Card className="p-6 border-l-4 border-l-blue-500 shadow-sm">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">策略主体配置</h2>
        </div>
        <Separator />
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-1">
              <Label htmlFor="except" className="text-sm font-medium">例外进程</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  不受此策略限制的进程
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="except"
              placeholder="例如: *\rcSvc.exe (支持 * # ? 通配符，多项用分号分隔)"
              value={exceptSource}
              onChange={(e) => onExceptSourceChange(e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-1">
              <Label htmlFor="subject" className="text-sm font-medium">主体进程</Label>
              <span className="text-red-500 text-sm">*</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  执行操作的进程路径，支持 * # ? 通配符
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="subject"
              placeholder={getSubjectPlaceholder()}
              value={subjectSource}
              onChange={(e) => onSubjectSourceChange(e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-1">
              <Label htmlFor="object" className="text-sm font-medium">
                客体{getObjectLabel()}
              </Label>
              <span className="text-red-500 text-sm">*</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  被操作的目标路径，支持 * # ? 通配符
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="object"
              placeholder={getObjectPlaceholder()}
              value={objectSource}
              onChange={(e) => onObjectSourceChange(e.target.value)}
              className="bg-background"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
