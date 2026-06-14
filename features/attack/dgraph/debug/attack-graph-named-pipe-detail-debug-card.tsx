"use client";

import { GitBranch } from "lucide-react";

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

const NAMED_PIPE_DETAIL_DEBUG_NODE: AttackGraphNodeModel = {
  id: "named_pipe:tenant-1:agent-1:\\\\.\\pipe\\sinanamedpipe",
  key: "named_pipe:tenant-1:agent-1:\\\\.\\pipe\\sinanamedpipe",
  entityType: "NamedPipe",
  displayName: "sinanamedpipe",
  presentationKind: getAttackGraphNodePresentationKind("NamedPipe"),
  properties: {
    agent_id: "agent-1",
    boot_time: "2026-04-21 21:00:00",
    key: "named_pipe:tenant-1:agent-1:\\\\.\\pipe\\sinanamedpipe",
    occurred_at: "2026-04-21 21:01:00",
    pipe_name: "\\\\.\\pipe\\sinanamedpipe",
    tenant_id: "tenant-1",
    unique_id: "pipe-create-unique-1",
    updated_at: "2026-06-14T10:30:00Z",
  },
};

export function AttackGraphNamedPipeDetailDebugCard() {
  return (
    <Card className="relative min-h-[760px] overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-700 text-white">
            <GitBranch className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold text-slate-900">
              NamedPipe Node Detail Debug
            </CardTitle>
            <div className="mt-1 text-xs text-slate-500">
              NamedPipe graph payload rendered by the detail config.
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative min-h-[700px] bg-slate-50 p-4">
        <TooltipProvider delayDuration={180}>
          <AttackGraphDetailCard
            item={{ kind: "node", node: NAMED_PIPE_DETAIL_DEBUG_NODE }}
            className="absolute bottom-4 right-4 top-4"
          />
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
