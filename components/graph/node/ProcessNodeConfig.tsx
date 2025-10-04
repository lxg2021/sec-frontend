import type { NodeConfig } from "@/components/graph/interface";
import { getProcessNodeMenu } from "@/components/graph/menu/processNodeMenu"

/**
 * ProcessNode
 * 表示一个进程节点
 */
export interface ProcessNode {

  /** 元素 GraphID  */
  ElementId: string;

  /** 启动时间 (ISO 8601 字符串) */
  BootTime: string;

  /** 代理 ID */
  AgentID: string;

  /** 节点时间 (ISO 8601 字符串) */
  Time: string;

  /** 用户 ID */
  UserID: string;

  /** 会话号 */
  Session: number;

  /** 进程 ID */
  ProcessID: number;

  /** 进程名 */
  ProcessName: string;

  /** 进程映像路径 */
  ProcessImage: string;

  /** 进程命令行 */
  ProcessCommandLine: string;

  /** 进程 MD5 */
  ProcessMD5: string;

  /** 进程 GUID */
  ProcessGuid: string;

  /** 父进程 ID */
  ParentProcessID: number;

  /** 父进程映像路径 */
  ParentProcessImage: string;

  /** 父进程命令行 */
  ParentProcessCommandLine: string;

  /** 父进程 MD5 */
  ParentProcessMD5: string;

  /** 父进程 GUID */
  ParentProcessGuid: string;

  /** 原始文件名 */
  OrgFileName: string;

  /** 驱动类型 */
  DriverType: number;

  /** 签名标记 */
  Signature: number;

  /** 签名厂商 */
  SignVendor: string;

  /** RTLO 标记 */
  RTLO: number;

  /** ShowWindowFlag */
  ShowWindowFlag: number;

  /** 唯一 ID */
  UniqueID: string;
}

/** process 节点配置 */
export const processNodeConfig: NodeConfig<ProcessNode> = {
  getStyle: () => ({
    color: "#F1FBFC",
    width: 32,
    height: 32,
    textColor: "#000",
    borderColor: "transparent",
    borderWidth: 0,
    fontSize: 8,
    opacity: 1,
    shape: "square",
    hoverAnimation: true,
  }),
  getLabel: (data) => data.ProcessName,
  getImage: () => "/icons/nodes/process-node.svg",
  onMouseEnter: (data) => { },
  onRightClick: (data) => getProcessNodeMenu(data),
}

export default processNodeConfig
