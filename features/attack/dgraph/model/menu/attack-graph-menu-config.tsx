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
  AttackGraphIocCandidateSyncState,
  AttackGraphNodeDrillStateByKey,
} from "./attack-graph-menu-types";
import { canShowAttackGraphRemediationMenu } from "../node/attack-graph-remediation-config";
import {
  buildAttackGraphIocIdentityKey,
  getAttackGraphNodeIocCandidates,
} from "../node/attack-graph-ioc-config";

export function createCommonAttackGraphNodeMenuProvider({
  drillStateByNodeKey,
  enableIocMenu = false,
  enableRemediationMenu = false,
  iocCandidateIdentityKeys,
  iocCandidateSyncState = "ready",
  onMenuAction,
  remediationTargetKeys,
}: {
  drillStateByNodeKey?: AttackGraphNodeDrillStateByKey;
  enableIocMenu?: boolean;
  enableRemediationMenu?: boolean;
  iocCandidateIdentityKeys?: ReadonlySet<string>;
  iocCandidateSyncState?: AttackGraphIocCandidateSyncState;
  onMenuAction?: (action: AttackGraphMenuAction) => void | Promise<void>;
  remediationTargetKeys?: ReadonlySet<string>;
} = {}): AttackGraphMenuProvider {
  return (context) => {
    const drillState = drillStateByNodeKey?.get(context.node.key) ?? "idle";
    const drillDisabled = drillState !== "idle";
    const nodeIocCandidates = enableIocMenu
      ? getAttackGraphNodeIocCandidates(context.node)
      : [];
    const eligibleNodeIocCandidates = nodeIocCandidates.filter(
      (candidate) => candidate.precheckEligible,
    );
    const unavailableNodeIocCount =
      nodeIocCandidates.length - eligibleNodeIocCandidates.length;
    const existingNodeIocCount = eligibleNodeIocCandidates.filter((candidate) =>
      iocCandidateIdentityKeys?.has(
        buildAttackGraphIocIdentityKey(candidate.iocType, candidate.value),
      ),
    ).length;
    const missingNodeIocCount =
      eligibleNodeIocCandidates.length - existingNodeIocCount;
    const allNodeIocsExist =
      eligibleNodeIocCandidates.length > 0 && missingNodeIocCount === 0;
    const iocSyncUnavailable = iocCandidateSyncState !== "ready";
    const noEligibleNodeIocs =
      nodeIocCandidates.length > 0 && eligibleNodeIocCandidates.length === 0;
    const iocMenuDisabled =
      iocSyncUnavailable || noEligibleNodeIocs || allNodeIocsExist;
    const iocItems: AttackGraphMenuGroup["items"] =
      nodeIocCandidates.length > 0
        ? [
            {
              id: "add-ioc-candidates",
              label:
                iocCandidateSyncState === "loading"
                  ? "正在同步预检 IOC"
                  : iocCandidateSyncState === "error"
                    ? "预检 IOC 同步失败"
                    : noEligibleNodeIocs
                      ? nodeIocCandidates[0]?.precheckUnavailableReason ||
                        "当前节点无可预检 IOC"
                      : allNodeIocsExist
                        ? "已存在预检 IOC"
                        : "加入预检 IOC",
              description:
                iocCandidateSyncState === "loading"
                  ? "候选加载或自动提取完成后即可操作"
                  : iocCandidateSyncState === "error"
                    ? "请在 Control Panel 中重新加载候选"
                    : noEligibleNodeIocs
                      ? "该地址不会提交到公网 IOC 检测"
                      : allNodeIocsExist
                        ? undefined
                        : existingNodeIocCount > 0
                          ? `已存在 ${existingNodeIocCount} 个，可加入 ${missingNodeIocCount} 个`
                          : eligibleNodeIocCandidates.length > 1
                            ? `将节点中的 ${eligibleNodeIocCandidates.length} 个 IOC 加入清单`
                            : unavailableNodeIocCount > 0
                              ? `另有 ${unavailableNodeIocCount} 个 IOC 无需公网预检`
                              : undefined,
              disabled: iocMenuDisabled,
              checked: !iocSyncUnavailable && allNodeIocsExist,
              icon: <ScanSearch className="h-4 w-4" />,
              tone: iocMenuDisabled ? "default" : "primary",
              action: async ({ graph, node }) => {
                if (iocMenuDisabled) {
                  return;
                }
                await onMenuAction?.({
                  kind: "add-ioc-candidates",
                  graph,
                  node,
                });
              },
            },
          ]
        : [];
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

    const groups: AttackGraphMenuGroup[] = [
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
      ...(iocItems.length > 0
        ? [
            {
              id: "ioc-actions",
              label: "IOC 预检",
              order: 5,
              items: iocItems,
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
    return groups;
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
