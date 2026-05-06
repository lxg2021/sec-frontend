import { v4 as uuidv4 } from "uuid"
import type { BackendLogicGroupCreateData, UserLogicGroup } from "@/features/collection/types"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function normalizeGroupId(id?: string) {
  return id && UUID_PATTERN.test(id) ? id : uuidv4()
}

export function flattenLogicGroupPaths(groups: UserLogicGroup[]): string[] {
  const paths: string[] = []

  const walk = (group: UserLogicGroup) => {
    paths.push(group.path)
    group.children?.forEach(walk)
  }

  groups.forEach(walk)
  return paths
}

export function flattenDepartmentLogicGroupPaths(groups: UserLogicGroup[]): string[] {
  const paths: string[] = []

  const walk = (group: UserLogicGroup) => {
    if (group.type === "department") {
      paths.push(group.path)
    }
    group.children?.forEach(walk)
  }

  groups.forEach(walk)
  return paths
}

export function buildReplaceLogicTreeGroups(groups: UserLogicGroup[]): BackendLogicGroupCreateData[] {
  const result: BackendLogicGroupCreateData[] = []

  const walk = (
    group: UserLogicGroup,
    parentId: string | undefined,
    companyName: string,
    departmentName: string | undefined,
    pathIds: string[],
    parentPath: string,
  ) => {
    const id = normalizeGroupId(group.id)
    let nextCompanyName = companyName
    let nextDepartmentName = departmentName
    const currentPath = group.path || (parentPath ? `${parentPath}/${group.name}` : group.name)
    const currentPathIds = [...pathIds, id]

    if (group.type === "company") {
      nextCompanyName = group.name
      nextDepartmentName = undefined
    } else if (group.type === "department") {
      nextDepartmentName = group.name
    }

    result.push({
      id,
      parent_id: parentId,
      name: group.name,
      full_path: currentPath,
      full_path_ids: currentPathIds,
      company_name: nextCompanyName || group.name,
      department_name: nextDepartmentName,
    })

    group.children?.forEach((child) =>
      walk(child, id, nextCompanyName || group.name, nextDepartmentName, currentPathIds, currentPath),
    )
  }

  groups.forEach((group) => walk(group, undefined, "", undefined, [], ""))
  return result
}

export function findLogicGroupIdByPath(groups: UserLogicGroup[], path: string): string | undefined {
  const target = path.trim()
  let found: string | undefined

  const walk = (group: UserLogicGroup) => {
    if (group.path === target) {
      found = group.id
      return
    }
    group.children?.forEach(walk)
  }

  groups.forEach(walk)
  return found
}

export function ensureLogicGroupIds(groups: UserLogicGroup[]): UserLogicGroup[] {
  const walk = (nodes: UserLogicGroup[], parentId?: string, parentPath = ""): UserLogicGroup[] => {
    return nodes.map((node) => {
      const id = normalizeGroupId(node.id)
      const path = parentPath ? `${parentPath}/${node.name}` : node.name
      return {
        ...node,
        id,
        path,
        parentId,
        children: node.children ? walk(node.children, id, path) : undefined,
      }
    })
  }

  return walk(groups)
}
