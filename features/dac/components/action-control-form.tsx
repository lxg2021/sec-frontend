import { Card } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";
import { ActionCard } from "./action-card";
import type { ActionOption } from "@/features/dac/types";

interface ActionControlFormProps {
  promptActions: string[];
  rejectActions: string[];
  auditActions: string[];
  availableActions: ActionOption[];
  onPromptActionToggle: (action: string) => void;
  onRejectActionToggle: (action: string) => void;
  onAuditActionToggle: (action: string) => void;
}

export function ActionControlForm({
  promptActions,
  rejectActions,
  auditActions,
  availableActions,
  onPromptActionToggle,
  onRejectActionToggle,
  onAuditActionToggle,
}: ActionControlFormProps) {
  return (
    <Card className="p-6 border-l-4 border-l-green-500 shadow-sm">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">行为控制配置</h2>
        </div>
        <Separator />
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ActionCard
              title="用户决断"
              description="需要用户确认的敏感操作"
              actions={promptActions}
              availableActions={availableActions}
              onActionToggle={onPromptActionToggle}
              disabledActions={rejectActions}
              badgeColor="outline"
              className="border-yellow-200 bg-yellow-50/50"
            />

            <ActionCard
              title="拒绝行为"
              description="直接阻止的危险操作"
              actions={rejectActions}
              availableActions={availableActions}
              onActionToggle={onRejectActionToggle}
              disabledActions={promptActions}
              badgeColor="destructive"
              className="border-red-200 bg-red-50/50"
            />

            <ActionCard
              title="审计行为"
              description="仅记录日志的监控操作"
              actions={auditActions}
              availableActions={availableActions}
              onActionToggle={onAuditActionToggle}
              badgeColor="secondary"
              className="border-blue-200 bg-blue-50/50"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
