import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Separator } from "@/shared/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("pages.response.dac.networkForm");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6 border-l-4 border-l-blue-500 shadow-sm">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{t("ruleConfig")}</h2>
          <Separator />
          <div className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="direction" className="text-sm font-medium">{t("direction")}</Label>
              <Select value={netDirection} onValueChange={(v) => onDirectionChange(v as any)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">{t("inbound")}</SelectItem>
                  <SelectItem value="out">{t("outbound")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label htmlFor="action" className="text-sm font-medium">{t("action")}</Label>
              <Select value={netAction} onValueChange={(v) => onActionChange(v as any)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allow">{t("allow")}</SelectItem>
                  <SelectItem value="block">{t("block")}</SelectItem>
                  <SelectItem value="bypass">{t("bypass")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label htmlFor="profile" className="text-sm font-medium">{t("profile")}</Label>
              <Select value={netProfile} onValueChange={(v) => onProfileChange(v as any)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="domain">{t("domain")}</SelectItem>
                  <SelectItem value="private">{t("private")}</SelectItem>
                  <SelectItem value="public">{t("public")}</SelectItem>
                  <SelectItem value="any">{t("anyNetwork")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 border-l-4 border-l-green-500 shadow-sm">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{t("protocolAndPorts")}</h2>
          <Separator />
          <div className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="protocol" className="text-sm font-medium">{t("protocol")}</Label>
              <Select value={netProtocol} onValueChange={(v) => onProtocolChange(v as any)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tcp">TCP</SelectItem>
                  <SelectItem value="udp">UDP</SelectItem>
                  <SelectItem value="icmp">ICMP</SelectItem>
                  <SelectItem value="any">{t("anyProtocol")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label htmlFor="localport" className="text-sm font-medium">{t("localPort")}</Label>
              <Input
                id="localport"
                placeholder={t("localPortPlaceholder")}
                value={localPort}
                onChange={(e) => onLocalPortChange(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="remoteport" className="text-sm font-medium">{t("remotePort")}</Label>
              <Input
                id="remoteport"
                placeholder={t("remotePortPlaceholder")}
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
          <h2 className="text-xl font-semibold">{t("addressRange")}</h2>
          <Separator />
          <div className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="localaddr" className="text-sm font-medium">{t("localAddress")}</Label>
              <Input
                id="localaddr"
                placeholder={t("localAddressPlaceholder")}
                value={localAddress}
                onChange={(e) => onLocalAddressChange(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="remoteaddr" className="text-sm font-medium">{t("remoteAddress")}</Label>
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
          <h2 className="text-xl font-semibold">{t("programAssociation")}</h2>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-1">
              <Label htmlFor="program" className="text-sm font-medium">{t("programPath")}</Label>
              <span className="text-red-500 text-sm">*</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  {t("programHelp")}
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
              {t("programHelp")}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
