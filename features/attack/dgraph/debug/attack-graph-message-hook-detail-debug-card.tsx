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

const MESSAGE_HOOK_DETAIL_DEBUG_NODE: AttackGraphNodeModel = {
  id: "message_hook:tenant-a:agent-1:{proc-hook}:1:kernel32.dll!createfilemappingw",
  key: "message_hook:tenant-a:agent-1:{proc-hook}:1:kernel32.dll!createfilemappingw",
  entityType: "MessageHook",
  displayName: "kernel32.dll!CreateFileMappingW",
  presentationKind: getAttackGraphNodePresentationKind("MessageHook"),
  properties: {
    agent_id: "agent-1",
    hook_type: "1",
    hook_type_description: "Windows Message Hook",
    key: "message_hook:tenant-a:agent-1:{proc-hook}:1:kernel32.dll!createfilemappingw",
    message_hook_module: "C:\\Windows\\System32\\kernel32.dll",
    module_fingerprint: "kernel32.dll!createfilemappingw",
    occurred_at: "2026-04-21 21:20:00",
    process_guid: "{PROC-HOOK-1}",
    tenant_id: "tenant-a",
    unique_id: "message-hook-unique-1",
    updated_at: "2026-06-14T10:30:00Z",
  },
};

export function AttackGraphMessageHookDetailDebugCard() {
  return (
    <Card className="relative min-h-[760px] overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-700 text-white">
            <Activity className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold text-slate-900">
              MessageHook Node Detail Debug
            </CardTitle>
            <div className="mt-1 text-xs text-slate-500">
              MessageHook graph payload rendered by the detail config.
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative min-h-[700px] bg-slate-50 p-4">
        <TooltipProvider delayDuration={180}>
          <AttackGraphDetailCard
            item={{ kind: "node", node: MESSAGE_HOOK_DETAIL_DEBUG_NODE }}
            className="absolute bottom-4 right-4 top-4"
          />
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
