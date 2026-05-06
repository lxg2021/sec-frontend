import type { UserLogicGroup } from "@/features/collection/types"
import type { LogicGroup } from "@/features/assets/approval/types"

function inferType(path: string): UserLogicGroup["type"] {
  const depth = path.split("/").filter(Boolean).length
  if (depth <= 1) return "company"
  if (depth === 2) return "department"
  return "group"
}

function parentPathOf(path: string) {
  const parts = path.split("/").filter(Boolean)
  if (parts.length <= 1) return ""
  return parts.slice(0, -1).join("/")
}

function sortByPath<T extends { path: string }>(items: T[]) {
  return [...items].sort((a, b) => a.path.localeCompare(b.path))
}

export function backendLogicGroupsToUserTree(groups: LogicGroup[]): UserLogicGroup[] {
  if (groups.length === 0) return []

  const pathToId = new Map<string, string>()
  groups.forEach((group) => {
    pathToId.set(group.full_path || group.name, group.id)
  })

  const nodes = new Map<string, UserLogicGroup>()
  const parentIds = new Map<string, string | undefined>()

  groups.forEach((group) => {
    const path = group.full_path || group.name
    const explicitParentId = group.parent_id || undefined
    const inferredParentId = pathToId.get(parentPathOf(path))
    const parentId = explicitParentId && groups.some((item) => item.id === explicitParentId)
      ? explicitParentId
      : inferredParentId

    nodes.set(group.id, {
      id: group.id,
      name: group.name,
      path,
      type: inferType(path),
      ...(parentId ? { parentId } : {}),
    })
    parentIds.set(group.id, parentId)
  })

  const roots: UserLogicGroup[] = []

  nodes.forEach((node, id) => {
    const parentId = parentIds.get(id)
    const parent = parentId ? nodes.get(parentId) : undefined

    if (!parent) {
      roots.push(node)
      return
    }

    parent.children = parent.children ? sortByPath([...parent.children, node]) : [node]
  })

  return sortByPath(roots)
}
