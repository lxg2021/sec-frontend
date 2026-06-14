"use client";

import { Server } from "lucide-react";

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

const HOST_REF_DETAIL_DEBUG_NODE: AttackGraphNodeModel = {
  id: "host_ref:debug:pc-01",
  key: "hostref:debug:pc-01",
  entityType: "HostRef",
  displayName: "pc-01",
  presentationKind: getAttackGraphNodePresentationKind("HostRef"),
  properties: {
    key: "hostref:debug:pc-01",
    server_name: "pc-01",
    tenant_id: "debug",
    updated_at: "2026-06-14T10:30:00Z",
  },
};

export function AttackGraphHostRefDetailDebugCard() {
  return (
    <Card className="relative min-h-[520px] overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-700 text-white">
            <Server className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold text-slate-900">
              HostRef Node Detail Debug
            </CardTitle>
            <div className="mt-1 text-xs text-slate-500">
              HostRef graph payload rendered by the detail config.
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative min-h-[460px] bg-slate-50 p-4">
        <TooltipProvider delayDuration={180}>
          <AttackGraphDetailCard
            item={{ kind: "node", node: HOST_REF_DETAIL_DEBUG_NODE }}
            className="absolute bottom-4 right-4 top-4"
          />
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
