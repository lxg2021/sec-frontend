// fileMappingNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/features/attack/graph/interface";

/**
 * FileMappingNode
 * 表示一个文件映射节点
 */
export interface FileMappingNode {
  /** 元素 ID (唯一标识) */
  ElementId: string;

  /** 启动时间 (ISO 8601 字符串) */
  BootTime: string;

  /** 代理 ID */
  AgentID: string;

  /** 记录时间 (ISO 8601 字符串) */
  Time: string;

  /** 文件映射名称 */
  FileMappingName: string;

  /** 对象哈希 */
  ObjHash: string;
}

/** fileMapping 节点配置 */
const fileMappingNodeConfig: NodeConfig<FileMappingNode> = {
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
  getLabel: (data) => data.FileMappingName,
  getImage: () => "/icons/nodes/file-mapping-node.svg",
};

export default fileMappingNodeConfig;
