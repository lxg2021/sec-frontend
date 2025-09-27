// regKeyNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/components/graph/interface";

/**
 * RegKeyNode
 * 表示一个注册表键节点
 */
export interface RegKeyNode {
  /** 元素 ID (唯一标识) */
  ElementId: string;

  /** 启动时间 (ISO 8601 字符串) */
  BootTime: string;

  /** 代理 ID */
  AgentID: string;

  /** 节点时间 (ISO 8601 字符串) */
  Time: string;

  /** 注册表键名 */
  ObjectName: string;

  /** 描述信息 */
  Description: string;

  /** 分类信息 */
  Classification: string;

  /** 对象哈希 */
  ObjHash: string;
}

interface NodeData {
  label: string;
}

/** regKeyNode 节点配置 */
const regKeyNodeConfig: NodeConfig<NodeData> = {
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
  getImage: () => "/icons/nodes/reg-key-node.svg",
};

export default regKeyNodeConfig;
