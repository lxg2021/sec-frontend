"use client";

import { Usb } from "lucide-react";

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

const DEVICE_DETAIL_DEBUG_NODE: AttackGraphNodeModel = {
  id: "device:tenant-1:agent-1:usb\\vid_0951&pid_1666:4d36e967-e325-11ce-bfc1-08002be10318",
  key: "device:tenant-1:agent-1:usb\\vid_0951&pid_1666:4d36e967-e325-11ce-bfc1-08002be10318",
  entityType: "Device",
  displayName: "USB Storage",
  presentationKind: getAttackGraphNodePresentationKind("Device"),
  properties: {
    agent_id: "agent-1",
    device_description: "USB Storage",
    device_flag: "1",
    device_flag_description: "device_insert",
    device_guid: "4d36e967-e325-11ce-bfc1-08002be10318",
    device_type: "16",
    hid: "usb\\vid_0951&pid_1666",
    key: "device:tenant-1:agent-1:usb\\vid_0951&pid_1666:4d36e967-e325-11ce-bfc1-08002be10318",
    tenant_id: "tenant-1",
    updated_at: "2026-04-22T10:00:00Z",
  },
};

export function AttackGraphDeviceDetailDebugCard() {
  return (
    <Card className="relative min-h-[760px] overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-700 text-white">
            <Usb className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold text-slate-900">
              Device Node Detail Debug
            </CardTitle>
            <div className="mt-1 text-xs text-slate-500">
              Device graph payload rendered by the detail config.
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative min-h-[700px] bg-slate-50 p-4">
        <TooltipProvider delayDuration={180}>
          <AttackGraphDetailCard
            item={{ kind: "node", node: DEVICE_DETAIL_DEBUG_NODE }}
            className="absolute bottom-4 right-4 top-4"
          />
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
