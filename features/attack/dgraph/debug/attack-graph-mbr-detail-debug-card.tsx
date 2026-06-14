"use client";

import { HardDrive } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { TooltipProvider } from "@/shared/ui/tooltip";

import { AttackGraphDetailCard } from "../components/attack-graph-detail-card";
import type { AttackGraphNodeModel } from "../model/core/attack-graph-data";
import { getAttackGraphNodePresentationKind } from "../model/node/attack-graph-node-types";

const MBR_DETAIL_DEBUG_NODE: AttackGraphNodeModel = {
  id: "mbr-debug-c6f73f49-a3c9-49f5-a97d-fff6db471089",
  key: "mbr:debug:d0c951b3b2fe6bba106840972c7c904f:\\\\.\\physicaldrive0",
  entityType: "Mbr",
  displayName: "\\\\.\\physicaldrive0",
  presentationKind: getAttackGraphNodePresentationKind("Mbr"),
  properties: {
    agent_id: "d0c951b3b2fe6bba106840972c7c904f",
    boot_time: "2024-05-04T14:01:16",
    driver_type: "0",
    occurred_at: "2024-05-04T17:42:20",
    physical_name: "\\\\.\\physicaldrive0",
    tenant_id: "debug",
    unique_id: "c6f73f49-a3c9-49f5-a97d-fff6db471089",
    updated_at: "2026-06-14T10:30:00Z",
  },
};

export function AttackGraphMbrDetailDebugCard() {
  return (
    <Card className="relative min-h-[640px] overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-rose-700 text-white">
            <HardDrive className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold text-slate-900">
              MBR Node Detail Debug
            </CardTitle>
            <div className="mt-1 text-xs text-slate-500">
              Mbr graph payload rendered by the detail config.
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative min-h-[580px] bg-slate-50 p-4">
        <TooltipProvider delayDuration={180}>
          <AttackGraphDetailCard
            item={{ kind: "node", node: MBR_DETAIL_DEBUG_NODE }}
            className="absolute bottom-4 right-4 top-4"
          />
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
