// accountGroupNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/components/graph/interface";

/**
 * AccountGroupNode
 * 表示一个账户组节点
 */
export interface AccountGroupNode {
  /** 元素 ID (唯一标识) */
  ElementId: string;

  /** 启动时间 (ISO 8601 字符串) */
  BootTime: string;

  /** 代理 ID */
  AgentID: string;

  /** 记录时间 (ISO 8601 字符串) */
  Time: string;

  /** 组名 */
  GroupName: string;

  /** 组所属域名 */
  GroupDomainName: string;

  /** 组 SID */
  GroupSid: string;

  /** SAM 帐号名称 */
  SamAccountName: string;

  /** 对象哈希 */
  ObjHash: string;
}



/** accountGroupNode 节点配置 */
const accountGroupNodeConfig: NodeConfig<AccountGroupNode> = {
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
  getLabel: (data) => data.GroupName,
  getImage: () => "/icons/nodes/account-group-node.svg",
};

export default accountGroupNodeConfig;
