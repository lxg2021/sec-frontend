import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";
import { Badge } from "@/shared/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { HelpCircle, Server } from "lucide-react";
import type { PolicyType } from "@/features/dac/types";

interface PolicyHeaderFormProps {
  policyType: PolicyType;
  version: string;
  policyName: string;
  level: string;
  selectedHostIds: Set<string>;
  onVersionChange: (version: string) => void;
  onPolicyNameChange: (name: string) => void;
  onLevelChange: (level: string) => void;
  onHostSelect: () => void;
  title?: string;
  showBadge?: boolean;
}

export function PolicyHeaderForm({
  policyType,
  version,
  policyName,
  level,
  selectedHostIds,
  onVersionChange,
  onPolicyNameChange,
  onLevelChange,
  onHostSelect,
  title = "策略基础信息",
  showBadge = false,
}: PolicyHeaderFormProps) {
  const getPolicyTypeLabel = (type: PolicyType) => {
    switch (type) {
      case "fs": return "文件系统";
      case "reg": return "注册表";
      case "ps": return "进程";
      case "net": return "网络";
      default: return type;
    }
  };

  return (
    <Card className="p-6 border-l-4 border-l-primary shadow-sm">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">{title}</h2>
            {showBadge && (
              <Badge variant="secondary" className="text-xs">
                {getPolicyTypeLabel(policyType)}控制
              </Badge>
            )}
          </div>
        </div>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="version" className="text-sm font-medium">版本</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  策略版本号，例如 v1.0
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="version"
              placeholder="v1.0"
              value={version}
              onChange={(e) => onVersionChange(e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="name" className="text-sm font-medium">策略名称</Label>
              <span className="text-red-500 text-sm">*</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  策略的友好名称，用于识别和管理
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="name"
              placeholder={`${getPolicyTypeLabel(policyType)}访问控制策略`}
              value={policyName}
              onChange={(e) => onPolicyNameChange(e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="level" className="text-sm font-medium">优先级</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  策略优先级，数值越小优先级越高，范围 1-254
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="relative">
              <Input
                id="level"
                type="number"
                min="1"
                max="254"
                value={level}
                onChange={(e) => onLevelChange(e.target.value)}
                className="bg-background pr-12"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Badge variant="outline" className="text-xs bg-muted">
                  1-254
                </Badge>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="target-host" className="text-sm font-medium">目标主机</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  应用此策略的目标主机
                </TooltipContent>
              </Tooltip>
            </div>
            <Button
              id="target-host"
              variant="outline"
              className="w-full justify-between h-10 bg-background hover:bg-muted/50"
              onClick={onHostSelect}
            >
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                <span className={selectedHostIds.size > 0 ? "font-medium" : "text-muted-foreground"}>
                  {selectedHostIds.size > 0 ? `${selectedHostIds.size} 台主机` : "选择主机"}
                </span>
              </div>
              {selectedHostIds.size > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedHostIds.size}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
