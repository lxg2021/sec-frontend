import { v4 as uuidv4 } from "uuid"
import type { UserLogicGroup } from "@/lib/computer/ui-asset-data"
import type { TableLogicGroup } from "@/lib/computer/table"

/**
 * 将UserLogicGroup转换为TableLogicGroup
 */
export function convertToTableLogicGroups(
  userGroups: UserLogicGroup[],
  tenantId?: string,
  createdBy = "system",
): TableLogicGroup[] {
  const result: TableLogicGroup[] = []
  const now = new Date().toISOString()

  function traverse(
    group: UserLogicGroup,
    parentId: string | null,
    pathIds: string[],
    companyName: string,
    departmentName?: string,
  ) {
    // 生成新的UUID
    const newId = uuidv4()
    const currentPathIds = [...pathIds, newId]

    // 确定公司名和部门名
    let currentCompanyName = companyName
    let currentDepartmentName = departmentName

    if (group.type === "company") {
      currentCompanyName = group.name
      currentDepartmentName = undefined
    } else if (group.type === "department") {
      currentDepartmentName = group.name
    }

    // 创建TableLogicGroup记录
    const tableGroup: TableLogicGroup = {
      id: newId,
      parent_id: parentId,
      tenant_id: tenantId,
      name: group.name,
      full_path: group.path,
      full_path_ids: currentPathIds,
      company_name: currentCompanyName,
      department_name: currentDepartmentName,
      created_by: createdBy,
      created_at: now,
      updated_at: now,
    }

    result.push(tableGroup)

    // 递归处理子节点
    if (group.children && group.children.length > 0) {
      group.children.forEach((child) => {
        traverse(child, newId, currentPathIds, currentCompanyName, currentDepartmentName)
      })
    }
  }

  // 处理所有顶层节点
  userGroups.forEach((group) => {
    traverse(group, null, [], "", undefined)
  })

  return result
}

/**
 * 验证UserLogicGroup数据
 */
export function validateUserLogicGroup(group: UserLogicGroup): string[] {
  const errors: string[] = []

  if (!group.name || group.name.trim() === "") {
    errors.push(`节点名称不能为空`)
  }

  if (!group.type) {
    errors.push(`节点类型不能为空`)
  }

  if (group.children && group.children.length > 0) {
    const childNames = new Set<string>()
    group.children.forEach((child, index) => {
      if (childNames.has(child.name)) {
        errors.push(`重复的子节点名称: ${child.name}`)
      }
      childNames.add(child.name)

      const childErrors = validateUserLogicGroup(child)
      errors.push(...childErrors.map((err) => `${group.name} > ${err}`))
    })
  }

  return errors
}

/**
 * 验证整个UserLogicGroup数组
 */
export function validateUserLogicGroups(groups: UserLogicGroup[]): string[] {
  const errors: string[] = []
  const rootNames = new Set<string>()

  groups.forEach((group) => {
    if (rootNames.has(group.name)) {
      errors.push(`重复的根节点名称: ${group.name}`)
    }
    rootNames.add(group.name)

    const groupErrors = validateUserLogicGroup(group)
    errors.push(...groupErrors)
  })

  return errors
}
