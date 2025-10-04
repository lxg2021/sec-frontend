// DnsNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/components/graph/interface";
import netNodeConfig from "./NetNodeConfig";

/**
 * DnsNode
 * 表示 DNS 节点
 */
export interface DnsNode {
  /** 元素 ID (唯一标识) */
  ElementId: string;

  /** 启动时间 (ISO 8601 字符串) */
  BootTime: string;

  /** 代理 ID */
  AgentID: string;

  /** 记录时间 (ISO 8601 字符串) */
  Time: string;

  /** 进程 GUID */
  ProcessGuid: string;

  /** 域名 */
  Domain: string;

  /** IP 地址列表 */
  IPS: string[];

  /** 唯一 ID */
  UniqueID: string;

  /** 对象哈希 */
  ObjHash: string;
}



/** dns 节点配置 */
const dnsNodeConfig: NodeConfig<DnsNode> = {
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
  getLabel: (data) => data.Domain,
  getImage: () => "/icons/nodes/dns-node.svg",
};

export default dnsNodeConfig;
