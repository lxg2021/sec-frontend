"use client";

import { Activity } from "lucide-react";

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

const NAMED_EVENT_DETAIL_DEBUG_NODE: AttackGraphNodeModel = {
  id: "named_event:tenant-a:d0c951b3b2fe6bba106840972c7c904f:global\\myevent",
  key: "named_event:tenant-a:d0c951b3b2fe6bba106840972c7c904f:global\\myevent",
  entityType: "NamedEvent",
  displayName: "myevent",
  presentationKind: getAttackGraphNodePresentationKind("NamedEvent"),
  properties: {
    agent_id: "d0c951b3b2fe6bba106840972c7c904f",
    boot_time: "2024/05/04 14:01:16",
    event_name: "global\\myevent",
    initial_state: "nonsignaled",
    key: "named_event:tenant-a:d0c951b3b2fe6bba106840972c7c904f:global\\myevent",
    manual_reset: "auto-reset event",
    occurred_at: "2024/05/04 17:34:52",
    tenant_id: "tenant-a",
    unique_id: "e22a552c-35d0-4eed-9ed8-535eb9880e12",
    updated_at: "2026-06-14T10:30:00Z",
  },
};

export function AttackGraphNamedEventDetailDebugCard() {
  return (
    <Card className="relative min-h-[760px] overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-700 text-white">
            <Activity className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold text-slate-900">
              NamedEvent Node Detail Debug
            </CardTitle>
            <div className="mt-1 text-xs text-slate-500">
              NamedEvent graph payload rendered by the detail config.
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative min-h-[700px] bg-slate-50 p-4">
        <TooltipProvider delayDuration={180}>
          <AttackGraphDetailCard
            item={{ kind: "node", node: NAMED_EVENT_DETAIL_DEBUG_NODE }}
            className="absolute bottom-4 right-4 top-4"
          />
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
