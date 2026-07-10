import { Copy, ShieldCheck, SplitSquareVertical } from "lucide-react";

import type {
  AttackGraphMenuAction,
  AttackGraphMenuGroup,
  AttackGraphMenuProvider,
  AttackGraphNodeDrillStateByKey,
} from "./attack-graph-menu-types";
import { canShowAttackGraphRemediationMenu } from "../node/attack-graph-remediation-config";

export function createCommonAttackGraphNodeMenuProvider({
  drillStateByNodeKey,
  enableRemediationMenu = false,
  onMenuAction,
}: {
  drillStateByNodeKey?: AttackGraphNodeDrillStateByKey;
  enableRemediationMenu?: boolean;
  onMenuAction?: (action: AttackGraphMenuAction) => void | Promise<void>;
} = {}): AttackGraphMenuProvider {
  return (context) => {
    const drillState = drillStateByNodeKey?.get(context.node.key) ?? "idle";
    const drillDisabled = drillState !== "idle";
    const remediationVisible =
      enableRemediationMenu &&
      canShowAttackGraphRemediationMenu(context.node.entityType);
    const remediationItems: AttackGraphMenuGroup["items"] = remediationVisible
      ? [
          {
            id: "remediation-orchestration",
            label: "\u5904\u7f6e\u7f16\u6392",
            icon: <ShieldCheck className="h-4 w-4" />,
            tone: "success",
            action: async ({ graph, node }) => {
              await onMenuAction?.({
                kind: "remediation-orchestration",
                graph,
                node,
              });
            },
          },
        ]
      : [];

    return [
      {
        id: "node-actions",
        label: "\u8282\u70b9\u64cd\u4f5c",
        order: 0,
        items: [
          {
            id: "copy-label",
            label: "\u590d\u5236\u540d\u79f0",
            icon: <Copy className="h-4 w-4" />,
            tone: "primary",
            action: async ({ node }) => {
              const text = node.displayName || node.key || node.id;
              if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
              }
              await onMenuAction?.({
                kind: "copy-label",
                graph: context.graph,
                node,
              });
            },
          },
          {
            id: "node-drilldown",
            label: "\u6570\u636e\u4e0b\u94bb",
            disabled: drillDisabled,
            icon: <SplitSquareVertical className="h-4 w-4" />,
            action: async ({ graph, node }) => {
              if (drillDisabled) {
                return;
              }
              await onMenuAction?.({
                kind: "node-drilldown",
                graph,
                node,
              });
            },
          },
        ],
      },
      ...(remediationItems.length > 0
        ? [
            {
              id: "response-actions",
              label: "\u54cd\u5e94\u52a8\u4f5c",
              order: 10,
              items: remediationItems,
            },
          ]
        : []),
    ];
  };
}

export function compactAttackGraphMenuGroups(
  groups: AttackGraphMenuGroup[],
): AttackGraphMenuGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items,
    }))
    .filter((group) => group.items.length > 0)
    .sort(
      (left, right) =>
        (left.order ?? Number.MAX_SAFE_INTEGER) -
          (right.order ?? Number.MAX_SAFE_INTEGER) ||
        left.id.localeCompare(right.id),
    );
}
