import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface NetworkPolicyFormProps {
  netDirection: "in" | "out";
  netAction: "allow" | "block" | "bypass";
  netProfile: "domain" | "private" | "public" | "any";
  netProtocol: "tcp" | "udp" | "icmp" | "any";
  localPort: string;
  remotePort: string;
  localAddress: string;
  remoteAddress: string;
  programPath: string;
  onDirectionChange: (direction: "in" | "out") => void;
  onActionChange: (action: "allow" | "block" | "bypass") => void;
  onProfileChange: (profile: "domain" | "private" | "public" | "any") => void;
  onProtocolChange: (protocol: "tcp" | "udp" | "icmp" | "any") => void;
  onLocalPortChange: (port: string) => void;
  onRemotePortChange: (port: string) => void;
  onLocalAddressChange: (address: string) => void;
  onRemoteAddressChange: (address: string) => void;
  onProgramPathChange: (path: string) => void;
}

export function NetworkPolicyForm({
  netDirection,
  netAction,
  netProfile,
  netProtocol,
  localPort,
  remotePort,
  localAddress,
  remoteAddress,
  programPath,
  onDirectionChange,
  onActionChange,
  onProfileChange,
  onProtocolChange,
  onLocalPortChange,
  onRemotePortChange,
  onLocalAddressChange,
  onRemoteAddressChange,
  onProgramPathChange,
}: NetworkPolicyFormProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6 border-l-4 border-l-blue-500 shadow-sm">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">规则配置</h2>
          <Separator />
          <div className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="direction" className="text-sm font-medium">流量方向</Label>
              <Select value={netDirection} onValueChange={(v) => onDirectionChange(v as any)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">入站 (Inbound)</SelectItem>
                  <SelectItem value="out">出站 (Outbound)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label htmlFor="action" className="text-sm font-medium">处理动作</Label>
              <Select value={netAction} onValueChange={(v) => onActionChange(v as any)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allow">允许 (Allow)</SelectItem>
                  <SelectItem value="block">阻止 (Block)</SelectItem>
                  <SelectItem value="bypass">绕过 (Bypass)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label htmlFor="profile" className="text-sm font-medium">网络配置文件</Label>
              <Select value={netProfile} onValueChange={(v) => onProfileChange(v as any)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="domain">域网络 (Domain)</SelectItem>
                  <SelectItem value="private">专用网络 (Private)</SelectItem>
                  <SelectItem value="public">公用网络 (Public)</SelectItem>
                  <SelectItem value="any">所有网络 (Any)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 border-l-4 border-l-green-500 shadow-sm">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">协议和端口</h2>
          <Separator />
          <div className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="protocol" className="text-sm font-medium">协议类型</Label>
              <Select value={netProtocol} onValueChange={(v) => onProtocolChange(v as any)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tcp">TCP</SelectItem>
                  <SelectItem value="udp">UDP</SelectItem>
                  <SelectItem value="icmp">ICMP</SelectItem>
                  <SelectItem value="any">所有协议 (Any)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label htmlFor="localport" className="text-sm font-medium">本地端口</Label>
              <Input
                id="localport"
                placeholder="80,443,8080 或 any"
                value={localPort}
                onChange={(e) => onLocalPortChange(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="remoteport" className="text-sm font-medium">远程端口</Label>
              <Input
                id="remoteport"
                placeholder="any 或具体端口"
                value={remotePort}
                onChange={(e) => onRemotePortChange(e.target.value)}
                className="bg-background"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 border-l-4 border-l-purple-500 shadow-sm">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">地址范围</h2>
          <Separator />
          <div className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="localaddr" className="text-sm font-medium">本地地址</Label>
              <Input
                id="localaddr"
                placeholder="any 或 IP/CIDR"
                value={localAddress}
                onChange={(e) => onLocalAddressChange(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="remoteaddr" className="text-sm font-medium">远程地址</Label>
              <Input
                id="remoteaddr"
                placeholder="192.168.1.0/24"
                value={remoteAddress}
                onChange={(e) => onRemoteAddressChange(e.target.value)}
                className="bg-background"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 border-l-4 border-l-orange-500 shadow-sm">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">程序关联</h2>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-1">
              <Label htmlFor="program" className="text-sm font-medium">程序路径</Label>
              <span className="text-red-500 text-sm">*</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  应用此网络规则的进程路径，支持通配符匹配多个程序
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="program"
              placeholder="C:\\Program Files\\App\\app.exe"
              value={programPath}
              onChange={(e) => onProgramPathChange(e.target.value)}
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground">
              应用此网络规则的进程路径，支持通配符匹配多个程序
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}