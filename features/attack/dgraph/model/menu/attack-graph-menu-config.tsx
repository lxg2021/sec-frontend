import {
  Copy,
  ScanSearch,
  ShieldMinus,
  ShieldPlus,
  SplitSquareVertical,
} from "lucide-react";

import type {
  AttackGraphMenuAction,
  AttackGraphMenuGroup,
  AttackGraphMenuProvider,
  AttackGraphNodeDrillStateByKey,
} from "./attack-graph-menu-types";
import { canShowAttackGraphRemediationMenu } from "../node/attack-graph-remediation-config";
import {
  buildAttackGraphIocSourceKey,
  getAttackGraphNodeIocCandidates,
} from "../node/attack-graph-ioc-config";

export function createCommonAttackGraphNodeMenuProvider({
  drillStateByNodeKey,
  enableIocMenu = false,
  enableRemediationMenu = false,
  iocCandidateSourceKeys,
  onMenuAction,
  remediationTargetKeys,
}: {
  drillStateByNodeKey?: AttackGraphNodeDrillStateByKey;
  enableIocMenu?: boolean;
  enableRemediationMenu?: boolean;
  iocCandidateSourceKeys?: ReadonlySet<string>;
  onMenuAction?: (action: AttackGraphMenuAction) => void | Promise<void>;
  remediationTargetKeys?: ReadonlySet<string>;
} = {}): AttackGraphMenuProvider {
  return (context) => {
    const drillState = drillStateByNodeKey?.get(context.node.key) ?? "idle";
    const drillDisabled = drillState !== "idle";
    const nodeIocCandidates = enableIocMenu
      ? getAttackGraphNodeIocCandidates(context.node)
      : [];
    const allNodeIocsAdded =
      nodeIocCandidates.length > 0 &&
      nodeIocCandidates.every((candidate) =>
        iocCandidateSourceKeys?.has(buildAttackGraphIocSourceKey(candidate)),
      );
    const remediationTargetKey = context.node.key || context.node.id;
    const remediationSelected =
      remediationTargetKeys?.has(remediationTargetKey) ?? false;
    const remediationVisible =
      enableRemediationMenu &&
      canShowAttackGraphRemediationMenu(context.node.entityType);
    const remediationItems: AttackGraphMenuGroup["items"] = remediationVisible
      ? [
          {
            id: remediationSelected
              ? "remove-remediation-target"
              : "add-remediation-target",
            label: remediationSelected
              ? "\u79fb\u9664\u5904\u7f6e\u7f16\u6392"
              : "\u52a0\u5165\u5904\u7f6e\u7f16\u6392",
            checked: remediationSelected,
            icon: remediationSelected ? (
              <ShieldMinus className="h-4 w-4" />
            ) : (
              <ShieldPlus className="h-4 w-4" />
            ),
            tone: remediationSelected ? "default" : "success",
            action: async ({ graph, node }) => {
              await onMenuAction?.({
                kind: remediationSelected
                  ? "remove-remediation-target"
                  : "add-remediation-target",
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
      ...(nodeIocCandidates.length > 0
        ? [
            {
              id: "ioc-actions",
              label: "IOC 预检",
              order: 5,
              items: [
                {
                  id: "add-ioc-candidates",
                  label: allNodeIocsAdded
                    ? "已加入预检 IOC"
                    : "加入预检 IOC",
                  description:
                    nodeIocCandidates.length > 1
                      ? `将节点中的 ${nodeIocCandidates.length} 个 IOC 加入清单`
                      : undefined,
                  checked: allNodeIocsAdded,
                  icon: <ScanSearch className="h-4 w-4" />,
                  tone: allNodeIocsAdded ? "default" : "primary",
                  action: async ({ graph, node }) => {
                    await onMenuAction?.({
                      kind: "add-ioc-candidates",
                      graph,
                      node,
                    });
                  },
                },
              ],
            },
          ]
        : []),
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
