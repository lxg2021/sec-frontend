/**
 * 单台主机资产信息
 */
export interface UiAssetData {
  /** 主机唯一标识 */
  host_id: string

  /** 主机名 */
  host_name: string

  /** 主机IP列表 */
  ip: string[]

  /** 操作系统名称 */
  os_name: string

  /** 操作系统版本 */
  os_version: string

  /** 产品ID或资产编号 */
  product_id?: string

  /** CPU序列号 */
  cpu_id: string

  /** 硬盘ID列表（支持多块硬盘） */
  harddisk_id: string[]

  /** 主板序列号 */
  board_serial: string

  /** MAC地址列表 */
  macs: string[]

  /** 所属部门路径（例如 "总公司/IT部/服务器组"） */
  department_path?: string

  /** 负责人姓名 */
  owner_name?: string

  /** 负责人角色（如 管理员、运维人员等） */
  owner_role?: string

  /** 联系电话 */
  phone?: string

  /** 邮箱地址 */
  email?: string
}

export interface UserInfo {
  name: string
  phone: string
  email: string
  department: string
}