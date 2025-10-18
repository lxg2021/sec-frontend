import type { AssetData } from "@/lib/computer/asset"

export interface UserInfoTableProps {
  /**
   * 上传文件解析得到的资产数据
   */
  assets: AssetData[]

  /**
   * 是否禁用交互（如保存中）
   */
  disabled?: boolean

  /**
   * 当所有用户信息填写并保存时触发，返回完整资产数据
   */
  onDataCompleted: (completedAssets: AssetData[]) => void
}
