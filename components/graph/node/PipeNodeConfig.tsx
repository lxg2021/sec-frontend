// pipeNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/components/graph/interface";

/**
 * PipeNode
 * 表示管道节点
 */
export interface PipeNode {
  /** 元素 ID (唯一标识) */
  ElementId: string;

  /** 启动时间 (ISO 8601 字符串) */
  BootTime: string;

  /** 代理 ID */
  AgentID: string;

  /** 节点时间 (ISO 8601 字符串) */
  Time: string;

  /** 管道名称 */
  PipeName: string;

  /** 对象哈希 */
  ObjHash: string;
}


/** pipe 节点配置 */
const pipeNodeConfig: NodeConfig<PipeNode> = {
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
  getLabel: (data) => data.PipeName,
  getImage: () => "/icons/nodes/pipe-node.svg",
};

export default pipeNodeConfig;
