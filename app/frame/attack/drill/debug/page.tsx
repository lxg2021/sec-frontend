"use client";

import { AttackGraphLayoutEvaluationCard } from "@/features/attack/dgraph/debug/attack-graph-layout-evaluation-card";

export default function AttackGraphDrillDebugPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <AttackGraphLayoutEvaluationCard />
    </div>
  );
}
