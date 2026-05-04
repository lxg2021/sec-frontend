// mbrNodeConfig.tsx
import React from "react";
import { NodeConfig } from "@/features/attack/graph/interface";

/**
 * MbrNode
 * 表示主引导记录 (MBR) 节点
 */
export interface MbrNode {
  /** 元素 ID (唯一标识) */
  ElementId: string;

  /** 启动时间 (ISO 8601 字符串) */
  BootTime: string;

  /** 代理 ID */
  AgentID: string;

  /** 节点时间 (ISO 8601 字符串) */
  Time: string;

  /** 物理名称 */
  PhysicalName: string;

  /** 驱动类型 */
  DriverType: number;

  /** 唯一标识 */
  UniqueID: string;
}


/** mbr 节点配置 */
const mbrNodeConfig: NodeConfig<MbrNode> = {
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
  getLabel: (data) => data.PhysicalName,
  getImage: () => "/icons/nodes/mbr-node.svg",
};

export default mbrNodeConfig;
