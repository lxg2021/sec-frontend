import { UiAssetData } from "@/features/collection/types"

export interface FileUploaderProps {
  /** 上传成功后的回调（必填） */
  onFileUploaded: (data: UiAssetData[], fileName: string) => void

  /** 上传前验证回调（可选），返回false则阻止上传 */
  onBeforeUpload?: (file: File) => Promise<boolean> | boolean

  /** 自定义模板文件内容（点击"下载模板"时） */
  templateData?: object

  /** 模板文件名（默认 asset-template.json） */
  templateFileName?: string

  /** 限制文件类型（默认 [".json"]） */
  accept?: string[]

  /** 接受文件类型的显示文本（默认 "JSON 格式文件"） */
  acceptDisplay?: string

  /** 是否禁用上传交互 */
  disabled?: boolean

  /** 自定义文本内容 */
  texts?: {
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
}

export const defaultTemplateData = {
  source_data: [
    {
      host_id: "HOST-001",
      host_name: "server-01",
      ip: ["192.168.1.100", "10.0.0.100"],
      os_name: "Ubuntu",
      os_version: "20.04 LTS",
      product_id: "PROD-2024-001",
      cpu_id: "BFEBFBFF000906E9",
      harddisk_id: ["WD-WCC4E0123456", "ST2000DM001-ABC123"],
      board_serial: "L1HF65J00X9",
      macs: ["00:1B:44:11:3A:B7", "00:1B:44:11:3A:B8"],
      department_path: "总公司/IT部/服务器组",
      owner_name: "张三",
      owner_role: "系统管理员",
      phone: "13800138000",
      email: "zhangsan/example.com",
    },
    {
      host_id: "HOST-002",
      host_name: "server-02",
      ip: ["192.168.1.101"],
      os_name: "CentOS",
      os_version: "7.9",
      cpu_id: "BFEBFBFF000906EA",
      harddisk_id: ["ST1000DM003-XYZ789"],
      board_serial: "L1HF65J00Y0",
      macs: ["00:1B:44:11:3A:C7"],
      department_path: "总公司/IT部/开发组",
      owner_name: "李四",
      owner_role: "开发工程师",
      phone: "13900139000",
      email: "lisi/example.com",
    },
  ],
}
