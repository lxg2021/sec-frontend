import type { UserLogicGroup } from "@/lib/computer/ui-asset-data"
import type { RawLogicGroupNode } from "@/lib/computer/logic-group-uploader-props"

/**
 * 解析YAML格式的逻辑组文件
 */
export function parseLogicGroupFile(content: string): UserLogicGroup[] {
  try {
    // 使用简单的YAML解析（支持基本的YAML格式）
    const data = parseYAML(content)

    if (!Array.isArray(data)) {
      throw new Error("文件格式错误：根节点必须是数组")
    }

    // 验证并转换数据
    const groups: UserLogicGroup[] = []
    let idCounter = 1

    function processNode(node: RawLogicGroupNode, parentId?: string, parentPath = ""): UserLogicGroup {
      // 验证必填字段
      if (!node.name || typeof node.name !== "string") {
        throw new Error("缺少必填字段：name")
      }

      if (!node.type || !["company", "department", "group"].includes(node.type)) {
        throw new Error(`无效的类型：${node.type}，必须是 company、department 或 group`)
      }

      // 生成ID和路径
      const id = `${node.type}-${idCounter++}`
      const path = parentPath ? `${parentPath}/${node.name}` : node.name

      // 创建节点
      const group: UserLogicGroup = {
        id,
        name: node.name,
        path,
        type: node.type,
        parentId,
      }

      // 处理子节点
      if (node.children && Array.isArray(node.children)) {
        group.children = node.children.map((child) => processNode(child, id, path))
      }

      return group
    }

    // 处理所有根节点
    for (const node of data) {
      groups.push(processNode(node))
    }

    return groups
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`解析失败：${error.message}`)
    }
    throw new Error("解析失败：未知错误")
  }
}

/**
 * 简单的YAML解析器（支持基本的YAML格式）
 */
function parseYAML(content: string): RawLogicGroupNode[] {
  const lines = content.split("\n").filter((line) => line.trim() && !line.trim().startsWith("#"))

  const result: RawLogicGroupNode[] = []
  const stack: { indent: number; node: RawLogicGroupNode | RawLogicGroupNode[] }[] = [{ indent: -1, node: result }]

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const indent = line.search(/\S/)
    const trimmed = line.trim()

    // 跳过空行和注释
    if (!trimmed || trimmed.startsWith("#")) continue

    // 处理数组项
    if (trimmed.startsWith("- ")) {
      const content = trimmed.substring(2).trim()

      // 弹出比当前缩进大的栈
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop()
      }

      const parent = stack[stack.length - 1].node

      if (content.includes(":")) {
        // 对象项
        const [key, value] = content.split(":").map((s) => s.trim())
        const newNode: RawLogicGroupNode = {
          name: "",
          type: "company",
        }

        if (key === "name") newNode.name = value
        else if (key === "type") newNode.type = value as "company" | "department" | "group"

        if (Array.isArray(parent)) {
          parent.push(newNode)
        }
        stack.push({ indent, node: newNode })
      }
    } else if (trimmed.includes(":")) {
      // 键值对
      const [key, value] = trimmed.split(":").map((s) => s.trim())

      // 弹出比当前缩进大的栈
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop()
      }

      const parent = stack[stack.length - 1].node

      if (!Array.isArray(parent)) {
        if (key === "name") parent.name = value
        else if (key === "type") parent.type = value as "company" | "department" | "group"
        else if (key === "children") {
          parent.children = []
          stack.push({ indent, node: parent.children })
        }
      }
    }
  }

  return result
}

/**
 * 生成YAML模板
 */
export function generateLogicGroupTemplate(): string {
  return `# 逻辑组织结构模板
# 支持三级结构：公司(company) > 部门(department) > 组(group)
# 必填字段：name（名称）、type（类型）

- name: 总公司
  type: company
  children:
    - name: IT部
      type: department
      children:
        - name: 服务器组
          type: group
        - name: 网络组
          type: group
        - name: 安全组
          type: group
    - name: 财务部
      type: department
      children:
        - name: 会计组
          type: group
        - name: 审计组
          type: group
    - name: 人力资源部
      type: department
      children:
        - name: 招聘组
          type: group
        - name: 培训组
          type: group

- name: 分公司A
  type: company
  children:
    - name: 技术部
      type: department
      children:
        - name: 开发组
          type: group
        - name: 测试组
          type: group
    - name: 运营部
      type: department
      children:
        - name: 市场组
          type: group
        - name: 客服组
          type: group
`
}
