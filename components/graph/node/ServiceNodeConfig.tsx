// serviceNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/components/graph/interface";

/**
 * ServiceNode
 * 表示一个系统服务节点
 */
export interface ServiceNode {
  /** 元素 ID (唯一标识) */
  ElementId: string;

  /** 启动时间 (ISO 8601 字符串) */
  BootTime: string;

  /** 代理 ID */
  AgentID: string;

  /** 节点时间 (ISO 8601 字符串) */
  Time: string;

  /** 服务名称 */
  ServiceName: string;

  /** 显示名称 */
  DisplayName: string;

  /** 服务类型 */
  ServiceType: number;

  /** 启动类型 */
  StartType: number;

  /** 服务二进制文件 MD5 */
  ServiceBinaryMD5: string;

  /** 服务启动账户 */
  ServiceStartName: string;

  /** 服务二进制路径 (哈希可忽略) */
  ServiceBinaryPathName: string;

  /** 对象哈希 */
  ObjHash: string;
}


/** serviceNode 节点配置 */
const serviceNodeConfig: NodeConfig<ServiceNode> = {
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
  getLabel: (data) => data.ServiceName,
  getImage: () => "/icons/nodes/service-node.svg",
};

export default serviceNodeConfig;
