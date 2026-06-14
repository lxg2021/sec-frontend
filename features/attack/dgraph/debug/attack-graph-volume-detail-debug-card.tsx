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

const VOLUME_DETAIL_DEBUG_NODE: AttackGraphNodeModel = {
  id: "volume-debug-a145efa1-b68f-4181-96de-4508f7120e13",
  key: "volume:debug:d0c951b3b2fe6bba106840972c7c904f:c::0",
  entityType: "Volume",
  displayName: "c:",
  presentationKind: getAttackGraphNodePresentationKind("Volume"),
  properties: {
    access_type: "3",
    agent_id: "d0c951b3b2fe6bba106840972c7c904f",
    boot_time: "2024/05/04 14:00:41",
    driver_type: "0",
    event_id: "73",
    file_name: "c:",
    occurred_at: "2024/05/04 15:29:25",
    unique_id: "a145efa1-b68f-4181-96de-4508f7120e13",
  },
};

export function AttackGraphVolumeDetailDebugCard() {
  return (
    <Card className="relative min-h-[620px] overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-700 text-white">
            <HardDrive className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold text-slate-900">
              Volume Node Detail Debug
            </CardTitle>
            <div className="mt-1 text-xs text-slate-500">
              AccessVolume sample payload rendered by the Volume detail config.
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative min-h-[560px] bg-slate-50 p-4">
        <TooltipProvider delayDuration={180}>
          <AttackGraphDetailCard
            item={{ kind: "node", node: VOLUME_DETAIL_DEBUG_NODE }}
            className="absolute bottom-4 right-4 top-4"
          />
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
