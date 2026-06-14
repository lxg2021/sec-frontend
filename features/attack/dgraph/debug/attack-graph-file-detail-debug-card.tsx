"use client";

import { FileText } from "lucide-react";

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

const FILE_DETAIL_DEBUG_NODE: AttackGraphNodeModel = {
  id: "file-debug-d111def1-87b8-41a7-a3f4-06a751728ff9",
  key: "file:debug:d0c951b3b2fe6bba106840972c7c904f:e:\\dnsquery.vmp.exe",
  entityType: "File",
  displayName: "dnsquery.vmp.exe",
  presentationKind: getAttackGraphNodePresentationKind("File"),
  properties: {
    agent_id: "d0c951b3b2fe6bba106840972c7c904f",
    detection_content: "vmprotect(2.x)[-]",
    detection_major_type: "1",
    detection_minor_type: "0",
    driver_type: "1",
    file_class: "1",
    file_class_description: "binary",
    file_format: "4",
    file_format_description: "pe_exe",
    file_md5: "3c4b348ab52f5543e4ef225221c5af4f",
    file_name: "e:\\dnsquery.vmp.exe",
    occurred_at: "2024/05/04 14:35:48",
    org_file_name: "dnsquery.exe",
    signature: "0",
    sign_vendor: "",
    unique_id: "d111def1-87b8-41a7-a3f4-06a751728ff9",
  },
};

export function AttackGraphFileDetailDebugCard() {
  return (
    <Card className="relative min-h-[760px] overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-700 text-white">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold text-slate-900">
              File Node Detail Debug
            </CardTitle>
            <div className="mt-1 text-xs text-slate-500">
              File graph payload rendered by the detail config.
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative min-h-[700px] bg-slate-50 p-4">
        <TooltipProvider delayDuration={180}>
          <AttackGraphDetailCard
            item={{ kind: "node", node: FILE_DETAIL_DEBUG_NODE }}
            className="absolute bottom-4 right-4 top-4"
          />
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
