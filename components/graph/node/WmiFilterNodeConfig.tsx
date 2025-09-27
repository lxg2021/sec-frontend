// wmiFilterNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/components/graph/interface";

/**
 * WmiFilterNode
 * 表示 WMI 事件过滤器节点
 */
export interface WmiFilterNode {
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

  /** 用户 */
  User: string;

  /** WMI 命名空间 */
  Namespace: string;

  /** 事件过滤器名称 */
  EventFilterName: string;

  /** 事件过滤器访问权限 */
  EventFilterAccess: string;

  /** 事件过滤器类 */
  EventFilterClass: string;

  /** WMI 查询 */
  Query: string;

  /** 查询语言 */
  QueryLanguage: string;

  /** 唯一 ID */
  UniqueID: string;
}


interface NodeData {
  label: string;
}

/** wmiFilterNode 节点配置 */
const wmiFilterNodeConfig: NodeConfig<NodeData> = {
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
  getImage: () => "/icons/nodes/wmi-filter-node.svg",
};

export default wmiFilterNodeConfig;
