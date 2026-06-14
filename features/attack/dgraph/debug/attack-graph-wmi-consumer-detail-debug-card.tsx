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

const WMI_CONSUMER_DETAIL_DEBUG_NODE: AttackGraphNodeModel = {
  id: "wmi_consumer:debug:host_ref:srv-ops.contoso.local:root\\subscription:fixtureconsumer",
  key: "wmi_consumer:debug:host_ref:srv-ops.contoso.local:root\\subscription:fixtureconsumer",
  entityType: "WmiConsumer",
  displayName: "fixtureconsumer",
  presentationKind: getAttackGraphNodePresentationKind("WmiConsumer"),
  properties: {
    agent_id: "agent-fixture",
    boot_time: "2026-04-22 10:10:00",
    class_name: "commandlineeventconsumer",
    event_consumer_context: JSON.stringify({
      ExecutablePath: "C:\\Windows\\System32\\cmd.exe /c calc.exe",
      CommandLineTemplate: "cmd.exe /c calc.exe",
    }),
    event_consumer_name: "fixtureconsumer",
    event_consumer_type: "2",
    event_consumer_type_description: "CommandLineEventConsumer",
    namespace: "root\\subscription",
    normalized_server_name: "srv-ops.contoso.local",
    occurred_at: "2026-04-22 10:11:00",
    scope_kind: "host_ref",
    scope_value: "srv-ops.contoso.local",
    server_name: "srv-ops.contoso.local",
    tenant_id: "tenant-fixture",
    unique_id: "sample-wmi-consumer-001",
    user: "SYSTEM",
  },
};

export function AttackGraphWmiConsumerDetailDebugCard() {
  return (
    <Card className="relative min-h-[760px] overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-700 text-white">
            <Activity className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold text-slate-900">
              WmiConsumer Node Detail Debug
            </CardTitle>
            <div className="mt-1 text-xs text-slate-500">
              WmiConsumer graph payload rendered by the WmiConsumer detail config.
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative min-h-[700px] bg-slate-50 p-4">
        <TooltipProvider delayDuration={180}>
          <AttackGraphDetailCard
            item={{ kind: "node", node: WMI_CONSUMER_DETAIL_DEBUG_NODE }}
            className="absolute bottom-4 right-4 top-4"
          />
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
