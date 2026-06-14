"use client";

import { Filter } from "lucide-react";

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

const WMI_FILTER_DETAIL_DEBUG_NODE: AttackGraphNodeModel = {
  id: "wmi_filter:debug:host_ref:pc-01:root\\subscription:persistencefilter",
  key: "wmi_filter:debug:host_ref:pc-01:root\\subscription:persistencefilter",
  entityType: "WmiFilter",
  displayName: "persistencefilter",
  presentationKind: getAttackGraphNodePresentationKind("WmiFilter"),
  properties: {
    agent_id: "agent-fixture",
    boot_time: "2026-04-22 10:20:00",
    event_filter_access: "NULL",
    event_filter_class: "__EventFilter",
    event_filter_name: "persistencefilter",
    namespace: "root\\subscription",
    normalized_server_name: "pc-01",
    occurred_at: "2026-04-22 10:21:00",
    query:
      "SELECT * FROM __InstanceCreationEvent WITHIN 10 WHERE TargetInstance ISA 'Win32_Process'",
    query_language: "WQL",
    scope_kind: "host_ref",
    scope_value: "pc-01",
    server_name: "\\\\PC-01",
    tenant_id: "tenant-fixture",
    unique_id: "sample-wmi-filter-001",
    user: "SYSTEM",
  },
};

export function AttackGraphWmiFilterDetailDebugCard() {
  return (
    <Card className="relative min-h-[760px] overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-700 text-white">
            <Filter className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold text-slate-900">
              WmiFilter Node Detail Debug
            </CardTitle>
            <div className="mt-1 text-xs text-slate-500">
              WmiFilter graph payload rendered by the WmiFilter detail config.
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative min-h-[700px] bg-slate-50 p-4">
        <TooltipProvider delayDuration={180}>
          <AttackGraphDetailCard
            item={{ kind: "node", node: WMI_FILTER_DETAIL_DEBUG_NODE }}
            className="absolute bottom-4 right-4 top-4"
          />
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
