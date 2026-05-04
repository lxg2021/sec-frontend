// wmiClassNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/features/attack/graph/interface";

/**
 * ClassAttributeItem
 * 表示类属性项
 */
export interface ClassAttributeItem {
  /** 属性名 */
  AttrName: string;

  /** 属性值 */
  AttrValue: string;

  /** 是否为 Base64 编码 */
  IsBase64: boolean;
}

/**
 * WmiClassNode
 * 表示 WMI 类节点
 */
export interface WmiClassNode {
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

  /** 类路径 */
  ClassPath: string;

  /** 父类名 */
  SuperClassName: string;

  /** WMI 属性列表 */
  WmiAttrs: ClassAttributeItem[];

  /** 唯一标识 ID */
  UniqueID: string;
}


/** wmiClassNode 节点配置 */
const wmiClassNodeConfig: NodeConfig<WmiClassNode> = {
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
  getLabel: (data) => "WmiClass",
  getImage: () => "/icons/nodes/wmi-class-node.svg",
};

export default wmiClassNodeConfig;
