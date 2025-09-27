// agentNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/components/graph/interface";

/**
 * AgentNode
 * 表示一个代理节点
 */
export interface AgentNode {
  /** 元素 ID (唯一标识) */
  ElementId: string;

  /** 代理 ID */
  AgentID: string;

  /** 记录时间 (ISO 8601 字符串) */
  Time: string;

  /** 域名 */
  Domain: string;

  /** 计算机名 */
  ComputerName: string;

  /** IP 地址列表 */
  IPS: string[];

  /** 唯一 ID */
  UniqueID: string;
}


interface NodeData {
  label: string;
}

/** agentNode 节点配置 */
const agentNodeConfig: NodeConfig<NodeData> = {
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
  getImage: () => "/icons/nodes/agent-node.svg",
};

export default agentNodeConfig;
