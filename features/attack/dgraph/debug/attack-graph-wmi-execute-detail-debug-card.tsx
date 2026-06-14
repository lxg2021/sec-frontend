"use client";

import { Code } from "lucide-react";

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

const WMI_EXECUTE_DETAIL_DEBUG_NODE: AttackGraphNodeModel = {
  id: "wmi_execute:debug:agent-fixture:proc-wmi-006:host_ref:srv-exec.contoso.local:root\\cimv2:win32_process:create:debug",
  key: "wmi_execute:debug:agent-fixture:proc-wmi-006:host_ref:srv-exec.contoso.local:root\\cimv2:win32_process:create:debug",
  entityType: "WmiExecute",
  displayName: "win32_process.create",
  presentationKind: getAttackGraphNodePresentationKind("WmiExecute"),
  properties: {
    agent_id: "agent-fixture",
    boot_time: "2026-04-22 12:50:00",
    class_name: "win32_process",
    has_explicit_credential: "false",
    method_name: "create",
    method_parameters: JSON.stringify({
      CommandLine: "cmd.exe /c whoami",
    }),
    namespace: "root\\cimv2",
    normalized_server_name: "srv-exec.contoso.local",
    occurred_at: "2026-04-22 12:51:00",
    parameters_fingerprint: "wmi-execute-params-debug",
    process_guid: "proc-wmi-006",
    scope_kind: "host_ref",
    scope_value: "srv-exec.contoso.local",
    server_name: "srv-exec.contoso.local",
    target_scope: "host_ref",
    tenant_id: "tenant-fixture",
    unique_id: "sample-wmi-execute-001",
    user: "",
  },
};

export function AttackGraphWmiExecuteDetailDebugCard() {
  return (
    <Card className="relative min-h-[760px] overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-700 text-white">
            <Code className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold text-slate-900">
              WmiExecute Node Detail Debug
            </CardTitle>
            <div className="mt-1 text-xs text-slate-500">
              WmiExecute graph payload rendered by the WmiExecute detail config.
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative min-h-[700px] bg-slate-50 p-4">
        <TooltipProvider delayDuration={180}>
          <AttackGraphDetailCard
            item={{ kind: "node", node: WMI_EXECUTE_DETAIL_DEBUG_NODE }}
            className="absolute bottom-4 right-4 top-4"
          />
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
