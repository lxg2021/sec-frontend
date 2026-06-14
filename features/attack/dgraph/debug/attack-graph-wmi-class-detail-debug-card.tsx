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

const WMI_CLASS_DETAIL_DEBUG_NODE: AttackGraphNodeModel = {
  id: "wmi-class:debug:d0c951b3b2fe6bba106840972c7c904f:example",
  key: "wmi-class:debug:d0c951b3b2fe6bba106840972c7c904f:example",
  entityType: "WmiClass",
  displayName: "example",
  presentationKind: getAttackGraphNodePresentationKind("WmiClass"),
  properties: {
    agent_id: "d0c951b3b2fe6bba106840972c7c904f",
    boot_time: "2024/05/04 10:50:36",
    class_attributes: JSON.stringify([
      { attrname: "__genus", attrvalue: "1", isbase64: false },
      { attrname: "__class", attrvalue: "example", isbase64: false },
      { attrname: "__superclass", attrvalue: "", isbase64: false },
      { attrname: "__dynasty", attrvalue: "example", isbase64: false },
      { attrname: "__relpath", attrvalue: "example", isbase64: false },
      { attrname: "__property_count", attrvalue: "3", isbase64: false },
      { attrname: "__derivation", attrvalue: "", isbase64: false },
      { attrname: "__server", attrvalue: "", isbase64: false },
      { attrname: "__namespace", attrvalue: "", isbase64: false },
      { attrname: "__path", attrvalue: "", isbase64: false },
      { attrname: "index", attrvalue: "", isbase64: false },
      { attrname: "intval", attrvalue: "", isbase64: false },
      { attrname: "otherinfo", attrvalue: "<default>", isbase64: false },
    ]),
    class_name: "example",
    class_path: "",
    event_id: "57",
    namespace: "",
    occurred_at: "2024/05/04 11:46:51",
    process_id: "5632",
    process_image: "c:\\users\\lxg\\desktop\\sdb\\wmicreateclass.exe",
    process_md5: "a1ca720ee3882319a55438bf2991a1fc",
    process_name: "wmicreateclass.exe",
    scope_kind: "host",
    scope_value: "d0c951b3b2fe6bba106840972c7c904f",
    server_name: "",
    super_class_name: "",
    unique_id: "wmi-class-debug-event-57-example",
    user: "",
  },
};

export function AttackGraphWmiClassDetailDebugCard() {
  return (
    <Card className="relative min-h-[760px] overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-purple-700 text-white">
            <Database className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold text-slate-900">
              WmiClass Node Detail Debug
            </CardTitle>
            <div className="mt-1 text-xs text-slate-500">
              WmiClass graph payload rendered by the WmiClass detail config.
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative min-h-[700px] bg-slate-50 p-4">
        <TooltipProvider delayDuration={180}>
          <AttackGraphDetailCard
            item={{ kind: "node", node: WMI_CLASS_DETAIL_DEBUG_NODE }}
            className="absolute bottom-4 right-4 top-4"
          />
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
