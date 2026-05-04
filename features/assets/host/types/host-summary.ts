// hostSummary.ts

import { SystemType, AgentStatus } from "./systemInfo"

/**
 * 主机统计信息接口
 */
export interface HostSummary {
  /** 总主机数 */
  total: number;
  /** 在线主机数 */
  online: number;
  /** 离线主机数 */
  offline: number;
  /** 每种操作系统类型的主机数量 */
  osTypeCount: Record<SystemType, number>;
  /** 各公司主机数量统计 */
  companyCount: Record<string, number>;
}

