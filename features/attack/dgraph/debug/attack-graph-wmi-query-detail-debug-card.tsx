"use client";

import { Terminal } from "lucide-react";

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

const WMI_QUERY_DETAIL_DEBUG_NODE: AttackGraphNodeModel = {
  id: "wmi_query:debug:agent-fixture:process-guid-001:host_ref:pc-01:root\\cimv2:query-fixture",
  key: "wmi_query:debug:agent-fixture:process-guid-001:host_ref:pc-01:root\\cimv2:query-fixture",
  entityType: "WmiQuery",
  displayName: "select * from win32_process",
  presentationKind: getAttackGraphNodePresentationKind("WmiQuery"),
  properties: {
    agent_id: "agent-fixture",
    boot_time: "2026-04-22 10:30:00",
    has_explicit_credential: "true",
    namespace: "root\\cimv2",
    normalized_server_name: "pc-01",
    occurred_at: "2026-04-22 10:31:00",
    process_guid: "5ae67cc62620078c003a6af54370da01",
    query:
      "SELECT * FROM Win32_Process WHERE Name = 'powershell.exe' OR CommandLine LIKE '%-enc%'",
    query_fingerprint: "0b7d8c5fe72aa7e9f0a64f93a3b1c9dd",
    query_language: "WQL",
    scope_kind: "host_ref",
    scope_value: "pc-01",
    server_name: "\\\\PC-01",
    target_scope: "host_ref",
    tenant_id: "tenant-fixture",
    unique_id: "sample-wmi-query-001",
    user: "DOMAIN\\analyst",
  },
};

export function AttackGraphWmiQueryDetailDebugCard() {
  return (
    <Card className="relative min-h-[760px] overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-700 text-white">
            <Terminal className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold text-slate-900">
              WmiQuery Node Detail Debug
            </CardTitle>
            <div className="mt-1 text-xs text-slate-500">
              WmiQuery graph payload rendered by the WmiQuery detail config.
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative min-h-[700px] bg-slate-50 p-4">
        <TooltipProvider delayDuration={180}>
          <AttackGraphDetailCard
            item={{ kind: "node", node: WMI_QUERY_DETAIL_DEBUG_NODE }}
            className="absolute bottom-4 right-4 top-4"
          />
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
