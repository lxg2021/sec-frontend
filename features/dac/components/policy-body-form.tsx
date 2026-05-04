import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Separator } from "@/shared/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { HelpCircle } from "lucide-react";
import type { PolicyType } from "@/features/dac/types";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("pages.response.dac.bodyForm");

  const getObjectLabel = () => {
    switch (policyType) {
      case "fs": return t("file");
      case "reg": return t("registry");
      case "ps": return t("process");
      default: return t("object");
    }
  };

  const getSubjectPlaceholder = () => {
    switch (policyType) {
      case "fs":
        return t("subjectPlaceholderFs");
      case "reg":
        return t("subjectPlaceholderReg");
      case "ps":
        return t("subjectPlaceholderPs");
      default:
        return t("subjectPlaceholder");
    }
  };

  const getObjectPlaceholder = () => {
    switch (policyType) {
      case "fs":
        return t("objectPlaceholderFs");
      case "reg":
        return t("objectPlaceholderReg");
      case "ps":
        return t("objectPlaceholderPs");
      default:
        return t("objectPlaceholder");
    }
  };

  return (
    <Card className="p-6 border-l-4 border-l-blue-500 shadow-sm">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">{t("title")}</h2>
        </div>
        <Separator />
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-1">
              <Label htmlFor="except" className="text-sm font-medium">{t("exceptProcess")}</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  {t("exceptHelp")}
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="except"
              placeholder={t("exceptPlaceholder")}
              value={exceptSource}
              onChange={(e) => onExceptSourceChange(e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-1">
              <Label htmlFor="subject" className="text-sm font-medium">{t("subjectProcess")}</Label>
              <span className="text-red-500 text-sm">*</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  {t("subjectHelp")}
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
                {t("targetPrefix")}{getObjectLabel()}
              </Label>
              <span className="text-red-500 text-sm">*</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  {t("objectHelp")}
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
