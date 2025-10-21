/**
 * 主机状态类型
 * @typedef {"online" | "offline" | "inactive"} HostStatus
 */
export type HostStatus = "online" | "offline"

/**
 * 逻辑组接口
 */
export interface LogicGroup {
  /** 组织节点id */
  id: string
  /** 父节点 ID（NULL 表示顶层公司） */
  parent_id?: string | null
  /** 所属租户（可选） */
  tenant_id?: string | null
  /** 节点名称 */
  name: string
  /** 完整路径，例如：AcmeCorp/安全部/终端组 */
  full_path: string
  /** 层级 ID 数组（JSON），用于快速过滤，例如 ["1","2","3"] */
  full_path_ids?: string[] | null
  /** 冗余字段：公司名称 */
  company_name: string
  /** 冗余字段：部门名称 */
  department_name?: string | null
  /** 描述 */
  description?: string | null
  /** 创建者用户 ID */
  created_by: string
  /** 创建时间（ISO 字符串） */
  created_at: string
  /** 更新时间（ISO 字符串） */
  updated_at: string
}

/**
 * 主机负责人接口
 */
export interface HostOwner {
  /** 主机 ID */
  host_id: string
  /** 用户唯一 ID */
  user_id: string
  /** 用户名 */
  owner_name: string
  /** 电话（可选） */
  phone?: string | null
  /** 邮箱（可选） */
  email?: string | null
  /** 角色（管理员/使用者，可选） */
  owner_role?: string | null
  /** 分配时间（ISO 时间字符串） */
  assigned_at: string
  /** 到期时间（可选） */
  expired_at?: string | null
}

/**
 * 主机接口
 */
export interface Host {
  /** 主机唯一 ID (UUID) */
  host_id: string
  /** 主机名 */
  hostname: string
  /** IP 地址列表 */
  ip: string[]
  /** 操作系统 */
  os_name: string
  /** 系统版本 */
  os_version: string
  /** 系统产品 ID */
  product_id: string
  /** CPU ID */
  cpu_id: string
  /** 硬盘 ID 列表（JSON 数组） */
  harddisk_id: string[]
  /** 主板序列号 */
  board_serial: string
  /** MAC 地址列表（JSON 数组） */
  macs: string[]
  /** 所属逻辑组对象（可为空） */
  group?: LogicGroup | null
  /** 所属用户对象（可为空） */
  owner?: HostOwner | null
  /** 最近心跳时间（ISO 字符串，如 "2025-10-20T10:00:00Z"） */
  heartbeat_time: string
  /** 主机状态 */
  status: HostStatus
}

/**
 * 主机筛选选项接口
 */
export interface HostFilterOptions {
  status?: HostStatus[]
  groupIds?: string[]
  ownerIds?: string[]
  ungrouped?: boolean
  unowned?: boolean
  searchText?: string
}
