export type OwnerRole = "admin" | "auditor" | "operator"
export type LogicGroupType = "company" | "department" | "group"

export interface LogicGroupUploaderTexts {
  title?: string
  description?: string
  dragDropText?: string
  dragDropHint?: string
  uploadingText?: string
  successText?: string
  errorText?: string
  retryButtonText?: string
  resetButtonText?: string
  downloadTemplateText?: string
}

export interface CollectionOwner {
  username: string
  role: OwnerRole
  phone?: string
  email?: string
}

export interface CollectionLogicGroupNode {
  id?: string
  name: string
  description?: string
  children?: CollectionLogicGroupNode[]
}

export interface UserLogicGroup {
  id: string
  name: string
  path: string
  type: LogicGroupType
  parentId?: string
  children?: UserLogicGroup[]
}

export interface BackendLogicGroupCreateData {
  id: string
  parent_id?: string
  name: string
  full_path: string
  full_path_ids: string[]
  company_name: string
  department_name?: string
  description?: string
}

export interface UiAssetData {
  agent_id: string
  hostname: string
  ip: string[]
  os_type: "unknown" | "windows" | "linux" | "macOs" | string
  os_name: string
  os_version: string
  product_id: string
  cpu_id: string
  harddisk_id: string[]
  board_serial: string
  macs: string[]
  department_path?: string
  group_id?: string
  owner?: CollectionOwner
}

export interface UserInfo {
  name: string
  role: OwnerRole
  phone: string
  email: string
  department: string
}

export interface CollectionImportData {
  tenant_id: string
  logic_groups: UserLogicGroup[]
  hosts: UiAssetData[]
  submitter?: {
    name?: string
    phone?: string
    email?: string
    company?: string
    remark?: string
  }
  metadata?: Record<string, string>
}

export interface RegisterAgentPayload {
  request_id: string
  agent_id: string
  hostname: string
  ip: string[]
  os_type: string
  os_name: string
  os_version: string
  product_id: string
  cpu_id: string
  board_serial: string
  harddisk_id: string[]
  macs: string[]
  group_id?: string
  status?: string
  owner?: {
    agent_id: string
    username: string
    phone?: string
    email?: string
    role: OwnerRole
  }
  tenant_id?: string
  timestamp: number
}

export interface LogicGroupUploaderProps {
  onGroupsUploaded: (groups: UserLogicGroup[], fileName: string) => void
  onBeforeUpload?: (file: File) => Promise<boolean> | boolean
  disabled?: boolean
  texts?: LogicGroupUploaderTexts
  showFrame?: boolean
}
