// credentialsNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/components/graph/interface";

/**
 * CredentialsNode
 * 表示凭据节点
 */
export interface CredentialsNode {
  /** 元素 ID (唯一标识) */
  ElementId: string;

  /** 启动时间 (ISO 8601 字符串) */
  BootTime: string;

  /** 代理 ID */
  AgentID: string;

  /** 记录时间 (ISO 8601 字符串) */
  Time: string;

  /** 凭据类型 */
  CredType: number;

  /** 凭据描述 */
  CredDesc: string;

  /** 对象哈希 */
  ObjHash: string;
}

/** credentialsNode 节点配置 */
const credentialsNodeConfig: NodeConfig<CredentialsNode> = {
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
  getLabel: (data) => data.CredDesc,
  getImage: () => "/icons/nodes/credentials-node.svg",
};

export default credentialsNodeConfig;
