// impersonationTokenNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/components/graph/interface";

/**
 * Token
 * 表示一个进程或用户令牌信息
 */
export interface Token {
  /** 账户名称 */
  AccountName: string;

  /** 模拟级别 */
  ImpersonationLevel: string;

  /** 完整性级别 */
  IntegrityLevel: string;

  /** 权限列表（逗号分隔或字符串描述） */
  Privilege: string;

  /** 会话 ID */
  SessionID: number;

  /** 安全标识符 (SID) */
  SID: string;

  /** 令牌类型 */
  TokenType: string;
}

/**
 * ImpersonationTokenNode
 * 表示一个模仿令牌节点
 */
export interface ImpersonationTokenNode {
  /** 元素 ID (唯一标识) */
  ElementId: string;

  /** 启动时间 (ISO 8601 字符串) */
  BootTime: string;

  /** 代理 ID */
  AgentID: string;

  /** 节点时间 (ISO 8601 字符串) */
  Time: string;

  /** 操作员令牌信息 */
  OperatorTokenContext: Token;

  /** 目标令牌信息 */
  TargetTokenContext: Token;

  /** 令牌标志 */
  TokenFlag: number;

  /** 令牌标志描述 */
  TokenFlagDescription: string;

  /** 对象哈希 */
  ObjHash: string;
}

interface NodeData {
  label: string;
}

/** impersonationTokenNode 节点配置 */
const impersonationTokenNodeConfig: NodeConfig<NodeData> = {
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
  getImage: () => "/icons/nodes/impersonation-token-node.svg",
};

export default impersonationTokenNodeConfig;
