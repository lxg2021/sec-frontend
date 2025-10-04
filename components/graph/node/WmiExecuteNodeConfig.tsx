// wmiExecuteNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/components/graph/interface";

/**
 * ParameterItem
 * 表示一个参数项
 */
export interface ParameterItem {
  /** 参数名 */
  ParameterName: string;

  /** 参数值 */
  ParameterValue: string;
}

/**
 * WmiExecuteNode
 * 表示 WMI 执行节点
 */
export interface WmiExecuteNode {
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

  /** WMI 类名 */
  ClassName: string;

  /** 方法名 */
  MethodName: string;

  /** 参数列表 */
  Parameters: ParameterItem[];

  /** 唯一 ID */
  UniqueID: string;
}

/** wmiExecuteNode 节点配置 */
const wmiExecuteNodeConfig: NodeConfig<WmiExecuteNode> = {
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
  getLabel: (data) => "WmiExecute",
  getImage: () => "/icons/nodes/wmi-execute-node.svg",
};

export default wmiExecuteNodeConfig;
