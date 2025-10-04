// endecryptNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/components/graph/interface";

/**
 * EnDecryptNode
 * 表示加解密操作节点
 */
export interface EnDecryptNode {
  /** 元素 ID (唯一标识) */
  ElementId: string;

  /** 启动时间 (ISO 8601 字符串) */
  BootTime: string;

  /** 代理 ID */
  AgentID: string;

  /** 记录时间 (ISO 8601 字符串) */
  Time: string;

  /** 加密/解密标志 */
  CryptFlag: number;

  /** 加密/解密标志描述 */
  CryptFlagDescription: string;

  /** 唯一 ID */
  UniqueID: string;
}

/** endecryptNode 节点配置 */
const endecryptNodeConfig: NodeConfig<EnDecryptNode> = {
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
  getLabel: (data) => "EnDecrypt",
  getImage: () => "/icons/nodes/endecrypt-node.svg",
};

export default endecryptNodeConfig;
