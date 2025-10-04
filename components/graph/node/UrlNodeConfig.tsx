// urlNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/components/graph/interface";

/**
 * UrlNode
 * 表示 URL 节点
 */
export interface UrlNode {
  /** 元素 ID (唯一标识) */
  ElementId: string;

  /** 启动时间 (ISO 8601 字符串) */
  BootTime: string;

  /** 代理 ID */
  AgentID: string;

  /** 记录时间 (ISO 8601 字符串) */
  Time: string;

  /** URL 地址 */
  URL: string;

  /** 对象哈希 */
  ObjHash: string;
}


/** urlNode 节点配置 */
const urlNodeConfig: NodeConfig<UrlNode> = {
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
  getLabel: (data) => data.URL,
  getImage: () => "/icons/nodes/url-node.svg",
};

export default urlNodeConfig;
