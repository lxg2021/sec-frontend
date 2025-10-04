// NetNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/components/graph/interface";

/**
 * NetNode
 * 表示网络连接节点
 */
export interface NetNode {
  /** 元素 ID (唯一标识) */
  ElementId: string;

  /** 进程 GUID */
  ProcessGuid: string;

  /** 代理 ID */
  AgentID: string;

  /** 节点时间 (ISO 8601 字符串) */
  Time: string;

  /** 启动时间 (ISO 8601 字符串) */
  BootTime: string;

  /** 协议 */
  Protocol: string;

  /** 方向 */
  Direction: string;

  /** 源地址是否为 IPv6 */
  SourceIsIPv6: number;

  /** 源 IP 地址 */
  SourceIP: string;

  /** 源端口 */
  SourcePort: number;

  /** 目标地址是否为 IPv6 */
  DestinationIsIPv6: number;

  /** 目标 IP 地址 */
  DestinationIP: string;

  /** 目标端口 */
  DestinationPort: number;

  /** 序号 */
  Number: number;

  /** 唯一 ID */
  UniqueID: string;

  /** 对象哈希 */
  ObjHash: string;
}

/** net 节点配置 */
const netNodeConfig: NodeConfig<NetNode> = {
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
  getLabel: (data) => `${data.SourceIP}-${data.DestinationIP}`,
  getImage: () => "/icons/nodes/net-node.svg",
};

export default netNodeConfig;
