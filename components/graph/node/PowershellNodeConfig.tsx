// powershellNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/components/graph/interface";

/**
 * PowershellNode
 * 表示 PowerShell 执行节点
 */
export interface PowershellNode {
  /** 元素 ID (唯一标识) */
  ElementId: string;

  /** 启动时间 (ISO 8601 字符串) */
  BootTime: string;

  /** 代理 ID */
  AgentID: string;

  /** 节点时间 (ISO 8601 字符串) */
  Time: string;

  /** 执行命令行 */
  ProcessCommandLine: string;

  /** 文件名 */
  FileName: string;

  /** 会话 ID */
  SessionID: number;

  /** PowerShell 内容 */
  Content: string;

  /** 唯一 ID */
  UniqueID: string;
}


interface NodeData {
  label: string;
}

/** powershellNode 节点配置 */
const powershellNodeConfig: NodeConfig<NodeData> = {
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
  getLabel: (data) => data.label,
  getImage: () => "/icons/nodes/powershell-node.svg",
};

export default powershellNodeConfig;
