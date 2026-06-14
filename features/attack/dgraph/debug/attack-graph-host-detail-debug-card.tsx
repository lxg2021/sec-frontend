"use client";

import { Monitor } from "lucide-react";

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

const HOST_DETAIL_DEBUG_NODE: AttackGraphNodeModel = {
  id: "host:debug:d0c951b3b2fe6bba106840972c7c904f",
  key: "host:debug:d0c951b3b2fe6bba106840972c7c904f",
  entityType: "Host",
  displayName: "DESKTOP-P0MGC81",
  presentationKind: getAttackGraphNodePresentationKind("Host"),
  properties: {
    agent_id: "d0c951b3b2fe6bba106840972c7c904f",
    computer_name: "DESKTOP-P0MGC81",
    domain: "desktop-p0mgc81",
    ips: JSON.stringify(["192.168.74.129", "10.0.0.5", "127.0.0.1"]),
    last_seen_at: "2024/05/04 15:00:00",
    tenant_id: "debug",
    unique_id: "ae3b2f40-8c2a-4e3f-bd5f-1a2b3c4d5e6f",
    updated_at: "2026-06-14T10:30:00Z",
  },
};

export function AttackGraphHostDetailDebugCard() {
  return (
    <Card className="relative min-h-[640px] overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-700 text-white">
            <Monitor className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold text-slate-900">
              Host Node Detail Debug
            </CardTitle>
            <div className="mt-1 text-xs text-slate-500">
              Host graph payload rendered by the detail config.
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative min-h-[580px] bg-slate-50 p-4">
        <TooltipProvider delayDuration={180}>
          <AttackGraphDetailCard
            item={{ kind: "node", node: HOST_DETAIL_DEBUG_NODE }}
            className="absolute bottom-4 right-4 top-4"
          />
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
