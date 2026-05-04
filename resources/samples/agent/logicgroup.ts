

export interface LogicGroup {
  id: string;                 // 主键 UUID
  parent_id: string | null;   // 父节点 ID，顶层公司为 null
  tenant_id?: string;         // 所属租户，可选
  name: string;               // 节点名称
  full_path: string;          // 完整路径，如 "AcmeCorp/安全部/终端组"
  full_path_ids: string[];    // 层级 ID 数组，如 ["1","2","3"]
  company_name: string;       // 冗余公司名称
  department_name?: string;   // 冗余部门名称，可选
  description?: string;       // 描述，可选
  created_by: string;         // 创建者用户 ID
  created_at: string;         // 创建时间 ISO 字符串
  updated_at: string;         // 更新时间 ISO 字符串
}