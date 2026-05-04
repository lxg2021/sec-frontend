import type { IPatchItem, HostPatchInfo } from "./patch"

/**
 * 选中列表中的单个补丁项
 */
export interface SelectedPatchItem {
  /** 补丁信息（不需要特别全，最少要能展示标题、KB ID、严重等级等） */
  patch: Pick<IPatchItem, "patchGuid" | "title" | "kbArticleIds" | "securityLevel" | "osPlatform">

  /** 被选中的主机列表（只包含待安装的主机） */
  selectedHosts: HostPatchInfo[]
}

/**
 * 选中池（用于最终下发任务）
 */
export interface SelectedPatchPool {
  /** 选中的补丁数量 */
  totalPatches: number

  /** 选中的主机总数（去重计数，避免同一主机在不同补丁下重复统计） */
  totalHosts: number

  /** 具体的选中项列表 */
  items: SelectedPatchItem[]
}
