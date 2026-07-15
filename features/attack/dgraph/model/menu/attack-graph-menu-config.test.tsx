import { describe, expect, it } from "vitest";

import type {
  AttackGraphLayoutResult,
  AttackGraphNodeModel,
} from "../core/attack-graph-data";
import { createCommonAttackGraphNodeMenuProvider } from "./attack-graph-menu-config";

const node: AttackGraphNodeModel = {
  id: "process-1",
  key: "process-1",
  entityType: "Process",
  displayName: "winword.exe",
  presentationKind: "process",
  properties: {},
};

async function remediationMenuItemIds(
  historyStates?: ReadonlyMap<
    string,
    "prepared" | "awaiting_endpoint_report" | "executing" | "result_uncertain"
  >,
) {
  const provider = createCommonAttackGraphNodeMenuProvider({
    enableRemediationMenu: true,
    remediationHistoryNodeStates: historyStates,
  });
  const groups = await provider({ graph: {} as AttackGraphLayoutResult, node });
  return groups
    .find((group) => group.id === "response-actions")
    ?.items.map((item) => item.id) ?? [];
}

describe("graph remediation context menu", () => {
  it("does not offer another submission while the endpoint has not reported", async () => {
    expect(
      await remediationMenuItemIds(
        new Map([["process-1", "awaiting_endpoint_report"]]),
      ),
    ).toEqual([
      "remediation-history-awaiting_endpoint_report",
      "open-remediation-order",
    ]);
  });

  it("keeps the add action for a node without an active historical submission", async () => {
    expect(await remediationMenuItemIds()).toEqual(["add-remediation-target"]);
  });
});
