import type {
  ControlObjectAgentState,
  ControlObjectOperation,
} from "@/features/control-object-library/api"
import type {
  HostSelectorGroupNode,
  HostSelectorTreeNode,
} from "@/shared/components/host-selector/types"

export function eligibleControlObjectAgentIds(
  agents: ControlObjectAgentState[],
  operation: ControlObjectOperation,
) {
  if (operation !== "stop" && operation !== "remove") {
    return new Set(agents.map((agent) => agent.agentId))
  }

  return new Set(agents.flatMap((agent) => {
    if (agent.hasActiveChange || agent.currentEffect?.applyState !== "success") return []

    const currentState = agent.currentEffect.currentState
    if (operation === "stop" && currentState === "started") return [agent.agentId]
    if (operation === "remove" && (currentState === "started" || currentState === "stopped")) {
      return [agent.agentId]
    }
    return []
  }))
}

function filteredGroupNode(
  node: HostSelectorGroupNode,
  eligibleAgentIds: ReadonlySet<string>,
): HostSelectorGroupNode | null {
  const children = filterHostTreeByAgentIds(node.children, eligibleAgentIds)
  const directHostCount = children.filter((child) => child.type === "host").length
  const descendantHostCount = children.reduce((count, child) => (
    count + (child.type === "host" ? 1 : child.descendantHostCount ?? child.hostCount ?? 0)
  ), 0)

  if (descendantHostCount === 0) return null

  return {
    ...node,
    children,
    hostCount: descendantHostCount,
    directHostCount,
    descendantHostCount,
  }
}

export function filterHostTreeByAgentIds(
  nodes: HostSelectorTreeNode[],
  eligibleAgentIds: ReadonlySet<string>,
): HostSelectorTreeNode[] {
  return nodes.reduce<HostSelectorTreeNode[]>((filteredNodes, node) => {
    if (node.type === "host") {
      if (eligibleAgentIds.has(node.hostId)) filteredNodes.push(node)
      return filteredNodes
    }

    const filtered = filteredGroupNode(node, eligibleAgentIds)
    if (filtered) filteredNodes.push(filtered)
    return filteredNodes
  }, [])
}
