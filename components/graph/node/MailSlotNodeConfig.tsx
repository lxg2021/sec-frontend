// mailSlotNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/components/graph/interface";

/**
 * MailSlotNode
 * 表示一个邮件槽节点
 */
export interface MailSlotNode {
  /** 元素 ID (唯一标识) */
  ElementId: string;

  /** 启动时间 (ISO 8601 字符串) */
  BootTime: string;

  /** 代理 ID */
  AgentID: string;

  /** 节点时间 (ISO 8601 字符串) */
  Time: string;

  /** 邮件槽名称 */
  MailSlotName: string;

  /** 对象哈希 */
  ObjHash: string;
}

interface NodeData {
  label: string;
}   

/** mailSlot 节点配置 */
const mailSlotNodeConfig: NodeConfig<NodeData> = {
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
  getImage: () => "/icons/nodes/mail-slot-node.svg",
};

export default mailSlotNodeConfig;
