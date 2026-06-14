"use client";

import { User } from "lucide-react";

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

const ACCOUNT_DETAIL_DEBUG_NODE: AttackGraphNodeModel = {
  id: "account:tenant-1:agent:d0c951b3b2fe6bba106840972c7c904f:sid:s-1-5-21-2738161467-2500408900-3226194357-1001",
  key: "account:tenant-1:agent:d0c951b3b2fe6bba106840972c7c904f:sid:s-1-5-21-2738161467-2500408900-3226194357-1001",
  entityType: "Account",
  displayName: "desktop-p0mgc81\\lxg",
  presentationKind: getAttackGraphNodePresentationKind("Account"),
  properties: {
    agent_id: "d0c951b3b2fe6bba106840972c7c904f",
    domain: "desktop-p0mgc81",
    key: "account:tenant-1:agent:d0c951b3b2fe6bba106840972c7c904f:sid:s-1-5-21-2738161467-2500408900-3226194357-1001",
    scope_kind: "local",
    sid: "s-1-5-21-2738161467-2500408900-3226194357-1001",
    tenant_id: "tenant-1",
    updated_at: "2026-04-21T10:00:00Z",
    user: "lxg",
  },
};

export function AttackGraphAccountDetailDebugCard() {
  return (
    <Card className="relative min-h-[700px] overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-700 text-white">
            <User className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold text-slate-900">
              Account Node Detail Debug
            </CardTitle>
            <div className="mt-1 text-xs text-slate-500">
              Account graph payload rendered by the detail config.
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative min-h-[640px] bg-slate-50 p-4">
        <TooltipProvider delayDuration={180}>
          <AttackGraphDetailCard
            item={{ kind: "node", node: ACCOUNT_DETAIL_DEBUG_NODE }}
            className="absolute bottom-4 right-4 top-4"
          />
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
