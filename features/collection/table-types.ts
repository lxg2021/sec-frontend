/**
 * 逻辑组接口
 * 表示公司、部门或组等组织结构节点
 */
export interface TableLogicGroup {
  /** 唯一标识，每条记录全局唯一，建议使用 UUID */
  id: string

  /** 父节点 ID，顶层公司为 null */
  parent_id: string | null

  /** 所属租户，可选 */
  tenant_id?: string

  /** 节点名称 */
  name: string

  /** 完整路径，如 "AcmeCorp/安全部/终端组" */
  full_path: string

  /** 层级 ID 数组，如 ["1","2","3"] */
  full_path_ids: string[]

  /** 冗余公司名称 */
  company_name: string

  /** 冗余部门名称，可选 */
  department_name?: string

  /** 描述，可选 */
  description?: string

  /** 创建者用户 ID */
  created_by: string

  /** 创建时间 ISO 字符串 */
  created_at: string

  /** 更新时间 ISO 字符串 */
  updated_at: string
}

/**
 * 主机心跳接口
 * 表示主机的实时心跳信息和基本硬件/网络信息
 */
export interface HostHeartbeat {
  /** 主机唯一 ID */
  host_id: string

  /** 主机名 */
  hostname: string

  /** IP 地址 */
  ip: string

  /** 操作系统 */
  os_name: string

  /** 系统版本 */
  os_version: string

  /** 系统产品 ID */
  product_id: string

  /** CPU ID */
  cpu_id: string

  /** 硬盘 ID 列表 */
  harddisk_id: string[]

  /** 主板序列号 */
  board_serial: string

  /** MAC 地址列表 */
  macs: string[]

  /** 当前所属逻辑组 ID */
  group_id: string

  /** 最近心跳时间 ISO 字符串 */
  heartbeat_time: string

  /** 主机状态枚举，可选值: 'online' | 'offline' | 'inactive' */
  status: 'online' | 'offline' | 'inactive'
}


/**
 * 主机负责人接口
 * 表示某台主机的负责人信息
 */
export interface HostOwner {
  /** 主机 ID */
  host_id: string

  /** 用户唯一 ID */
  user_id: string

  /** 用户名 */
  username: string

  /** 电话，可选 */
  phone?: string

  /** 邮箱，可选 */
  email?: string

  /** 角色，可选，如管理员/使用者 */
  role?: string

  /** 分配时间 ISO 字符串 */
  assigned_at: string

  /** 到期时间 ISO 字符串，可选 */
  expired_at?: string
}
