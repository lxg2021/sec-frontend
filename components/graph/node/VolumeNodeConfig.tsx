// VolumeNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/components/graph/interface";
import dnsNodeConfig from "./DnsNodeConfig";

/**
 * VolumeNode
 * 表示卷节点
 */
export interface VolumeNode {
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

  /** 文件名 */
  FileName: string;

  /** 驱动类型 */
  DriverType: number;

  /** 访问类型 */
  AccessType: number;

  /** 唯一 ID */
  UniqueID: string;

  /** 对象哈希 */
  ObjHash: string;
}


/** volume 节点配置 */
const volumeNodeConfig: NodeConfig<VolumeNode> = {
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
  getLabel: (data) => data.FileName,
  getImage: () => "/icons/nodes/volume-node.svg",
};

export default volumeNodeConfig;
