"use client"

import type { KillChainStageData } from "@/features/attack/utils/kill-chain"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog"
import { Badge } from "@/shared/ui/badge"
import { Clock, Workflow } from "lucide-react"
import { cn } from "@/shared/lib/utils"

interface KillChainDetailsProps {
  stage: KillChainStageData | null
  isOpen: boolean
  onClose: () => void
}

export function KillChainDetails({ stage, isOpen, onClose }: KillChainDetailsProps) {
  const getStatusColor = () => {
    switch (stage?.status) {
      case "completed":
        return "text-green-600"
      case "active":
        return "text-blue-600"
      case "inactive":
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusText = () => {
    switch (stage?.status) {
      case "completed":
        return "已发生"
      case "active":
        return "进行中"
      case "inactive":
      default:
        return "未开始"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              {stage?.icon && <stage.icon className="w-6 h-6" />}
            </div>

            <div>
              <DialogTitle className="text-xl">{stage?.name || "未选择阶段"}</DialogTitle>

              {/* 使用 asChild + div 避免 <p> 内嵌 <div> */}
              <DialogDescription asChild>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={cn(getStatusColor())}>
                    {getStatusText()}
                  </Badge>
                  {stage?.startTime && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {stage.startTime}
                      {stage.endTime && ` - ${stage.endTime}`}
                    </span>
                  )}
                </div>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Stage 信息 */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Workflow className={`w-5 h-5 ${cn(getStatusColor())}`} />
              阶段信息
            </h3>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                {stage
                  ? `APT Kill Chain攻击链中的 ${stage.name} 阶段。${stage.status === "completed"
                    ? " 此阶段已发生"
                    : stage.status === "active"
                      ? " 此阶段正在进行中"
                      : " 此阶段尚未开始"
                  }`
                  : "未选择阶段"}
              </p>
            </div>
          </div>

          {/* ATT&CK Stages */}
          {stage?.attckStages && stage.attckStages.length > 0 ? (
            <div>
              {/* MITRE ATT&CK Stages */}
              <div className="flex items-center gap-2 mb-3">
                <Workflow className={`w-5 h-5 ${cn(getStatusColor())}`} />
                <h3 className="text-lg font-semibold">MITRE ATT&CK 阶段</h3>
              </div>

              <div className="space-y-4">
                {stage.attckStages.map((attckStage) => (
                  <div key={attckStage.slug} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{attckStage.name}</h4>
                      <Badge variant="secondary">{attckStage.slug}</Badge>
                    </div>

                    {/* Techniques */}
                    {attckStage.techniques && attckStage.techniques.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium mb-2 text-muted-foreground">
                          技术指标 ({attckStage.techniques.length})
                        </h5>

                        {attckStage.techniques.map((technique) => (
                          <div
                            key={technique.id}
                            className="bg-muted/30 rounded-md p-3 space-y-1"
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {technique.id}
                              </Badge>
                              <span className="font-medium text-sm">{technique.name}</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {technique.time ? technique.time : "未知时间"}
                              </span>
                            </div>

                            {technique.description && (
                              <p className="text-xs text-muted-foreground">{technique.description}</p>
                            )}

                            {/* References */}
                            {technique.references && technique.references.length > 0 && (
                              <div className="mt-1 flex flex-col gap-1">
                                <span className="text-xs font-medium text-muted-foreground">
                                  References:
                                </span>
                                {technique.references.map((url, index) => (
                                  <a
                                    key={index}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline break-all"
                                  >
                                    {url}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Workflow className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
              <p>此阶段暂无 ATT&CK 技术数据。</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
