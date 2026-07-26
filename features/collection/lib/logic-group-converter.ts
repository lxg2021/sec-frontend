import { v4 as uuidv4 } from "uuid"
import type { UserLogicGroup } from "@/features/collection/types"
import type { TableLogicGroup } from "@/features/collection/table-types"

export interface LogicGroupValidationMessages {
  nodeNameRequired: string
  nodeTypeRequired: string
  duplicateChildName: (name: string) => string
  duplicateRootName: (name: string) => string
  nestedError: (parent: string, error: string) => string
}

const DEFAULT_VALIDATION_MESSAGES: LogicGroupValidationMessages = {
  nodeNameRequired: "Node name is required",
  nodeTypeRequired: "Node type is required",
  duplicateChildName: (name) => `Duplicate child node name: ${name}`,
  duplicateRootName: (name) => `Duplicate root node name: ${name}`,
  nestedError: (parent, error) => `${parent} > ${error}`,
}

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
export function validateUserLogicGroup(
  group: UserLogicGroup,
  messages: LogicGroupValidationMessages = DEFAULT_VALIDATION_MESSAGES,
): string[] {
  const errors: string[] = []

  if (!group.name || group.name.trim() === "") {
    errors.push(messages.nodeNameRequired)
  }

  if (!group.type) {
    errors.push(messages.nodeTypeRequired)
  }

  if (group.children && group.children.length > 0) {
    const childNames = new Set<string>()
    group.children.forEach((child) => {
      if (childNames.has(child.name)) {
        errors.push(messages.duplicateChildName(child.name))
      }
      childNames.add(child.name)

      const childErrors = validateUserLogicGroup(child, messages)
      errors.push(...childErrors.map((error) => messages.nestedError(group.name, error)))
    })
  }

  return errors
}

/**
 * 验证整个UserLogicGroup数组
 */
export function validateUserLogicGroups(
  groups: UserLogicGroup[],
  messages: LogicGroupValidationMessages = DEFAULT_VALIDATION_MESSAGES,
): string[] {
  const errors: string[] = []
  const rootNames = new Set<string>()

  groups.forEach((group) => {
    if (rootNames.has(group.name)) {
      errors.push(messages.duplicateRootName(group.name))
    }
    rootNames.add(group.name)

    const groupErrors = validateUserLogicGroup(group, messages)
    errors.push(...groupErrors)
  })

  return errors
}
