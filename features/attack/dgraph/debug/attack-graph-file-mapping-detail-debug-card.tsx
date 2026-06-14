"use client";

import { Folder } from "lucide-react";

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

const FILE_MAPPING_DETAIL_DEBUG_NODE: AttackGraphNodeModel = {
  id: "file_mapping:tenant-1:agent-1:local\\ctf.asmlistcache.fmpdefault1",
  key: "file_mapping:tenant-1:agent-1:local\\ctf.asmlistcache.fmpdefault1",
  entityType: "FileMapping",
  displayName: "ctf.asmlistcache.fmpdefault1",
  presentationKind: getAttackGraphNodePresentationKind("FileMapping"),
  properties: {
    agent_id: "agent-1",
    boot_time: "2026-04-21 21:15:00",
    file_mapping_name: "local\\ctf.asmlistcache.fmpdefault1",
    key: "file_mapping:tenant-1:agent-1:local\\ctf.asmlistcache.fmpdefault1",
    occurred_at: "2026-04-21 21:16:00",
    tenant_id: "tenant-1",
    unique_id: "filemapping-create-unique-1",
    updated_at: "2026-06-14T10:30:00Z",
  },
};

export function AttackGraphFileMappingDetailDebugCard() {
  return (
    <Card className="relative min-h-[760px] overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-700 text-white">
            <Folder className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold text-slate-900">
              FileMapping Node Detail Debug
            </CardTitle>
            <div className="mt-1 text-xs text-slate-500">
              FileMapping graph payload rendered by the detail config.
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative min-h-[700px] bg-slate-50 p-4">
        <TooltipProvider delayDuration={180}>
          <AttackGraphDetailCard
            item={{ kind: "node", node: FILE_MAPPING_DETAIL_DEBUG_NODE }}
            className="absolute bottom-4 right-4 top-4"
          />
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
