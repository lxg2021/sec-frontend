// accountNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/features/attack/graph/interface";

/**
 * AccountNode
 * 表示一个账户节点
 */
export interface AccountNode {
  /** 元素 ID (唯一标识) */
  ElementId: string;

  /** 启动时间 (ISO 8601 字符串) */
  BootTime: string;

  /** 代理 ID */
  AgentID: string;

  /** 记录时间 (ISO 8601 字符串) */
  Time: string;

  /** 用户名 */
  UserName: string;

  /** 域名 */
  DomainName: string;

  /** 用户 SID */
  Sid: string;

  /** SAM 帐号名称 */
  SamAccountName: string;

  /** 对象哈希 */
  ObjHash: string;
}


/** accountNode 节点配置 */
const accountNodeConfig: NodeConfig<AccountNode> = {
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
  getLabel: (data) => data.UserName,
  getImage: () => "/icons/nodes/account-node.svg",
};

export default accountNodeConfig;
