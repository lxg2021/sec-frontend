"use client";

import { AttackGraphLayoutEvaluationCard } from "@/features/attack/dgraph/debug/attack-graph-layout-evaluation-card";
import { AttackGraphTaskDetailDebugCard } from "@/features/attack/dgraph/debug/attack-graph-task-detail-debug-card";
import { AttackGraphVolumeDetailDebugCard } from "@/features/attack/dgraph/debug/attack-graph-volume-detail-debug-card";
import { AttackGraphWmiClassDetailDebugCard } from "@/features/attack/dgraph/debug/attack-graph-wmi-class-detail-debug-card";
import { AttackGraphWmiExecuteDetailDebugCard } from "@/features/attack/dgraph/debug/attack-graph-wmi-execute-detail-debug-card";

export default function AttackGraphDrillDebugPage() {
  return (
    <div className="min-h-screen space-y-6 bg-slate-50 p-6">
      <AttackGraphWmiClassDetailDebugCard />
      <AttackGraphWmiExecuteDetailDebugCard />
      <AttackGraphVolumeDetailDebugCard />
      <AttackGraphTaskDetailDebugCard />
      <AttackGraphLayoutEvaluationCard />
    </div>
  );
}
