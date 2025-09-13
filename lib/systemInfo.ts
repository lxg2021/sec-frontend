/**
 * 主机状态枚举
 */
export enum AgentStatus {
  /** 主机在线 */
  Online = "online",
  /** 主机离线 */
  Offline = "offline"
}

/* 系统类型 */
export enum SystemType {
  WINDOWS = "windows",
  MACOS = "macos",
  LINUX = "linux",
}


/**
 * 系统基础信息（包含硬件和软件）
 */
export interface AgentInfo {
  /** 主机ID */
  hostId: string;

  /** 主机名，例如 "MY-PC" */
  hostname: string;
  
  /** 系统类型 */
  osType: SystemType;

  /** 主机状态 */
  status: AgentStatus;

  /** 企业名称 */
  company?: string;

  /** 部门名称 */
  department?: string;

  /** 组名称 */
  group?: string;

  /** 操作系统名称，例如 "Windows 10 Pro" 或 "Ubuntu" */
  osName: string;

  /** 操作系统版本，例如 "10.0.19045" 或 "22.04 LTS" */
  osVersion: string;

  /** 产品ID，例如 Windows Product ID 或 Linux 发行版 ID */
  productId?: string;

  /** 操作系统架构，例如 "x86_64"、"arm64" */
  architecture: string;

  /** 系统安装日期（ISO 格式，YYYY-MM-DD） */
  installDate?: string;

  /** 系统是否已激活（Windows 特有，Linux 可忽略） */
  activated?: boolean;

  /** 系统构建号，例如 Windows "19045"，或 Linux 内核构建版本 */
  buildNumber?: string;

  /** 内核版本，例如 "5.15.0-107-generic" 或 "10.0.19045" */
  kernelVersion?: string;

  /** 系统序列号（部分操作系统可获取） */
  serialNumber?: string;

  /** 设备厂商，例如 "Dell"、"ASUSTeK COMPUTER INC." */
  manufacturer?: string;

  /** 设备型号，例如 "XPS 15 9500"、"PRIME Z490-A" */
  model?: string;
}