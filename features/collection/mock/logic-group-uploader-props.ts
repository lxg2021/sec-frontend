import { UserLogicGroup } from "@/features/collection/types"

export interface LogicGroupUploaderProps {
  /** 上传成功后的回调，返回解析后的逻辑组数据 */
  onGroupsUploaded: (groups: UserLogicGroup[], fileName: string) => void

  /** 上传前的验证回调（可选） */
  onBeforeUpload?: (file: File) => Promise<boolean> | boolean

  /** 是否禁用上传 */
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

/** YAML文件中的原始数据结构 */
export interface RawLogicGroupNode {
  name: string
  type: "company" | "department" | "group"
  children?: RawLogicGroupNode[]
}
