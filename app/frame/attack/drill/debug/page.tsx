"use client";

import { AttackGraphLayoutEvaluationCard } from "@/features/attack/dgraph/debug/attack-graph-layout-evaluation-card";
import { AttackGraphMessageHookDetailDebugCard } from "@/features/attack/dgraph/debug/attack-graph-message-hook-detail-debug-card";
import { AttackGraphFileMappingDetailDebugCard } from "@/features/attack/dgraph/debug/attack-graph-file-mapping-detail-debug-card";
import { AttackGraphMailSlotDetailDebugCard } from "@/features/attack/dgraph/debug/attack-graph-mail-slot-detail-debug-card";
import { AttackGraphMbrDetailDebugCard } from "@/features/attack/dgraph/debug/attack-graph-mbr-detail-debug-card";
import { AttackGraphNamedEventDetailDebugCard } from "@/features/attack/dgraph/debug/attack-graph-named-event-detail-debug-card";
import { AttackGraphNamedPipeDetailDebugCard } from "@/features/attack/dgraph/debug/attack-graph-named-pipe-detail-debug-card";
import { AttackGraphNetAddressDetailDebugCard } from "@/features/attack/dgraph/debug/attack-graph-net-address-detail-debug-card";
import { AttackGraphNetEndpointDetailDebugCard } from "@/features/attack/dgraph/debug/attack-graph-net-endpoint-detail-debug-card";
import { AttackGraphPowerShellExecutionDetailDebugCard } from "@/features/attack/dgraph/debug/attack-graph-powershell-execution-detail-debug-card";
import { AttackGraphTaskDetailDebugCard } from "@/features/attack/dgraph/debug/attack-graph-task-detail-debug-card";
import { AttackGraphVolumeDetailDebugCard } from "@/features/attack/dgraph/debug/attack-graph-volume-detail-debug-card";
import { AttackGraphWmiClassDetailDebugCard } from "@/features/attack/dgraph/debug/attack-graph-wmi-class-detail-debug-card";
import { AttackGraphWmiConsumerDetailDebugCard } from "@/features/attack/dgraph/debug/attack-graph-wmi-consumer-detail-debug-card";
import { AttackGraphWmiExecuteDetailDebugCard } from "@/features/attack/dgraph/debug/attack-graph-wmi-execute-detail-debug-card";
import { AttackGraphWmiFilterDetailDebugCard } from "@/features/attack/dgraph/debug/attack-graph-wmi-filter-detail-debug-card";
import { AttackGraphWmiQueryDetailDebugCard } from "@/features/attack/dgraph/debug/attack-graph-wmi-query-detail-debug-card";

export default function AttackGraphDrillDebugPage() {
  return (
    <div className="min-h-screen space-y-6 bg-slate-50 p-6">
      <AttackGraphPowerShellExecutionDetailDebugCard />
      <AttackGraphMessageHookDetailDebugCard />
      <AttackGraphFileMappingDetailDebugCard />
      <AttackGraphMailSlotDetailDebugCard />
      <AttackGraphMbrDetailDebugCard />
      <AttackGraphNamedEventDetailDebugCard />
      <AttackGraphNamedPipeDetailDebugCard />
      <AttackGraphNetAddressDetailDebugCard />
      <AttackGraphNetEndpointDetailDebugCard />
      <AttackGraphWmiClassDetailDebugCard />
      <AttackGraphWmiConsumerDetailDebugCard />
      <AttackGraphWmiExecuteDetailDebugCard />
      <AttackGraphWmiFilterDetailDebugCard />
      <AttackGraphWmiQueryDetailDebugCard />
      <AttackGraphVolumeDetailDebugCard />
      <AttackGraphTaskDetailDebugCard />
      <AttackGraphLayoutEvaluationCard />
    </div>
  );
}
