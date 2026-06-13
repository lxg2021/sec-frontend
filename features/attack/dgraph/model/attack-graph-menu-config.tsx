import { Copy, SplitSquareVertical } from "lucide-react";

import type {
  AttackGraphMenuAction,
  AttackGraphMenuGroup,
  AttackGraphMenuProvider,
} from "./attack-graph-menu-types";

export function createCommonAttackGraphNodeMenuProvider({
  onMenuAction,
}: {
  onMenuAction?: (action: AttackGraphMenuAction) => void | Promise<void>;
} = {}): AttackGraphMenuProvider {
  return (context) => [
    {
      id: "common",
      label: "Common",
      order: 0,
      items: [
        {
          id: "copy-label",
          label: "Copy label",
          icon: <Copy className="h-4 w-4 text-slate-500" />,
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
          label: "Data drilldown",
          icon: <SplitSquareVertical className="h-4 w-4 text-blue-500" />,
          action: async ({ graph, node }) => {
            await onMenuAction?.({
              kind: "node-drilldown",
              graph,
              node,
            });
          },
        },
      ],
    },
  ];
}

export function compactAttackGraphMenuGroups(
  groups: AttackGraphMenuGroup[],
): AttackGraphMenuGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.disabled),
    }))
    .filter((group) => group.items.length > 0)
    .sort(
      (left, right) =>
        (left.order ?? Number.MAX_SAFE_INTEGER) -
          (right.order ?? Number.MAX_SAFE_INTEGER) ||
        left.id.localeCompare(right.id),
    );
}

