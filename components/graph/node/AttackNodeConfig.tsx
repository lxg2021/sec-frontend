// attackNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/components/graph/interface";

/**
 * AttackNode
 * 表示一个攻击节点
 */
export interface AttackNode {
  /** 元素 ID (唯一标识) */
  ElementId: string;

  /** 攻击 ID */
  ID: string;

  /** 攻击标题 */
  Title: string;

  /** 攻击状态 */
  Status: string;

  /** 作者 */
  Author: string;

  /** 日期 (ISO 8601 字符串) */
  Date: string;

  /** 攻击描述 */
  Description: string;

  /** 最后修改时间 (ISO 8601 字符串) */
  Modified: string;

  /** 参考文档列表 */
  References: string[];

  /** 攻击标签列表 */
  AttTags: string[];

  /** 攻击阶段 (可选) */
  Phases?: string[];

  /** 规则文件名 (可选) */
  RuleFile?: string;

  /** 条件列表 (可选) */
  Conditions?: string[];
}

/** attackNode 节点配置 */
const attackNodeConfig: NodeConfig<AttackNode> = {
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
  getLabel: (data) => data.Title,
  getImage: () => "/icons/nodes/attack-node.svg",
};

export default attackNodeConfig;
