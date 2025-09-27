// messageNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/components/graph/interface";

/**
 * MessageNode
 * 表示消息钩子节点
 */
export interface MessageNode {
  /** 元素 ID (唯一标识) */
  ElementId: string;

  /** 启动时间 (ISO 8601 字符串) */
  BootTime: string;

  /** 代理 ID */
  AgentID: string;

  /** 节点时间 (ISO 8601 字符串) */
  Time: string;

  /** 钩子类型 */
  HookType: number;

  /** 钩子类型描述 */
  HookTypeDescription: string;

  /** 消息钩子模块 */
  MessageHookModule: string;

  /** 对象哈希 */
  ObjHash: string;
}


interface NodeData {
  label: string;
}

/** message 节点配置 */
const messageNodeConfig: NodeConfig<NodeData> = {
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
  getImage: () => "/icons/nodes/message-node.svg",
};

export default messageNodeConfig;
