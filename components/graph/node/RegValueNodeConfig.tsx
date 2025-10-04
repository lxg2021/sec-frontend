// regValueNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/components/graph/interface";

/**
 * RegValueNode
 * 表示一个注册表值节点
 */
export interface RegValueNode {
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

  /** 注册表值 (原始值，哈希可忽略) */
  ObjectValue: string;

  /** 描述信息 */
  Description: string;

  /** 分类信息 */
  Classification: string;

  /** 对象哈希 */
  ObjHash: string;
}


/** regValueNode 节点配置 */
const regValueNodeConfig: NodeConfig<RegValueNode> = {
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
  getLabel: (data) => data.ObjectName,
  getImage: () => "/icons/nodes/reg-value-node.svg",
};

export default regValueNodeConfig;
