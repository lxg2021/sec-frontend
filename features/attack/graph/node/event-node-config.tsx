// eventNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/features/attack/graph/interface";

/**
 * EventNode
 * 表示一个事件节点
 */
export interface EventNode {
  /** 元素 ID (唯一标识) */
  ElementId: string;

  /** 启动时间 (ISO 8601 字符串) */
  BootTime: string;

  /** 代理 ID */
  AgentID: string;

  /** 记录时间 (ISO 8601 字符串) */
  Time: string;

  /** 事件名称 */
  EventName: string;

  /** 对象哈希 */
  ObjHash: string;
}


/** eventNode 节点配置 */
const eventNodeConfig: NodeConfig<EventNode> = {
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
  getLabel: (data) => data.EventName,
  getImage: () => "/icons/nodes/event-node.svg",
};

export default eventNodeConfig;
