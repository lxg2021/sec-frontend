"use client";

import { ClipboardList } from "lucide-react";

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

const TASK_DETAIL_DEBUG_NODE: AttackGraphNodeModel = {
  id: "task-debug-c2ef6ee9-f974-4a1e-9b2d-00b7f7f04510",
  key: "task:debug:d0c951b3b2fe6bba106840972c7c904f:/microsoft/windows/appid:testtask",
  entityType: "Task",
  displayName: "testtask",
  presentationKind: getAttackGraphNodePresentationKind("Task"),
  properties: {
    agent_id: "d0c951b3b2fe6bba106840972c7c904f",
    boot_time: "2024/05/04 10:50:36",
    domain: "desktop-p0mgc81",
    event_id: "53",
    occurred_at: "2024/05/04 11:37:27",
    process_guid: "29b2e73e12bc154c003ada5bd49dda01",
    process_id: "5452",
    process_image: "c:\\windows\\system32\\mmc.exe",
    process_md5: "55e48d7805babf5602d38052bf659930",
    process_name: "mmc.exe",
    server_name: "NULL",
    task_image_md5s: JSON.stringify(["94912c1d73ade68f2486ed4d8ea82de6"]),
    task_image_parameters: JSON.stringify(["cls"]),
    task_image_paths: JSON.stringify(["c:\\windows\\system32\\cmd.exe"]),
    task_name: "testtask",
    task_path: "\\microsoft\\windows\\appid",
    task_trigger_types: JSON.stringify(["logontrigger"]),
    task_triggers_json: JSON.stringify([
      {
        endboundry: "2025-05-04t11:36:38",
        executiontimelimit: "p3d",
        startboundary: "2024-05-04t11:36:38",
        trigertype: "logontrigger",
      },
    ]),
    unique_id: "c2ef6ee9-f974-4a1e-9b2d-00b7f7f04510",
    user: "lxg",
  },
};

export function AttackGraphTaskDetailDebugCard() {
  return (
    <Card className="relative min-h-[760px] overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-white">
            <ClipboardList className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold text-slate-900">
              Task Node Detail Debug
            </CardTitle>
            <div className="mt-1 text-xs text-slate-500">
              CreateTask sample payload rendered by the Task detail config.
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative min-h-[700px] bg-slate-50 p-4">
        <TooltipProvider delayDuration={180}>
          <AttackGraphDetailCard
            item={{ kind: "node", node: TASK_DETAIL_DEBUG_NODE }}
            className="absolute bottom-4 right-4 top-4"
          />
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
