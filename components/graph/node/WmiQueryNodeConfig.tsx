// wmiQueryNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/components/graph/interface";

/**
 * WmiQueryNode
 * 表示 WMI 查询节点
 */
export interface WmiQueryNode {
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

  /** WMI 查询语句 */
  Query: string;

  /** 查询语言 */
  QueryLanguage: string;

  /** 唯一 ID */
  UniqueID: string;
}

interface NodeData {
  label: string;
}

/** wmiQueryNode 节点配置 */
const wmiQueryNodeConfig: NodeConfig<NodeData> = {
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
  getImage: () => "/icons/nodes/wmi-query-node.svg",
};

export default wmiQueryNodeConfig;
