// wmiConsumerNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/components/graph/interface";

/**
 * WmiConsumerNode
 * 表示 WMI 事件消费者节点
 */
export interface WmiConsumerNode {
  /** 元素 ID (唯一标识) */
  ElementId: string;

  /** 启动时间 (ISO 8601 字符串) */
  BootTime: string;

  /** 代理 ID */
  AgentID: string;

  /** 记录时间 (ISO 8601 字符串) */
  Time: string;

  /** 服务器名 */
  ServerName: string;

  /** 用户名 */
  User: string;

  /** 命名空间 */
  Namespace: string;

  /** 类名 */
  ClassName: string;

  /** 事件消费者名称 */
  EventConsumerName: string;

  /** 事件消费者类型 */
  EventConsumerType: number;

  /** 事件消费者上下文 */
  EventConsumerContext: unknown;

  /** 唯一标识 ID */
  UniqueID: string;
}


/** wmiConsumerNode 节点配置 */
const wmiConsumerNodeConfig: NodeConfig<WmiConsumerNode> = {
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
  getLabel: (data) => data.EventConsumerName,
  getImage: () => "/icons/nodes/wmi-consumer-node.svg",
};

export default wmiConsumerNodeConfig;
