export interface UserInfo {
  name: string
  phone: string
  email: string
  department: string
}

/**
 * 单台主机资产信息
 */
export interface AssetData {
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

/**
 * 整个资产文件的数据结构
 */
export interface AssetFileData {
  /** 源资产数据数组 */
  source_data: AssetData[]
}

import type { UserLogicGroup } from "@/lib/computer/user-logic-groups"


/**
 * UserInfoTable组件的Props接口
 */
export interface UserInfoTableProps {
  /** 资产数据列表 */
  assets: AssetData[]

  /** 用户信息映射（以host_id为key） */
  userInfos: Record<string, UserInfo>

  /** 错误信息映射 */
  errors: Record<string, Record<string, string>>

  /** 用户逻辑组数据（公司/部门/组） */
  userLogicGroups: UserLogicGroup[]

  /** 用户信息变更回调 */
  onUserInfoChange: (hostId: string, field: keyof UserInfo, value: string) => void

  /** 字段失焦回调（用于验证） */
  onFieldBlur: (hostId: string, field: keyof UserInfo, value: string) => void

  /** 保存回调 */
  onSave: () => void
}
