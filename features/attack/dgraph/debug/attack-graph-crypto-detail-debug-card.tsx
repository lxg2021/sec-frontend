"use client";

import { Lock } from "lucide-react";

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

const CRYPTO_DETAIL_DEBUG_NODE: AttackGraphNodeModel = {
  id: "crypto:tenant-1:agent-1:proc-crypto-1:1",
  key: "crypto:tenant-1:agent-1:proc-crypto-1:1",
  entityType: "Crypto",
  displayName: "crypt_protect_data_flag",
  presentationKind: getAttackGraphNodePresentationKind("Crypto"),
  properties: {
    agent_id: "agent-1",
    boot_time: "2026-04-21 13:00:00",
    crypt_flag: "1",
    crypt_flag_description: "crypt_protect_data_flag",
    key: "crypto:tenant-1:agent-1:proc-crypto-1:1",
    occurred_at: "2026-04-21 13:01:00",
    operation_kind: "crypt_protect_data_flag",
    process_guid: "proc-crypto-1",
    tenant_id: "tenant-1",
    unique_id: "encrypt-decrypt-unique-1",
  },
};

export function AttackGraphCryptoDetailDebugCard() {
  return (
    <Card className="relative min-h-[620px] overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-700 text-white">
            <Lock className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold text-slate-900">
              Crypto Node Detail Debug
            </CardTitle>
            <div className="mt-1 text-xs text-slate-500">
              EncryptDecrypt graph payload rendered by the Crypto detail config.
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative min-h-[560px] bg-slate-50 p-4">
        <TooltipProvider delayDuration={180}>
          <AttackGraphDetailCard
            item={{ kind: "node", node: CRYPTO_DETAIL_DEBUG_NODE }}
            className="absolute bottom-4 right-4 top-4"
          />
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
