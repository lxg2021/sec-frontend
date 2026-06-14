"use client";

import { Database } from "lucide-react";

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

const BITS_DETAIL_DEBUG_NODE: AttackGraphNodeModel = {
  id: "bits:tenant-1:d0c951b3b2fe6bba106840972c7c904f:{4b66400f-8f32-4825-a9f9-d5f0bef55fa4}",
  key: "bits:tenant-1:d0c951b3b2fe6bba106840972c7c904f:{4b66400f-8f32-4825-a9f9-d5f0bef55fa4}",
  entityType: "Bits",
  displayName: "MyJob",
  presentationKind: getAttackGraphNodePresentationKind("Bits"),
  properties: {
    agent_id: "d0c951b3b2fe6bba106840972c7c904f",
    boot_time: "2026-04-21 20:10:00",
    job_files: JSON.stringify([
      {
        local_name: "c:\\temp\\data\\guide.doc",
        remote_name: "https://download.microsoft.com/path/guide.doc",
      },
      {
        local_name: "c:\\users\\public\\payload.ps1",
        remote_name: "https://cdn.example.test/install/payload.ps1",
      },
    ]),
    job_id: "{4b66400f-8f32-4825-a9f9-d5f0bef55fa4}",
    job_name: "MyJob",
    job_status: "1",
    job_status_desc: "BIT_STATUS_RESUME",
    job_type: "0",
    job_type_desc: "BG_JOB_TYPE_DOWNLOAD",
    occurred_at: "2026-04-21 20:11:00",
    tenant_id: "tenant-1",
    unique_id: "bits-fileset-unique-1",
  },
};

export function AttackGraphBitsDetailDebugCard() {
  return (
    <Card className="relative min-h-[720px] overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-700 text-white">
            <Database className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold text-slate-900">
              Bits Node Detail Debug
            </CardTitle>
            <div className="mt-1 text-xs text-slate-500">
              BITS job graph payload rendered by the Bits detail config.
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative min-h-[660px] bg-slate-50 p-4">
        <TooltipProvider delayDuration={180}>
          <AttackGraphDetailCard
            item={{ kind: "node", node: BITS_DETAIL_DEBUG_NODE }}
            className="absolute bottom-4 right-4 top-4"
          />
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
