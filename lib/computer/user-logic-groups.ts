/**
 * 用户逻辑组（公司/部门/组）的数据结构
 */
export interface UserLogicGroup {
  /** 唯一标识 */
  id: string
  /** 显示名称 */
  name: string
  /** 完整路径（例如：总公司/IT部/服务器组） */
  path: string
  /** 层级类型 */
  type: "company" | "department" | "group"
  /** 父级ID */
  parentId?: string
  /** 子级列表 */
  children?: UserLogicGroup[]
}

/**
 * 模拟的用户逻辑组数据
 */
export const mockUserLogicGroups: UserLogicGroup[] = [
  {
    id: "company-1",
    name: "总公司",
    path: "总公司",
    type: "company",
    children: [
      {
        id: "dept-1-1",
        name: "IT部",
        path: "总公司/IT部",
        type: "department",
        parentId: "company-1",
        children: [
          {
            id: "group-1-1-1",
            name: "服务器组",
            path: "总公司/IT部/服务器组",
            type: "group",
            parentId: "dept-1-1",
          },
          {
            id: "group-1-1-2",
            name: "网络组",
            path: "总公司/IT部/网络组",
            type: "group",
            parentId: "dept-1-1",
          },
          {
            id: "group-1-1-3",
            name: "安全组",
            path: "总公司/IT部/安全组",
            type: "group",
            parentId: "dept-1-1",
          },
        ],
      },
      {
        id: "dept-1-2",
        name: "财务部",
        path: "总公司/财务部",
        type: "department",
        parentId: "company-1",
        children: [
          {
            id: "group-1-2-1",
            name: "会计组",
            path: "总公司/财务部/会计组",
            type: "group",
            parentId: "dept-1-2",
          },
          {
            id: "group-1-2-2",
            name: "审计组",
            path: "总公司/财务部/审计组",
            type: "group",
            parentId: "dept-1-2",
          },
        ],
      },
      {
        id: "dept-1-3",
        name: "人力资源部",
        path: "总公司/人力资源部",
        type: "department",
        parentId: "company-1",
        children: [
          {
            id: "group-1-3-1",
            name: "招聘组",
            path: "总公司/人力资源部/招聘组",
            type: "group",
            parentId: "dept-1-3",
          },
          {
            id: "group-1-3-2",
            name: "培训组",
            path: "总公司/人力资源部/培训组",
            type: "group",
            parentId: "dept-1-3",
          },
        ],
      },
    ],
  },
  {
    id: "company-2",
    name: "分公司A",
    path: "分公司A",
    type: "company",
    children: [
      {
        id: "dept-2-1",
        name: "技术部",
        path: "分公司A/技术部",
        type: "department",
        parentId: "company-2",
        children: [
          {
            id: "group-2-1-1",
            name: "开发组",
            path: "分公司A/技术部/开发组",
            type: "group",
            parentId: "dept-2-1",
          },
          {
            id: "group-2-1-2",
            name: "测试组",
            path: "分公司A/技术部/测试组",
            type: "group",
            parentId: "dept-2-1",
          },
        ],
      },
      {
        id: "dept-2-2",
        name: "运营部",
        path: "分公司A/运营部",
        type: "department",
        parentId: "company-2",
        children: [
          {
            id: "group-2-2-1",
            name: "市场组",
            path: "分公司A/运营部/市场组",
            type: "group",
            parentId: "dept-2-2",
          },
          {
            id: "group-2-2-2",
            name: "客服组",
            path: "分公司A/运营部/客服组",
            type: "group",
            parentId: "dept-2-2",
          },
        ],
      },
    ],
  },
]

/**
 * 将层级结构扁平化为路径列表
 */
export function flattenUserLogicGroups(groups: UserLogicGroup[]): string[] {
  const paths: string[] = []

  function traverse(group: UserLogicGroup) {
    paths.push(group.path)
    if (group.children) {
      group.children.forEach(traverse)
    }
  }

  groups.forEach(traverse)
  return paths
}
